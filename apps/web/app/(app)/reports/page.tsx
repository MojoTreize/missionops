import { BarChart3 } from "lucide-react";
import type { Metadata } from "next";

import { EmptyState } from "@/components/ui/empty-state";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: `${t("meta.reports")} — MissionOps` };
}

export default async function ReportsPage() {
  const { t } = await getT();
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 text-2xl font-semibold text-ink">{t("sections.reports.title")}</h1>
      <EmptyState
        icon={<BarChart3 aria-hidden />}
        title={t("sections.reports.emptyTitle")}
        description={t("sections.reports.emptyDescription")}
      />
    </div>
  );
}
