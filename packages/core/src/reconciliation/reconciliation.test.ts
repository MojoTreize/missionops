import { describe, expect, it } from "vitest";

import {
  budgetByCategory,
  budgetTotalBase,
  isExpenseCategory,
  lineTotal,
  totalsByCategory,
  trackBudget,
  validateBudgetLine,
  type BudgetLine,
} from "../budget";
import { canDecideExpense, checkAdvance, checkExpense } from "../expense";
import { identityRate, money, parseRate } from "../money";
import {
  checkSubmission,
  checkValidation,
  reconcile,
  variancesToJustify,
  type ExpenseEntry,
} from "./index";

const gnf = (n: number) => money(n, "GNF");

describe("budget prévisionnel multi-devises", () => {
  const lines: BudgetLine[] = [
    {
      category: "hebergement",
      quantity: 3,
      unitAmount: gnf(350_000),
      rateToBase: identityRate("GNF"),
    },
    {
      category: "transport",
      quantity: 1,
      unitAmount: money(12_000, "EUR"),
      rateToBase: parseRate("9350", "EUR", "GNF"),
    },
    {
      category: "hebergement",
      quantity: 1,
      unitAmount: gnf(50_000),
      rateToBase: identityRate("GNF"),
    },
  ];

  it("totalise en devise de base au taux figé de chaque ligne", () => {
    expect(lineTotal(lines[0]!)).toEqual(gnf(1_050_000));
    // 120,00 € × 9350 = 1 122 000 GNF
    expect(budgetTotalBase(lines, "GNF")).toEqual(gnf(1_050_000 + 1_122_000 + 50_000));
    expect(budgetByCategory(lines, "GNF").get("hebergement")).toEqual(gnf(1_100_000));
  });

  it("valide une ligne", () => {
    expect(validateBudgetLine(lines[1]!, "GNF")).toEqual([]);
    expect(
      validateBudgetLine(
        { ...lines[1]!, quantity: 0, unitAmount: money(0, "EUR"), rateToBase: identityRate("EUR") },
        "GNF",
      ),
    ).toEqual(["quantity", "amount", "rate"]);
    expect(isExpenseCategory("perdiem")).toBe(true);
    expect(isExpenseCategory("bijoux")).toBe(false);
  });

  it("suit la consommation par catégorie avec alertes", () => {
    const planned = new Map([
      ["hebergement", gnf(1_000_000)],
      ["transport", gnf(1_000_000)],
      ["restauration", gnf(500_000)],
    ] as const);
    const actual = totalsByCategory(
      [
        { category: "hebergement", amountBase: gnf(850_000) },
        { category: "transport", amountBase: gnf(1_200_000) },
        { category: "communication", amountBase: gnf(20_000) },
      ],
      "GNF",
    );
    const tracking = trackBudget(planned, actual, "GNF");
    expect(tracking.map((t) => [t.category, t.level, t.consumptionBp])).toEqual([
      ["transport", "over", 12000],
      ["hebergement", "warning", 8500],
      ["restauration", "ok", 0],
      ["communication", "over", null],
    ]);
  });
});

describe("avances", () => {
  const base = {
    missionStatus: "VALIDEE" as const,
    amountBase: gnf(1_000_000),
    existingBase: gnf(0),
    budgetBase: gnf(2_000_000),
    directorApproved: false,
  };
  it("accepte une avance sur mission validée", () => {
    expect(checkAdvance(base)).toEqual([]);
  });
  it("refuse sur mission non validée et montant nul", () => {
    expect(checkAdvance({ ...base, missionStatus: "SOUMISE", amountBase: gnf(0) })).toEqual([
      "mission_status",
      "amount",
    ]);
  });
  it("déclenche le seuil de 120 % sauf validation du Directeur pays", () => {
    const over = { ...base, existingBase: gnf(1_500_000) }; // 2,5 M > 2,4 M
    expect(checkAdvance(over)).toEqual(["ceiling_requires_director"]);
    expect(checkAdvance({ ...over, directorApproved: true })).toEqual([]);
    expect(checkAdvance({ ...base, existingBase: gnf(1_400_000) })).toEqual([]); // = 2,4 M
  });
});

