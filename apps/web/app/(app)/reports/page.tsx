import { BarChart3 } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";

export const metadata = { title: "Rapports — MissionOps" };

export default function ReportsPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 text-2xl font-semibold text-ink">Rapports</h1>
      <EmptyState
        icon={<BarChart3 aria-hidden />}
        title="Aucun rapport pour l'instant"
        description="Les tableaux de bord et exports arriveront une fois les données métier en place."
      />
    </div>
  );
}
