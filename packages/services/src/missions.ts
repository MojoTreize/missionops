import { approvalDecisionInput, missionInput, participantInput } from "@missionops/contracts";
import {
  DEFAULT_FLOW,
  MissionTransitionError,
  approvalState,
  availableEvents,
  checkDecision,
  formatMissionReference,
  isEditable,
  isMissionStatus,
  isRole,
  isSubstantialChange,
  requiredSteps,
  transition,
  validateDraft,
  validateParticipants,
  type ApprovalRecord,
  type ApprovalState,
  type ApprovalStep,
  type Currency,
  type MissionEvent,
  type MissionStatus,
  type ParticipantRole,
  type TransportMode,
} from "@missionops/core";
import {
  approvalSteps,
  approvals,
  budgetLines,
  missionParticipants,
  missionStatusHistory,
  missions,
  users,
  type Db,
  type Mission,
} from "@missionops/db";
import { and, asc, desc, eq, gte, ilike, inArray, isNull, lte, or, sql } from "drizzle-orm";

import { ServiceError, authorize, first, parse, tenant, type ServiceContext } from "./context";
import { destinationLabel } from "./locations";
import { enqueue, type NotificationRequest } from "./notifications";
import { getOrganisation, listMembers } from "./organisation";

// --------------------------------------------------------------- Lecture

export interface MissionSummary {
  id: string;
  reference: string;
  title: string;
  status: MissionStatus;
  requesterId: string;
  requesterName: string;
  destination: string;
  startDate: string;
  endDate: string;
}

export interface ParticipantView {
  id: string;
  userId: string | null;
  name: string;
  role: ParticipantRole;
}

export interface HistoryView {
  from: MissionStatus;
  to: MissionStatus;
  event: MissionEvent;
  actorName: string;
  comment: string | null;
  at: Date;
}

export interface ApprovalView {
  position: number;
  role: string;
  decision: "approved" | "rejected";
  deciderName: string;
  comment: string | null;
  at: Date;
}

export interface MissionDetail extends MissionSummary {
  purpose: string;
  destinationCode: string | null;
  destinationLocationId: string | null;
  transportMode: TransportMode | null;
  notes: string | null;
  createdAt: Date;
  archivedAt: Date | null;
  participants: ParticipantView[];
  history: HistoryView[];
  approvals: ApprovalView[];
  steps: ApprovalStep[];
  approval: ApprovalState;
  budgetBase: { amountMinor: bigint; currency: Currency };
  /** Événements que l'acteur courant peut déclencher (hors validation). */
  actions: MissionEvent[];
  /** L'acteur courant peut-il décider de l'étape de validation en cours ? */
  canDecide: boolean;
  canEdit: boolean;
}

function asStatus(value: string): MissionStatus {
  return isMissionStatus(value) ? value : "BROUILLON";
}

/** Un collaborateur ne voit que ses missions et celles où il participe. */
async function visibilityFilter(tx: Db, ctx: ServiceContext) {
  if (ctx.actor.role !== "collaborateur") return undefined;
  const participations = await tx
    .select({ missionId: missionParticipants.missionId })
    .from(missionParticipants)
    .where(
      and(eq(missionParticipants.userId, ctx.actor.userId), isNull(missionParticipants.deletedAt)),
    );
  const ids = participations.map((p) => p.missionId);
  return ids.length > 0
    ? or(eq(missions.requesterId, ctx.actor.userId), inArray(missions.id, ids))
    : eq(missions.requesterId, ctx.actor.userId);
}

async function loadMission(tx: Db, ctx: ServiceContext, id: string): Promise<Mission> {
  const filter = await visibilityFilter(tx, ctx);
  const rows = await tx
    .select()
    .from(missions)
    .where(and(eq(missions.id, id), isNull(missions.deletedAt), filter))
    .limit(1);
  return first(rows);
}

async function names(tx: Db, ids: string[]): Promise<Map<string, string>> {
  const unique = [...new Set(ids.filter(Boolean))];
  if (unique.length === 0) return new Map();
  const rows = await tx
    .select({ id: users.id, fullName: users.fullName, email: users.email })
    .from(users)
    .where(inArray(users.id, unique));
  return new Map(rows.map((r) => [r.id, r.fullName ?? r.email]));
}

