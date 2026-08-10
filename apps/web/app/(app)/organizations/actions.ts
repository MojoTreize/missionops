"use server";

import { redirect } from "next/navigation";

import { isRole } from "@missionops/core";

import { getCurrentUser } from "@/lib/auth/current-user";
import { baseUrl, normalizeEmail } from "@/lib/auth/server";
import { generateToken } from "@/lib/auth/tokens";
import { sendInvitationEmail } from "@/lib/mail";
import { can, getActor } from "@/lib/policy";
import { createInvitation, createOrganisation, setCurrentOrganisation } from "@/lib/org/queries";

import type { ActionState } from "./action-state";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/** Crée une organisation et la rend active (l'utilisateur en devient admin). */
export async function createOrganisationAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const name = String(formData.get("name") ?? "").trim();
  const country = String(formData.get("country") ?? "").trim();
  if (name.length < 2) {
    return { status: "error", message: "Le nom de l'organisation est trop court." };
  }

  await createOrganisation(user.id, { name, country: country || null });
  redirect("/dashboard");
}

/** Bascule l'organisation active de l'utilisateur. */
export async function switchOrganisationAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const organisationId = String(formData.get("organisationId") ?? "");
  if (organisationId) {
    await setCurrentOrganisation(user.id, organisationId);
  }
  redirect("/dashboard");
}

/** Invite un membre par e-mail (droit `member:create`, cf. matrice B1.8). */
export async function inviteMemberAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await getActor();
  if (!actor) {
    redirect("/login");
  }
  if (!(await can("create", "member"))) {
    return { status: "error", message: "Votre rôle ne permet pas d'inviter des membres." };
  }

  const email = normalizeEmail(String(formData.get("email") ?? ""));
  if (!isValidEmail(email)) {
    return { status: "error", message: "Adresse e-mail invalide." };
  }

  const requestedRole = String(formData.get("role") ?? "collaborateur");
  const role = isRole(requestedRole) ? requestedRole : "collaborateur";

  const rawToken = generateToken();
  await createInvitation({
    organisationId: actor.organisationId,
    invitedBy: actor.userId,
    email,
    role,
    rawToken,
  });

  const url = `${await baseUrl()}/organizations/invitations/accept?token=${encodeURIComponent(rawToken)}`;
  await sendInvitationEmail(email, url, actor.organisationName);

  return { status: "success", message: `Invitation envoyée à ${email}.` };
}
