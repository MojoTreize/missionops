import {
  EXPENSE_CATEGORIES,
  MISSION_EVENTS,
  PARTICIPANT_ROLES,
  ROLES,
  TRANSPORT_MODES,
} from "@missionops/core";
import { z } from "zod";

import { isoDate, optionalText, optionalUuid, text, uuid } from "./common";
import { currency, rateString } from "./money";

/** Demande de mission (B2.3). Un brouillon peut être incomplet. */
export const missionInput = z
  .object({
    title: text(3, 160),
    purpose: text(10, 4000),
    destinationCode: z
      .string()
      .optional()
      .nullable()
      .transform((v) => (v ? v : null)),
    destinationLocationId: optionalUuid,
    startDate: isoDate,
    endDate: isoDate,
    transportMode: z.enum(TRANSPORT_MODES),
    notes: optionalText(4000),
  })
  .refine((v) => v.destinationCode || v.destinationLocationId, {
    message: "destination_required",
    path: ["destinationCode"],
  })
  .refine((v) => v.endDate >= v.startDate, { message: "dates_order", path: ["endDate"] });

export type MissionInput = z.infer<typeof missionInput>;

export const missionTransitionInput = z.object({
  missionId: uuid,
  event: z.enum(MISSION_EVENTS),
  comment: optionalText(2000),
});

export const approvalDecisionInput = z.object({
  missionId: uuid,
  decision: z.enum(["approved", "rejected", "changes_requested"]),
  comment: optionalText(2000),
});

export const participantInput = z
  .object({
    missionId: uuid,
    userId: optionalUuid,
    externalName: optionalText(120),
    role: z.enum(PARTICIPANT_ROLES),
  })
  .refine((v) => v.userId || v.externalName, {
    message: "identity_required",
    path: ["userId"],
  });

/** Une étape du circuit de validation (B2.5). Seuil en unités majeures. */
export const approvalStepInput = z.object({
  role: z.enum(ROLES),
  minBudget: z
    .string()
    .trim()
    .optional()
    .nullable()
    .transform((v) => (v ? v.replace(/[\s  ]/g, "") : null))
    .pipe(z.string().regex(/^\d+$/, "invalid_amount").nullable()),
});

export const approvalFlowInput = z.object({
  steps: z.array(approvalStepInput).min(1).max(6),
});

export const budgetLineInput = z.object({
  missionId: uuid,
  category: z.enum(EXPENSE_CATEGORIES),
  label: text(1, 160),
  quantity: z.coerce.number().int().min(1).max(10_000),
  unitAmount: z.string().trim().min(1),
  currency,
  // Champ de formulaire vide = taux en vigueur (résolu par le service).
  rate: z.preprocess((v) => (v === "" ? null : v), rateString.nullable().optional()),
});

export const missionFilterInput = z.object({
  status: z.string().optional(),
  q: z.string().trim().max(100).optional(),
  view: z.enum(["list", "calendar"]).optional(),
  month: z
    .string()
    .regex(/^\d{4}-\d{2}$/)
    .optional(),
});
