import { randomBytes, scrypt } from "node:crypto";

import { eq } from "drizzle-orm";

import { createDbClient, organisations, users } from "./index";

// Même format que la vérification côté application : `scrypt$sel$empreinte`.
async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = await new Promise<Buffer>((resolve, reject) => {
    scrypt(password, salt, 64, { N: 16384, r: 8, p: 1 }, (err, dk) => {
      if (err) {
        reject(err);
      } else {
        resolve(dk);
      }
    });
  });
  return `scrypt$${salt.toString("hex")}$${derived.toString("hex")}`;
}

const DEMO_EMAIL = "admin@missionops.test";
const DEMO_PASSWORD = "motdepasse-demo";

/**
 * Insère un jeu de données minimal (une organisation, un utilisateur) pour
 * pouvoir se connecter sur un environnement de démonstration ou de staging.
 * Idempotent : ne recrée pas l'utilisateur s'il existe déjà.
 */
async function seed(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL est requis pour le seed.");
  }

  const { db, close } = createDbClient(url, { max: 1 });
  try {
    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, DEMO_EMAIL))
      .limit(1);

    if (existing.length > 0) {
      console.log(`Utilisateur ${DEMO_EMAIL} déjà présent, seed ignoré.`);
      return;
    }

    await db
      .insert(organisations)
      .values({ name: "Organisation de démonstration", slug: "demo", country: "GN" })
      .onConflictDoNothing({ target: organisations.slug });

    await db.insert(users).values({
      email: DEMO_EMAIL,
      fullName: "Administrateur Démo",
      passwordHash: await hashPassword(DEMO_PASSWORD),
    });

    console.log(`Seed OK. Connexion : ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
  } finally {
    await close();
  }
}

await seed();
