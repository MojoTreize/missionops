"use client";

import { useEffect } from "react";
import { TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

/**
 * Frontière d'erreur de l'espace authentifié (B1.10). Capture les erreurs de
 * rendu d'un segment et propose de réessayer sans quitter l'application.
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Trace côté client ; l'observabilité serveur viendra avec le monitoring.
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-md py-12">
      <EmptyState
        icon={<TriangleAlert aria-hidden />}
        title="Une erreur est survenue"
        description="Quelque chose s'est mal passé de notre côté. Vous pouvez réessayer."
        action={
          <Button type="button" onClick={reset}>
            Réessayer
          </Button>
        }
      />
    </div>
  );
}
