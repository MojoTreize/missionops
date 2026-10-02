import { createHash } from "node:crypto";

import { formatMoney, type Money } from "@missionops/core";

import type { BandShape } from "./band";
import { COLORS, Layout, type Column } from "./layout";

/**
 * Modèles de documents (Phase 5). Les données arrivent déjà calculées par les
 * services ; les libellés passent par le traducteur fourni par l'appelant
 * (`t`), comme toute l'interface. Aucun calcul monétaire ici : seulement de la
 * mise en forme de `Money` (ADR-002).
 */

export type Translate = (key: string, params?: Record<string, string | number>) => string;

export type DocumentKind = "ordre_mission" | "mission_pack" | "closure_pack";

export interface DocumentOrg {
  name: string;
  header: string | null;
  footer: string | null;
  signatureLabels: string[];
  baseCurrency: string;
}

export interface DocumentMission {
  reference: string;
  title: string;
  purpose: string;
  status: string;
  destination: string;
  startDate: string;
  endDate: string;
  durationDays: number;
  transport: string;
  requesterName: string;
  notes: string | null;
  participants: { name: string; role: string }[];
  approvals: {
    step: string;
    decision: string;
    deciderName: string;
    comment: string | null;
    at: Date;
  }[];
  history: { text: string; comment: string | null; at: Date }[];
}

export interface DocumentBudgetLine {
  category: string;
  label: string;
  quantity: number;
  unitAmount: Money;
  totalBase: Money;
}

export interface DocumentAdvance {
  beneficiaryName: string;
  amount: Money;
  amountBase: Money;
  paidOn: string;
  method: string;
  reference: string | null;
  isReversal: boolean;
}

export interface DocumentExpense {
  id: string;
  spentOn: string;
  category: string;
  description: string;
  spentByName: string;
  amount: Money;
  amountBase: Money;
  rate: string;
  status: string;
  receiptCount: number;
  receiptMissingReason: string | null;
  outOfPeriod: boolean;
}

export interface DocumentReceipt {
  id: string;
  expenseDescription: string;
  mimeType: string;
  sha256: string;
  bytes: Uint8Array | null;
}

export interface DocumentReconciliation {
  status: string;
  advances: Money;
  approvedExpenses: Money;
  balance: Money;
  directionText: string;
  submittedAt: Date | null;
  validatedAt: Date | null;
  validatedByName: string | null;
  settlement: string | null;
  variances: { category: string; planned: Money; actual: Money; justification: string | null }[];
}

export interface DocumentData {
  /** Bande de mission déjà calculée (B5.4). */
  band?: BandShape | null;
  locale: "fr" | "en";
  generatedAt: Date;
  generatedByName: string;
  org: DocumentOrg;
  mission: DocumentMission;
  budget: DocumentBudgetLine[];
  budgetTotal: Money;
  advances: DocumentAdvance[];
  advancesTotal: Money | null;
  expenses: DocumentExpense[];
  reconciliation: DocumentReconciliation | null;
  report: {
    summary: string;
    results: string | null;
    difficulties: string | null;
    recommendations: string | null;
  } | null;
  events: { at: Date; kind: string; note: string | null }[];
  receipts: DocumentReceipt[];
}

function dateFormatter(locale: string) {
  const fmt = new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "fr-FR", { dateStyle: "medium" });
  const fmtTime = new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Conakry",
  });
  return {
    day: (iso: string) => fmt.format(new Date(`${iso}T12:00:00Z`)),
    at: (d: Date) => fmtTime.format(d),
  };
}

async function start(data: DocumentData, t: Translate, kind: DocumentKind) {
  const title = `${t(`documents.${kind}`)} — ${data.mission.reference}`;
  return Layout.create({
    title,
    author: data.org.name,
    generatedAt: data.generatedAt,
    header: {
      left: data.org.header ?? data.org.name,
      right: `${data.mission.reference} · ${t(`documents.${kind}`)}`,
    },
  });
}

function money(m: Money, locale: string): string {
  return formatMoney(m, locale);
}

