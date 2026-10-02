/**
 * Devises supportées (ADR-002). Le nombre de décimales est une propriété de la
 * devise, jamais une constante globale : le franc guinéen n'a pas de sous-unité
 * en usage réel, l'euro et le dollar en ont deux.
 */
export const CURRENCIES = ["GNF", "EUR", "USD"] as const;

export type Currency = (typeof CURRENCIES)[number];

export const CURRENCY_DECIMALS: Record<Currency, number> = {
  GNF: 0,
  EUR: 2,
  USD: 2,
};

export function isCurrency(value: unknown): value is Currency {
  return typeof value === "string" && (CURRENCIES as readonly string[]).includes(value);
}

export function decimalsOf(currency: Currency): number {
  return CURRENCY_DECIMALS[currency];
}

/** 10^n en bigint. */
export function pow10(n: number): bigint {
  let result = 1n;
  for (let i = 0; i < n; i += 1) {
    result *= 10n;
  }
  return result;
}
