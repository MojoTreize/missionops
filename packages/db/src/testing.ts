import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";

import * as schema from "./schema";
import type { Db } from "./types";

const migrationsFolder = join(dirname(fileURLToPath(import.meta.url)), "..", "migrations");

export interface TestDb {
  db: Db;
  /** Exécute du SQL brut en superutilisateur (amorçage, inspection). */
  admin: (sql: string) => Promise<unknown[]>;
  close: () => Promise<void>;
}

/**
 * Base PGlite migrée, pour les tests d'intégration. Après amorçage, la session
 * bascule sur un rôle applicatif non privilégié (ni propriétaire, ni
 * superutilisateur) : la RLS et les droits s'appliquent comme en production.
 */
export async function createTestDb(): Promise<TestDb> {
  const client = new PGlite();
  const db = drizzle(client, { schema });
  await migrate(db, { migrationsFolder });
  await client.exec(`
    create role app_tenant nologin;
    grant usage on schema public to app_tenant;
    grant select, insert, update, delete on all tables in schema public to app_tenant;
    revoke update, delete on audit_log from app_tenant;
    set role app_tenant;
  `);
  return {
    db: db as unknown as Db,
    admin: async (sql) => {
      await client.exec("reset role");
      try {
        const results = await client.exec(sql);
        return results.at(-1)?.rows ?? [];
      } finally {
        await client.exec("set role app_tenant");
      }
    },
    close: () => client.close(),
  };
}
