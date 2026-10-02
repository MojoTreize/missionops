import "server-only";

import { headers } from "next/headers";

import { DbRateLimiter } from "@missionops/services";

import { getDb } from "@/lib/db";

import { LOGIN_RATE_LIMIT } from "./config";

/**
 * Limiteur de connexion partagé entre instances (B8.3), adossé à la base :
 * il survit aux redémarrages et protège toutes les instances à la fois.
 */
let limiter: DbRateLimiter | undefined;

export function loginRateLimiter(): DbRateLimiter {
  limiter ??= new DbRateLimiter(getDb(), LOGIN_RATE_LIMIT);
  return limiter;
}

/** Normalise une adresse e-mail (espaces retirés, minuscules). */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** IP cliente déduite des en-têtes, pour la clé de limitation de débit. */
export async function clientIp(): Promise<string> {
  const store = await headers();
  const forwarded = store.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "local";
}

/** URL de base de l'application, déduite des en-têtes de la requête. */
export async function baseUrl(): Promise<string> {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (envUrl) {
    return envUrl;
  }
  const store = await headers();
  const host = store.get("host") ?? "localhost:3000";
  const proto = store.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}
