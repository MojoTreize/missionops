import { describe, expect, it } from "vitest";

import {
  NATIONAL_LOCATIONS,
  SEARCHABLE_NATIONAL,
  ancestry,
  displayPath,
  getNationalLocation,
  normalizeSearch,
  searchLocations,
  validateOrgLocation,
} from "./index";

const names = (query: string) =>
  searchLocations(SEARCHABLE_NATIONAL, query).map((r) => `${r.location.name}/${r.location.level}`);

describe("référentiel national", () => {
  it("compte 8 régions et 33 préfectures", () => {
    expect(NATIONAL_LOCATIONS.filter((l) => l.level === "region")).toHaveLength(8);
    expect(NATIONAL_LOCATIONS.filter((l) => l.level === "prefecture")).toHaveLength(33);
  });

  it("a des codes uniques et des parents existants", () => {
    const codes = NATIONAL_LOCATIONS.map((l) => l.code);
    expect(new Set(codes).size).toBe(codes.length);
    for (const l of NATIONAL_LOCATIONS) {
      if (l.level === "region") {
        expect(l.parentCode).toBeNull();
      } else {
        const parent = getNationalLocation(l.parentCode ?? "");
        expect(parent, l.code).toBeDefined();
        if (l.level === "prefecture" || l.level === "commune") {
          expect(parent?.level).toBe("region");
        } else {
          expect(parent?.level).toBe("prefecture");
        }
      }
    }
  });

  it("construit le chemin d'affichage", () => {
    expect(displayPath("GN-CO")).toBe("Coyah · Kindia");
    expect(displayPath("GN-D")).toBe("Kindia");
    expect(displayPath("GN-KD")).toBe("Kindia");
    expect(displayPath("GN-BK-KAMSAR")).toBe("Kamsar · Boké");
    expect(displayPath("inconnu")).toBe("inconnu");
    expect(ancestry("GN-BK-KAMSAR").map((l) => l.code)).toEqual(["GN-BK-KAMSAR", "GN-BK", "GN-B"]);
  });
});

describe("recherche insensible aux accents", () => {
  it("« nzerekore » sans accent trouve « Nzérékoré » (critère du plan)", () => {
    expect(names("nzerekore")[0]).toBe("Nzérékoré/region");
    expect(names("nzerekore")).toContain("Nzérékoré/prefecture");
  });

  it("ignore casse, apostrophes et préfixes partiels", () => {
    expect(names("N'ZEREKORE")[0]).toMatch(/^Nzérékoré/);
    expect(names("nzé")[0]).toMatch(/^Nzérékoré/);
    expect(names("guekedou")[0]).toBe("Guéckédou/prefecture");
    expect(names("timbi madina")[0]).toBe("Timbi-Madina/sous_prefecture");
  });

  it("classe la région et la préfecture avant les sous-préfectures", () => {
    const result = names("kin");
    expect(result.slice(0, 2)).toEqual(["Kindia/region", "Kindia/prefecture"]);
    expect(result).toContain("Kintinian/sous_prefecture");
    expect(result.indexOf("Kintinian/sous_prefecture")).toBeGreaterThan(1);
  });

  it("renvoie une liste vide pour une requête vide ou sans résultat", () => {
    expect(names("")).toEqual([]);
    expect(names("   ")).toEqual([]);
    expect(names("zzzz")).toEqual([]);
  });

  it("respecte la limite", () => {
    expect(searchLocations(SEARCHABLE_NATIONAL, "a", 3)).toHaveLength(3);
  });

  it("normalise les textes", () => {
    expect(normalizeSearch("N'Zérékoré")).toBe("nzerekore");
    expect(normalizeSearch("Timbi-Madina")).toBe("timbimadina");
  });
});

describe("lieux d'organisation", () => {
  it("valide nom, parent et doublon", () => {
    expect(validateOrgLocation({ name: "Entrepôt", parentCode: "GN-KD" }, [])).toBeNull();
    expect(validateOrgLocation({ name: "  ", parentCode: "GN-KD" }, [])).toBe("name_length");
    expect(validateOrgLocation({ name: "x".repeat(121), parentCode: "GN-KD" }, [])).toBe(
      "name_length",
    );
    expect(validateOrgLocation({ name: "Base", parentCode: "GN-XX" }, [])).toBe("unknown_parent");
    expect(
      validateOrgLocation({ name: "Entrepôt", parentCode: "GN-KD" }, [
        { normalizedName: "entrepot", parentCode: "GN-KD" },
      ]),
    ).toBe("duplicate");
    expect(
      validateOrgLocation({ name: "Entrepôt", parentCode: "GN-CO" }, [
        { normalizedName: "entrepot", parentCode: "GN-KD" },
      ]),
    ).toBeNull();
  });
});
