import { describe, expect, it } from "vitest";

import { ROLES } from "../policy";
import {
  MISSION_EVENTS,
  MISSION_STATUSES,
  MissionTransitionError,
  TRANSITIONS,
  availableEvents,
  durationDays,
  formatMissionReference,
  isEditable,
  isIsoDate,
  isMissionStatus,
  isSubstantialChange,
  periodsOverlap,
  transition,
  validateDraft,
  validateParticipants,
  type MissionEvent,
  type MissionStatus,
  type TransitionContext,
} from "./index";

const REQUESTER = "u-requester";
const now = new Date("2026-10-02T09:00:00Z");

/** Contexte où toutes les gardes sont satisfaites, par un administrateur tiers. */
function adminContext(): TransitionContext {
  return {
    actor: { userId: "u-admin", role: "admin" },
    now,
    comment: "motif",
    guards: { draftValid: true, approvalComplete: true, reconciliationValidated: true },
  };
}

const EXPECTED: Record<MissionEvent, Partial<Record<MissionStatus, MissionStatus>>> = {
  submit: { BROUILLON: "SOUMISE" },
  approve: { SOUMISE: "VALIDEE" },
  reject: { SOUMISE: "REJETEE" },
  rework: { REJETEE: "BROUILLON", SOUMISE: "BROUILLON" },
  revise: { VALIDEE: "SOUMISE" },
  start: { VALIDEE: "EN_COURS" },
  finish: { EN_COURS: "TERMINEE" },
  close: { TERMINEE: "CLOTUREE" },
  cancel: { BROUILLON: "ANNULEE", SOUMISE: "ANNULEE", VALIDEE: "ANNULEE" },
};

describe("machine à états — toutes les paires état × événement", () => {
  for (const status of MISSION_STATUSES) {
    for (const event of MISSION_EVENTS) {
      const expected = EXPECTED[event][status];
      it(`${status} × ${event} → ${expected ?? "TRANSITION_INTERDITE"}`, () => {
        const subject = { status, requesterId: REQUESTER };
        if (expected) {
          expect(transition(subject, event, adminContext()).to).toBe(expected);
        } else {
          try {
            transition(subject, event, adminContext());
            expect.unreachable();
          } catch (error) {
            expect(error).toBeInstanceOf(MissionTransitionError);
            expect((error as MissionTransitionError).code).toBe("TRANSITION_INTERDITE");
          }
        }
      });
    }
  }

  it("la table déclarée correspond à la table attendue", () => {
    expect(TRANSITIONS).toEqual(EXPECTED);
  });

  it("aucune transition ne sort d'un état terminal", () => {
    expect(availableEvents("CLOTUREE")).toEqual([]);
    expect(availableEvents("ANNULEE")).toEqual([]);
  });
});

function codeOf(fn: () => unknown): string {
  try {
    fn();
  } catch (error) {
    return (error as MissionTransitionError).code;
  }
  return "OK";
}

describe("machine à états — droits", () => {
  it("le demandeur collaborateur soumet, reprend et annule sa demande", () => {
    const actor = { userId: REQUESTER, role: "collaborateur" as const };
    const ctx = { actor, now, comment: "x", guards: { draftValid: true } };
    expect(transition({ status: "BROUILLON", requesterId: REQUESTER }, "submit", ctx).to).toBe(
      "SOUMISE",
    );
    expect(transition({ status: "SOUMISE", requesterId: REQUESTER }, "rework", ctx).to).toBe(
      "BROUILLON",
    );
    expect(transition({ status: "VALIDEE", requesterId: REQUESTER }, "cancel", ctx).to).toBe(
      "ANNULEE",
    );
  });

  it("un collaborateur ne soumet pas la demande d'un autre", () => {
    const actor = { userId: "autre", role: "collaborateur" as const };
    expect(
      codeOf(() =>
        transition({ status: "BROUILLON", requesterId: REQUESTER }, "submit", { actor, now }),
      ),
    ).toBe("OK"); // collaborateur a mission:update (propriété vérifiée par le service)
  });

  it("le demandeur ne valide jamais sa propre mission, même manager", () => {
    const actor = { userId: REQUESTER, role: "manager" as const };
    expect(
      codeOf(() =>
        transition({ status: "SOUMISE", requesterId: REQUESTER }, "approve", {
          actor,
          now,
          guards: { approvalComplete: true },
        }),
      ),
    ).toBe("DROIT_INSUFFISANT");
  });

  it("seuls les rôles ayant mission:approve valident", () => {
    const allowed = ROLES.filter(
      (role) =>
        codeOf(() =>
          transition({ status: "SOUMISE", requesterId: REQUESTER }, "approve", {
            actor: { userId: "tiers", role },
            now,
            guards: { approvalComplete: true },
          }),
        ) === "OK",
    );
    expect(allowed).toEqual(["manager", "finance", "directeur_pays", "admin"]);
  });

  it("la clôture est réservée à la finance (expense:approve)", () => {
    const ctx = (role: (typeof ROLES)[number]) => ({
      actor: { userId: "tiers", role },
      now,
      guards: { reconciliationValidated: true },
    });
    const subject = { status: "TERMINEE" as const, requesterId: REQUESTER };
    expect(codeOf(() => transition(subject, "close", ctx("finance")))).toBe("OK");
    expect(codeOf(() => transition(subject, "close", ctx("manager")))).toBe("DROIT_INSUFFISANT");
  });
});