function missionSummary(layout: Layout, data: DocumentData, t: Translate) {
  const d = dateFormatter(data.locale);
  const m = data.mission;
  layout.keyValues([
    [t("pdf.reference"), m.reference],
    [t("pdf.requester"), m.requesterName],
    [t("pdf.destination"), m.destination],
    [
      t("pdf.dates"),
      `${d.day(m.startDate)} — ${d.day(m.endDate)} (${t("pdf.days", { days: m.durationDays })})`,
    ],
    [t("pdf.transport"), m.transport],
    [t("pdf.status"), m.status],
  ]);
  layout.heading(t("pdf.purpose"));
  layout.paragraph(m.purpose);
  if (m.notes) {
    layout.heading(t("pdf.notes"));
    layout.paragraph(m.notes);
  }
}

function participantsTable(layout: Layout, data: DocumentData, t: Translate) {
  layout.heading(t("pdf.participants"));
  layout.table(
    [
      { header: t("pdf.name"), width: 3 },
      { header: t("pdf.role"), width: 2 },
    ],
    data.mission.participants.map((p) => [p.name, p.role]),
  );
}

function budgetTable(layout: Layout, data: DocumentData, t: Translate) {
  layout.heading(t("pdf.budget"));
  if (data.budget.length === 0) {
    layout.paragraph(t("pdf.none"), { color: COLORS.muted });
    return;
  }
  const columns: Column[] = [
    { header: t("pdf.label"), width: 4 },
    { header: t("pdf.category"), width: 2 },
    { header: t("pdf.quantity"), width: 1, align: "right" },
    { header: t("pdf.unit"), width: 2, align: "right" },
    { header: t("pdf.totalBase", { base: data.org.baseCurrency }), width: 2.4, align: "right" },
  ];
  layout.table(
    columns,
    data.budget.map((l) => [
      l.label,
      l.category,
      String(l.quantity),
      money(l.unitAmount, data.locale),
      money(l.totalBase, data.locale),
    ]),
    { totalRow: [t("pdf.total"), "", "", "", money(data.budgetTotal, data.locale)] },
  );
}

function approvalsBlock(layout: Layout, data: DocumentData, t: Translate) {
  const d = dateFormatter(data.locale);
  layout.heading(t("pdf.approvals"));
  if (data.mission.approvals.length === 0) {
    layout.paragraph(t("pdf.none"), { color: COLORS.muted });
    return;
  }
  layout.table(
    [
      { header: t("pdf.step"), width: 2.4 },
      { header: t("pdf.decision"), width: 1.4 },
      { header: t("pdf.by"), width: 2 },
      { header: t("pdf.date"), width: 2 },
      { header: t("pdf.comment"), width: 3 },
    ],
    data.mission.approvals.map((a) => [
      a.step,
      a.decision,
      a.deciderName,
      d.at(a.at),
      a.comment ?? "",
    ]),
  );
}

/** Ordre de mission (B5.3) : la pièce que l'agent présente sur le terrain. */
export async function renderOrdreMission(data: DocumentData, t: Translate): Promise<Uint8Array> {
  const layout = await start(data, t, "ordre_mission");
  layout.title(t("documents.ordre_mission"), data.mission.title);
  if (data.band) layout.band(data.band);
  layout.paragraph(t("pdf.orderIntro", { org: data.org.name }), { color: COLORS.muted, size: 9 });
  missionSummary(layout, data, t);
  participantsTable(layout, data, t);
  approvalsBlock(layout, data, t);
  layout.heading(t("pdf.signatures"));
  layout.signatures(data.org.signatureLabels);
  return finish(layout, data, t);
}

/** Mission Pack (B5.5) : ordre de mission, budget, avances, consignes. */
export async function renderMissionPack(data: DocumentData, t: Translate): Promise<Uint8Array> {
  const layout = await start(data, t, "mission_pack");
  layout.title(t("documents.mission_pack"), data.mission.title);
  if (data.band) layout.band(data.band);
  missionSummary(layout, data, t);
  participantsTable(layout, data, t);
  budgetTable(layout, data, t);
  advancesTable(layout, data, t);
  approvalsBlock(layout, data, t);
  layout.heading(t("pdf.checklist"));
  for (const item of [t("pdf.check1"), t("pdf.check2"), t("pdf.check3"), t("pdf.check4")]) {
    layout.paragraph(`[ ]  ${item}`);
  }
  layout.heading(t("pdf.signatures"));
  layout.signatures(data.org.signatureLabels);
  return finish(layout, data, t);
}

