import { isNationalCode } from "../location";
import type { MissionStatus } from "./state-machine";

/**
 * Règles d'une demande de mission (B2.3). Les dates sont des jours calendaires
 * au format ISO `AAAA-MM-JJ` (le fuseau est celui de l'organisation, appliqué
 * par l'appelant) : on compare des chaînes ISO, jamais des `Date` locales.
 */
export const TRANSPORT_MODES = [
  "vehicule_org",
  "transport_public",
  "avion",
  "moto",
  "autre",
] as const;
export type TransportMode = (typeof TRANSPORT_MODES)[number];

export interface MissionDraft {
  title: string;
  purpose: string;
  destinationCode: string | null;
  destinationLocationId: string | null;
  startDate: string;
  endDate: string;
  transportMode: TransportMode | null;
}

export type DraftIssue =
  | "title_required"
  | "purpose_required"
  | "destination_required"
  | "destination_unknown"
  | "dates_invalid"
  | "dates_order"
  | "duration_too_long"
  | "transport_required";

/** Durée maximale d'une mission, en jours (au-delà : affectation, pas mission). */
export const MAX_MISSION_DAYS = 90;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function isIsoDate(value: string): boolean {
  if (!ISO_DATE.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

/** Nombre de jours calendaires, bornes incluses (1 pour un aller-retour du jour). */
export function durationDays(startDate: string, endDate: string): number {
  const start = Date.parse(`${startDate}T00:00:00Z`);
  const end = Date.parse(`${endDate}T00:00:00Z`);
  return Math.round((end - start) / 86_400_000) + 1;
}

/** Points bloquants pour soumettre la demande. Liste vide = demande complète. */
export function validateDraft(draft: MissionDraft): DraftIssue[] {
  const issues: DraftIssue[] = [];
  if (draft.title.trim().length < 3) issues.push("title_required");
  if (draft.purpose.trim().length < 10) issues.push("purpose_required");
  if (!draft.destinationCode && !draft.destinationLocationId) {
    issues.push("destination_required");
  } else if (draft.destinationCode && !isNationalCode(draft.destinationCode)) {
    issues.push("destination_unknown");
  }
  if (!isIsoDate(draft.startDate) || !isIsoDate(draft.endDate)) {
    issues.push("dates_invalid");
  } else if (draft.endDate < draft.startDate) {
    issues.push("dates_order");
  } else if (durationDays(draft.startDate, draft.endDate) > MAX_MISSION_DAYS) {
    issues.push("duration_too_long");
  }
  if (!draft.transportMode) issues.push("transport_required");
  return issues;
}

/** Champs modifiables selon le statut (B2.8). */
export function isEditable(status: MissionStatus): boolean {
  return status === "BROUILLON" || status === "VALIDEE";
}

/**
 * Une modification d'une mission validée est « substantielle » si elle touche
 * aux dates ou à la destination : elle renvoie la mission en validation.
 */
export function isSubstantialChange(
  before: Pick<MissionDraft, "startDate" | "endDate" | "destinationCode" | "destinationLocationId">,
  after: Pick<MissionDraft, "startDate" | "endDate" | "destinationCode" | "destinationLocationId">,
): boolean {
  return (
    before.startDate !== after.startDate ||
    before.endDate !== after.endDate ||
    before.destinationCode !== after.destinationCode ||
    before.destinationLocationId !== after.destinationLocationId
  );
}

/**
 * Référence lisible d'une mission : `MIS-2026-0042`. Le numéro est séquentiel
 * par organisation et par année ; l'appelant fournit le rang.
 */
export function formatMissionReference(year: number, sequence: number): string {
  return `MIS-${year}-${String(sequence).padStart(4, "0")}`;
}

/** Rôles possibles d'un participant dans la mission (B2.4). */
export const PARTICIPANT_ROLES = ["chef_mission", "membre", "chauffeur", "externe"] as const;
export type ParticipantRole = (typeof PARTICIPANT_ROLES)[number];

export interface ParticipantDraft {
  userId: string | null;
  externalName: string | null;
  role: ParticipantRole;
}

export type ParticipantIssue = "identity_required" | "duplicate" | "single_chef";

/**
 * Valide la liste des participants : chacun est un membre ou un externe nommé,
 * pas de doublon, au plus un chef de mission.
 */
export function validateParticipants(list: readonly ParticipantDraft[]): ParticipantIssue[] {
  const issues = new Set<ParticipantIssue>();
  const seen = new Set<string>();
  let chefs = 0;
  for (const p of list) {
    const key = p.userId ?? (p.externalName ? `ext:${p.externalName.trim().toLowerCase()}` : null);
    if (!key || (!p.userId && !p.externalName?.trim())) {
      issues.add("identity_required");
      continue;
    }
    if (seen.has(key)) issues.add("duplicate");
    seen.add(key);
    if (p.role === "chef_mission") chefs += 1;
  }
  if (chefs > 1) issues.add("single_chef");
  return [...issues];
}

/** Deux périodes [a, b] et [c, d] (jours ISO, bornes incluses) se chevauchent-elles ? */
export function periodsOverlap(
  a: { startDate: string; endDate: string },
  b: { startDate: string; endDate: string },
): boolean {
  return a.startDate <= b.endDate && b.startDate <= a.endDate;
}