describe("machine à états — gardes et erreurs nommées", () => {
  const admin = { userId: "u-admin", role: "admin" as const };
  it("refuse une demande incomplète", () => {
    expect(
      codeOf(() =>
        transition({ status: "BROUILLON", requesterId: REQUESTER }, "submit", {
          actor: admin,
          now,
          guards: { draftValid: false },
        }),
      ),
    ).toBe("DEMANDE_INCOMPLETE");
  });
  it("refuse la validation finale sans circuit complet", () => {
    expect(
      codeOf(() =>
        transition({ status: "SOUMISE", requesterId: REQUESTER }, "approve", { actor: admin, now }),
      ),
    ).toBe("VALIDATION_INCOMPLETE");
  });
  it("refuse la clôture sans réconciliation validée", () => {
    expect(
      codeOf(() =>
        transition({ status: "TERMINEE", requesterId: REQUESTER }, "close", { actor: admin, now }),
      ),
    ).toBe("RECONCILIATION_NON_VALIDEE");
  });
  it("exige un motif pour rejeter ou annuler", () => {
    for (const [status, event] of [
      ["SOUMISE", "reject"],
      ["BROUILLON", "cancel"],
    ] as const) {
      expect(
        codeOf(() =>
          transition({ status, requesterId: REQUESTER }, event, {
            actor: admin,
            now,
            comment: "   ",
          }),
        ),
      ).toBe("MOTIF_OBLIGATOIRE");
    }
  });
  it("renvoie l'entrée d'historique complète", () => {
    const record = transition({ status: "SOUMISE", requesterId: REQUESTER }, "reject", {
      actor: admin,
      now,
      comment: "  Budget trop élevé ",
    });
    expect(record).toEqual({
      from: "SOUMISE",
      to: "REJETEE",
      event: "reject",
      actorId: "u-admin",
      comment: "Budget trop élevé",
      at: now,
    });
  });
  it("reconnaît les statuts", () => {
    expect(isMissionStatus("VALIDEE")).toBe(true);
    expect(isMissionStatus("validee")).toBe(false);
  });
});

describe("règles de la demande", () => {
  const draft = {
    title: "Distribution kits Kindia",
    purpose: "Distribution de kits d'hygiène aux centres de santé",
    destinationCode: "GN-KD",
    destinationLocationId: null,
    startDate: "2026-10-12",
    endDate: "2026-10-15",
    transportMode: "vehicule_org" as const,
  };

  it("accepte une demande complète", () => {
    expect(validateDraft(draft)).toEqual([]);
  });

  it("signale chaque manque", () => {
    expect(
      validateDraft({
        ...draft,
        title: "x",
        purpose: "court",
        destinationCode: null,
        transportMode: null,
      }),
    ).toEqual(["title_required", "purpose_required", "destination_required", "transport_required"]);
    expect(validateDraft({ ...draft, destinationCode: "GN-ZZ" })).toEqual(["destination_unknown"]);
    expect(validateDraft({ ...draft, startDate: "2026-02-30" })).toEqual(["dates_invalid"]);
    expect(validateDraft({ ...draft, endDate: "2026-10-01" })).toEqual(["dates_order"]);
    expect(validateDraft({ ...draft, endDate: "2027-03-01" })).toEqual(["duration_too_long"]);
    expect(
      validateDraft({ ...draft, destinationCode: null, destinationLocationId: "loc-1" }),
    ).toEqual([]);
  });

  it("calcule les durées et dates ISO", () => {
    expect(durationDays("2026-10-12", "2026-10-12")).toBe(1);
    expect(durationDays("2026-10-12", "2026-10-15")).toBe(4);
    expect(isIsoDate("2026-13-01")).toBe(false);
    expect(isIsoDate("2026-1-01")).toBe(false);
  });

  it("détecte les modifications substantielles et les états modifiables", () => {
    expect(isSubstantialChange(draft, { ...draft })).toBe(false);
    expect(isSubstantialChange(draft, { ...draft, endDate: "2026-10-16" })).toBe(true);
    expect(isSubstantialChange(draft, { ...draft, destinationCode: "GN-CO" })).toBe(true);
    expect(isEditable("BROUILLON")).toBe(true);
    expect(isEditable("VALIDEE")).toBe(true);
    expect(isEditable("EN_COURS")).toBe(false);
  });

  it("formate la référence", () => {
    expect(formatMissionReference(2026, 42)).toBe("MIS-2026-0042");
  });

  it("détecte les chevauchements de périodes", () => {
    const a = { startDate: "2026-10-12", endDate: "2026-10-15" };
    expect(periodsOverlap(a, { startDate: "2026-10-15", endDate: "2026-10-20" })).toBe(true);
    expect(periodsOverlap(a, { startDate: "2026-10-16", endDate: "2026-10-20" })).toBe(false);
  });
});

describe("participants", () => {
  it("accepte une équipe valide", () => {
    expect(
      validateParticipants([
        { userId: "u1", externalName: null, role: "chef_mission" },
        { userId: "u2", externalName: null, role: "membre" },
        { userId: null, externalName: "Sékou Condé", role: "chauffeur" },
      ]),
    ).toEqual([]);
  });

  it("refuse doublons, identité absente et deux chefs", () => {
    expect(
      validateParticipants([
        { userId: "u1", externalName: null, role: "chef_mission" },
        { userId: "u1", externalName: null, role: "membre" },
        { userId: null, externalName: "  ", role: "externe" },
        { userId: "u3", externalName: null, role: "chef_mission" },
      ]).sort(),
    ).toEqual(["duplicate", "identity_required", "single_chef"]);
  });
});
