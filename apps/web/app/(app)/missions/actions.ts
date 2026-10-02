"use server";

import { revalidatePath } from "next/cache";

import { formDataToObject } from "@missionops/contracts";
import { isMissionStatus, MISSION_EVENTS, type MissionEvent } from "@missionops/core";
import {
  ServiceError,
  addBudgetLine,
  addParticipant,
  applyMissionEvent,
  approveMany,
  cancelAdvance,
  createAdvance,
  createMission,
  decideMission,
  justifyVariance,
  recordSettlement,
  removeBudgetLine,
  removeParticipant,
  reopenReconciliation,
  saveMissionReport,
  submitReconciliation,
  updateMission,
  validateReconciliation,
} from "@missionops/services";

import { getDb } from "@/lib/db";
import { getT } from "@/lib/i18n/server";
import { errorState, serviceContext, type FormState } from "@/lib/server/context";

/**
 * Actions serveur des missions : elles n'orchestrent que des appels aux
 * services (validation Zod, droits, domaine, audit). Aucune règle ici.
 */

function refresh(missionId?: string) {
  revalidatePath("/missions");
  revalidatePath("/approvals");
  revalidatePath("/dashboard");
  if (missionId) revalidatePath(`/missions/${missionId}`);
}

async function ok(key: Parameters<Awaited<ReturnType<typeof getT>>["t"]>[0]): Promise<FormState> {
  const { t } = await getT();
  return { status: "success", message: t(key) };
}

export async function createMissionAction(_: FormState, form: FormData): Promise<FormState> {
  const ctx = await serviceContext();
  let id: string;
  try {
    ({ id } = await createMission(getDb(), ctx, formDataToObject(form)));
  } catch (error) {
    return errorState(error);
  }
  // Navigation faite côté client : un `redirect()` depuis l'action bloque
  // parfois le routeur sur cette route (rendu en flux de la page cible).
  return { status: "success", redirectTo: `/missions/${id}` };
}

export async function updateMissionAction(
  missionId: string,
  _: FormState,
  form: FormData,
): Promise<FormState> {
  const ctx = await serviceContext();
  let revalidation = false;
  try {
    ({ revalidation } = await updateMission(getDb(), ctx, missionId, formDataToObject(form)));
  } catch (error) {
    return errorState(error);
  }
  return {
    status: "success",
    redirectTo: `/missions/${missionId}?saved=${revalidation ? "revalidation" : "1"}`,
  };
}

export async function missionEventAction(_: FormState, form: FormData): Promise<FormState> {
  const ctx = await serviceContext();
  const missionId = String(form.get("missionId") ?? "");
  const event = String(form.get("event") ?? "");
  if (!(MISSION_EVENTS as readonly string[]).includes(event)) {
    return errorState(new ServiceError("invalid_input"));
  }
  try {
    const status = await applyMissionEvent(
      getDb(),
      ctx,
      missionId,
      event as MissionEvent,
      String(form.get("comment") ?? "") || null,
    );
    refresh(missionId);
    const { t } = await getT();
    return {
      status: "success",
      message: isMissionStatus(status) ? t(`missionStatus.${status}`) : "",
    };
  } catch (error) {
    return errorState(error);
  }
}

export async function decideMissionAction(_: FormState, form: FormData): Promise<FormState> {
  const ctx = await serviceContext();
  const missionId = String(form.get("missionId") ?? "");
  try {
    const status = await decideMission(getDb(), ctx, formDataToObject(form));
    refresh(missionId);
    const { t } = await getT();
    return { status: "success", message: t(`missionStatus.${status}`) };
  } catch (error) {
    return errorState(error);
  }
}

export async function approveManyAction(_: FormState, form: FormData): Promise<FormState> {
  const ctx = await serviceContext();
  const ids = form.getAll("missionId").map(String);
  const { t } = await getT();
  try {
    const result = await approveMany(getDb(), ctx, ids);
    refresh();
    const refused = result.refused.map((r) => t(`errors.${r.code}` as "errors.generic")).join(" ");
    return {
      status: result.refused.length ? "error" : "success",
      message: [t("approvals.batchDone", { count: result.approved.length }), refused]
        .filter(Boolean)
        .join(" "),
    };
  } catch (error) {
    return errorState(error);
  }
}

export async function addParticipantAction(_: FormState, form: FormData): Promise<FormState> {
  const ctx = await serviceContext();
  const missionId = String(form.get("missionId") ?? "");
  try {
    await addParticipant(getDb(), ctx, formDataToObject(form));
  } catch (error) {
    return errorState(error);
  }
  refresh(missionId);
  return { status: "idle" };
}

