import {
  ArrowRight,
  CalendarDays,
  ClipboardCheck,
  FileCheck2,
  FilePen,
  HandCoins,
  LayoutGrid,
  MapPin,
  Plus,
  Receipt,
  Scale,
  Smartphone,
  Timer,
  Wallet,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { MISSION_STATUSES, can as canForRole } from "@missionops/core";
import { dashboard, type MissionSummary } from "@missionops/services";

import { StatusBadge } from "@/components/mission/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, PageHeader, StatCard } from "@/components/ui/card";
import { MoneyDisplay } from "@/components/ui/money-display";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getDb } from "@/lib/db";
import { formatDate } from "@/lib/i18n/format";
import { getT } from "@/lib/i18n/server";
import { getActiveContext } from "@/lib/org/queries";
import { serviceContext } from "@/lib/server/context";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: `${t("meta.dashboard")} — MissionOps` };
}

/** Tableau de bord opérationnel (B6.2), adapté au rôle. */
export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { active } = await getActiveContext(user.id);
  if (!active) redirect("/organizations/new");

  const ctx = await serviceContext();
  const { t, locale } = await getT();
  const stats = await dashboard(getDb(), ctx);
  const role = ctx.actor;

  const List = ({
    title,
    items,
    icon,
    href,
  }: {
    title: string;
    items: MissionSummary[];
    icon: React.ReactNode;
    href: string;
  }) => (
    <Card className="flex flex-col">
      <CardHeader
        title={title}
        icon={icon}
        action={
          items.length > 0 ? (
            <Link
              href={href}
              className="inline-flex items-center gap-1 text-sm font-medium text-field hover:underline"
            >
              {t("dashboardPage.viewAll")}
              <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          ) : null
        }
      />
      {items.length === 0 ? (
        <p className="px-5 py-6 text-sm text-muted">{t("dashboardPage.none")}</p>
      ) : (
        <ul className="flex flex-col divide-y divide-border/70">
          {items.slice(0, 6).map((m) => (
            <li key={m.id}>
              <Link
                href={`/missions/${m.id}`}
                className="flex items-center justify-between gap-3 px-5 py-3 text-sm transition-colors hover:bg-surface-2"
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium text-ink">{m.title}</span>
                  <span className="text-xs text-muted">
                    {m.destination} · {formatDate(m.startDate, locale)}
                  </span>
                </span>
                <StatusBadge status={m.status} t={t} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );

  const total = MISSION_STATUSES.reduce((n, status) => n + stats.byStatus[status], 0);
  const showReports = canForRole(role, "read", "report");

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-7">
      <PageHeader
        eyebrow={formatDate(new Date(), locale, { weekday: "long", day: "numeric", month: "long" })}
        title={t("dashboardPage.greeting", { name: user.fullName ?? user.email })}
        description={t("dashboardPage.organisation", { name: active.name })}
        actions={
          <>
            <Button asChild variant="secondary" size="sm">
              <Link href="/terrain">
                <Smartphone aria-hidden />
                {t("dashboardPage.terrain")}
              </Link>
            </Button>
            {canForRole(role, "create", "mission") ? (
              <Button asChild size="sm">
                <Link href="/missions/new">
                  <Plus aria-hidden />
                  {t("dashboardPage.newMission")}
                </Link>
              </Button>
            ) : null}
          </>
        }
      />

      <section className="flex flex-col gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
          {t("dashboardPage.queues")}
        </h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {role.role !== "collaborateur" ? (
            <StatCard
              label={t("dashboardPage.approvals")}
              value={stats.approvalsWaiting}
              href="/approvals"
              icon={<ClipboardCheck aria-hidden />}
              tone="warning"
            />
          ) : null}
          {role.role === "finance" || role.role === "admin" ? (
            <>
              <StatCard
                label={t("dashboardPage.expensesToReview")}
                value={stats.expensesToReview}
                href="/expenses?view=pending"
                icon={<Receipt aria-hidden />}
                tone="ledger"
              />
              <StatCard
                label={t("dashboardPage.reconciliations")}
                value={stats.reconciliationsToValidate}
                href="/finance"
                icon={<Scale aria-hidden />}
                tone="info"
              />
            </>
          ) : null}
          <StatCard
            label={t("dashboardPage.onField")}
            value={stats.onField.length}
            href="/missions?status=EN_COURS"
            icon={<MapPin aria-hidden />}
          />
        </div>
      </section>

      {showReports ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
            {t("dashboardPage.indicators")}
          </h2>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard
              label={t("dashboardPage.monthSpend")}
              value={
                <MoneyDisplay money={stats.monthSpend} locale={locale} className="font-semibold" />
              }
              href="/reports"
              icon={<Wallet aria-hidden />}
              tone="ledger"
            />
            <StatCard
              label={t("dashboardPage.monthAdvances")}
              value={
                <MoneyDisplay
                  money={stats.monthAdvances}
                  locale={locale}
                  className="font-semibold"
                />
              }
              icon={<HandCoins aria-hidden />}
              tone="ledger"
            />
            <StatCard
              label={t("dashboardPage.receiptCoverage")}
              value={
                stats.receiptCoverageBp === null
                  ? "—"
                  : `${Math.round(stats.receiptCoverageBp / 100)} %`
              }
              icon={<FileCheck2 aria-hidden />}
            />
            <StatCard
              label={t("dashboardPage.medianClosure")}
              value={
                stats.medianClosureDays === null
                  ? "—"
                  : t("dashboardPage.days", { days: stats.medianClosureDays })
              }
              icon={<Timer aria-hidden />}
              tone="info"
            />
          </div>
        </section>
      ) : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <List
          title={t("dashboardPage.onField")}
          items={stats.onField}
          icon={<MapPin aria-hidden />}
          href="/missions?status=EN_COURS"
        />
        <List
          title={t("dashboardPage.upcoming")}
          items={stats.upcoming}
          icon={<CalendarDays aria-hidden />}
          href="/missions/calendar"
        />
        <List
          title={t("dashboardPage.drafts")}
          items={stats.myDrafts}
          icon={<FilePen aria-hidden />}
          href="/missions?status=BROUILLON"
        />
      </div>

      <Card>
        <CardHeader
          title={t("dashboardPage.byStatus")}
          description={t("dashboardPage.total", { count: total })}
          icon={<LayoutGrid aria-hidden />}
        />
        <ul className="grid grid-cols-2 gap-px bg-border/70 sm:grid-cols-4">
          {MISSION_STATUSES.map((status) => (
            <li key={status} className="bg-surface">
              <Link
                href={`/missions?status=${status}`}
                className="flex h-full items-center justify-between gap-2 px-5 py-4 transition-colors hover:bg-surface-2"
              >
                <StatusBadge status={status} t={t} />
                <span className="tabular text-xl font-semibold text-ink">
                  {stats.byStatus[status]}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
