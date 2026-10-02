/**
 * Référentiel géographique national de la Guinée (B2.1).
 *
 * Donnée statique, identique pour toutes les organisations, embarquée dans le
 * code : elle fonctionne donc sans réseau dès le premier chargement.
 *
 * Codes : ISO 3166-2:GN pour les régions (`GN-D` = Kindia) et les préfectures
 * (`GN-KD` = préfecture de Kindia) ; les sous-préfectures et communes ajoutent
 * un suffixe stable (`GN-KD-FRIGUIAGBE`). Un code n'est jamais réutilisé.
 *
 * Couverture : 8 régions, 33 préfectures, 5 communes historiques de Conakry et
 * les principales sous-préfectures citées dans l'activité des organisations.
 * Coordonnées volontairement absentes : elles seront importées depuis le jeu
 * de référence COD-AB (OCHA/HDX) plutôt que saisies de mémoire.
 * À vérifier contre COD-AB avant la mise en production pilote.
 */

export type LocationLevel = "region" | "prefecture" | "sous_prefecture" | "commune";

export interface NationalLocation {
  readonly code: string;
  readonly level: LocationLevel;
  readonly name: string;
  readonly aliases: readonly string[];
  readonly parentCode: string | null;
}

type Entry = [code: string, name: string, aliases?: string[]];

const REGIONS: Entry[] = [
  ["GN-C", "Conakry"],
  ["GN-B", "Boké", ["Boke"]],
  ["GN-D", "Kindia"],
  ["GN-M", "Mamou"],
  ["GN-L", "Labé", ["Labe"]],
  ["GN-F", "Faranah"],
  ["GN-K", "Kankan"],
  ["GN-N", "Nzérékoré", ["N'Zérékoré", "Nzerekore", "Forêt", "Guinée forestière"]],
];

/** Préfectures par région. */
const PREFECTURES: Record<string, Entry[]> = {
  "GN-B": [
    ["GN-BF", "Boffa"],
    ["GN-BK", "Boké", ["Boke"]],
    ["GN-FR", "Fria"],
    ["GN-GA", "Gaoual"],
    ["GN-KN", "Koundara"],
  ],
  "GN-D": [
    ["GN-CO", "Coyah"],
    ["GN-DU", "Dubréka", ["Dubreka"]],
    ["GN-FO", "Forécariah", ["Forecariah", "Forékariah"]],
    ["GN-KD", "Kindia"],
    ["GN-TE", "Télimélé", ["Telimele"]],
  ],
  "GN-M": [
    ["GN-DL", "Dalaba"],
    ["GN-MM", "Mamou"],
    ["GN-PI", "Pita"],
  ],
  "GN-L": [
    ["GN-KB", "Koubia"],
    ["GN-LA", "Labé", ["Labe"]],
    ["GN-LE", "Lélouma", ["Lelouma"]],
    ["GN-ML", "Mali", ["Mali-Ville"]],
    ["GN-TO", "Tougué", ["Tougue"]],
  ],
  "GN-F": [
    ["GN-DB", "Dabola"],
    ["GN-DI", "Dinguiraye"],
    ["GN-FA", "Faranah"],
    ["GN-KS", "Kissidougou"],
  ],
  "GN-K": [
    ["GN-KA", "Kankan"],
    ["GN-KE", "Kérouané", ["Kerouane"]],
    ["GN-KO", "Kouroussa"],
    ["GN-MD", "Mandiana"],
    ["GN-SI", "Siguiri"],
  ],
  "GN-N": [
    ["GN-BE", "Beyla"],
    ["GN-GU", "Guéckédou", ["Guékédou", "Gueckedou", "Guekedou"]],
    ["GN-LO", "Lola"],
    ["GN-MC", "Macenta"],
    ["GN-NZ", "Nzérékoré", ["N'Zérékoré", "Nzerekore"]],
    ["GN-YO", "Yomou"],
  ],
};

