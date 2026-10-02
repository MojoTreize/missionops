import { organisationSettingsInput } from "@missionops/contracts";
import { isRole, parseCsv, type Role } from "@missionops/core";
import {
  advances,
  budgetLines,
  exchangeRates,
  expenses,
  invitations,
  memberships,
  missions,
  organisations,
  subscriptions,
  withTenant,
  type Db,
} from "@missionops/db";
import { and, eq, gte, isNull, sql } from "drizzle-orm";

import { ServiceError, authorize, parse, tenant, type ServiceContext } from "./context";
import { createOrgLocation } from "./locations";
import { getOrganisation, listMembers } from "./organisation";

/**
 * Passage à l'échelle commerciale (Phase 9) : abonnement et places (B9.4),
 * paramétrage (B9.2), gestion des membres, imports (B9.3), console interne et
 * mesure de l'usage (B9.6, B9.7).
 */

// ------------------------------------------------- Abonnement (B9.4)

export const PLANS = {
  essai: { seats: 10, trialDays: 30 },
  essentiel: { seats: 25, trialDays: 0 },
  organisation: { seats: 200, trialDays: 0 },
} as const;

export type Plan = keyof typeof PLANS;

export function isPlan(value: string): value is Plan {
  return value in PLANS;
}

/** Démarre l'essai gratuit d'une organisation nouvellement créée. */
export async function startTrial(
  db: Db,
  organisationId: string,
  userId: string,
  now: Date,
): Promise<void> {
  await withTenant(db, { organisationId, actorId: userId }, async (tx) => {
    const existing = await (tx as Db)
      .select({ id: subscriptions.id })
      .from(subscriptions)
      .where(isNull(subscriptions.deletedAt))
      .limit(1);
    if (existing[0]) return;
    await (tx as Db).insert(subscriptions).values({
      organisationId,
      createdBy: userId,
      plan: "essai",
      status: "active",
      seats: PLANS.essai.seats,
      trialEndsOn: new Date(now.getTime() + PLANS.essai.trialDays * 86_400_000),
    });
  });
}

export interface SubscriptionView {
  plan: Plan;
  status: "active" | "suspendue" | "resiliee";
  seats: number;
  seatsUsed: number;
  trialEndsOn: Date | null;
  trialExpired: boolean;
}

async function seatsUsed(tx: Db, organisationId: string, now: Date): Promise<number> {
  const members = await tx
    .select({ n: sql<number>`count(*)::int` })
    .from(memberships)
    .where(and(eq(memberships.organisationId, organisationId), isNull(memberships.deletedAt)));
  const pending = await tx
    .select({ n: sql<number>`count(*)::int` })
    .from(invitations)
    .where(
      and(
        eq(invitations.organisationId, organisationId),
        isNull(invitations.acceptedAt),
        isNull(invitations.deletedAt),
        gte(invitations.expiresAt, now),
      ),
    );
  return (members[0]?.n ?? 0) + (pending[0]?.n ?? 0);
}

export async function getSubscription(db: Db, ctx: ServiceContext): Promise<SubscriptionView> {
  return tenant(db, ctx, async (tx) => {
    const row = (
      await tx.select().from(subscriptions).where(isNull(subscriptions.deletedAt)).limit(1)
    )[0];
    const used = await seatsUsed(tx, ctx.organisationId, ctx.now);
    if (!row) {
      // Organisations antérieures aux abonnements : plan « organisation ».
      return {
        plan: "organisation",
        status: "active",
        seats: PLANS.organisation.seats,
        seatsUsed: used,
        trialEndsOn: null,
        trialExpired: false,
      };
    }
    const plan = isPlan(row.plan) ? row.plan : "essai";
    return {
      plan,
      status: row.status as SubscriptionView["status"],
      seats: row.seats,
      seatsUsed: used,
      trialEndsOn: row.trialEndsOn,
      trialExpired: plan === "essai" && row.trialEndsOn !== null && row.trialEndsOn < ctx.now,
    };
  });
}

/** Refuse une invitation au-delà des places de l'abonnement. */
export async function assertSeatAvailable(db: Db, ctx: ServiceContext, extra = 1): Promise<void> {
  const sub = await getSubscription(db, ctx);
  if (sub.status !== "active") throw new ServiceError("plan_limit");
  if (sub.seatsUsed + extra > sub.seats) throw new ServiceError("plan_limit");
}

// --------------------------------------------- Paramétrage (B9.2, B5.2)

/**
 * Paramètres de l'organisation. La devise de base n'est modifiable qu'avant
 * toute écriture monétaire : changer la base après coup rendrait faux tous les
 * montants convertis et figés (ADR-002).
 */
