"use server";

import { revalidatePath } from "next/cache";

import { isPlan, setSubscription } from "@missionops/services";

import { isPlatformAdmin } from "@/lib/admin";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getDb } from "@/lib/db";
import type { FormState } from "@/lib/server/form-state";

/** Console interne (B9.6) : suspendre, réactiver, changer de plan. */
export async function subscriptionAction(_: FormState, form: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user || !isPlatformAdmin(user.email)) return { status: "error", message: "forbidden" };
  const organisationId = String(form.get("organisationId") ?? "");
  const status = form.get("status") === "suspendue" ? "suspendue" : "active";
  const plan = String(form.get("plan") ?? "");
  await setSubscription(
    getDb(),
    organisationId,
    user.id,
    { status, plan: isPlan(plan) ? plan : undefined },
    new Date(),
  );
  revalidatePath("/admin");
  return { status: "idle" };
}
