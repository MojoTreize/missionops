import { Compass } from "lucide-react";
import type { Metadata } from "next";

import { EmptyState } from "@/components/ui/empty-state";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: `${t("meta.missions")} — MissionOps` };
}

export default async function MissionsPage() {
  const { t } = await getT();
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 text-2xl font-semibold text-ink">{t("sections.missions.title")}</h1>
      <EmptyState
        icon={<Compass aria-hidden />}
        title={t("sections.missions.emptyTitle")}
        description={t("sections.missions.emptyDescription")}
      />
    </div>
  );
}
