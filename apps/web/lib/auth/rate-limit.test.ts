import { describe, expect, it } from "vitest";

import { InMemoryRateLimiter, isRateLimited } from "./rate-limit";

const policy = { max: 3, windowMs: 1000 };

describe("isRateLimited", () => {
  it("autorise tant que le nombre de tentatives récentes est sous la limite", () => {
    expect(isRateLimited([0, 100], 300, policy)).toBe(false);
  });

  it("bloque une fois la limite atteinte dans la fenêtre", () => {
    expect(isRateLimited([0, 100, 200, 300], 400, policy)).toBe(true);
  });

  it("ignore les tentatives hors fenêtre glissante", () => {
    // Trois tentatives anciennes (> windowMs) ne comptent plus.
    expect(isRateLimited([0, 100, 200], 2000, policy)).toBe(false);
  });
});

describe("InMemoryRateLimiter", () => {
  it("bloque après `max` tentatives puis se rouvre après la fenêtre", () => {
    let now = 0;
    const limiter = new InMemoryRateLimiter(policy, () => now);
    const key = "user@example.org:1.2.3.4";

    limiter.record(key);
    limiter.record(key);
    limiter.record(key);
    expect(limiter.isLimited(key)).toBe(true);

    now = 1500; // au-delà de la fenêtre
    expect(limiter.isLimited(key)).toBe(false);
  });

  it("réinitialise le compteur après une connexion réussie", () => {
    const limiter = new InMemoryRateLimiter(policy);
    const key = "a@b.c:local";
    limiter.record(key);
    limiter.record(key);
    limiter.record(key);
    expect(limiter.isLimited(key)).toBe(true);
    limiter.reset(key);
    expect(limiter.isLimited(key)).toBe(false);
  });
});
