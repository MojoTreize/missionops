"use server";

import { revalidatePath } from "next/cache";

import { formDataToObject } from "@missionops/contracts";
import {
  createOrgLocation,
  markAllRead,
  removeOrgLocation,
  saveApprovalFlow,
  savePreferences,
} from "@missionops/services";

import { getDb } from "@/lib/db";
import { getT } from "@/lib/i18n/server";
import { errorState, serviceContext, type FormState } from "@/lib/server/context";

export async function addLocationAction(_: FormState, form: FormData): Promise<FormState> {
  const ctx = await serviceContext();
  try {
    await createOrgLocation(getDb(), ctx, formDataToObject(form));
  } catch (error) {
    return errorState(error);
  }
  revalidatePath("/organizations/locations");
  const { t } = await getT();
  return { status: "success", message: t("locations.added") };
}

export async function removeLocationAction(_: FormState, form: FormData): Promise<FormState> {
  const ctx = await serviceContext();
  try {
    await removeOrgLocation(getDb(), ctx, String(form.get("locationId") ?? ""));
  } catch (error) {
    return errorState(error);
  }
  revalidatePath("/organizations/locations");
  return { status: "idle" };
}

export async function saveFlowAction(_: FormState, form: FormData): Promise<FormState> {
  const ctx = await serviceContext();
  const roles = form.getAll("role").map(String);
  const thresholds = form.getAll("minBudget").map(String);
  const steps = roles
    .map((role, i) => ({ role, minBudget: thresholds[i] || null }))
    .filter((s) => s.role);
  try {
    await saveApprovalFlow(getDb(), ctx, steps);
  } catch (error) {
    return errorState(error);
  }
  revalidatePath("/organizations/approval-flow");
  const { t } = await getT();
  return { status: "success", message: t("approvalFlow.saved") };
}

export async function savePreferencesAction(_: FormState, form: FormData): Promise<FormState> {
  const ctx = await serviceContext();
  const raw = formDataToObject(form);
  try {
    await savePreferences(getDb(), ctx, {
      email: raw.email === "on",
      whatsapp: raw.whatsapp === "on",
      sms: raw.sms === "on",
      whatsappNumber: raw.whatsappNumber,
    });
  } catch (error) {
    return errorState(error);
  }
  const { t } = await getT();
  return { status: "success", message: t("notifications.preferencesSaved") };
}

export async function markAllReadAction(): Promise<void> {
  const ctx = await serviceContext();
  await markAllRead(getDb(), ctx);
  revalidatePath("/notifications");
}