export async function updateOrganisationSettings(
  db: Db,
  ctx: ServiceContext,
  input: unknown,
): Promise<void> {
  authorize(ctx, "update", "organisation");
  const value = parse(organisationSettingsInput, input);
  const org = await getOrganisation(db, ctx.organisationId);
  await tenant(db, ctx, async (tx) => {
    if (value.baseCurrency !== org.baseCurrency) {
      const counts = await Promise.all(
        [advances, expenses, budgetLines, exchangeRates].map((table) =>
          tx.select({ n: sql<number>`count(*)::int` }).from(table),
        ),
      );
      if (counts.some((c) => (c[0]?.n ?? 0) > 0)) throw new ServiceError("base_currency_locked");
    }
    const current = (
      await tx
        .select({ settings: organisations.settings })
        .from(organisations)
        .where(eq(organisations.id, ctx.organisationId))
    )[0]?.settings as Record<string, unknown> | undefined;
    const floor = value.varianceFloor?.trim();
    await tx
      .update(organisations)
      .set({
        name: value.name,
        baseCurrency: value.baseCurrency,
        timezone: value.timezone,
        settings: {
          ...(current ?? {}),
          ...(floor ? { varianceFloorMinor: floor } : {}),
          documentHeader: value.documentHeader,
          documentFooter: value.documentFooter,
          signatureLabels: value.signatureLabels,
        },
        updatedAt: ctx.now,
      })
      .where(eq(organisations.id, ctx.organisationId));
  });
}

// ----------------------------------------------------- Membres

/** Change le rôle d'un membre ; l'organisation garde au moins un administrateur. */
export async function changeMemberRole(
  db: Db,
  ctx: ServiceContext,
  userId: string,
  role: string,
): Promise<void> {
  authorize(ctx, "update", "member");
  if (!isRole(role)) throw new ServiceError("invalid_role");
  await tenant(db, ctx, async (tx) => {
    const members = await listMembers(tx, ctx.organisationId);
    const target = members.find((m) => m.userId === userId);
    if (!target) throw new ServiceError("not_member");
    if (
      target.role === "admin" &&
      role !== "admin" &&
      members.filter((m) => m.role === "admin").length <= 1
    ) {
      throw new ServiceError("last_admin");
    }
    await tx
      .update(memberships)
      .set({ role, updatedAt: ctx.now })
      .where(
        and(
          eq(memberships.organisationId, ctx.organisationId),
          eq(memberships.userId, userId),
          isNull(memberships.deletedAt),
        ),
      );
  });
}

/** Retire un membre (suppression logique de l'appartenance, ADR-005). */
export async function removeMember(db: Db, ctx: ServiceContext, userId: string): Promise<void> {
  authorize(ctx, "delete", "member");
  if (userId === ctx.actor.userId) throw new ServiceError("cannot_remove_self");
  await tenant(db, ctx, async (tx) => {
    const members = await listMembers(tx, ctx.organisationId);
    const target = members.find((m) => m.userId === userId);
    if (!target) throw new ServiceError("not_member");
    if (target.role === "admin" && members.filter((m) => m.role === "admin").length <= 1) {
      throw new ServiceError("last_admin");
    }
    await tx
      .update(memberships)
      .set({ deletedAt: ctx.now, updatedAt: ctx.now })
      .where(
        and(eq(memberships.organisationId, ctx.organisationId), eq(memberships.userId, userId)),
      );
  });
}

// --------------------------------------------------- Imports (B9.3)

export interface ImportReport {
  imported: number;
  errors: { line: number; code: string }[];
}

/** Importe des lieux d'organisation (colonnes : nom ; code_parent ; type). */
export async function importLocations(
  db: Db,
  ctx: ServiceContext,
  csv: string,
): Promise<ImportReport> {
  authorize(ctx, "create", "location");
  const table = parseCsv(csv, 500);
  const report: ImportReport = { imported: 0, errors: [] };
  for (const [index, row] of table.rows.entries()) {
    const name = row.nom ?? row.name ?? "";
    const parentCode = (row.code_parent ?? row.parent_code ?? row.parent ?? "").toUpperCase();
    const kind = row.type ?? row.kind ?? "site";
    try {
      await createOrgLocation(db, ctx, {
        name,
        parentCode,
        kind: ["site", "village", "autre"].includes(kind) ? kind : "autre",
      });
      report.imported += 1;
    } catch (error) {
      report.errors.push({
        line: index + 2,
        code: error instanceof ServiceError ? error.code : "import_invalid",
      });
    }
  }
  return report;
}

export interface MemberImportRow {
  line: number;
  email: string;
  role: Role;
}

/**
 * Prépare un import de membres (colonnes : email ; role). Les invitations sont
 * envoyées par l'appelant (e-mail) ; on vérifie ici le format et les places.
 */
