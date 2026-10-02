import { describe, expect, it } from "vitest";

import {
  CurrencyMismatchError,
  InvalidAmountError,
  InvalidRateError,
  RateMismatchError,
  abs,
  add,
  allocate,
  compare,
  convert,
  divRound,
  equals,
  formatMoney,
  fromJson,
  identityRate,
  invertRate,
  isCurrency,
  isNegative,
  isPositive,
  isZero,
  money,
  multiply,
  negate,
  parseMoney,
  parseRate,
  percentOf,
  rateToString,
  subtract,
  sum,
  toDecimalString,
  toJson,
  zero,
} from "./index";

const nbsp = /[\u00a0\u202f]/g;
const plain = (s: string) => s.replace(nbsp, " ");

describe("Money — opérations de base", () => {
  it("additionne et soustrait des montants de même devise", () => {
    expect(add(money(150, "EUR"), money(275, "EUR"))).toEqual(money(425, "EUR"));
    expect(subtract(money(100, "GNF"), money(250, "GNF"))).toEqual(money(-150, "GNF"));
  });

  it("refuse de mélanger les devises", () => {
    expect(() => add(money(1, "EUR"), money(1, "USD"))).toThrow(CurrencyMismatchError);
    expect(() => compare(money(1, "EUR"), money(1, "GNF"))).toThrow(CurrencyMismatchError);
  });

  it("refuse un nombre non entier", () => {
    expect(() => money(1.5, "EUR")).toThrow(InvalidAmountError);
  });

  it("somme une liste, zéro si vide", () => {
    expect(sum([], "GNF")).toEqual(zero("GNF"));
    expect(sum([money(1, "USD"), money(2, "USD"), money(3, "USD")], "USD")).toEqual(
      money(6, "USD"),
    );
  });

  it("compare, égalité, signes", () => {
    expect(compare(money(1, "EUR"), money(2, "EUR"))).toBe(-1);
    expect(compare(money(2, "EUR"), money(2, "EUR"))).toBe(0);
    expect(compare(money(3, "EUR"), money(2, "EUR"))).toBe(1);
    expect(equals(money(2, "EUR"), money(2, "USD"))).toBe(false);
    expect(equals(money(2, "EUR"), money(3, "EUR"))).toBe(false);
    expect(equals(money(2, "EUR"), money(2, "EUR"))).toBe(true);
    expect(isZero(zero("GNF"))).toBe(true);
    expect(isNegative(money(-1, "GNF"))).toBe(true);
    expect(isPositive(money(1, "GNF"))).toBe(true);
    expect(abs(money(-5, "GNF"))).toEqual(money(5, "GNF"));
    expect(abs(money(5, "GNF"))).toEqual(money(5, "GNF"));
    expect(negate(money(5, "GNF"))).toEqual(money(-5, "GNF"));
  });

  it("multiplie et applique un pourcentage avec arrondi commercial", () => {
    expect(multiply(money(35000, "GNF"), 3)).toEqual(money(105000, "GNF"));
    expect(percentOf(money(1000, "EUR"), 12000)).toEqual(money(1200, "EUR"));
    expect(percentOf(money(5, "EUR"), 5000)).toEqual(money(3, "EUR")); // 2,5 → 3
    expect(percentOf(money(-5, "EUR"), 5000)).toEqual(money(-3, "EUR"));
  });

  it("divRound arrondit la demi-unité loin de zéro", () => {
    expect(divRound(5n, 2n)).toBe(3n);
    expect(divRound(-5n, 2n)).toBe(-3n);
    expect(divRound(4n, 3n)).toBe(1n);
    expect(divRound(5n, -2n)).toBe(-3n);
    expect(() => divRound(1n, 0n)).toThrow(RangeError);
  });
});

