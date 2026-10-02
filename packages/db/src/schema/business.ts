import { sql } from "drizzle-orm";
import { index, uuid, type ExtraConfigColumn } from "drizzle-orm/pg-core";

import { timestamps } from "./columns";
import { organisations } from "./organisations";
import { users } from "./users";

/**
 * Colonnes obligatoires de toute table métier (plan §7.5) : identifiant,
 * organisation (ADR-001), auteur et horodatages, suppression logique (ADR-005).
 * L'identifiant peut être fourni par le client (UUID généré hors ligne, ADR-003).
 */
export function businessColumns() {
  return {
    id: uuid("id").primaryKey().defaultRandom(),
    organisationId: uuid("organisation_id")
      .notNull()
      .references(() => organisations.id),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => users.id),
    updatedBy: uuid("updated_by").references(() => users.id),
    ...timestamps,
  };
}

/** L'index qui compte (plan §7.5) : `(organisation_id, created_at desc)` des lignes actives. */
export function orgCreatedIndex(
  name: string,
  table: { organisationId: ExtraConfigColumn; createdAt: ExtraConfigColumn },
) {
  return index(name)
    .on(table.organisationId, table.createdAt.desc())
    .where(sql`deleted_at is null`);
}
