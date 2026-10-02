import { can, type Action, type Resource, type Role } from "@missionops/core";
import { withTenant, type Db } from "@missionops/db";
import type { z } from "zod";

/**
 * Contexte d'un appel de service : qui agit, pour quelle organisation, à quel
 * instant. Le temps est injecté (jamais `Date.now()` dans le domaine).
 */
export interface ServiceContext {
  organisationId: string;
  actor: { userId: string; role: Role };
  now: Date;
  ip?: string | null;
}

/**
 * Erreur de service : un code stable, traduisible par l'interface, et des
 * détails facultatifs (erreurs par champ, codes du domaine).
 */
export class ServiceError extends Error {
  constructor(
    readonly code: string,
    readonly details: Record<string, string> = {},
  ) {
    super(code);
    this.name = "ServiceError";
  }
}

/** Exige un droit de la matrice (B1.8) : seule porte d'autorisation. */
export function authorize(ctx: ServiceContext, action: Action, resource: Resource): void {
  if (!can(ctx.actor, action, resource)) {
    throw new ServiceError("forbidden");
  }
}

/**
 * Exécute `fn` dans une transaction isolée sur l'organisation (RLS) avec le
 * contexte d'audit (acteur, IP) : toute mutation est journalisée par la base.
 */
export function tenant<T>(db: Db, ctx: ServiceContext, fn: (tx: Db) => Promise<T>): Promise<T> {
  return withTenant(
    db,
    { organisationId: ctx.organisationId, actorId: ctx.actor.userId, ip: ctx.ip ?? null },
    (tx) => fn(tx as Db),
  );
}

/** Valide une entrée avec un schéma partagé ; lève `invalid_input` sinon. */
export function parse<S extends z.ZodTypeAny>(schema: S, input: unknown): z.output<S> {
  const result = schema.safeParse(input);
  if (!result.success) {
    const details: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const key = issue.path.join(".") || "_";
      if (!(key in details)) details[key] = issue.message;
    }
    throw new ServiceError("invalid_input", details);
  }
  return result.data;
}

/** Jour calendaire ISO de l'instant, dans le fuseau donné. */
export function isoDay(at: Date, timeZone = "Africa/Conakry"): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(at);
}

export function first<T>(rows: T[]): T {
  const row = rows[0];
  if (!row) throw new ServiceError("not_found");
  return row;
}