async function summarize(tx: Db, rows: Mission[]): Promise<MissionSummary[]> {
  const nameMap = await names(
    tx,
    rows.map((r) => r.requesterId),
  );
  return Promise.all(
    rows.map(async (r) => ({
      id: r.id,
      reference: r.reference,
      title: r.title,
      status: asStatus(r.status),
      requesterId: r.requesterId,
      requesterName: nameMap.get(r.requesterId) ?? "—",
      destination: await destinationLabel(tx, r),
      startDate: r.startDate,
      endDate: r.endDate,
    })),
  );
}

export interface MissionFilters {
  status?: MissionStatus | "actives" | "archivees";
  q?: string;
  /** Missions qui chevauchent la période [from, to] (jours ISO). */
  from?: string;
  to?: string;
  mine?: boolean;
  limit?: number;
}

export async function listMissions(
  db: Db,
  ctx: ServiceContext,
  filters: MissionFilters = {},
): Promise<MissionSummary[]> {
  authorize(ctx, "read", "mission");
  return tenant(db, ctx, async (tx) => {
    const visibility = await visibilityFilter(tx, ctx);
    const conditions = [isNull(missions.deletedAt), visibility];
    if (filters.status === "archivees") {
      conditions.push(sql`${missions.archivedAt} is not null`);
    } else {
      conditions.push(isNull(missions.archivedAt));
      if (filters.status === "actives") {
        conditions.push(inArray(missions.status, ["SOUMISE", "VALIDEE", "EN_COURS", "TERMINEE"]));
      } else if (filters.status) {
        conditions.push(eq(missions.status, filters.status));
      }
    }
    if (filters.q) {
      const pattern = `%${filters.q.replace(/[%_]/g, "")}%`;
      conditions.push(or(ilike(missions.title, pattern), ilike(missions.reference, pattern)));
    }
    if (filters.from) conditions.push(gte(missions.endDate, filters.from));
    if (filters.to) conditions.push(lte(missions.startDate, filters.to));
    if (filters.mine) conditions.push(eq(missions.requesterId, ctx.actor.userId));
    const rows = await tx
      .select()
      .from(missions)
      .where(and(...conditions))
      .orderBy(desc(missions.startDate), desc(missions.createdAt))
      .limit(filters.limit ?? 200);
    return summarize(tx, rows);
  });
}

/** Circuit de l'organisation, ou circuit par défaut (B2.5). */
export async function loadFlow(tx: Db): Promise<ApprovalStep[]> {
  const rows = await tx
    .select()
    .from(approvalSteps)
    .where(isNull(approvalSteps.deletedAt))
    .orderBy(asc(approvalSteps.position));
  if (rows.length === 0) return [...DEFAULT_FLOW];
  return rows
    .filter((r) => isRole(r.approverRole))
    .map((r) => ({
      position: r.position,
      role: r.approverRole as ApprovalStep["role"],
      minBudgetMinor: r.minBudgetMinor,
    }));
}

export async function budgetBaseMinor(tx: Db, missionId: string): Promise<bigint> {
  const rows = await tx
    .select({ total: sql<string>`coalesce(sum(${budgetLines.totalBaseMinor}), 0)::text` })
    .from(budgetLines)
    .where(and(eq(budgetLines.missionId, missionId), isNull(budgetLines.deletedAt)));
  return BigInt(rows[0]?.total ?? "0");
}

/** Cycle de validation courant : nombre de soumissions de la mission. */
async function currentCycle(tx: Db, missionId: string): Promise<number> {
  const rows = await tx
    .select({ n: sql<number>`count(*)::int` })
    .from(missionStatusHistory)
    .where(
      and(
        eq(missionStatusHistory.missionId, missionId),
        eq(missionStatusHistory.toStatus, "SOUMISE"),
      ),
    );
  return Math.max(rows[0]?.n ?? 0, 1);
}

