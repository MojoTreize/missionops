import { CloudOff } from "lucide-react";
import Link from "next/link";

import { getT } from "@/lib/i18n/server";

/**
 * Page de repli hors ligne (B4.1), servie par le service worker quand une page
 * non mise en cache est demandée sans réseau. L'écran terrain, lui, reste
 * disponible.
 */

export default async function OfflinePage() {
  const { t } = await getT();
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col items-center justify-center gap-4 p-6 text-center">
      <CloudOff className="size-10 text-muted" aria-hidden />
      <h1 className="text-[1.65rem] font-semibold leading-tight tracking-tight text-ink sm:text-3xl">
        {t("offline.title")}
      </h1>
      <p className="mt-1.5 text-[0.95rem] text-muted">{t("offline.description")}</p>
      <Link href="/terrain" className="font-medium text-field underline">
        {t("offline.terrain")}
      </Link>
    </main>
  );
}
