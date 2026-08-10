import Link from "next/link";
import type { Metadata } from "next";

import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: `${t("meta.forbidden")} — MissionOps` };
}

/**
 * Page d'accès refusé (403). Affichée quand l'acteur courant n'a pas le droit
 * requis pour une route (garde `requireCan`).
 */
export default async function ForbiddenPage() {
  const { t } = await getT();
  return (
    <div className="mx-auto flex max-w-md flex-col gap-3 py-12 text-center">
      <h1 className="text-xl font-semibold text-field">{t("forbidden.title")}</h1>
      <p className="text-sm text-muted">{t("forbidden.description")}</p>
      <p className="mt-2 text-sm">
        <Link href="/dashboard" className="text-field hover:underline">
          {t("common.backToDashboard")}
        </Link>
      </p>
    </div>
  );
}
