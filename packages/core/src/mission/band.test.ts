import { describe, expect, it } from "vitest";

import { money } from "../money";
import { MISSION_STATUSES, missionBand } from "./index";

const states = (input: Parameters<typeof missionBand>[0]) =>
  missionBand(input)
    .steps.map((s) => s.state[0])
    .join("");

describe("bande de mission — chaque combinaison d'états", () => {
  const base = { hasAdvance: false, reconciliationStatus: null, balance: null } as const;
  it("suit la boucle de la demande à la clôture", () => {
    expect(states({ ...base, status: "BROUILLON" })).toBe("cuuuuu");
    expect(states({ ...base, status: "SOUMISE" })).toBe("dcuuuu");
    expect(states({ ...base, status: "VALIDEE" })).toBe("ddcuuu");
    expect(states({ ...base, status: "VALIDEE", hasAdvance: true })).toBe("dddcuu");
    expect(states({ ...base, status: "EN_COURS", hasAdvance: true })).toBe("dddcuu");
    expect(states({ ...base, status: "TERMINEE", hasAdvance: true })).toBe("ddddcu");
    expect(states({ ...base, status: "CLOTUREE", hasAdvance: true })).toBe("dddddd");
  });
  it("marque l'arrêt d'une mission rejetée ou annulée", () => {
    expect(states({ ...base, status: "REJETEE" })).toBe("dsuuuu");
    expect(states({ ...base, status: "ANNULEE" })).toBe("dsuuuu");
    expect(states({ ...base, status: "ANNULEE", hasAdvance: true })).toBe("dddsuu");
  });
  it("a exactement six étapes pour tous les statuts et porte le solde", () => {
    for (const status of MISSION_STATUSES) {
      for (const hasAdvance of [true, false]) {
        const band = missionBand({ ...base, status, hasAdvance, balance: money(150000, "GNF") });
        expect(band.steps).toHaveLength(6);
        expect(
          band.steps.filter((s) => s.state === "current" || s.state === "stopped").length,
        ).toBeLessThanOrEqual(1);
        expect(band.balance?.amountMinor).toBe(150000n);
      }
    }
  });
});
