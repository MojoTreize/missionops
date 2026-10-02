import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import "dotenv/config";
import { isRole, type Role } from "@missionops/core";
import { createDbClient, memberships, missions, organisations, users } from "@missionops/db";
import { and, eq } from "drizzle-orm";

import {
  addBudgetLine,
  addParticipant,
  addRate,
  applyMissionEvent,
  attachReceipt,
  createAdvance,
  createExpense,
  createMission,
  createOrgLocation,
  decideExpense,
  decideMission,
  justifyVariance,
  recordMissionEvent,
  recordSettlement,
  saveMissionReport,
  submitReconciliation,
  validateReconciliation,
  type BlobStore,
  type ServiceContext,
} from "../src";

/**
 * Seed de démonstration des missions (B1.12 enrichi, Phases 2 à 5).
 *
 * Construit, au travers des services (machine à états, circuit de validation,
 * audit), un portefeuille réaliste pour la Croix-Rouge Guinée : une mission à
 * chaque étape du cycle, des avances en GNF et en EUR, des dépenses avec et
 * sans justificatif, une réconciliation validée et une autre en attente.
 * Les dates sont relatives au jour du seed.
 */

const here = dirname(fileURLToPath(import.meta.url));
const storageRoot =
  process.env.STORAGE_DIR ?? join(here, "..", "..", "..", "apps", "web", ".data", "storage");

const store: BlobStore = {
  async put(key, bytes) {
    const file = join(storageRoot, key);
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, bytes);
  },
  async get(key) {
    try {
      return new Uint8Array(await readFile(join(storageRoot, key)));
    } catch {
      return null;
    }
  },
};

// Image de reçu de démonstration (PNG valide, 240 × 320).
const RECEIPT_PNG = await readFile(join(here, "recu-demo.png"));

