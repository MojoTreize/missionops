import { BarChart3, Download } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { can as canForRole } from "@missionops/core";
import { costReport } from "@missionops/services";

import { BarList } from "@/components/charts/bar-list";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MoneyDisplay } from "@/components/ui/money-display";
import { getDb } from "@/lib/db";
import { formatDate } from "@/lib/i18n/format";
import { getT } from "@/lib/i18n/server";
import { requireCan } from "@/lib/policy";
import { serviceContext } from "@/lib/server/context";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: `${t("meta.reports")} — MissionOps` };
}

const ISO = /^\d{4}-\d{2}-\d{2}$/;

/** Rapports de coûts (B6.3) et accès aux exports (B6.4, B6.7). */
export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  await requireCan("read", "report");
  const params = await searchParams;
  const ctx = await serviceContext();
  const { t, locale } = await getT();
  const today = ctx.now.toISOString().slice(0, 10);
  const yearStart = `${today.slice(0, 4)}-01-01`;
  const from = params.from && ISO.test(params.from) ? params.from : yearStart;
  const to = params.to && ISO.test(params.to) ? params.to : today;
  const report = await costReport(getDb(), ctx, { from, to });
  const share = (percent: number) => t("reportsPage.share", { percent });
  const canExport = canForRole(ctx.actor, "export", "expense");
  const canExportOrg = canForRole(ctx.actor, "export", "organisation");

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-ink">{t("reportsPage.title")}</h1>
          <p className="text-sm text-muted">{t("reportsPage.subtitle", { base: report.base })}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canExport ? (
            <Button asChild variant="secondary" size="sm">
              <a href={`/api/exports/accounting?from=${from}&to=${to}`}>
                <Download aria-hidden />
                {t("reportsPage.exportCsv")}
              </a>
            </Button>
          ) : null}
          {canExportOrg ? (
            <Button asChild variant="secondary" size="sm">
              <a href="/api/exports/organisation">
                <Download aria-hidden />
                {t("reportsPage.exportOrg")}
              </a>
            </Button>
          ) : null}
        </div>
      </div>

      <form className="flex flex-wrap items-end gap-2">
        <div className="flex flex-col gap-1">
          <Label htmlFor="r-from">{t("reportsPage.from")}</Label>
          <Input id="r-from" name="from" type="date" defaultValue={from} className="w-auto" />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="r-to">{t("reportsPage.to")}</Label>
          <Input id="r-to" name="to" type="date" defaultValue={to} className="w-auto" />
        </div>
        <Button type="submit" variant="secondary">
          {t("reportsPage.apply")}
        </Button>
      </form>

      {report.total.amountMinor === 0n ? (
        <EmptyState icon={<BarChart3 aria-hidden />} title={t("reportsPage.empty")} />
      ) : (
        <>
          <section className="rounded-lg border border-border bg-surface p-4">
            <p className="text-sm text-muted">{t("reportsPage.total")}</p>
            <MoneyDisplay money={report.total} accent locale={locale} className="text-3xl" />
          </section>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <section className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4">
              <h2 className="font-semibold">{t("reportsPage.byCategory")}</h2>
              <BarList
                caption={t("reportsPage.byCategory")}
                locale={locale}
                shareLabel={share}
                rows={report.byCategory.map((r) => ({
                  key: r.category,
                  label: t(`category.${r.category}`),
                  amount: r.amount,
                }))}
              />
            </section>
            <section className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4">
              <h2 className="font-semibold">{t("reportsPage.byMonth")}</h2>
              <BarList
                caption={t("reportsPage.byMonth")}
                locale={locale}
                shareLabel={share}
                rows={report.byMonth.map((r) => ({
                  key: r.month,
                  label: formatDate(`${r.month}-15T12:00:00Z`, locale, {
                    month: "long",
                    year: "numeric",
                  }),
                  amount: r.amount,
                }))}
              />
            </section>
            <section className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4 md:col-span-2">
              <h2 className="font-semibold">{t("reportsPage.byDestination")}</h2>
              <BarList
                caption={t("reportsPage.byDestination")}
                locale={locale}
                shareLabel={share}
                rows={report.byDestination.map((r) => ({
                  key: r.destination,
                  label: r.destination,
                  detail: t("reportsPage.missions", { count: r.missions }),
                  amount: r.amount,
                }))}
              />
            </section>
          </div>
          <section className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-4">
            <h2 className="font-semibold">{t("reportsPage.byMission")}</h2>
            <ul className="flex flex-col divide-y divide-border">
              {report.byMission.map((m) => (
                <li
                  key={m.missionId}
                  className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm"
                >
                  <Link
                    href={`/missions/${m.missionId}`}
                    className="min-w-0 truncate text-field hover:underline"
                  >
                    {m.reference} — {m.title}
                  </Link>
                  <span className="flex items-center gap-2">
                    <MoneyDisplay money={m.actual} locale={locale} />
                    <span className="text-muted">/</span>
                    <MoneyDisplay money={m.budget} locale={locale} className="text-muted" />
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
