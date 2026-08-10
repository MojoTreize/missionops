"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { isLocale, LOCALE_COOKIE } from "@/lib/i18n/locales";

/**
 * Change la langue de l'interface (B1.11). Écrit le cookie de langue puis
 * recharge le profil : le layout racine relit le cookie et re-rend l'ensemble
 * de l'application dans la nouvelle langue.
 */
export async function setLocaleAction(formData: FormData): Promise<void> {
  const requested = String(formData.get("locale") ?? "");
  if (isLocale(requested)) {
    const store = await cookies();
    store.set(LOCALE_COOKIE, requested, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
  }
  redirect("/profile");
}
