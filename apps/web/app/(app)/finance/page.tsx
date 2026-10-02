import { Landmark } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { financeQueue } from "@missionops/services";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { MoneyDisplay } from "@/components/ui/money-display";
import { getDb } from "@/lib/db";
import { formatDate } from "@/lib/i18n/format";
import { getT } from "@/lib/i18n/server";
import { requireCan } from "@/lib/policy";
import { serviceContext } from "@/lib/server/context";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: `${t("finance.title")} — MissionOps` };
}

/** Espace finance : réconciliations soumises, dépenses à valider, taux. */
export default async function FinancePage() {
  await requireCan("approve", "expense");
  const ctx = await serviceContext();
  const { t, locale } = await getT();
  const queue = await financeQueue(getDb(), ctx);
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[1.65rem] font-semibold leading-tight tracking-tight text-ink sm:text-3xl">
            {t("finance.title")}
          </h1>
          <p className="mt-1.5 text-[0.95rem] text-muted">{t("finance.subtitle")}</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="secondary" size="sm">
            <Link href="/expenses?view=pending">
              {t("finance.pendingExpenses", { count: queue.pendingExpenses })}
            </Link>
          </Button>
          <Button asChild variant="secondary" size="sm">
            <Link href="/finance/rates">{t("finance.rates")}</Link>
          </Button>
        </div>
      </div>
      <h2 className="font-semibold">{t("finance.reconciliations")}</h2>
      {queue.reconciliations.length === 0 ? (
        <EmptyState icon={<Landmark aria-hidden />} title={t("finance.noReconciliations")} />
      ) : (
        <ul className="flex flex-col gap-2">
          {queue.reconciliations.map((r) => (
            <li
              key={r.missionId}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-surface shadow-xs p-3"
            >
              <div className="flex flex-col">
                <span className="font-mono text-xs text-muted">{r.reference}</span>
                <span className="font-medium">{r.title}</span>
                {r.submittedAt ? (
                  <span className="text-xs text-muted">
                    {t("reconciliation.submittedBy", { date: formatDate(r.submittedAt, locale) })}
                  </span>
                ) : null}
              </div>
              <div className="flex items-center gap-3">
                <MoneyDisplay money={r.balance} accent locale={locale} />
                <Button asChild size="sm">
                  <Link href={`/missions/${r.missionId}/reconciliation`}>{t("finance.open")}</Link>
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
