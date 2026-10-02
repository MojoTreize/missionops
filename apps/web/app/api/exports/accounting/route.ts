import { accountingExport } from "@missionops/services";

import { getDb } from "@/lib/db";
import { getT } from "@/lib/i18n/server";
import type { MessageKey } from "@/lib/i18n/translate";
import { apiContext, apiError, unauthorized } from "@/lib/server/api";

const ISO = /^\d{4}-\d{2}-\d{2}$/;
const COLUMNS = [
  "date",
  "type",
  "mission",
  "category",
  "description",
  "person",
  "amount",
  "currency",
  "rate",
  "rateDate",
  "amountBase",
  "baseCurrency",
  "receipts",
  "id",
] as const;

/** Export comptable et bailleur (B6.4) : CSV « ; », UTF-8 avec BOM. */
export async function GET(request: Request) {
  const ctx = await apiContext();
  if (!ctx) return unauthorized();
  const url = new URL(request.url);
  const today = ctx.now.toISOString().slice(0, 10);
  const from = ISO.test(url.searchParams.get("from") ?? "")
    ? url.searchParams.get("from")!
    : `${today.slice(0, 4)}-01-01`;
  const to = ISO.test(url.searchParams.get("to") ?? "") ? url.searchParams.get("to")! : today;
  const { t } = await getT();
  try {
    const csv = await accountingExport(
      getDb(),
      ctx,
      { from, to },
      {
        category: (c) => t(`category.${c}` as MessageKey),
        headers: COLUMNS.map((c) => t(`reportsPage.csv.${c}`)),
      },
    );
    return new Response(csv, {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="missionops-${from}-${to}.csv"`,
        "cache-control": "private, no-store",
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
