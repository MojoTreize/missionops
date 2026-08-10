import { index, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

import { timestamps } from "./columns";
import { users } from "./users";

/**
 * `sessions` — session authentifiée d'un utilisateur (B1.5).
 *
 * Le cookie envoyé au navigateur contient un jeton opaque aléatoire ; seule son
 * empreinte SHA-256 (`token_hash`) est stockée ici, jamais le jeton en clair.
 * La révocation (déconnexion) se fait par suppression logique via `deleted_at`
 * (ADR-005), on ne fait pas de `DELETE` physique.
 */
export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    // Empreinte SHA-256 du jeton de session (hex). Le jeton en clair n'est
    // jamais persisté.
    tokenHash: text("token_hash").notNull(),
    // Instant d'expiration absolu de la session.
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("sessions_token_hash_key").on(table.tokenHash),
    index("sessions_user_id_idx").on(table.userId),
  ],
);

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
