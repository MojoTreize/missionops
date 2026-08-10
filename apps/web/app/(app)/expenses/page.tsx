import { ReceiptText } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";

export const metadata = { title: "Dépenses — MissionOps" };

export default function ExpensesPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 text-2xl font-semibold text-ink">Dépenses</h1>
      <EmptyState
        icon={<ReceiptText aria-hidden />}
        title="Aucune dépense pour l'instant"
        description="La saisie et la validation des dépenses arriveront dans un prochain bloc."
      />
    </div>
  );
}
