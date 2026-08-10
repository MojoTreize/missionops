"use client";

import { useEffect } from "react";
import { TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useT } from "@/lib/i18n/client";

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
  const t = useT();

  useEffect(() => {
    // Trace côté client ; l'observabilité serveur viendra avec le monitoring.
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-md py-12">
      <EmptyState
        icon={<TriangleAlert aria-hidden />}
        title={t("error.title")}
        description={t("error.description")}
        action={
          <Button type="button" onClick={reset}>
            {t("common.retry")}
          </Button>
        }
      />
    </div>
  );
}
