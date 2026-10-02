"use server";

import { revalidatePath } from "next/cache";

import { formDataToObject } from "@missionops/contracts";
import {
  archiveMissions,
  changeMemberRole,
  importLocations,
  prepareMemberImport,
  removeMember,
  updateOrganisationSettings,
} from "@missionops/services";

import { baseUrl } from "@/lib/auth/server";
import { generateToken } from "@/lib/auth/tokens";
import { getDb } from "@/lib/db";
import { getT } from "@/lib/i18n/server";
import { sendInvitationEmail } from "@/lib/mail";
import { createInvitation } from "@/lib/org/queries";
import { errorState, serviceContext, translateError, type FormState } from "@/lib/server/context";

export async function saveSettingsAction(_: FormState, form: FormData): Promise<FormState> {
  const ctx = await serviceContext();
  try {
    await updateOrganisationSettings(getDb(), ctx, formDataToObject(form));
  } catch (error) {
    return errorState(error);
  }
  revalidatePath("/", "layout");
  const { t } = await getT();
  return { status: "success", message: t("settings.saved") };
}

async function fileText(form: FormData): Promise<string> {
  const file = form.get("file");
  if (!(file instanceof Blob) || file.size === 0 || file.size > 1_000_000) return "";
  return file.text();
}

export async function importLocationsAction(_: FormState, form: FormData): Promise<FormState> {
  const ctx = await serviceContext();
  const { t } = await getT();
  try {
    const report = await importLocations(getDb(), ctx, await fileText(form));
    revalidatePath("/organizations/locations");
    const message = [
      t("settings.importDone", { count: report.imported }),
      report.errors.length
        ? t("settings.importErrors", {
            lines: report.errors.map((e) => `${e.line} (${translateError(t, e.code)})`).join(", "),
          })
        : "",
    ]
      .filter(Boolean)
      .join(" ");
    return { status: report.errors.length ? "error" : "success", message };
  } catch (error) {
    return errorState(error);
  }
}

export async function importMembersAction(_: FormState, form: FormData): Promise<FormState> {
  const ctx = await serviceContext();
  const { t } = await getT();
  try {
    const { rows, errors } = await prepareMemberImport(getDb(), ctx, await fileText(form));
    const origin = await baseUrl();
    for (const row of rows) {
      const rawToken = generateToken();
      await createInvitation({
        organisationId: ctx.organisationId,
        invitedBy: ctx.actor.userId,
        email: row.email,
        role: row.role,
        rawToken,
      });
      await sendInvitationEmail(
        row.email,
        `${origin}/organizations/invitations/accept?token=${encodeURIComponent(rawToken)}`,
        ctx.actorInfo.organisationName,
      );
    }
    revalidatePath("/organizations/members");
    const message = [
      t("settings.importDone", { count: rows.length }),
      errors.length
        ? t("settings.importErrors", {
            lines: errors.map((e) => `${e.line} (${translateError(t, e.code)})`).join(", "),
          })
        : "",
    ]
      .filter(Boolean)
      .join(" ");
    return { status: errors.length ? "error" : "success", message };
  } catch (error) {
    return errorState(error);
  }
}

export async function archiveAction(): Promise<FormState> {
  const ctx = await serviceContext();
  try {
    const count = await archiveMissions(getDb(), ctx, 180);
    revalidatePath("/missions");
    const { t } = await getT();
    return { status: "success", message: t("settings.archived", { count }) };
  } catch (error) {
    return errorState(error);
  }
}

export async function changeRoleAction(_: FormState, form: FormData): Promise<FormState> {
  const ctx = await serviceContext();
  try {
    await changeMemberRole(
      getDb(),
      ctx,
      String(form.get("userId") ?? ""),
      String(form.get("role") ?? ""),
    );
  } catch (error) {
    return errorState(error);
  }
  revalidatePath("/organizations/members");
  return { status: "idle" };
}

export async function removeMemberAction(_: FormState, form: FormData): Promise<FormState> {
  const ctx = await serviceContext();
  try {
    await removeMember(getDb(), ctx, String(form.get("userId") ?? ""));
  } catch (error) {
    return errorState(error);
  }
  revalidatePath("/organizations/members");
  return { status: "idle" };
}
