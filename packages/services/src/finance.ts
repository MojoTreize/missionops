import { createHash } from "node:crypto";

import {
  advanceCancelInput,
  advanceInput,
  budgetLineInput,
  expenseDecisionInput,
  expenseInput,
  receiptMeta,
  reconciliationActionInput,
  settlementInput,
  varianceJustificationInput,
} from "@missionops/contracts";
import {
  EXPENSE_CATEGORIES,
  canDecideExpense,
  checkAdvance,
  checkExpense,
  checkSubmission,
  checkValidation,
  convert,
  isCurrency,
  isExpenseCategory,
  isMissionStatus,
  money,
  multiply,
  parseMoney,
  parseRate,
  rateToString,
  reconcile,
  totalsByCategory,
  trackBudget,
  transition,
  variancesToJustify,
  MissionTransitionError,
  type BudgetLine,
  type CategoryTracking,
  type Currency,
  type ExpenseCategory,
  type ExpenseStatus,
  type Money,
  type Reconciliation,
  type ReconciliationStatus,
  type Variance,
} from "@missionops/core";
import {
  advances,
  budgetLines,
  expenses,
  missionParticipants,
  missionStatusHistory,
  missions,
  receipts,
  reconciliations,
  users,
  varianceJustifications,
  type Db,
  type Mission,
} from "@missionops/db";
import { and, asc, desc, eq, inArray, isNull, sql } from "drizzle-orm";

import { ServiceError, authorize, first, parse, tenant, type ServiceContext } from "./context";
import { rateFor } from "./fx";
import { enqueue } from "./notifications";
import { getOrganisation, listMembers } from "./organisation";

// ------------------------------------------------------------- Helpers

async function missionById(tx: Db, ctx: ServiceContext, id: string): Promise<Mission> {
  const rows = await tx
    .select()
    .from(missions)
    .where(and(eq(missions.id, id), isNull(missions.deletedAt)))
    .limit(1);
  const mission = first(rows);
  if (ctx.actor.role === "collaborateur" && mission.requesterId !== ctx.actor.userId) {
    const participation = await tx
      .select({ id: missionParticipants.id })
      .from(missionParticipants)
      .where(
        and(
          eq(missionParticipants.missionId, id),
          eq(missionParticipants.userId, ctx.actor.userId),
          isNull(missionParticipants.deletedAt),
        ),
      )
      .limit(1);
    if (participation.length === 0) throw new ServiceError("not_found");
  }
  return mission;
}

function status(mission: Mission) {
  return isMissionStatus(mission.status) ? mission.status : "BROUILLON";
}

function currencyOf(value: string): Currency {
  return isCurrency(value) ? value : "GNF";
}

function assertNotLocked(mission: Mission) {
  if (mission.archivedAt || mission.status === "CLOTUREE" || mission.status === "ANNULEE") {
    throw new ServiceError("mission_locked");
  }
}

async function userNames(tx: Db, ids: string[]): Promise<Map<string, string>> {
  const unique = [...new Set(ids.filter(Boolean))];
  if (unique.length === 0) return new Map();
  const rows = await tx
    .select({ id: users.id, fullName: users.fullName, email: users.email })
    .from(users)
    .where(inArray(users.id, unique));
  return new Map(rows.map((r) => [r.id, r.fullName ?? r.email]));
}

// -------------------------------------------------------- Budget (B3.3)

export interface BudgetLineView {
  id: string;
  category: ExpenseCategory;
  label: string;
  quantity: number;
  unitAmount: Money;
  total: Money;
  totalBase: Money;
  rate: string;
  rateDate: string;
}

export async function listBudget(
  db: Db,
  ctx: ServiceContext,
  missionId: string,
): Promise<{ lines: BudgetLineView[]; totalBase: Money }> {
  authorize(ctx, "read", "mission");
  return tenant(db, ctx, async (tx) => {
    await missionById(tx, ctx, missionId);
    const org = await getOrganisation(tx, ctx.organisationId);
    const rows = await tx
      .select()
      .from(budgetLines)
      .where(and(eq(budgetLines.missionId, missionId), isNull(budgetLines.deletedAt)))
      .orderBy(asc(budgetLines.createdAt));
    const lines = rows.map((r) => {
      const unit = money(r.unitAmountMinor, currencyOf(r.unitAmountCurrency));
      return {
        id: r.id,
        category: (isExpenseCategory(r.category) ? r.category : "autre") as ExpenseCategory,
        label: r.label,
        quantity: r.quantity,
        unitAmount: unit,
        total: multiply(unit, r.quantity),
        totalBase: money(r.totalBaseMinor, org.baseCurrency),
        rate: rateToString(parseRate(r.fxRateToBase, unit.currency, org.baseCurrency)),
        rateDate: r.fxRateDate,
      };
    });
    const total = lines.reduce((acc, l) => acc + l.totalBase.amountMinor, 0n);
    return { lines, totalBase: money(total, org.baseCurrency) };
  });
}