async function approvalContext(tx: Db, mission: Mission) {
  const [flow, budget, cycle] = await Promise.all([
    loadFlow(tx),
    budgetBaseMinor(tx, mission.id),
    currentCycle(tx, mission.id),
  ]);
  const steps = requiredSteps(flow, budget);
  const rows = await tx
    .select()
    .from(approvals)
    .where(
      and(
        eq(approvals.missionId, mission.id),
        eq(approvals.cycle, cycle),
        isNull(approvals.deletedAt),
      ),
    )
    .orderBy(asc(approvals.createdAt));
  const records: ApprovalRecord[] = rows.map((r) => ({
    position: r.position,
    decision: r.decision as ApprovalRecord["decision"],
    decidedBy: r.createdBy,
  }));
  return { steps, budget, cycle, rows, records, state: approvalState(steps, records) };
}

function canEditMission(ctx: ServiceContext, mission: Mission): boolean {
  if (!isEditable(asStatus(mission.status)) || mission.archivedAt) return false;
  if (mission.requesterId === ctx.actor.userId) return true;
  return ctx.actor.role !== "collaborateur" && ctx.actor.role !== "finance";
}

function permittedEvents(ctx: ServiceContext, mission: Mission): MissionEvent[] {
  const status = asStatus(mission.status);
  if (mission.archivedAt) return [];
  return availableEvents(status).filter((event) => {
    if (event === "approve" || event === "reject" || event === "close" || event === "revise") {
      return false; // circuit de validation, clôture financière, modification
    }
    if (mission.requesterId !== ctx.actor.userId && ctx.actor.role === "collaborateur") {
      return false;
    }
    try {
      transition({ status, requesterId: mission.requesterId }, event, {
        actor: ctx.actor,
        now: ctx.now,
        comment: "x",
        guards: { draftValid: true },
      });
      return true;
    } catch {
      return false;
    }
  });
}

export async function getMission(db: Db, ctx: ServiceContext, id: string): Promise<MissionDetail> {
  authorize(ctx, "read", "mission");
  return tenant(db, ctx, async (tx) => {
    const mission = await loadMission(tx, ctx, id);
    const [summary] = await summarize(tx, [mission]);
    const [participantRows, historyRows, approval, org] = await Promise.all([
      tx
        .select()
        .from(missionParticipants)
        .where(and(eq(missionParticipants.missionId, id), isNull(missionParticipants.deletedAt)))
        .orderBy(asc(missionParticipants.createdAt)),
      tx
        .select()
        .from(missionStatusHistory)
        .where(eq(missionStatusHistory.missionId, id))
        .orderBy(asc(missionStatusHistory.createdAt)),
      approvalContext(tx, mission),
      getOrganisation(tx, ctx.organisationId),
    ]);
    const nameMap = await names(tx, [
      ...participantRows.map((p) => p.userId ?? ""),
      ...historyRows.map((h) => h.createdBy),
      ...approval.rows.map((a) => a.createdBy),
    ]);
    const status = asStatus(mission.status);
    const decisionError =
      status === "SOUMISE"
        ? checkDecision(approval.state, ctx.actor, mission.requesterId, approval.records)
        : "not_pending";
    return {
      ...summary!,
      purpose: mission.purpose,
      destinationCode: mission.destinationCode,
      destinationLocationId: mission.destinationLocationId,
      transportMode: mission.transportMode as TransportMode | null,
      notes: mission.notes,
      createdAt: mission.createdAt,
      archivedAt: mission.archivedAt,
      participants: participantRows.map((p) => ({
        id: p.id,
        userId: p.userId,
        name: p.userId ? (nameMap.get(p.userId) ?? "—") : (p.externalName ?? "—"),
        role: p.role as ParticipantRole,
      })),
      history: historyRows.map((h) => ({
        from: asStatus(h.fromStatus),
        to: asStatus(h.toStatus),
        event: h.event as MissionEvent,
        actorName: nameMap.get(h.createdBy) ?? "—",
        comment: h.comment,
        at: h.createdAt,
      })),
      approvals: approval.rows.map((a) => ({
        position: a.position,
        role: a.approverRole,
        decision: a.decision as "approved" | "rejected",
        deciderName: nameMap.get(a.createdBy) ?? "—",
        comment: a.comment,
        at: a.createdAt,
      })),
      steps: approval.steps,
      approval: approval.state,
      budgetBase: { amountMinor: approval.budget, currency: org.baseCurrency },
      actions: permittedEvents(ctx, mission),
      canDecide: decisionError === null && ctx.actor.role !== "collaborateur",
      canEdit: canEditMission(ctx, mission),
    };
  });
}

