import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";

// Vérifie hors ligne que la base se reconstruit depuis zéro, sans aucune
// infrastructure : PGlite est un vrai PostgreSQL 16 compilé en WebAssembly,
// exécuté en mémoire. Utile en local (pas de Docker requis) et comme base des
// futurs tests d'intégration rapides.
const migrationsFolder = join(dirname(fileURLToPath(import.meta.url)), "..", "migrations");

const client = new PGlite();
const db = drizzle(client);

await migrate(db, { migrationsFolder });

const result = await client.query<{ table_name: string }>(
  "select table_name from information_schema.tables where table_schema = 'public' order by table_name",
);
const tables = result.rows.map((row) => row.table_name);
console.log("Tables créées :", tables.join(", "));

const expected = ["organisations", "users", "sessions", "auth_tokens"];
const missing = expected.filter((table) => !tables.includes(table));
if (missing.length > 0) {
  throw new Error(`Tables manquantes après migration : ${missing.join(", ")}`);
}

await client.close();
console.log("OK : la base se reconstruit depuis zéro sans erreur (PGlite, PostgreSQL 16 WASM).");
