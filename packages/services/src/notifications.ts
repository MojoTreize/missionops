import { notificationPreferences, notifications, type Db } from "@missionops/db";
import { and, desc, eq, inArray, isNull, lte, sql } from "drizzle-orm";

import { authorize, parse, tenant, type ServiceContext } from "./context";
import { notificationPreferencesInput } from "@missionops/contracts";

/**
 * Notifications (B2.9, Phase 7) — boîte d'envoi transactionnelle. Le code
 * métier enfile un message dans la même transaction que l'événement : si la
 * transaction échoue, rien n'est notifié ; si elle réussit, la notification
 * finira par partir (un envoyeur dépile la file, B7.1).
 */
export const NOTIFICATION_TEMPLATES = [
  "mission_submitted",
  "mission_approved",
  "mission_rejected",
  "mission_cancelled",
  "approval_needed",
  "advance_paid",
  "expense_rejected",
  "reconciliation_submitted",
  "reconciliation_validated",
  "reminder_expenses",
  "reminder_approval",
  "reminder_report",
] as const;

export type NotificationTemplate = (typeof NOTIFICATION_TEMPLATES)[number];

export type Channel = "email" | "whatsapp" | "sms" | "in_app";

export interface NotificationRequest {
  recipientId: string;
  template: NotificationTemplate;
  payload: Record<string, string>;
  /** Clé d'idempotence : un même événement ne notifie qu'une fois par canal. */
  dedupeKey?: string;
}

export interface Preferences {
  email: boolean;
  whatsapp: boolean;
  sms: boolean;
  whatsappNumber: string | null;
}

const DEFAULT_PREFERENCES: Preferences = {
  email: true,
  whatsapp: false,
  sms: false,
  whatsappNumber: null,
};

async function preferencesOf(tx: Db, userIds: string[]): Promise<Map<string, Preferences>> {
  if (userIds.length === 0) return new Map();
  const rows = await tx
    .select()
    .from(notificationPreferences)
    .where(
      and(
        inArray(notificationPreferences.userId, userIds),
        isNull(notificationPreferences.deletedAt),
      ),
    );
  return new Map(
    rows.map((r) => [
      r.userId,
      { email: r.email, whatsapp: r.whatsapp, sms: r.sms, whatsappNumber: r.whatsappNumber },
    ]),
  );
}

/**
 * Enfile des notifications dans la transaction courante : une ligne `in_app`
 * (centre de notifications) et une par canal choisi par le destinataire.
 * L'acteur ne se notifie jamais lui-même.
 */
export async function enqueue(
  tx: Db,
  ctx: ServiceContext,
  requests: readonly NotificationRequest[],
): Promise<void> {
  const list = requests.filter((r) => r.recipientId !== ctx.actor.userId);
  if (list.length === 0) return;
  const prefs = await preferencesOf(tx, [...new Set(list.map((r) => r.recipientId))]);
  const rows = list.flatMap((r) => {
    const p = prefs.get(r.recipientId) ?? DEFAULT_PREFERENCES;
    const channels: Channel[] = ["in_app"];
    if (p.email) channels.push("email");
    if (p.whatsapp && p.whatsappNumber) channels.push("whatsapp");
    if (p.sms) channels.push("sms");
    return channels.map((channel) => ({
      organisationId: ctx.organisationId,
      createdBy: ctx.actor.userId,
      recipientId: r.recipientId,
      channel,
      template: r.template,
      payload: r.payload,
      // Le centre de notifications n'est pas « envoyé » : il est lu sur place.
      status: channel === "in_app" ? "envoyee" : "en_attente",
      sentAt: channel === "in_app" ? ctx.now : null,
      dedupeKey: r.dedupeKey ? `${r.dedupeKey}:${r.recipientId}:${channel}` : null,
    }));
  });
  await tx.insert(notifications).values(rows).onConflictDoNothing();
}

export interface InboxItem {
  id: string;
  template: NotificationTemplate;
  payload: Record<string, string>;
  createdAt: Date;
  readAt: Date | null;
}

/** Centre de notifications de l'utilisateur courant. */
export async function inbox(db: Db, ctx: ServiceContext, limit = 30): Promise<InboxItem[]> {
  return tenant(db, ctx, async (tx) => {
    const rows = await tx
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.recipientId, ctx.actor.userId),
          eq(notifications.channel, "in_app"),
          isNull(notifications.deletedAt),
        ),
      )
      .orderBy(desc(notifications.createdAt))
      .limit(limit);
    return rows.map((r) => ({
      id: r.id,
      template: r.template as NotificationTemplate,
      payload: r.payload as Record<string, string>,
      createdAt: r.createdAt,
      readAt: r.readAt,
    }));
  });
}

