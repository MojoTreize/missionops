import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { getMission, searchableLocations, ServiceError } from "@missionops/services";

import { getDb } from "@/lib/db";
import { getT } from "@/lib/i18n/server";
import { serviceContext } from "@/lib/server/context";

import { updateMissionAction } from "../../actions";
import { MissionForm } from "../../mission-form";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: `${t("missions.form.editTitle")} — MissionOps` };
}

export default async function EditMissionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await serviceContext();
  const { t } = await getT();
  const mission = await getMission(getDb(), ctx, id).catch((error: unknown) => {
    if (error instanceof ServiceError) notFound();
    throw error;
  });
  if (!mission.canEdit) redirect(`/missions/${id}`);
  const locations = await searchableLocations(getDb(), ctx);
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-5">
      <h1 className="text-[1.65rem] font-semibold leading-tight tracking-tight text-ink sm:text-3xl">
        {t("missions.form.editTitle")}
      </h1>
      {mission.status === "VALIDEE" ? (
        <p className="rounded-md bg-warning-soft p-3 text-sm text-warning">
          {t("missions.form.editWarning")}
        </p>
      ) : null}
      <MissionForm
        mode="edit"
        action={updateMissionAction.bind(null, id)}
        locations={locations}
        initial={{
          title: mission.title,
          purpose: mission.purpose,
          destinationId: mission.destinationLocationId ?? mission.destinationCode,
          startDate: mission.startDate,
          endDate: mission.endDate,
          transportMode: mission.transportMode ?? "",
          notes: mission.notes ?? "",
        }}
      />
    </div>
  );
}
