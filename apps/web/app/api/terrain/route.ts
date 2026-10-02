import { EXPENSE_CATEGORIES } from "@missionops/core";
import { getOrganisation, myFieldMissions, searchableLocations } from "@missionops/services";

import { getDb } from "@/lib/db";
import { apiContext, apiError, json, unauthorized } from "@/lib/server/api";

/**
 * Données d'amorçage de l'écran terrain (B4.2) : mes missions actives, devise
 * de base et catégories. Mises en cache dans IndexedDB pour le hors ligne.
 */
export async function GET() {
  const ctx = await apiContext();
  if (!ctx) return unauthorized();
  try {
    const db = getDb();
    const [missions, org, locations] = await Promise.all([
      myFieldMissions(db, ctx),
      getOrganisation(db, ctx.organisationId),
      searchableLocations(db, ctx),
    ]);
    return json({
      fetchedAt: ctx.now.toISOString(),
      userId: ctx.actor.userId,
      organisationId: ctx.organisationId,
      baseCurrency: org.baseCurrency,
      categories: EXPENSE_CATEGORIES,
      missions,
      orgLocations: locations.filter((l) => l.level === "organisation"),
    });
  } catch (error) {
    return apiError(error);
  }
}
