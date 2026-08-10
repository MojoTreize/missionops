import { describe, expect, it } from "vitest";

import { hashPassword, verifyPassword } from "./password";

describe("password", () => {
  it("vérifie un mot de passe correct", async () => {
    const hash = await hashPassword("Correct-Horse-Battery-Staple");
    expect(await verifyPassword("Correct-Horse-Battery-Staple", hash)).toBe(true);
  });

  it("rejette un mot de passe incorrect", async () => {
    const hash = await hashPassword("bon-mot-de-passe");
    expect(await verifyPassword("mauvais-mot-de-passe", hash)).toBe(false);
  });

  it("produit une empreinte salée (deux hachages diffèrent)", async () => {
    const a = await hashPassword("identique");
    const b = await hashPassword("identique");
    expect(a).not.toEqual(b);
  });

  it("renvoie false pour une empreinte malformée sans lever", async () => {
    expect(await verifyPassword("peu importe", "format-invalide")).toBe(false);
  });
});
