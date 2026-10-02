import type { Metadata } from "next";

import Link from "next/link";

import { getT } from "@/lib/i18n/server";

import { LoginForm } from "./login-form";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: `${t("meta.login")} — MissionOps` };
}

/**
 * Page de connexion. `error=lien-invalide` provient d'un lien magique expiré,
 * déjà utilisé ou falsifié.
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const { t } = await getT();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-[1.75rem] font-semibold leading-tight tracking-tight text-ink">
          {t("auth.login.title")}
        </h1>
        <p className="mt-1.5 text-[0.95rem] text-muted">{t("auth.login.subtitle")}</p>
      </div>
      {error === "lien-invalide" ? (
        <p role="alert" className="rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">
          {t("auth.login.linkInvalid")}
        </p>
      ) : null}
      <LoginForm />
      <p className="border-t border-border pt-5 text-center text-sm">
        <Link href="/signup" className="font-medium text-field hover:underline">
          {t("signup.noAccount")}
        </Link>
      </p>
    </div>
  );
}
