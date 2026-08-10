import { index, pgTable, text, uniqueIndex, uuid } from "drizzle-orm/pg-core";

import { timestamps } from "./columns";
import { organisations } from "./organisations";
import { users } from "./users";

/**
 * `memberships` — lien utilisateur × organisation × rôle (B1.6).
 *
 * Un utilisateur peut appartenir à plusieurs organisations ; chaque
 * appartenance porte un rôle. Le rôle est un `text` pour l'instant (pas d'`enum`
 * PostgreSQL, §7.6) ; il sera formalisé par la table `roles` et la matrice de
 * permissions au bloc B1.8.
 */
export const memberships = pgTable(
  "memberships",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organisationId: uuid("organisation_id")
      .notNull()
      .references(() => organisations.id),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    // « admin » pour le créateur, « collaborateur » par défaut (B1.8 affinera).
    role: text("role").notNull().default("collaborateur"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("memberships_org_user_key").on(table.organisationId, table.userId),
    index("memberships_user_id_idx").on(table.userId),
  ],
);

export type Membership = typeof memberships.$inferSelect;
export type NewMembership = typeof memberships.$inferInsert;
