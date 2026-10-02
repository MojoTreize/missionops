import type { CategoryTracking, ExpenseCategory } from "../budget";
import type { ExpenseStatus } from "../expense";
import type { Currency } from "../money/currency";
import { sum, type Money } from "../money/money";

/**
 * Réconciliation de l'avance (B3.8), écarts (B3.9) et validation financière
 * (B3.10). Tout est calculé en devise de base, à partir des montants convertis
 * au taux figé de chaque ligne : jamais au taux du jour.
 */

export interface AdvanceEntry {
  amountBase: Money; // négatif pour une écriture inverse
}

export interface ExpenseEntry {
  id: string;
  category: ExpenseCategory;
  status: ExpenseStatus;
  amountBase: Money;
  hasReceipt: boolean;
  outOfPeriod: boolean;
}

export type SettlementDirection = "agent_reverse" | "org_rembourse" | "solde";

export interface Reconciliation {
  advances: Money;
  approvedExpenses: Money;
  pendingExpenses: Money;
  rejectedExpenses: Money;
  /** Avances − dépenses approuvées. Positif : l'agent doit reverser. */
  balance: Money;
  direction: SettlementDirection;
  pendingCount: number;
  missingReceipts: string[];
  outOfPeriod: string[];
}

export function reconcile(
  advances: readonly AdvanceEntry[],
  expenses: readonly ExpenseEntry[],
  base: Currency,
): Reconciliation {
  const advancesTotal = sum(
    advances.map((a) => a.amountBase),
    base,
  );
  const byStatus = (status: ExpenseStatus) =>
    sum(
      expenses.filter((e) => e.status === status).map((e) => e.amountBase),
      base,
    );
  const approved = byStatus("approuvee");
  const balance: Money = {
    amountMinor: advancesTotal.amountMinor - approved.amountMinor,
    currency: base,
  };
  const active = expenses.filter((e) => e.status !== "rejetee");
  return {
    advances: advancesTotal,
    approvedExpenses: approved,
    pendingExpenses: byStatus("soumise"),
    rejectedExpenses: byStatus("rejetee"),
    balance,
    direction:
      balance.amountMinor > 0n
        ? "agent_reverse"
        : balance.amountMinor < 0n
          ? "org_rembourse"
          : "solde",
    pendingCount: expenses.filter((e) => e.status === "soumise").length,
    missingReceipts: active.filter((e) => !e.hasReceipt).map((e) => e.id),
    outOfPeriod: active.filter((e) => e.outOfPeriod).map((e) => e.id),
  };
}

// ------------------------------------------------------------------ Écarts

/** Un écart budgétaire doit être justifié au-delà de 10 % ET d'un plancher. */
export const VARIANCE_THRESHOLD_BP = 1000;

export interface Variance {
  category: ExpenseCategory;
  planned: Money;
  actual: Money;
  difference: Money;
  /** Écart relatif en points de base ; `null` si rien n'était prévu. */
  differenceBp: number | null;
}

/**
 * Écarts à justifier : catégories dont le réalisé dépasse le prévu de plus de
 * 10 % et d'au moins `floorMinor` (en devise de base), ou dépenses non prévues.
 */
export function variancesToJustify(
  tracking: readonly CategoryTracking[],
  floorMinor: bigint,
): Variance[] {
  return tracking
    .map((t) => {
      const difference = t.actual.amountMinor - t.planned.amountMinor;
      return {
        category: t.category,
        planned: t.planned,
        actual: t.actual,
        difference: { amountMinor: difference, currency: t.actual.currency },
        differenceBp:
          t.planned.amountMinor === 0n
            ? null
            : Number((difference * 10000n) / t.planned.amountMinor),
      };
    })
    .filter(
      (v) =>
        v.difference.amountMinor >= floorMinor &&
        v.difference.amountMinor > 0n &&
        (v.differenceBp === null || v.differenceBp > VARIANCE_THRESHOLD_BP),
    );
}

// ---------------------------------------------------- Validation financière

export const RECONCILIATION_STATUSES = ["ouverte", "soumise", "validee"] as const;
export type ReconciliationStatus = (typeof RECONCILIATION_STATUSES)[number];

export type ReconciliationIssue =
  | "pending_expenses"
  | "unjustified_variances"
  | "missing_receipt_reasons"
  | "settlement_missing"
  | "self_validation";

export interface SubmissionInput {
  reconciliation: Reconciliation;
  variances: readonly Variance[];
  justifiedCategories: ReadonlySet<ExpenseCategory>;
  /** Dépenses sans justificatif mais avec un motif renseigné. */
  explainedMissingReceipts: ReadonlySet<string>;
}

/** Points bloquants pour soumettre la réconciliation à la finance. */
export function checkSubmission(input: SubmissionInput): ReconciliationIssue[] {
  const issues: ReconciliationIssue[] = [];
  if (input.reconciliation.pendingCount > 0) issues.push("pending_expenses");
  if (input.variances.some((v) => !input.justifiedCategories.has(v.category))) {
    issues.push("unjustified_variances");
  }
  if (input.reconciliation.missingReceipts.some((id) => !input.explainedMissingReceipts.has(id))) {
    issues.push("missing_receipt_reasons");
  }
  return issues;
}

/**
 * Points bloquants pour la validation financière : la soumission doit rester
 * valable, le solde doit être réglé (reversement ou remboursement enregistré)
 * et le validateur ne peut pas être celui qui a soumis.
 */
export function checkValidation(
  input: SubmissionInput & {
    settlementRecorded: boolean;
    submittedBy: string;
    validatorId: string;
  },
): ReconciliationIssue[] {
  const issues = checkSubmission(input);
  if (input.reconciliation.direction !== "solde" && !input.settlementRecorded) {
    issues.push("settlement_missing");
  }
  if (input.submittedBy === input.validatorId) issues.push("self_validation");
  return issues;
}