/** Communes de Conakry (découpage historique en cinq communes). */
const CONAKRY_COMMUNES: Entry[] = [
  ["GN-C-KALOUM", "Kaloum"],
  ["GN-C-DIXINN", "Dixinn"],
  ["GN-C-MATAM", "Matam"],
  ["GN-C-RATOMA", "Ratoma"],
  ["GN-C-MATOTO", "Matoto"],
];

/** Principales sous-préfectures, par préfecture. */
const SOUS_PREFECTURES: Record<string, Entry[]> = {
  "GN-BK": [
    ["GN-BK-KAMSAR", "Kamsar"],
    ["GN-BK-SANGAREDI", "Sangarédi", ["Sangaredi"]],
    ["GN-BK-KOLABOUI", "Kolaboui"],
  ],
  "GN-KD": [
    ["GN-KD-FRIGUIAGBE", "Friguiagbé", ["Friguiagbe"]],
    ["GN-KD-MAMBIA", "Mambia"],
  ],
  "GN-CO": [
    ["GN-CO-MANEAH", "Manéah", ["Maneah"]],
    ["GN-CO-WONKIFONG", "Wonkifong"],
  ],
  "GN-FO": [
    ["GN-FO-KABACK", "Kaback"],
    ["GN-FO-MAFERINYAH", "Maférinyah", ["Maferinya", "Maférinya"]],
  ],
  "GN-MM": [["GN-MM-TIMBO", "Timbo"]],
  "GN-PI": [["GN-PI-TIMBIMADINA", "Timbi-Madina", ["Timbi Madina"]]],
  "GN-LA": [["GN-LA-POPODARA", "Popodara"]],
  "GN-SI": [
    ["GN-SI-KINTINIAN", "Kintinian"],
    ["GN-SI-DOKO", "Doko"],
  ],
  "GN-MC": [["GN-MC-SEREDOU", "Sérédou", ["Seredou"]]],
  "GN-NZ": [
    ["GN-NZ-SAMOE", "Samoé", ["Samoe"]],
    ["GN-NZ-KOROPARA", "Koropara"],
  ],
};

function build(): NationalLocation[] {
  const list: NationalLocation[] = [];
  for (const [code, name, aliases = []] of REGIONS) {
    list.push({ code, level: "region", name, aliases, parentCode: null });
  }
  for (const [regionCode, entries] of Object.entries(PREFECTURES)) {
    for (const [code, name, aliases = []] of entries) {
      list.push({ code, level: "prefecture", name, aliases, parentCode: regionCode });
    }
  }
  for (const [code, name, aliases = []] of CONAKRY_COMMUNES) {
    list.push({ code, level: "commune", name, aliases, parentCode: "GN-C" });
  }
  for (const [prefectureCode, entries] of Object.entries(SOUS_PREFECTURES)) {
    for (const [code, name, aliases = []] of entries) {
      list.push({ code, level: "sous_prefecture", name, aliases, parentCode: prefectureCode });
    }
  }
  return list;
}

export const NATIONAL_LOCATIONS: readonly NationalLocation[] = build();

const BY_CODE = new Map(NATIONAL_LOCATIONS.map((l) => [l.code, l]));

export function getNationalLocation(code: string): NationalLocation | undefined {
  return BY_CODE.get(code);
}

export function isNationalCode(code: string): boolean {
  return BY_CODE.has(code);
}

/** Chemin du lieu vers la racine : [lieu, parent, grand-parent…]. */
export function ancestry(code: string): NationalLocation[] {
  const chain: NationalLocation[] = [];
  let current = BY_CODE.get(code);
  while (current) {
    chain.push(current);
    current = current.parentCode ? BY_CODE.get(current.parentCode) : undefined;
  }
  return chain;
}

/**
 * Libellé d'affichage avec contexte (« Coyah · Kindia »). La région est omise
 * pour une région (elle est sa propre racine) et quand le parent porte le même
 * nom (préfecture chef-lieu de sa région : « Kindia »).
 */
export function displayPath(code: string): string {
  const chain = ancestry(code);
  const [self, parent] = chain;
  if (!self) return code;
  return parent && parent.name !== self.name ? `${self.name} · ${parent.name}` : self.name;
}
