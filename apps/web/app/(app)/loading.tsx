import { Skeleton } from "@/components/ui/skeleton";
import { getT } from "@/lib/i18n/server";

/**
 * État de chargement de l'espace authentifié (B1.10). Affiché pendant la
 * résolution d'un segment ; réserve la place du contenu pour éviter les sauts
 * de mise en page.
 */
export default async function AppLoading() {
  const { t } = await getT();
  return (
    <div className="mx-auto max-w-3xl" aria-busy="true" aria-live="polite">
      <span className="sr-only">{t("common.loading")}</span>
      <Skeleton className="h-8 w-48" />
      <Skeleton className="mt-4 h-4 w-full max-w-md" />
      <Skeleton className="mt-2 h-4 w-2/3" />
      <Skeleton className="mt-8 h-40 w-full" />
    </div>
  );
}
