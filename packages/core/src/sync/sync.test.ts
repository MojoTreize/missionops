import { describe, expect, it } from "vitest";

import {
  batches,
  dueEntries,
  networkState,
  outcomeToStatus,
  retryDelayMs,
  summarize,
  targetSize,
} from "./index";

describe("file de synchronisation", () => {
  it("espace les tentatives de façon exponentielle et plafonnée", () => {
    expect(retryDelayMs(0)).toBe(0);
    expect(retryDelayMs(1)).toBe(5_000);
    expect(retryDelayMs(3)).toBe(20_000);
    expect(retryDelayMs(20)).toBe(600_000);
  });

  it("ne renvoie que les éléments en attente dont le délai est écoulé", () => {
    const now = 100_000;
    const entries = [
      { id: "a", status: "pending" as const, attempts: 0, lastAttemptAt: null },
      { id: "b", status: "pending" as const, attempts: 1, lastAttemptAt: now - 1_000 },
      { id: "c", status: "pending" as const, attempts: 1, lastAttemptAt: now - 6_000 },
      { id: "d", status: "synced" as const, attempts: 1, lastAttemptAt: null },
      { id: "e", status: "rejected" as const, attempts: 1, lastAttemptAt: null },
    ];
    expect(dueEntries(entries, now).map((e) => e.id)).toEqual(["a", "c"]);
  });

  it("découpe en lots", () => {
    expect(batches([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    expect(batches([], 2)).toEqual([]);
  });

  it("traite un doublon comme un succès (idempotence)", () => {
    expect(outcomeToStatus("created")).toBe("synced");
    expect(outcomeToStatus("duplicate")).toBe("synced");
    expect(outcomeToStatus("rejected")).toBe("rejected");
    expect(outcomeToStatus(undefined)).toBe("pending");
  });

  it("résume et déduit l'état réseau", () => {
    const summary = summarize([
      { status: "pending" },
      { status: "syncing" },
      { status: "synced" },
      { status: "rejected" },
    ]);
    expect(summary).toEqual({ pending: 2, rejected: 1, synced: 1 });
    expect(networkState({ online: false, syncing: false, summary })).toBe("offline");
    expect(networkState({ online: true, syncing: true, summary })).toBe("syncing");
    expect(networkState({ online: true, syncing: false, summary })).toBe("error");
    expect(
      networkState({
        online: true,
        syncing: false,
        summary: { pending: 0, rejected: 0, synced: 3 },
      }),
    ).toBe("online");
  });
});

describe("compression des photos", () => {
  it("ramène le grand côté à 1600 px sans agrandir", () => {
    expect(targetSize(4000, 3000)).toEqual({ width: 1600, height: 1200 });
    expect(targetSize(3000, 4000)).toEqual({ width: 1200, height: 1600 });
    expect(targetSize(800, 600)).toEqual({ width: 800, height: 600 });
  });
});
