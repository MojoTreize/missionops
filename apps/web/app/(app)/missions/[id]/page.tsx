import { ArrowLeft, ChevronDown, FileText, Pencil } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  EXPENSE_CATEGORIES,
  CURRENCIES,
  PAYMENT_METHODS,
  PARTICIPANT_ROLES,
  can as canForRole,
  durationDays,
} from "@missionops/core";
import {
  ServiceError,
  budgetTracking,
  getMission,
  listAdvances,
  listBudget,
  listExpenses,
  listMembers,
  listMissionEvents,
  missionBandSvg,
  overlappingMissions,
} from "@missionops/services";

import { NativeSelect } from "@/components/forms/controls";
import { ActionForm } from "@/components/forms/action-form";
import { StatusBadge } from "@/components/mission/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MoneyDisplay } from "@/components/ui/money-display";
import { getDb } from "@/lib/db";
import { formatDate } from "@/lib/i18n/format";
import { getT } from "@/lib/i18n/server";
import type { MessageKey } from "@/lib/i18n/translate";
import { serviceContext } from "@/lib/server/context";

import {
  addBudgetLineAction,
  addParticipantAction,
  cancelAdvanceAction,
  createAdvanceAction,
  decideMissionAction,
  missionEventAction,
  removeBudgetLineAction,
  removeParticipantAction,
} from "../actions";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const ctx = await serviceContext();
  try {
    const mission = await getMission(getDb(), ctx, id);
    return { title: `${mission.reference} — MissionOps` };
  } catch {
    return { title: "MissionOps" };
  }
}