describe("Money — répartition sans perte", () => {
  it("répartit 100 en trois parts égales sans perdre d'unité", () => {
    const parts = allocate(money(100, "EUR"), [1, 1, 1]);
    expect(parts.map((p) => p.amountMinor)).toEqual([34n, 33n, 33n]);
    expect(sum(parts, "EUR")).toEqual(money(100, "EUR"));
  });

  it("répartit un montant négatif", () => {
    const parts = allocate(money(-100, "GNF"), [1, 2]);
    expect(sum(parts, "GNF")).toEqual(money(-100, "GNF"));
  });

  it("refuse des poids invalides", () => {
    expect(() => allocate(money(1, "EUR"), [])).toThrow(RangeError);
    expect(() => allocate(money(1, "EUR"), [0, 0])).toThrow(RangeError);
  });
});

describe("Money — saisie et représentation", () => {
  it("lit les saisies humaines", () => {
    expect(parseMoney("1 250 000", "GNF")).toEqual(money(1250000, "GNF"));
    expect(parseMoney("12,50", "EUR")).toEqual(money(1250, "EUR"));
    expect(parseMoney("12.5", "USD")).toEqual(money(1250, "USD"));
    expect(parseMoney("-3", "EUR")).toEqual(money(-300, "EUR"));
    expect(parseMoney("7", "EUR")).toEqual(money(700, "EUR"));
  });

  it("refuse les décimales en GNF et les saisies invalides", () => {
    expect(() => parseMoney("10,5", "GNF")).toThrow(InvalidAmountError);
    expect(() => parseMoney("12,345", "EUR")).toThrow(InvalidAmountError);
    expect(() => parseMoney("abc", "EUR")).toThrow(InvalidAmountError);
    expect(() => parseMoney("", "EUR")).toThrow(InvalidAmountError);
  });

  it("produit une chaîne décimale exacte", () => {
    expect(toDecimalString(money(1250, "EUR"))).toBe("12.50");
    expect(toDecimalString(money(5, "EUR"))).toBe("0.05");
    expect(toDecimalString(money(-5, "EUR"))).toBe("-0.05");
    expect(toDecimalString(money(1250000, "GNF"))).toBe("1250000");
  });

  it("formate sans flottant, même au-delà de 2^53", () => {
    expect(plain(formatMoney(money(1250000, "GNF"), "fr"))).toBe("1 250 000 GNF");
    expect(plain(formatMoney(money(1250, "EUR"), "fr"))).toBe("12,50 €");
    expect(formatMoney(money(-1250, "USD"), "en")).toBe("-$12.50");
    const huge = money(9007199254740993n, "GNF");
    expect(plain(formatMoney(huge, "fr"))).toBe("9 007 199 254 740 993 GNF");
  });

  it("sérialise en JSON et relit", () => {
    const m = money(-1250, "EUR");
    expect(fromJson(toJson(m))).toEqual(m);
    expect(fromJson({ amountMinor: 3, currency: "GNF" })).toEqual(money(3, "GNF"));
    expect(() => fromJson({ amountMinor: "1.5", currency: "EUR" })).toThrow(InvalidAmountError);
    expect(() => fromJson({ amountMinor: "1", currency: "XOF" })).toThrow(InvalidAmountError);
  });

  it("reconnaît les devises supportées", () => {
    expect(isCurrency("GNF")).toBe(true);
    expect(isCurrency("XOF")).toBe(false);
    expect(isCurrency(3)).toBe(false);
  });
});

