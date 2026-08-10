import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

export type Database = PostgresJsDatabase<typeof schema>;

type PostgresOptions = NonNullable<Parameters<typeof postgres>[1]>;

export interface DbHandle {
  db: Database;
  close: () => Promise<void>;
}

/**
 * Fabrique le client de base de données.
 *
 * Toute la couche d'accès aux données passe par `packages/db` : aucune autre
 * partie du code n'importe `postgres` ni Drizzle directement. Cette frontière
 * sera imposée par une règle ESLint au bloc B1.7 (isolation multi-tenant).
 */
export function createDbClient(connectionString: string, options?: PostgresOptions): DbHandle {
  const client = postgres(connectionString, options);
  const db = drizzle(client, { schema });
  return { db, close: () => client.end() };
}
