/**
 * Ressources protégées et actions possibles. Une permission est la paire
 * `ressource:action` (par exemple `expense:approve`). Ces ressources couvrent le
 * domaine à venir ; la matrice (`matrix.ts`) fixe qui peut quoi.
 */
export const RESOURCES = [
  "mission",
  "expense",
  "advance",
  "receipt",
  "member",
  "organisation",
  "approvalFlow",
  "auditLog",
  "location",
  "fxRate",
  "report",
  "missionEvent",
] as const;

export type Resource = (typeof RESOURCES)[number];

export const ACTIONS = ["create", "read", "update", "delete", "approve", "export"] as const;

export type Action = (typeof ACTIONS)[number];

export type Permission = `${Resource}:${Action}`;

export function permission(resource: Resource, action: Action): Permission {
  return `${resource}:${action}`;
}
