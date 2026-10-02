import { organisationExport } from "@missionops/services";

import { getDb } from "@/lib/db";
import { apiContext, apiError, unauthorized } from "@/lib/server/api";

/** Export intégral de l'organisation (B6.7) : réversibilité des données. */
export async function GET() {
  const ctx = await apiContext();
  if (!ctx) return unauthorized();
  try {
    const body = await organisationExport(getDb(), ctx);
    return new Response(body, {
      headers: {
        "content-type": "application/json; charset=utf-8",
        "content-disposition": `attachment; filename="missionops-export-${ctx.now.toISOString().slice(0, 10)}.json"`,
        "cache-control": "private, no-store",
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
