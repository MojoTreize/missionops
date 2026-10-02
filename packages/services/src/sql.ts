import { sql, type SQL, type SQLWrapper } from "drizzle-orm";

/**
 * Repli des accents et de la casse en SQL portable (sans extension `unaccent`,
 * indisponible dans certains hébergements et dans PGlite) : « Nzérékoré »,
 * « NZEREKORE » et « nzerekore » deviennent identiques.
 */
const FROM = "àáâäãåçèéêëìíîïñòóôöõùúûüýÿœæ";
const TO = "aaaaaaceeeeiiiinooooouuuuyyoa";

export function folded(column: SQLWrapper): SQL {
  return sql`translate(lower(${column}), ${FROM}, ${TO})`;
}

export function foldText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/œ/g, "o")
    .replace(/æ/g, "a");
}

/** Motif `ILIKE` sûr (caractères spéciaux neutralisés), accents repliés. */
export function foldedPattern(text: string): string {
  return `%${foldText(text).replace(/[%_\\]/g, "")}%`;
}
