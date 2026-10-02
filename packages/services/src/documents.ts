import {
  BAND_STEPS,
  abs,
  durationDays,
  formatMoney,
  missionBand,
  type MissionStatus,
} from "@missionops/core";
import {
  bandShape,
  bandToSvg,
  renderDocument,
  sha256,
  type DocumentData,
  type DocumentKind,
  type Translate,
} from "@missionops/documents";
import { documents, receipts, users, type Db } from "@missionops/db";
import { and, desc, eq, inArray, isNull } from "drizzle-orm";

import { ServiceError, authorize, tenant, type ServiceContext } from "./context";
import {
  getReconciliation,
  listAdvances,
  listBudget,
  listExpenses,
  type BlobStore,
} from "./finance";
import { getMissionReport, listMissionEvents } from "./field";
import { getMission } from "./missions";
import { getOrganisation } from "./organisation";

/**
 * Documents de mission (Phase 5) : assemblage des données, rendu PDF et
 * enregistrement versionné. Un document généré est immuable : une nouvelle
 * génération dont le contenu diffère crée une nouvelle version ; un contenu
 * identique renvoie la version existante (même empreinte SHA-256).
 */

export const DOCUMENT_KINDS: readonly DocumentKind[] = [
  "ordre_mission",
  "mission_pack",
  "closure_pack",
];

const AVAILABLE: Record<DocumentKind, readonly MissionStatus[]> = {
  ordre_mission: ["VALIDEE", "EN_COURS", "TERMINEE", "CLOTUREE"],
  mission_pack: ["VALIDEE", "EN_COURS", "TERMINEE", "CLOTUREE"],
  closure_pack: ["CLOTUREE"],
};

export function isDocumentKind(value: string): value is DocumentKind {
  return (DOCUMENT_KINDS as readonly string[]).includes(value);
}

