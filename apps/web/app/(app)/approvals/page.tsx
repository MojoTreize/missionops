import { CheckCircle2 } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { approvalQueue, lowStakeMinor } from "@missionops/services";

import { ActionForm } from "@/components/forms/action-form";
import { formatMoney } from "@/lib/money";

import { approveManyAction } from "../missions/actions";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { MoneyDisplay } from "@/components/ui/money-display";
import { getDb } from "@/lib/db";
import { formatDate } from "@/lib/i18n/format";
import { getT } from "@/lib/i18n/server";
import { getOrganisation } from "@missionops/services";
import { serviceContext } from "@/lib/server/context";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: `${t("approvals.title")} — MissionOps` };
}

/** File de validation (B2.6) : les demandes qui attendent l'étape de l'acteur. */
export default async function ApprovalsPage() {
  const ctx = await serviceContext();
  const { t, locale } = await getT();
  const db = getDb();
  const [queue, org] = await Promise.all([
    approvalQueue(db, ctx),
    getOrganisation(db, ctx.organisationId),
  ]);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <div>
        <h1 className="text-[1.65rem] font-semibold leading-tight tracking-tight text-ink sm:text-3xl">
          {t("approvals.title")}
        </h1>
        <p className="mt-1.5 text-[0.95rem] text-muted">{t("approvals.subtitle")}</p>
      </div>
      {queue.some((q) => q.budgetBaseMinor <= lowStakeMinor(org.baseCurrency)) ? (
        <ActionForm
          action={approveManyAction}
          submitLabel={t("approvals.batchSubmit")}
          className="flex flex-col gap-2 rounded-xl border border-border bg-surface shadow-xs p-4"
        >
          <h2 className="font-semibold">{t("approvals.batchTitle")}</h2>
          <p className="text-sm text-muted">
            {t("approvals.batchHint", {
              limit: formatMoney(
                { amountMinor: lowStakeMinor(org.baseCurrency), currency: org.baseCurrency },
                locale,
              ),
            })}
          </p>
          <ul className="flex flex-col gap-1">
            {queue
              .filter((q) => q.budgetBaseMinor <= lowStakeMinor(org.baseCurrency))
              .map((q) => (
                <li key={q.id}>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      name="missionId"
                      value={q.id}
                      aria-label={t("approvals.select", { reference: q.reference })}
                    />
                    <span className="font-mono text-xs text-muted">{q.reference}</span>
                    <span className="truncate">{q.title}</span>
                    <MoneyDisplay
                      money={{ amountMinor: q.budgetBaseMinor, currency: org.baseCurrency }}
                      locale={locale}
                      className="ml-auto"
                    />
                  </label>
                </li>
              ))}
          </ul>
        </ActionForm>
      ) : null}
      {queue.length === 0 ? (
        <EmptyState
          icon={<CheckCircle2 aria-hidden />}
          title={t("approvals.emptyTitle")}
          description={t("approvals.emptyDescription")}
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {queue.map((item) => (
            <li
              key={item.id}
              className="flex flex-col gap-2 rounded-xl border border-border bg-surface shadow-xs p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-mono text-xs text-muted">{item.reference}</span>
                <span className="text-xs text-muted">
                  {t("approvals.step", {
                    position: item.stepPosition,
                    role: t(`roles.${item.stepRole as "manager"}`),
                  })}
                </span>
              </div>
              <p className="font-medium text-ink">{item.title}</p>
              <p className="text-sm text-muted">
                {item.requesterName} · {item.destination} ·{" "}
                {t("missions.dates", {
                  start: formatDate(item.startDate, locale),
                  end: formatDate(item.endDate, locale),
                })}
              </p>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm">
                  {t("approvals.budget")}{" "}
                  <MoneyDisplay
                    money={{ amountMinor: item.budgetBaseMinor, currency: org.baseCurrency }}
                    accent
                    locale={locale}
                  />
                </span>
                <Button asChild size="sm">
                  <Link href={`/missions/${item.id}`}>{t("approvals.open")}</Link>
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
