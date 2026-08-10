import { timestamp } from "drizzle-orm/pg-core";

/**
 * Colonnes temporelles communes à toutes les tables.
 *
 * - `createdAt` / `updatedAt` : instants (`timestamptz`), jamais nuls.
 * - `deletedAt` : suppression logique généralisée (ADR-005). Une ligne dont
 *   `deleted_at` n'est pas nul est considérée supprimée ; on ne fait jamais de
 *   `DELETE` physique sur les données métier.
 *
 * Les colonnes multi-tenant obligatoires (`organisation_id`, `created_by`, …)
 * sont ajoutées table par table à partir du bloc B1.6, une fois `memberships`
 * en place. `organisations` et `users` sont des tables fondatrices : elles ne
 * portent pas d'`organisation_id`.
 */
export const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
};
