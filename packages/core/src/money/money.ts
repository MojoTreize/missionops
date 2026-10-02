import { decimalsOf, isCurrency, pow10, type Currency } from "./currency";

/**
 * Montant monétaire (ADR-002) : un entier en unités mineures et une devise.
 * Jamais de flottant. Toute opération passe par les fonctions de ce module.
 */
export interface Money {
  readonly amountMinor: bigint;
  readonly currency: Currency;
}

export class CurrencyMismatchError extends Error {
  constructor(
    readonly left: Currency,
    readonly right: Currency,
  ) {
    super(`Devises incompatibles : ${left} et ${right}`);
    this.name = "CurrencyMismatchError";
  }
}

export class InvalidAmountError extends Error {
  constructor(readonly input: string) {
    super(`Montant invalide : « ${input} »`);
    this.name = "InvalidAmountError";
  }
}

export function money(amountMinor: bigint | number, currency: Currency): Money {
  if (typeof amountMinor === "number" && !Number.isSafeInteger(amountMinor)) {
    throw new InvalidAmountError(String(amountMinor));
  }
  return { amountMinor: BigInt(amountMinor), currency };
}

export function zero(currency: Currency): Money {
  return { amountMinor: 0n, currency };
}

function assertSame(a: Money, b: Money): void {
  if (a.currency !== b.currency) {
    throw new CurrencyMismatchError(a.currency, b.currency);
  }
}

export function add(a: Money, b: Money): Money {
  assertSame(a, b);
  return { amountMinor: a.amountMinor + b.amountMinor, currency: a.currency };
}

export function subtract(a: Money, b: Money): Money {
  assertSame(a, b);
  return { amountMinor: a.amountMinor - b.amountMinor, currency: a.currency };
}

export function negate(a: Money): Money {
  return { amountMinor: -a.amountMinor, currency: a.currency };
}

export function abs(a: Money): Money {
  return a.amountMinor < 0n ? negate(a) : a;
}

/** Somme d'une liste de montants de même devise (zéro si la liste est vide). */
export function sum(items: readonly Money[], currency: Currency): Money {
  return items.reduce((acc, item) => add(acc, item), zero(currency));
}

export function compare(a: Money, b: Money): -1 | 0 | 1 {
  assertSame(a, b);
  if (a.amountMinor < b.amountMinor) return -1;
  if (a.amountMinor > b.amountMinor) return 1;
  return 0;
}

export function equals(a: Money, b: Money): boolean {
  return a.currency === b.currency && a.amountMinor === b.amountMinor;
}

export function isZero(a: Money): boolean {
  return a.amountMinor === 0n;
}

export function isNegative(a: Money): boolean {
  return a.amountMinor < 0n;
}

export function isPositive(a: Money): boolean {
  return a.amountMinor > 0n;
}

/**
 * Division entière arrondie au plus proche, demi-unité éloignée de zéro
 * (« arrondi commercial »). Seule règle d'arrondi du produit.
 */
export function divRound(numerator: bigint, denominator: bigint): bigint {
  if (denominator === 0n) {
    throw new RangeError("Division par zéro");
  }
  const negative = numerator < 0n !== denominator < 0n;
  const n = numerator < 0n ? -numerator : numerator;
  const d = denominator < 0n ? -denominator : denominator;
  const quotient = n / d;
  const remainder = n % d;
  const rounded = remainder * 2n >= d ? quotient + 1n : quotient;
  return negative ? -rounded : rounded;
}

/** Multiplie un montant par une quantité entière (ex. 3 nuitées). */
export function multiply(a: Money, quantity: bigint | number): Money {
  return { amountMinor: a.amountMinor * BigInt(quantity), currency: a.currency };
}

/**
 * Applique un pourcentage exprimé en points de base (12000 = 120 %), avec
 * arrondi commercial.
 */
export function percentOf(a: Money, basisPoints: number): Money {
  return {
    amountMinor: divRound(a.amountMinor * BigInt(basisPoints), 10000n),
    currency: a.currency,
  };
}

/**
 * Répartit un montant en parts selon des poids entiers, sans perte ni création
 * d'unité mineure : la somme des parts vaut toujours le total.
 */
