import { describe, expect, it } from "vitest";

import { buildBreadcrumbs, isActivePath, NAV_ITEMS } from "./nav";

describe("NAV_ITEMS", () => {
  it("expose exactement quatre entrées de premier niveau", () => {
    expect(NAV_ITEMS).toHaveLength(4);
  });

  it("chaque entrée a un href absolu, un libellé et une icône", () => {
    for (const item of NAV_ITEMS) {
      expect(item.href.startsWith("/")).toBe(true);
      expect(item.label.length).toBeGreaterThan(0);
      expect(item.icon).toBeTypeOf("object");
    }
  });

  it("les href sont uniques", () => {
    const hrefs = NAV_ITEMS.map((i) => i.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });
});

describe("isActivePath", () => {
  it("est actif sur la route exacte", () => {
    expect(isActivePath("/missions", "/missions")).toBe(true);
  });

  it("est actif sur une sous-route", () => {
    expect(isActivePath("/missions/42", "/missions")).toBe(true);
  });

  it("n'est pas actif sur une route voisine au préfixe commun", () => {
    expect(isActivePath("/missions-archive", "/missions")).toBe(false);
  });

  it("n'est pas actif sur une autre section", () => {
    expect(isActivePath("/expenses", "/missions")).toBe(false);
  });
});

describe("buildBreadcrumbs", () => {
  it("retourne un seul maillon pour une route de premier niveau", () => {
    const crumbs = buildBreadcrumbs("/dashboard");
    expect(crumbs).toEqual([{ href: "/dashboard", label: "Tableau de bord", isLast: true }]);
  });

  it("accumule les maillons et marque le dernier", () => {
    const crumbs = buildBreadcrumbs("/organizations/members");
    expect(crumbs).toEqual([
      { href: "/organizations", label: "Organisation", isLast: false },
      { href: "/organizations/members", label: "Membres", isLast: true },
    ]);
  });

  it("capitalise un segment inconnu", () => {
    const crumbs = buildBreadcrumbs("/missions/nouvelle-mission");
    expect(crumbs[1]?.label).toBe("Nouvelle mission");
  });

  it("retourne une liste vide à la racine", () => {
    expect(buildBreadcrumbs("/")).toEqual([]);
  });
});
