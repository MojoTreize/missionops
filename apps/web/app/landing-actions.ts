"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { isLocale, LOCALE_COOKIE } from "@/lib/i18n/locales";

/** Bascule de langue de la page d'accueil publique : écrit le cookie puis recharge `/`. */
export async function setLandingLocaleAction(formData: FormData): Promise<void> {
  const requested = String(formData.get("locale") ?? "");
  if (isLocale(requested)) {
    const store = await cookies();
    store.set(LOCALE_COOKIE, requested, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  }
  redirect("/");
}