export async function addBudgetLine(db: Db, ctx: ServiceContext, input: unknown): Promise<void> {
  authorize(ctx, "update", "mission");
  const value = parse(budgetLineInput, input);
  await tenant(db, ctx, async (tx) => {
    const mission = await missionById(tx, ctx, value.missionId);
    if (!["BROUILLON", "VALIDEE"].includes(mission.status)) {
      throw new ServiceError("budget_locked");
    }
    if (ctx.actor.role === "collaborateur" && mission.requesterId !== ctx.actor.userId) {
      throw new ServiceError("forbidden");
    }
    const org = await getOrganisation(tx, ctx.organisationId);
    let unit: Money;
    try {
      unit = parseMoney(value.unitAmount, value.currency);
    } catch {
      throw new ServiceError("invalid_input", { unitAmount: "invalid_amount" });
    }
    if (unit.amountMinor <= 0n) throw new ServiceError("invalid_input", { unitAmount: "amount" });
    const on = mission.startDate;
    const { rate, date } = await rateFor(tx, value.currency, org.baseCurrency, on, value.rate);
    const line: BudgetLine = {
      category: value.category,
      quantity: value.quantity,
      unitAmount: unit,
      rateToBase: rate,
    };
    const totalBase = convert(multiply(unit, value.quantity), rate);
    await tx.insert(budgetLines).values({
      organisationId: ctx.organisationId,
      createdBy: ctx.actor.userId,
      missionId: value.missionId,
      category: line.category,
      label: value.label,
      quantity: line.quantity,
      unitAmountMinor: unit.amountMinor,
      unitAmountCurrency: unit.currency,
      fxRateToBase: rateToString(rate),
      fxRateDate: date,
      totalBaseMinor: totalBase.amountMinor,
    });
    // Une mission validée dont le budget change repart en validation (B2.8).
    if (mission.status === "VALIDEE") {
      await revise(tx, ctx, mission, "Modification du budget");
    }
  });
}

async function revise(tx: Db, ctx: ServiceContext, mission: Mission, comment: string) {
  let record;
  try {
    record = transition({ status: status(mission), requesterId: mission.requesterId }, "revise", {
      actor: ctx.actor,
      now: ctx.now,
      comment,
      guards: { draftValid: true },
    });
  } catch (error) {
    if (error instanceof MissionTransitionError) throw new ServiceError(error.code);
    throw error;
  }
  await tx
    .update(missions)
    .set({
      status: record.to,
      submittedAt: ctx.now,
      updatedAt: ctx.now,
      updatedBy: ctx.actor.userId,
    })
    .where(and(eq(missions.id, mission.id), eq(missions.status, record.from)));
  await tx.insert(missionStatusHistory).values({
    organisationId: ctx.organisationId,
    createdBy: ctx.actor.userId,
    missionId: mission.id,
    fromStatus: record.from,
    toStatus: record.to,
    event: record.event,
    comment: record.comment,
  });
}

export async function removeBudgetLine(db: Db, ctx: ServiceContext, lineId: string): Promise<void> {
  authorize(ctx, "update", "mission");
  await tenant(db, ctx, async (tx) => {
    const rows = await tx
      .select()
      .from(budgetLines)
      .where(and(eq(budgetLines.id, lineId), isNull(budgetLines.deletedAt)))
      .limit(1);
    const line = first(rows);
    const mission = await missionById(tx, ctx, line.missionId);
    if (!["BROUILLON", "VALIDEE"].includes(mission.status)) {
      throw new ServiceError("budget_locked");
    }
    await tx
      .update(budgetLines)
      .set({ deletedAt: ctx.now, updatedAt: ctx.now, updatedBy: ctx.actor.userId })
      .where(eq(budgetLines.id, lineId));
    if (mission.status === "VALIDEE") await revise(tx, ctx, mission, "Modification du budget");
  });
}

// ------------------------------------------------------- Avances (B3.4)

export interface AdvanceView {
  id: string;
  beneficiaryName: string;
  amount: Money;
  amountBase: Money;
  rate: string;
  paidOn: string;
  paymentMethod: string;
  reference: string | null;
  note: string | null;
  isReversal: boolean;
  cancelled: boolean;
  createdAt: Date;
}

export async function listAdvances(
  db: Db,
  ctx: ServiceContext,
  missionId: string,
): Promise<{ items: AdvanceView[]; totalBase: Money }> {
  authorize(ctx, "read", "mission");
  return tenant(db, ctx, async (tx) => {
    await missionById(tx, ctx, missionId);
    const org = await getOrganisation(tx, ctx.organisationId);
    const rows = await tx
      .select()
      .from(advances)
      .where(and(eq(advances.missionId, missionId), isNull(advances.deletedAt)))
      .orderBy(asc(advances.createdAt));
    const nameMap = await userNames(
      tx,
      rows.map((r) => r.beneficiaryId),
    );
    const items = rows.map((r) => {
      const amount = money(r.amountMinor, currencyOf(r.amountCurrency));
      return {
        id: r.id,
        beneficiaryName: nameMap.get(r.beneficiaryId) ?? "—",
        amount,
        amountBase: money(r.amountBaseMinor, org.baseCurrency),
        rate: rateToString(parseRate(r.fxRateToBase, amount.currency, org.baseCurrency)),
        paidOn: r.paidOn,
        paymentMethod: r.paymentMethod,
        reference: r.reference,
        note: r.note,
        isReversal: r.reversesId !== null,
        cancelled: r.cancelledAt !== null,
        createdAt: r.createdAt,
      };
    });
    const total = rows.reduce((acc, r) => acc + r.amountBaseMinor, 0n);
    return { items, totalBase: money(total, org.baseCurrency) };
  });
}

