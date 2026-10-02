import {
  missionEventInput,
  missionReportInput,
  syncBatch,
  type SyncResultItem,
} from "@missionops/contracts";
import {
  missionEvents,
  missionParticipants,
  missionReports,
  missions,
  type Db,
} from "@missionops/db";
import { and, asc, eq, isNull } from "drizzle-orm";

import { ServiceError, authorize, first, parse, tenant, type ServiceContext } from "./context";
import { createExpense } from "./finance";

/**
 * Terrain : événements de mission (B4.6), synchronisation hors ligne (B4.3) et
 * rapport de mission (B5.6).
 */

async function assertTeamMember(tx: Db, ctx: ServiceContext, missionId: string) {
  const rows = await tx
    .select()
    .from(missions)
    .where(and(eq(missions.id, missionId), isNull(missions.deletedAt)))
    .limit(1);
  const mission = first(rows);
  if (ctx.actor.role !== "collaborateur" || mission.requesterId === ctx.actor.userId) {
    return mission;
  }
  const team = await tx
    .select({ id: missionParticipants.id })
    .from(missionParticipants)
    .where(
      and(
        eq(missionParticipants.missionId, missionId),
        eq(missionParticipants.userId, ctx.actor.userId),
        isNull(missionParticipants.deletedAt),
      ),
    )
    .limit(1);
  if (team.length === 0) throw new ServiceError("not_found");
  return mission;
}

export type EventKind = "depart" | "arrivee" | "checkin" | "incident" | "retour";

export interface MissionEventView {
  id: string;
  kind: EventKind;
  note: string | null;
  occurredAt: Date;
  latitude: number | null;
  longitude: number | null;
  createdBy: string;
  createdOffline: boolean;
}

/** Enregistre un événement terrain. Idempotent sur l'UUID client. */
export async function recordMissionEvent(
  db: Db,
  ctx: ServiceContext,
  input: unknown,
  options: { offline?: boolean } = {},
): Promise<{ status: "created" | "duplicate"; id: string }> {
  authorize(ctx, "create", "missionEvent");
  const value = parse(missionEventInput, input);
  return tenant(db, ctx, async (tx) => {
    const existing = await tx
      .select({ id: missionEvents.id })
      .from(missionEvents)
      .where(eq(missionEvents.id, value.id))
      .limit(1);
    if (existing[0]) return { status: "duplicate" as const, id: value.id };
    const mission = await assertTeamMember(tx, ctx, value.missionId);
    if (!["VALIDEE", "EN_COURS", "TERMINEE"].includes(mission.status)) {
      throw new ServiceError("mission_status");
    }
    await tx.insert(missionEvents).values({
      id: value.id,
      organisationId: ctx.organisationId,
      createdBy: ctx.actor.userId,
      missionId: value.missionId,
      kind: value.kind,
      note: value.note,
      occurredAt: new Date(value.occurredAt),
      latitudeE6: value.latitude != null ? Math.round(value.latitude * 1e6) : null,
      longitudeE6: value.longitude != null ? Math.round(value.longitude * 1e6) : null,
      createdOffline: options.offline ?? false,
    });
    return { status: "created" as const, id: value.id };
  });
}

export async function listMissionEvents(
  db: Db,
  ctx: ServiceContext,
  missionId: string,
): Promise<MissionEventView[]> {
  authorize(ctx, "read", "missionEvent");
  return tenant(db, ctx, async (tx) => {
    await assertTeamMember(tx, ctx, missionId);
    const rows = await tx
      .select()
      .from(missionEvents)
      .where(and(eq(missionEvents.missionId, missionId), isNull(missionEvents.deletedAt)))
      .orderBy(asc(missionEvents.occurredAt));
    return rows.map((r) => ({
      id: r.id,
      kind: r.kind as EventKind,
      note: r.note,
      occurredAt: r.occurredAt,
      latitude: r.latitudeE6 != null ? r.latitudeE6 / 1e6 : null,
      longitude: r.longitudeE6 != null ? r.longitudeE6 / 1e6 : null,
      createdBy: r.createdBy,
      createdOffline: r.createdOffline,
    }));
  });
}

/**
 * Traite un lot de synchronisation (ADR-003). Chaque élément est indépendant :
 * un refus n'empêche pas les suivants ; un doublon est un succès (idempotence).
 */
export async function processSyncBatch(
  db: Db,
  ctx: ServiceContext,
  input: unknown,
): Promise<SyncResultItem[]> {
  const batch = parse(syncBatch, input);
  const results: SyncResultItem[] = [];
  for (const item of batch.items) {
    const id = item.payload.id;
    try {
      const outcome =
        item.type === "expense"
          ? await createExpense(db, ctx, item.payload, { offline: true })
          : await recordMissionEvent(db, ctx, item.payload, { offline: true });
      results.push({ id, status: outcome.status });
    } catch (error) {
      results.push({
        id,
        status: "rejected",
        code: error instanceof ServiceError ? error.code : "server_error",
      });
    }
  }
  return results;
}

// ---------------------------------------------------- Rapport (B5.6)

export interface MissionReportView {
  summary: string;
  results: string | null;
  difficulties: string | null;
  recommendations: string | null;
  submittedAt: Date | null;
  updatedAt: Date;
}

export async function getMissionReport(
  db: Db,
  ctx: ServiceContext,
  missionId: string,
): Promise<MissionReportView | null> {
  authorize(ctx, "read", "mission");
  return tenant(db, ctx, async (tx) => {
    await assertTeamMember(tx, ctx, missionId);
    const rows = await tx
      .select()
      .from(missionReports)
      .where(and(eq(missionReports.missionId, missionId), isNull(missionReports.deletedAt)))
      .limit(1);
    const r = rows[0];
    return r
      ? {
          summary: r.summary,
          results: r.results,
          difficulties: r.difficulties,
          recommendations: r.recommendations,
          submittedAt: r.submittedAt,
          updatedAt: r.updatedAt,
        }
      : null;
  });
}

/** Rédige ou met à jour le rapport de mission (après le retour). */
export async function saveMissionReport(
  db: Db,
  ctx: ServiceContext,
  input: unknown,
  submit = false,
): Promise<void> {
  authorize(ctx, "read", "mission");
  const value = parse(missionReportInput, input);
  await tenant(db, ctx, async (tx) => {
    const mission = await assertTeamMember(tx, ctx, value.missionId);
    if (!["EN_COURS", "TERMINEE"].includes(mission.status)) {
      throw new ServiceError("mission_status");
    }
    const existing = await tx
      .select()
      .from(missionReports)
      .where(and(eq(missionReports.missionId, value.missionId), isNull(missionReports.deletedAt)))
      .limit(1);
    if (existing[0]?.submittedAt) throw new ServiceError("report_submitted");
    const values = {
      summary: value.summary,
      results: value.results,
      difficulties: value.difficulties,
      recommendations: value.recommendations,
      submittedAt: submit ? ctx.now : null,
    };
    if (existing[0]) {
      await tx
        .update(missionReports)
        .set({ ...values, updatedAt: ctx.now, updatedBy: ctx.actor.userId })
        .where(eq(missionReports.id, existing[0].id));
    } else {
      await tx.insert(missionReports).values({
        ...values,
        organisationId: ctx.organisationId,
        createdBy: ctx.actor.userId,
        missionId: value.missionId,
      });
    }
  });
}
