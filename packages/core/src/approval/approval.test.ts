import { describe, expect, it } from "vitest";

import {
  DEFAULT_FLOW,
  approvalState,
  checkDecision,
  requiredSteps,
  validateFlow,
  type ApprovalRecord,
} from "./index";

describe("circuit de validation", () => {
  it("applique le seuil du Directeur pays", () => {
    expect(requiredSteps(DEFAULT_FLOW, 5_000_000n).map((s) => s.role)).toEqual(["manager"]);
    expect(requiredSteps(DEFAULT_FLOW, 10_000_000n).map((s) => s.role)).toEqual([
      "manager",
      "directeur_pays",
    ]);
  });

  it("trie les étapes par position", () => {
    const flow = [
      { position: 2, role: "finance" as const, minBudgetMinor: null },
      { position: 1, role: "manager" as const, minBudgetMinor: null },
    ];
    expect(requiredSteps(flow, 0n).map((s) => s.position)).toEqual([1, 2]);
  });

  it("suit l'état : en attente, validé, rejeté", () => {
    const steps = requiredSteps(DEFAULT_FLOW, 20_000_000n);
    expect(approvalState(steps, [])).toEqual({ kind: "pending", step: steps[0] });
    const first: ApprovalRecord = { position: 1, decision: "approved", decidedBy: "m" };
    expect(approvalState(steps, [first])).toEqual({ kind: "pending", step: steps[1] });
    expect(
      approvalState(steps, [first, { position: 2, decision: "approved", decidedBy: "d" }]),
    ).toEqual({ kind: "approved" });
    expect(approvalState(steps, [{ position: 1, decision: "rejected", decidedBy: "m" }])).toEqual({
      kind: "rejected",
      position: 1,
    });
  });

  it("contrôle qui peut décider", () => {
    const steps = requiredSteps(DEFAULT_FLOW, 20_000_000n);
    const state = approvalState(steps, []);
    expect(checkDecision(state, { userId: "m", role: "manager" }, "req", [])).toBeNull();
    expect(checkDecision(state, { userId: "a", role: "admin" }, "req", [])).toBeNull();
    expect(checkDecision(state, { userId: "f", role: "finance" }, "req", [])).toBe("wrong_role");
    expect(checkDecision(state, { userId: "req", role: "manager" }, "req", [])).toBe(
      "self_approval",
    );
    expect(checkDecision({ kind: "approved" }, { userId: "m", role: "manager" }, "req", [])).toBe(
      "not_pending",
    );
    const records: ApprovalRecord[] = [{ position: 1, decision: "approved", decidedBy: "a" }];
    const second = approvalState(steps, records);
    expect(checkDecision(second, { userId: "a", role: "admin" }, "req", records)).toBe(
      "already_decided",
    );
  });

  it("valide la configuration du circuit", () => {
    expect(validateFlow(DEFAULT_FLOW)).toEqual([]);
    expect(validateFlow([])).toEqual(["empty"]);
    expect(
      validateFlow([
        { position: 1, role: "manager", minBudgetMinor: -1n },
        { position: 1, role: "finance", minBudgetMinor: null },
      ]),
    ).toEqual(["duplicate_position", "negative_threshold"]);
  });
});