/** Rassemble toutes les données d'une mission pour un document. */
export async function documentData(
  db: Db,
  ctx: ServiceContext,
  store: BlobStore,
  missionId: string,
  t: Translate,
  locale: "fr" | "en",
  includeReceiptFiles: boolean,
): Promise<DocumentData> {
  const [mission, budget, advances, expenses, events, report, org] = await Promise.all([
    getMission(db, ctx, missionId),
    listBudget(db, ctx, missionId),
    listAdvances(db, ctx, missionId),
    listExpenses(db, ctx, { missionId }),
    listMissionEvents(db, ctx, missionId).catch(() => []),
    getMissionReport(db, ctx, missionId).catch(() => null),
    getOrganisation(db, ctx.organisationId),
  ]);
  const reconciliation = await getReconciliation(db, ctx, missionId);
  const base = org.baseCurrency;

  const { receiptRows, generatedByName, validatorName } = await tenant(db, ctx, async (tx) => {
    const expenseIds = expenses.map((e) => e.id);
    const receiptRows =
      expenseIds.length === 0
        ? []
        : await tx
            .select()
            .from(receipts)
            .where(and(inArray(receipts.expenseId, expenseIds), isNull(receipts.deletedAt)))
            .orderBy(receipts.createdAt);
    const ids = [ctx.actor.userId, reconciliation.validatedBy ?? ctx.actor.userId];
    const people = await tx
      .select({ id: users.id, fullName: users.fullName, email: users.email })
      .from(users)
      .where(inArray(users.id, ids));
    const nameOf = (id: string | null) => {
      const p = people.find((x) => x.id === id);
      return p ? (p.fullName ?? p.email) : null;
    };
    return {
      receiptRows,
      generatedByName: nameOf(ctx.actor.userId) ?? "",
      validatorName: nameOf(reconciliation.validatedBy),
    };
  });

  const receiptFiles = await Promise.all(
    receiptRows.map(async (r) => ({
      id: r.id,
      expenseDescription: expenses.find((e) => e.id === r.expenseId)?.description ?? "",
      mimeType: r.mimeType,
      sha256: r.sha256,
      bytes: includeReceiptFiles ? await store.get(r.storageKey) : null,
    })),
  );

  const band = bandShape(
    missionBand({
      status: mission.status,
      hasAdvance: advances.items.some((a) => !a.isReversal && !a.cancelled),
      reconciliationStatus: reconciliation.status,
      balance: advances.items.length > 0 ? reconciliation.computed.balance : null,
    }),
    BAND_STEPS.map((step) => t(`band.${step}`)),
    advances.items.length > 0
      ? t("band.balance", { amount: formatMoney(reconciliation.computed.balance, locale) })
      : null,
  );
  const rec = reconciliation;
  const recVisible = mission.status === "TERMINEE" || mission.status === "CLOTUREE";
  return {
    band,
    locale,
    generatedAt: ctx.now,
    generatedByName,
    org: {
      name: org.name,
      header: org.settings.documentHeader,
      footer: org.settings.documentFooter,
      signatureLabels: org.settings.signatureLabels,
      baseCurrency: base,
    },
    mission: {
      reference: mission.reference,
      title: mission.title,
      purpose: mission.purpose,
      status: t(`missionStatus.${mission.status}`),
      destination: mission.destination,
      startDate: mission.startDate,
      endDate: mission.endDate,
      durationDays: durationDays(mission.startDate, mission.endDate),
      transport: mission.transportMode ? t(`transport.${mission.transportMode}`) : "—",
      requesterName: mission.requesterName,
      notes: mission.notes,
      participants: mission.participants.map((p) => ({
        name: p.name,
        role: t(`participantRole.${p.role}`),
      })),
      approvals: mission.approvals.map((a) => ({
        step: t("missions.detail.approvalStep", {
          position: a.position,
          role: t(`roles.${a.role}`),
        }),
        decision: t(a.decision === "approved" ? "pdf.approved" : "pdf.rejected"),
        deciderName: a.deciderName,
        comment: a.comment,
        at: a.at,
      })),
      history: mission.history.map((h) => ({
        text: `${h.actorName} ${t(`missionEventPast.${h.event}`)}`,
        comment: h.comment,
        at: h.at,
      })),
    },
    budget: budget.lines.map((l) => ({
      category: t(`category.${l.category}`),
      label: l.label,
      quantity: l.quantity,
      unitAmount: l.unitAmount,
      totalBase: l.totalBase,
    })),
    budgetTotal: budget.totalBase,
    advances: advances.items.map((a) => ({
      beneficiaryName: a.beneficiaryName,
      amount: a.amount,
      amountBase: a.amountBase,
      paidOn: a.paidOn,
      method: t(`paymentMethod.${a.paymentMethod}`),
      reference: a.reference,
      isReversal: a.isReversal,
    })),
    advancesTotal: advances.totalBase,
    expenses: expenses
      .filter((e) => e.status !== "rejetee")
      .map((e) => ({
        id: e.id,
        spentOn: e.spentOn,
        category: t(`category.${e.category}`),
        description: e.description,
        spentByName: e.spentByName,
        amount: e.amount,
        amountBase: e.amountBase,
        rate: e.rate,
        status: t(`expenseStatus.${e.status}`),
        receiptCount: e.receiptIds.length,
        receiptMissingReason: e.receiptMissingReason,
        outOfPeriod: e.outOfPeriod,
      })),
    reconciliation: recVisible
      ? {
          status: t(`reconciliationStatus.${rec.status}`),
          advances: rec.computed.advances,
          approvedExpenses: rec.computed.approvedExpenses,
          balance: rec.computed.balance,
          directionText: t(`reconciliation.direction.${rec.computed.direction}`, {
            amount: formatMoney(abs(rec.computed.balance), locale),
          }),
          submittedAt: rec.submittedAt,
          validatedAt: rec.validatedAt,
          validatedByName: validatorName,
          settlement: rec.settlement.method
            ? [
                t(`paymentMethod.${rec.settlement.method}`),
                rec.settlement.reference,
                rec.settlement.settledOn,
              ]
                .filter(Boolean)
                .join(" · ")
            : null,
          variances: rec.variances.map((v) => ({
            category: t(`category.${v.category}`),
            planned: v.planned,
            actual: v.actual,
            justification: v.justification,
          })),
        }
      : null,
    report: report
      ? {
          summary: report.summary,
          results: report.results,
          difficulties: report.difficulties,
          recommendations: report.recommendations,
        }
      : null,
    events: events.map((e) => ({ at: e.occurredAt, kind: t(`eventKind.${e.kind}`), note: e.note })),
    receipts: receiptFiles,
  };
}

export interface GeneratedDocument {
  id: string;
  version: number;
  sha256: string;
  bytes: Uint8Array;
  fileName: string;
}

