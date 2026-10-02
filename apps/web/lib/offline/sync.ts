"use client";

import { batches, dueEntries, outcomeToStatus, type ServerOutcome } from "@missionops/core";

import { fieldDb, type BootstrapRecord } from "./db";

/**
 * Moteur de synchronisation (B4.3). Envoie la file locale par lots, puis les
 * photos dont la dépense est arrivée côté serveur. Chaque élément porte un UUID
 * client : un renvoi après coupure est sans effet (idempotence, ADR-003).
 */

let running: Promise<void> | null = null;
const listeners = new Set<() => void>();

export function onSyncChange(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notify() {
  for (const listener of listeners) listener();
}

export function isSyncing(): boolean {
  return running !== null;
}

async function pushOutbox(organisationId: string) {
  const db = fieldDb();
  const all = await db.outbox.where("organisationId").equals(organisationId).toArray();
  const due = dueEntries(all, Date.now()).sort((a, b) => a.createdAt - b.createdAt);
  for (const batch of batches(due, 20)) {
    const now = Date.now();
    await db.outbox.bulkUpdate(
      batch.map((e) => ({
        key: e.id,
        changes: { status: "syncing" as const, lastAttemptAt: now },
      })),
    );
    notify();
    let response: Response;
    try {
      response = await fetch("/api/sync", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ items: batch.map((e) => ({ type: e.type, payload: e.payload })) }),
      });
    } catch {
      // Réseau coupé : tout le lot repart en attente, avec délai croissant.
      await db.outbox.bulkUpdate(
        batch.map((e) => ({
          key: e.id,
          changes: { status: "pending" as const, attempts: e.attempts + 1 },
        })),
      );
      throw new Error("offline");
    }
    if (response.status === 400 || response.status === 422) {
      // Lot refusé en bloc (format invalide) : retenter n'y changerait rien.
      await db.outbox.bulkUpdate(
        batch.map((e) => ({
          key: e.id,
          changes: {
            status: "rejected" as const,
            attempts: e.attempts + 1,
            error: "invalid_input",
          },
        })),
      );
      continue;
    }
    if (!response.ok) {
      await db.outbox.bulkUpdate(
        batch.map((e) => ({
          key: e.id,
          changes: {
            status: "pending" as const,
            attempts: e.attempts + 1,
            error: `http_${response.status}`,
          },
        })),
      );
      if (response.status === 401) throw new Error("unauthorized");
      continue;
    }
    const { results } = (await response.json()) as {
      results: { id: string; status: ServerOutcome; code?: string }[];
    };
    const byId = new Map(results.map((r) => [r.id, r]));
    await db.outbox.bulkUpdate(
      batch.map((e) => {
        const result = byId.get(e.id);
        return {
          key: e.id,
          changes: {
            status: outcomeToStatus(result?.status),
            attempts: e.attempts + 1,
            error: result?.status === "rejected" ? (result.code ?? "rejected") : null,
          },
        };
      }),
    );
    notify();
  }
}

async function pushPhotos(organisationId: string) {
  const db = fieldDb();
  const synced = new Set(
    (await db.outbox.where("status").equals("synced").toArray())
      .filter((e) => e.type === "expense")
      .map((e) => e.id),
  );
  const photos = (await db.photos.where("organisationId").equals(organisationId).toArray()).filter(
    (p) => synced.has(p.expenseId),
  );
  for (const photo of dueEntries(photos, Date.now())) {
    await db.photos.update(photo.id, { status: "syncing", lastAttemptAt: Date.now() });
    notify();
    const form = new FormData();
    form.set(
      "meta",
      JSON.stringify({
        id: photo.id,
        expenseId: photo.expenseId,
        mimeType: photo.mimeType,
        sizeBytes: photo.sizeBytes,
        sha256: photo.sha256,
        width: photo.width,
        height: photo.height,
      }),
    );
    form.set("file", photo.blob, `${photo.id}.jpg`);
    try {
      const response = await fetch("/api/receipts", {
        method: "POST",
        body: form,
        credentials: "same-origin",
      });
      if (response.ok) {
        await db.photos.update(photo.id, {
          status: "synced",
          attempts: photo.attempts + 1,
          error: null,
        });
      } else {
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        const permanent =
          response.status === 422 || response.status === 413 || response.status === 404;
        await db.photos.update(photo.id, {
          status: permanent ? "rejected" : "pending",
          attempts: photo.attempts + 1,
          error: body.error ?? `http_${response.status}`,
        });
      }
    } catch {
      await db.photos.update(photo.id, { status: "pending", attempts: photo.attempts + 1 });
      throw new Error("offline");
    }
    notify();
  }
}

/** Purge locale des éléments synchronisés depuis plus de 7 jours. */
async function prune() {
  const db = fieldDb();
  const limit = Date.now() - 7 * 86_400_000;
  await db.outbox
    .where("status")
    .equals("synced")
    .and((e) => e.createdAt < limit)
    .delete();
  await db.photos
    .where("status")
    .equals("synced")
    .and((p) => p.createdAt < limit)
    .delete();
}

export async function refreshBootstrap(): Promise<BootstrapRecord | null> {
  try {
    const response = await fetch("/api/terrain", { credentials: "same-origin" });
    if (!response.ok) return null;
    const data = (await response.json()) as Omit<BootstrapRecord, "key">;
    const record: BootstrapRecord = { key: "terrain", ...data };
    await fieldDb().bootstrap.put(record);
    return record;
  } catch {
    return null;
  }
}

/** Lance une synchronisation (une seule à la fois). */
export function syncNow(organisationId: string): Promise<void> {
  if (running) return running;
  running = (async () => {
    try {
      await pushOutbox(organisationId);
      await pushPhotos(organisationId);
      await prune();
    } catch {
      // Hors ligne ou session expirée : on réessaiera au prochain déclencheur.
    } finally {
      running = null;
      notify();
    }
  })();
  notify();
  return running;
}

/** Remet en file un élément refusé (après correction côté serveur). */
export async function retryRejected(id: string) {
  await fieldDb().outbox.update(id, {
    status: "pending",
    attempts: 0,
    lastAttemptAt: null,
    error: null,
  });
  notify();
}

export async function discard(id: string) {
  await fieldDb().outbox.delete(id);
  await fieldDb().photos.where("expenseId").equals(id).delete();
  notify();
}
