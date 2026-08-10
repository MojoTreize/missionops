import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

// Réinitialise entièrement la base (schéma public) puis rejoue toutes les
// migrations depuis zéro. Destiné au développement local et à la CI, jamais à
// un environnement contenant des données réelles.
const migrationsFolder = join(dirname(fileURLToPath(import.meta.url)), "..", "migrations");

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error("DATABASE_URL manquant : copiez .env.example vers .env et renseignez l'URL.");
}

const client = postgres(url, { max: 1 });
try {
  // ATTENTION : opération destructive. Supprime toutes les tables du schéma public.
  await client.unsafe("drop schema if exists public cascade; create schema public;");
  await migrate(drizzle(client), { migrationsFolder });
  console.log("Base réinitialisée et migrations appliquées.");
} finally {
  await client.end();
}
