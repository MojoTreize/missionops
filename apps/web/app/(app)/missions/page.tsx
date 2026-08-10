import { Compass } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";

export const metadata = { title: "Missions — MissionOps" };

export default function MissionsPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 text-2xl font-semibold text-ink">Missions</h1>
      <EmptyState
        icon={<Compass aria-hidden />}
        title="Aucune mission pour l'instant"
        description="La création et le suivi des missions arriveront dans un prochain bloc."
      />
    </div>
  );
}
