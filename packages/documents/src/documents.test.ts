import { readFileSync } from "node:fs";

import { PDFDocument } from "pdf-lib";
import { describe, expect, it } from "vitest";

import { missionBand, money } from "@missionops/core";

import { bandShape, bandToSvg, renderDocument, sanitize, sha256, type DocumentData } from "./index";

const t = (key: string, params?: Record<string, string | number>) =>
  params ? `${key} ${JSON.stringify(params)}` : key;

const PNG = new Uint8Array(readFileSync(new URL("./fixtures/recu.png", import.meta.url)));

function fixture(): DocumentData {
  const gnf = (n: number) => money(n, "GNF");
  return {
    locale: "fr",
    generatedAt: new Date("2026-10-02T10:00:00Z"),
    generatedByName: "Aïssatou Bah",
    org: {
      name: "Croix-Rouge Guinée",
      header: null,
      footer: "Siège : Conakry",
      signatureLabels: ["Le demandeur", "La direction"],
      baseCurrency: "GNF",
    },
    mission: {
      reference: "MIS-2026-0001",
      title: "Distribution de kits d'hygiène à Kindia",
      purpose:
        "Distribution de 400 kits d'hygiène – centres de santé de Kindia, Friguiagbé et Mambia.",
      status: "Clôturée",
      destination: "Kindia",
      startDate: "2026-08-23",
      endDate: "2026-08-26",
      durationDays: 4,
      transport: "Véhicule de l'organisation",
      requesterName: "Sékou Keïta",
      notes: null,
      participants: [{ name: "Sékou Keïta", role: "Chef de mission" }],
      approvals: [
        {
          step: "Étape 1 — Manager",
          decision: "Validée",
          deciderName: "Fatoumata Camara",
          comment: null,
          at: new Date("2026-08-20T09:00:00Z"),
        },
      ],
      history: [
        {
          text: "Sékou Keïta a soumis la demande",
          comment: null,
          at: new Date("2026-08-19T09:00:00Z"),
        },
      ],
    },
    budget: [
      {
        category: "Hébergement",
        label: "Hôtel",
        quantity: 3,
        unitAmount: gnf(350_000),
        totalBase: gnf(1_050_000),
      },
    ],
    budgetTotal: gnf(1_050_000),
    advances: [
      {
        beneficiaryName: "Sékou Keïta",
        amount: gnf(1_000_000),
        amountBase: gnf(1_000_000),
        paidOn: "2026-08-22",
        method: "Espèces",
        reference: null,
        isReversal: false,
      },
    ],
    advancesTotal: gnf(1_000_000),
    expenses: Array.from({ length: 60 }, (_, i) => ({
      id: `e${i}`,
      spentOn: "2026-08-24",
      category: "Transport",
      description: `Taxi-moto n° ${i} vers le centre de santé`,
      spentByName: "Sékou Keïta",
      amount: gnf(20_000),
      amountBase: gnf(20_000),
      rate: "1",
      status: "Approuvée",
      receiptCount: i % 2,
      receiptMissingReason: i % 2 ? null : "Aucun reçu délivré",
      outOfPeriod: false,
    })),
    reconciliation: {
      status: "Validée",
      advances: gnf(1_000_000),
      approvedExpenses: gnf(1_200_000),
      balance: gnf(-200_000),
      directionText: "L'organisation doit rembourser 200 000 GNF",
      submittedAt: null,
      validatedAt: new Date("2026-08-30T09:00:00Z"),
      validatedByName: "Aïssatou Bah",
      settlement: "Espèces",
      variances: [
        {
          category: "Transport",
          planned: gnf(0),
          actual: gnf(1_200_000),
          justification: "Non prévu",
        },
      ],
    },
    report: {
      summary: "400 kits distribués.",
      results: null,
      difficulties: "Piste dégradée.",
      recommendations: null,
    },
    events: [{ at: new Date("2026-08-23T06:00:00Z"), kind: "Départ", note: "Conakry" }],
    receipts: [
      {
        id: "r1",
        expenseDescription: "Hôtel",
        mimeType: "image/png",
        sha256: sha256(PNG),
        bytes: PNG,
      },
    ],
  };
}

describe("documents PDF", () => {
  for (const kind of ["ordre_mission", "mission_pack", "closure_pack"] as const) {
    it(`${kind} : PDF valide et déterministe`, async () => {
      const a = await renderDocument(kind, fixture(), t);
      const b = await renderDocument(kind, fixture(), t);
      expect(Buffer.from(a.slice(0, 5)).toString()).toBe("%PDF-");
      expect(sha256(a)).toBe(sha256(b));
      const parsed = await PDFDocument.load(a);
      expect(parsed.getPageCount()).toBeGreaterThan(0);
      expect(parsed.getTitle()).toContain("MIS-2026-0001");
    });
  }

  it("le Closure Pack paginé contient toutes les dépenses et l'annexe des justificatifs", async () => {
    const bytes = await renderDocument("closure_pack", fixture(), t);
    const pdf = await PDFDocument.load(bytes);
    expect(pdf.getPageCount()).toBeGreaterThanOrEqual(3);
    // Le justificatif est réellement intégré comme image (et non remplacé par un texte d'erreur).
    expect(Buffer.from(bytes).toString("latin1")).toContain("/Subtype /Image");
  });

  it("nettoie les caractères hors WinAnsi", () => {
    expect(sanitize("1 250 000 GNF")).toBe("1 250 000 GNF");
    expect(sanitize("l’avance → validée…")).toBe("l'avance -> validée...");
    expect(sanitize("Œuvre 12 €")).toBe("Œuvre 12 €");
    expect(sanitize("漢")).toBe("?");
  });
});

describe("bande de mission (B5.4) — deux rendus, une géométrie", () => {
  const labels = ["Demande", "Validation", "Avance", "Terrain", "Réconciliation", "Clôture"];
  it("rend un SVG autonome et échappé", () => {
    const model = missionBand({
      status: "EN_COURS",
      hasAdvance: true,
      reconciliationStatus: null,
      balance: null,
    });
    const svg = bandToSvg(bandShape(model, labels, null), "Bande <mission>");
    expect(svg.match(/<circle/g)).toHaveLength(6);
    expect(svg).toContain("Bande &lt;mission&gt;");
    expect(svg).not.toContain("<script");
  });

  it("dessine la même bande dans le PDF pour chaque statut", async () => {
    for (const status of [
      "BROUILLON",
      "SOUMISE",
      "VALIDEE",
      "EN_COURS",
      "TERMINEE",
      "CLOTUREE",
      "REJETEE",
      "ANNULEE",
    ] as const) {
      const model = missionBand({
        status,
        hasAdvance: true,
        reconciliationStatus: null,
        balance: money(-200_000, "GNF"),
      });
      const data = { ...fixture(), band: bandShape(model, labels, "Solde : -200 000 GNF") };
      const pdf = await renderDocument("ordre_mission", data, t);
      expect(Buffer.from(pdf.slice(0, 5)).toString()).toBe("%PDF-");
    }
  });
});