export async function createAdvance(db: Db, ctx: ServiceContext, input: unknown): Promise<string> {
  authorize(ctx, "create", "advance");
  const value = parse(advanceInput, input);
  return tenant(db, ctx, async (tx) => {
    const mission = await missionById(tx, ctx, value.missionId);
    assertNotLocked(mission);
    const org = await getOrganisation(tx, ctx.organisationId);
    let amount: Money;
    try {
      amount = parseMoney(value.amount, value.currency);
    } catch {
      throw new ServiceError("invalid_input", { amount: "invalid_amount" });
    }
    const { rate, date } = await rateFor(tx, amount.currency, org.baseCurrency, value.paidOn);
    const amountBase = convert(amount, rate);
    const existing = await tx
      .select({ total: sql<string>`coalesce(sum(${advances.amountBaseMinor}), 0)::text` })
      .from(advances)
      .where(and(eq(advances.missionId, mission.id), isNull(advances.deletedAt)));
    const budget = await tx
      .select({ total: sql<string>`coalesce(sum(${budgetLines.totalBaseMinor}), 0)::text` })
      .from(budgetLines)
      .where(and(eq(budgetLines.missionId, mission.id), isNull(budgetLines.deletedAt)));
    const issues = checkAdvance({
      missionStatus: status(mission),
      amountBase,
      existingBase: money(BigInt(existing[0]?.total ?? "0"), org.baseCurrency),
      budgetBase: money(BigInt(budget[0]?.total ?? "0"), org.baseCurrency),
      // Seul le Directeur pays (ou l'admin) peut lever le plafond de 120 %.
      directorApproved:
        value.directorApproved &&
        (ctx.actor.role === "directeur_pays" || ctx.actor.role === "admin"),
    });
    if (issues.length > 0) throw new ServiceError(issues[0]!);
    const members = await listMembers(tx, ctx.organisationId);
    if (!members.some((m) => m.userId === value.beneficiaryId))
      throw new ServiceError("not_member");
    const inserted = await tx
      .insert(advances)
      .values({
        organisationId: ctx.organisationId,
        createdBy: ctx.actor.userId,
        missionId: mission.id,
        beneficiaryId: value.beneficiaryId,
        amountMinor: amount.amountMinor,
        amountCurrency: amount.currency,
        fxRateToBase: rateToString(rate),
        fxRateDate: date,
        amountBaseMinor: amountBase.amountMinor,
        paidOn: value.paidOn,
        paymentMethod: value.paymentMethod,
        reference: value.reference,
        note: value.note,
        directorApproved: value.directorApproved,
      })
      .returning({ id: advances.id });
    await enqueue(tx, ctx, [
      {
        recipientId: value.beneficiaryId,
        template: "advance_paid",
        payload: {
          missionId: mission.id,
          reference: mission.reference,
          amount: amount.amountMinor.toString(),
          currency: amount.currency,
        },
        dedupeKey: `advance:${inserted[0]!.id}`,
      },
    ]);
    return inserted[0]!.id;
  });
}

/** Annule une avance par une écriture inverse (jamais de modification). */
export async function cancelAdvance(db: Db, ctx: ServiceContext, input: unknown): Promise<void> {
  authorize(ctx, "update", "advance");
  const value = parse(advanceCancelInput, input);
  await tenant(db, ctx, async (tx) => {
    const rows = await tx
      .select()
      .from(advances)
      .where(and(eq(advances.id, value.advanceId), isNull(advances.deletedAt)))
      .limit(1);
    const original = first(rows);
    if (original.reversesId || original.cancelledAt) throw new ServiceError("already_cancelled");
    const mission = await missionById(tx, ctx, original.missionId);
    assertNotLocked(mission);
    await tx.insert(advances).values({
      organisationId: ctx.organisationId,
      createdBy: ctx.actor.userId,
      missionId: original.missionId,
      beneficiaryId: original.beneficiaryId,
      amountMinor: -original.amountMinor,
      amountCurrency: original.amountCurrency,
      fxRateToBase: original.fxRateToBase,
      fxRateDate: original.fxRateDate,
      amountBaseMinor: -original.amountBaseMinor,
      paidOn: original.paidOn,
      paymentMethod: original.paymentMethod,
      reference: original.reference,
      note: value.reason,
      reversesId: original.id,
    });
    await tx
      .update(advances)
      .set({ cancelledAt: ctx.now, updatedAt: ctx.now, updatedBy: ctx.actor.userId })
      .where(eq(advances.id, original.id));
  });
}

// ------------------------------------------------------ Dépenses (B3.5)

export interface ExpenseView {
  id: string;
  missionId: string;
  missionReference: string;
  spentByName: string;
  spentBy: string;
  category: ExpenseCategory;
  description: string;
  amount: Money;
  amountBase: Money;
  rate: string;
  spentOn: string;
  status: ExpenseStatus;
  outOfPeriod: boolean;
  receiptMissingReason: string | null;
  receiptIds: string[];
  rejectionReason: string | null;
  createdOffline: boolean;
  createdAt: Date;
}

export interface ExpenseFilters {
  missionId?: string;
  status?: ExpenseStatus;
  mine?: boolean;
  limit?: number;
}

