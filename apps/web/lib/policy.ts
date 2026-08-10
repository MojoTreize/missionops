import "server-only";

import { redirect } from "next/navigation";

import { can as canForRole, isRole, type Action, type Resource, type Role } from "@missionops/core";

import { getCurrentUser } from "@/lib/auth/current-user";
import { getActiveContext } from "@/lib/org/queries";

/**
 * Pont entre la session et le moteur d'autorisation pur (`@missionops/core`).
 * Le rôle est celui de l'utilisateur dans son organisation active.
 */

export interface ServerActor {
  userId: string;
  organisationId: string;
  organisationName: string;
  role: Role;
}

/** Acteur courant (utilisateur + rôle dans l'organisation active), ou `null`. */
export async function getActor(): Promise<ServerActor | null> {
  const user = await getCurrentUser();
  if (!user) {
    return null;
  }
  const { active } = await getActiveContext(user.id);
  if (!active) {
    return null;
  }
  const role: Role = isRole(active.role) ? active.role : "collaborateur";
  return { userId: user.id, organisationId: active.id, organisationName: active.name, role };
}

/** Vrai si l'acteur courant a le droit demandé. Sert au masquage côté interface. */
export async function can(action: Action, resource: Resource): Promise<boolean> {
  const actor = await getActor();
  return actor ? canForRole({ role: actor.role }, action, resource) : false;
}

/**
 * Garde de route serveur : renvoie l'acteur si le droit est accordé, sinon
 * redirige (vers la connexion si non authentifié, sinon vers `/forbidden`).
 */
export async function requireCan(action: Action, resource: Resource): Promise<ServerActor> {
  const actor = await getActor();
  if (!actor) {
    redirect("/login");
  }
  if (!canForRole({ role: actor.role }, action, resource)) {
    redirect("/forbidden");
  }
  return actor;
}
