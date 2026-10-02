import { attachReceipt } from "@missionops/services";

import { getDb } from "@/lib/db";
import { apiContext, apiError, json, rateLimited, unauthorized } from "@/lib/server/api";
import { getStore } from "@/lib/server/storage";

const MAX_BYTES = 8 * 1024 * 1024;

/**
 * Envoi d'un justificatif (B3.6, B4.5) : `multipart/form-data` avec `meta`
 * (JSON : id, expenseId, mimeType, sizeBytes, sha256…) et `file`. Idempotent
 * sur l'identifiant client : un renvoi après coupure réseau est sans effet.
 */
export async function POST(request: Request) {
  const ctx = await apiContext();
  if (!ctx) return unauthorized();
  const limited = await rateLimited(ctx, "receipts", 60);
  if (limited) return limited;
  try {
    const form = await request.formData();
    const file = form.get("file");
    const metaRaw = form.get("meta");
    if (!(file instanceof Blob) || typeof metaRaw !== "string") {
      return json({ error: "invalid_input" }, { status: 422 });
    }
    if (file.size > MAX_BYTES) return json({ error: "file_too_large" }, { status: 413 });
    const bytes = new Uint8Array(await file.arrayBuffer());
    const result = await attachReceipt(getDb(), ctx, getStore(), JSON.parse(metaRaw), bytes);
    return json(result, { status: result.status === "created" ? 201 : 200 });
  } catch (error) {
    return apiError(error);
  }
}
