import "server-only";

import { cookies } from "next/headers";

import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE, type Locale } from "./locales";
import { dictionaries } from "./messages";
import { createTranslator, type Translator } from "./translate";

/**
 * Accès serveur à la langue active (B1.11). Lit le cookie de langue ; retombe
 * sur le français par défaut.
 */

export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const value = store.get(LOCALE_COOKIE)?.value;
  return value && isLocale(value) ? value : DEFAULT_LOCALE;
}

export async function getMessages() {
  return dictionaries[await getLocale()];
}

/** Retourne la langue active et le traducteur lié, pour un composant serveur. */
export async function getT(): Promise<{ locale: Locale; t: Translator }> {
  const locale = await getLocale();
  return { locale, t: createTranslator(dictionaries[locale]) };
}
