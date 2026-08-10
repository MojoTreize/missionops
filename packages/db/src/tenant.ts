import { sql, type SQL } from "drizzle-orm";

/**
 * Couche d'accès multi-tenant (B1.7).
 *
 * Toute lecture ou écriture sur une table métier doit passer par `withTenant` :
 * on ouvre une transaction et on fixe le paramètre de session `app.current_org`
 * (local à la transaction) sur lequel s'appuie la Row Level Security. L'`orgId`
 * est obligatoire et typé — il est impossible d'exécuter une requête métier sans
 * contexte d'organisation, ce que le typage refuse.
 */

export interface TenantTx {
  execute: (query: SQL) => Promise<unknown>;
}

export interface Transactional<Tx extends TenantTx> {
  transaction: <T>(fn: (tx: Tx) => Promise<T>) => Promise<T>;
}

export async function withTenant<Tx extends TenantTx, T>(
  db: Transactional<Tx>,
  organisationId: string,
  fn: (tx: Tx) => Promise<T>,
): Promise<T> {
  return db.transaction(async (tx) => {
    // Paramètre local à la transaction : jamais partagé entre requêtes du pool.
    await tx.execute(sql`select set_config('app.current_org', ${organisationId}, true)`);
    return fn(tx);
  });
}
