import Link from "next/link";
import type { Metadata } from "next";

import { getT } from "@/lib/i18n/server";

import { ResetPasswordForm } from "./reset-password-form";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: `${t("meta.reset")} — MissionOps` };
}

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const { t } = await getT();

  if (!token) {
    return (
      <div className="flex flex-col gap-4">
        <p role="alert" className="rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">
          {t("auth.reset.incomplete")}
        </p>
        <Link href="/forgot-password" className="text-sm text-field hover:underline">
          {t("auth.reset.redo")}
        </Link>
      </div>
    );
  }

  return <ResetPasswordForm token={token} />;
}
