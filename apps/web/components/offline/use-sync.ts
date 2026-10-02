"use client";

import { useCallback, useEffect, useState } from "react";

import { networkState, summarize, type NetworkState, type SyncSummary } from "@missionops/core";

import { fieldDb, type OutboxRecord, type PhotoRecord } from "@/lib/offline/db";
import { isSyncing, onSyncChange, syncNow } from "@/lib/offline/sync";

/**
 * État de la synchronisation pour l'interface (B4.7) : réseau, file locale,
 * déclencheurs automatiques (retour du réseau, toutes les 30 s, au focus).
 */
export function useSync(organisationId: string | null) {
  const [online, setOnline] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [outbox, setOutbox] = useState<OutboxRecord[]>([]);
  const [photos, setPhotos] = useState<PhotoRecord[]>([]);

  const reload = useCallback(async () => {
    if (!organisationId) return;
    const db = fieldDb();
    setOutbox(
      await db.outbox.where("organisationId").equals(organisationId).reverse().sortBy("createdAt"),
    );
    setPhotos(await db.photos.where("organisationId").equals(organisationId).toArray());
    setSyncing(isSyncing());
  }, [organisationId]);

  const trigger = useCallback(() => {
    if (organisationId && navigator.onLine) void syncNow(organisationId);
  }, [organisationId]);

  useEffect(() => {
    setOnline(navigator.onLine);
    const goOnline = () => {
      setOnline(true);
      trigger();
    };
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    window.addEventListener("focus", trigger);
    const unsubscribe = onSyncChange(() => void reload());
    const timer = window.setInterval(trigger, 30_000);
    void reload();
    trigger();
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("focus", trigger);
      unsubscribe();
      window.clearInterval(timer);
    };
  }, [reload, trigger]);

  const summary: SyncSummary = summarize([...outbox, ...photos]);
  const state: NetworkState = networkState({ online, syncing, summary });
  return { online, syncing, outbox, photos, summary, state, reload, trigger };
}
