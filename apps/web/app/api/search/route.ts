import { globalSearch } from "@missionops/services";

import { getDb } from "@/lib/db";
import { apiContext, apiError, json, unauthorized } from "@/lib/server/api";

/** Recherche globale (B6.5) : missions, dépenses, membres. */
export async function GET(request: Request) {
  const ctx = await apiContext();
  if (!ctx) return unauthorized();
  try {
    const q = new URL(request.url).searchParams.get("q") ?? "";
    return json({ results: await globalSearch(getDb(), ctx, q) });
  } catch (error) {
    return apiError(error);
  }
}
