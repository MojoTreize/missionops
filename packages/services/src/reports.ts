import {
  EXPENSE_CATEGORIES,
  isExpenseCategory,
  money,
  parseRate,
  rateToString,
  toDecimalString,
  type Currency,
  type ExpenseCategory,
  type Money,
  type MissionStatus,
} from "@missionops/core";
import {
  advances,
  approvalSteps,
  approvals,
  auditLog,
  budgetLines,
  documents,
  exchangeRates,
  expenses,
  locations,
  memberships,
  missionEvents,
  missionParticipants,
  missionReports,
  missionStatusHistory,
  missions,
  notificationPreferences,
  receipts,
  reconciliations,
  users,
  varianceJustifications,
  type Db,
} from "@missionops/db";
import { and, desc, eq, gte, ilike, inArray, isNull, lt, lte, or, sql } from "drizzle-orm";

import { ServiceError, authorize, tenant, type ServiceContext } from "./context";
import { destinationLabel } from "./locations";
import { approvalQueue, listMissions, type MissionSummary } from "./missions";
import { getOrganisation } from "./organisation";

/**
 * Rapports, audit et exports (Phase 6). Tout est calculé en devise de base à
 * partir des montants convertis au taux figé de chaque ligne.
 */

// ------------------------------------------------- Journal d'audit (B6.1)

export interface AuditEntry {
  id: string;
  tableName: string;
  rowId: string;
  action: string;
  actorName: string | null;
  ip: string | null;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  changedFields: string[];
  loggedAt: Date;
}

export interface AuditFilters {
  table?: string;
  rowId?: string;
  actorId?: string;
  from?: string;
  to?: string;
  page?: number;
}

const AUDIT_PAGE = 50;
const IGNORED_FIELDS = new Set(["updated_at", "updated_by"]);

export async function auditLogPage(
  db: Db,
  ctx: ServiceContext,
  filters: AuditFilters = {},
): Promise<{ entries: AuditEntry[]; hasMore: boolean; tables: string[] }> {
  authorize(ctx, "read", "auditLog");
  return tenant(db, ctx, async (tx) => {
    const page = Math.max(filters.page ?? 0, 0);
    const conditions = [
      filters.table ? eq(auditLog.tableName, filters.table) : undefined,
      filters.rowId ? eq(auditLog.rowId, filters.rowId) : undefined,
      filters.actorId ? eq(auditLog.actorId, filters.actorId) : undefined,
      filters.from ? gte(auditLog.loggedAt, new Date(`${filters.from}T00:00:00Z`)) : undefined,
      filters.to
        ? lt(
            auditLog.loggedAt,
            new Date(new Date(`${filters.to}T00:00:00Z`).getTime() + 86_400_000),
          )
        : undefined,
    ];
    const rows = await tx
      .select({
        entry: auditLog,
        actorName: sql<string | null>`coalesce(${users.fullName}, ${users.email})`,
      })
      .from(auditLog)
      .leftJoin(users, eq(auditLog.actorId, users.id))
      .where(and(...conditions))
      .orderBy(desc(auditLog.loggedAt))
      .limit(AUDIT_PAGE + 1)
      .offset(page * AUDIT_PAGE);
    const tables = await tx
      .selectDistinct({ name: auditLog.tableName })
      .from(auditLog)
      .orderBy(auditLog.tableName);
    const entries = rows.slice(0, AUDIT_PAGE).map(({ entry, actorName }) => {
      const before = (entry.beforeData ?? null) as Record<string, unknown> | null;
      const after = (entry.afterData ?? null) as Record<string, unknown> | null;
      const keys = new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})]);
      const changedFields = [...keys].filter(
        (k) =>
          !IGNORED_FIELDS.has(k) &&
          JSON.stringify(before?.[k] ?? null) !== JSON.stringify(after?.[k] ?? null),
      );
      return {
        id: entry.id,
        tableName: entry.tableName,
        rowId: entry.rowId,
        action: entry.action,
        actorName,
        ip: entry.ip,
        before,
        after,
        changedFields,
        loggedAt: entry.loggedAt,
      };
    });
    return { entries, hasMore: rows.length > AUDIT_PAGE, tables: tables.map((t) => t.name) };
  });
}

// --------------------------------------------- Tableau de bord (B6.2)

export interface DashboardStats {
  byStatus: Record<MissionStatus, number>;
  onField: MissionSummary[];
  upcoming: MissionSummary[];
  myDrafts: MissionSummary[];
  approvalsWaiting: number;
  expensesToReview: number;
  reconciliationsToValidate: number;
  monthSpend: Money;
  monthAdvances: Money;
  receiptCoverageBp: number | null;
  medianClosureDays: number | null;
}

function isoDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export async function dashboard(db: Db, ctx: ServiceContext): Promise<DashboardStats> {
  const today = isoDay(ctx.now);
  const in14 = isoDay(new Date(ctx.now.getTime() + 14 * 86_400_000));
  const monthStart = `${today.slice(0, 7)}-01`;
  const [active, mine, queue, org] = await Promise.all([
    listMissions(db, ctx, { status: "actives" }),
    listMissions(db, ctx, { mine: true, status: "BROUILLON" }),
    ctx.actor.role === "collaborateur" ? Promise.resolve([]) : approvalQueue(db, ctx),
    getOrganisation(db, ctx.organisationId),
  ]);
  const base = org.baseCurrency;
  return tenant(db, ctx, async (tx) => {
    const statusRows = await tx
      .select({ status: missions.status, n: sql<number>`count(*)::int` })
      .from(missions)
      .where(and(isNull(missions.deletedAt), isNull(missions.archivedAt)))
      .groupBy(missions.status);
    const byStatus = Object.fromEntries(
      [
        "BROUILLON",
        "SOUMISE",
        "VALIDEE",
        "EN_COURS",
        "TERMINEE",
        "CLOTUREE",
        "REJETEE",
        "ANNULEE",
      ].map((s) => [s, statusRows.find((r) => r.status === s)?.n ?? 0]),
    ) as Record<MissionStatus, number>;
    const sum = async (
      table: typeof expenses | typeof advances,
      dateColumn: typeof expenses.spentOn | typeof advances.paidOn,
    ) => {
      const rows = await tx
        .select({ total: sql<string>`coalesce(sum(${table.amountBaseMinor}), 0)::text` })
        .from(table)
        .where(and(isNull(table.deletedAt), gte(dateColumn, monthStart), lte(dateColumn, today)));
      return BigInt(rows[0]?.total ?? "0");
    };
    const monthSpendRows = await tx
      .select({ total: sql<string>`coalesce(sum(${expenses.amountBaseMinor}), 0)::text` })
      .from(expenses)
      .where(
        and(
          isNull(expenses.deletedAt),
          sql`${expenses.status} <> 'rejetee'`,
          gte(expenses.spentOn, monthStart),
          lte(expenses.spentOn, today),
        ),
      );
    const monthAdvances = await sum(advances, advances.paidOn);
    const pending = await tx
      .select({ n: sql<number>`count(*)::int` })
      .from(expenses)
      .where(and(eq(expenses.status, "soumise"), isNull(expenses.deletedAt)));
    const recs = await tx
      .select({ n: sql<number>`count(*)::int` })
      .from(reconciliations)
      .where(and(eq(reconciliations.status, "soumise"), isNull(reconciliations.deletedAt)));
    const coverage = await tx
      .select({
        total: sql<number>`count(*)::int`,
        covered: sql<number>`count(*) filter (where exists (select 1 from receipts r where r.expense_id = "expenses"."id" and r.deleted_at is null) or "expenses"."category" = 'perdiem')::int`,
      })
      .from(expenses)
      .where(and(isNull(expenses.deletedAt), sql`${expenses.status} <> 'rejetee'`));
    const closure = await tx
      .select({
        median: sql<
          string | null
        >`percentile_cont(0.5) within group (order by extract(epoch from (${missions.closedAt} - ${missions.finishedAt})) / 86400)::text`,
      })
      .from(missions)
      .where(and(sql`${missions.closedAt} is not null`, sql`${missions.finishedAt} is not null`));
    const total = coverage[0]?.total ?? 0;
    const median = closure[0]?.median;
    return {
      byStatus,
      onField: active.filter((m) => m.status === "EN_COURS"),
      upcoming: active.filter(
        (m) => m.status === "VALIDEE" && m.startDate >= today && m.startDate <= in14,
      ),
      myDrafts: mine,
      approvalsWaiting: queue.length,
      expensesToReview:
        ctx.actor.role === "finance" || ctx.actor.role === "admin" ? (pending[0]?.n ?? 0) : 0,
      reconciliationsToValidate:
        ctx.actor.role === "finance" || ctx.actor.role === "admin" ? (recs[0]?.n ?? 0) : 0,
      monthSpend: money(BigInt(monthSpendRows[0]?.total ?? "0"), base),
      monthAdvances: money(monthAdvances, base),
      receiptCoverageBp:
        total === 0 ? null : Math.round(((coverage[0]?.covered ?? 0) * 10000) / total),
      medianClosureDays: median != null ? Math.round(Number(median) * 10) / 10 : null,
    };
  });
}