export async function listExpenses(
  db: Db,
  ctx: ServiceContext,
  filters: ExpenseFilters = {},
): Promise<ExpenseView[]> {
  authorize(ctx, "read", "expense");
  return tenant(db, ctx, async (tx) => {
    if (filters.missionId) await missionById(tx, ctx, filters.missionId);
    const org = await getOrganisation(tx, ctx.organisationId);
    const onlyMine = filters.mine || ctx.actor.role === "collaborateur";
    const rows = await tx
      .select({ expense: expenses, reference: missions.reference })
      .from(expenses)
      .innerJoin(missions, eq(expenses.missionId, missions.id))
      .where(
        and(
          isNull(expenses.deletedAt),
          filters.missionId ? eq(expenses.missionId, filters.missionId) : undefined,
          filters.status ? eq(expenses.status, filters.status) : undefined,
          onlyMine && !filters.missionId ? eq(expenses.createdBy, ctx.actor.userId) : undefined,
        ),
      )
      .orderBy(desc(expenses.spentOn), desc(expenses.createdAt))
      .limit(filters.limit ?? 300);
    const ids = rows.map((r) => r.expense.id);
    const receiptRows =
      ids.length === 0
        ? []
        : await tx
            .select({ id: receipts.id, expenseId: receipts.expenseId })
            .from(receipts)
            .where(and(inArray(receipts.expenseId, ids), isNull(receipts.deletedAt)));
    const nameMap = await userNames(
      tx,
      rows.map((r) => r.expense.createdBy),
    );
    return rows.map(({ expense: e, reference }) => {
      const amount = money(e.amountMinor, currencyOf(e.amountCurrency));
      return {
        id: e.id,
        missionId: e.missionId,
        missionReference: reference,
        spentBy: e.createdBy,
        spentByName: nameMap.get(e.createdBy) ?? "—",
        category: (isExpenseCategory(e.category) ? e.category : "autre") as ExpenseCategory,
        description: e.description,
        amount,
        amountBase: money(e.amountBaseMinor, org.baseCurrency),
        rate: rateToString(parseRate(e.fxRateToBase, amount.currency, org.baseCurrency)),
        spentOn: e.spentOn,
        status: e.status as ExpenseStatus,
        outOfPeriod: e.outOfPeriod,
        receiptMissingReason: e.receiptMissingReason,
        receiptIds: receiptRows.filter((r) => r.expenseId === e.id).map((r) => r.id),
        rejectionReason: e.rejectionReason,
        createdOffline: e.createdOffline,
        createdAt: e.createdAt,
      };
    });
  });
}

export type ExpenseCreation = { status: "created" | "duplicate"; id: string; warnings: string[] };

/**
 * Enregistre une dépense. Idempotent sur l'identifiant client (ADR-003) : une
 * dépense déjà reçue renvoie `duplicate` sans rien modifier.
 */
export async function createExpense(
  db: Db,
  ctx: ServiceContext,
  input: unknown,
  options: { offline?: boolean; hasReceipt?: boolean } = {},
): Promise<ExpenseCreation> {
  authorize(ctx, "create", "expense");
  const value = parse(expenseInput, input);
  return tenant(db, ctx, async (tx) => {
    const existing = await tx
      .select({ id: expenses.id })
      .from(expenses)
      .where(eq(expenses.id, value.id))
      .limit(1);
    if (existing[0]) return { status: "duplicate", id: value.id, warnings: [] };
    const mission = await missionById(tx, ctx, value.missionId);
    if (mission.archivedAt) throw new ServiceError("mission_locked");
    const org = await getOrganisation(tx, ctx.organisationId);
    let amount: Money;
    try {
      amount = parseMoney(value.amount, value.currency);
    } catch {
      throw new ServiceError("invalid_input", { amount: "invalid_amount" });
    }
    const check = checkExpense(
      {
        category: value.category,
        description: value.description,
        amount,
        spentOn: value.spentOn,
        hasReceipt: options.hasReceipt ?? false,
        receiptMissingReason: value.receiptMissingReason,
      },
      { status: status(mission), startDate: mission.startDate, endDate: mission.endDate },
    );
    // Le justificatif peut arriver juste après (photo envoyée séparément) :
    // l'absence de justificatif est contrôlée à la réconciliation.
    const blocking = check.issues.filter((i) => i !== "receipt_or_reason");
    if (blocking.length > 0) throw new ServiceError(blocking[0]!);
    const { rate, date } = await rateFor(tx, amount.currency, org.baseCurrency, value.spentOn);
    const reconciliation = await tx
      .select({ status: reconciliations.status })
      .from(reconciliations)
      .where(and(eq(reconciliations.missionId, mission.id), isNull(reconciliations.deletedAt)))
      .limit(1);
    if (reconciliation[0] && reconciliation[0].status !== "ouverte") {
      throw new ServiceError("reconciliation_locked");
    }
    await tx.insert(expenses).values({
      id: value.id,
      organisationId: ctx.organisationId,
      createdBy: ctx.actor.userId,
      missionId: mission.id,
      category: value.category,
      description: value.description,
      amountMinor: amount.amountMinor,
      amountCurrency: amount.currency,
      fxRateToBase: rateToString(rate),
      fxRateDate: date,
      amountBaseMinor: convert(amount, rate).amountMinor,
      spentOn: value.spentOn,
      outOfPeriod: check.warnings.includes("out_of_period"),
      receiptMissingReason: value.receiptMissingReason,
      createdOffline: options.offline ?? false,
      clientCreatedAt: value.clientCreatedAt ? new Date(value.clientCreatedAt) : null,
    });
    return { status: "created", id: value.id, warnings: check.warnings };
  });
}

