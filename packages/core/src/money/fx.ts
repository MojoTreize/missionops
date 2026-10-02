import { decimalsOf, pow10, type Currency } from "./currency";
import { divRound, type Money } from "./money";

/**
 * Taux de change (ADR-002) : « 1 unité de `from` vaut `rate` unités de `to` »,
 * en unités majeures. Le taux est un décimal exact stocké comme entier mis à
 * l'échelle (`RATE_SCALE` décimales), jamais comme flottant.
 *
 * Un taux est figé dans chaque ligne qui l'utilise (avance, dépense, budget) :
 * aucun historique n'est recalculé au taux du jour.
 */
export const RATE_SCALE = 10;
const RATE_FACTOR = pow10(RATE_SCALE);

export interface FxRate {
  readonly from: Currency;
  readonly to: Currency;
  /** Taux × 10^RATE_SCALE. */
  readonly scaled: bigint;
}

export class InvalidRateError extends Error {
  constructor(readonly input: string) {
    super(`Taux de change invalide : « ${input} »`);
    this.name = "InvalidRateError";
  }
}

export class RateMismatchError extends Error {
  constructor(
    readonly expected: Currency,
    readonly actual: Currency,
  ) {
    super(`Le taux s'applique à ${expected}, pas à ${actual}`);
    this.name = "RateMismatchError";
  }
}

/** Lit un taux décimal (« 9350.25 », « 0,000107 »). Strictement positif. */
export function parseRate(input: string, from: Currency, to: Currency): FxRate {
  const cleaned = input
    .trim()
    .replace(/[\s  ]/g, "")
    .replace(",", ".");
  if (!/^\d+(\.\d+)?$/.test(cleaned)) {
    throw new InvalidRateError(input);
  }
  const [integerPart = "0", fractionPart = ""] = cleaned.split(".");
  if (fractionPart.length > RATE_SCALE) {
    throw new InvalidRateError(input);
  }
  const scaled = BigInt(integerPart) * RATE_FACTOR + BigInt(fractionPart.padEnd(RATE_SCALE, "0"));
  if (scaled <= 0n) {
    throw new InvalidRateError(input);
  }
  return { from, to, scaled };
}

/** Taux identité (même devise). */
export function identityRate(currency: Currency): FxRate {
  return { from: currency, to: currency, scaled: RATE_FACTOR };
}

/** Représentation décimale exacte du taux, sans zéros inutiles (« 9350.25 »). */
export function rateToString(rate: FxRate): string {
  const integerPart = rate.scaled / RATE_FACTOR;
  const fraction = (rate.scaled % RATE_FACTOR)
    .toString()
    .padStart(RATE_SCALE, "0")
    .replace(/0+$/, "");
  return fraction ? `${integerPart}.${fraction}` : integerPart.toString();
}

/**
 * Convertit un montant avec un taux figé. Arrondi commercial à l'unité mineure
 * de la devise cible.
 *
 *   cible_mineur = source_mineur × taux × 10^déc(cible) / (10^déc(source) × 10^ÉCHELLE)
 */
export function convert(amount: Money, rate: FxRate): Money {
  if (amount.currency !== rate.from) {
    throw new RateMismatchError(rate.from, amount.currency);
  }
  if (rate.from === rate.to) {
    return amount;
  }
  const numerator = amount.amountMinor * rate.scaled * pow10(decimalsOf(rate.to));
  const denominator = pow10(decimalsOf(rate.from)) * RATE_FACTOR;
  return { amountMinor: divRound(numerator, denominator), currency: rate.to };
}

/** Taux inverse (« 1 GNF = x EUR » à partir de « 1 EUR = y GNF »). */
export function invertRate(rate: FxRate): FxRate {
  return {
    from: rate.to,
    to: rate.from,
    scaled: divRound(RATE_FACTOR * RATE_FACTOR, rate.scaled),
  };
}
