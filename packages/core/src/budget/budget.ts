import { convert, type FxRate } from "../money/fx";
import { multiply, sum, zero, type Money } from "../money/money";
import type { Currency } from "../money/currency";

/**
 * Budget prévisionnel d'une mission (B3.3) et suivi budgétaire (B3.7).
 * Chaque ligne a sa devise et son taux vers la devise de base, figé à la saisie.
 */
export const EXPENSE_CATEGORIES = [
  "transport",
  "carburant",
  "hebergement",
  "restauration",
  "perdiem",
  "communication",
  "fournitures",
  "autre",
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export function isExpenseCategory(value: unknown): value is ExpenseCategory {
  return typeof value === "string" && (EXPENSE_CATEGORIES as readonly string[]).includes(value);
}

export interface BudgetLine {
  category: ExpenseCategory;
  quantity: number;
  unitAmount: Money;
  /** Taux de la devise de la ligne vers la devise de base, figé. */
  rateToBase: FxRate;
}

export type BudgetLineIssue = "quantity" | "amount" | "rate";

export function validateBudgetLine(line: BudgetLine, base: Currency): BudgetLineIssue[] {
  const issues: BudgetLineIssue[] = [];
  if (!Number.isInteger(line.quantity) || line.quantity < 1 || line.quantity > 10_000) {
    issues.push("quantity");
  }
  if (line.unitAmount.amountMinor <= 0n) issues.push("amount");
  if (line.rateToBase.from !== line.unitAmount.currency || line.rateToBase.to !== base) {
    issues.push("rate");
  }
  return issues;
}

export function lineTotal(line: BudgetLine): Money {
  return multiply(line.unitAmount, line.quantity);
}

export function lineTotalBase(line: BudgetLine): Money {
  return convert(lineTotal(line), line.rateToBase);
}

export function budgetTotalBase(lines: readonly BudgetLine[], base: Currency): Money {
  return sum(
    lines.map((l) => lineTotalBase(l)),
    base,
  );
}

export function budgetByCategory(
  lines: readonly BudgetLine[],
  base: Currency,
): Map<ExpenseCategory, Money> {
  const totals = new Map<ExpenseCategory, Money>();
  for (const line of lines) {
    const current = totals.get(line.category) ?? zero(base);
    totals.set(line.category, {
      amountMinor: current.amountMinor + lineTotalBase(line).amountMinor,
      currency: base,
    });
  }
  return totals;
}

export type ConsumptionLevel = "ok" | "warning" | "over";

/** Seuil d'alerte : 80 % du budget consommé. */
export const WARNING_BASIS_POINTS = 8000;

export interface CategoryTracking {
  category: ExpenseCategory;
  planned: Money;
  actual: Money;
  /** Consommation en points de base (10000 = 100 %) ; `null` si rien de prévu. */
  consumptionBp: number | null;
  level: ConsumptionLevel;
}

function level(planned: bigint, actual: bigint): ConsumptionLevel {
  if (planned === 0n) return actual > 0n ? "over" : "ok";
  if (actual > planned) return "over";
  if (actual * 10000n >= planned * BigInt(WARNING_BASIS_POINTS)) return "warning";
  return "ok";
}

/**
 * Suivi budgétaire : prévu contre réalisé, par catégorie, en devise de base.
 * `actual` reçoit les dépenses déjà converties (taux figé de chaque dépense).
 */
export function trackBudget(
  planned: ReadonlyMap<ExpenseCategory, Money>,
  actual: ReadonlyMap<ExpenseCategory, Money>,
  base: Currency,
): CategoryTracking[] {
  const categories = new Set<ExpenseCategory>([...planned.keys(), ...actual.keys()]);
  return [...categories]
    .sort((a, b) => EXPENSE_CATEGORIES.indexOf(a) - EXPENSE_CATEGORIES.indexOf(b))
    .map((category) => {
      const p = planned.get(category) ?? zero(base);
      const a = actual.get(category) ?? zero(base);
      return {
        category,
        planned: p,
        actual: a,
        consumptionBp:
          p.amountMinor === 0n ? null : Number((a.amountMinor * 10000n) / p.amountMinor),
        level: level(p.amountMinor, a.amountMinor),
      };
    });
}

/** Total réalisé par catégorie à partir de montants déjà en devise de base. */
export function totalsByCategory(
  items: readonly { category: ExpenseCategory; amountBase: Money }[],
  base: Currency,
): Map<ExpenseCategory, Money> {
  const totals = new Map<ExpenseCategory, Money>();
  for (const item of items) {
    const current = totals.get(item.category) ?? zero(base);
    totals.set(item.category, {
      amountMinor: current.amountMinor + item.amountBase.amountMinor,
      currency: base,
    });
  }
  return totals;
}