export async function prepareMemberImport(
  db: Db,
  ctx: ServiceContext,
  csv: string,
): Promise<{ rows: MemberImportRow[]; errors: { line: number; code: string }[] }> {
  authorize(ctx, "create", "member");
  const table = parseCsv(csv, 500);
  const rows: MemberImportRow[] = [];
  const errors: { line: number; code: string }[] = [];
  const existing = new Set((await listMembers(db, ctx.organisationId)).map((m) => m.email));
  const seen = new Set<string>();
  for (const [index, row] of table.rows.entries()) {
    const email = (row.email ?? row.e_mail ?? row.courriel ?? "").toLowerCase();
    const role = (row.role ?? "collaborateur").toLowerCase();
    const line = index + 2;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push({ line, code: "invalid_input" });
    else if (!isRole(role)) errors.push({ line, code: "invalid_role" });
    else if (existing.has(email) || seen.has(email)) errors.push({ line, code: "duplicate" });
    else {
      seen.add(email);
      rows.push({ line, email, role });
    }
  }
  if (rows.length > 0) await assertSeatAvailable(db, ctx, rows.length);
  return { rows, errors };
}

// -------------------------------------- Console interne (B9.6, B9.7)

export interface OrganisationUsage {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
  members: number;
  plan: string;
  status: string;
  trialEndsOn: Date | null;
  missionsThisMonth: number;
  missionsClosed: number;
  closurePackShareBp: number | null;
  medianClosureDays: number | null;
  receiptCoverageBp: number | null;
}

/**
 * Indicateurs du plan (§12.3) pour chaque organisation. Chaque organisation
 * est lue dans son propre contexte isolé : la console n'outrepasse pas la RLS.
 */
export async function platformOverview(db: Db, now: Date): Promise<OrganisationUsage[]> {
  const orgs = await db
    .select()
    .from(organisations)
    .where(isNull(organisations.deletedAt))
    .orderBy(organisations.createdAt);
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const result: OrganisationUsage[] = [];
  for (const org of orgs) {
    const usage = await withTenant(db, { organisationId: org.id }, async (raw) => {
      const tx = raw as Db;
      const members = await tx
        .select({ n: sql<number>`count(*)::int` })
        .from(memberships)
        .where(and(eq(memberships.organisationId, org.id), isNull(memberships.deletedAt)));
      const sub = (
        await tx.select().from(subscriptions).where(isNull(subscriptions.deletedAt)).limit(1)
      )[0];
      const created = await tx
        .select({ n: sql<number>`count(*)::int` })
        .from(missions)
        .where(and(isNull(missions.deletedAt), gte(missions.createdAt, monthStart)));
      const closed = await tx
        .select({
          n: sql<number>`count(*)::int`,
          withPack: sql<number>`count(*) filter (where exists (select 1 from documents d where d.mission_id = "missions"."id" and d.kind = 'closure_pack'))::int`,
          median: sql<
            string | null
          >`(percentile_cont(0.5) within group (order by extract(epoch from (${missions.closedAt} - ${missions.finishedAt})) / 86400))::text`,
        })
        .from(missions)
        .where(and(eq(missions.status, "CLOTUREE"), isNull(missions.deletedAt)));
      const coverage = await tx
        .select({
          total: sql<number>`count(*)::int`,
          covered: sql<number>`count(*) filter (where exists (select 1 from receipts r where r.expense_id = "expenses"."id" and r.deleted_at is null) or "expenses"."category" = 'perdiem')::int`,
        })
        .from(expenses)
        .where(and(isNull(expenses.deletedAt), sql`${expenses.status} <> 'rejetee'`));
      const closedCount = closed[0]?.n ?? 0;
      const total = coverage[0]?.total ?? 0;
      return {
        members: members[0]?.n ?? 0,
        plan: sub?.plan ?? "organisation",
        status: sub?.status ?? "active",
        trialEndsOn: sub?.trialEndsOn ?? null,
        missionsThisMonth: created[0]?.n ?? 0,
        missionsClosed: closedCount,
        closurePackShareBp:
          closedCount === 0 ? null : Math.round(((closed[0]?.withPack ?? 0) * 10000) / closedCount),
        medianClosureDays:
          closed[0]?.median != null ? Math.round(Number(closed[0].median) * 10) / 10 : null,
        receiptCoverageBp:
          total === 0 ? null : Math.round(((coverage[0]?.covered ?? 0) * 10000) / total),
      };
    });
    result.push({ id: org.id, name: org.name, slug: org.slug, createdAt: org.createdAt, ...usage });
  }
  return result;
}

/** Suspend, réactive ou change le plan d'une organisation (console interne). */
export async function setSubscription(
  db: Db,
  organisationId: string,
  actorId: string,
  change: { status?: "active" | "suspendue"; plan?: Plan },
  now: Date,
): Promise<void> {
  await withTenant(db, { organisationId, actorId }, async (raw) => {
    const tx = raw as Db;
    const row = (
      await tx.select().from(subscriptions).where(isNull(subscriptions.deletedAt)).limit(1)
    )[0];
    const plan = change.plan ?? (row && isPlan(row.plan) ? row.plan : "organisation");
    const values = {
      status: change.status ?? row?.status ?? "active",
      plan,
      seats: PLANS[plan].seats,
      updatedAt: now,
      updatedBy: actorId,
    };
    if (row) {
      await tx.update(subscriptions).set(values).where(eq(subscriptions.id, row.id));
    } else {
      await tx.insert(subscriptions).values({ ...values, organisationId, createdBy: actorId });
    }
  });
}
