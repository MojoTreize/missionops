import { ChevronLeft, ChevronRight, List } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { missionCalendar } from "@missionops/services";

import { StatusBadge } from "@/components/mission/status-badge";
import { Button } from "@/components/ui/button";
import { getDb } from "@/lib/db";
import { formatDate } from "@/lib/i18n/format";
import { getT } from "@/lib/i18n/server";
import { serviceContext } from "@/lib/server/context";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: `${t("missions.calendar.title")} — MissionOps` };
}

function shift(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number) as [number, number];
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return d.toISOString().slice(0, 7);
}

/** Calendrier mensuel des missions (B2.7). Liste par jour sur mobile. */
export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month: raw } = await searchParams;
  const month = raw && /^\d{4}-\d{2}$/.test(raw) ? raw : new Date().toISOString().slice(0, 7);
  const ctx = await serviceContext();
  const { t, locale } = await getT();
  const days = await missionCalendar(getDb(), ctx, month);
  const [year, m] = month.split("-").map(Number) as [number, number];
  // Lundi = 0.
  const offset = (new Date(Date.UTC(year, m - 1, 1)).getUTCDay() + 6) % 7;
  const weekdays = t("missions.calendar.weekdays").split(",");
  const title = formatDate(`${month}-01T12:00:00Z`, locale, { month: "long", year: "numeric" });
  const today = new Date().toISOString().slice(0, 10);
  // Regroupement d'affichage : chaque mission une seule fois, du premier au
  // dernier jour où elle apparaît dans le mois.
  type CalendarMission = (typeof days)[number]["missions"][number];
  const byMission = new Map<string, { mission: CalendarMission; first: string; last: string }>();
  for (const d of days) {
    for (const mission of d.missions) {
      const span = byMission.get(mission.id);
      if (span) span.last = d.date;
      else byMission.set(mission.id, { mission, first: d.date, last: d.date });
    }
  }
  const spans = [...byMission.values()];

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-[1.65rem] font-semibold capitalize leading-tight tracking-tight text-ink sm:text-3xl">
          {title}
        </h1>
        <div className="flex items-center gap-2">
          <Button
            asChild
            variant="secondary"
            size="icon"
            aria-label={t("missions.calendar.previous")}
          >
            <Link href={`/missions/calendar?month=${shift(month, -1)}`}>
              <ChevronLeft aria-hidden />
            </Link>
          </Button>
          <Button asChild variant="secondary" size="icon" aria-label={t("missions.calendar.next")}>
            <Link href={`/missions/calendar?month=${shift(month, 1)}`}>
              <ChevronRight aria-hidden />
            </Link>
          </Button>
          <Button asChild variant="secondary" size="sm">
            <Link href="/missions">
              <List aria-hidden />
              {t("missions.list")}
            </Link>
          </Button>
        </div>
      </div>

      {/* Mobile : une carte par mission (et non par jour), avec ses dates dans le mois */}
      {spans.length === 0 ? (
        <p className="text-sm text-muted md:hidden">{t("dashboardPage.none")}</p>
      ) : (
        <ol className="flex flex-col gap-2 md:hidden">
          {spans.map(({ mission, first, last }) => (
            <li key={mission.id}>
              <Link
                href={`/missions/${mission.id}`}
                className="flex flex-col gap-1 rounded-xl border border-border bg-surface p-3 shadow-xs"
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs text-muted">{mission.reference}</span>
                  <StatusBadge status={mission.status} t={t} />
                </span>
                <span className="font-medium text-ink">{mission.title}</span>
                <span className="text-sm capitalize text-muted">
                  {first === last
                    ? formatDate(`${first}T12:00:00Z`, locale, { weekday: "long", day: "numeric" })
                    : t("missions.dates", {
                        start: formatDate(`${first}T12:00:00Z`, locale, {
                          weekday: "short",
                          day: "numeric",
                        }),
                        end: formatDate(`${last}T12:00:00Z`, locale, {
                          weekday: "short",
                          day: "numeric",
                        }),
                      })}
                </span>
              </Link>
            </li>
          ))}
        </ol>
      )}

      {/* Ordinateur : grille */}
      <div className="hidden grid-cols-7 gap-px overflow-hidden rounded-lg border border-border bg-border md:grid">
        {weekdays.map((w) => (
          <div key={w} className="bg-paper px-2 py-1 text-xs font-semibold uppercase text-muted">
            {w}
          </div>
        ))}
        {Array.from({ length: offset }).map((_, i) => (
          <div key={`pad-${i}`} className="min-h-24 bg-paper" />
        ))}
        {days.map((d) => (
          <div
            key={d.date}
            className={`flex min-h-24 flex-col gap-1 bg-surface p-1.5 ${d.date === today ? "ring-2 ring-inset ring-field" : ""}`}
          >
            <span className="text-xs text-muted">{Number(d.date.slice(8))}</span>
            {d.missions.slice(0, 3).map((mission) => (
              <Link
                key={mission.id}
                href={`/missions/${mission.id}`}
                title={`${mission.reference} — ${mission.title}`}
                className="truncate rounded bg-field-soft px-1 text-xs text-field hover:underline"
              >
                {mission.title}
              </Link>
            ))}
            {d.missions.length > 3 ? (
              <span className="text-xs text-muted">
                {t("missions.calendar.more", { count: d.missions.length - 3 })}
              </span>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
