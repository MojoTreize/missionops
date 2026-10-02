import { isRole, type Role } from "@missionops/core";
import {
  memberships,
  missionParticipants,
  missionReports,
  missions,
  notificationPreferences,
  organisations,
  users,
  type Db,
} from "@missionops/db";
import { and, asc, eq, isNull, lte, sql } from "drizzle-orm";

import { tenant, type ServiceContext } from "./context";
import { approvalQueue } from "./missions";
import {
  dispatchOutbox,
  enqueue,
  type NotificationRequest,
  type OutboxItem,
} from "./notifications";
import { listMembers } from "./organisation";

/**
 * Rappels automatiques (B7.5) et tâche d'envoi (B7.1), exécutés par une tâche
 * planifiée. Chaque organisation est traitée dans son propre contexte isolé,
 * au nom de son premier administrateur (acteur « système » traçable).
 */

/** Contexte système d'une organisation : son administrateur le plus ancien. */
export async function systemContexts(db: Db, now: Date): Promise<ServiceContext[]> {
  const rows = await db
    .select({
      organisationId: memberships.organisationId,
      userId: memberships.userId,
      role: memberships.role,
    })
    .from(memberships)
    .innerJoin(organisations, eq(memberships.organisationId, organisations.id))
    .where(
      and(
        eq(memberships.role, "admin"),
        isNull(memberships.deletedAt),
        isNull(organisations.deletedAt),
      ),
    )
    .orderBy(asc(memberships.createdAt));
  const seen = new Set<string>();
  const contexts: ServiceContext[] = [];
  for (const row of rows) {
    if (seen.has(row.organisationId)) continue;
    seen.add(row.organisationId);
    contexts.push({
      organisationId: row.organisationId,
      actor: { userId: row.userId, role: (isRole(row.role) ? row.role : "admin") as Role },
      now,
    });
  }
  return contexts;
}

function isoDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Génère les rappels du jour pour une organisation. Idempotent : chaque rappel
 * porte une clé de déduplication par jour.
 */
export async function generateReminders(db: Db, ctx: ServiceContext): Promise<number> {
  const today = isoDay(ctx.now);
  const yesterday = isoDay(new Date(ctx.now.getTime() - 86_400_000));
  const threeDaysAgo = isoDay(new Date(ctx.now.getTime() - 3 * 86_400_000));
  const requests: NotificationRequest[] = [];

  await tenant(db, ctx, async (tx) => {
    // 1. Fin de mission : penser à saisir ses dépenses (lendemain du retour).
    const ending = await tx
      .select({ id: missions.id, reference: missions.reference, requesterId: missions.requesterId })
      .from(missions)
      .where(
        and(
          eq(missions.status, "EN_COURS"),
          eq(missions.endDate, yesterday),
          isNull(missions.deletedAt),
        ),
      );
    for (const mission of ending) {
      const team = await tx
        .select({ userId: missionParticipants.userId })
        .from(missionParticipants)
        .where(
          and(eq(missionParticipants.missionId, mission.id), isNull(missionParticipants.deletedAt)),
        );
      for (const userId of new Set([mission.requesterId, ...team.map((t) => t.userId ?? "")])) {
        if (!userId) continue;
        requests.push({
          recipientId: userId,
          template: "reminder_expenses",
          payload: { missionId: mission.id, reference: mission.reference },
          dedupeKey: `reminder-expenses:${mission.id}:${today}`,
        });
      }
    }

    // 2. Rapport attendu trois jours après le retour.
    const returned = await tx
      .select({ id: missions.id, reference: missions.reference, requesterId: missions.requesterId })
      .from(missions)
      .leftJoin(
        missionReports,
        and(eq(missionReports.missionId, missions.id), isNull(missionReports.deletedAt)),
      )
      .where(
        and(
          eq(missions.status, "TERMINEE"),
          lte(missions.endDate, threeDaysAgo),
          isNull(missions.deletedAt),
          sql`${missionReports.submittedAt} is null`,
        ),
      );
    for (const mission of returned) {
      requests.push({
        recipientId: mission.requesterId,
        template: "reminder_report",
        payload: { missionId: mission.id, reference: mission.reference },
        dedupeKey: `reminder-report:${mission.id}:${today}`,
      });
    }
  });

  // 3. Validations en attente depuis plus de 48 h, par validateur.
  const approvers = (await listMembers(db, ctx.organisationId)).filter(
    (m) => m.role !== "collaborateur",
  );
  for (const approver of approvers) {
    const queue = await approvalQueue(db, {
      ...ctx,
      actor: { userId: approver.userId, role: approver.role },
    }).catch(() => []);
    const late = queue.filter(
      (q) => q.submittedAt && ctx.now.getTime() - q.submittedAt.getTime() > 48 * 3_600_000,
    );
    if (late.length > 0) {
      requests.push({
        recipientId: approver.userId,
        template: "reminder_approval",
        payload: { count: String(late.length) },
        dedupeKey: `reminder-approval:${today}`,
      });
    }
  }

  await tenant(db, ctx, (tx) => enqueue(tx, ctx, requests));
  return requests.length;
}

export interface Recipient {
  email: string;
  fullName: string | null;
  locale: string;
  phone: string | null;
}

/** Coordonnées du destinataire d'une notification. */
export async function recipientOf(
  db: Db,
  ctx: ServiceContext,
  userId: string,
): Promise<Recipient | null> {
  const rows = await db
    .select({ email: users.email, fullName: users.fullName, locale: users.locale })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  const user = rows[0];
  if (!user) return null;
  const prefs = await tenant(db, ctx, (tx) =>
    tx
      .select({ phone: notificationPreferences.whatsappNumber })
      .from(notificationPreferences)
      .where(
        and(eq(notificationPreferences.userId, userId), isNull(notificationPreferences.deletedAt)),
      )
      .limit(1),
  );
  return { ...user, phone: prefs[0]?.phone ?? null };
}

/** Exécute la tâche planifiée : rappels puis envoi, pour chaque organisation. */
export async function runScheduledJobs(
  db: Db,
  now: Date,
  deliver: (ctx: ServiceContext, item: OutboxItem) => Promise<void>,
): Promise<{ organisations: number; reminders: number; sent: number; failed: number }> {
  const contexts = await systemContexts(db, now);
  let reminders = 0;
  let sent = 0;
  let failed = 0;
  for (const ctx of contexts) {
    reminders += await generateReminders(db, ctx);
    const result = await dispatchOutbox(db, ctx, (item) => deliver(ctx, item));
    sent += result.sent;
    failed += result.failed;
  }
  return { organisations: contexts.length, reminders, sent, failed };
}
