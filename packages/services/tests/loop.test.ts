import { randomUUID, createHash } from "node:crypto";

import { createTestDb, type TestDb } from "@missionops/db/testing";
import type { Role } from "@missionops/core";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  ServiceError,
  addBudgetLine,
  addRate,
  applyMissionEvent,
  approvalQueue,
  attachReceipt,
  createAdvance,
  createExpense,
  createMission,
  decideExpense,
  decideMission,
  getMission,
  getReconciliation,
  inbox,
  listExpenses,
  listMissions,
  processSyncBatch,
  readReceipt,
  recordSettlement,
  submitReconciliation,
  validateReconciliation,
  accountingExport,
  archiveMissions,
  auditLogPage,
  costReport,
  dashboard,
  generateMissionDocument,
  globalSearch,
  organisationExport,
  type BlobStore,
  type ServiceContext,
} from "../src";

/**
 * Boucle argent-justificatif de bout en bout (plan §1) sur une vraie base
 * PostgreSQL (PGlite) sous un rôle non privilégié : RLS et audit actifs.
 */

const ORG = "11111111-1111-4111-8111-111111111111";
const OTHER_ORG = "22222222-2222-4222-8222-222222222222";

const people: Record<string, { id: string; role: Role; org: string }> = {
  agent: { id: "a0000000-0000-4000-8000-000000000001", role: "collaborateur", org: ORG },
  manager: { id: "a0000000-0000-4000-8000-000000000002", role: "manager", org: ORG },
  director: { id: "a0000000-0000-4000-8000-000000000003", role: "directeur_pays", org: ORG },
  finance: { id: "a0000000-0000-4000-8000-000000000004", role: "finance", org: ORG },
  finance2: { id: "a0000000-0000-4000-8000-000000000005", role: "finance", org: ORG },
  outsider: { id: "a0000000-0000-4000-8000-000000000006", role: "admin", org: OTHER_ORG },
};

let t: TestDb;
const now = new Date("2026-10-12T08:00:00Z");

function ctx(who: keyof typeof people, at = now): ServiceContext {
  const p = people[who]!;
  return { organisationId: p.org, actor: { userId: p.id, role: p.role }, now: at };
}

const files = new Map<string, Uint8Array>();
const store: BlobStore = {
  put: async (key, bytes) => {
    files.set(key, bytes);
  },
  get: async (key) => files.get(key) ?? null,
};

beforeAll(async () => {
  t = await createTestDb();
  const values = Object.entries(people)
    .map(([name, p]) => `('${p.id}', '${name}@demo.gn', '${name}')`)
    .join(",");
  const memberships = Object.values(people)
    .map((p) => `('${p.org}', '${p.id}', '${p.role}')`)
    .join(",");
  await t.admin(`
    insert into organisations (id, name, slug) values
      ('${ORG}', 'Croix-Rouge Guinée', 'crg'), ('${OTHER_ORG}', 'Autre ONG', 'autre');
    insert into users (id, email, full_name) values ${values};
    insert into memberships (organisation_id, user_id, role) values ${memberships};
  `);
});

afterAll(async () => {
  await t.close();
});

