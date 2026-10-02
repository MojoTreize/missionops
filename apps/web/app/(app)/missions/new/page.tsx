import type { Metadata } from "next";

import { searchableLocations } from "@missionops/services";

import { getDb } from "@/lib/db";
import { getT } from "@/lib/i18n/server";
import { requireCan } from "@/lib/policy";
import { serviceContext } from "@/lib/server/context";

import { createMissionAction } from "../actions";
import { MissionForm } from "../mission-form";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: `${t("missions.form.createTitle")} — MissionOps` };
}

export default async function NewMissionPage() {
  await requireCan("create", "mission");
  const ctx = await serviceContext();
  const { t } = await getT();
  const locations = await searchableLocations(getDb(), ctx);
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-5">
      <h1 className="text-[1.65rem] font-semibold leading-tight tracking-tight text-ink sm:text-3xl">
        {t("missions.form.createTitle")}
      </h1>
      <MissionForm mode="create" action={createMissionAction} locations={locations} />
    </div>
  );
}
