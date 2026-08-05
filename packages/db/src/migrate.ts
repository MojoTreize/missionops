import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

// Chemin du dossier de migrations, résolu par rapport à ce fichier pour être
// indépendant du répertoire courant d'exécution.
const migrationsFolder = join(dirname(fileURLToPath(import.meta.url)), "..", "migrations");

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error("DATABASE_URL manquant : copiez .env.example vers .env et renseignez l'URL.");
}

const client = postgres(url, { max: 1 });
try {
  await migrate(drizzle(client), { migrationsFolder });
  console.log("Migrations appliquées.");
} finally {
  await client.end();
}
