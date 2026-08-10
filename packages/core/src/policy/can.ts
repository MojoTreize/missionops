import { PERMISSIONS } from "./matrix";
import { permission, type Action, type Resource } from "./permissions";
import type { Role } from "./roles";

/**
 * Un acteur, du point de vue des permissions : uniquement son rôle dans
 * l'organisation active. Le domaine reste pur — aucune notion de session ni de
 * base ici.
 */
export interface Actor {
  role: Role;
}

/**
 * `can(acteur, action, ressource)` — seule porte d'autorisation du produit.
 * Toute mutation côté serveur doit passer par elle (plan B1.8).
 */
export function can(actor: Actor, action: Action, resource: Resource): boolean {
  return PERMISSIONS[actor.role].has(permission(resource, action));
}
