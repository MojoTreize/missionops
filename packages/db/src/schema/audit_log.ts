import { index, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

/**
 * `audit_log` — journal d'audit en écriture seule (B1.9, ADR-004).
 *
 * Chaque mutation d'une table métier (INSERT / UPDATE / DELETE) produit une
 * ligne, écrite par un déclencheur PostgreSQL générique (`audit_row_change`)
 * plutôt que par le code applicatif : impossible à oublier, et une modification
 * faite directement en SQL est journalisée de la même façon.
 *
 * La table est *append-only* : aucun droit `UPDATE` ni `DELETE`, même pour le
 * rôle applicatif, et un déclencheur `audit_log_immutable` rejette toute
 * tentative de modification (migration `0005_audit_log`). On ne pose pas de clé
 * étrangère : le journal doit survivre indépendamment du cycle de vie des
 * lignes qu'il trace.
 *
 * Elle porte tout de même `organisation_id` et l'isolation multi-tenant : la
 * lecture du journal (écran d'audit, réservé au Directeur pays et à
 * l'Administrateur) reste cloisonnée par organisation.
 */
export const auditLog = pgTable(
  "audit_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organisationId: uuid("organisation_id").notNull(),
    // Table et identifiant de la ligne concernée.
    tableName: text("table_name").notNull(),
    rowId: uuid("row_id").notNull(),
    // « insert » | « update » | « delete » (minuscules, posé par le déclencheur).
    action: text("action").notNull(),
    // Acteur et adresse IP transmis via `set_config` par la couche d'accès.
    actorId: uuid("actor_id"),
    ip: text("ip"),
    // Valeurs avant / après en JSONB. `before` est nul sur INSERT, `after` sur
    // DELETE.
    beforeData: jsonb("before_data"),
    afterData: jsonb("after_data"),
    loggedAt: timestamp("logged_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("audit_log_org_logged_at_idx").on(table.organisationId, table.loggedAt),
    index("audit_log_entity_idx").on(table.organisationId, table.tableName, table.rowId),
  ],
);

export type AuditLog = typeof auditLog.$inferSelect;
export type NewAuditLog = typeof auditLog.$inferInsert;