describe("boucle demande → validation → avance → dépenses → réconciliation → clôture", () => {
  let missionId = "";
  const expenseId = randomUUID();

  it("un collaborateur crée et soumet sa demande", async () => {
    await addRate(t.db, ctx("finance"), {
      fromCurrency: "EUR",
      toCurrency: "GNF",
      rate: "9350",
      effectiveOn: "2026-10-01",
    });
    const created = await createMission(t.db, ctx("agent"), {
      title: "Distribution de kits à Kindia",
      purpose: "Distribution de kits d'hygiène dans trois centres de santé",
      destinationCode: "GN-KD",
      startDate: "2026-10-14",
      endDate: "2026-10-17",
      transportMode: "vehicule_org",
    });
    missionId = created.id;
    expect(created.reference).toBe("MIS-2026-0001");
    await addBudgetLine(t.db, ctx("agent"), {
      missionId,
      category: "hebergement",
      label: "Hôtel 3 nuits",
      quantity: 3,
      unitAmount: "400000",
      currency: "GNF",
    });
    await addBudgetLine(t.db, ctx("agent"), {
      missionId,
      category: "transport",
      label: "Carburant",
      quantity: 1,
      unitAmount: "1000",
      currency: "EUR",
    });
    expect(await applyMissionEvent(t.db, ctx("agent"), missionId, "submit")).toBe("SOUMISE");
  });

  it("le demandeur ne peut pas valider ; le manager voit la mission dans sa file", async () => {
    await expect(
      decideMission(t.db, ctx("agent"), { missionId, decision: "approved" }),
    ).rejects.toBeInstanceOf(ServiceError);
    const queue = await approvalQueue(t.db, ctx("manager"));
    expect(queue.map((q) => q.id)).toEqual([missionId]);
    expect((await approvalQueue(t.db, ctx("director"))).length).toBe(0);
  });

  it("budget > 10 M GNF : validation manager puis directeur pays", async () => {
    // 1 200 000 + 1 000 € × 9350 = 10 550 000 GNF → étape directeur requise.
    expect(await decideMission(t.db, ctx("manager"), { missionId, decision: "approved" })).toBe(
      "SOUMISE",
    );
    expect((await approvalQueue(t.db, ctx("director"))).map((q) => q.id)).toEqual([missionId]);
    expect(await decideMission(t.db, ctx("director"), { missionId, decision: "approved" })).toBe(
      "VALIDEE",
    );
    const notifications = await inbox(t.db, ctx("agent"));
    expect(notifications.map((n) => n.template)).toContain("mission_approved");
  });

  it("la finance verse une avance en EUR, convertie au taux figé", async () => {
    await createAdvance(t.db, ctx("finance"), {
      missionId,
      beneficiaryId: people.agent!.id,
      amount: "1100",
      currency: "EUR",
      paidOn: "2026-10-13",
      paymentMethod: "especes",
    });
    // Dépasser 120 % du budget exige le Directeur pays.
    await expect(
      createAdvance(t.db, ctx("finance"), {
        missionId,
        beneficiaryId: people.agent!.id,
        amount: "5000000",
        currency: "GNF",
        paidOn: "2026-10-13",
        paymentMethod: "especes",
      }),
    ).rejects.toMatchObject({ code: "ceiling_requires_director" });
  });

  it("sur le terrain : dépenses idempotentes, synchronisation et justificatif", async () => {
    expect(await applyMissionEvent(t.db, ctx("agent"), missionId, "start")).toBe("EN_COURS");
    const input = {
      id: expenseId,
      missionId,
      category: "hebergement",
      description: "Hôtel Kindia 3 nuits",
      amount: "1 200 000",
      currency: "GNF",
      spentOn: "2026-10-14",
    };
    expect((await createExpense(t.db, ctx("agent"), input)).status).toBe("created");
    expect((await createExpense(t.db, ctx("agent"), input)).status).toBe("duplicate");

    const offlineId = randomUUID();
    const results = await processSyncBatch(t.db, ctx("agent"), {
      items: [
        {
          type: "expense",
          payload: {
            id: offlineId,
            missionId,
            category: "transport",
            description: "Carburant aller-retour",
            amount: "9 000 000",
            currency: "GNF",
            spentOn: "2026-10-15",
            receiptMissingReason: "Station sans reçu",
          },
        },
        {
          type: "missionEvent",
          payload: {
            id: randomUUID(),
            missionId,
            kind: "arrivee",
            occurredAt: "2026-10-14T15:00:00Z",
          },
        },
        {
          type: "expense",
          payload: { ...input, id: randomUUID(), missionId: randomUUID() },
        },
      ],
    });
    expect(results.map((r) => r.status)).toEqual(["created", "created", "rejected"]);

    const bytes = new TextEncoder().encode("photo-du-recu");
    const sha256 = createHash("sha256").update(bytes).digest("hex");
    const meta = {
      id: randomUUID(),
      expenseId,
      mimeType: "image/jpeg",
      sizeBytes: bytes.byteLength,
      sha256,
    };
    expect((await attachReceipt(t.db, ctx("agent"), store, meta, bytes)).status).toBe("created");
    await expect(
      attachReceipt(
        t.db,
        ctx("agent"),
        store,
        { ...meta, id: randomUUID(), sha256: "0".repeat(64) },
        bytes,
      ),
    ).rejects.toMatchObject({ code: "checksum_mismatch" });
    const read = await readReceipt(t.db, ctx("finance"), store, meta.id);
    expect(new TextDecoder().decode(read.bytes)).toBe("photo-du-recu");
  });

  it("la finance valide les dépenses (jamais les siennes)", async () => {
    const list = await listExpenses(t.db, ctx("finance"), { missionId });
    expect(list).toHaveLength(2);
    for (const e of list) {
      await decideExpense(t.db, ctx("finance"), { expenseId: e.id, decision: "approuvee" });
    }
    expect((await listExpenses(t.db, ctx("agent"), { missionId })).map((e) => e.status)).toEqual([
      "approuvee",
      "approuvee",
    ]);
  });

  it("réconciliation : soumission, règlement, validation et clôture", async () => {
    expect(await applyMissionEvent(t.db, ctx("agent"), missionId, "finish")).toBe("TERMINEE");
    const before = await getReconciliation(t.db, ctx("agent"), missionId);
    // Avance 1 100 € = 10 285 000 GNF ; dépenses 10 200 000 → l'agent reverse 85 000.
    expect(before.computed.advances.amountMinor).toBe(10_285_000n);
    expect(before.computed.approvedExpenses.amountMinor).toBe(10_200_000n);
    expect(before.computed.balance.amountMinor).toBe(85_000n);
    expect(before.computed.direction).toBe("agent_reverse");
    // Transport : 9 M réalisés contre 9,35 M prévus ; hébergement au budget : aucun écart.
    expect(before.variances).toEqual([]);
    expect(before.canSubmit).toBe(true);

    await submitReconciliation(t.db, ctx("agent"), { missionId });
    await expect(validateReconciliation(t.db, ctx("finance"), { missionId })).rejects.toMatchObject(
      { code: "settlement_missing" },
    );
    await recordSettlement(t.db, ctx("finance"), {
      missionId,
      method: "especes",
      settledOn: "2026-10-20",
    });
    await validateReconciliation(t.db, ctx("finance"), { missionId });
    const mission = await getMission(t.db, ctx("agent"), missionId);
    expect(mission.status).toBe("CLOTUREE");
    expect(mission.history.map((h) => h.to)).toEqual([
      "SOUMISE",
      "VALIDEE",
      "EN_COURS",
      "TERMINEE",
      "CLOTUREE",
    ]);
  });

  it("chaque mutation est journalisée dans audit_log", async () => {
    const rows = (await t.admin(
      `select table_name, count(*)::int as n from audit_log where organisation_id = '${ORG}' group by table_name`,
    )) as { table_name: string; n: number }[];
    const tables = new Set(rows.map((r) => r.table_name));
    for (const table of [
      "missions",
      "approvals",
      "advances",
      "expenses",
      "receipts",
      "reconciliations",
    ]) {
      expect(tables.has(table), table).toBe(true);
    }
  });

  it("une autre organisation ne voit rien", async () => {
    expect(await listMissions(t.db, ctx("outsider"))).toEqual([]);
    await expect(getMission(t.db, ctx("outsider"), missionId)).rejects.toMatchObject({
      code: "not_found",
    });
  });
});