function advancesTable(layout: Layout, data: DocumentData, t: Translate) {
  const d = dateFormatter(data.locale);
  layout.heading(t("pdf.advances"));
  if (data.advances.length === 0) {
    layout.paragraph(t("pdf.none"), { color: COLORS.muted });
    return;
  }
  layout.table(
    [
      { header: t("pdf.date"), width: 1.6 },
      { header: t("pdf.beneficiary"), width: 2.4 },
      { header: t("pdf.method"), width: 2 },
      { header: t("pdf.amount"), width: 2, align: "right" },
      { header: t("pdf.totalBase", { base: data.org.baseCurrency }), width: 2.2, align: "right" },
    ],
    data.advances.map((a) => [
      d.day(a.paidOn),
      a.isReversal ? `${a.beneficiaryName} (${t("pdf.reversal")})` : a.beneficiaryName,
      [a.method, a.reference].filter(Boolean).join(" · "),
      money(a.amount, data.locale),
      money(a.amountBase, data.locale),
    ]),
    data.advancesTotal
      ? { totalRow: [t("pdf.total"), "", "", "", money(data.advancesTotal, data.locale)] }
      : {},
  );
}

/**
 * Closure Pack (B5.7) — la pièce maîtresse. Tout ce qu'un auditeur demande, dans
 * l'ordre où il le demande : synthèse, réconciliation, écarts justifiés,
 * dépenses ligne à ligne avec taux figés, avances, circuit de validation,
 * rapport, journal terrain, historique, justificatifs et leurs empreintes.
 */
