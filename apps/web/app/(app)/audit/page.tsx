import type { Metadata } from "next";
import Link from "next/link";

import { auditLogPage } from "@missionops/services";

import { NativeSelect } from "@/components/forms/controls";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getDb } from "@/lib/db";
import { formatDate } from "@/lib/i18n/format";
import { getT } from "@/lib/i18n/server";
import { requireCan } from "@/lib/policy";
import { serviceContext } from "@/lib/server/context";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: `${t("audit.title")} — MissionOps` };
}

const ISO = /^\d{4}-\d{2}-\d{2}$/;

function show(value: unknown): string {
  if (value === null || value === undefined) return "∅";
  return typeof value === "string" ? value : JSON.stringify(value);
}

/** Consultation du journal d'audit (B6.1), réservée au Directeur pays et à l'admin. */
export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{
    table?: string;
    from?: string;
    to?: string;
    page?: string;
    row?: string;
  }>;
}) {
  await requireCan("read", "auditLog");
  const params = await searchParams;
  const ctx = await serviceContext();
  const { t, locale } = await getT();
  const page = Math.max(Number.parseInt(params.page ?? "0", 10) || 0, 0);
  const filters = {
    table: params.table || undefined,
    rowId: params.row && /^[0-9a-f-]{36}$/.test(params.row) ? params.row : undefined,
    from: params.from && ISO.test(params.from) ? params.from : undefined,
    to: params.to && ISO.test(params.to) ? params.to : undefined,
    page,
  };
  const { entries, hasMore, tables } = await auditLogPage(getDb(), ctx, filters);
  const link = (p: number) => {
    const search = new URLSearchParams();
    if (filters.table) search.set("table", filters.table);
    if (filters.rowId) search.set("row", filters.rowId);
    if (filters.from) search.set("from", filters.from);
    if (filters.to) search.set("to", filters.to);
    if (p > 0) search.set("page", String(p));
    const qs = search.toString();
    return qs ? `/audit?${qs}` : "/audit";
  };

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-5">
      <div>
        <h1 className="text-[1.65rem] font-semibold leading-tight tracking-tight text-ink sm:text-3xl">
          {t("audit.title")}
        </h1>
        <p className="mt-1.5 text-[0.95rem] text-muted">{t("audit.subtitle")}</p>
      </div>
      <form className="flex flex-wrap items-end gap-2">
        <div className="flex flex-col gap-1">
          <Label htmlFor="a-table">{t("audit.table")}</Label>
          <NativeSelect
            id="a-table"
            name="table"
            defaultValue={filters.table ?? ""}
            className="w-auto"
          >
            <option value="">{t("audit.allTables")}</option>
            {tables.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="a-from">{t("audit.from")}</Label>
          <Input
            id="a-from"
            name="from"
            type="date"
            defaultValue={filters.from}
            className="w-auto"
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="a-to">{t("audit.to")}</Label>
          <Input id="a-to" name="to" type="date" defaultValue={filters.to} className="w-auto" />
        </div>
        <Button type="submit" variant="secondary">
          {t("audit.filter")}
        </Button>
      </form>
      {entries.length === 0 ? (
        <p className="text-sm text-muted">{t("audit.empty")}</p>
      ) : (
        <ul className="flex flex-col divide-y divide-border rounded-xl border border-border bg-surface shadow-xs">
          {entries.map((e) => (
            <li key={e.id} className="flex flex-col gap-1 px-4 py-3 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant={
                    e.action === "insert" ? "success" : e.action === "delete" ? "danger" : "neutral"
                  }
                >
                  {t(`audit.action.${e.action as "insert"}`)}
                </Badge>
                <span className="font-mono text-xs">{e.tableName}</span>
                <Link
                  href={`/audit?row=${e.rowId}`}
                  className="font-mono text-xs text-field hover:underline"
                >
                  {e.rowId.slice(0, 8)}
                </Link>
                <span className="text-muted">
                  {e.actorName ?? t("audit.system")} ·{" "}
                  {formatDate(e.loggedAt, locale, { dateStyle: "medium", timeStyle: "medium" })}
                  {e.ip ? ` · ${e.ip}` : ""}
                </span>
              </div>
              {e.action === "update" && e.changedFields.length > 0 ? (
                <details>
                  <summary className="cursor-pointer text-xs text-muted">
                    {t("audit.fields", { fields: e.changedFields.join(", ") })}
                  </summary>
                  <table className="mt-2 w-full text-xs">
                    <thead>
                      <tr className="text-left text-muted">
                        <th className="pr-2 font-normal">{t("audit.table")}</th>
                        <th className="pr-2 font-normal">{t("audit.before")}</th>
                        <th className="font-normal">{t("audit.after")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {e.changedFields.map((field) => (
                        <tr key={field} className="align-top">
                          <td className="pr-2 font-mono">{field}</td>
                          <td className="break-all pr-2 font-mono text-danger">
                            {show(e.before?.[field])}
                          </td>
                          <td className="break-all font-mono text-success">
                            {show(e.after?.[field])}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </details>
              ) : null}
            </li>
          ))}
        </ul>
      )}
      <div className="flex justify-between">
        {page > 0 ? (
          <Button asChild variant="secondary" size="sm">
            <Link href={link(page - 1)}>{t("audit.previous")}</Link>
          </Button>
        ) : (
          <span />
        )}
        {hasMore ? (
          <Button asChild variant="secondary" size="sm">
            <Link href={link(page + 1)}>{t("audit.next")}</Link>
          </Button>
        ) : null}
      </div>
    </div>
  );
}
