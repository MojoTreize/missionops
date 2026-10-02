/**
 * Logique pure de la synchronisation hors ligne (B4.3, ADR-003) et de la
 * compression des photos (ADR-007). Sans I/O : la couche navigateur
 * (IndexedDB, fetch, canvas) applique ces décisions.
 */

export type OutboxStatus = "pending" | "syncing" | "synced" | "rejected";

export interface OutboxEntry {
  id: string;
  status: OutboxStatus;
  attempts: number;
  /** Instant (ms) de la dernière tentative, ou `null`. */
  lastAttemptAt: number | null;
}

/** Délai avant nouvelle tentative : 5 s, 10 s, 20 s… plafonné à 10 min. */
export function retryDelayMs(attempts: number): number {
  if (attempts <= 0) return 0;
  return Math.min(5_000 * 2 ** (attempts - 1), 600_000);
}

/** Éléments prêts à partir à l'instant `now`, dans l'ordre de création. */
export function dueEntries<T extends OutboxEntry>(entries: readonly T[], now: number): T[] {
  return entries.filter(
    (e) =>
      e.status === "pending" &&
      (e.lastAttemptAt === null || now - e.lastAttemptAt >= retryDelayMs(e.attempts)),
  );
}

/** Découpe en lots de taille maximale `size` (le serveur accepte 50). */
export function batches<T>(items: readonly T[], size = 20): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < items.length; i += size) result.push(items.slice(i, i + size));
  return result;
}

export type ServerOutcome = "created" | "duplicate" | "rejected";

/**
 * Statut local après réponse du serveur : un doublon est un succès (l'élément
 * existe déjà côté serveur — idempotence) ; un refus est définitif et doit être
 * montré à l'utilisateur ; une absence de réponse laisse l'élément en attente.
 */
export function outcomeToStatus(outcome: ServerOutcome | undefined): OutboxStatus {
  if (outcome === "created" || outcome === "duplicate") return "synced";
  if (outcome === "rejected") return "rejected";
  return "pending";
}

export interface SyncSummary {
  pending: number;
  rejected: number;
  synced: number;
}

export function summarize(entries: readonly { status: OutboxStatus }[]): SyncSummary {
  return {
    pending: entries.filter((e) => e.status === "pending" || e.status === "syncing").length,
    rejected: entries.filter((e) => e.status === "rejected").length,
    synced: entries.filter((e) => e.status === "synced").length,
  };
}

// ----------------------------------------------------- Photos (ADR-007)

/** Grand côté maximal d'un justificatif, en pixels. */
export const PHOTO_MAX_EDGE = 1600;
/** Qualité JPEG cible. */
export const PHOTO_QUALITY = 0.75;

/** Dimensions cibles en conservant le ratio ; jamais d'agrandissement. */
export function targetSize(
  width: number,
  height: number,
  maxEdge = PHOTO_MAX_EDGE,
): { width: number; height: number } {
  const longest = Math.max(width, height);
  if (longest <= maxEdge) return { width, height };
  const ratio = maxEdge / longest;
  return { width: Math.round(width * ratio), height: Math.round(height * ratio) };
}

export type NetworkState = "online" | "offline" | "syncing" | "error";

/** État affiché par l'indicateur réseau (B4.7). */
export function networkState(input: {
  online: boolean;
  syncing: boolean;
  summary: SyncSummary;
}): NetworkState {
  if (!input.online) return "offline";
  if (input.syncing) return "syncing";
  if (input.summary.rejected > 0) return "error";
  return "online";
}
