import { isNationalCode } from "./data";
import { normalizeSearch } from "./search";

/** Types de lieux propres à une organisation (B2.1). */
export const ORG_LOCATION_KINDS = ["site", "village", "autre"] as const;
export type OrgLocationKind = (typeof ORG_LOCATION_KINDS)[number];

export type OrgLocationError = "name_length" | "unknown_parent" | "duplicate";

export interface OrgLocationDraft {
  name: string;
  parentCode: string;
}

/**
 * Valide un lieu d'organisation : nom de 1 à 120 caractères, parent national
 * existant, pas de doublon actif (même nom normalisé sous le même parent).
 */
export function validateOrgLocation(
  draft: OrgLocationDraft,
  existing: readonly { normalizedName: string; parentCode: string }[],
): OrgLocationError | null {
  const name = draft.name.trim();
  if (name.length < 1 || name.length > 120) return "name_length";
  if (!isNationalCode(draft.parentCode)) return "unknown_parent";
  const normalized = normalizeSearch(name);
  if (existing.some((e) => e.parentCode === draft.parentCode && e.normalizedName === normalized)) {
    return "duplicate";
  }
  return null;
}