function Section({
  title,
  children,
  action,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3 rounded-xl border border-border bg-surface shadow-xs p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-base font-semibold text-ink">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export default async function MissionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const { id } = await params;
  const { saved } = await searchParams;
  const ctx = await serviceContext();
  const db = getDb();
  const { t, locale } = await getT();

  const mission = await getMission(db, ctx, id).catch((error: unknown) => {
    if (error instanceof ServiceError) notFound();
    throw error;
  });
  const role = ctx.actor;
  const moneyPhase = ["VALIDEE", "EN_COURS", "TERMINEE", "CLOTUREE"].includes(mission.status);
  const [budget, members, overlaps, advances, expenses, tracking, events] = await Promise.all([
    listBudget(db, ctx, id),
    listMembers(db, ctx.organisationId),
    overlappingMissions(db, ctx, id),
    moneyPhase ? listAdvances(db, ctx, id) : null,
    moneyPhase ? listExpenses(db, ctx, { missionId: id }) : null,
    moneyPhase ? budgetTracking(db, ctx, id) : null,
    moneyPhase ? listMissionEvents(db, ctx, id) : null,
  ]);
  const base = budget.totalBase.currency;
  const bandSvg = await missionBandSvg(db, ctx, id, (key, p) => t(key as MessageKey, p), locale);
  const budgetEditable =
    mission.canEdit && (mission.status === "BROUILLON" || mission.status === "VALIDEE");
  const canPayAdvance =
    canForRole(role, "create", "advance") &&
    (mission.status === "VALIDEE" || mission.status === "EN_COURS");
  const date = (d: string | Date) => formatDate(d, locale);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-5">
      <Link
        href="/missions"
        className="inline-flex items-center gap-1 text-sm text-field hover:underline"
      >
        <ArrowLeft className="size-4" aria-hidden />
        {t("missions.detail.back")}
      </Link>

      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-sm text-muted">{mission.reference}</span>
          <StatusBadge status={mission.status} t={t} />
        </div>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1 className="text-[1.65rem] font-semibold leading-tight tracking-tight text-ink sm:text-3xl">
            {mission.title}
          </h1>
          {mission.canEdit ? (
            <Button asChild variant="secondary" size="sm">
              <Link href={`/missions/${id}/edit`}>
                <Pencil aria-hidden />
                {t("missions.detail.edit")}
              </Link>
            </Button>
          ) : null}
        </div>
        {saved ? (
          <p role="status" className="rounded-md bg-success-soft p-2 text-sm text-success">
            {saved === "revalidation" ? t("missions.form.revalidation") : t("missions.form.saved")}
          </p>
        ) : null}
        {mission.archivedAt ? (
          <p className="rounded-md bg-border/60 p-2 text-sm text-muted">
            {t("missions.detail.archived")}
          </p>
        ) : null}
        {overlaps.length > 0 ? (
          <p className="rounded-md bg-warning-soft p-2 text-sm text-warning">
            {t("missions.detail.overlap", {
              count: new Set(overlaps.map((o) => o.userId)).size,
              refs: [...new Set(overlaps.map((o) => o.reference))].join(", "),
            })}
          </p>
        ) : null}
      </header>

      {/* Bande de mission (B5.4) : SVG produit par le domaine, sans script ni
          contenu saisi par l'utilisateur (libellés traduits, texte échappé). */}
      <div className="overflow-x-auto rounded-xl border border-border bg-surface px-2 py-3 shadow-xs">
        <div className="min-w-[34rem]" dangerouslySetInnerHTML={{ __html: bandSvg }} />
      </div>

      {/* Actions du cycle de vie */}
      {mission.actions.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {mission.actions.map((event) =>
            event === "cancel" ? (
              <ActionForm
                key={event}
                action={missionEventAction}
                submitLabel={t("missionEvent.cancel")}
                variant="danger"
                size="sm"
                className="flex flex-wrap items-end gap-2"
              >
                <input type="hidden" name="missionId" value={id} />
                <input type="hidden" name="event" value="cancel" />
                <Input
                  name="comment"
                  required
                  placeholder={t("missions.detail.reasonLabel")}
                  aria-label={t("missions.detail.reasonLabel")}
                  className="h-9 w-48"
                />
              </ActionForm>
            ) : (
              <ActionForm
                key={event}
                action={missionEventAction}
                submitLabel={t(`missionEvent.${event}`)}
                variant={
                  event === "submit" || event === "start" || event === "finish"
                    ? "primary"
                    : "secondary"
                }
                size="sm"
              >
                <input type="hidden" name="missionId" value={id} />
                <input type="hidden" name="event" value={event} />
              </ActionForm>
            ),
          )}
        </div>
      ) : null}

      {/* Validation */}
      {mission.status !== "BROUILLON" ? (
        <Section title={t("missions.detail.approval")}>
          <ol className="flex flex-col gap-2">
            {mission.steps.map((step) => {
              const decision = mission.approvals.filter((a) => a.position === step.position).at(-1);
              return (
                <li
                  key={step.position}
                  className="flex flex-wrap items-center justify-between gap-2 text-sm"
                >
                  <span>
                    {t("missions.detail.approvalStep", {
                      position: step.position,
                      role: t(`roles.${step.role}`),
                    })}
                  </span>
                  {decision ? (
                    <Badge variant={decision.decision === "approved" ? "success" : "danger"}>
                      {decision.decision === "approved"
                        ? t("missions.detail.approvalApproved", { name: decision.deciderName })
                        : t("missions.detail.approvalRejected", { name: decision.deciderName })}
                    </Badge>
                  ) : (
                    <Badge variant="muted">{t("missions.detail.approvalPending")}</Badge>
                  )}
                </li>
              );
            })}
          </ol>
          {mission.canDecide ? (
            <div className="flex flex-col gap-2 rounded-md bg-paper p-3">
              <h3 className="text-sm font-semibold">{t("missions.detail.decideTitle")}</h3>
              <ActionForm
                action={decideMissionAction}
                submitLabel={t("missions.detail.confirm")}
                className="flex flex-col gap-2"
              >
                <input type="hidden" name="missionId" value={id} />
                <div className="flex flex-wrap gap-4 text-sm">
                  <label className="flex items-center gap-2">
                    <input type="radio" name="decision" value="approved" defaultChecked />
                    {t("missions.detail.approveAction")}
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" name="decision" value="changes_requested" />
                    {t("missions.detail.changesAction")}
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" name="decision" value="rejected" />
                    {t("missions.detail.rejectAction")}
                  </label>
                </div>
                <Input
                  name="comment"
                  placeholder={t("missions.detail.decisionComment")}
                  aria-label={t("missions.detail.decisionComment")}
                />
              </ActionForm>
            </div>
          ) : null}
        </Section>
      ) : null}

      {/* Aperçu */}
      <Section title={t("missions.detail.tabs.overview")}>
        <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted">{t("missions.detail.destination")}</dt>
            <dd className="font-medium">{mission.destination}</dd>
          </div>
          <div>
            <dt className="text-muted">{t("missions.detail.dates")}</dt>
            <dd className="font-medium">
              {t("missions.dates", { start: date(mission.startDate), end: date(mission.endDate) })}{" "}
              ·{" "}
              {t("missions.detail.duration", {
                days: durationDays(mission.startDate, mission.endDate),
              })}
            </dd>
          </div>
          <div>
            <dt className="text-muted">{t("missions.detail.transport")}</dt>
            <dd className="font-medium">
              {mission.transportMode ? t(`transport.${mission.transportMode}`) : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-muted">{t("missions.detail.requester")}</dt>
            <dd className="font-medium">{mission.requesterName}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-muted">{t("missions.detail.purpose")}</dt>
            <dd className="whitespace-pre-line">{mission.purpose}</dd>
          </div>
          {mission.notes ? (
            <div className="sm:col-span-2">
              <dt className="text-muted">{t("missions.detail.notes")}</dt>
              <dd className="whitespace-pre-line">{mission.notes}</dd>
            </div>
          ) : null}
        </dl>
      </Section>

      {/* Participants */}
      <Section title={t("missions.detail.participants")}>
        {mission.participants.length === 0 ? (
          <p className="text-sm text-muted">{t("missions.participants.empty")}</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {mission.participants.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                <span>
                  <span className="font-medium">{p.name}</span>{" "}
                  <span className="text-muted">· {t(`participantRole.${p.role}`)}</span>
                </span>
                {mission.canEdit && p.userId !== mission.requesterId ? (
                  <ActionForm
                    action={removeParticipantAction}
                    submitLabel={t("missions.participants.remove")}
                    variant="ghost"
                    size="sm"
                  >
                    <input type="hidden" name="participantId" value={p.id} />
                    <input type="hidden" name="missionId" value={id} />
                  </ActionForm>
                ) : null}
              </li>
            ))}
          </ul>
        )}
        {mission.canEdit ? (
          <ActionForm
            action={addParticipantAction}
            submitLabel={t("missions.participants.add")}
            variant="secondary"
            size="sm"
            className="grid grid-cols-1 items-end gap-2 sm:grid-cols-4"
          >
            <input type="hidden" name="missionId" value={id} />
            <div className="flex flex-col gap-1">
              <Label htmlFor="p-user">{t("missions.participants.member")}</Label>
              <NativeSelect id="p-user" name="userId" defaultValue="">
                <option value="">{t("missions.participants.memberPlaceholder")}</option>
                {members.map((m) => (
                  <option key={m.userId} value={m.userId}>
                    {m.fullName ?? m.email}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="p-ext">{t("missions.participants.external")}</Label>
              <Input id="p-ext" name="externalName" />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="p-role">{t("missions.participants.role")}</Label>
              <NativeSelect id="p-role" name="role" defaultValue="membre">
                {PARTICIPANT_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {t(`participantRole.${r}`)}
                  </option>
                ))}
              </NativeSelect>
            </div>
          </ActionForm>
        ) : null}
      </Section>

      {/* Budget */}
      <Section
        title={t("budget.title")}
        action={<MoneyDisplay money={budget.totalBase} accent locale={locale} />}
      >
        {budget.lines.length === 0 ? (
          <p className="text-sm text-muted">{t("budget.empty")}</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {budget.lines.map((line) => (
              <li
                key={line.id}
                className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm"
              >
                <span>
                  <span className="font-medium">{line.label}</span>{" "}
                  <span className="text-muted">
                    · {t(`category.${line.category}`)} · {line.quantity} ×{" "}
                    <MoneyDisplay money={line.unitAmount} locale={locale} />
                  </span>
                </span>
                <span className="flex items-center gap-2">
                  <MoneyDisplay money={line.totalBase} locale={locale} />
                  {budgetEditable ? (
                    <ActionForm
                      action={removeBudgetLineAction}
                      submitLabel={t("budget.remove")}
                      variant="ghost"
                      size="sm"
                    >
                      <input type="hidden" name="lineId" value={line.id} />
                      <input type="hidden" name="missionId" value={id} />
                    </ActionForm>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
        )}
        {budgetEditable ? (
          <ActionForm
            action={addBudgetLineAction}
            submitLabel={t("budget.add")}
            variant="secondary"
            size="sm"
            className="grid grid-cols-2 items-end gap-2 sm:grid-cols-6"
          >
            <input type="hidden" name="missionId" value={id} />
            <div className="col-span-2 flex flex-col gap-1">
              <Label htmlFor="b-label">{t("budget.label")}</Label>
              <Input
                id="b-label"
                name="label"
                required
                placeholder={t("budget.labelPlaceholder")}
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="b-cat">{t("budget.category")}</Label>
              <NativeSelect id="b-cat" name="category" defaultValue="transport">
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {t(`category.${c}`)}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="b-qty">{t("budget.quantity")}</Label>
              <Input
                id="b-qty"
                name="quantity"
                type="number"
                min={1}
                defaultValue={1}
                inputMode="numeric"
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="b-amount">{t("budget.unitAmount")}</Label>
              <Input id="b-amount" name="unitAmount" required inputMode="decimal" />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="b-cur">{t("budget.currency")}</Label>
              <NativeSelect id="b-cur" name="currency" defaultValue={base}>
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <div className="col-span-2 flex flex-col gap-1 sm:col-span-3">
              <Label htmlFor="b-rate">{t("budget.rate", { base })}</Label>
              <Input
                id="b-rate"
                name="rate"
                inputMode="decimal"
                placeholder={t("budget.rateHint")}
              />
            </div>
          </ActionForm>
        ) : null}
      </Section>

      {/* Argent : avances, suivi, dépenses, réconciliation */}
      {moneyPhase && advances && tracking && expenses ? (
        <>
          <Section
            title={t("advances.title")}
            action={<MoneyDisplay money={advances.totalBase} accent locale={locale} />}
          >
            {advances.items.length === 0 ? (
              <p className="text-sm text-muted">{t("advances.empty")}</p>
            ) : (
              <ul className="flex flex-col divide-y divide-border">
                {advances.items.map((a) => (
                  <li
                    key={a.id}
                    className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm"
                  >
                    <span>
                      <span className="font-medium">{a.beneficiaryName}</span>{" "}
                      <span className="text-muted">
                        · {date(a.paidOn)} · {t(`paymentMethod.${a.paymentMethod as "especes"}`)}
                        {a.reference ? ` · ${a.reference}` : ""}
                      </span>
                      {a.isReversal ? (
                        <Badge variant="muted" className="ml-2">
                          {t("advances.reversal")}
                        </Badge>
                      ) : null}
                      {a.cancelled ? (
                        <Badge variant="danger" className="ml-2">
                          {t("advances.cancelled")}
                        </Badge>
                      ) : null}
                    </span>
                    <span className="flex items-center gap-2">
                      <MoneyDisplay money={a.amount} locale={locale} />
                      {a.amount.currency !== a.amountBase.currency ? (
                        <span className="text-xs text-muted">
                          (<MoneyDisplay money={a.amountBase} locale={locale} />)
                        </span>
                      ) : null}
                    </span>
                    {canPayAdvance && !a.isReversal && !a.cancelled ? (
                      <details className="group w-full">
                        <summary className="inline-flex min-h-9 cursor-pointer list-none items-center text-xs font-medium text-muted underline-offset-2 hover:text-danger hover:underline [&::-webkit-details-marker]:hidden">
                          {t("advances.cancelOpen")}
                        </summary>
                        <ActionForm
                          action={cancelAdvanceAction}
                          submitLabel={t("advances.cancel")}
                          variant="danger"
                          size="sm"
                          className="mt-1 flex flex-wrap items-center gap-2"
                        >
                          <input type="hidden" name="advanceId" value={a.id} />
                          <input type="hidden" name="missionId" value={id} />
                          <Input
                            name="reason"
                            required
                            className="h-9 min-w-0 flex-1"
                            placeholder={t("advances.cancelReason")}
                            aria-label={t("advances.cancelReason")}
                          />
                        </ActionForm>
                      </details>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
            {canPayAdvance ? (
              <details
                open={advances.items.length === 0}
                className="group mt-2 rounded-lg border border-border bg-surface-2 px-3 open:pb-3"
              >
                <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between text-sm font-semibold text-ledger [&::-webkit-details-marker]:hidden">
                  {t("advances.newAdvance")}
                  <ChevronDown
                    className="size-4 transition-transform group-open:rotate-180"
                    aria-hidden
                  />
                </summary>
                <ActionForm
                  action={createAdvanceAction}
                  submitLabel={t("advances.add")}
                  pendingLabel={t("advances.adding")}
                  variant="ledger"
                  size="sm"
                  className="grid grid-cols-2 items-end gap-2 sm:grid-cols-4"
                >
                  <input type="hidden" name="missionId" value={id} />
                  <div className="col-span-2 flex flex-col gap-1">
                    <Label htmlFor="a-ben">{t("advances.beneficiary")}</Label>
                    <NativeSelect
                      id="a-ben"
                      name="beneficiaryId"
                      defaultValue={mission.requesterId}
                    >
                      {members.map((m) => (
                        <option key={m.userId} value={m.userId}>
                          {m.fullName ?? m.email}
                        </option>
                      ))}
                    </NativeSelect>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label htmlFor="a-amount">{t("advances.amount")}</Label>
                    <Input id="a-amount" name="amount" required inputMode="decimal" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label htmlFor="a-cur">{t("budget.currency")}</Label>
                    <NativeSelect id="a-cur" name="currency" defaultValue={base}>
                      {CURRENCIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </NativeSelect>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label htmlFor="a-date">{t("advances.paidOn")}</Label>
                    <Input
                      id="a-date"
                      name="paidOn"
                      type="date"
                      required
                      defaultValue={new Date().toISOString().slice(0, 10)}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label htmlFor="a-method">{t("advances.method")}</Label>
                    <NativeSelect id="a-method" name="paymentMethod" defaultValue="especes">
                      {PAYMENT_METHODS.map((m) => (
                        <option key={m} value={m}>
                          {t(`paymentMethod.${m}`)}
                        </option>
                      ))}
                    </NativeSelect>
                  </div>
                  <div className="col-span-2 flex flex-col gap-1">
                    <Label htmlFor="a-ref">{t("advances.reference")}</Label>
                    <Input id="a-ref" name="reference" />
                  </div>
                  {role.role === "directeur_pays" || role.role === "admin" ? (
                    <label className="col-span-2 flex items-center gap-2 text-sm sm:col-span-4">
                      <input type="checkbox" name="directorApproved" />
                      {t("advances.directorApproved")}
                    </label>
                  ) : null}
                </ActionForm>
              </details>
            ) : null}
          </Section>

          <Section title={t("budget.tracking")}>
            {tracking.tracking.length === 0 ? (
              <p className="text-sm text-muted">{t("budget.empty")}</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {tracking.tracking.map((row) => (
                  <li key={row.category} className="flex flex-col gap-1 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
                      <span className="font-medium">{t(`category.${row.category}`)}</span>
                      <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <MoneyDisplay money={row.actual} locale={locale} />
                        <span className="text-muted">/</span>
                        <MoneyDisplay money={row.planned} locale={locale} className="text-muted" />
                        <Badge
                          variant={
                            row.level === "over"
                              ? "danger"
                              : row.level === "warning"
                                ? "warning"
                                : "success"
                          }
                        >
                          {row.consumptionBp === null
                            ? t("budget.noPlan")
                            : `${Math.round(row.consumptionBp / 100)} %`}
                        </Badge>
                      </span>
                    </div>
                    <div
                      className="h-1.5 w-full overflow-hidden rounded-full bg-border"
                      aria-hidden
                    >
                      <div
                        className={`h-full ${row.level === "over" ? "bg-danger" : row.level === "warning" ? "bg-warning" : "bg-success"}`}
                        style={{ width: `${Math.min((row.consumptionBp ?? 10000) / 100, 100)}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section
            title={t("expenses.title")}
            action={
              mission.status !== "CLOTUREE" ? (
                <Button asChild size="sm" variant="secondary">
                  <Link href={`/terrain?mission=${id}`}>{t("expenses.newExpense")}</Link>
                </Button>
              ) : null
            }
          >
            {expenses.length === 0 ? (
              <p className="text-sm text-muted">{t("expenses.empty")}</p>
            ) : (
              <ul className="flex flex-col divide-y divide-border">
                {expenses.map((e) => (
                  <li
                    key={e.id}
                    className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm"
                  >
                    <span className="flex flex-col">
                      <span className="font-medium">{e.description}</span>
                      <span className="text-muted">
                        {date(e.spentOn)} · {t(`category.${e.category}`)} · {e.spentByName}
                      </span>
                    </span>
                    <span className="flex items-center gap-2">
                      {e.receiptIds.length === 0 && e.category !== "perdiem" ? (
                        <Badge variant="warning">{t("expenses.noReceipt")}</Badge>
                      ) : null}
                      {e.outOfPeriod ? (
                        <Badge variant="warning">{t("expenses.outOfPeriod")}</Badge>
                      ) : null}
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
                      <MoneyDisplay money={e.amount} locale={locale} />
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <div className="flex flex-wrap gap-2">
            <Button asChild variant="secondary">
              <Link href={`/missions/${id}/reconciliation`}>
                {t("missions.detail.reconciliation")}
              </Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href={`/missions/${id}/report`}>{t("missions.detail.report")}</Link>
            </Button>
          </div>

          {events ? (
            <Section title={t("missions.detail.events")}>
              {events.length === 0 ? (
                <p className="text-sm text-muted">{t("missions.detail.noEvents")}</p>
              ) : (
                <ol className="flex flex-col gap-2 text-sm">
                  {events.map((ev) => (
                    <li key={ev.id} className="flex flex-wrap gap-2">
                      <span className="text-muted">
                        {formatDate(ev.occurredAt, locale, {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </span>
                      <span className="font-medium">{t(`eventKind.${ev.kind}`)}</span>
                      {ev.note ? <span>— {ev.note}</span> : null}
                      {ev.createdOffline ? (
                        <Badge variant="muted">{t("missions.detail.offline")}</Badge>
                      ) : null}
                    </li>
                  ))}
                </ol>
              )}
            </Section>
          ) : null}
        </>
      ) : null}

      {/* Documents */}
      <Section title={t("missions.detail.documents")}>
        <div className="flex flex-wrap gap-2">
          {mission.status !== "BROUILLON" &&
          mission.status !== "SOUMISE" &&
          mission.status !== "REJETEE" ? (
            <>
              <Button asChild variant="secondary" size="sm">
                <a href={`/api/missions/${id}/documents/ordre_mission`}>
                  <FileText aria-hidden />
                  {t("documents.ordre_mission")}
                </a>
              </Button>
              <Button asChild variant="secondary" size="sm">
                <a href={`/api/missions/${id}/documents/mission_pack`}>
                  <FileText aria-hidden />
                  {t("documents.mission_pack")}
                </a>
              </Button>
            </>
          ) : (
            <p className="text-sm text-muted">{t("documents.availableAfterApproval")}</p>
          )}
          {mission.status === "CLOTUREE" ? (
            <Button asChild variant="ledger" size="sm">
              <a href={`/api/missions/${id}/documents/closure_pack`}>
                <FileText aria-hidden />
                {t("documents.closure_pack")}
              </a>
            </Button>
          ) : null}
        </div>
      </Section>

      {/* Historique */}
      <Section title={t("missions.detail.history")}>
        {mission.history.length === 0 ? (
          <p className="text-sm text-muted">{t("missions.detail.noHistory")}</p>
        ) : (
          <ol className="flex flex-col gap-2 text-sm">
            {mission.history.map((h, index) => (
              <li key={index} className="flex flex-col">
                <span>
                  <span className="font-medium">{h.actorName}</span>{" "}
                  {t(`missionEventPast.${h.event}`)}
                </span>
                <span className="text-xs text-muted">
                  {formatDate(h.at, locale, { dateStyle: "medium", timeStyle: "short" })}
                  {h.comment ? ` — ${h.comment}` : ""}
                </span>
              </li>
            ))}
          </ol>
        )}
      </Section>
    </div>
  );
}
