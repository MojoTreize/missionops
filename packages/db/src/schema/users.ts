import { pgTable, text, uniqueIndex, uuid } from "drizzle-orm/pg-core";

import { timestamps } from "./columns";

/**
 * `users` — compte individuel, indépendant de l'organisation. Un même
 * utilisateur peut appartenir à plusieurs organisations via `memberships`
 * (bloc B1.6). Les éléments d'authentification (mot de passe, sessions, liens
 * magiques) arrivent au bloc B1.5.
 */
export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // Adresse e-mail, normalisée en minuscules par la couche applicative.
    email: text("email").notNull(),
    // Nom complet affiché.
    fullName: text("full_name"),
    // Empreinte du mot de passe (scrypt) — voie de secours, ADR-005 B1.5.
    // Nul tant que l'utilisateur n'a défini que la connexion par lien magique.
    passwordHash: text("password_hash"),
    // Langue préférée (i18n dès le socle, ADR-008) : « fr » ou « en ».
    locale: text("locale").notNull().default("fr"),
    ...timestamps,
  },
  (table) => [uniqueIndex("users_email_key").on(table.email)],
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
