import { can, type Role } from "../policy";

/**
 * Machine à états explicite d'une mission (ADR-006, B2.2).
 *
 * Le statut n'est jamais une chaîne libre : seules les transitions déclarées
 * ici existent, et `transition()` est la seule fonction qui calcule un nouveau
 * statut. Elle vérifie le droit, la règle métier, et renvoie l'entrée
 * d'historique à journaliser.
 */
export const MISSION_STATUSES = [
  "BROUILLON",
  "SOUMISE",
  "VALIDEE",
  "EN_COURS",
  "TERMINEE",
  "CLOTUREE",
  "REJETEE",
  "ANNULEE",
] as const;

export type MissionStatus = (typeof MISSION_STATUSES)[number];

export const MISSION_EVENTS = [
  "submit",
  "approve",
  "reject",
  "rework",
  "revise",
  "start",
  "finish",
  "close",
  "cancel",
] as const;

export type MissionEvent = (typeof MISSION_EVENTS)[number];

/** Table des transitions : événement → (état de départ → état d'arrivée). */
export const TRANSITIONS: Record<MissionEvent, Partial<Record<MissionStatus, MissionStatus>>> = {
  // Le demandeur envoie sa demande en validation.
  submit: { BROUILLON: "SOUMISE" },
  // Dernière étape du circuit approuvée.
  approve: { SOUMISE: "VALIDEE" },
  // Refus à n'importe quelle étape du circuit.
  reject: { SOUMISE: "REJETEE" },
  // Le demandeur reprend une demande rejetée pour la corriger.
  rework: { REJETEE: "BROUILLON", SOUMISE: "BROUILLON" },
  // Modification substantielle (dates, budget) d'une mission validée : elle
  // repart en validation (B2.8).
  revise: { VALIDEE: "SOUMISE" },
  start: { VALIDEE: "EN_COURS" },
  finish: { EN_COURS: "TERMINEE" },
  // Clôture après validation financière de la réconciliation (B3.10).
  close: { TERMINEE: "CLOTUREE" },
  cancel: { BROUILLON: "ANNULEE", SOUMISE: "ANNULEE", VALIDEE: "ANNULEE" },
};

export const TERMINAL_STATUSES: readonly MissionStatus[] = ["CLOTUREE", "ANNULEE"];

export function isMissionStatus(value: unknown): value is MissionStatus {
  return typeof value === "string" && (MISSION_STATUSES as readonly string[]).includes(value);
}

export function nextStatus(from: MissionStatus, event: MissionEvent): MissionStatus | null {
  return TRANSITIONS[event][from] ?? null;
}

/** Événements possibles depuis un état (sans tenir compte des droits). */
export function availableEvents(from: MissionStatus): MissionEvent[] {
  return MISSION_EVENTS.filter((event) => nextStatus(from, event) !== null);
}

export interface TransitionActor {
  userId: string;
  role: Role;
}

export interface TransitionSubject {
  status: MissionStatus;
  requesterId: string;
}

export interface TransitionContext {
  actor: TransitionActor;
  now: Date;
  /** Motif obligatoire pour rejet et annulation. */
  comment?: string | null;
  /** Gardes fournies par l'appelant (calculées par d'autres modules du domaine). */
  guards?: {
    /** Tous les points de validation de la demande sont satisfaits (rules.ts). */
    draftValid?: boolean;
    /** La dernière étape du circuit de validation est approuvée (approval). */
    approvalComplete?: boolean;
    /** La réconciliation financière est validée (B3.10). */
    reconciliationValidated?: boolean;
  };
}

export type TransitionErrorCode =
  | "TRANSITION_INTERDITE"
  | "DROIT_INSUFFISANT"
  | "DEMANDE_INCOMPLETE"
  | "VALIDATION_INCOMPLETE"
  | "RECONCILIATION_NON_VALIDEE"
  | "MOTIF_OBLIGATOIRE";

/** Erreur nommée : chaque refus a un code stable, testable et traduisible. */
export class MissionTransitionError extends Error {
  constructor(
    readonly code: TransitionErrorCode,
    readonly event: MissionEvent,
    readonly from: MissionStatus,
  ) {
    super(`${code} : ${event} depuis ${from}`);
    this.name = "MissionTransitionError";
  }
}

export interface TransitionRecord {
  from: MissionStatus;
  to: MissionStatus;
  event: MissionEvent;
  actorId: string;
  comment: string | null;
  at: Date;
}

/** Qui peut déclencher quel événement. */
function isAuthorized(event: MissionEvent, subject: TransitionSubject, actor: TransitionActor) {
  const isRequester = subject.requesterId === actor.userId;
  switch (event) {
    case "submit":
      return isRequester || can(actor, "update", "mission");
    case "rework":
      // Le validateur peut aussi renvoyer la demande pour modification (B2.6).
      return isRequester || can(actor, "update", "mission") || can(actor, "approve", "mission");
    case "approve":
    case "reject":
      // Le demandeur ne valide jamais sa propre mission.
      return !isRequester && can(actor, "approve", "mission");
    case "revise":
    case "start":
    case "finish":
      return isRequester || can(actor, "update", "mission");
    case "cancel":
      return isRequester || can(actor, "update", "mission");
    case "close":
      return can(actor, "approve", "expense");
  }
}

/**
 * Seule fonction autorisée à calculer un nouveau statut de mission. Lève une
 * `MissionTransitionError` nommée en cas de refus, sinon renvoie l'entrée
 * d'historique à persister (le service applicatif l'écrit dans la même
 * transaction que la mise à jour du statut ; le déclencheur d'audit fait le
 * reste).
 */
export function transition(
  subject: TransitionSubject,
  event: MissionEvent,
  context: TransitionContext,
): TransitionRecord {
  const from = subject.status;
  const to = nextStatus(from, event);
  if (!to) {
    throw new MissionTransitionError("TRANSITION_INTERDITE", event, from);
  }
  if (!isAuthorized(event, subject, context.actor)) {
    throw new MissionTransitionError("DROIT_INSUFFISANT", event, from);
  }
  const guards = context.guards ?? {};
  const comment = context.comment?.trim() || null;

  if ((event === "submit" || event === "revise") && guards.draftValid === false) {
    throw new MissionTransitionError("DEMANDE_INCOMPLETE", event, from);
  }
  if (event === "approve" && guards.approvalComplete !== true) {
    throw new MissionTransitionError("VALIDATION_INCOMPLETE", event, from);
  }
  if (event === "close" && guards.reconciliationValidated !== true) {
    throw new MissionTransitionError("RECONCILIATION_NON_VALIDEE", event, from);
  }
  if ((event === "reject" || event === "cancel") && !comment) {
    throw new MissionTransitionError("MOTIF_OBLIGATOIRE", event, from);
  }

  return { from, to, event, actorId: context.actor.userId, comment, at: context.now };
}