describe("dépenses", () => {
  const mission = { status: "EN_COURS" as const, startDate: "2026-10-12", endDate: "2026-10-15" };
  const draft = {
    category: "restauration" as const,
    description: "Déjeuner équipe",
    amount: gnf(150_000),
    spentOn: "2026-10-13",
    hasReceipt: true,
    receiptMissingReason: null,
  };
  it("accepte une dépense justifiée dans la période", () => {
    expect(checkExpense(draft, mission)).toEqual({ issues: [], warnings: [] });
  });
  it("exige un justificatif ou un motif, sauf per diem", () => {
    expect(checkExpense({ ...draft, hasReceipt: false }, mission).issues).toEqual([
      "receipt_or_reason",
    ]);
    expect(
      checkExpense({ ...draft, hasReceipt: false, receiptMissingReason: "Taxi-moto" }, mission)
        .issues,
    ).toEqual([]);
    expect(
      checkExpense({ ...draft, category: "perdiem", hasReceipt: false }, mission).issues,
    ).toEqual([]);
  });
  it("signale une dépense hors période (avec tolérance)", () => {
    expect(checkExpense({ ...draft, spentOn: "2026-10-11" }, mission).warnings).toEqual([]);
    expect(checkExpense({ ...draft, spentOn: "2026-10-17" }, mission).warnings).toEqual([]);
    expect(checkExpense({ ...draft, spentOn: "2026-10-10" }, mission).warnings).toEqual([
      "out_of_period",
    ]);
    expect(checkExpense({ ...draft, spentOn: "2026-10-18" }, mission).warnings).toEqual([
      "out_of_period",
    ]);
  });
  it("refuse les saisies invalides", () => {
    expect(
      checkExpense(
        { ...draft, amount: gnf(0), description: " ", spentOn: "13/10/2026" },
        { ...mission, status: "BROUILLON" },
      ).issues,
    ).toEqual(["mission_status", "amount", "description", "date_invalid"]);
  });
  it("seule une dépense soumise se décide", () => {
    expect(canDecideExpense("soumise")).toBe(true);
    expect(canDecideExpense("approuvee")).toBe(false);
  });
});

describe("réconciliation de l'avance", () => {
  const expenses: ExpenseEntry[] = [
    {
      id: "e1",
      category: "hebergement",
      status: "approuvee",
      amountBase: gnf(900_000),
      hasReceipt: true,
      outOfPeriod: false,
    },
    {
      id: "e2",
      category: "transport",
      status: "approuvee",
      amountBase: gnf(400_000),
      hasReceipt: false,
      outOfPeriod: true,
    },
    {
      id: "e3",
      category: "restauration",
      status: "rejetee",
      amountBase: gnf(80_000),
      hasReceipt: false,
      outOfPeriod: false,
    },
  ];

  it("avance supérieure aux dépenses : l'agent reverse", () => {
    const r = reconcile([{ amountBase: gnf(1_500_000) }], expenses, "GNF");
    expect(r.balance).toEqual(gnf(200_000));
    expect(r.direction).toBe("agent_reverse");
    expect(r.rejectedExpenses).toEqual(gnf(80_000));
    expect(r.missingReceipts).toEqual(["e2"]);
    expect(r.outOfPeriod).toEqual(["e2"]);
  });

  it("avance inférieure : l'organisation rembourse ; écriture inverse prise en compte", () => {
    const r = reconcile(
      [{ amountBase: gnf(1_500_000) }, { amountBase: gnf(-500_000) }],
      expenses,
      "GNF",
    );
    expect(r.advances).toEqual(gnf(1_000_000));
    expect(r.balance).toEqual(gnf(-300_000));
    expect(r.direction).toBe("org_rembourse");
  });

  it("solde nul", () => {
    expect(reconcile([{ amountBase: gnf(1_300_000) }], expenses, "GNF").direction).toBe("solde");
  });

  it("bloque la soumission tant que des dépenses sont en attente ou non justifiées", () => {
    const pending = reconcile(
      [{ amountBase: gnf(1_000_000) }],
      [...expenses, { ...expenses[0]!, id: "e4", status: "soumise" }],
      "GNF",
    );
    const variances = variancesToJustify(
      trackBudget(
        new Map([["hebergement", gnf(500_000)]]),
        new Map([["hebergement", gnf(900_000)]]),
        "GNF",
      ),
      50_000n,
    );
    expect(variances.map((v) => [v.category, v.differenceBp])).toEqual([["hebergement", 8000]]);
    expect(
      checkSubmission({
        reconciliation: pending,
        variances,
        justifiedCategories: new Set(),
        explainedMissingReceipts: new Set(),
      }),
    ).toEqual(["pending_expenses", "unjustified_variances", "missing_receipt_reasons"]);
  });

  it("ignore les petits écarts et ceux sous 10 %", () => {
    const tracking = trackBudget(
      new Map([
        ["hebergement", gnf(1_000_000)],
        ["transport", gnf(100_000)],
      ]),
      new Map([
        ["hebergement", gnf(1_050_000)],
        ["transport", gnf(130_000)],
        ["communication", gnf(200_000)],
      ]),
      "GNF",
    );
    expect(variancesToJustify(tracking, 50_000n).map((v) => v.category)).toEqual(["communication"]);
  });

  it("validation financière : règlement et séparation des tâches", () => {
    const r = reconcile([{ amountBase: gnf(1_500_000) }], expenses, "GNF");
    const input = {
      reconciliation: r,
      variances: [],
      justifiedCategories: new Set<never>(),
      explainedMissingReceipts: new Set(["e2"]),
      settlementRecorded: false,
      submittedBy: "u1",
      validatorId: "u1",
    };
    expect(checkValidation(input)).toEqual(["settlement_missing", "self_validation"]);
    expect(checkValidation({ ...input, settlementRecorded: true, validatorId: "f1" })).toEqual([]);
  });
});
