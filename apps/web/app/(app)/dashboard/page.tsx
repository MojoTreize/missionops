import { Plus, Smartphone } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { MISSION_STATUSES, can as canForRole } from "@missionops/core";
import { dashboard, type MissionSummary } from "@missionops/services";

import { StatusBadge } from "@/components/mission/status-badge";
import { Button } from "@/components/ui/button";
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

  const Tile = ({
    label,
    value,
    href,
  }: {
    label: string;
    value: React.ReactNode;
    href?: string;
  }) => {
    const body = (
      <div className="flex h-full flex-col gap-1 rounded-lg border border-border bg-surface p-4">
        <span className="text-sm text-muted">{label}</span>
        <span className="text-2xl font-semibold text-ink">{value}</span>
      </div>
    );
    return href ? (
      <Link href={href} className="block hover:opacity-90">
        {body}
      </Link>
    ) : (
      body
    );
  };

  const List = ({ title, items }: { title: string; items: MissionSummary[] }) => (
    <section className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-4">
      <h2 className="font-semibold">{title}</h2>
      {items.length === 0 ? (
        <p className="text-sm text-muted">{t("dashboardPage.none")}</p>
      ) : (
        <ul className="flex flex-col divide-y divide-border">
          {items.slice(0, 6).map((m) => (
            <li key={m.id} className="py-2">
              <Link
                href={`/missions/${m.id}`}
                className="flex items-center justify-between gap-2 text-sm"
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium">{m.title}</span>
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
    </section>
  );

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-ink">
            {t("dashboardPage.greeting", { name: user.fullName ?? user.email })}
          </h1>
          <p className="text-sm text-muted">
            {t("dashboardPage.organisation", { name: active.name })}
          </p>
        </div>
        <div className="flex gap-2">
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
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {role.role !== "collaborateur" ? (
          <Tile
            label={t("dashboardPage.approvals")}
            value={stats.approvalsWaiting}
            href="/approvals"
          />
        ) : null}
        {role.role === "finance" || role.role === "admin" ? (
          <>
            <Tile
              label={t("dashboardPage.expensesToReview")}
              value={stats.expensesToReview}
              href="/expenses?view=pending"
            />
            <Tile
              label={t("dashboardPage.reconciliations")}
              value={stats.reconciliationsToValidate}
              href="/finance"
            />
          </>
        ) : null}
        <Tile
          label={t("dashboardPage.onField")}
          value={stats.onField.length}
          href="/missions?status=EN_COURS"
        />
        {canForRole(role, "read", "report") ? (
          <>
            <Tile
              label={t("dashboardPage.monthSpend")}
              value={<MoneyDisplay money={stats.monthSpend} locale={locale} />}
              href="/reports"
            />
            <Tile
              label={t("dashboardPage.monthAdvances")}
              value={<MoneyDisplay money={stats.monthAdvances} locale={locale} />}
            />
            <Tile
              label={t("dashboardPage.receiptCoverage")}
              value={
                stats.receiptCoverageBp === null
                  ? "—"
                  : `${Math.round(stats.receiptCoverageBp / 100)} %`
              }
            />
            <Tile
              label={t("dashboardPage.medianClosure")}
              value={
                stats.medianClosureDays === null
                  ? "—"
                  : t("dashboardPage.days", { days: stats.medianClosureDays })
              }
            />
          </>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <List title={t("dashboardPage.onField")} items={stats.onField} />
        <List title={t("dashboardPage.upcoming")} items={stats.upcoming} />
        <List title={t("dashboardPage.drafts")} items={stats.myDrafts} />
      </div>

      <section className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-4">
        <h2 className="font-semibold">{t("dashboardPage.byStatus")}</h2>
        <ul className="flex flex-wrap gap-2">
          {MISSION_STATUSES.map((status) => (
            <li key={status}>
              <Link
                href={`/missions?status=${status}`}
                className="flex items-center gap-2 rounded-full border border-border px-3 py-1 text-sm"
              >
                <StatusBadge status={status} t={t} />
                <span className="font-medium tabular-nums">{stats.byStatus[status]}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
