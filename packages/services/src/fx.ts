import { fxRateInput } from "@missionops/contracts";
import {
  identityRate,
  invertRate,
  parseRate,
  rateToString,
  type Currency,
  type FxRate,
} from "@missionops/core";
import { exchangeRates, type Db } from "@missionops/db";
import { and, desc, eq, isNull, lte } from "drizzle-orm";

import { ServiceError, authorize, parse, tenant, type ServiceContext } from "./context";

/**
 * Taux de change datés (B3.2, ADR-002). Une ligne monétaire fige le taux trouvé
 * au moment de sa saisie ; ce service ne recalcule jamais l'historique.
 */
export interface RateView {
  id: string;
  fromCurrency: Currency;
  toCurrency: Currency;
  rate: string;
  effectiveOn: string;
  source: string;
  createdAt: Date;
}

export async function listRates(db: Db, ctx: ServiceContext): Promise<RateView[]> {
  authorize(ctx, "read", "fxRate");
  return tenant(db, ctx, async (tx) => {
    const rows = await tx
      .select()
      .from(exchangeRates)
      .where(isNull(exchangeRates.deletedAt))
      .orderBy(desc(exchangeRates.effectiveOn), desc(exchangeRates.createdAt))
      .limit(200);
    return rows.map((r) => ({
      id: r.id,
      fromCurrency: r.fromCurrency as Currency,
      toCurrency: r.toCurrency as Currency,
      rate: rateToString(parseRate(r.rate, r.fromCurrency as Currency, r.toCurrency as Currency)),
      effectiveOn: r.effectiveOn,
      source: r.source,
      createdAt: r.createdAt,
    }));
  });
}

export async function addRate(db: Db, ctx: ServiceContext, input: unknown): Promise<void> {
  authorize(ctx, "create", "fxRate");
  const value = parse(fxRateInput, input);
  const rate = parseRate(value.rate, value.fromCurrency, value.toCurrency);
  await tenant(db, ctx, async (tx) => {
    await tx.insert(exchangeRates).values({
      organisationId: ctx.organisationId,
      createdBy: ctx.actor.userId,
      fromCurrency: value.fromCurrency,
      toCurrency: value.toCurrency,
      rate: rateToString(rate),
      effectiveOn: value.effectiveOn,
    });
  });
}

export interface ResolvedRate {
  rate: FxRate;
  /** Date d'effet du taux trouvé (ou du jour, pour l'identité). */
  date: string;
}

/**
 * Taux de `from` vers `to` en vigueur à une date : le plus récent dont la date
 * d'effet est antérieure ou égale ; à défaut, l'inverse du taux réciproque.
 * Lève `rate_missing` si aucun taux n'est connu.
 */
export async function resolveRate(
  tx: Db,
  from: Currency,
  to: Currency,
  on: string,
): Promise<ResolvedRate> {
  if (from === to) return { rate: identityRate(from), date: on };
  const find = (a: Currency, b: Currency) =>
    tx
      .select()
      .from(exchangeRates)
      .where(
        and(
          eq(exchangeRates.fromCurrency, a),
          eq(exchangeRates.toCurrency, b),
          lte(exchangeRates.effectiveOn, on),
          isNull(exchangeRates.deletedAt),
        ),
      )
      .orderBy(desc(exchangeRates.effectiveOn), desc(exchangeRates.createdAt))
      .limit(1);
  const direct = (await find(from, to))[0];
  if (direct) return { rate: parseRate(direct.rate, from, to), date: direct.effectiveOn };
  const reverse = (await find(to, from))[0];
  if (reverse) {
    return { rate: invertRate(parseRate(reverse.rate, to, from)), date: reverse.effectiveOn };
  }
  throw new ServiceError("rate_missing", { from, to, on });
}

/** Taux fourni manuellement (saisie de la ligne) ou résolu dans la table. */
export async function rateFor(
  tx: Db,
  from: Currency,
  to: Currency,
  on: string,
  manual?: string | null,
): Promise<ResolvedRate> {
  if (from !== to && manual) {
    return { rate: parseRate(manual, from, to), date: on };
  }
  return resolveRate(tx, from, to, on);
}
