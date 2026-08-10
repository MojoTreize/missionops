import { describe, expect, it } from "vitest";

import { resolveActiveOrganisationId } from "./active";
import { slugify } from "./slug";

describe("slugify", () => {
  it("normalise accents, espaces et casse", () => {
    expect(slugify("Croix-Rouge Guinée")).toBe("croix-rouge-guinee");
  });

  it("retire les tirets superflus", () => {
    expect(slugify("  Mission — Nzérékoré  ")).toBe("mission-nzerekore");
  });
});

describe("resolveActiveOrganisationId", () => {
  const orgs = ["org-a", "org-b"];

  it("garde l'organisation préférée si l'utilisateur en est membre", () => {
    expect(resolveActiveOrganisationId(orgs, "org-b")).toBe("org-b");
  });

  it("retombe sur la première appartenance si la préférée n'est plus valide", () => {
    expect(resolveActiveOrganisationId(orgs, "org-supprimee")).toBe("org-a");
  });

  it("retombe sur la première appartenance si aucune préférence", () => {
    expect(resolveActiveOrganisationId(orgs, null)).toBe("org-a");
  });

  it("renvoie null si l'utilisateur n'a aucune organisation", () => {
    expect(resolveActiveOrganisationId([], "org-a")).toBeNull();
  });
});
