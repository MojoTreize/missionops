import { sql } from "drizzle-orm";
import { jsonb, pgTable, text, uniqueIndex, uuid } from "drizzle-orm/pg-core";

import { timestamps } from "./columns";

/**
 * `organisations` — le locataire (tenant). Multi-tenant par colonne partagée
 * (ADR-001) : c'est la table racine à laquelle toutes les tables métier se
 * rattacheront par `organisation_id`.
 */
export const organisations = pgTable(
  "organisations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // Nom affiché de l'organisation.
    name: text("name").notNull(),
    // Identifiant lisible et stable dans les URL (ex. « croix-rouge-gn »).
    slug: text("slug").notNull(),
    // Code pays ISO 3166-1 alpha-2 (ex. « GN »).
    country: text("country"),
    // Devise de base, code ISO 4217 (ex. « GNF »). Table `currencies` en phase 3.
    baseCurrency: text("base_currency").notNull().default("GNF"),
    // Fuseau IANA (ex. « Africa/Conakry »).
    timezone: text("timezone").notNull().default("Africa/Conakry"),
    // Paramétrage libre typé côté application.
    settings: jsonb("settings")
      .notNull()
      .default(sql`'{}'::jsonb`),
    ...timestamps,
  },
  (table) => [uniqueIndex("organisations_slug_key").on(table.slug)],
);

export type Organisation = typeof organisations.$inferSelect;
export type NewOrganisation = typeof organisations.$inferInsert;
