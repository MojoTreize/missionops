import {
  bigint,
  boolean,
  date,
  index,
  integer,
  numeric,
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
 * Tables argent (Phase 3, ADR-002). Convention : tout montant est un entier en
 * unités mineures suffixé `_minor`, accompagné de sa devise `_currency`. Toute
 * ligne convertie porte son taux vers la devise de base et sa date, figés.
 * Les taux sont des `numeric(30,10)` lus en chaîne puis convertis en bigint mis
 * à l'échelle par le domaine : jamais de flottant.
 */

/** `exchange_rates` — taux datés saisis par la finance (B3.2). */
export const exchangeRates = pgTable(
  "exchange_rates",
  {
    ...businessColumns(),
    fromCurrency: text("from_currency").notNull(),
    toCurrency: text("to_currency").notNull(),
    rate: numeric("rate", { precision: 30, scale: 10 }).notNull(),
    effectiveOn: date("effective_on", { mode: "string" }).notNull(),
    source: text("source").notNull().default("manuel"),
  },
  (table) => [
    orgCreatedIndex("exchange_rates_org_created_idx", table),
    index("exchange_rates_org_pair_idx").on(
      table.organisationId,
      table.fromCurrency,
      table.toCurrency,
      table.effectiveOn,
    ),
  ],
);

/** `budget_lines` — budget prévisionnel de la mission (B3.3). */
export const budgetLines = pgTable(
  "budget_lines",
  {
    ...businessColumns(),
    missionId: uuid("mission_id")
      .notNull()
      .references(() => missions.id),
    category: text("category").notNull(),
    label: text("label").notNull(),
    quantity: integer("quantity").notNull().default(1),
    unitAmountMinor: bigint("unit_amount_minor", { mode: "bigint" }).notNull(),
    unitAmountCurrency: text("unit_amount_currency").notNull(),
    fxRateToBase: numeric("fx_rate_to_base", { precision: 30, scale: 10 }).notNull(),
    fxRateDate: date("fx_rate_date", { mode: "string" }).notNull(),
    // Total converti en devise de base, figé à la saisie.
    totalBaseMinor: bigint("total_base_minor", { mode: "bigint" }).notNull(),
  },
  (table) => [
    orgCreatedIndex("budget_lines_org_created_idx", table),
    index("budget_lines_org_mission_idx").on(table.organisationId, table.missionId),
  ],
);

/**
 * `advances` — avances versées (B3.4). Une avance versée n'est jamais
 * modifiée : on l'annule par une écriture inverse (`reverses_id`).
 */
export const advances = pgTable(
  "advances",
  {
    ...businessColumns(),
    missionId: uuid("mission_id")
      .notNull()
      .references(() => missions.id),
    beneficiaryId: uuid("beneficiary_id")
      .notNull()
      .references(() => users.id),
    amountMinor: bigint("amount_minor", { mode: "bigint" }).notNull(),
    amountCurrency: text("amount_currency").notNull(),
    fxRateToBase: numeric("fx_rate_to_base", { precision: 30, scale: 10 }).notNull(),
    fxRateDate: date("fx_rate_date", { mode: "string" }).notNull(),
    amountBaseMinor: bigint("amount_base_minor", { mode: "bigint" }).notNull(),
    paidOn: date("paid_on", { mode: "string" }).notNull(),
    paymentMethod: text("payment_method").notNull(),
    reference: text("reference"),
    note: text("note"),
    directorApproved: boolean("director_approved").notNull().default(false),
    // Écriture inverse : pointe vers l'avance annulée.
    reversesId: uuid("reverses_id"),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
  },
  (table) => [
    orgCreatedIndex("advances_org_created_idx", table),
    index("advances_org_mission_idx").on(table.organisationId, table.missionId),
    uniqueIndex("advances_reverses_key").on(table.reversesId),
  ],
);

/**
 * `expenses` — dépenses réelles (B3.5). L'identifiant est généré côté client
 * pour rendre l'envoi hors ligne idempotent (ADR-003).
 */
export const expenses = pgTable(
  "expenses",
  {
    ...businessColumns(),
    missionId: uuid("mission_id")
      .notNull()
      .references(() => missions.id),
    category: text("category").notNull(),
    description: text("description").notNull(),
    amountMinor: bigint("amount_minor", { mode: "bigint" }).notNull(),
    amountCurrency: text("amount_currency").notNull(),
    fxRateToBase: numeric("fx_rate_to_base", { precision: 30, scale: 10 }).notNull(),
    fxRateDate: date("fx_rate_date", { mode: "string" }).notNull(),
    amountBaseMinor: bigint("amount_base_minor", { mode: "bigint" }).notNull(),
    spentOn: date("spent_on", { mode: "string" }).notNull(),
    // « soumise » | « approuvee » | « rejetee »
    status: text("status").notNull().default("soumise"),
    outOfPeriod: boolean("out_of_period").notNull().default(false),
    receiptMissingReason: text("receipt_missing_reason"),
    decidedBy: uuid("decided_by").references(() => users.id),
    decidedAt: timestamp("decided_at", { withTimezone: true }),
    rejectionReason: text("rejection_reason"),
    createdOffline: boolean("created_offline").notNull().default(false),
    clientCreatedAt: timestamp("client_created_at", { withTimezone: true }),
  },
  (table) => [
    orgCreatedIndex("expenses_org_created_idx", table),
    index("expenses_org_mission_idx").on(table.organisationId, table.missionId),
    index("expenses_org_status_idx").on(table.organisationId, table.status),
  ],
);

/**
 * `receipts` — justificatifs (B3.6, ADR-007). La base ne garde que la
 * référence de stockage, la somme de contrôle et les métadonnées.
 */
export const receipts = pgTable(
  "receipts",
  {
    ...businessColumns(),
    expenseId: uuid("expense_id")
      .notNull()
      .references(() => expenses.id),
    storageKey: text("storage_key").notNull(),
    mimeType: text("mime_type").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    sha256: text("sha256").notNull(),
    width: integer("width"),
    height: integer("height"),
  },
  (table) => [
    orgCreatedIndex("receipts_org_created_idx", table),
    index("receipts_org_expense_idx").on(table.organisationId, table.expenseId),
  ],
);

/** `variance_justifications` — justification des écarts budgétaires (B3.9). */
export const varianceJustifications = pgTable(
  "variance_justifications",
  {
    ...businessColumns(),
    missionId: uuid("mission_id")
      .notNull()
      .references(() => missions.id),
    category: text("category").notNull(),
    justification: text("justification").notNull(),
  },
  (table) => [
    orgCreatedIndex("variance_justifications_org_created_idx", table),
    uniqueIndex("variance_justifications_org_mission_cat_key")
      .on(table.organisationId, table.missionId, table.category)
      .where(sql`deleted_at is null`),
  ],
);

/**
 * `reconciliations` — clôture financière d'une mission (B3.8, B3.10). Les
 * totaux sont figés au moment de la soumission puis de la validation.
 */
export const reconciliations = pgTable(
  "reconciliations",
  {
    ...businessColumns(),
    missionId: uuid("mission_id")
      .notNull()
      .references(() => missions.id),
    // « ouverte » | « soumise » | « validee »
    status: text("status").notNull().default("ouverte"),
    baseCurrency: text("base_currency").notNull(),
    advancesBaseMinor: bigint("advances_base_minor", { mode: "bigint" })
      .notNull()
      .default(sql`0`),
    expensesBaseMinor: bigint("expenses_base_minor", { mode: "bigint" })
      .notNull()
      .default(sql`0`),
    balanceBaseMinor: bigint("balance_base_minor", { mode: "bigint" })
      .notNull()
      .default(sql`0`),
    submittedBy: uuid("submitted_by").references(() => users.id),
    submittedAt: timestamp("submitted_at", { withTimezone: true }),
    settlementMethod: text("settlement_method"),
    settlementReference: text("settlement_reference"),
    settledOn: date("settled_on", { mode: "string" }),
    validatedBy: uuid("validated_by").references(() => users.id),
    validatedAt: timestamp("validated_at", { withTimezone: true }),
    comment: text("comment"),
  },
  (table) => [
    orgCreatedIndex("reconciliations_org_created_idx", table),
    uniqueIndex("reconciliations_org_mission_key")
      .on(table.organisationId, table.missionId)
      .where(sql`deleted_at is null`),
  ],
);

export type ExchangeRate = typeof exchangeRates.$inferSelect;
export type BudgetLineRow = typeof budgetLines.$inferSelect;
export type Advance = typeof advances.$inferSelect;
export type Expense = typeof expenses.$inferSelect;
export type Receipt = typeof receipts.$inferSelect;
export type VarianceJustification = typeof varianceJustifications.$inferSelect;
export type ReconciliationRow = typeof reconciliations.$inferSelect;
