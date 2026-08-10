import "server-only";

import { and, eq, gt, isNull } from "drizzle-orm";

import { authTokens } from "@missionops/db";

import type { AuthTokenType } from "./config";
import { generateToken, hashToken } from "./tokens";
import { getDb } from "../db";

/**
 * Jetons à usage unique stockés dans `auth_tokens` (lien magique,
 * réinitialisation). On renvoie le jeton en clair à l'appelant (pour l'e-mail)
 * mais on ne stocke que son empreinte.
 */

/** Émet un jeton et renvoie sa valeur en clair. */
export async function issueAuthToken(
  userId: string,
  type: AuthTokenType,
  ttlMs: number,
): Promise<string> {
  const rawToken = generateToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + ttlMs);

  await getDb().insert(authTokens).values({ userId, type, tokenHash, expiresAt });
  return rawToken;
}

/**
 * Consomme un jeton : vérifie qu'il existe, du bon type, non expiré et non
 * utilisé, puis le marque comme utilisé. Renvoie l'`userId`, ou `null` si le
 * jeton est invalide, expiré ou déjà consommé.
 */
export async function consumeAuthToken(
  rawToken: string,
  type: AuthTokenType,
): Promise<string | null> {
  const tokenHash = hashToken(rawToken);
  const db = getDb();

  const rows = await db
    .update(authTokens)
    .set({ usedAt: new Date() })
    .where(
      and(
        eq(authTokens.tokenHash, tokenHash),
        eq(authTokens.type, type),
        isNull(authTokens.usedAt),
        gt(authTokens.expiresAt, new Date()),
      ),
    )
    .returning({ userId: authTokens.userId });

  return rows[0]?.userId ?? null;
}
