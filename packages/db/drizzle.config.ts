import { defineConfig } from "drizzle-kit";

// Configuration Drizzle Kit : génération des migrations SQL à partir du schéma
// TypeScript et ouverture de Drizzle Studio. La génération ne requiert pas de
// base en fonctionnement ; seule l'application des migrations en a besoin.
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/schema/index.ts",
  out: "./migrations",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
  // Sécurité : ne jamais laisser drizzle-kit modifier la base sans migration.
  strict: true,
  verbose: true,
});