/**
 * Génère (ou retrouve) un document de mission. L'horodatage du document est
 * celui de sa première version pour un contenu donné : régénérer un contenu
 * inchangé renvoie le même fichier.
 */
export async function generateMissionDocument(
  db: Db,
  ctx: ServiceContext,
  store: BlobStore,
  missionId: string,
  kind: DocumentKind,
  t: Translate,
  locale: "fr" | "en",
): Promise<GeneratedDocument> {
  authorize(ctx, "read", "mission");
  const mission = await getMission(db, ctx, missionId);
  if (!AVAILABLE[kind].includes(mission.status)) throw new ServiceError("mission_status");

  const data = await documentData(db, ctx, store, missionId, t, locale, kind === "closure_pack");
  const fileName = `${mission.reference}-${kind}.pdf`;

  return tenant(db, ctx, async (tx) => {
    const previous = (
      await tx
        .select()
        .from(documents)
        .where(
          and(
            eq(documents.missionId, missionId),
            eq(documents.kind, kind),
            eq(documents.locale, locale),
            isNull(documents.deletedAt),
          ),
        )
        .orderBy(desc(documents.version))
        .limit(1)
    )[0];
    // Rendu « canonique » à l'horodatage de la version précédente pour comparer
    // le contenu sans que la date de génération ne crée une fausse différence.
    if (previous) {
      const canonical = await renderDocument(kind, { ...data, generatedAt: previous.createdAt }, t);
      if (sha256(canonical) === previous.sha256) {
        const stored = await store.get(previous.storageKey);
        if (stored) {
          return {
            id: previous.id,
            version: previous.version,
            sha256: previous.sha256,
            bytes: stored,
            fileName,
          };
        }
      }
    }
    const bytes = await renderDocument(kind, data, t);
    const hash = sha256(bytes);
    const version = (previous?.version ?? 0) + 1;
    const key = `${ctx.organisationId}/documents/${missionId}/${kind}-${locale}-v${version}.pdf`;
    await store.put(key, bytes, "application/pdf");
    const inserted = await tx
      .insert(documents)
      .values({
        organisationId: ctx.organisationId,
        createdBy: ctx.actor.userId,
        missionId,
        kind,
        version,
        storageKey: key,
        sha256: hash,
        sizeBytes: bytes.byteLength,
        locale,
        createdAt: ctx.now,
      })
      .returning({ id: documents.id });
    return { id: inserted[0]!.id, version, sha256: hash, bytes, fileName };
  });
}

export interface DocumentVersionView {
  id: string;
  kind: string;
  version: number;
  sha256: string;
  sizeBytes: number;
  locale: string;
  createdAt: Date;
}

export async function listMissionDocuments(
  db: Db,
  ctx: ServiceContext,
  missionId: string,
): Promise<DocumentVersionView[]> {
  authorize(ctx, "read", "mission");
  await getMission(db, ctx, missionId);
  return tenant(db, ctx, async (tx) =>
    tx
      .select({
        id: documents.id,
        kind: documents.kind,
        version: documents.version,
        sha256: documents.sha256,
        sizeBytes: documents.sizeBytes,
        locale: documents.locale,
        createdAt: documents.createdAt,
      })
      .from(documents)
      .where(and(eq(documents.missionId, missionId), isNull(documents.deletedAt)))
      .orderBy(desc(documents.createdAt)),
  );
}

/** Bande de mission en SVG pour l'interface (B5.4), même géométrie que le PDF. */
export async function missionBandSvg(
  db: Db,
  ctx: ServiceContext,
  missionId: string,
  t: Translate,
  locale: "fr" | "en",
): Promise<string> {
  const [mission, advances, reconciliation] = await Promise.all([
    getMission(db, ctx, missionId),
    listAdvances(db, ctx, missionId),
    getReconciliation(db, ctx, missionId),
  ]);
  const hasAdvances = advances.items.length > 0;
  const shape = bandShape(
    missionBand({
      status: mission.status,
      hasAdvance: advances.items.some((a) => !a.isReversal && !a.cancelled),
      reconciliationStatus: reconciliation.status,
      balance: hasAdvances ? reconciliation.computed.balance : null,
    }),
    BAND_STEPS.map((step) => t(`band.${step}`)),
    hasAdvances
      ? t("band.balance", { amount: formatMoney(reconciliation.computed.balance, locale) })
      : null,
  );
  return bandToSvg(shape, t("band.title", { reference: mission.reference }));
}
