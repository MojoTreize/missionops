import { index, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

import { timestamps } from "./columns";
import { users } from "./users";

/**
 * `auth_tokens` — jetons d'authentification à usage unique (B1.5) : lien
 * magique de connexion et réinitialisation de mot de passe.
 *
 * Comme pour les sessions, seule l'empreinte SHA-256 (`token_hash`) est
 * stockée. Un jeton est valable jusqu'à `expires_at` et devient inutilisable
 * une fois `used_at` renseigné (usage unique). Le champ `type` reste un `text`
 * (pas d'`enum` PostgreSQL, §7.6) : « magic_link » ou « password_reset ».
 */
export const authTokens = pgTable(
  "auth_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    // « magic_link » ou « password_reset ».
    type: text("type").notNull(),
    // Empreinte SHA-256 du jeton en clair (hex).
    tokenHash: text("token_hash").notNull(),
    // Instant d'expiration absolu.
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    // Renseigné au premier usage : garantit l'usage unique.
    usedAt: timestamp("used_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("auth_tokens_token_hash_key").on(table.tokenHash),
    index("auth_tokens_user_id_idx").on(table.userId),
  ],
);

export type AuthToken = typeof authTokens.$inferSelect;
export type NewAuthToken = typeof authTokens.$inferInsert;
