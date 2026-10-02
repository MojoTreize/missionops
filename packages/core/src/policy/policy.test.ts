import { describe, expect, it } from "vitest";

import { ACTIONS, RESOURCES } from "./permissions";
import { ROLES, type Role } from "./roles";
import { can } from "./can";
import type { Action, Permission, Resource } from "./permissions";

/**
 * Table de vérité exhaustive rôle × ressource × action (plan B1.8). Elle est
 * écrite ici indépendamment de la matrice de `matrix.ts` : toute divergence
 * entre l'intention (ce fichier) et l'implémentation fait échouer la CI.
 */
const EXPECTED: Record<Exclude<Role, "admin">, Partial<Record<Resource, readonly Action[]>>> = {
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

function isAllowed(role: Role, resource: Resource, action: Action): boolean {
  if (role === "admin") {
    return true;
  }
  return (EXPECTED[role][resource] ?? []).includes(action);
}

describe("can — table exhaustive rôle × ressource × action", () => {
  for (const role of ROLES) {
    for (const resource of RESOURCES) {
      for (const action of ACTIONS) {
        const expected = isAllowed(role, resource, action);
        const label: Permission = `${resource}:${action}`;
        it(`${role} ${expected ? "peut" : "ne peut pas"} ${label}`, () => {
          expect(can({ role }, action, resource)).toBe(expected);
        });
      }
    }
  }
});

describe("invariants clés", () => {
  it("l'administrateur peut tout", () => {
    for (const resource of RESOURCES) {
      for (const action of ACTIONS) {
        expect(can({ role: "admin" }, action, resource)).toBe(true);
      }
    }
  });

  it("un collaborateur ne peut pas approuver une dépense (route Finance)", () => {
    expect(can({ role: "collaborateur" }, "approve", "expense")).toBe(false);
  });

  it("Finance peut approuver une dépense", () => {
    expect(can({ role: "finance" }, "approve", "expense")).toBe(true);
  });

  it("seul l'administrateur gère les membres et l'organisation", () => {
    for (const role of ROLES) {
      const isAdmin = role === "admin";
      expect(can({ role }, "create", "member")).toBe(isAdmin);
      expect(can({ role }, "delete", "member")).toBe(isAdmin);
      expect(can({ role }, "update", "organisation")).toBe(isAdmin);
    }
  });

  it("le journal d'audit n'est lisible que par Directeur pays et Administrateur", () => {
    for (const role of ROLES) {
      const allowed = role === "directeur_pays" || role === "admin";
      expect(can({ role }, "read", "auditLog")).toBe(allowed);
    }
  });
});
