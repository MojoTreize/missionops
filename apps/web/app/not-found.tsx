import Link from "next/link";
import type { Metadata } from "next";
import { Compass } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: `${t("meta.notFound")} — MissionOps` };
}

/**
 * Page 404 globale (B1.10). Rendue hors de la coque authentifiée ; ramène
 * toujours vers un point d'entrée pour ne jamais laisser l'utilisateur bloqué.
 */
export default async function NotFound() {
  const { t } = await getT();
  return (
    <main className="flex min-h-dvh items-center justify-center bg-paper px-4">
      <div className="w-full max-w-md">
        <EmptyState
          icon={<Compass aria-hidden />}
          title={t("notFound.title")}
          description={t("notFound.description")}
          action={
            <Button asChild>
              <Link href="/dashboard">{t("common.backToDashboard")}</Link>
            </Button>
          }
        />
      </div>
    </main>
  );
}