/** Validation financière d'une dépense (B3.10). */
export async function decideExpense(db: Db, ctx: ServiceContext, input: unknown): Promise<void> {
  authorize(ctx, "approve", "expense");
  const value = parse(expenseDecisionInput, input);
  if (value.decision === "rejetee" && !value.reason) throw new ServiceError("MOTIF_OBLIGATOIRE");
  await tenant(db, ctx, async (tx) => {
    const rows = await tx
      .select()
      .from(expenses)
      .where(and(eq(expenses.id, value.expenseId), isNull(expenses.deletedAt)))
      .limit(1);
    const expense = first(rows);
    if (!canDecideExpense(expense.status as ExpenseStatus)) throw new ServiceError("not_pending");
    if (expense.createdBy === ctx.actor.userId) throw new ServiceError("self_approval");
    await tx
      .update(expenses)
      .set({
        status: value.decision,
        decidedBy: ctx.actor.userId,
        decidedAt: ctx.now,
        rejectionReason: value.decision === "rejetee" ? value.reason : null,
        updatedAt: ctx.now,
        updatedBy: ctx.actor.userId,
      })
      .where(and(eq(expenses.id, expense.id), eq(expenses.status, "soumise")));
    if (value.decision === "rejetee") {
      await enqueue(tx, ctx, [
        {
          recipientId: expense.createdBy,
          template: "expense_rejected",
          payload: {
            missionId: expense.missionId,
            description: expense.description,
            reason: value.reason ?? "",
          },
          dedupeKey: `expense-rejected:${expense.id}`,
        },
      ]);
    }
  });
}

/** Justificatif précisé après coup (motif d'absence). */
export async function explainMissingReceipt(
  db: Db,
  ctx: ServiceContext,
  expenseId: string,
  reason: string,
): Promise<void> {
  authorize(ctx, "create", "expense");
  const trimmed = reason.trim();
  if (trimmed.length < 3) throw new ServiceError("invalid_input", { reason: "too_short" });
  await tenant(db, ctx, async (tx) => {
    const updated = await tx
      .update(expenses)
      .set({ receiptMissingReason: trimmed, updatedAt: ctx.now, updatedBy: ctx.actor.userId })
      .where(
        and(
          eq(expenses.id, expenseId),
          ctx.actor.role === "collaborateur" ? eq(expenses.createdBy, ctx.actor.userId) : undefined,
        ),
      )
      .returning({ id: expenses.id });
    if (updated.length === 0) throw new ServiceError("not_found");
  });
}

// --------------------------------------------------- Justificatifs (B3.6)

/** Stockage objet des fichiers (justificatifs, documents) — ADR-007. */
export interface BlobStore {
  put(key: string, bytes: Uint8Array, mimeType: string): Promise<void>;
  get(key: string): Promise<Uint8Array | null>;
}

export async function sha256Hex(bytes: Uint8Array): Promise<string> {
  return createHash("sha256").update(bytes).digest("hex");
}

/**
 * Enregistre un justificatif. Idempotent sur l'identifiant client ; la somme
 * de contrôle annoncée doit correspondre au fichier reçu.
 */
export async function attachReceipt(
  db: Db,
  ctx: ServiceContext,
  store: BlobStore,
  meta: unknown,
  bytes: Uint8Array,
): Promise<{ status: "created" | "duplicate"; id: string }> {
  authorize(ctx, "create", "receipt");
  const value = parse(receiptMeta, meta);
  if (bytes.byteLength !== value.sizeBytes) throw new ServiceError("size_mismatch");
  if ((await sha256Hex(bytes)) !== value.sha256) throw new ServiceError("checksum_mismatch");
  return tenant(db, ctx, async (tx) => {
    const existing = await tx
      .select({ id: receipts.id })
      .from(receipts)
      .where(eq(receipts.id, value.id))
      .limit(1);
    if (existing[0]) return { status: "duplicate", id: value.id };
    const expenseRows = await tx
      .select()
      .from(expenses)
      .where(and(eq(expenses.id, value.expenseId), isNull(expenses.deletedAt)))
      .limit(1);
    const expense = first(expenseRows);
    if (ctx.actor.role === "collaborateur" && expense.createdBy !== ctx.actor.userId) {
      throw new ServiceError("forbidden");
    }
    const key = `${ctx.organisationId}/receipts/${value.expenseId}/${value.id}`;
    await store.put(key, bytes, value.mimeType);
    await tx.insert(receipts).values({
      id: value.id,
      organisationId: ctx.organisationId,
      createdBy: ctx.actor.userId,
      expenseId: value.expenseId,
      storageKey: key,
      mimeType: value.mimeType,
      sizeBytes: value.sizeBytes,
      sha256: value.sha256,
      width: value.width ?? null,
      height: value.height ?? null,
    });
    return { status: "created", id: value.id };
  });
}

