import { timingSafeEqual } from "node:crypto";

import { runScheduledJobs } from "@missionops/services";

import { getDb } from "@/lib/db";
import { json } from "@/lib/server/api";
import { deliver } from "@/lib/server/notify";

/**
 * Tâche planifiée (B7.1, B7.5) : rappels du jour puis envoi de la boîte
 * d'envoi. À appeler toutes les 5 minutes avec `Authorization: Bearer
 * $CRON_SECRET` (cron Fly.io, GitHub Actions ou service externe).
 */
function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const given = Buffer.from(request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "");
  const expected = Buffer.from(secret);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

export async function POST(request: Request) {
  if (!authorized(request)) return json({ error: "unauthorized" }, { status: 401 });
  const result = await runScheduledJobs(getDb(), new Date(), deliver);
  return json(result);
}
