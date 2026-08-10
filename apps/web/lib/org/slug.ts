/**
 * Génère un identifiant d'URL (slug) à partir d'un nom : minuscules, accents
 * retirés, tout ce qui n'est pas alphanumérique remplacé par un tiret. Pur et
 * testable ; l'unicité éventuelle est gérée par la couche d'accès (suffixe).
 */
export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // retire les diacritiques
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}
