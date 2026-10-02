import { Plus, ReceiptText } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { can as canForRole, type ExpenseStatus } from "@missionops/core";
import { listExpenses } from "@missionops/services";

import { ActionForm } from "@/components/forms/action-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { MoneyDisplay } from "@/components/ui/money-display";
import { getDb } from "@/lib/db";
import { formatDate } from "@/lib/i18n/format";
import { getT } from "@/lib/i18n/server";
import { serviceContext } from "@/lib/server/context";

import { decideExpenseAction, explainReceiptAction } from "../finance/actions";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: `${t("meta.expenses")} — MissionOps` };
}

/** Dépenses (B3.5) et validation financière ligne à ligne (B3.10). */
export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const { view: rawView } = await searchParams;
  const ctx = await serviceContext();
  const { t, locale } = await getT();
  const canApprove = canForRole(ctx.actor, "approve", "expense");
  const view =
    rawView === "pending" && canApprove
      ? "pending"
      : rawView === "all" && canApprove
        ? "all"
        : "mine";
  const status: ExpenseStatus | undefined = view === "pending" ? "soumise" : undefined;
  const expenses = await listExpenses(getDb(), ctx, { status, mine: view === "mine" });

  const tabs = canApprove
    ? ([
        ["mine", t("expenses.mine")],
        ["pending", t("expenses.toValidate")],
        ["all", t("expenses.all")],
      ] as const)
    : [];

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[1.65rem] font-semibold leading-tight tracking-tight text-ink sm:text-3xl">
            {t("expenses.title")}
          </h1>
          <p className="mt-1.5 text-[0.95rem] text-muted">{t("expenses.subtitle")}</p>
        </div>
        <Button asChild size="sm">
          <Link href="/terrain">
            <Plus aria-hidden />
            {t("expenses.newExpense")}
          </Link>
        </Button>
      </div>
      {tabs.length > 0 ? (
        <nav className="flex gap-1">
          {tabs.map(([key, label]) => (
            <Link
              key={key}
              href={key === "mine" ? "/expenses" : `/expenses?view=${key}`}
              aria-current={view === key ? "page" : undefined}
              className={`rounded-full px-3 py-1.5 text-sm ${view === key ? "bg-field text-field-fg" : "bg-surface text-muted"}`}
            >
              {label}
            </Link>
          ))}
        </nav>
      ) : null}
      {expenses.length === 0 ? (
        <EmptyState icon={<ReceiptText aria-hidden />} title={t("expenses.empty")} />
      ) : (
        <ul className="flex flex-col gap-2">
          {expenses.map((e) => (
            <li
              key={e.id}
              className="flex flex-col gap-2 rounded-xl border border-border bg-surface shadow-xs p-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex flex-col">
                  <span className="font-medium">{e.description}</span>
                  <span className="text-sm text-muted">
                    <Link
                      href={`/missions/${e.missionId}`}
                      className="text-field underline underline-offset-2"
                    >
                      {e.missionReference}
                    </Link>{" "}
                    · {formatDate(e.spentOn, locale)} · {t(`category.${e.category}`)} ·{" "}
                    {e.spentByName}
                  </span>
                </div>
                <div className="flex flex-col items-end">
                  <MoneyDisplay money={e.amount} accent locale={locale} />
                  {e.amount.currency !== e.amountBase.currency ? (
                    <MoneyDisplay
                      money={e.amountBase}
                      locale={locale}
                      className="text-xs text-muted"
                    />
                  ) : null}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant={
                    e.status === "approuvee"
                      ? "success"
                      : e.status === "rejetee"
                        ? "danger"
                        : "muted"
                  }
                >
                  {t(`expenseStatus.${e.status}`)}
                </Badge>
                {e.receiptIds.map((rid) => (
                  <a
                    key={rid}
                    href={`/api/receipts/${rid}`}
                    className="text-sm text-field underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {t("expenses.receiptView")}
                  </a>
                ))}
                {e.receiptIds.length === 0 && e.category !== "perdiem" ? (
                  <Badge variant="warning">
                    {e.receiptMissingReason ?? t("expenses.noReceipt")}
                  </Badge>
                ) : null}
                {e.outOfPeriod ? (
                  <Badge variant="warning">{t("expenses.outOfPeriod")}</Badge>
                ) : null}
                {e.createdOffline ? <Badge variant="outline">{t("expenses.offline")}</Badge> : null}
              </div>
              {e.rejectionReason ? (
                <p className="text-sm text-danger">
                  {t("expenses.rejected", { reason: e.rejectionReason })}
                </p>
              ) : null}
              {e.receiptIds.length === 0 &&
              !e.receiptMissingReason &&
              e.spentBy === ctx.actor.userId ? (
                <ActionForm
                  action={explainReceiptAction}
                  submitLabel={t("expenses.explain")}
                  variant="secondary"
                  size="sm"
                  className="flex flex-wrap items-end gap-2"
                >
                  <input type="hidden" name="expenseId" value={e.id} />
                  <Input
                    name="reason"
                    className="h-9 flex-1"
                    placeholder={t("expenses.receiptMissingPlaceholder")}
                    aria-label={t("expenses.receiptMissing")}
                  />
                </ActionForm>
              ) : null}
              {canApprove && e.status === "soumise" && e.spentBy !== ctx.actor.userId ? (
                <div className="flex flex-wrap gap-2">
                  <ActionForm
                    action={decideExpenseAction}
                    submitLabel={t("expenses.approve")}
                    size="sm"
                  >
                    <input type="hidden" name="expenseId" value={e.id} />
                    <input type="hidden" name="decision" value="approuvee" />
                  </ActionForm>
                  <ActionForm
                    action={decideExpenseAction}
                    submitLabel={t("expenses.reject")}
                    variant="danger"
                    size="sm"
                    className="flex flex-wrap items-end gap-2"
                  >
                    <input type="hidden" name="expenseId" value={e.id} />
                    <input type="hidden" name="decision" value="rejetee" />
                    <Input
                      name="reason"
                      className="h-9 w-48"
                      placeholder={t("expenses.rejectReason")}
                      aria-label={t("expenses.rejectReason")}
                    />
                  </ActionForm>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
