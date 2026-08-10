import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";

import { consumeAuthToken } from "@/lib/auth/auth-tokens";
import { AUTH_TOKEN_TYPES } from "@/lib/auth/config";
import { createSession } from "@/lib/auth/session";

/**
 * Vérifie un lien magique : consomme le jeton (usage unique), ouvre une session
 * et redirige. Un lien expiré, déjà utilisé ou invalide renvoie vers la page de
 * connexion avec une erreur explicite.
 */
export async function GET(request: NextRequest): Promise<Response> {
  const token = request.nextUrl.searchParams.get("token") ?? "";
  const userId = await consumeAuthToken(token, AUTH_TOKEN_TYPES.magicLink);

  if (!userId) {
    redirect("/login?error=lien-invalide");
  }

  await createSession(userId);
  redirect("/dashboard");
}
