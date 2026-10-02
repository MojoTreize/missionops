import type { Metadata } from "next";

import { EXPENSE_CATEGORIES } from "@missionops/core";
import { getOrganisation, myFieldMissions } from "@missionops/services";

import { getDb } from "@/lib/db";
import { getT } from "@/lib/i18n/server";
import { serviceContext } from "@/lib/server/context";

import { TerrainApp } from "./terrain-app";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: `${t("terrain.title")} — MissionOps` };
}

/**
 * Écran terrain (Phase 4). Rendu côté serveur quand le réseau est là ; mis en
 * cache par le service worker pour être rouvert hors ligne, les données venant
 * alors d'IndexedDB.
 */
export default async function TerrainPage({
  searchParams,
}: {
  searchParams: Promise<{ mission?: string }>;
}) {
  const { mission } = await searchParams;
  const ctx = await serviceContext();
  const db = getDb();
  const { t } = await getT();
  const [missions, org] = await Promise.all([
    myFieldMissions(db, ctx),
    getOrganisation(db, ctx.organisationId),
  ]);
  return (
    <div className="mx-auto flex max-w-md flex-col gap-4">
      <div>
        <h1 className="text-[1.65rem] font-semibold leading-tight tracking-tight text-ink sm:text-3xl">
          {t("terrain.title")}
        </h1>
        <p className="mt-1.5 text-[0.95rem] text-muted">{t("terrain.subtitle")}</p>
      </div>
      <TerrainApp
        preselectedMission={mission ?? null}
        initial={{
          key: "terrain",
          fetchedAt: ctx.now.toISOString(),
          userId: ctx.actor.userId,
          organisationId: ctx.organisationId,
          baseCurrency: org.baseCurrency,
          categories: [...EXPENSE_CATEGORIES],
          missions: missions.map((m) => ({
            id: m.id,
            reference: m.reference,
            title: m.title,
            status: m.status,
            destination: m.destination,
            startDate: m.startDate,
            endDate: m.endDate,
          })),
        }}
      />
    </div>
  );
}
