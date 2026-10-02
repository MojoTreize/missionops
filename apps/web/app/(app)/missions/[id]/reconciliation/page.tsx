import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PAYMENT_METHODS, abs, type ReconciliationIssue } from "@missionops/core";
import { ServiceError, getMission, getReconciliation } from "@missionops/services";

import { NativeSelect, Textarea } from "@/components/forms/controls";
import { ActionForm } from "@/components/forms/action-form";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MoneyDisplay } from "@/components/ui/money-display";
import { getDb } from "@/lib/db";
import { formatDate } from "@/lib/i18n/format";
import { getT } from "@/lib/i18n/server";
import { formatMoney } from "@/lib/money";
import { serviceContext } from "@/lib/server/context";

import {
  justifyVarianceAction,
  reopenReconciliationAction,
  settlementAction,
  submitReconciliationAction,
  validateReconciliationAction,
} from "../../actions";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: `${t("reconciliation.title")} — MissionOps` };
}

/** Réconciliation de l'avance (B3.8), écarts (B3.9), validation financière (B3.10). */
export default async function ReconciliationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await serviceContext();
  const db = getDb();
  const { t, locale } = await getT();
  const [mission, rec] = await Promise.all([
    getMission(db, ctx, id),
    getReconciliation(db, ctx, id),
  ]).catch((error: unknown) => {
    if (error instanceof ServiceError) notFound();
    throw error;
  });
  const c = rec.computed;
  const isFinance = ctx.actor.role === "finance" || ctx.actor.role === "admin";
  const open = rec.status === "ouverte";

  const row = (label: string, value: React.ReactNode) => (
    <div className="flex items-center justify-between gap-2 py-1.5 text-sm">
      <span className="text-muted">{label}</span>
      {value}
    </div>
  );

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      <Link
        href={`/missions/${id}`}
        className="inline-flex items-center gap-1 text-sm text-field hover:underline"
      >
        <ArrowLeft className="size-4" aria-hidden />
        {mission.reference}
      </Link>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-[1.65rem] font-semibold leading-tight tracking-tight text-ink sm:text-3xl">
          {t("reconciliation.title")}
        </h1>
        <Badge
          variant={
            rec.status === "validee" ? "success" : rec.status === "soumise" ? "warning" : "muted"
          }
        >
          {t(`reconciliationStatus.${rec.status}`)}
        </Badge>
      </div>

      <section className="rounded-xl border border-border bg-surface shadow-xs p-4">
        <div className="divide-y divide-border">
          {row(t("reconciliation.advances"), <MoneyDisplay money={c.advances} locale={locale} />)}
          {row(
            t("reconciliation.approvedExpenses"),
            <MoneyDisplay money={c.approvedExpenses} locale={locale} />,
          )}
          {row(
            t("reconciliation.pendingExpenses"),
            <MoneyDisplay money={c.pendingExpenses} locale={locale} />,
          )}
          {row(
            t("reconciliation.rejectedExpenses"),
            <MoneyDisplay money={c.rejectedExpenses} locale={locale} />,
          )}
          {row(
            t("reconciliation.balance"),
            <MoneyDisplay money={c.balance} accent locale={locale} />,
          )}
        </div>
        <p className="mt-3 rounded-md bg-ledger-soft p-3 text-sm font-medium text-ledger">
          {t(`reconciliation.direction.${c.direction}`, {
            amount: formatMoney(abs(c.balance), locale),
          })}
        </p>
        {c.missingReceipts.length > 0 ? (
          <p className="mt-2 text-sm text-warning">
            {t("reconciliation.missingReceipts", { count: c.missingReceipts.length })}
          </p>
        ) : null}
        {c.outOfPeriod.length > 0 ? (
          <p className="mt-1 text-sm text-warning">
            {t("reconciliation.outOfPeriod", { count: c.outOfPeriod.length })}
          </p>
        ) : null}
      </section>

      <section className="flex flex-col gap-3 rounded-xl border border-border bg-surface shadow-xs p-4">
        <h2 className="font-semibold">{t("reconciliation.variances")}</h2>
        {rec.variances.length === 0 ? (
          <p className="text-sm text-muted">{t("reconciliation.noVariances")}</p>
        ) : (
          rec.variances.map((v) => (
            <div
              key={v.category}
              className="flex flex-col gap-2 border-t border-border pt-3 first:border-0 first:pt-0"
            >
              <p className="text-sm">
                {t("reconciliation.variance", {
                  category: t(`category.${v.category}`),
                  actual: formatMoney(v.actual, locale),
                  planned: formatMoney(v.planned, locale),
                })}
              </p>
              {open && mission.status !== "CLOTUREE" ? (
                <ActionForm
                  action={justifyVarianceAction}
                  submitLabel={t("reconciliation.justify")}
                  variant="secondary"
                  size="sm"
                >
                  <input type="hidden" name="missionId" value={id} />
                  <input type="hidden" name="category" value={v.category} />
                  <Textarea
                    name="justification"
                    defaultValue={v.justification ?? ""}
                    aria-label={t("reconciliation.justification")}
                    placeholder={t("reconciliation.justification")}
                  />
                </ActionForm>
              ) : (
                <p className="text-sm text-muted">{v.justification}</p>
              )}
            </div>
          ))
        )}
      </section>

      {rec.missionStatus !== "TERMINEE" && rec.missionStatus !== "CLOTUREE" ? (
        <p className="text-sm text-muted">{t("reconciliation.notFinished")}</p>
      ) : null}

      {rec.issues.length > 0 && rec.status !== "validee" ? (
        <section className="rounded-lg border border-warning bg-warning-soft p-4 text-sm text-warning">
          <h2 className="mb-1 font-semibold">{t("reconciliation.issues")}</h2>
          <ul className="list-disc pl-5">
            {rec.issues.map((issue) => (
              <li key={issue}>{t(`reconciliation.issue.${issue as ReconciliationIssue}`)}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {rec.canSubmit ? (
        <ActionForm action={submitReconciliationAction} submitLabel={t("reconciliation.submit")}>
          <input type="hidden" name="missionId" value={id} />
          <Label htmlFor="r-comment">{t("reconciliation.comment")}</Label>
          <Textarea id="r-comment" name="comment" />
        </ActionForm>
      ) : null}

      {rec.submittedAt ? (
        <p className="text-sm text-muted">
          {t("reconciliation.submittedBy", { date: formatDate(rec.submittedAt, locale) })}
        </p>
      ) : null}
      {rec.validatedAt ? (
        <p className="text-sm text-success">
          {t("reconciliation.validatedAt", { date: formatDate(rec.validatedAt, locale) })}
        </p>
      ) : null}

      {isFinance && rec.status === "soumise" ? (
        <section className="flex flex-col gap-4 rounded-xl border border-border bg-surface shadow-xs p-4">
          <h2 className="font-semibold">{t("reconciliation.settlement")}</h2>
          {c.direction !== "solde" ? (
            <ActionForm
              action={settlementAction}
              submitLabel={t("reconciliation.recordSettlement")}
              variant="secondary"
              className="grid grid-cols-1 items-end gap-2 sm:grid-cols-3"
            >
              <input type="hidden" name="missionId" value={id} />
              <div className="flex flex-col gap-1">
                <Label htmlFor="s-method">{t("reconciliation.settlementMethod")}</Label>
                <NativeSelect
                  id="s-method"
                  name="method"
                  defaultValue={rec.settlement.method ?? "especes"}
                >
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m} value={m}>
                      {t(`paymentMethod.${m}`)}
                    </option>
                  ))}
                </NativeSelect>
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="s-ref">{t("reconciliation.settlementReference")}</Label>
                <Input id="s-ref" name="reference" defaultValue={rec.settlement.reference ?? ""} />
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="s-date">{t("reconciliation.settledOn")}</Label>
                <Input
                  id="s-date"
                  name="settledOn"
                  type="date"
                  defaultValue={rec.settlement.settledOn ?? new Date().toISOString().slice(0, 10)}
                />
              </div>
            </ActionForm>
          ) : null}
          <div className="flex flex-wrap gap-2">
            {rec.canValidate ? (
              <ActionForm
                action={validateReconciliationAction}
                submitLabel={t("reconciliation.validate")}
                variant="ledger"
              >
                <input type="hidden" name="missionId" value={id} />
              </ActionForm>
            ) : null}
            <ActionForm
              action={reopenReconciliationAction}
              submitLabel={t("reconciliation.reopen")}
              variant="secondary"
              className="flex flex-wrap items-end gap-2"
            >
              <input type="hidden" name="missionId" value={id} />
              <Input
                name="comment"
                aria-label={t("reconciliation.comment")}
                placeholder={t("reconciliation.comment")}
              />
            </ActionForm>
          </div>
        </section>
      ) : null}
    </div>
  );
}
