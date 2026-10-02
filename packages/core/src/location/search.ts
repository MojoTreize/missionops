import { NATIONAL_LOCATIONS, type LocationLevel } from "./data";

/**
 * Normalise un texte pour la recherche : minuscules, sans accents, sans
 * apostrophes, tirets ni espaces. « N'Zérékoré » → « nzerekore ».
 */
export function normalizeSearch(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

/** Lieu cherchable : national ou propre à une organisation. */
export interface SearchableLocation {
  readonly id: string;
  readonly name: string;
  readonly aliases?: readonly string[];
  readonly level: LocationLevel | "organisation";
}

export interface SearchResult<T extends SearchableLocation> {
  readonly location: T;
  readonly score: number;
}

const LEVEL_RANK: Record<SearchableLocation["level"], number> = {
  region: 0,
  prefecture: 1,
  commune: 2,
  organisation: 2,
  sous_prefecture: 3,
};

/** Score de pertinence d'un nom ; 0 si aucune correspondance. */
function scoreName(name: string, query: string, isAlias: boolean): number {
  const target = normalizeSearch(name);
  if (!target) return 0;
  const aliasPenalty = isAlias ? 5 : 0;
  if (target === query) return 100 - aliasPenalty;
  if (target.startsWith(query)) return 80 - aliasPenalty;
  if (target.includes(query)) return 40 - aliasPenalty;
  return 0;
}

/**
 * Recherche insensible aux accents. Classement : correspondance exacte, début
 * du nom, début d'une variante, contenu ; à score égal, le niveau le plus haut
 * d'abord, puis l'ordre alphabétique.
 */
export function searchLocations<T extends SearchableLocation>(
  locations: readonly T[],
  rawQuery: string,
  limit = 8,
): SearchResult<T>[] {
  const query = normalizeSearch(rawQuery);
  if (!query) return [];
  const results: SearchResult<T>[] = [];
  for (const location of locations) {
    let best = scoreName(location.name, query, false);
    for (const alias of location.aliases ?? []) {
      best = Math.max(best, scoreName(alias, query, true));
    }
    if (best > 0) {
      results.push({ location, score: best });
    }
  }
  results.sort(
    (a, b) =>
      b.score - a.score ||
      LEVEL_RANK[a.location.level] - LEVEL_RANK[b.location.level] ||
      a.location.name.localeCompare(b.location.name, "fr"),
  );
  return results.slice(0, limit);
}

/** Le référentiel national au format cherchable (`id` = code). */
export const SEARCHABLE_NATIONAL: readonly SearchableLocation[] = NATIONAL_LOCATIONS.map((l) => ({
  id: l.code,
  name: l.name,
  aliases: l.aliases,
  level: l.level,
}));
