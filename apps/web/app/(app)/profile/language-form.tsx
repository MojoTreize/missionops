"use client";

import { useRef, useTransition } from "react";

import { useLocale, useT } from "@/lib/i18n/client";
import { LOCALE_LABELS, LOCALES } from "@/lib/i18n/locales";

import { setLocaleAction } from "./actions";

/**
 * Sélecteur de langue (B1.11). Change la langue au `change` du menu déroulant,
 * sans bouton à presser : le formulaire est soumis à l'action serveur qui pose
 * le cookie et recharge.
 */
export function LanguageForm() {
  const t = useT();
  const locale = useLocale();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form ref={formRef} action={setLocaleAction} className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-ink" htmlFor="locale">
        {t("profile.languageLabel")}
      </label>
      <select
        id="locale"
        name="locale"
        defaultValue={locale}
        disabled={pending}
        onChange={() => startTransition(() => formRef.current?.requestSubmit())}
        className="max-w-xs rounded-md border border-border bg-surface px-2 py-2 text-sm text-field focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {LOCALES.map((value) => (
          <option key={value} value={value}>
            {LOCALE_LABELS[value]}
          </option>
        ))}
      </select>
    </form>
  );
}
