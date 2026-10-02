import { describe, expect, it } from "vitest";

import {
  expenseInput,
  fieldErrors,
  formDataToObject,
  fxRateInput,
  missionInput,
  moneyInput,
  orgLocationInput,
  participantInput,
  resetPasswordInput,
  syncBatch,
} from "./index";

const UUID = "3f9c2a1e-8b7d-4c6a-9e5f-1a2b3c4d5e6f";

describe("contrats partagés", () => {
  it("valide une demande de mission et nettoie les champs", () => {
    const parsed = missionInput.parse({
      title: "  Distribution Kindia ",
      purpose: "Distribution de kits d'hygiène",
      destinationCode: "GN-KD",
      destinationLocationId: "",
      startDate: "2026-10-12",
      endDate: "2026-10-15",
      transportMode: "vehicule_org",
      notes: "",
    });
    expect(parsed.title).toBe("Distribution Kindia");
    expect(parsed.destinationLocationId).toBeNull();
    expect(parsed.notes).toBeNull();
  });

  it("refuse destination absente et dates inversées avec des codes stables", () => {
    const result = missionInput.safeParse({
      title: "Mission",
      purpose: "Objet suffisamment long",
      startDate: "2026-10-15",
      endDate: "2026-10-12",
      transportMode: "avion",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = fieldErrors(result.error);
      expect(errors.destinationCode).toBe("destination_required");
      expect(errors.endDate).toBe("dates_order");
    }
  });

  it("lit un montant sans flottant et refuse les décimales GNF", () => {
    expect(moneyInput.parse({ amount: "12,50", currency: "EUR" }).amountMinor).toBe(1250n);
    expect(moneyInput.safeParse({ amount: "10,5", currency: "GNF" }).success).toBe(false);
  });

  it("valide un taux et refuse la même devise", () => {
    expect(
      fxRateInput.safeParse({
        fromCurrency: "EUR",
        toCurrency: "GNF",
        rate: "9350,25",
        effectiveOn: "2026-10-01",
      }).success,
    ).toBe(true);
    expect(
      fxRateInput.safeParse({
        fromCurrency: "EUR",
        toCurrency: "EUR",
        rate: "1",
        effectiveOn: "2026-10-01",
      }).success,
    ).toBe(false);
  });

  it("valide un lieu d'organisation contre le référentiel", () => {
    expect(
      orgLocationInput.safeParse({ name: "Entrepôt", parentCode: "GN-KD", kind: "site" }).success,
    ).toBe(true);
    expect(
      orgLocationInput.safeParse({ name: "Entrepôt", parentCode: "XX", kind: "site" }).success,
    ).toBe(false);
  });

  it("exige l'identité d'un participant", () => {
    expect(participantInput.safeParse({ missionId: UUID, role: "membre" }).success).toBe(false);
    expect(
      participantInput.safeParse({ missionId: UUID, externalName: "Chauffeur", role: "chauffeur" })
        .success,
    ).toBe(true);
  });

  it("valide un lot de synchronisation", () => {
    const batch = syncBatch.safeParse({
      items: [
        {
          type: "expense",
          payload: {
            id: UUID,
            missionId: UUID,
            category: "transport",
            description: "Taxi",
            amount: "50000",
            currency: "GNF",
            spentOn: "2026-10-13",
          },
        },
      ],
    });
    expect(batch.success).toBe(true);
    expect(syncBatch.safeParse({ items: [] }).success).toBe(false);
    expect(expenseInput.safeParse({ id: "pas-un-uuid" }).success).toBe(false);
  });

  it("vérifie la confirmation du mot de passe", () => {
    const r = resetPasswordInput.safeParse({
      token: "x".repeat(20),
      password: "motdepasse-long",
      passwordConfirm: "autre",
    });
    expect(r.success).toBe(false);
  });

  it("convertit un FormData", () => {
    const form = new FormData();
    form.set("a", "1");
    form.set("b", "2");
    expect(formDataToObject(form)).toEqual({ a: "1", b: "2" });
  });
});
