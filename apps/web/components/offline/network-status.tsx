"use client";

import { CloudOff, RefreshCw, TriangleAlert, Wifi } from "lucide-react";

import type { NetworkState, SyncSummary } from "@missionops/core";

import { useT } from "@/lib/i18n/client";

/** Indicateur d'état du réseau et de la synchronisation (B4.7). */
export function NetworkStatus({
  state,
  summary,
  onSync,
}: {
  state: NetworkState;
  summary: SyncSummary;
  onSync?: () => void;
}) {
  const t = useT();
  const styles: Record<NetworkState, string> = {
    online: "bg-success-soft text-success",
    offline: "bg-warning-soft text-warning",
    syncing: "bg-field-soft text-field",
    error: "bg-danger-soft text-danger",
  };
  const Icon = { online: Wifi, offline: CloudOff, syncing: RefreshCw, error: TriangleAlert }[state];
  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex items-center justify-between gap-2 rounded-md px-3 py-2 text-sm ${styles[state]}`}
    >
      <span className="flex items-center gap-2">
        <Icon className={`size-4 ${state === "syncing" ? "animate-spin" : ""}`} aria-hidden />
        {t(`terrain.network.${state}`)}
        {summary.pending > 0 ? (
          <span className="font-medium">· {t("terrain.pending", { count: summary.pending })}</span>
        ) : null}
      </span>
      {onSync && state !== "offline" && state !== "syncing" && summary.pending > 0 ? (
        <button type="button" onClick={onSync} className="font-medium underline">
          {t("terrain.syncNow")}
        </button>
      ) : null}
    </div>
  );
}
