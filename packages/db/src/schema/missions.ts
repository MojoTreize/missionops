import {
  bigint,
  boolean,
  date,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

import { businessColumns, orgCreatedIndex } from "./business";
import { users } from "./users";

/**
 * `locations` — lieux propres à une organisation (B2.1). Le référentiel
 * national (régions, préfectures…) est une donnée statique de
 * `@missionops/core/location` ; chaque lieu d'organisation s'y rattache par
 * `parent_code`.
 */
export const locations = pgTable(
  "locations",
  {
    ...businessColumns(),
    parentCode: text("parent_code").notNull(),
    name: text("name").notNull(),
    normalizedName: text("normalized_name").notNull(),
    // « site » | « village » | « autre »
    kind: text("kind").notNull().default("site"),
  },
  (table) => [
    orgCreatedIndex("locations_org_created_idx", table),
    uniqueIndex("locations_org_parent_name_key")
      .on(table.organisationId, table.parentCode, table.normalizedName)
      .where(sql`deleted_at is null`),
  ],
);

/**
 * `approval_steps` — circuit de validation d'une organisation (B2.5). Une
 * organisation sans étape utilise le circuit par défaut du domaine.
 */
export const approvalSteps = pgTable(
  "approval_steps",
  {
    ...businessColumns(),
    position: integer("position").notNull(),
    approverRole: text("approver_role").notNull(),
    // Seuil de budget en devise de base (unités mineures) ; nul = toujours.
    minBudgetMinor: bigint("min_budget_minor", { mode: "bigint" }),
  },
  (table) => [
    orgCreatedIndex("approval_steps_org_created_idx", table),
    uniqueIndex("approval_steps_org_position_key")
      .on(table.organisationId, table.position)
      .where(sql`deleted_at is null`),
  ],
);

/**
 * `missions` — cœur du produit (B2.2). Le statut n'est modifié que par la
 * fonction de transition du domaine (ADR-006), via le service applicatif.
 */
export const missions = pgTable(
  "missions",
  {
    ...businessColumns(),
    // Référence lisible, séquentielle par organisation et par année.
    reference: text("reference").notNull(),
    title: text("title").notNull(),
    purpose: text("purpose").notNull(),
    status: text("status").notNull().default("BROUILLON"),
    requesterId: uuid("requester_id")
      .notNull()
      .references(() => users.id),
    destinationCode: text("destination_code"),
    destinationLocationId: uuid("destination_location_id").references(() => locations.id),
    startDate: date("start_date", { mode: "string" }).notNull(),
    endDate: date("end_date", { mode: "string" }).notNull(),
    transportMode: text("transport_mode"),
    notes: text("notes"),
    submittedAt: timestamp("submitted_at", { withTimezone: true }),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    startedAt: timestamp("started_at", { withTimezone: true }),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    closedAt: timestamp("closed_at", { withTimezone: true }),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    // Archivage (B6.6) : lecture seule, exclue des listes courantes.
    archivedAt: timestamp("archived_at", { withTimezone: true }),
  },
  (table) => [
    orgCreatedIndex("missions_org_created_idx", table),
    uniqueIndex("missions_org_reference_key").on(table.organisationId, table.reference),
    index("missions_org_status_idx").on(table.organisationId, table.status),
    index("missions_org_dates_idx").on(table.organisationId, table.startDate, table.endDate),
    index("missions_org_requester_idx").on(table.organisationId, table.requesterId),
  ],
);

/** `mission_participants` — équipe de la mission (B2.4). */
export const missionParticipants = pgTable(
  "mission_participants",
  {
    ...businessColumns(),
    missionId: uuid("mission_id")
      .notNull()
      .references(() => missions.id),
    userId: uuid("user_id").references(() => users.id),
    externalName: text("external_name"),
    // « chef_mission » | « membre » | « chauffeur » | « externe »
    role: text("role").notNull().default("membre"),
  },
  (table) => [
    orgCreatedIndex("mission_participants_org_created_idx", table),
    index("mission_participants_org_mission_idx").on(table.organisationId, table.missionId),
    index("mission_participants_org_user_idx").on(table.organisationId, table.userId),
  ],
);

/**
 * `mission_status_history` — historique des transitions (ADR-006). Écrit dans
 * la même transaction que le changement de statut ; complète le journal
 * d'audit par une lecture métier directe (qui, quand, pourquoi).
 */
export const missionStatusHistory = pgTable(
  "mission_status_history",
  {
    ...businessColumns(),
    missionId: uuid("mission_id")
      .notNull()
      .references(() => missions.id),
    fromStatus: text("from_status").notNull(),
    toStatus: text("to_status").notNull(),
    event: text("event").notNull(),
    comment: text("comment"),
  },
  (table) => [
    orgCreatedIndex("mission_status_history_org_created_idx", table),
    index("mission_status_history_org_mission_idx").on(table.organisationId, table.missionId),
  ],
);

/** `approvals` — décisions réelles du circuit de validation (B2.5, B2.6). */
export const approvals = pgTable(
  "approvals",
  {
    ...businessColumns(),
    missionId: uuid("mission_id")
      .notNull()
      .references(() => missions.id),
    // Cycle de validation : incrémenté à chaque nouvelle soumission.
    cycle: integer("cycle").notNull().default(1),
    position: integer("position").notNull(),
    approverRole: text("approver_role").notNull(),
    // « approved » | « rejected »
    decision: text("decision").notNull(),
    comment: text("comment"),
  },
  (table) => [
    orgCreatedIndex("approvals_org_created_idx", table),
    index("approvals_org_mission_idx").on(table.organisationId, table.missionId, table.cycle),
  ],
);

/**
 * `mission_events` — journal terrain (B4.6) : départ, arrivée, check-in,
 * incident, retour. Créé hors ligne avec un UUID client (ADR-003).
 */
export const missionEvents = pgTable(
  "mission_events",
  {
    ...businessColumns(),
    missionId: uuid("mission_id")
      .notNull()
      .references(() => missions.id),
    kind: text("kind").notNull(),
    note: text("note"),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
    // Position ponctuelle facultative (pas de géolocalisation continue).
    latitudeE6: integer("latitude_e6"),
    longitudeE6: integer("longitude_e6"),
    createdOffline: boolean("created_offline").notNull().default(false),
  },
  (table) => [
    orgCreatedIndex("mission_events_org_created_idx", table),
    index("mission_events_org_mission_idx").on(table.organisationId, table.missionId),
  ],
);

/** `mission_reports` — rapport de mission (B5.6). Un rapport par mission. */
export const missionReports = pgTable(
  "mission_reports",
  {
    ...businessColumns(),
    missionId: uuid("mission_id")
      .notNull()
      .references(() => missions.id),
    summary: text("summary").notNull(),
    results: text("results"),
    difficulties: text("difficulties"),
    recommendations: text("recommendations"),
    submittedAt: timestamp("submitted_at", { withTimezone: true }),
  },
  (table) => [
    orgCreatedIndex("mission_reports_org_created_idx", table),
    uniqueIndex("mission_reports_org_mission_key")
      .on(table.organisationId, table.missionId)
      .where(sql`deleted_at is null`),
  ],
);

export type Location = typeof locations.$inferSelect;
export type ApprovalStepRow = typeof approvalSteps.$inferSelect;
export type Mission = typeof missions.$inferSelect;
export type NewMission = typeof missions.$inferInsert;
export type MissionParticipant = typeof missionParticipants.$inferSelect;
export type MissionStatusHistoryRow = typeof missionStatusHistory.$inferSelect;
export type Approval = typeof approvals.$inferSelect;
export type MissionEventRow = typeof missionEvents.$inferSelect;
export type MissionReport = typeof missionReports.$inferSelect;