function day(offset: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + offset);
  return d.toISOString().slice(0, 10);
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL est requis.");
  const { db, close } = createDbClient(url, { max: 1 });
  try {
    const org = (
      await db
        .select()
        .from(organisations)
        .where(eq(organisations.slug, "croix-rouge-guinee"))
        .limit(1)
    )[0];
    if (!org) throw new Error("Lancez d'abord le seed de base (organisations et utilisateurs).");
    const already = await db
      .select({ id: missions.id })
      .from(missions)
      .where(eq(missions.organisationId, org.id))
      .limit(1);
    if (already.length > 0) {
      console.log("Missions de démo déjà présentes, seed ignoré.");
      return;
    }

    const team = await db
      .select({ id: users.id, email: users.email, role: memberships.role })
      .from(memberships)
      .innerJoin(users, eq(memberships.userId, users.id))
      .where(and(eq(memberships.organisationId, org.id)));
    const byEmail = (prefix: string) => {
      const member = team.find((m) => m.email.startsWith(prefix));
      if (!member) throw new Error(`Membre ${prefix} introuvable`);
      return member;
    };
    const ctx = (prefix: string): ServiceContext => {
      const m = byEmail(prefix);
      return {
        organisationId: org.id,
        actor: { userId: m.id, role: (isRole(m.role) ? m.role : "collaborateur") as Role },
        now: new Date(),
      };
    };

    const admin = ctx("awa.diallo");
    const director = ctx("mamadou.barry");
    const manager = ctx("fatoumata.camara");
    const finance = ctx("aissatou.bah");
    const logistician = ctx("ousmane.conde");
    const sekou = ctx("sekou.keita");
    const kadiatou = ctx("kadiatou.balde");
    const alpha = ctx("alpha.diakite");

    // Taux de change de référence (finance).
    await addRate(db, finance, {
      fromCurrency: "EUR",
      toCurrency: "GNF",
      rate: "9350",
      effectiveOn: day(-120),
    });
    await addRate(db, finance, {
      fromCurrency: "USD",
      toCurrency: "GNF",
      rate: "8620",
      effectiveOn: day(-120),
    });
    await addRate(db, finance, {
      fromCurrency: "EUR",
      toCurrency: "GNF",
      rate: "9410",
      effectiveOn: day(-20),
    });

    // Lieux propres à l'organisation.
    await createOrgLocation(db, logistician, {
      name: "Entrepôt Croix-Rouge Kindia",
      parentCode: "GN-KD",
      kind: "site",
    });
    await createOrgLocation(db, logistician, {
      name: "Base de Nzérékoré",
      parentCode: "GN-NZ",
      kind: "site",
    });
    await createOrgLocation(db, logistician, {
      name: "Centre de santé de Samoé",
      parentCode: "GN-NZ-SAMOE",
      kind: "site",
    });

    async function draft(
      who: ServiceContext,
      title: string,
      purpose: string,
      destinationCode: string,
      start: number,
      end: number,
      lines: {
        category: string;
        label: string;
        quantity: number;
        unitAmount: string;
        currency: string;
      }[],
    ) {
      const { id } = await createMission(
        db,
        { ...who, now: new Date() },
        {
          title,
          purpose,
          destinationCode,
          startDate: day(start),
          endDate: day(end),
          transportMode: "vehicule_org",
        },
      );
      for (const line of lines) await addBudgetLine(db, who, { missionId: id, ...line });
      return id;
    }
    const approveAll = async (id: string, steps: ServiceContext[]) => {
      for (const step of steps)
        await decideMission(db, step, { missionId: id, decision: "approved" });
    };
    const expense = async (
      who: ServiceContext,
      missionId: string,
      category: string,
      description: string,
      amount: string,
      currency: string,
      spentOn: string,
      withReceipt: boolean,
    ) => {
      const id = randomUUID();
      await createExpense(db, who, {
        id,
        missionId,
        category,
        description,
        amount,
        currency,
        spentOn,
        receiptMissingReason: withReceipt ? null : "Taxi-moto, aucun reçu délivré",
      });
      if (withReceipt) {
        await attachReceipt(
          db,
          who,
          store,
          {
            id: randomUUID(),
            expenseId: id,
            mimeType: "image/png",
            sizeBytes: RECEIPT_PNG.byteLength,
            sha256: createHash("sha256").update(RECEIPT_PNG).digest("hex"),
          },
          new Uint8Array(RECEIPT_PNG),
        );
      }
      return id;
    };

    // 1. Mission clôturée — distribution à Kindia, boucle complète.
    const m1 = await draft(
      sekou,
      "Distribution de kits d'hygiène à Kindia",
      "Distribution de 400 kits d'hygiène dans trois centres de santé de la préfecture de Kindia, suite aux inondations.",
      "GN-KD",
      -40,
      -37,
      [
        {
          category: "hebergement",
          label: "Hôtel 3 nuits × 2 personnes",
          quantity: 6,
          unitAmount: "350000",
          currency: "GNF",
        },
        {
          category: "carburant",
          label: "Carburant aller-retour",
          quantity: 1,
          unitAmount: "1200000",
          currency: "GNF",
        },
        {
          category: "perdiem",
          label: "Per diem 4 jours × 2",
          quantity: 8,
          unitAmount: "150000",
          currency: "GNF",
        },
      ],
    );
    await addParticipant(db, sekou, {
      missionId: m1,
      userId: byEmail("kadiatou.balde").id,
      role: "membre",
    });
    await addParticipant(db, sekou, {
      missionId: m1,
      externalName: "Lansana Camara",
      role: "chauffeur",
    });
    await applyMissionEvent(db, sekou, m1, "submit");
    await approveAll(m1, [manager]);
    await createAdvance(db, finance, {
      missionId: m1,
      beneficiaryId: sekou.actor.userId,
      amount: "4500000",
      currency: "GNF",
      paidOn: day(-41),
      paymentMethod: "especes",
      reference: "CAISSE-0912",
    });
    await applyMissionEvent(db, sekou, m1, "start");
    await recordMissionEvent(db, sekou, {
      id: randomUUID(),
      missionId: m1,
      kind: "depart",
      occurredAt: new Date(Date.now() - 40 * 86_400_000).toISOString(),
      note: "Départ de Conakry 6 h",
    });
    await recordMissionEvent(db, sekou, {
      id: randomUUID(),
      missionId: m1,
      kind: "arrivee",
      occurredAt: new Date(Date.now() - 40 * 86_400_000 + 4 * 3_600_000).toISOString(),
      note: "Arrivée à Kindia",
    });
    const m1e = [
      await expense(
        sekou,
        m1,
        "hebergement",
        "Hôtel Fria Kindia, 3 nuits × 2",
        "2100000",
        "GNF",
        day(-40),
        true,
      ),
      await expense(
        sekou,
        m1,
        "carburant",
        "Carburant station Total Kindia",
        "1150000",
        "GNF",
        day(-40),
        true,
      ),
      await expense(sekou, m1, "perdiem", "Per diem équipe", "1200000", "GNF", day(-37), false),
      await expense(
        kadiatou,
        m1,
        "restauration",
        "Repas équipe et bénévoles",
        "180000",
        "GNF",
        day(-38),
        false,
      ),
    ];
    for (const id of m1e)
      await decideExpense(db, finance, { expenseId: id, decision: "approuvee" });
    await applyMissionEvent(db, sekou, m1, "finish");
    await saveMissionReport(
      db,
      sekou,
      {
        missionId: m1,
        summary: "400 kits distribués dans les centres de santé de Kindia, Friguiagbé et Mambia.",
        results: "1 200 ménages touchés. Stocks des centres reconstitués.",
        difficulties: "Piste dégradée vers Mambia.",
        recommendations: "Prévoir un véhicule 4×4 en saison des pluies.",
      },
      true,
    );
    await justifyVariance(db, sekou, {
      missionId: m1,
      category: "restauration",
      justification: "Repas non prévus pour les bénévoles locaux mobilisés à la distribution.",
    });
    await submitReconciliation(db, sekou, { missionId: m1 });
    await recordSettlement(db, finance, {
      missionId: m1,
      method: "especes",
      reference: "REVERS-0931",
      settledOn: day(-30),
    });
    await validateReconciliation(db, finance, { missionId: m1, comment: "Conforme." });

    // 2. Mission terminée — réconciliation à soumettre, une dépense à valider.
    const m2 = await draft(
      kadiatou,
      "Formation des volontaires à Labé",
      "Formation aux premiers secours de 25 volontaires du comité de Labé.",
      "GN-LA",
      -10,
      -7,
      [
        {
          category: "hebergement",
          label: "Hébergement formateurs",
          quantity: 3,
          unitAmount: "300000",
          currency: "GNF",
        },
        {
          category: "fournitures",
          label: "Kits de formation",
          quantity: 25,
          unitAmount: "45000",
          currency: "GNF",
        },
        {
          category: "transport",
          label: "Billets de bus",
          quantity: 2,
          unitAmount: "20",
          currency: "EUR",
        },
      ],
    );
    await applyMissionEvent(db, kadiatou, m2, "submit");
    await approveAll(m2, [ctx("ibrahima.sow")]);
    await createAdvance(db, finance, {
      missionId: m2,
      beneficiaryId: kadiatou.actor.userId,
      amount: "250",
      currency: "EUR",
      paidOn: day(-11),
      paymentMethod: "mobile_money",
      reference: "OM-77812",
    });
    await applyMissionEvent(db, kadiatou, m2, "start");
    const m2a = await expense(
      kadiatou,
      m2,
      "hebergement",
      "Auberge du Fouta, 3 nuits",
      "900000",
      "GNF",
      day(-10),
      true,
    );
    await expense(
      kadiatou,
      m2,
      "fournitures",
      "Achat de 25 kits de formation",
      "1250000",
      "GNF",
      day(-9),
      true,
    );
    await expense(
      kadiatou,
      m2,
      "transport",
      "Taxi-brousse Conakry – Labé",
      "180000",
      "GNF",
      day(-10),
      false,
    );
    await decideExpense(db, finance, { expenseId: m2a, decision: "approuvee" });
    await applyMissionEvent(db, kadiatou, m2, "finish");

    // 3. Mission en cours — Nzérékoré, avance versée, dépenses saisies.
    const m3 = await draft(
      alpha,
      "Évaluation des besoins à Nzérékoré",
      "Évaluation rapide des besoins après l'épidémie de rougeole dans les sous-préfectures de Samoé et Koropara.",
      "GN-NZ",
      -2,
      3,
      [
        {
          category: "transport",
          label: "Vol Conakry – Nzérékoré",
          quantity: 2,
          unitAmount: "180",
          currency: "USD",
        },
        {
          category: "hebergement",
          label: "Hôtel 5 nuits × 2",
          quantity: 10,
          unitAmount: "400000",
          currency: "GNF",
        },
        {
          category: "carburant",
          label: "Carburant véhicule local",
          quantity: 1,
          unitAmount: "1500000",
          currency: "GNF",
        },
        {
          category: "perdiem",
          label: "Per diem 6 jours × 2",
          quantity: 12,
          unitAmount: "150000",
          currency: "GNF",
        },
      ],
    );
    await addParticipant(db, alpha, {
      missionId: m3,
      userId: byEmail("mariama.toure").id,
      role: "membre",
    });
    await applyMissionEvent(db, alpha, m3, "submit");
    await approveAll(m3, [manager, director]);
    await createAdvance(db, finance, {
      missionId: m3,
      beneficiaryId: alpha.actor.userId,
      amount: "8000000",
      currency: "GNF",
      paidOn: day(-3),
      paymentMethod: "especes",
      reference: "CAISSE-1002",
    });
    await applyMissionEvent(db, alpha, m3, "start");
    await recordMissionEvent(db, alpha, {
      id: randomUUID(),
      missionId: m3,
      kind: "arrivee",
      occurredAt: new Date(Date.now() - 2 * 86_400_000).toISOString(),
      note: "Arrivés à Nzérékoré par le vol du matin",
    });
    await recordMissionEvent(db, alpha, {
      id: randomUUID(),
      missionId: m3,
      kind: "checkin",
      occurredAt: new Date(Date.now() - 86_400_000).toISOString(),
      note: "Visite du centre de santé de Samoé",
    });
    await expense(
      alpha,
      m3,
      "transport",
      "Billets d'avion Conakry – Nzérékoré",
      "360",
      "USD",
      day(-3),
      true,
    );
    await expense(
      alpha,
      m3,
      "hebergement",
      "Hôtel Bakoly, 2 nuits × 2",
      "1600000",
      "GNF",
      day(-1),
      true,
    );

    // 4. Mission validée, départ prochain — Boké.
    const m4 = await draft(
      sekou,
      "Appui au comité de Kamsar",
      "Appui logistique au comité local pour la campagne de don du sang.",
      "GN-BK-KAMSAR",
      5,
      8,
      [
        {
          category: "hebergement",
          label: "Hébergement",
          quantity: 3,
          unitAmount: "350000",
          currency: "GNF",
        },
        {
          category: "carburant",
          label: "Carburant",
          quantity: 1,
          unitAmount: "1400000",
          currency: "GNF",
        },
      ],
    );
    await applyMissionEvent(db, sekou, m4, "submit");
    await approveAll(m4, [manager]);

    // 5. Mission soumise — en attente du manager.
    const m5 = await draft(
      kadiatou,
      "Sensibilisation choléra à Siguiri",
      "Campagne de sensibilisation au choléra sur les sites d'orpaillage de Kintinian et Doko.",
      "GN-SI",
      12,
      16,
      [
        {
          category: "transport",
          label: "Transport",
          quantity: 1,
          unitAmount: "2000000",
          currency: "GNF",
        },
        {
          category: "fournitures",
          label: "Supports de sensibilisation",
          quantity: 1,
          unitAmount: "900000",
          currency: "GNF",
        },
      ],
    );
    await applyMissionEvent(db, kadiatou, m5, "submit");

    // 6. Mission à gros budget — validée par le manager, attend le Directeur pays.
    const m6 = await draft(
      alpha,
      "Pré-positionnement de stocks à Kankan",
      "Pré-positionnement de stocks d'urgence avant la saison des pluies pour la région de Kankan.",
      "GN-KA",
      20,
      26,
      [
        {
          category: "transport",
          label: "Location camion",
          quantity: 2,
          unitAmount: "4500000",
          currency: "GNF",
        },
        {
          category: "hebergement",
          label: "Hébergement équipe",
          quantity: 12,
          unitAmount: "350000",
          currency: "GNF",
        },
      ],
    );
    await applyMissionEvent(db, alpha, m6, "submit");
    await approveAll(m6, [manager]);

    // 7. Brouillon.
    await draft(
      sekou,
      "Visite de suivi à Mamou",
      "Suivi des activités du comité de Mamou et de la sous-préfecture de Timbo.",
      "GN-MM",
      30,
      31,
      [],
    );

    // 8. Rejetée.
    const m8 = await draft(
      alpha,
      "Atelier régional à Conakry",
      "Participation à l'atelier régional de coordination humanitaire.",
      "GN-C-KALOUM",
      9,
      9,
      [
        {
          category: "restauration",
          label: "Pause déjeuner",
          quantity: 1,
          unitAmount: "500000",
          currency: "GNF",
        },
      ],
    );
    await applyMissionEvent(db, alpha, m8, "submit");
    await decideMission(db, manager, {
      missionId: m8,
      decision: "rejected",
      comment: "Atelier pris en charge par l'organisateur : pas de mission nécessaire.",
    });

    // 9. Annulée.
    const m9 = await draft(
      kadiatou,
      "Mission de terrain à Gaoual",
      "Évaluation des besoins en eau potable.",
      "GN-GA",
      15,
      18,
      [],
    );
    await applyMissionEvent(
      db,
      kadiatou,
      m9,
      "cancel",
      "Accès impossible : pont coupé à Koundara.",
    );

    void admin;
    console.log(
      "Missions de démo OK : 9 missions sur tout le cycle de vie, avances, dépenses, justificatifs.",
    );
  } finally {
    await close();
  }
}

await main();