// ------------------------------------------------------------- Écriture

async function nextReference(tx: Db, year: number): Promise<string> {
  const rows = await tx
    .select({ n: sql<number>`count(*)::int` })
    .from(missions)
    .where(sql`${missions.reference} like ${`MIS-${year}-%`}`);
  return formatMissionReference(year, (rows[0]?.n ?? 0) + 1);
}

/** Crée une demande de mission au statut BROUILLON (B2.3). */
export async function createMission(
  db: Db,
  ctx: ServiceContext,
  input: unknown,
): Promise<{ id: string; reference: string }> {
  authorize(ctx, "create", "mission");
  const value = parse(missionInput, input);
  const issues = validateDraft(value);
  if (issues.includes("destination_unknown") || issues.includes("duration_too_long")) {
    throw new ServiceError(issues[0]!);
  }
  return tenant(db, ctx, async (tx) => {
    const reference = await nextReference(tx, ctx.now.getUTCFullYear());
    const inserted = await tx
      .insert(missions)
      .values({
        organisationId: ctx.organisationId,
        createdBy: ctx.actor.userId,
        reference,
        title: value.title,
        purpose: value.purpose,
        requesterId: ctx.actor.userId,
        destinationCode: value.destinationCode,
        destinationLocationId: value.destinationLocationId,
        startDate: value.startDate,
        endDate: value.endDate,
        transportMode: value.transportMode,
        notes: value.notes,
      })
      .returning({ id: missions.id, reference: missions.reference });
    const mission = inserted[0]!;
    await tx.insert(missionParticipants).values({
      organisationId: ctx.organisationId,
      createdBy: ctx.actor.userId,
      missionId: mission.id,
      userId: ctx.actor.userId,
      role: "chef_mission",
    });
    return mission;
  });
}

async function recordTransition(
  tx: Db,
  ctx: ServiceContext,
  mission: Mission,
  event: MissionEvent,
  comment: string | null,
  guards: Parameters<typeof transition>[2]["guards"],
): Promise<MissionStatus> {
  let record;
  try {
    record = transition(
      { status: asStatus(mission.status), requesterId: mission.requesterId },
      event,
      { actor: ctx.actor, now: ctx.now, comment, guards },
    );
  } catch (error) {
    if (error instanceof MissionTransitionError) throw new ServiceError(error.code);
    throw error;
  }
  const stamps: Partial<Record<MissionStatus, keyof Mission>> = {
    SOUMISE: "submittedAt",
    VALIDEE: "approvedAt",
    EN_COURS: "startedAt",
    TERMINEE: "finishedAt",
    CLOTUREE: "closedAt",
    ANNULEE: "cancelledAt",
  };
  const stamp = stamps[record.to];
  // Seule écriture de `missions.status` du produit (ADR-006), conditionnée à
  // l'ancien statut pour éviter toute course entre deux transitions.
  const updated = await tx
    .update(missions)
    .set({
      status: record.to,
      updatedBy: ctx.actor.userId,
      updatedAt: ctx.now,
      ...(stamp ? { [stamp]: ctx.now } : {}),
    })
    .where(and(eq(missions.id, mission.id), eq(missions.status, record.from)))
    .returning({ id: missions.id });
  if (updated.length === 0) throw new ServiceError("conflict");
  await tx.insert(missionStatusHistory).values({
    organisationId: ctx.organisationId,
    createdBy: ctx.actor.userId,
    missionId: mission.id,
    fromStatus: record.from,
    toStatus: record.to,
    event: record.event,
    comment: record.comment,
  });
  return record.to;
}

