import { CalendarDays, Compass, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { isMissionStatus } from "@missionops/core";
import { listMissions, type MissionFilters } from "@missionops/services";

import { StatusBadge } from "@/components/mission/status-badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getDb } from "@/lib/db";
import { formatDate } from "@/lib/i18n/format";
import { getT } from "@/lib/i18n/server";
import { can } from "@/lib/policy";
import { serviceContext } from "@/lib/server/context";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: `${t("meta.missions")} — MissionOps` };
}

const FILTERS = [
  "actives",
  "BROUILLON",
  "SOUMISE",
  "VALIDEE",
  "EN_COURS",
  "TERMINEE",
  "CLOTUREE",
  "all",
  "archivees",
] as const;

export default async function MissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const params = await searchParams;
  const ctx = await serviceContext();
  const { t, locale } = await getT();
  const statusParam = params.status ?? "actives";
  const filters: MissionFilters = { q: params.q?.slice(0, 100) };
  if (statusParam === "actives" || statusParam === "archivees") filters.status = statusParam;
  else if (isMissionStatus(statusParam)) filters.status = statusParam;
  const [missions, canCreate] = await Promise.all([
    listMissions(getDb(), ctx, filters),
    can("create", "mission"),
  ]);

  const filterLabel = (f: (typeof FILTERS)[number]) =>
    f === "actives"
      ? t("missions.filterActive")
      : f === "all"
        ? t("missions.filterAll")
        : f === "archivees"
          ? t("missions.filterArchived")
          : t(`missionStatus.${f}`);

  const href = (status: string) => {
    const search = new URLSearchParams();
    if (status !== "actives") search.set("status", status);
    if (params.q) search.set("q", params.q);
    const qs = search.toString();
    return qs ? `/missions?${qs}` : "/missions";
  };

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-ink">{t("missions.title")}</h1>
        <div className="flex gap-2">
          <Button asChild variant="secondary" size="sm">
            <Link href="/missions/calendar">
              <CalendarDays aria-hidden />
              {t("missions.calendarView")}
            </Link>
          </Button>
          {canCreate ? (
            <Button asChild size="sm">
              <Link href="/missions/new">
                <Plus aria-hidden />
                {t("missions.newMission")}
              </Link>
            </Button>
          ) : null}
        </div>
      </div>

      <form className="flex gap-2" role="search">
        {statusParam !== "actives" ? (
          <input type="hidden" name="status" value={statusParam} />
        ) : null}
        <Input
          name="q"
          defaultValue={params.q ?? ""}
          placeholder={t("missions.searchPlaceholder")}
          aria-label={t("missions.searchPlaceholder")}
        />
        <Button type="submit" variant="secondary">
          {t("missions.search")}
        </Button>
      </form>

      <nav
        className="-mx-1 flex gap-1 overflow-x-auto pb-1"
        aria-label={t("missions.columns.status")}
      >
        {FILTERS.map((f) => (
          <Link
            key={f}
            href={href(f)}
            aria-current={statusParam === f ? "page" : undefined}
            className={`whitespace-nowrap rounded-full px-3 py-1.5 text-sm ${
              statusParam === f ? "bg-field text-field-fg" : "bg-surface text-muted hover:text-ink"
            }`}
          >
            {filterLabel(f)}
          </Link>
        ))}
      </nav>

      {missions.length === 0 ? (
        <EmptyState
          icon={<Compass aria-hidden />}
          title={t("missions.emptyTitle")}
          description={t("missions.emptyDescription")}
        />
      ) : (
        <>
          {/* Mobile : cartes empilées */}
          <ul className="flex flex-col gap-2 md:hidden">
            {missions.map((m) => (
              <li key={m.id}>
                <Link
                  href={`/missions/${m.id}`}
                  className="flex flex-col gap-1 rounded-lg border border-border bg-surface p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs text-muted">{m.reference}</span>
                    <StatusBadge status={m.status} t={t} />
                  </div>
                  <span className="font-medium text-ink">{m.title}</span>
                  <span className="text-sm text-muted">
                    {m.destination} ·{" "}
                    {t("missions.dates", {
                      start: formatDate(m.startDate, locale),
                      end: formatDate(m.endDate, locale),
                    })}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          {/* Ordinateur : tableau */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("missions.columns.reference")}</TableHead>
                  <TableHead>{t("missions.columns.title")}</TableHead>
                  <TableHead>{t("missions.columns.destination")}</TableHead>
                  <TableHead>{t("missions.columns.dates")}</TableHead>
                  <TableHead>{t("missions.columns.requester")}</TableHead>
                  <TableHead>{t("missions.columns.status")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {missions.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-mono text-xs">
                      <Link href={`/missions/${m.id}`} className="text-field hover:underline">
                        {m.reference}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link href={`/missions/${m.id}`} className="font-medium hover:underline">
                        {m.title}
                      </Link>
                    </TableCell>
                    <TableCell>{m.destination}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      {t("missions.dates", {
                        start: formatDate(m.startDate, locale),
                        end: formatDate(m.endDate, locale),
                      })}
                    </TableCell>
                    <TableCell>{m.requesterName}</TableCell>
                    <TableCell>
                      <StatusBadge status={m.status} t={t} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}
