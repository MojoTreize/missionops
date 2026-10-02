import { generateMissionDocument, isDocumentKind } from "@missionops/services";

import { getDb } from "@/lib/db";
import { getT } from "@/lib/i18n/server";
import type { MessageKey } from "@/lib/i18n/translate";
import { apiContext, apiError, json, unauthorized } from "@/lib/server/api";
import { getStore } from "@/lib/server/storage";

/**
 * Documents de mission (Phase 5) : ordre de mission, Mission Pack, Closure
 * Pack. Chaque génération est versionnée et son empreinte SHA-256 renvoyée en
 * en-tête, pour qu'un auditeur puisse vérifier le fichier reçu.
 */
export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string; kind: string }> },
) {
  const ctx = await apiContext();
  if (!ctx) return unauthorized();
  const { id, kind } = await params;
  if (!isDocumentKind(kind)) return json({ error: "not_found" }, { status: 404 });
  const { t, locale } = await getT();
  try {
    const doc = await generateMissionDocument(
      getDb(),
      ctx,
      getStore(),
      id,
      kind,
      (key, p) => t(key as MessageKey, p),
      locale,
    );
    return new Response(Buffer.from(doc.bytes), {
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `inline; filename="${doc.fileName}"`,
        "x-document-version": String(doc.version),
        "x-document-sha256": doc.sha256,
        "cache-control": "private, no-store",
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