describe("Taux de change figés", () => {
  it("convertit EUR → GNF avec arrondi à l'unité", () => {
    const rate = parseRate("9350.25", "EUR", "GNF");
    // 12,50 € × 9350,25 = 116 878,125 → 116 878 GNF
    expect(convert(money(1250, "EUR"), rate)).toEqual(money(116878, "GNF"));
  });

  it("convertit GNF → EUR avec un petit taux", () => {
    const rate = parseRate("0,000107", "GNF", "EUR");
    // 1 000 000 GNF × 0,000107 = 107,00 €
    expect(convert(money(1000000, "GNF"), rate)).toEqual(money(10700, "EUR"));
  });

  it("le taux identité ne change rien", () => {
    expect(convert(money(42, "USD"), identityRate("USD"))).toEqual(money(42, "USD"));
  });

  it("refuse un taux appliqué à la mauvaise devise", () => {
    expect(() => convert(money(1, "USD"), parseRate("1", "EUR", "GNF"))).toThrow(RateMismatchError);
  });

  it("refuse les taux invalides", () => {
    expect(() => parseRate("0", "EUR", "GNF")).toThrow(InvalidRateError);
    expect(() => parseRate("-1", "EUR", "GNF")).toThrow(InvalidRateError);
    expect(() => parseRate("1.12345678901", "EUR", "GNF")).toThrow(InvalidRateError);
    expect(() => parseRate("x", "EUR", "GNF")).toThrow(InvalidRateError);
  });

  it("représente et inverse un taux", () => {
    const rate = parseRate("9350.2500", "EUR", "GNF");
    expect(rateToString(rate)).toBe("9350.25");
    expect(rateToString(parseRate("2", "EUR", "USD"))).toBe("2");
    const inverse = invertRate(parseRate("2", "EUR", "USD"));
    expect(inverse.from).toBe("USD");
    expect(rateToString(inverse)).toBe("0.5");
  });
});

/** Générateur pseudo-aléatoire déterministe (mulberry32) : tests reproductibles. */
function rng(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe("propriétés (B3.1)", () => {
  const random = rng(20261002);
  const int = (max: number) => Math.floor(random() * max);

  it("la somme d'une répartition vaut toujours le montant initial", () => {
    for (let run = 0; run < 2000; run += 1) {
      const amount = money(BigInt(int(2_000_000_000)) - 1_000_000_000n, "GNF");
      const weights = Array.from({ length: 1 + int(12) }, () => int(100));
      if (!weights.some((w) => w > 0)) weights[0] = 1;
      const parts = allocate(amount, weights);
      expect(parts).toHaveLength(weights.length);
      expect(sum(parts, "GNF")).toEqual(amount);
    }
  });

  it("aucune part ne s'écarte de plus d'une unité de sa part exacte", () => {
    for (let run = 0; run < 500; run += 1) {
      const amount = BigInt(int(10_000_000));
      const weights = Array.from({ length: 1 + int(8) }, () => 1 + int(50));
      const total = weights.reduce((a, b) => a + b, 0);
      allocate(money(amount, "EUR"), weights).forEach((part, i) => {
        const exact = (Number(amount) * weights[i]!) / total;
        expect(Math.abs(Number(part.amountMinor) - exact)).toBeLessThan(1.0001);
      });
    }
  });

  it("saisie et représentation décimale sont inverses l'une de l'autre", () => {
    for (let run = 0; run < 1000; run += 1) {
      for (const currency of ["GNF", "EUR", "USD"] as const) {
        const m = money(BigInt(int(1_000_000_000)) - 500_000_000n, currency);
        expect(parseMoney(toDecimalString(m), currency)).toEqual(m);
      }
    }
  });

  it("convertir puis reconvertir : écart borné par la précision du taux inverse", () => {
    // Le taux inverse est arrondi à 10 décimales : l'aller-retour n'est exact
    // qu'à 1 unité + 10^-6 relatif près. C'est pourquoi un montant converti est
    // toujours figé dans sa ligne et jamais recalculé (ADR-002).
    const rate = parseRate("9350", "EUR", "GNF");
    for (let run = 0; run < 500; run += 1) {
      const eur = money(BigInt(int(100_000_000)), "EUR");
      const back = convert(convert(eur, rate), invertRate(rate));
      const tolerance = 1 + Number(eur.amountMinor) * 1e-6;
      expect(Math.abs(Number(back.amountMinor - eur.amountMinor))).toBeLessThanOrEqual(tolerance);
    }
  });
});