export function allocate(a: Money, weights: readonly number[]): Money[] {
  if (weights.length === 0) {
    throw new RangeError("Au moins un poids est requis");
  }
  const totalWeight = weights.reduce((acc, w) => acc + BigInt(w), 0n);
  if (totalWeight <= 0n) {
    throw new RangeError("La somme des poids doit être positive");
  }
  const parts = weights.map((w) => (a.amountMinor * BigInt(w)) / totalWeight);
  let remainder = a.amountMinor - parts.reduce((acc, p) => acc + p, 0n);
  const step = remainder < 0n ? -1n : 1n;
  for (let i = 0; remainder !== 0n; i = (i + 1) % parts.length) {
    parts[i] = parts[i]! + step;
    remainder -= step;
  }
  return parts.map((p) => ({ amountMinor: p, currency: a.currency }));
}

/**
 * Lit un montant saisi par un humain (« 1 250 000 », « 12,50 », « 12.5 ») dans
 * la devise donnée. Refuse plus de décimales que la devise n'en autorise.
 */
export function parseMoney(input: string, currency: Currency): Money {
  const cleaned = input
    .trim()
    .replace(/[\s\u00a0\u202f']/g, "")
    .replace(",", ".");
  if (!/^-?\d+(\.\d+)?$/.test(cleaned)) {
    throw new InvalidAmountError(input);
  }
  const negative = cleaned.startsWith("-");
  const unsigned = negative ? cleaned.slice(1) : cleaned;
  const [integerPart = "0", fractionPart = ""] = unsigned.split(".");
  const decimals = decimalsOf(currency);
  if (fractionPart.length > decimals) {
    throw new InvalidAmountError(input);
  }
  const minor =
    BigInt(integerPart) * pow10(decimals) + BigInt(fractionPart.padEnd(decimals, "0") || "0");
  return { amountMinor: negative ? -minor : minor, currency };
}

/**
 * Représentation décimale exacte (« 12.50 », « 1250000 »), sans séparateur de
 * milliers. Sert aux exports et aux champs de formulaire.
 */
export function toDecimalString(a: Money): string {
  const decimals = decimalsOf(a.currency);
  const negative = a.amountMinor < 0n;
  const absolute = negative ? -a.amountMinor : a.amountMinor;
  const padded = absolute.toString().padStart(decimals + 1, "0");
  const integerPart = padded.slice(0, padded.length - decimals);
  const fraction = decimals > 0 ? `.${padded.slice(padded.length - decimals)}` : "";
  return `${negative ? "-" : ""}${integerPart}${fraction}`;
}

/**
 * Formate un montant pour l'affichage, sans jamais passer par un flottant : on
 * formate la partie entière (bigint, exact) avec `Intl`, puis on recompose.
 */
export function formatMoney(a: Money, locale = "fr"): string {
  const decimals = decimalsOf(a.currency);
  const negative = a.amountMinor < 0n;
  const absolute = negative ? -a.amountMinor : a.amountMinor;
  const divisor = pow10(decimals);
  const integerPart = absolute / divisor;
  const fractionPart = (absolute % divisor).toString().padStart(decimals, "0");

  const formatter = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: a.currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  // On formate « 1 » avec le bon nombre de décimales pour connaître la forme
  // (position du symbole, séparateur décimal), puis on substitue les chiffres.
  const parts = formatter.formatToParts(negative ? -1 : 1);
  const groupFormatter = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });
  return parts
    .map((part) => {
      if (part.type === "integer") return groupFormatter.format(integerPart);
      if (part.type === "fraction") return fractionPart;
      return part.value;
    })
    .join("");
}

/** Sérialisation JSON sûre (le bigint n'est pas sérialisable nativement). */
export interface MoneyJson {
  amountMinor: string;
  currency: Currency;
}

export function toJson(a: Money): MoneyJson {
  return { amountMinor: a.amountMinor.toString(), currency: a.currency };
}

export function fromJson(value: { amountMinor: string | number; currency: string }): Money {
  if (!isCurrency(value.currency)) {
    throw new InvalidAmountError(String(value.currency));
  }
  const raw = String(value.amountMinor);
  if (!/^-?\d+$/.test(raw)) {
    throw new InvalidAmountError(raw);
  }
  return { amountMinor: BigInt(raw), currency: value.currency };
}
