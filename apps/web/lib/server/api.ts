import "server-only";

import { NextResponse } from "next/server";

import { DbRateLimiter, ServiceError, type ServiceContext } from "@missionops/services";

import { getDb } from "@/lib/db";

import { clientIp } from "@/lib/auth/server";
import { getActor } from "@/lib/policy";

import { log } from "./log";

/**
 * Aides des routes d'API (JSON) : contexte de service sans redirection, et
 * traduction des erreurs de service en statut HTTP.
 */
export async function apiContext(): Promise<ServiceContext | null> {
  const actor = await getActor();
  if (!actor) return null;
  return {
    organisationId: actor.organisationId,
    actor: { userId: actor.userId, role: actor.role },
    now: new Date(),
    ip: await clientIp(),
  };
}

/**
 * Limitation de débit des routes de mutation (B8.3) : par utilisateur, fenêtre
 * d'une minute. Partagée entre instances (table `rate_limits`).
 */
const limiters = new Map<string, DbRateLimiter>();

export async function rateLimited(
  ctx: ServiceContext,
  bucket: string,
  max: number,
): Promise<NextResponse | null> {
  let limiter = limiters.get(bucket);
  if (!limiter) {
    limiter = new DbRateLimiter(getDb(), { max, windowMs: 60_000 });
    limiters.set(bucket, limiter);
  }
  const key = `${bucket}:${ctx.actor.userId}`;
  if (await limiter.isLimited(key)) {
    return NextResponse.json(
      { error: "rate_limited" },
      { status: 429, headers: { "retry-after": "60" } },
    );
  }
  await limiter.record(key);
  return null;
}

export function unauthorized() {
  return NextResponse.json({ error: "unauthorized" }, { status: 401 });
}

export function apiError(error: unknown) {
  if (error instanceof ServiceError) {
    const status = error.code === "forbidden" ? 403 : error.code === "not_found" ? 404 : 422;
    return NextResponse.json({ error: error.code, details: error.details }, { status });
  }
  log("error", "api_error", { error });
  return NextResponse.json({ error: "server_error" }, { status: 500 });
}

/** Sérialise en JSON en convertissant les bigint en chaînes. */
export function json(data: unknown, init?: ResponseInit) {
  return new NextResponse(
    JSON.stringify(data, (_, value) => (typeof value === "bigint" ? value.toString() : value)),
    { ...init, headers: { "content-type": "application/json", ...(init?.headers ?? {}) } },
  );
}
