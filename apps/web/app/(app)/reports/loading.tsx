import { Skeleton } from "@/components/ui/skeleton";
import { getT } from "@/lib/i18n/server";

/**
 * État de chargement (B1.10). Réservé aux pages sans action serveur : une
 * frontière de chargement au-dessus d'une page à actions empêche son
 * rafraîchissement après l'action (constaté avec Next 15.5).
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
