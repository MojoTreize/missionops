import { sql } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { json } from "@/lib/server/api";
import { log } from "@/lib/server/log";

/**
 * Sonde de santé (B8.4) pour l'hébergeur et la supervision : vérifie que la
 * base répond. Ne révèle aucune information sensible.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const started = Date.now();
  try {
    await getDb().execute(sql`select 1`);
    return json({ status: "ok", database: "ok", latencyMs: Date.now() - started });
  } catch (error) {
    log("error", "health_check_failed", { error });
    return json({ status: "degraded", database: "unreachable" }, { status: 503 });
  }
}
