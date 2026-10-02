import type { Metadata } from "next";
import Link from "next/link";

import { getT } from "@/lib/i18n/server";

import { SignupForm } from "./signup-form";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: `${t("signup.title")} — MissionOps` };
}

/** Inscription en libre-service (B9.1). */
export default async function SignupPage() {
  const { t } = await getT();
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold text-ink">{t("signup.title")}</h2>
        <p className="text-sm text-muted">{t("signup.description")}</p>
      </div>
      <SignupForm />
      <Link href="/login" className="text-sm text-field hover:underline">
        {t("signup.haveAccount")}
      </Link>
    </div>
  );
}
