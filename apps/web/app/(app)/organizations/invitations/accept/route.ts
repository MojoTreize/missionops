import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";

import { getCurrentUser } from "@/lib/auth/current-user";
import { acceptInvitation } from "@/lib/org/queries";

/**
 * Accepte une invitation via le lien reçu par e-mail. Il faut être connecté avec
 * l'adresse invitée ; sinon on renvoie vers la connexion. Le jeton est
 * à usage unique et l'e-mail doit correspondre au compte.
 */
export async function GET(request: NextRequest): Promise<Response> {
  const token = request.nextUrl.searchParams.get("token") ?? "";

  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?next=/organizations/invitations/accept?token=${encodeURIComponent(token)}`);
  }

  const organisationId = token ? await acceptInvitation(token, user.id, user.email) : null;
  if (!organisationId) {
    redirect("/dashboard?invitation=invalide");
  }

  redirect("/dashboard");
}
