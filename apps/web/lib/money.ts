/**
 * Représentation d'un montant monétaire (ADR-002).
 * Le montant est stocké en unités mineures (centimes, etc.) pour éviter toute
 * imprécision de virgule flottante ; la devise détermine le nombre de décimales.
 */
export interface Money {
  /** Montant en plus petite unité de la devise (ex. centimes). */
  amountMinor: bigint;
  /** Code ISO 4217, ex. "GNF", "EUR", "USD". */
  currency: string;
}

/**
 * Formate un montant pour l'affichage, sans perte de précision.
 * Le nombre de décimales est déduit de la devise (GNF = 0, EUR = 2, ...).
 */
export function formatMoney(money: Money, locale = "fr"): string {
  const formatter = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: money.currency,
  });
  const digits = formatter.resolvedOptions().maximumFractionDigits ?? 2;

  const negative = money.amountMinor < 0n;
  const absolute = negative ? -money.amountMinor : money.amountMinor;
  const padded = absolute.toString().padStart(digits + 1, "0");
  const integerPart = padded.slice(0, padded.length - digits) || "0";
  const fractionPart = digits > 0 ? "." + padded.slice(padded.length - digits) : "";
  const decimal = `${negative ? "-" : ""}${integerPart}${fractionPart}`;

  return formatter.format(Number(decimal));
}
