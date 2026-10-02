import { processSyncBatch } from "@missionops/services";

import { getDb } from "@/lib/db";
import { apiContext, apiError, json, unauthorized } from "@/lib/server/api";

/**
 * Synchronisation hors ligne (B4.3, ADR-003) : un lot de créations (dépenses,
 * événements) identifiées par UUID client. Réponse élément par élément.
 */
export async function POST(request: Request) {
  const ctx = await apiContext();
  if (!ctx) return unauthorized();
  try {
    const results = await processSyncBatch(getDb(), ctx, await request.json());
    return json({ results });
  } catch (error) {
    return apiError(error);
  }
}