export async function readReceipt(
  db: Db,
  ctx: ServiceContext,
  store: BlobStore,
  receiptId: string,
): Promise<{ bytes: Uint8Array; mimeType: string }> {
  authorize(ctx, "read", "receipt");
  return tenant(db, ctx, async (tx) => {
    const rows = await tx
      .select({ receipt: receipts, spender: expenses.createdBy })
      .from(receipts)
      .innerJoin(expenses, eq(receipts.expenseId, expenses.id))
      .where(and(eq(receipts.id, receiptId), isNull(receipts.deletedAt)))
      .limit(1);
    const row = first(rows);
    if (ctx.actor.role === "collaborateur" && row.spender !== ctx.actor.userId) {
      throw new ServiceError("not_found");
    }
    const bytes = await store.get(row.receipt.storageKey);
    if (!bytes) throw new ServiceError("not_found");
    return { bytes, mimeType: row.receipt.mimeType };
  });
}

// ---------------------------------------------- Suivi et réconciliation

export interface ReconciliationView {
  missionId: string;
  missionStatus: string;
  baseCurrency: Currency;
  status: ReconciliationStatus;
  computed: Reconciliation;
  tracking: CategoryTracking[];
  variances: (Variance & { justification: string | null })[];
  issues: string[];
  submittedBy: string | null;
  submittedAt: Date | null;
  validatedBy: string | null;
  validatedAt: Date | null;
  settlement: { method: string | null; reference: string | null; settledOn: string | null };
  canSubmit: boolean;
  canValidate: boolean;
}

async function computeReconciliation(tx: Db, ctx: ServiceContext, mission: Mission) {
  const org = await getOrganisation(tx, ctx.organisationId);
  const base = org.baseCurrency;
  const [advanceRows, expenseRows, receiptRows, budgetRows, justificationRows, recRows] =
    await Promise.all([
      tx
        .select({ amountBaseMinor: advances.amountBaseMinor })
        .from(advances)
        .where(and(eq(advances.missionId, mission.id), isNull(advances.deletedAt))),
      tx
        .select()
        .from(expenses)
        .where(and(eq(expenses.missionId, mission.id), isNull(expenses.deletedAt))),
      tx
        .select({ expenseId: receipts.expenseId })
        .from(receipts)
        .innerJoin(expenses, eq(receipts.expenseId, expenses.id))
        .where(and(eq(expenses.missionId, mission.id), isNull(receipts.deletedAt))),
      tx
        .select()
        .from(budgetLines)
        .where(and(eq(budgetLines.missionId, mission.id), isNull(budgetLines.deletedAt))),
      tx
        .select()
        .from(varianceJustifications)
        .where(
          and(
            eq(varianceJustifications.missionId, mission.id),
            isNull(varianceJustifications.deletedAt),
          ),
        ),
      tx
        .select()
        .from(reconciliations)
        .where(and(eq(reconciliations.missionId, mission.id), isNull(reconciliations.deletedAt)))
        .limit(1),
    ]);
  const withReceipt = new Set(receiptRows.map((r) => r.expenseId));
  const entries = expenseRows.map((e) => ({
    id: e.id,
    category: (isExpenseCategory(e.category) ? e.category : "autre") as ExpenseCategory,
    status: e.status as ExpenseStatus,
    amountBase: money(e.amountBaseMinor, base),
    hasReceipt: withReceipt.has(e.id) || e.category === "perdiem",
    outOfPeriod: e.outOfPeriod,
  }));
  const computed = reconcile(
    advanceRows.map((a) => ({ amountBase: money(a.amountBaseMinor, base) })),
    entries,
    base,
  );
  const planned = new Map<ExpenseCategory, Money>();
  for (const line of budgetRows) {
    const category = (
      isExpenseCategory(line.category) ? line.category : "autre"
    ) as ExpenseCategory;
    const current = planned.get(category)?.amountMinor ?? 0n;
    planned.set(category, money(current + line.totalBaseMinor, base));
  }
  const actual = totalsByCategory(
    entries.filter((e) => e.status === "approuvee").map((e) => e),
    base,
  );
  const tracking = trackBudget(planned, actual, base);
  const justifications = new Map(justificationRows.map((j) => [j.category, j.justification]));
  const variances = variancesToJustify(tracking, org.settings.varianceFloorMinor).map((v) => ({
    ...v,
    justification: justifications.get(v.category) ?? null,
  }));
  const explained = new Set(expenseRows.filter((e) => e.receiptMissingReason).map((e) => e.id));
  const submission = {
    reconciliation: computed,
    variances,
    justifiedCategories: new Set(
      [...justifications.keys()].filter(isExpenseCategory) as ExpenseCategory[],
    ),
    explainedMissingReceipts: explained,
  };
  return { org, computed, tracking, variances, submission, row: recRows[0] ?? null };
}

/** Prévu contre réalisé par catégorie, en devise de base (B3.7). */
export async function budgetTracking(
  db: Db,
  ctx: ServiceContext,
  missionId: string,
): Promise<{ tracking: CategoryTracking[]; plannedTotal: Money; actualTotal: Money }> {
  authorize(ctx, "read", "mission");
  return tenant(db, ctx, async (tx) => {
    const mission = await missionById(tx, ctx, missionId);
    const { tracking, org } = await computeReconciliation(tx, ctx, mission);
    const plannedTotal = tracking.reduce((acc, t) => acc + t.planned.amountMinor, 0n);
    const actualTotal = tracking.reduce((acc, t) => acc + t.actual.amountMinor, 0n);
    return {
      tracking,
      plannedTotal: money(plannedTotal, org.baseCurrency),
      actualTotal: money(actualTotal, org.baseCurrency),
    };
  });
}

