import { readReceipt } from "@missionops/services";

import { getDb } from "@/lib/db";
import { apiContext, apiError, unauthorized } from "@/lib/server/api";
import { getStore } from "@/lib/server/storage";

/** Sert un justificatif à un membre autorisé (B3.6). */
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await apiContext();
  if (!ctx) return unauthorized();
  const { id } = await params;
  try {
    const file = await readReceipt(getDb(), ctx, getStore(), id);
    return new Response(Buffer.from(file.bytes), {
      headers: {
        "content-type": file.mimeType,
        "cache-control": "private, max-age=86400, immutable",
        "x-content-type-options": "nosniff",
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
