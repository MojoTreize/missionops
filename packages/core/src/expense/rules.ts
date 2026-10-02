import type { ExpenseCategory } from "../budget";
import type { MissionStatus } from "../mission";
import type { Money } from "../money/money";
import { percentOf } from "../money/money";

/**
 * Règles des avances (B3.4) et des dépenses (B3.5).
 */

// ---------------------------------------------------------------- Avances

/** Statuts de mission qui acceptent une avance. */
export const ADVANCE_STATUSES: readonly MissionStatus[] = ["VALIDEE", "EN_COURS"];

/** Au-delà de 120 % du budget, une validation du Directeur pays est requise. */
export const ADVANCE_CEILING_BP = 12000;

export const PAYMENT_METHODS = ["especes", "mobile_money", "virement", "cheque"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export type AdvanceIssue = "mission_status" | "amount" | "ceiling_requires_director";

/**
 * Vérifie une nouvelle avance. `existingBase` est le total net des avances déjà
 * versées (écritures inverses comprises), `amountBase` la nouvelle avance, tous
 * deux en devise de base.
 */
export function checkAdvance(input: {
  missionStatus: MissionStatus;
  amountBase: Money;
  existingBase: Money;
  budgetBase: Money;
  directorApproved: boolean;
}): AdvanceIssue[] {
  const issues: AdvanceIssue[] = [];
  if (!ADVANCE_STATUSES.includes(input.missionStatus)) issues.push("mission_status");
  if (input.amountBase.amountMinor <= 0n) issues.push("amount");
  const ceiling = percentOf(input.budgetBase, ADVANCE_CEILING_BP);
  const total = input.existingBase.amountMinor + input.amountBase.amountMinor;
  if (total > ceiling.amountMinor && !input.directorApproved) {
    issues.push("ceiling_requires_director");
  }
  return issues;
}

// --------------------------------------------------------------- Dépenses

export const EXPENSE_STATUSES = ["soumise", "approuvee", "rejetee"] as const;
export type ExpenseStatus = (typeof EXPENSE_STATUSES)[number];

/** Statuts de mission qui acceptent la saisie d'une dépense. */
export const EXPENSE_MISSION_STATUSES: readonly MissionStatus[] = [
  "VALIDEE",
  "EN_COURS",
  "TERMINEE",
];

/** Catégories pour lesquelles un justificatif n'est pas attendu (forfait). */
export const RECEIPT_EXEMPT_CATEGORIES: readonly ExpenseCategory[] = ["perdiem"];

/** Tolérance autour de la période de mission (trajets, nuit d'arrivée). */
export const PERIOD_TOLERANCE_DAYS = { before: 1, after: 2 };

export type ExpenseIssue =
  "mission_status" | "amount" | "description" | "date_invalid" | "receipt_or_reason";

export type ExpenseWarning = "out_of_period";

function shiftIsoDate(date: string, days: number): string {
  const time = Date.parse(`${date}T00:00:00Z`) + days * 86_400_000;
  return new Date(time).toISOString().slice(0, 10);
}

export interface ExpenseDraft {
  category: ExpenseCategory;
  description: string;
  amount: Money;
  spentOn: string;
  hasReceipt: boolean;
  receiptMissingReason: string | null;
}

export function checkExpense(
  draft: ExpenseDraft,
  mission: { status: MissionStatus; startDate: string; endDate: string },
): { issues: ExpenseIssue[]; warnings: ExpenseWarning[] } {
  const issues: ExpenseIssue[] = [];
  const warnings: ExpenseWarning[] = [];
  if (!EXPENSE_MISSION_STATUSES.includes(mission.status)) issues.push("mission_status");
  if (draft.amount.amountMinor <= 0n) issues.push("amount");
  if (draft.description.trim().length < 2) issues.push("description");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.spentOn) || Number.isNaN(Date.parse(draft.spentOn))) {
    issues.push("date_invalid");
  } else {
    const from = shiftIsoDate(mission.startDate, -PERIOD_TOLERANCE_DAYS.before);
    const to = shiftIsoDate(mission.endDate, PERIOD_TOLERANCE_DAYS.after);
    if (draft.spentOn < from || draft.spentOn > to) warnings.push("out_of_period");
  }
  const exempt = RECEIPT_EXEMPT_CATEGORIES.includes(draft.category);
  if (!exempt && !draft.hasReceipt && !draft.receiptMissingReason?.trim()) {
    issues.push("receipt_or_reason");
  }
  return { issues, warnings };
}

/** Transitions de statut d'une dépense (validation financière, B3.10). */
export function canDecideExpense(status: ExpenseStatus): boolean {
  return status === "soumise";
}