export async function getReconciliation(
  db: Db,
  ctx: ServiceContext,
  missionId: string,
): Promise<ReconciliationView> {
  authorize(ctx, "read", "mission");
  return tenant(db, ctx, async (tx) => {
    const mission = await missionById(tx, ctx, missionId);
    const { org, computed, tracking, variances, submission, row } = await computeReconciliation(
      tx,
      ctx,
      mission,
    );
    const recStatus = (row?.status ?? "ouverte") as ReconciliationStatus;
    const issues =
      recStatus === "soumise"
        ? checkValidation({
            ...submission,
            settlementRecorded: Boolean(row?.settledOn),
            submittedBy: row?.submittedBy ?? "",
            validatorId: ctx.actor.userId,
          })
        : checkSubmission(submission);
    const missionStatus = status(mission);
    const isOwner = mission.requesterId === ctx.actor.userId || ctx.actor.role !== "collaborateur";
    return {
      missionId,
      missionStatus,
      baseCurrency: org.baseCurrency,
      status: recStatus,
      computed,
      tracking,
      variances,
      issues,
      submittedBy: row?.submittedBy ?? null,
      submittedAt: row?.submittedAt ?? null,
      validatedBy: row?.validatedBy ?? null,
      validatedAt: row?.validatedAt ?? null,
      settlement: {
        method: row?.settlementMethod ?? null,
        reference: row?.settlementReference ?? null,
        settledOn: row?.settledOn ?? null,
      },
      canSubmit:
        isOwner && missionStatus === "TERMINEE" && recStatus === "ouverte" && issues.length === 0,
      canValidate:
        recStatus === "soumise" &&
        (ctx.actor.role === "finance" || ctx.actor.role === "admin") &&
        issues.length === 0,
    };
  });
}

/** Justification d'un écart budgétaire (B3.9). */
export async function justifyVariance(db: Db, ctx: ServiceContext, input: unknown): Promise<void> {
  authorize(ctx, "read", "mission");
  const value = parse(varianceJustificationInput, input);
  await tenant(db, ctx, async (tx) => {
    const mission = await missionById(tx, ctx, value.missionId);
    assertNotLocked(mission);
    const existing = await tx
      .select({ id: varianceJustifications.id })
      .from(varianceJustifications)
      .where(
        and(
          eq(varianceJustifications.missionId, value.missionId),
          eq(varianceJustifications.category, value.category),
          isNull(varianceJustifications.deletedAt),
        ),
      )
      .limit(1);
    if (existing[0]) {
      await tx
        .update(varianceJustifications)
        .set({
          justification: value.justification,
          updatedAt: ctx.now,
          updatedBy: ctx.actor.userId,
        })
        .where(eq(varianceJustifications.id, existing[0].id));
    } else {
      await tx.insert(varianceJustifications).values({
        organisationId: ctx.organisationId,
        createdBy: ctx.actor.userId,
        missionId: value.missionId,
        category: value.category,
        justification: value.justification,
      });
    }
  });
}

async function upsertReconciliation(
  tx: Db,
  ctx: ServiceContext,
  missionId: string,
  existing: { id: string } | null,
  values: Partial<typeof reconciliations.$inferInsert>,
  base: Currency,
) {
  if (existing) {
    await tx
      .update(reconciliations)
      .set({ ...values, updatedAt: ctx.now, updatedBy: ctx.actor.userId })
      .where(eq(reconciliations.id, existing.id));
  } else {
    await tx.insert(reconciliations).values({
      organisationId: ctx.organisationId,
      createdBy: ctx.actor.userId,
      missionId,
      baseCurrency: base,
      ...values,
    });
  }
}

/** Soumet la réconciliation à la finance (B3.8). Totaux figés. */
export async function submitReconciliation(
  db: Db,
  ctx: ServiceContext,
  input: unknown,
): Promise<void> {
  authorize(ctx, "read", "mission");
  const value = parse(reconciliationActionInput, input);
  await tenant(db, ctx, async (tx) => {
    const mission = await missionById(tx, ctx, value.missionId);
    if (mission.status !== "TERMINEE") throw new ServiceError("mission_not_finished");
    const { org, computed, submission, row } = await computeReconciliation(tx, ctx, mission);
    if (row && row.status !== "ouverte") throw new ServiceError("already_submitted");
    const issues = checkSubmission(submission);
    if (issues.length > 0) throw new ServiceError(issues[0]!);
    await upsertReconciliation(
      tx,
      ctx,
      mission.id,
      row,
      {
        status: "soumise",
        advancesBaseMinor: computed.advances.amountMinor,
        expensesBaseMinor: computed.approvedExpenses.amountMinor,
        balanceBaseMinor: computed.balance.amountMinor,
        submittedBy: ctx.actor.userId,
        submittedAt: ctx.now,
        comment: value.comment,
      },
      org.baseCurrency,
    );
    const finance = await listMembers(tx, ctx.organisationId, "finance");
    await enqueue(
      tx,
      ctx,
      finance.map((m) => ({
        recipientId: m.userId,
        template: "reconciliation_submitted" as const,
        payload: { missionId: mission.id, reference: mission.reference },
        dedupeKey: `rec-submitted:${mission.id}:${ctx.now.getTime()}`,
      })),
    );
  });
}

