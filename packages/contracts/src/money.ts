import { CURRENCIES, parseMoney, parseRate, type Currency } from "@missionops/core";
import { z } from "zod";

export const currency = z.enum(CURRENCIES);

/**
 * Montant saisi (« 1 250 000 », « 12,50 ») validé contre sa devise. Produit un
 * `amountMinor` bigint exact : jamais de flottant.
 */
export const moneyInput = z
  .object({ amount: z.string().trim().min(1), currency })
  .transform((value, ctx) => {
    try {
      return parseMoney(value.amount, value.currency);
    } catch {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "invalid_amount", path: ["amount"] });
      return z.NEVER;
    }
  });

/** Taux décimal positif (« 9350,25 »). */
export const rateString = z
  .string()
  .trim()
  .refine((v) => {
    try {
      parseRate(v, "EUR", "GNF");
      return true;
    } catch {
      return false;
    }
  }, "invalid_rate");

export const fxRateInput = z
  .object({
    fromCurrency: currency,
    toCurrency: currency,
    rate: rateString,
    effectiveOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  })
  .refine((v) => v.fromCurrency !== v.toCurrency, {
    message: "same_currency",
    path: ["toCurrency"],
  });

export type FxRateInput = z.infer<typeof fxRateInput>;

export function isSupportedCurrency(value: string): value is Currency {
  return (CURRENCIES as readonly string[]).includes(value);
}