/** Notifie les validateurs de l'étape en attente. */
async function notifyApprovers(tx: Db, ctx: ServiceContext, mission: Mission, step: ApprovalStep) {
  const approvers = await listMembers(tx, ctx.organisationId, step.role);
  const admins = approvers.length > 0 ? [] : await listMembers(tx, ctx.organisationId, "admin");
  await enqueue(
    tx,
    ctx,
    [...approvers, ...admins]
      .filter((m) => m.userId !== mission.requesterId)
      .map((m): NotificationRequest => ({
        recipientId: m.userId,
        template: "approval_needed",
        payload: { missionId: mission.id, reference: mission.reference, title: mission.title },
        dedupeKey: `approval:${mission.id}:${step.position}:${mission.updatedAt.getTime()}`,
      })),
  );
}

/**
 * Applique un événement de cycle de vie hors validation : soumettre,
 * reprendre, démarrer, terminer, annuler (B2.2, B2.8).
 */
export async function applyMissionEvent(
  db: Db,
  ctx: ServiceContext,
  missionId: string,
  event: MissionEvent,
  comment: string | null = null,
): Promise<MissionStatus> {
  authorize(ctx, "read", "mission");
  if (event === "approve" || event === "reject") throw new ServiceError("use_decision");
  if (event === "close") throw new ServiceError("use_reconciliation");
  return tenant(db, ctx, async (tx) => {
    const mission = await loadMission(tx, ctx, missionId);
    if (mission.archivedAt) throw new ServiceError("archived");
    if (ctx.actor.role === "collaborateur" && mission.requesterId !== ctx.actor.userId) {
      throw new ServiceError("DROIT_INSUFFISANT");
    }
    const draftValid = validateDraft({
      title: mission.title,
      purpose: mission.purpose,
      destinationCode: mission.destinationCode,
      destinationLocationId: mission.destinationLocationId,
      startDate: mission.startDate,
      endDate: mission.endDate,
      transportMode: mission.transportMode as TransportMode | null,
    });
    const to = await recordTransition(tx, ctx, mission, event, comment, {
      draftValid: draftValid.length === 0,
    });
    if (to === "SOUMISE") {
      const approval = await approvalContext(tx, { ...mission, status: to });
      if (approval.state.kind === "pending") {
        await notifyApprovers(tx, ctx, { ...mission, updatedAt: ctx.now }, approval.state.step);
      }
    }
    if (to === "ANNULEE") {
      const team = await tx
        .select({ userId: missionParticipants.userId })
        .from(missionParticipants)
        .where(
          and(eq(missionParticipants.missionId, missionId), isNull(missionParticipants.deletedAt)),
        );
      await enqueue(
        tx,
        ctx,
        [...new Set([mission.requesterId, ...team.map((t) => t.userId ?? "")])]
          .filter(Boolean)
          .map((recipientId) => ({
            recipientId,
            template: "mission_cancelled" as const,
            payload: { missionId, reference: mission.reference, reason: comment ?? "" },
            dedupeKey: `cancel:${missionId}`,
          })),
      );
    }
    return to;
  });
}

/** Modifie une mission (B2.8). Une mission validée modifiée repart en validation. */
export async function updateMission(
  db: Db,
  ctx: ServiceContext,
  missionId: string,
  input: unknown,
): Promise<{ revalidation: boolean }> {
  authorize(ctx, "update", "mission");
  const value = parse(missionInput, input);
  const issues = validateDraft(value);
  if (issues.includes("destination_unknown") || issues.includes("duration_too_long")) {
    throw new ServiceError(issues[0]!);
  }
  return tenant(db, ctx, async (tx) => {
    const mission = await loadMission(tx, ctx, missionId);
    if (!canEditMission(ctx, mission)) throw new ServiceError("not_editable");
    const substantial = mission.status === "VALIDEE" && isSubstantialChange(mission, value);
    await tx
      .update(missions)
      .set({
        title: value.title,
        purpose: value.purpose,
        destinationCode: value.destinationCode,
        destinationLocationId: value.destinationLocationId,
        startDate: value.startDate,
        endDate: value.endDate,
        transportMode: value.transportMode,
        notes: value.notes,
        updatedBy: ctx.actor.userId,
        updatedAt: ctx.now,
      })
      .where(eq(missions.id, missionId));
    if (substantial) {
      await recordTransition(tx, ctx, mission, "revise", "Modification de dates ou destination", {
        draftValid: true,
      });
      const approval = await approvalContext(tx, { ...mission, status: "SOUMISE" });
      if (approval.state.kind === "pending") {
        await notifyApprovers(tx, ctx, { ...mission, updatedAt: ctx.now }, approval.state.step);
      }
    }
    return { revalidation: substantial };
  });
}