export async function removeParticipantAction(_: FormState, form: FormData): Promise<FormState> {
  const ctx = await serviceContext();
  try {
    await removeParticipant(getDb(), ctx, String(form.get("participantId") ?? ""));
  } catch (error) {
    return errorState(error);
  }
  refresh(String(form.get("missionId") ?? ""));
  return { status: "idle" };
}

export async function addBudgetLineAction(_: FormState, form: FormData): Promise<FormState> {
  const ctx = await serviceContext();
  const missionId = String(form.get("missionId") ?? "");
  try {
    await addBudgetLine(getDb(), ctx, formDataToObject(form));
  } catch (error) {
    return errorState(error);
  }
  refresh(missionId);
  return { status: "idle" };
}

export async function removeBudgetLineAction(_: FormState, form: FormData): Promise<FormState> {
  const ctx = await serviceContext();
  try {
    await removeBudgetLine(getDb(), ctx, String(form.get("lineId") ?? ""));
  } catch (error) {
    return errorState(error);
  }
  refresh(String(form.get("missionId") ?? ""));
  return { status: "idle" };
}

export async function createAdvanceAction(_: FormState, form: FormData): Promise<FormState> {
  const ctx = await serviceContext();
  const missionId = String(form.get("missionId") ?? "");
  try {
    await createAdvance(getDb(), ctx, formDataToObject(form));
  } catch (error) {
    return errorState(error);
  }
  refresh(missionId);
  return ok("advances.add");
}

export async function cancelAdvanceAction(_: FormState, form: FormData): Promise<FormState> {
  const ctx = await serviceContext();
  try {
    await cancelAdvance(getDb(), ctx, formDataToObject(form));
  } catch (error) {
    return errorState(error);
  }
  refresh(String(form.get("missionId") ?? ""));
  return { status: "idle" };
}

export async function justifyVarianceAction(_: FormState, form: FormData): Promise<FormState> {
  const ctx = await serviceContext();
  const missionId = String(form.get("missionId") ?? "");
  try {
    await justifyVariance(getDb(), ctx, formDataToObject(form));
  } catch (error) {
    return errorState(error);
  }
  revalidatePath(`/missions/${missionId}/reconciliation`);
  return { status: "idle" };
}

export async function submitReconciliationAction(_: FormState, form: FormData): Promise<FormState> {
  const ctx = await serviceContext();
  const missionId = String(form.get("missionId") ?? "");
  try {
    await submitReconciliation(getDb(), ctx, formDataToObject(form));
  } catch (error) {
    return errorState(error);
  }
  refresh(missionId);
  revalidatePath(`/missions/${missionId}/reconciliation`);
  revalidatePath("/finance");
  return ok("reconciliationStatus.soumise");
}

export async function settlementAction(_: FormState, form: FormData): Promise<FormState> {
  const ctx = await serviceContext();
  const missionId = String(form.get("missionId") ?? "");
  try {
    await recordSettlement(getDb(), ctx, formDataToObject(form));
  } catch (error) {
    return errorState(error);
  }
  revalidatePath(`/missions/${missionId}/reconciliation`);
  return { status: "idle" };
}

export async function validateReconciliationAction(
  _: FormState,
  form: FormData,
): Promise<FormState> {
  const ctx = await serviceContext();
  const missionId = String(form.get("missionId") ?? "");
  try {
    await validateReconciliation(getDb(), ctx, formDataToObject(form));
  } catch (error) {
    return errorState(error);
  }
  refresh(missionId);
  revalidatePath(`/missions/${missionId}/reconciliation`);
  revalidatePath("/finance");
  return ok("reconciliationStatus.validee");
}

export async function reopenReconciliationAction(_: FormState, form: FormData): Promise<FormState> {
  const ctx = await serviceContext();
  const missionId = String(form.get("missionId") ?? "");
  try {
    await reopenReconciliation(getDb(), ctx, formDataToObject(form));
  } catch (error) {
    return errorState(error);
  }
  revalidatePath(`/missions/${missionId}/reconciliation`);
  revalidatePath("/finance");
  return ok("reconciliationStatus.ouverte");
}

export async function saveReportAction(_: FormState, form: FormData): Promise<FormState> {
  const ctx = await serviceContext();
  const missionId = String(form.get("missionId") ?? "");
  const submit = form.get("intent") === "submit";
  try {
    await saveMissionReport(getDb(), ctx, formDataToObject(form), submit);
  } catch (error) {
    return errorState(error);
  }
  revalidatePath(`/missions/${missionId}/report`);
  return ok("report.saved");
}