// ------------------------------------------------ Rapports de coûts (B6.3)

export interface CostReport {
  from: string;
  to: string;
  base: string;
  total: Money;
  byCategory: { category: ExpenseCategory; amount: Money }[];
  byMonth: { month: string; amount: Money }[];
  byDestination: { destination: string; amount: Money; missions: number }[];
  byMission: {
    missionId: string;
    reference: string;
    title: string;
    budget: Money;
    actual: Money;
  }[];
}

export async function costReport(
  db: Db,
  ctx: ServiceContext,
  range: { from: string; to: string },
): Promise<CostReport> {
  authorize(ctx, "read", "report");
  const org = await getOrganisation(db, ctx.organisationId);
  const base = org.baseCurrency;
  return tenant(db, ctx, async (tx) => {
    const where = and(
      isNull(expenses.deletedAt),
      eq(expenses.status, "approuvee"),
      gte(expenses.spentOn, range.from),
      lte(expenses.spentOn, range.to),
    );
    const byCategoryRows = await tx
      .select({
        category: expenses.category,
        total: sql<string>`sum(${expenses.amountBaseMinor})::text`,
      })
      .from(expenses)
      .where(where)
      .groupBy(expenses.category);
    const byMonthRows = await tx
      .select({
        month: sql<string>`to_char(${expenses.spentOn}, 'YYYY-MM')`,
        total: sql<string>`sum(${expenses.amountBaseMinor})::text`,
      })
      .from(expenses)
      .where(where)
      .groupBy(sql`1`)
      .orderBy(sql`1`);
    const byMissionRows = await tx
      .select({
        missionId: missions.id,
        reference: missions.reference,
        title: missions.title,
        destinationCode: missions.destinationCode,
        destinationLocationId: missions.destinationLocationId,
        total: sql<string>`sum(${expenses.amountBaseMinor})::text`,
      })
      .from(expenses)
      .innerJoin(missions, eq(expenses.missionId, missions.id))
      .where(where)
      .groupBy(missions.id)
      .orderBy(desc(sql`sum(${expenses.amountBaseMinor})`));
    const missionIds = byMissionRows.map((r) => r.missionId);
    const budgets =
      missionIds.length === 0
        ? []
        : await tx
            .select({
              missionId: budgetLines.missionId,
              total: sql<string>`sum(${budgetLines.totalBaseMinor})::text`,
            })
            .from(budgetLines)
            .where(and(inArray(budgetLines.missionId, missionIds), isNull(budgetLines.deletedAt)))
            .groupBy(budgetLines.missionId);
    const destinations = new Map<string, { amount: bigint; missions: number }>();
    for (const row of byMissionRows) {
      const label = await destinationLabel(tx, row);
      const current = destinations.get(label) ?? { amount: 0n, missions: 0 };
      destinations.set(label, {
        amount: current.amount + BigInt(row.total),
        missions: current.missions + 1,
      });
    }
    const total = byCategoryRows.reduce((acc, r) => acc + BigInt(r.total), 0n);
    return {
      ...range,
      base,
      total: money(total, base),
      byCategory: EXPENSE_CATEGORIES.map((category) => ({
        category,
        amount: money(
          BigInt(byCategoryRows.find((r) => r.category === category)?.total ?? "0"),
          base,
        ),
      })).filter((r) => r.amount.amountMinor !== 0n),
      byMonth: byMonthRows.map((r) => ({ month: r.month, amount: money(BigInt(r.total), base) })),
      byDestination: [...destinations.entries()]
        .map(([destination, v]) => ({
          destination,
          amount: money(v.amount, base),
          missions: v.missions,
        }))
        .sort((a, b) => (b.amount.amountMinor > a.amount.amountMinor ? 1 : -1)),
      byMission: byMissionRows.map((r) => ({
        missionId: r.missionId,
        reference: r.reference,
        title: r.title,
        actual: money(BigInt(r.total), base),
        budget: money(BigInt(budgets.find((b) => b.missionId === r.missionId)?.total ?? "0"), base),
      })),
    };
  });
}

// ----------------------------------------- Export comptable (B6.4)

