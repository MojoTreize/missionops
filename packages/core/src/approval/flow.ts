import type { Role } from "../policy";

/**
 * Circuit de validation configurable (B2.5).
 *
 * Une organisation déclare une suite ordonnée d'étapes. Chaque étape désigne le
 * rôle qui valide et, facultativement, un seuil de budget (en unités mineures
 * de la devise de base) à partir duquel elle s'applique : « le Directeur pays
 * ne valide qu'au-delà de 10 000 000 GNF ».
 */
export interface ApprovalStep {
  position: number;
  role: Role;
  /** Seuil minimal de budget (devise de base, unités mineures) ; `null` = toujours. */
  minBudgetMinor: bigint | null;
}

export type ApprovalDecision = "approved" | "rejected";

export interface ApprovalRecord {
  position: number;
  decision: ApprovalDecision;
  decidedBy: string;
}

/** Circuit par défaut d'une organisation qui n'a rien configuré. */
export const DEFAULT_FLOW: readonly ApprovalStep[] = [
  { position: 1, role: "manager", minBudgetMinor: null },
  { position: 2, role: "directeur_pays", minBudgetMinor: 10_000_000n },
];

export type FlowIssue = "empty" | "duplicate_position" | "negative_threshold";

export function validateFlow(steps: readonly ApprovalStep[]): FlowIssue[] {
  const issues: FlowIssue[] = [];
  if (steps.length === 0) issues.push("empty");
  const positions = new Set(steps.map((s) => s.position));
  if (positions.size !== steps.length) issues.push("duplicate_position");
  if (steps.some((s) => s.minBudgetMinor !== null && s.minBudgetMinor < 0n)) {
    issues.push("negative_threshold");
  }
  return issues;
}

/** Étapes qui s'appliquent à une mission, selon son budget, dans l'ordre. */
export function requiredSteps(
  flow: readonly ApprovalStep[],
  budgetBaseMinor: bigint,
): ApprovalStep[] {
  return [...flow]
    .filter((s) => s.minBudgetMinor === null || budgetBaseMinor >= s.minBudgetMinor)
    .sort((a, b) => a.position - b.position);
}

export type ApprovalState =
  | { kind: "pending"; step: ApprovalStep }
  | { kind: "approved" }
  | { kind: "rejected"; position: number };

/**
 * État du circuit à partir des décisions déjà prises. Une seule décision par
 * étape compte (la dernière enregistrée) ; un rejet arrête le circuit.
 */
export function approvalState(
  steps: readonly ApprovalStep[],
  records: readonly ApprovalRecord[],
): ApprovalState {
  const byPosition = new Map<number, ApprovalRecord>();
  for (const record of records) byPosition.set(record.position, record);
  for (const step of steps) {
    const record = byPosition.get(step.position);
    if (!record) return { kind: "pending", step };
    if (record.decision === "rejected") return { kind: "rejected", position: step.position };
  }
  return { kind: "approved" };
}

export type DecisionError = "not_pending" | "wrong_role" | "self_approval" | "already_decided";

/**
 * Un acteur peut-il décider de l'étape en cours ? Il faut le bon rôle (ou être
 * administrateur), ne pas être le demandeur, et ne pas avoir déjà validé une
 * étape précédente de la même mission (séparation des tâches).
 */
export function checkDecision(
  state: ApprovalState,
  actor: { userId: string; role: Role },
  requesterId: string,
  records: readonly ApprovalRecord[],
): DecisionError | null {
  if (state.kind !== "pending") return "not_pending";
  if (actor.userId === requesterId) return "self_approval";
  if (actor.role !== state.step.role && actor.role !== "admin") return "wrong_role";
  if (records.some((r) => r.decidedBy === actor.userId && r.decision === "approved")) {
    return "already_decided";
  }
  return null;
}