export async function unreadCount(db: Db, ctx: ServiceContext): Promise<number> {
  return tenant(db, ctx, async (tx) => {
    const rows = await tx
      .select({ n: sql<number>`count(*)::int` })
      .from(notifications)
      .where(
        and(
          eq(notifications.recipientId, ctx.actor.userId),
          eq(notifications.channel, "in_app"),
          isNull(notifications.readAt),
          isNull(notifications.deletedAt),
        ),
      );
    return rows[0]?.n ?? 0;
  });
}

export async function markAllRead(db: Db, ctx: ServiceContext): Promise<void> {
  await tenant(db, ctx, async (tx) => {
    await tx
      .update(notifications)
      .set({ readAt: ctx.now, updatedBy: ctx.actor.userId, updatedAt: ctx.now })
      .where(
        and(
          eq(notifications.recipientId, ctx.actor.userId),
          eq(notifications.channel, "in_app"),
          isNull(notifications.readAt),
        ),
      );
  });
}

export async function getPreferences(db: Db, ctx: ServiceContext): Promise<Preferences> {
  return tenant(db, ctx, async (tx) => {
    const map = await preferencesOf(tx, [ctx.actor.userId]);
    return map.get(ctx.actor.userId) ?? DEFAULT_PREFERENCES;
  });
}

/** Préférences de canaux du membre courant (B7.4). */
export async function savePreferences(
  db: Db,
  ctx: ServiceContext,
  input: unknown,
): Promise<Preferences> {
  authorize(ctx, "read", "organisation");
  const value = parse(notificationPreferencesInput, input);
  return tenant(db, ctx, async (tx) => {
    const existing = await tx
      .select({ id: notificationPreferences.id })
      .from(notificationPreferences)
      .where(
        and(
          eq(notificationPreferences.userId, ctx.actor.userId),
          isNull(notificationPreferences.deletedAt),
        ),
      )
      .limit(1);
    const values = {
      email: value.email,
      whatsapp: value.whatsapp,
      sms: value.sms,
      whatsappNumber: value.whatsappNumber,
    };
    if (existing[0]) {
      await tx
        .update(notificationPreferences)
        .set({ ...values, updatedBy: ctx.actor.userId, updatedAt: ctx.now })
        .where(eq(notificationPreferences.id, existing[0].id));
    } else {
      await tx.insert(notificationPreferences).values({
        ...values,
        organisationId: ctx.organisationId,
        createdBy: ctx.actor.userId,
        userId: ctx.actor.userId,
      });
    }
    return values;
  });
}

export interface OutboxItem {
  id: string;
  organisationId: string;
  recipientId: string;
  channel: Exclude<Channel, "in_app">;
  template: NotificationTemplate;
  payload: Record<string, string>;
  attempts: number;
}

/** Nombre maximal de tentatives d'envoi avant abandon. */
export const MAX_ATTEMPTS = 5;

/**
 * Dépile les notifications en attente d'une organisation (B7.1). L'envoyeur
 * appelle `deliver` pour chacune et enregistre le résultat. Délai exponentiel
 * entre deux tentatives : 2^tentatives minutes.
 */
export async function dispatchOutbox(
  db: Db,
  ctx: ServiceContext,
  deliver: (item: OutboxItem) => Promise<void>,
  limit = 50,
): Promise<{ sent: number; failed: number }> {
  return tenant(db, ctx, async (tx) => {
    const rows = await tx
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.status, "en_attente"),
          isNull(notifications.deletedAt),
          lte(notifications.attempts, MAX_ATTEMPTS - 1),
        ),
      )
      .orderBy(notifications.createdAt)
      .limit(limit);
    let sent = 0;
    let failed = 0;
    for (const row of rows) {
      const backoffMs = row.attempts === 0 ? 0 : 2 ** row.attempts * 60_000;
      if (ctx.now.getTime() - row.updatedAt.getTime() < backoffMs) continue;
      try {
        await deliver({
          id: row.id,
          organisationId: row.organisationId,
          recipientId: row.recipientId,
          channel: row.channel as OutboxItem["channel"],
          template: row.template as NotificationTemplate,
          payload: row.payload as Record<string, string>,
          attempts: row.attempts,
        });
        await tx
          .update(notifications)
          .set({
            status: "envoyee",
            sentAt: ctx.now,
            attempts: row.attempts + 1,
            updatedAt: ctx.now,
          })
          .where(eq(notifications.id, row.id));
        sent += 1;
      } catch (error) {
        const attempts = row.attempts + 1;
        await tx
          .update(notifications)
          .set({
            status: attempts >= MAX_ATTEMPTS ? "echec" : "en_attente",
            attempts,
            lastError: error instanceof Error ? error.message.slice(0, 500) : "erreur",
            updatedAt: ctx.now,
          })
          .where(eq(notifications.id, row.id));
        failed += 1;
      }
    }
    return { sent, failed };
  });
}