function csvCell(value: string): string {
  return /[";\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export function toCsv(header: string[], rows: string[][], separator = ";"): string {
  // BOM UTF-8 : Excel ouvre correctement les accents.
  return `\uFEFF${[header, ...rows].map((r) => r.map(csvCell).join(separator)).join("\r\n")}\r\n`;
}

/**
 * Export des dépenses et avances pour la comptabilité et le bailleur : une
 * ligne par écriture, montant d'origine, taux figé, montant en devise de base.
 */
export async function accountingExport(
  db: Db,
  ctx: ServiceContext,
  range: { from: string; to: string },
  labels: { category: (c: string) => string; headers: string[] },
): Promise<string> {
  authorize(ctx, "export", "expense");
  const org = await getOrganisation(db, ctx.organisationId);
  return tenant(db, ctx, async (tx) => {
    const expenseRows = await tx
      .select({
        e: expenses,
        reference: missions.reference,
        spender: sql<string>`coalesce(${users.fullName}, ${users.email})`,
        receiptCount: sql<number>`(select count(*)::int from receipts r where r.expense_id = "expenses"."id" and r.deleted_at is null)`,
      })
      .from(expenses)
      .innerJoin(missions, eq(expenses.missionId, missions.id))
      .innerJoin(users, eq(expenses.createdBy, users.id))
      .where(
        and(
          isNull(expenses.deletedAt),
          eq(expenses.status, "approuvee"),
          gte(expenses.spentOn, range.from),
          lte(expenses.spentOn, range.to),
        ),
      )
      .orderBy(expenses.spentOn);
    const advanceRows = await tx
      .select({
        a: advances,
        reference: missions.reference,
        beneficiary: sql<string>`coalesce(${users.fullName}, ${users.email})`,
      })
      .from(advances)
      .innerJoin(missions, eq(advances.missionId, missions.id))
      .innerJoin(users, eq(advances.beneficiaryId, users.id))
      .where(
        and(
          isNull(advances.deletedAt),
          gte(advances.paidOn, range.from),
          lte(advances.paidOn, range.to),
        ),
      )
      .orderBy(advances.paidOn);
    const rows: string[][] = [
      ...expenseRows.map(({ e, reference, spender, receiptCount }) => [
        e.spentOn,
        "depense",
        reference,
        labels.category(e.category),
        e.description,
        spender,
        toDecimalString(money(e.amountMinor, e.amountCurrency as "GNF")),
        e.amountCurrency,
        rateToString(parseRate(e.fxRateToBase, e.amountCurrency as Currency, org.baseCurrency)),
        e.fxRateDate,
        toDecimalString(money(e.amountBaseMinor, org.baseCurrency)),
        org.baseCurrency,
        String(receiptCount),
        e.id,
      ]),
      ...advanceRows.map(({ a, reference, beneficiary }) => [
        a.paidOn,
        a.reversesId ? "avance_annulation" : "avance",
        reference,
        "",
        [a.paymentMethod, a.reference].filter(Boolean).join(" "),
        beneficiary,
        toDecimalString(money(a.amountMinor, a.amountCurrency as "GNF")),
        a.amountCurrency,
        rateToString(parseRate(a.fxRateToBase, a.amountCurrency as Currency, org.baseCurrency)),
        a.fxRateDate,
        toDecimalString(money(a.amountBaseMinor, org.baseCurrency)),
        org.baseCurrency,
        "",
        a.id,
      ]),
    ].sort((x, y) => (x[0]! < y[0]! ? -1 : x[0]! > y[0]! ? 1 : 0));
    return toCsv(labels.headers, rows);
  });
}

// ------------------------------------------------ Recherche globale (B6.5)

export interface SearchHit {
  type: "mission" | "expense" | "member";
  id: string;
  title: string;
  subtitle: string;
  href: string;
}

export async function globalSearch(db: Db, ctx: ServiceContext, raw: string): Promise<SearchHit[]> {
  const q = raw.trim().slice(0, 80);
  if (q.length < 2) return [];
  const pattern = `%${q.replace(/[%_\\]/g, "")}%`;
  const missionHits = (await listMissions(db, ctx, { q, limit: 8 })).map((m) => ({
    type: "mission" as const,
    id: m.id,
    title: `${m.reference} — ${m.title}`,
    subtitle: m.destination,
    href: `/missions/${m.id}`,
  }));
  return tenant(db, ctx, async (tx) => {
    const expenseRows = await tx
      .select({
        id: expenses.id,
        description: expenses.description,
        missionId: expenses.missionId,
        reference: missions.reference,
      })
      .from(expenses)
      .innerJoin(missions, eq(expenses.missionId, missions.id))
      .where(
        and(
          isNull(expenses.deletedAt),
          ilike(expenses.description, pattern),
          ctx.actor.role === "collaborateur" ? eq(expenses.createdBy, ctx.actor.userId) : undefined,
        ),
      )
      .limit(6);
    const memberRows = await tx
      .select({
        id: users.id,
        fullName: users.fullName,
        email: users.email,
        role: memberships.role,
      })
      .from(memberships)
      .innerJoin(users, eq(memberships.userId, users.id))
      .where(
        and(
          eq(memberships.organisationId, ctx.organisationId),
          isNull(memberships.deletedAt),
          or(ilike(users.fullName, pattern), ilike(users.email, pattern)),
        ),
      )
      .limit(6);
    return [
      ...missionHits,
      ...expenseRows.map((e) => ({
        type: "expense" as const,
        id: e.id,
        title: e.description,
        subtitle: e.reference,
        href: `/missions/${e.missionId}`,
      })),
      ...memberRows.map((m) => ({
        type: "member" as const,
        id: m.id,
        title: m.fullName ?? m.email,
        subtitle: m.email,
        href: "/organizations/members",
      })),
    ];
  });
}

// ---------------------------------------------------- Archivage (B6.6)

/**
 * Archive les missions clôturées ou annulées depuis plus de `olderThanDays`
 * jours : elles quittent les listes courantes et deviennent en lecture seule.
 * Rien n'est supprimé (ADR-005).
 */
export async function archiveMissions(
  db: Db,
  ctx: ServiceContext,
  olderThanDays = 180,
): Promise<number> {
  authorize(ctx, "update", "organisation");
  if (!Number.isInteger(olderThanDays) || olderThanDays < 30)
    throw new ServiceError("invalid_input");
  const limit = new Date(ctx.now.getTime() - olderThanDays * 86_400_000);
  return tenant(db, ctx, async (tx) => {
    const updated = await tx
      .update(missions)
      .set({ archivedAt: ctx.now, updatedAt: ctx.now, updatedBy: ctx.actor.userId })
      .where(
        and(
          isNull(missions.archivedAt),
          isNull(missions.deletedAt),
          or(
            and(eq(missions.status, "CLOTUREE"), lte(missions.closedAt, limit)),
            and(eq(missions.status, "ANNULEE"), lte(missions.cancelledAt, limit)),
          ),
        ),
      )
      .returning({ id: missions.id });
    return updated.length;
  });
}

// ------------------------------------------ Export intégral (B6.7)

/**
 * Export intégral des données de l'organisation (réversibilité) : toutes les
 * tables métier, lignes supprimées logiquement comprises, et le journal
 * d'audit. Format JSON, montants en chaînes (jamais de flottant).
 */
export async function organisationExport(db: Db, ctx: ServiceContext): Promise<string> {
  authorize(ctx, "export", "organisation");
  const org = await getOrganisation(db, ctx.organisationId);
  const data = await tenant(db, ctx, async (tx) => {
    const tables = {
      missions: await tx.select().from(missions),
      missionParticipants: await tx.select().from(missionParticipants),
      missionStatusHistory: await tx.select().from(missionStatusHistory),
      approvals: await tx.select().from(approvals),
      approvalSteps: await tx.select().from(approvalSteps),
      missionEvents: await tx.select().from(missionEvents),
      missionReports: await tx.select().from(missionReports),
      locations: await tx.select().from(locations),
      exchangeRates: await tx.select().from(exchangeRates),
      budgetLines: await tx.select().from(budgetLines),
      advances: await tx.select().from(advances),
      expenses: await tx.select().from(expenses),
      receipts: await tx.select().from(receipts),
      varianceJustifications: await tx.select().from(varianceJustifications),
      reconciliations: await tx.select().from(reconciliations),
      documents: await tx.select().from(documents),
      notificationPreferences: await tx.select().from(notificationPreferences),
      auditLog: await tx.select().from(auditLog),
    };
    const members = await tx
      .select({
        userId: users.id,
        email: users.email,
        fullName: users.fullName,
        role: memberships.role,
        joinedAt: memberships.createdAt,
        deletedAt: memberships.deletedAt,
      })
      .from(memberships)
      .innerJoin(users, eq(memberships.userId, users.id))
      .where(eq(memberships.organisationId, ctx.organisationId));
    return { ...tables, members };
  });
  return JSON.stringify(
    {
      format: "missionops-export",
      version: 1,
      exportedAt: ctx.now.toISOString(),
      organisation: { id: org.id, name: org.name, slug: org.slug, baseCurrency: org.baseCurrency },
      ...data,
    },
    (_, value) => (typeof value === "bigint" ? value.toString() : value),
    2,
  );
}

export function categoryOf(value: string): ExpenseCategory {
  return isExpenseCategory(value) ? value : "autre";
}
