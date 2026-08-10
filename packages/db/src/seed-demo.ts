import { createHash, randomBytes, scrypt } from "node:crypto";

import { eq } from "drizzle-orm";

import { createDbClient, invitations, memberships, organisations, users } from "./index";

/**
 * Seed de démonstration (B1.12) — `pnpm db:seed:demo`.
 *
 * Construit une base réaliste et reconstructible en une commande, à trois fins :
 * développement, tests et démonstrations commerciales. À ce stade du socle
 * (Phase 1), les entités disponibles sont les organisations, les utilisateurs,
 * les appartenances et les invitations ; les missions, dépenses et justificatifs
 * décrits au §9.3 du plan viendront enrichir ce seed quand leurs tables
 * existeront (Phase 2+).
 *
 * Idempotent : si l'organisation pilote existe déjà, le seed s'arrête sans rien
 * dupliquer. Le flux recommandé reste `pnpm db:reset && pnpm db:seed:demo`.
 */

/** Mot de passe unique et partagé pour tous les comptes de démonstration. */
const DEMO_PASSWORD = "motdepasse-demo";

/** Rôle applicatif d'un compte de démonstration. */
type Role = "admin" | "directeur_pays" | "manager" | "finance" | "logisticien" | "collaborateur";

interface DemoUser {
  email: string;
  fullName: string;
  role: Role;
}

interface DemoOrg {
  name: string;
  slug: string;
  country: string;
  team: DemoUser[];
  /** Invitations en attente, pour peupler l'écran des membres. */
  invites: { email: string; role: Role }[];
}

/**
 * Deux organisations : une équipe complète (les six rôles) et une seconde
 * organisation distincte, indispensable pour éprouver l'isolation multi-tenant.
 * Noms, personnes et destinations ancrés dans le contexte guinéen.
 */
const ORGS: DemoOrg[] = [
  {
    name: "Croix-Rouge Guinée",
    slug: "croix-rouge-guinee",
    country: "GN",
    team: [
      { email: "awa.diallo@croix-rouge-guinee.demo", fullName: "Awa Diallo", role: "admin" },
      {
        email: "mamadou.barry@croix-rouge-guinee.demo",
        fullName: "Mamadou Barry",
        role: "directeur_pays",
      },
      {
        email: "fatoumata.camara@croix-rouge-guinee.demo",
        fullName: "Fatoumata Camara",
        role: "manager",
      },
      { email: "ibrahima.sow@croix-rouge-guinee.demo", fullName: "Ibrahima Sow", role: "manager" },
      {
        email: "aissatou.bah@croix-rouge-guinee.demo",
        fullName: "Aïssatou Bah",
        role: "finance",
      },
      {
        email: "ousmane.conde@croix-rouge-guinee.demo",
        fullName: "Ousmane Condé",
        role: "logisticien",
      },
      {
        email: "mariama.toure@croix-rouge-guinee.demo",
        fullName: "Mariama Touré",
        role: "logisticien",
      },
      {
        email: "sekou.keita@croix-rouge-guinee.demo",
        fullName: "Sékou Keïta",
        role: "collaborateur",
      },
      {
        email: "kadiatou.balde@croix-rouge-guinee.demo",
        fullName: "Kadiatou Baldé",
        role: "collaborateur",
      },
      {
        email: "alpha.diakite@croix-rouge-guinee.demo",
        fullName: "Alpha Diakité",
        role: "collaborateur",
      },
    ],
    invites: [
      { email: "nouvelle.recrue@croix-rouge-guinee.demo", role: "collaborateur" },
      { email: "chef.mission@croix-rouge-guinee.demo", role: "manager" },
    ],
  },
  {
    name: "Médecins du Monde Guinée",
    slug: "medecins-du-monde-guinee",
    country: "GN",
    team: [
      {
        email: "nfale.kourouma@medecins-du-monde-guinee.demo",
        fullName: "Nfalé Kourouma",
        role: "admin",
      },
      {
        email: "hadja.sylla@medecins-du-monde-guinee.demo",
        fullName: "Hadja Sylla",
        role: "collaborateur",
      },
    ],
    invites: [],
  },
];

function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  return new Promise((resolve, reject) => {
    scrypt(password, salt, 64, { N: 16384, r: 8, p: 1 }, (err, dk) => {
      if (err) {
        reject(err);
      } else {
        resolve(`scrypt$${salt.toString("hex")}$${dk.toString("hex")}`);
      }
    });
  });
}

function hashToken(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex");
}

const INVITATION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

async function seed(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL est requis pour le seed de démonstration.");
  }

  const { db, close } = createDbClient(url, { max: 1 });
  try {
    const pilotSlug = ORGS[0]?.slug ?? "croix-rouge-guinee";
    const existing = await db
      .select({ id: organisations.id })
      .from(organisations)
      .where(eq(organisations.slug, pilotSlug))
      .limit(1);

    if (existing.length > 0) {
      console.log(`Organisation « ${pilotSlug} » déjà présente, seed de démo ignoré.`);
      console.log("Pour repartir de zéro : pnpm db:reset && pnpm db:seed:demo");
      return;
    }

    // Un seul hachage, réutilisé pour tous les comptes de démo (même mot de
    // passe en clair) : le seed reste rapide et les comptes interchangeables.
    const passwordHash = await hashPassword(DEMO_PASSWORD);
    let userCount = 0;
    let inviteCount = 0;

    for (const org of ORGS) {
      const [orgRow] = await db
        .insert(organisations)
        .values({ name: org.name, slug: org.slug, country: org.country })
        .returning({ id: organisations.id });
      if (!orgRow) {
        throw new Error(`Échec de création de l'organisation ${org.slug}.`);
      }

      let adminUserId: string | null = null;
      for (const member of org.team) {
        const [userRow] = await db
          .insert(users)
          .values({
            email: member.email,
            fullName: member.fullName,
            passwordHash,
            currentOrganisationId: orgRow.id,
          })
          .returning({ id: users.id });
        if (!userRow) {
          throw new Error(`Échec de création de l'utilisateur ${member.email}.`);
        }

        await db.insert(memberships).values({
          organisationId: orgRow.id,
          userId: userRow.id,
          role: member.role,
        });
        if (member.role === "admin") {
          adminUserId = userRow.id;
        }
        userCount += 1;
      }

      // Les invitations en attente sont émises par l'administrateur de l'organisation.
      for (const invite of org.invites) {
        await db.insert(invitations).values({
          organisationId: orgRow.id,
          email: invite.email,
          role: invite.role,
          tokenHash: hashToken(randomBytes(32).toString("hex")),
          invitedBy: adminUserId,
          expiresAt: new Date(Date.now() + INVITATION_TTL_MS),
        });
        inviteCount += 1;
      }
    }

    console.log(
      `Seed de démo OK : ${ORGS.length} organisations, ${userCount} utilisateurs, ` +
        `${inviteCount} invitations en attente.`,
    );
    console.log(`Connexion de démonstration — mot de passe commun : ${DEMO_PASSWORD}`);
    const admin = ORGS[0]?.team[0];
    if (admin) {
      console.log(`Compte administrateur pilote : ${admin.email}`);
    }
  } finally {
    await close();
  }
}

await seed();
