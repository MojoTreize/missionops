import {
  bigint,
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

import { businessColumns, orgCreatedIndex } from "./business";
import { missions } from "./missions";
import { users } from "./users";

/**
 * Documents (Phase 5), communication (Phase 7) et exploitation (Phases 8-9).
 */

/**
 * `documents` — documents générés (ordre de mission, Mission Pack, Closure
 * Pack). Immuables et versionnés : une régénération crée une nouvelle version.
 */
export const documents = pgTable(
  "documents",
  {
    ...businessColumns(),
    missionId: uuid("mission_id").references(() => missions.id),
    // « ordre_mission » | « mission_pack » | « closure_pack » | « rapport »
    kind: text("kind").notNull(),
    version: integer("version").notNull(),
    storageKey: text("storage_key").notNull(),
    sha256: text("sha256").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    locale: text("locale").notNull().default("fr"),
  },
  (table) => [
    orgCreatedIndex("documents_org_created_idx", table),
    uniqueIndex("documents_org_mission_kind_version_key").on(
      table.organisationId,
      table.missionId,
      table.kind,
      table.version,
    ),
  ],
);

/**
 * `notifications` — boîte d'envoi (B7.1). Le code métier enfile, un envoyeur
 * distribue sur le canal choisi ; chaque tentative est tracée.
 */
export const notifications = pgTable(
  "notifications",
  {
    ...businessColumns(),
    recipientId: uuid("recipient_id")
      .notNull()
      .references(() => users.id),
    // « email » | « whatsapp » | « sms » | « in_app »
    channel: text("channel").notNull(),
    template: text("template").notNull(),
    payload: jsonb("payload")
      .notNull()
      .default(sql`'{}'::jsonb`),
    // « en_attente » | « envoyee » | « echec »
    status: text("status").notNull().default("en_attente"),
    attempts: integer("attempts").notNull().default(0),
    lastError: text("last_error"),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    readAt: timestamp("read_at", { withTimezone: true }),
    // Clé d'idempotence : un même événement ne notifie qu'une fois.
    dedupeKey: text("dedupe_key"),
  },
  (table) => [
    orgCreatedIndex("notifications_org_created_idx", table),
    index("notifications_org_status_idx").on(table.organisationId, table.status),
    index("notifications_org_recipient_idx").on(table.organisationId, table.recipientId),
    uniqueIndex("notifications_org_dedupe_key")
      .on(table.organisationId, table.dedupeKey)
      .where(sql`dedupe_key is not null`),
  ],
);

/** `notification_preferences` — canaux choisis par membre (B7.4). */
export const notificationPreferences = pgTable(
  "notification_preferences",
  {
    ...businessColumns(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    email: boolean("email").notNull().default(true),
    whatsapp: boolean("whatsapp").notNull().default(false),
    sms: boolean("sms").notNull().default(false),
    whatsappNumber: text("whatsapp_number"),
  },
  (table) => [
    orgCreatedIndex("notification_preferences_org_created_idx", table),
    uniqueIndex("notification_preferences_org_user_key")
      .on(table.organisationId, table.userId)
      .where(sql`deleted_at is null`),
  ],
);

/** `subscriptions` — abonnement de l'organisation (B9.4). */
export const subscriptions = pgTable(
  "subscriptions",
  {
    ...businessColumns(),
    // « essai » | « essentiel » | « organisation »
    plan: text("plan").notNull().default("essai"),
    // « active » | « suspendue » | « resiliee »
    status: text("status").notNull().default("active"),
    seats: integer("seats").notNull().default(10),
    trialEndsOn: timestamp("trial_ends_on", { withTimezone: true }),
    priceMinor: bigint("price_minor", { mode: "bigint" }),
    priceCurrency: text("price_currency"),
  },
  (table) => [
    orgCreatedIndex("subscriptions_org_created_idx", table),
    uniqueIndex("subscriptions_org_key")
      .on(table.organisationId)
      .where(sql`deleted_at is null`),
  ],
);

/**
 * `rate_limits` — compteurs de limitation de débit partagés entre instances
 * (B8.3). Table système : la clé précède toute organisation (connexion).
 */
export const rateLimits = pgTable("rate_limits", {
  key: text("key").primaryKey(),
  count: integer("count").notNull().default(0),
  windowStartedAt: timestamp("window_started_at", { withTimezone: true }).notNull(),
  blockedUntil: timestamp("blocked_until", { withTimezone: true }),
});

export type DocumentRow = typeof documents.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type NotificationPreference = typeof notificationPreferences.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
