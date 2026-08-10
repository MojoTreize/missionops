import { index, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

import { timestamps } from "./columns";
import { organisations } from "./organisations";
import { users } from "./users";

/**
 * `invitations` — invitation d'une adresse e-mail à rejoindre une organisation
 * avec un rôle donné (B1.6).
 *
 * Comme les autres jetons, seule l'empreinte SHA-256 est stockée. L'invitation
 * est valable jusqu'à `expires_at` et devient inutilisable une fois
 * `accepted_at` renseigné.
 */
export const invitations = pgTable(
  "invitations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organisationId: uuid("organisation_id")
      .notNull()
      .references(() => organisations.id),
    // Adresse invitée, normalisée en minuscules.
    email: text("email").notNull(),
    // Rôle attribué à l'acceptation.
    role: text("role").notNull().default("collaborateur"),
    // Empreinte SHA-256 du jeton d'invitation (hex).
    tokenHash: text("token_hash").notNull(),
    // Auteur de l'invitation.
    invitedBy: uuid("invited_by").references(() => users.id),
    // Expiration absolue.
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    // Renseigné à l'acceptation (usage unique).
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("invitations_token_hash_key").on(table.tokenHash),
    index("invitations_organisation_id_idx").on(table.organisationId),
    index("invitations_email_idx").on(table.email),
  ],
);

export type Invitation = typeof invitations.$inferSelect;
export type NewInvitation = typeof invitations.$inferInsert;
