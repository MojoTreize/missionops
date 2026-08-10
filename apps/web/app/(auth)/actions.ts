"use server";

import { and, eq, isNull } from "drizzle-orm";
import { redirect } from "next/navigation";

import { users } from "@missionops/db";

import { consumeAuthToken, issueAuthToken } from "@/lib/auth/auth-tokens";
import { AUTH_TOKEN_TYPES, MAGIC_LINK_TTL_MS, PASSWORD_RESET_TTL_MS } from "@/lib/auth/config";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { baseUrl, clientIp, loginRateLimiter, normalizeEmail } from "@/lib/auth/server";
import { createSession, destroySession } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { getT } from "@/lib/i18n/server";
import { sendMagicLinkEmail, sendPasswordResetEmail } from "@/lib/mail";

import type { ActionState } from "./action-state";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function findActiveUserByEmail(email: string) {
  const rows = await getDb()
    .select({ id: users.id, passwordHash: users.passwordHash })
    .from(users)
    .where(and(eq(users.email, email), isNull(users.deletedAt)))
    .limit(1);
  return rows[0] ?? null;
}

/** Demande un lien magique de connexion. Réponse générique (anti-énumération). */
export async function requestMagicLinkAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { t } = await getT();
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  if (!isValidEmail(email)) {
    return { status: "error", message: t("auth.messages.emailInvalid") };
  }

  const user = await findActiveUserByEmail(email);
  if (user) {
    const token = await issueAuthToken(user.id, AUTH_TOKEN_TYPES.magicLink, MAGIC_LINK_TTL_MS);
    const url = `${await baseUrl()}/login/verify?token=${encodeURIComponent(token)}`;
    await sendMagicLinkEmail(email, url);
  }

  return { status: "success", message: t("auth.messages.genericSent") };
}

/** Connexion par mot de passe (voie de secours), avec limitation de débit. */
export async function loginWithPasswordAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { t } = await getT();
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  const password = String(formData.get("password") ?? "");

  if (!isValidEmail(email) || password.length === 0) {
    return { status: "error", message: t("auth.messages.credentialsInvalid") };
  }

  const key = `${email}:${await clientIp()}`;
  if (loginRateLimiter.isLimited(key)) {
    return {
      status: "error",
      message: t("auth.messages.rateLimited"),
    };
  }

  const user = await findActiveUserByEmail(email);
  const ok = user?.passwordHash ? await verifyPassword(password, user.passwordHash) : false;

  if (!ok || !user) {
    loginRateLimiter.record(key);
    return { status: "error", message: t("auth.messages.credentialsIncorrect") };
  }

  loginRateLimiter.reset(key);
  await createSession(user.id);
  redirect("/dashboard");
}

/** Demande un lien de réinitialisation de mot de passe. Réponse générique. */
export async function requestPasswordResetAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { t } = await getT();
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  if (!isValidEmail(email)) {
    return { status: "error", message: t("auth.messages.emailInvalid") };
  }

  const user = await findActiveUserByEmail(email);
  if (user) {
    const token = await issueAuthToken(
      user.id,
      AUTH_TOKEN_TYPES.passwordReset,
      PASSWORD_RESET_TTL_MS,
    );
    const url = `${await baseUrl()}/reset-password?token=${encodeURIComponent(token)}`;
    await sendPasswordResetEmail(email, url);
  }

  return { status: "success", message: t("auth.messages.genericSent") };
}

/** Définit un nouveau mot de passe à partir d'un jeton de réinitialisation. */
export async function resetPasswordAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { t } = await getT();
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("passwordConfirm") ?? "");

  if (password.length < 8) {
    return { status: "error", message: t("auth.messages.passwordTooShort") };
  }
  if (password !== confirm) {
    return { status: "error", message: t("auth.messages.passwordMismatch") };
  }

  const userId = await consumeAuthToken(token, AUTH_TOKEN_TYPES.passwordReset);
  if (!userId) {
    return { status: "error", message: t("auth.messages.resetLinkInvalid") };
  }

  const passwordHash = await hashPassword(password);
  await getDb().update(users).set({ passwordHash }).where(eq(users.id, userId));

  await createSession(userId);
  redirect("/dashboard");
}

/** Déconnexion : révoque la session et renvoie vers la page de connexion. */
export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/login");
}
