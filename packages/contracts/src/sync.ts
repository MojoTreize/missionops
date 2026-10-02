import { z } from "zod";

import { expenseInput, missionEventInput } from "./expense";

/**
 * Lot de synchronisation hors ligne (B4.3, ADR-003) : uniquement des
 * créations, chacune identifiée par un UUID client. Le serveur répond, pour
 * chaque élément, accepté (créé ou déjà présent) ou refusé avec un code.
 */
export const syncItem = z.discriminatedUnion("type", [
  z.object({ type: z.literal("expense"), payload: expenseInput }),
  z.object({ type: z.literal("missionEvent"), payload: missionEventInput }),
]);

export const syncBatch = z.object({
  items: z.array(syncItem).min(1).max(50),
});

export type SyncItem = z.infer<typeof syncItem>;
export type SyncBatch = z.infer<typeof syncBatch>;

export const syncResult = z.object({
  id: z.string().uuid(),
  status: z.enum(["created", "duplicate", "rejected"]),
  code: z.string().optional(),
});

export type SyncResultItem = z.infer<typeof syncResult>;
