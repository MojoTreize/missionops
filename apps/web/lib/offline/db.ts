"use client";

import Dexie, { type EntityTable } from "dexie";

import type { OutboxStatus } from "@missionops/core";

/**
 * Persistance locale du terrain (B4.2) : IndexedDB via Dexie. Jamais
 * `localStorage` pour des données métier (CLAUDE.md). Trois magasins :
 *  - `bootstrap` : dernières données utiles au terrain (missions, catégories) ;
 *  - `outbox` : créations en attente d'envoi (dépenses, événements) ;
 *  - `photos` : justificatifs compressés en attente d'envoi.
 */

export interface BootstrapMission {
  id: string;
  reference: string;
  title: string;
  status: string;
  destination: string;
  startDate: string;
  endDate: string;
}

export interface BootstrapRecord {
  key: "terrain";
  fetchedAt: string;
  userId: string;
  organisationId: string;
  baseCurrency: string;
  categories: string[];
  missions: BootstrapMission[];
}

export interface OutboxRecord {
  id: string;
  type: "expense" | "missionEvent";
  payload: Record<string, unknown>;
  /** Résumé lisible pour la liste locale. */
  label: string;
  organisationId: string;
  status: OutboxStatus;
  attempts: number;
  lastAttemptAt: number | null;
  error: string | null;
  createdAt: number;
}

export interface PhotoRecord {
  id: string;
  expenseId: string;
  organisationId: string;
  blob: Blob;
  mimeType: string;
  sizeBytes: number;
  sha256: string;
  width: number;
  height: number;
  status: OutboxStatus;
  attempts: number;
  lastAttemptAt: number | null;
  error: string | null;
  createdAt: number;
}

class FieldDatabase extends Dexie {
  bootstrap!: EntityTable<BootstrapRecord, "key">;
  outbox!: EntityTable<OutboxRecord, "id">;
  photos!: EntityTable<PhotoRecord, "id">;

  constructor() {
    super("missionops-terrain");
    this.version(1).stores({
      bootstrap: "key",
      outbox: "id, status, createdAt, organisationId",
      photos: "id, status, expenseId, createdAt, organisationId",
    });
  }
}

let instance: FieldDatabase | undefined;

export function fieldDb(): FieldDatabase {
  instance ??= new FieldDatabase();
  return instance;
}
