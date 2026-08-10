"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";

import type { Locale } from "./locales";
import type { Messages } from "./messages/fr";
import { createTranslator, type Translator } from "./translate";

/**
 * Contexte i18n côté client (B1.11). Le composant serveur racine calcule la
 * langue et le catalogue et les fournit ici ; les composants clients traduisent
 * via `useT`.
 */

interface I18nContextValue {
  locale: Locale;
  t: Translator;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({
  locale,
  messages,
  children,
}: {
  locale: Locale;
  messages: Messages;
  children: ReactNode;
}) {
  const value = useMemo<I18nContextValue>(
    () => ({ locale, t: createTranslator(messages) }),
    [locale, messages],
  );
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n doit être utilisé à l'intérieur d'un I18nProvider.");
  }
  return context;
}

export function useT(): Translator {
  return useI18n().t;
}

export function useLocale(): Locale {
  return useI18n().locale;
}
