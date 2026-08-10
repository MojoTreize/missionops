import { describe, expect, it } from "vitest";

import { generateToken, hashToken } from "./tokens";

describe("tokens", () => {
  it("génère des jetons distincts et suffisamment longs", () => {
    const a = generateToken();
    const b = generateToken();
    expect(a).not.toEqual(b);
    // 32 octets en base64url ≈ 43 caractères.
    expect(a.length).toBeGreaterThanOrEqual(43);
  });

  it("produit une empreinte SHA-256 hex stable de 64 caractères", () => {
    const token = "jeton-de-test";
    expect(hashToken(token)).toEqual(hashToken(token));
    expect(hashToken(token)).toMatch(/^[0-9a-f]{64}$/);
  });

  it("ne stocke jamais le jeton en clair (empreinte ≠ jeton)", () => {
    const token = generateToken();
    expect(hashToken(token)).not.toEqual(token);
  });
});
