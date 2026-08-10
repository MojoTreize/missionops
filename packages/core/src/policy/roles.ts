/**
 * Les six rôles de base (plan B1.8). La clé technique est en `snake_case`
 * minuscule et sert de valeur stockée dans `memberships.role` ; le libellé sert
 * à l'affichage.
 */
export const ROLES = [
  "collaborateur",
  "manager",
  "logisticien",
  "finance",
  "directeur_pays",
  "admin",
] as const;

export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  collaborateur: "Collaborateur",
  manager: "Manager",
  logisticien: "Logisticien",
  finance: "Finance",
  directeur_pays: "Directeur pays",
  admin: "Administrateur",
};

export function isRole(value: string): value is Role {
  return (ROLES as readonly string[]).includes(value);
}
