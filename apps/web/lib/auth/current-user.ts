import "server-only";

import { and, eq, isNull } from "drizzle-orm";

import { users, type User } from "@missionops/db";

import { getSessionUserId } from "./session";
import { getDb } from "../db";

export type CurrentUser = Pick<User, "id" | "email" | "fullName" | "locale">;

/**
 * Renvoie l'utilisateur associé à la session courante, ou `null`. À utiliser
 * dans les composants serveur et les actions pour garder les routes.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const userId = await getSessionUserId();
  if (!userId) {
    return null;
  }

  const rows = await getDb()
    .select({
      id: users.id,
      email: users.email,
      fullName: users.fullName,
      locale: users.locale,
    })
    .from(users)
    .where(and(eq(users.id, userId), isNull(users.deletedAt)))
    .limit(1);

  return rows[0] ?? null;
}