export async function renderClosurePack(data: DocumentData, t: Translate): Promise<Uint8Array> {
  const d = dateFormatter(data.locale);
  const layout = await start(data, t, "closure_pack");
  layout.title(t("documents.closure_pack"), data.mission.title);
  if (data.band) layout.band(data.band);
  missionSummary(layout, data, t);

  const rec = data.reconciliation;
  layout.heading(t("pdf.reconciliation"));
  if (rec) {
    layout.keyValues([
      [t("pdf.advancesTotal"), money(rec.advances, data.locale)],
      [t("pdf.expensesTotal"), money(rec.approvedExpenses, data.locale)],
      [t("pdf.balance"), money(rec.balance, data.locale)],
      [t("pdf.status"), rec.status],
      [t("pdf.settlement"), rec.settlement ?? "—"],
      [
        t("pdf.validatedBy"),
        rec.validatedByName && rec.validatedAt
          ? `${rec.validatedByName} — ${d.at(rec.validatedAt)}`
          : "—",
      ],
    ]);
    layout.callout(rec.directionText);
    if (rec.variances.length > 0) {
      layout.heading(t("pdf.variances"));
      layout.table(
        [
          { header: t("pdf.category"), width: 2 },
          { header: t("pdf.planned"), width: 2, align: "right" },
          { header: t("pdf.actual"), width: 2, align: "right" },
          { header: t("pdf.justification"), width: 5 },
        ],
        rec.variances.map((v) => [
          v.category,
          money(v.planned, data.locale),
          money(v.actual, data.locale),
          v.justification ?? "—",
        ]),
      );
    }
  } else {
    layout.paragraph(t("pdf.none"), { color: COLORS.muted });
  }

  layout.heading(t("pdf.expenses"));
  layout.table(
    [
      { header: t("pdf.date"), width: 1.5 },
      { header: t("pdf.description"), width: 3 },
      { header: t("pdf.category"), width: 2 },
      { header: t("pdf.amount"), width: 1.9, align: "right" },
      { header: t("pdf.rate"), width: 1.3, align: "right" },
      { header: t("pdf.totalBase", { base: data.org.baseCurrency }), width: 2, align: "right" },
      { header: t("pdf.receipt"), width: 1.6 },
    ],
    data.expenses.map((e) => [
      d.day(e.spentOn),
      `${e.description} — ${e.spentByName}${e.outOfPeriod ? ` (${t("pdf.outOfPeriod")})` : ""}`,
      e.category,
      money(e.amount, data.locale),
      e.rate,
      money(e.amountBase, data.locale),
      e.receiptCount > 0
        ? t("pdf.receiptCount", { count: e.receiptCount })
        : (e.receiptMissingReason ?? t("pdf.noReceipt")),
    ]),
    rec
      ? { totalRow: [t("pdf.total"), "", "", "", "", money(rec.approvedExpenses, data.locale), ""] }
      : {},
  );

  advancesTable(layout, data, t);
  budgetTable(layout, data, t);
  participantsTable(layout, data, t);
  approvalsBlock(layout, data, t);

  if (data.report) {
    layout.heading(t("documents.rapport"));
    layout.paragraph(data.report.summary);
    for (const [key, value] of [
      ["pdf.results", data.report.results],
      ["pdf.difficulties", data.report.difficulties],
      ["pdf.recommendations", data.report.recommendations],
    ] as const) {
      if (value) {
        layout.paragraph(t(key), { bold: true, size: 9 });
        layout.paragraph(value);
      }
    }
  }

  if (data.events.length > 0) {
    layout.heading(t("pdf.events"));
    layout.table(
      [
        { header: t("pdf.date"), width: 2 },
        { header: t("pdf.event"), width: 1.6 },
        { header: t("pdf.comment"), width: 5 },
      ],
      data.events.map((e) => [d.at(e.at), e.kind, e.note ?? ""]),
    );
  }

  layout.heading(t("pdf.history"));
  layout.table(
    [
      { header: t("pdf.date"), width: 2 },
      { header: t("pdf.event"), width: 4 },
      { header: t("pdf.comment"), width: 3 },
    ],
    data.mission.history.map((h) => [d.at(h.at), h.text, h.comment ?? ""]),
  );

  layout.heading(t("pdf.integrity"));
  layout.paragraph(t("pdf.integrityIntro"), { size: 8, color: COLORS.muted });
  layout.table(
    [
      { header: t("pdf.receipt"), width: 3 },
      { header: "SHA-256", width: 6 },
    ],
    data.receipts.map((r) => [r.expenseDescription, r.sha256]),
  );

  if (data.receipts.some((r) => r.bytes)) {
    layout.newPage();
    layout.heading(t("pdf.receiptsAnnex"));
    for (const receipt of data.receipts) {
      if (!receipt.bytes) continue;
      if (receipt.mimeType === "application/pdf") {
        layout.paragraph(`${receipt.expenseDescription} — ${t("pdf.pdfReceipt")}`);
        continue;
      }
      await layout.image(
        receipt.bytes,
        receipt.mimeType,
        `${receipt.expenseDescription} — ${receipt.sha256.slice(0, 16)}…`,
      );
    }
  }

  layout.heading(t("pdf.signatures"));
  layout.signatures(data.org.signatureLabels);
  return finish(layout, data, t);
}

function finish(layout: Layout, data: DocumentData, t: Translate): Promise<Uint8Array> {
  const d = dateFormatter(data.locale);
  const footer = [
    data.org.footer,
    t("documents.generatedOn", { date: d.at(data.generatedAt) }),
    data.generatedByName,
  ]
    .filter(Boolean)
    .join(" · ");
  return layout.finish(footer, (page, total) => t("documents.page", { page, total }));
}

export async function renderDocument(
  kind: DocumentKind,
  data: DocumentData,
  t: Translate,
): Promise<Uint8Array> {
  switch (kind) {
    case "ordre_mission":
      return renderOrdreMission(data, t);
    case "mission_pack":
      return renderMissionPack(data, t);
    case "closure_pack":
      return renderClosurePack(data, t);
  }
}

export function sha256(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}
