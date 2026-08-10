import { INTL_LOCALES, type Locale } from "./locales";

/**
 * Formats localisés (B1.11) via `Intl`. Utilisables côté serveur comme client.
 */

export function formatDate(
  value: Date | string | number,
  locale: Locale,
  options: Intl.DateTimeFormatOptions = { dateStyle: "medium" },
): string {
  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat(INTL_LOCALES[locale], options).format(date);
}

export function formatNumber(
  value: number,
  locale: Locale,
  options?: Intl.NumberFormatOptions,
): string {
  return new Intl.NumberFormat(INTL_LOCALES[locale], options).format(value);
}
