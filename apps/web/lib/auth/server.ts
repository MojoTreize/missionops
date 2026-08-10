import "server-only";

import { headers } from "next/headers";

import { LOGIN_RATE_LIMIT } from "./config";
import { InMemoryRateLimiter } from "./rate-limit";

/**
 * Limiteur de connexion partagé (instance unique). Suffisant pour un
 * déploiement mono-instance ; remplaçable par un magasin partagé plus tard.
 */
export const loginRateLimiter = new InMemoryRateLimiter(LOGIN_RATE_LIMIT);

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