/**
 * Décision de validation (B2.5, B2.6) : enregistre la décision de l'étape en
 * cours ; la dernière approbation valide la mission, un rejet la rejette.
 */
export async function decideMission(
  db: Db,
  ctx: ServiceContext,
  input: unknown,
): Promise<MissionStatus> {
  authorize(ctx, "approve", "mission");
  const value = parse(approvalDecisionInput, input);
  return tenant(db, ctx, async (tx) => {
    const mission = await loadMission(tx, ctx, value.missionId);
    if (mission.status !== "SOUMISE") throw new ServiceError("not_pending");
    const approval = await approvalContext(tx, mission);
    const error = checkDecision(approval.state, ctx.actor, mission.requesterId, approval.records);
    if (error) throw new ServiceError(error);
    if (approval.state.kind !== "pending") throw new ServiceError("not_pending");
    if (value.decision === "rejected" && !value.comment) {
      throw new ServiceError("MOTIF_OBLIGATOIRE");
    }
    const step = approval.state.step;
    await tx.insert(approvals).values({
      organisationId: ctx.organisationId,
      createdBy: ctx.actor.userId,
      missionId: mission.id,
      cycle: approval.cycle,
      position: step.position,
      approverRole: step.role,
      decision: value.decision,
      comment: value.comment,
    });
    const records = [
      ...approval.records,
      { position: step.position, decision: value.decision, decidedBy: ctx.actor.userId },
    ];
    const next = approvalState(approval.steps, records);
    const payload = { missionId: mission.id, reference: mission.reference, title: mission.title };
    if (next.kind === "rejected") {
      await recordTransition(tx, ctx, mission, "reject", value.comment, {});
      await enqueue(tx, ctx, [
        {
          recipientId: mission.requesterId,
          template: "mission_rejected",
          payload: { ...payload, reason: value.comment ?? "" },
          dedupeKey: `rejected:${mission.id}:${approval.cycle}`,
        },
      ]);
      return "REJETEE";
    }
    if (next.kind === "approved") {
      await recordTransition(tx, ctx, mission, "approve", value.comment, {
        approvalComplete: true,
      });
      await enqueue(tx, ctx, [
        {
          recipientId: mission.requesterId,
          template: "mission_approved",
          payload,
          dedupeKey: `approved:${mission.id}:${approval.cycle}`,
        },
      ]);
      return "VALIDEE";
    }
    await notifyApprovers(tx, ctx, mission, next.step);
    return "SOUMISE";
  });
}

export interface QueueItem extends MissionSummary {
  stepPosition: number;
  stepRole: string;
  budgetBaseMinor: bigint;
  submittedAt: Date | null;
}

/** File de validation de l'acteur courant (B2.6). */
export async function approvalQueue(db: Db, ctx: ServiceContext): Promise<QueueItem[]> {
  if (ctx.actor.role === "collaborateur") return [];
  authorize(ctx, "approve", "mission");
  return tenant(db, ctx, async (tx) => {
    const rows = await tx
      .select()
      .from(missions)
      .where(
        and(
          eq(missions.status, "SOUMISE"),
          isNull(missions.deletedAt),
          isNull(missions.archivedAt),
        ),
      )
      .orderBy(asc(missions.submittedAt));
    const items: QueueItem[] = [];
    for (const mission of rows) {
      const approval = await approvalContext(tx, mission);
      if (checkDecision(approval.state, ctx.actor, mission.requesterId, approval.records)) {
        continue;
      }
      if (approval.state.kind !== "pending") continue;
      const [summary] = await summarize(tx, [mission]);
      items.push({
        ...summary!,
        stepPosition: approval.state.step.position,
        stepRole: approval.state.step.role,
        budgetBaseMinor: approval.budget,
        submittedAt: mission.submittedAt,
      });
    }
    return items;
  });
}

