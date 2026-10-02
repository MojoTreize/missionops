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
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-[1.75rem] font-semibold leading-tight tracking-tight text-ink">
          {t("signup.title")}
        </h1>
        <p className="mt-1.5 text-[0.95rem] text-muted">{t("signup.description")}</p>
      </div>
      <SignupForm />
      <p className="border-t border-border pt-5 text-center text-sm">
        <Link href="/login" className="font-medium text-field hover:underline">
          {t("signup.haveAccount")}
        </Link>
      </p>
    </div>
  );
}
