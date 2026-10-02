import { Check, CloudOff, FileText, Fuel, Hotel, RefreshCw, Users } from "lucide-react";

import { money } from "@missionops/core";

import { MoneyDisplay } from "@/components/ui/money-display";
import { cn } from "@/lib/cn";
import type { Translator } from "@/lib/i18n/translate";

/**
 * Aperçus du produit dessinés en HTML pour la page d'accueil : légers, nets à
 * toutes les tailles, traduits, et sans aucun JavaScript côté client. Les
 * montants sont des exemples figés construits avec le type Money du domaine.
 */

export const LOOP_STEPS = ["request", "approval", "advance", "field", "reconciliation", "closure"] as const;
export type LoopStep = (typeof LOOP_STEPS)[number];

/** Bande de mission : l'élément signature, ici à l'étape « terrain ». */
export function BandMock({ t, current = 3, dark = false }: { t: Translator; current?: number; dark?: boolean }) {
  return (
    <ol className="grid grid-cols-6 gap-1.5">
      {LOOP_STEPS.map((step, index) => {
        const state = index < current ? "done" : index === current ? "current" : "upcoming";
        return (
          <li key={step} className="flex min-w-0 flex-col gap-1.5">
            <span
              className={cn(
                "h-1.5 rounded-full",
                state === "done" && (dark ? "bg-field-400" : "bg-field"),
                state === "current" && "bg-ledger",
                state === "upcoming" && (dark ? "bg-white/15" : "bg-border"),
              )}
            />
            <span
              className={cn(
                "truncate text-[0.62rem] font-medium sm:text-[0.68rem]",
                dark ? "text-field-100/70" : "text-muted",
                state === "current" && (dark ? "text-white" : "text-ink"),
              )}
            >
              {t(`landing.mock.steps.${step}`)}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

/** Carte « mission en cours » du héros, avec un téléphone hors ligne superposé. */
export function HeroMock({ t, locale }: { t: Translator; locale: string }) {
  const expenses = [
    { icon: Fuel, label: t("landing.mock.e1"), amount: money(850_000, "GNF") },
    { icon: Hotel, label: t("landing.mock.e2"), amount: money(9_000, "EUR") },
    { icon: Users, label: t("landing.mock.e3"), amount: money(1_200_000, "GNF") },
  ];
  return (
    <div className="relative mx-auto w-full max-w-xl lg:mx-0">
      <div aria-hidden className="absolute -inset-6 -z-10 rounded-[2rem] bg-field-400/20 blur-3xl" />
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-surface text-ink shadow-lg ring-1 ring-black/5">
        <div className="flex items-center gap-1.5 border-b border-border bg-surface-2 px-4 py-2.5">
          <span className="size-2.5 rounded-full bg-border-strong" />
          <span className="size-2.5 rounded-full bg-border-strong" />
          <span className="size-2.5 rounded-full bg-border-strong" />
          <span className="ml-3 truncate font-mono text-[0.68rem] text-subtle">{t("landing.mock.reference")}</span>
        </div>
        <div className="flex flex-col gap-5 p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-mono text-xs text-subtle">{t("landing.mock.reference")}</p>
              <p className="mt-1 text-base font-semibold leading-snug sm:text-lg">{t("landing.mock.mission")}</p>
              <p className="mt-0.5 text-sm text-muted">{t("landing.mock.agent")}</p>
            </div>
            <span className="shrink-0 rounded-full bg-info-soft px-2.5 py-1 text-xs font-semibold text-info">
              {t("landing.mock.status")}
            </span>
          </div>
          <BandMock t={t} />
          <dl className="grid grid-cols-3 gap-2 rounded-xl bg-paper p-3 sm:gap-3 sm:p-4">
            <div className="min-w-0">
              <dt className="truncate text-[0.68rem] text-muted sm:text-xs">{t("landing.mock.advance")}</dt>
              <dd className="mt-1 text-[0.8rem] sm:text-sm">
                <MoneyDisplay money={money(5_000_000, "GNF")} locale={locale} />
              </dd>
            </div>
            <div className="min-w-0">
              <dt className="truncate text-[0.68rem] text-muted sm:text-xs">{t("landing.mock.spent")}</dt>
              <dd className="mt-1 text-[0.8rem] sm:text-sm">
                <MoneyDisplay money={money(3_891_500, "GNF")} locale={locale} />
              </dd>
            </div>
            <div className="min-w-0">
              <dt className="truncate text-[0.68rem] text-muted sm:text-xs">{t("landing.mock.balance")}</dt>
              <dd className="mt-1 text-[0.8rem] sm:text-sm">
                <MoneyDisplay money={money(1_108_500, "GNF")} locale={locale} accent />
              </dd>
            </div>
          </dl>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-subtle">
              {t("landing.mock.expenses")}
            </p>
            <ul className="divide-y divide-border rounded-xl border border-border">
              {expenses.map(({ icon: Icon, label, amount }) => (
                <li key={label} className="flex items-center gap-3 px-3 py-2.5">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-field-softer text-field">
                    <Icon className="size-4" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm">{label}</span>
                    {amount.currency !== "GNF" ? (
                      <span className="block text-[0.68rem] text-subtle">{t("landing.mock.rate")}</span>
                    ) : null}
                  </span>
                  <MoneyDisplay money={amount} locale={locale} className="text-sm" />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Téléphone hors ligne superposé — à partir de la tablette */}
      <div className="absolute -left-6 top-full hidden w-44 -translate-y-[18%] rounded-[1.6rem] border-[5px] border-field-900 bg-surface p-3 text-ink shadow-lg sm:block xl:-left-14">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-border-strong" />
        <div className="flex items-center gap-1.5 rounded-lg bg-warning-soft px-2 py-1.5 text-[0.62rem] font-semibold text-warning">
          <CloudOff className="size-3 shrink-0" aria-hidden />
          <span className="truncate">{t("landing.mock.offline")}</span>
        </div>
        <ul className="mt-2.5 flex flex-col gap-1.5">
          {[0, 1, 2].map((n) => (
            <li key={n} className="flex items-center gap-2 rounded-md bg-paper px-2 py-1.5">
              <span className="size-5 shrink-0 rounded bg-field-softer" />
              <span className="h-1.5 flex-1 rounded-full bg-border-strong" />
              <RefreshCw className="size-3 shrink-0 text-warning" aria-hidden />
            </li>
          ))}
        </ul>
        <div className="mt-2.5 flex items-center gap-1.5 rounded-lg bg-field-softer px-2 py-1.5 text-[0.62rem] font-semibold text-field">
          <Check className="size-3 shrink-0" aria-hidden />
          <span className="truncate">{t("landing.mock.synced")}</span>
        </div>
      </div>
    </div>
  );
}

/** Aperçu du tableau de bord de la finance (section « au bureau »). */
export function DashboardMock({ t, locale }: { t: Translator; locale: string }) {
  const bars = [
    { key: "transport", label: t("landing.showcase.transport"), amount: money(14_200_000, "GNF"), width: "w-[88%]" },
    { key: "lodging", label: t("landing.showcase.lodging"), amount: money(10_600_000, "GNF"), width: "w-[66%]" },
    { key: "perDiem", label: t("landing.showcase.perDiem"), amount: money(8_400_000, "GNF"), width: "w-[52%]" },
    { key: "activities", label: t("landing.showcase.activities"), amount: money(5_720_000, "GNF"), width: "w-[36%]" },
  ];
  return (
    <div className="rounded-2xl border border-border bg-surface p-4 shadow-lg sm:p-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border p-3.5">
          <p className="text-xs text-muted">{t("landing.showcase.queue")}</p>
          <p className="mt-1.5 text-lg font-semibold">{t("landing.showcase.queueCount")}</p>
        </div>
        <div className="rounded-xl border border-border p-3.5">
          <p className="text-xs text-muted">{t("landing.showcase.advances")}</p>
          <p className="mt-1.5 text-lg">
            <MoneyDisplay money={money(12_450_000, "GNF")} locale={locale} className="font-semibold" />
          </p>
        </div>
        <div className="rounded-xl border border-border p-3.5">
          <p className="text-xs text-muted">{t("landing.showcase.month")}</p>
          <p className="mt-1.5 text-lg">
            <MoneyDisplay money={money(38_920_000, "GNF")} locale={locale} accent />
          </p>
        </div>
      </div>
      <div className="mt-4 rounded-xl border border-border p-4">
        <p className="mb-3 text-sm font-semibold">{t("landing.showcase.byCategory")}</p>
        <ul className="flex flex-col gap-3">
          {bars.map((bar) => (
            <li key={bar.key} className="grid grid-cols-[5.5rem_1fr] items-center gap-3 text-sm sm:grid-cols-[6.5rem_1fr_auto]">
              <span className="truncate text-muted">{bar.label}</span>
              <span className="h-2.5 rounded-full bg-paper">
                <span className={cn("block h-full rounded-full bg-field", bar.width)} />
              </span>
              <MoneyDisplay money={bar.amount} locale={locale} className="col-start-2 text-xs sm:col-start-auto" />
            </li>
          ))}
        </ul>
      </div>
      <div className="mt-4 flex items-center gap-3 rounded-xl bg-field-softer p-3.5 text-sm text-field">
        <FileText className="size-4 shrink-0" aria-hidden />
        <span className="font-medium">{t("landing.features.closure.title")}</span>
      </div>
    </div>
  );
}