describe("rapports, audit, exports et documents (Phases 5-6)", () => {
  it("tableau de bord et rapport de coûts en devise de base", async () => {
    const stats = await dashboard(t.db, ctx("finance", new Date("2026-10-20T08:00:00Z")));
    expect(stats.byStatus.CLOTUREE).toBe(1);
    expect(stats.receiptCoverageBp).toBe(5000);
    const report = await costReport(t.db, ctx("director"), {
      from: "2026-10-01",
      to: "2026-10-31",
    });
    expect(report.total.amountMinor).toBe(10_200_000n);
    expect(report.byCategory.map((c) => c.category)).toEqual(["transport", "hebergement"]);
    expect(report.byDestination[0]?.destination).toBe("Kindia");
    await expect(
      costReport(t.db, ctx("agent"), { from: "2026-10-01", to: "2026-10-31" }),
    ).rejects.toMatchObject({ code: "forbidden" });
  });

  it("export comptable CSV avec taux figés", async () => {
    const csv = await accountingExport(
      t.db,
      ctx("finance"),
      { from: "2026-10-01", to: "2026-10-31" },
      {
        category: (c) => c,
        headers: [
          "date",
          "type",
          "mission",
          "cat",
          "desc",
          "who",
          "amount",
          "cur",
          "rate",
          "rateDate",
          "base",
          "baseCur",
          "receipts",
          "id",
        ],
      },
    );
    const lines = csv.trim().split("\r\n");
    expect(lines).toHaveLength(4); // en-tête + 2 dépenses + 1 avance
    expect(csv).toContain("1100.00;EUR;9350");
    expect(csv).toContain("Hôtel Kindia 3 nuits;agent;1200000;GNF;1;2026-10-14;1200000;GNF;1;");
  });

  it("recherche globale et journal d'audit", async () => {
    const hits = await globalSearch(t.db, ctx("manager"), "kindia");
    expect(hits.some((h) => h.type === "mission")).toBe(true);
    expect(await globalSearch(t.db, ctx("outsider"), "kindia")).toEqual([]);
    const audit = await auditLogPage(t.db, ctx("director"), { table: "missions" });
    expect(audit.entries.length).toBeGreaterThan(0);
    expect(audit.entries[0]?.changedFields.length).toBeGreaterThan(0);
    await expect(auditLogPage(t.db, ctx("manager"))).rejects.toMatchObject({ code: "forbidden" });
  });

  it("documents versionnés et immuables", async () => {
    const files = new Map<string, Uint8Array>();
    const docs = {
      put: async (k: string, b: Uint8Array) => void files.set(k, b),
      get: async (k: string) => files.get(k) ?? null,
    };
    const tr = (key: string) => key;
    const [missionId] = (await t.admin("select id from missions where status = 'CLOTUREE'")) as {
      id: string;
    }[];
    const first = await generateMissionDocument(
      t.db,
      ctx("finance"),
      docs,
      missionId!.id,
      "closure_pack",
      tr,
      "fr",
    );
    const again = await generateMissionDocument(
      t.db,
      ctx("finance", new Date("2026-11-01T00:00:00Z")),
      docs,
      missionId!.id,
      "closure_pack",
      tr,
      "fr",
    );
    expect(again.version).toBe(first.version);
    expect(again.sha256).toBe(first.sha256);
    expect(Buffer.from(first.bytes.slice(0, 5)).toString()).toBe("%PDF-");
  });

  it("archivage et export intégral", async () => {
    expect(await archiveMissions(t.db, ctx("outsider"), 30)).toBe(0);
    await expect(archiveMissions(t.db, ctx("finance"), 30)).rejects.toMatchObject({
      code: "forbidden",
    });
    const exported = JSON.parse(
      await organisationExport(t.db, {
        ...ctx("director"),
        actor: { userId: people.director!.id, role: "admin" },
      }),
    );
    expect(exported.format).toBe("missionops-export");
    expect(exported.missions).toHaveLength(1);
    expect(exported.auditLog.length).toBeGreaterThan(10);
  });
});
