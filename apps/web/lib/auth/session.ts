import "server-only";

import { and, eq, gt, isNull } from "drizzle-orm";
import { cookies } from "next/headers";

import { sessions } from "@missionops/db";

import { SESSION_COOKIE_NAME, SESSION_TTL_MS } from "./config";
import { generateToken, hashToken } from "./tokens";
import { getDb } from "../db";

/**
 * Cycle de vie des sessions, côté serveur. Le navigateur ne détient qu'un jeton
 * opaque dans un cookie `httpOnly` ; la base ne stocke que son empreinte.
 */

function cookieOptions(maxAgeMs: number) {
  return {
    httpOnly: true,
    secure: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge: Math.floor(maxAgeMs / 1000),
  };
}

/** Crée une session pour l'utilisateur et pose le cookie. */
export async function createSession(userId: string): Promise<void> {
  const rawToken = generateToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await getDb().insert(sessions).values({ userId, tokenHash, expiresAt });

  const store = await cookies();
  store.set(SESSION_COOKIE_NAME, rawToken, cookieOptions(SESSION_TTL_MS));
}

/** Renvoie l'`userId` de la session valide, ou `null`. */
export async function getSessionUserId(): Promise<string | null> {
  const store = await cookies();
  const rawToken = store.get(SESSION_COOKIE_NAME)?.value;
  if (!rawToken) {
    return null;
  }

  const tokenHash = hashToken(rawToken);
  const rows = await getDb()
    .select({ userId: sessions.userId })
    .from(sessions)
    .where(
      and(
        eq(sessions.tokenHash, tokenHash),
        isNull(sessions.deletedAt),
        gt(sessions.expiresAt, new Date()),
      ),
    )
    .limit(1);

  return rows[0]?.userId ?? null;
}

/** Révoque la session courante (suppression logique) et supprime le cookie. */
export async function destroySession(): Promise<void> {
  const store = await cookies();
  const rawToken = store.get(SESSION_COOKIE_NAME)?.value;
  if (rawToken) {
    const tokenHash = hashToken(rawToken);
    await getDb()
      .update(sessions)
      .set({ deletedAt: new Date() })
      .where(and(eq(sessions.tokenHash, tokenHash), isNull(sessions.deletedAt)));
  }
  store.delete(SESSION_COOKIE_NAME);
}
