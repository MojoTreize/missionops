import { describe, expect, it } from "vitest";

import { en } from "./messages/en";
import { fr } from "./messages/fr";
import { createTranslator, translate } from "./translate";

/** Aplati un objet de messages en un ensemble de clés « à points ». */
function flattenKeys(object: Record<string, unknown>, prefix = ""): string[] {
  return Object.entries(object).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof value === "object" && value !== null
      ? flattenKeys(value as Record<string, unknown>, path)
      : [path];
  });
}

describe("parité des catalogues de langue", () => {
  const frKeys = flattenKeys(fr).sort();
  const enKeys = flattenKeys(en).sort();

  it("aucune clé manquante côté anglais", () => {
    const missing = frKeys.filter((key) => !enKeys.includes(key));
    expect(missing).toEqual([]);
  });

  it("aucune clé en trop côté anglais", () => {
    const extra = enKeys.filter((key) => !frKeys.includes(key));
    expect(extra).toEqual([]);
  });

  it("aucune valeur vide dans les deux langues", () => {
    for (const catalog of [fr, en]) {
      for (const key of flattenKeys(catalog)) {
        expect(translate(catalog as never, key as never).length).toBeGreaterThan(0);
      }
    }
  });
});

describe("translate", () => {
  it("interpole les paramètres", () => {
    expect(translate(fr, "dashboard.greeting", { name: "Awa" })).toBe("Bonjour Awa");
    expect(translate(en, "dashboard.greeting", { name: "Awa" })).toBe("Hello Awa");
  });

  it("renvoie la clé quand elle est absente", () => {
    expect(translate(fr, "inconnu.cle" as never)).toBe("inconnu.cle");
  });

  it("createTranslator lie un catalogue", () => {
    const t = createTranslator(en);
    expect(t("nav.missions")).toBe("Missions");
  });
});
