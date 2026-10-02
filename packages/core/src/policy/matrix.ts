import {
  ACTIONS,
  RESOURCES,
  permission,
  type Action,
  type Permission,
  type Resource,
} from "./permissions";
import { ROLES, type Role } from "./roles";

/**
 * Matrice de permissions, source unique de vérité. Elle se lit ressource par
 * ressource : pour chaque rôle, la liste des actions autorisées. L'administrateur
 * a tous les droits ; le tableau ci-dessous ne décrit donc que les cinq autres
 * rôles. Toute évolution ici doit être reflétée dans le test exhaustif.
 */
const GRANTS: Record<Exclude<Role, "admin">, Partial<Record<Resource, readonly Action[]>>> = {
  collaborateur: {
    mission: ["create", "read", "update"],
    expense: ["create", "read"],
    receipt: ["create", "read"],
    member: ["read"],
    organisation: ["read"],
    location: ["read"],
    fxRate: ["read"],
    missionEvent: ["create", "read"],
  },
  manager: {
    mission: ["create", "read", "update", "approve"],
    expense: ["create", "read", "update"],
    advance: ["read"],
    receipt: ["create", "read"],
    member: ["read"],
    organisation: ["read"],
    approvalFlow: ["read"],
    location: ["read"],
    fxRate: ["read"],
    report: ["read"],
    missionEvent: ["create", "read"],
  },
  logisticien: {
    mission: ["create", "read", "update"],
    expense: ["read"],
    advance: ["read"],
    receipt: ["create", "read", "update"],
    member: ["read"],
    organisation: ["read"],
    approvalFlow: ["read"],
    location: ["create", "read", "update", "delete"],
    fxRate: ["read"],
    missionEvent: ["create", "read"],
  },
  finance: {
    mission: ["read", "approve"],
    expense: ["create", "read", "update", "approve", "export"],
    advance: ["create", "read", "update", "approve", "export"],
    receipt: ["read"],
    member: ["read"],
    organisation: ["read"],
    approvalFlow: ["read"],
    location: ["read"],
    fxRate: ["create", "read", "update"],
    report: ["read", "export"],
    missionEvent: ["read"],
  },
  directeur_pays: {
    mission: ["read", "approve", "export"],
    expense: ["read", "approve", "export"],
    advance: ["create", "read", "approve", "export"],
    receipt: ["read"],
    member: ["read"],
    organisation: ["read"],
    approvalFlow: ["read"],
    auditLog: ["read"],
    location: ["create", "read", "update", "delete"],
    fxRate: ["read"],
    report: ["read", "export"],
    missionEvent: ["read"],
  },
};

function buildRole(grants: Partial<Record<Resource, readonly Action[]>>): ReadonlySet<Permission> {
  const set = new Set<Permission>();
  for (const resource of RESOURCES) {
    for (const action of grants[resource] ?? []) {
      set.add(permission(resource, action));
    }
  }
  return set;
}

function allPermissions(): ReadonlySet<Permission> {
  const set = new Set<Permission>();
  for (const resource of RESOURCES) {
    for (const action of ACTIONS) {
      set.add(permission(resource, action));
    }
  }
  return set;
}

export const PERMISSIONS: Record<Role, ReadonlySet<Permission>> = ROLES.reduce(
  (acc, role) => {
    acc[role] = role === "admin" ? allPermissions() : buildRole(GRANTS[role]);
    return acc;
  },
  {} as Record<Role, ReadonlySet<Permission>>,
);