// ---------------------------------------------------------- Participants

export async function addParticipant(db: Db, ctx: ServiceContext, input: unknown): Promise<void> {
  authorize(ctx, "update", "mission");
  const value = parse(participantInput, input);
  await tenant(db, ctx, async (tx) => {
    const mission = await loadMission(tx, ctx, value.missionId);
    if (!canEditMission(ctx, mission)) throw new ServiceError("not_editable");
    if (value.userId) {
      const members = await listMembers(tx, ctx.organisationId);
      if (!members.some((m) => m.userId === value.userId)) throw new ServiceError("not_member");
    }
    const existing = await tx
      .select()
      .from(missionParticipants)
      .where(
        and(
          eq(missionParticipants.missionId, value.missionId),
          isNull(missionParticipants.deletedAt),
        ),
      );
    const issues = validateParticipants([
      ...existing.map((p) => ({
        userId: p.userId,
        externalName: p.externalName,
        role: p.role as ParticipantRole,
      })),
      { userId: value.userId, externalName: value.externalName, role: value.role },
    ]);
    if (issues.length > 0) throw new ServiceError(issues[0]!);
    await tx.insert(missionParticipants).values({
      organisationId: ctx.organisationId,
      createdBy: ctx.actor.userId,
      missionId: value.missionId,
      userId: value.userId,
      externalName: value.userId ? null : value.externalName,
      role: value.role,
    });
  });
}

export async function removeParticipant(
  db: Db,
  ctx: ServiceContext,
  participantId: string,
): Promise<void> {
  authorize(ctx, "update", "mission");
  await tenant(db, ctx, async (tx) => {
    const rows = await tx
      .select()
      .from(missionParticipants)
      .where(and(eq(missionParticipants.id, participantId), isNull(missionParticipants.deletedAt)))
      .limit(1);
    const participant = first(rows);
    const mission = await loadMission(tx, ctx, participant.missionId);
    if (!canEditMission(ctx, mission)) throw new ServiceError("not_editable");
    if (participant.userId === mission.requesterId) throw new ServiceError("requester_required");
    await tx
      .update(missionParticipants)
      .set({ deletedAt: ctx.now, updatedBy: ctx.actor.userId, updatedAt: ctx.now })
      .where(eq(missionParticipants.id, participantId));
  });
}

/**
 * Participants déjà engagés sur une autre mission active à la même période
 * (alerte de planification, B2.7).
 */
export async function overlappingMissions(
  db: Db,
  ctx: ServiceContext,
  missionId: string,
): Promise<{ userId: string; reference: string }[]> {
  return tenant(db, ctx, async (tx) => {
    const mission = await loadMission(tx, ctx, missionId);
    const team = await tx
      .select({ userId: missionParticipants.userId })
      .from(missionParticipants)
      .where(
        and(eq(missionParticipants.missionId, missionId), isNull(missionParticipants.deletedAt)),
      );
    const userIds = team.map((t) => t.userId).filter((u): u is string => Boolean(u));
    if (userIds.length === 0) return [];
    const rows = await tx
      .select({ userId: missionParticipants.userId, reference: missions.reference })
      .from(missionParticipants)
      .innerJoin(missions, eq(missionParticipants.missionId, missions.id))
      .where(
        and(
          inArray(missionParticipants.userId, userIds),
          isNull(missionParticipants.deletedAt),
          sql`${missions.id} <> ${missionId}`,
          inArray(missions.status, ["SOUMISE", "VALIDEE", "EN_COURS"]),
          lte(missions.startDate, mission.endDate),
          gte(missions.endDate, mission.startDate),
        ),
      );
    return rows.map((r) => ({ userId: r.userId ?? "", reference: r.reference }));
  });
}

