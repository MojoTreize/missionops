import { EXPENSE_CATEGORIES, PAYMENT_METHODS } from "@missionops/core";
import { z } from "zod";

import { checkbox, isoDate, optionalText, optionalUuid, text, uuid } from "./common";
import { currency } from "./money";

/**
 * Dépense terrain (B3.5). L'identifiant est généré côté client (UUID) : l'envoi
 * est idempotent, une dépense saisie hors ligne et renvoyée deux fois n'est
 * enregistrée qu'une fois (ADR-003).
 */
export const expenseInput = z.object({
  id: uuid,
  missionId: uuid,
  category: z.enum(EXPENSE_CATEGORIES),
  description: text(2, 500),
  amount: z.string().trim().min(1),
  currency,
  spentOn: isoDate,
  receiptMissingReason: optionalText(500),
  clientCreatedAt: z.string().datetime().optional().nullable(),
});

export type ExpenseInput = z.infer<typeof expenseInput>;

export const expenseDecisionInput = z.object({
  expenseId: uuid,
  decision: z.enum(["approuvee", "rejetee"]),
  reason: optionalText(500),
});

export const advanceInput = z.object({
  missionId: uuid,
  beneficiaryId: uuid,
  amount: z.string().trim().min(1),
  currency,
  paidOn: isoDate,
  paymentMethod: z.enum(PAYMENT_METHODS),
  reference: optionalText(120),
  note: optionalText(500),
  directorApproved: checkbox,
});

export const advanceCancelInput = z.object({
  advanceId: uuid,
  reason: text(3, 500),
});

export const varianceJustificationInput = z.object({
  missionId: uuid,
  category: z.enum(EXPENSE_CATEGORIES),
  justification: text(10, 2000),
});

export const settlementInput = z.object({
  missionId: uuid,
  method: z.enum(PAYMENT_METHODS),
  reference: optionalText(120),
  settledOn: isoDate,
});

export const reconciliationActionInput = z.object({
  missionId: uuid,
  comment: optionalText(2000),
});

/** Métadonnées d'un justificatif photo (ADR-007). */
export const receiptMeta = z.object({
  id: uuid,
  expenseId: uuid,
  mimeType: z.enum(["image/jpeg", "image/png", "image/webp", "application/pdf"]),
  sizeBytes: z
    .number()
    .int()
    .positive()
    .max(8 * 1024 * 1024),
  sha256: z.string().regex(/^[a-f0-9]{64}$/),
  width: z.number().int().positive().optional().nullable(),
  height: z.number().int().positive().optional().nullable(),
});

export const missionEventInput = z.object({
  id: uuid,
  missionId: uuid,
  kind: z.enum(["depart", "arrivee", "checkin", "incident", "retour"]),
  note: optionalText(1000),
  occurredAt: z.string().datetime(),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
});

export const missionReportInput = z.object({
  missionId: uuid,
  summary: text(10, 8000),
  results: optionalText(8000),
  difficulties: optionalText(8000),
  recommendations: optionalText(8000),
});

export const optionalMissionId = z.object({ missionId: optionalUuid });