/** Enregistre le règlement du solde (reversement ou remboursement). */
export async function recordSettlement(db: Db, ctx: ServiceContext, input: unknown): Promise<void> {
  authorize(ctx, "approve", "expense");
  const value = parse(settlementInput, input);
  await tenant(db, ctx, async (tx) => {
    const mission = await missionById(tx, ctx, value.missionId);
    const { org, row } = await computeReconciliation(tx, ctx, mission);
    if (!row || row.status !== "soumise") throw new ServiceError("not_submitted");
    await upsertReconciliation(
      tx,
      ctx,
      mission.id,
      row,
      {
        settlementMethod: value.method,
        settlementReference: value.reference,
        settledOn: value.settledOn,
      },
      org.baseCurrency,
    );
  });
}

/** Renvoie la réconciliation au demandeur pour correction. */
export async function reopenReconciliation(
  db: Db,
  ctx: ServiceContext,
  input: unknown,
): Promise<void> {
  authorize(ctx, "approve", "expense");
  const value = parse(reconciliationActionInput, input);
  await tenant(db, ctx, async (tx) => {
    const mission = await missionById(tx, ctx, value.missionId);
    const { org, row } = await computeReconciliation(tx, ctx, mission);
    if (!row || row.status !== "soumise") throw new ServiceError("not_submitted");
    await upsertReconciliation(
      tx,
      ctx,
      mission.id,
      row,
      { status: "ouverte", comment: value.comment },
      org.baseCurrency,
    );
  });
}

/**
 * Validation financière (B3.10) : fige les totaux, puis clôture la mission par
 * la machine à états (transition `close`).
 */
export async function validateReconciliation(
  db: Db,
  ctx: ServiceContext,
  input: unknown,
): Promise<void> {
  authorize(ctx, "approve", "expense");
  const value = parse(reconciliationActionInput, input);
  await tenant(db, ctx, async (tx) => {
    const mission = await missionById(tx, ctx, value.missionId);
    const { org, computed, submission, row } = await computeReconciliation(tx, ctx, mission);
    if (!row || row.status !== "soumise") throw new ServiceError("not_submitted");
    const issues = checkValidation({
      ...submission,
      settlementRecorded: Boolean(row.settledOn),
      submittedBy: row.submittedBy ?? "",
      validatorId: ctx.actor.userId,
    });
    if (issues.length > 0) throw new ServiceError(issues[0]!);
    let record;
    try {
      record = transition({ status: status(mission), requesterId: mission.requesterId }, "close", {
        actor: ctx.actor,
        now: ctx.now,
        comment: value.comment,
        guards: { reconciliationValidated: true },
      });
    } catch (error) {
      if (error instanceof MissionTransitionError) throw new ServiceError(error.code);
      throw error;
    }
    await upsertReconciliation(
      tx,
      ctx,
      mission.id,
      row,
      {
        status: "validee",
        advancesBaseMinor: computed.advances.amountMinor,
        expensesBaseMinor: computed.approvedExpenses.amountMinor,
        balanceBaseMinor: computed.balance.amountMinor,
        validatedBy: ctx.actor.userId,
        validatedAt: ctx.now,
      },
      org.baseCurrency,
    );
    await tx
      .update(missions)
      .set({
        status: record.to,
        closedAt: ctx.now,
        updatedAt: ctx.now,
        updatedBy: ctx.actor.userId,
      })
      .where(and(eq(missions.id, mission.id), eq(missions.status, record.from)));
    await tx.insert(missionStatusHistory).values({
      organisationId: ctx.organisationId,
      createdBy: ctx.actor.userId,
      missionId: mission.id,
      fromStatus: record.from,
      toStatus: record.to,
      event: record.event,
      comment: record.comment,
    });
    await enqueue(tx, ctx, [
      {
        recipientId: mission.requesterId,
        template: "reconciliation_validated",
        payload: { missionId: mission.id, reference: mission.reference },
        dedupeKey: `rec-validated:${mission.id}`,
      },
    ]);
  });
}

/** File de la finance : réconciliations soumises et dépenses à valider. */
export async function financeQueue(
  db: Db,
  ctx: ServiceContext,
): Promise<{
  reconciliations: {
    missionId: string;
    reference: string;
    title: string;
    balance: Money;
    submittedAt: Date | null;
  }[];
  pendingExpenses: number;
}> {
  authorize(ctx, "approve", "expense");
  return tenant(db, ctx, async (tx) => {
    const org = await getOrganisation(tx, ctx.organisationId);
    const rows = await tx
      .select({
        missionId: missions.id,
        reference: missions.reference,
        title: missions.title,
        balance: reconciliations.balanceBaseMinor,
        submittedAt: reconciliations.submittedAt,
      })
      .from(reconciliations)
      .innerJoin(missions, eq(reconciliations.missionId, missions.id))
      .where(and(eq(reconciliations.status, "soumise"), isNull(reconciliations.deletedAt)))
      .orderBy(asc(reconciliations.submittedAt));
    const pending = await tx
      .select({ n: sql<number>`count(*)::int` })
      .from(expenses)
      .where(and(eq(expenses.status, "soumise"), isNull(expenses.deletedAt)));
    return {
      reconciliations: rows.map((r) => ({ ...r, balance: money(r.balance, org.baseCurrency) })),
      pendingExpenses: pending[0]?.n ?? 0,
    };
  });
}

export const CATEGORY_LIST = EXPENSE_CATEGORIES;
