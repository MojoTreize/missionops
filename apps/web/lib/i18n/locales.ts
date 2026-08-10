/**
 * Internationalisation (B1.11, ADR-008) — français et anglais dès le socle.
 *
 * Le français est la langue par défaut. La langue choisie est mémorisée dans un
 * cookie lu côté serveur à chaque rendu, ce qui fonctionne hors ligne et sans
 * base de données.
 */

export const LOCALES = ["fr", "en"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "fr";

/** Nom du cookie portant la langue active. */
export const LOCALE_COOKIE = "locale";

/** Libellé de chaque langue, dans sa propre langue. */
export const LOCALE_LABELS: Record<Locale, string> = {
  fr: "Français",
  en: "English",
};

/** Étiquette BCP 47 pour `Intl` (formats de date et de nombre). */
export const INTL_LOCALES: Record<Locale, string> = {
  fr: "fr-FR",
  en: "en-US",
};

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}