// ------------------------------------------------------- Circuit (B2.5)

export async function getApprovalFlow(db: Db, ctx: ServiceContext): Promise<ApprovalStep[]> {
  authorize(ctx, "read", "approvalFlow");
  return tenant(db, ctx, (tx) => loadFlow(tx));
}

/** Remplace le circuit de l'organisation (seuils saisis en unités majeures). */
export async function saveApprovalFlow(
  db: Db,
  ctx: ServiceContext,
  steps: { role: string; minBudget: string | null }[],
): Promise<void> {
  authorize(ctx, "update", "approvalFlow");
  if (steps.length === 0 || steps.length > 6) throw new ServiceError("empty");
  await tenant(db, ctx, async (tx) => {
    const org = await getOrganisation(tx, ctx.organisationId);
    const decimals = org.baseCurrency === "GNF" ? 0 : 2;
    const parsed = steps.map((s, i) => {
      if (!isRole(s.role)) throw new ServiceError("invalid_role");
      const threshold = s.minBudget?.replace(/[\s  ]/g, "");
      if (threshold && !/^\d+$/.test(threshold)) throw new ServiceError("invalid_amount");
      return {
        position: i + 1,
        role: s.role,
        minBudgetMinor: threshold ? BigInt(threshold) * 10n ** BigInt(decimals) : null,
      };
    });
    await tx
      .update(approvalSteps)
      .set({ deletedAt: ctx.now, updatedBy: ctx.actor.userId, updatedAt: ctx.now })
      .where(isNull(approvalSteps.deletedAt));
    await tx.insert(approvalSteps).values(
      parsed.map((s) => ({
        organisationId: ctx.organisationId,
        createdBy: ctx.actor.userId,
        position: s.position,
        approverRole: s.role,
        minBudgetMinor: s.minBudgetMinor,
      })),
    );
  });
}

// ---------------------------------------------------------- Calendrier

export interface CalendarDay {
  date: string;
  missions: MissionSummary[];
}

/** Grille d'un mois (B2.7) : pour chaque jour, les missions actives. */
export async function missionCalendar(
  db: Db,
  ctx: ServiceContext,
  month: string,
): Promise<CalendarDay[]> {
  const [year, m] = month.split("-").map(Number) as [number, number];
  const first = `${month}-01`;
  const lastDay = new Date(Date.UTC(year, m, 0)).getUTCDate();
  const last = `${month}-${String(lastDay).padStart(2, "0")}`;
  const list = (await listMissions(db, ctx, { from: first, to: last })).filter(
    (mission) => mission.status !== "ANNULEE" && mission.status !== "REJETEE",
  );
  const days: CalendarDay[] = [];
  for (let d = 1; d <= lastDay; d += 1) {
    const date = `${month}-${String(d).padStart(2, "0")}`;
    days.push({
      date,
      missions: list.filter((mission) => mission.startDate <= date && mission.endDate >= date),
    });
  }
  return days;
}

/** Missions où l'acteur est demandeur ou participant, en cours ou à venir (terrain). */
export async function myFieldMissions(db: Db, ctx: ServiceContext): Promise<MissionSummary[]> {
  return tenant(db, ctx, async (tx) => {
    const participations = await tx
      .select({ missionId: missionParticipants.missionId })
      .from(missionParticipants)
      .where(
        and(
          eq(missionParticipants.userId, ctx.actor.userId),
          isNull(missionParticipants.deletedAt),
        ),
      );
    const ids = participations.map((p) => p.missionId);
    const rows = await tx
      .select()
      .from(missions)
      .where(
        and(
          isNull(missions.deletedAt),
          isNull(missions.archivedAt),
          inArray(missions.status, ["VALIDEE", "EN_COURS", "TERMINEE"]),
          ids.length > 0
            ? or(eq(missions.requesterId, ctx.actor.userId), inArray(missions.id, ids))
            : eq(missions.requesterId, ctx.actor.userId),
        ),
      )
      .orderBy(asc(missions.startDate));
    return summarize(tx, rows);
  });
}
