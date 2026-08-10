import { sql, type SQL } from "drizzle-orm";

/**
 * Couche d'accès multi-tenant (B1.7).
 *
 * Toute lecture ou écriture sur une table métier doit passer par `withTenant` :
 * on ouvre une transaction et on fixe le paramètre de session `app.current_org`
 * (local à la transaction) sur lequel s'appuie la Row Level Security. L'`orgId`
 * est obligatoire et typé — il est impossible d'exécuter une requête métier sans
 * contexte d'organisation, ce que le typage refuse.
 *
 * On y adjoint le contexte d'audit (B1.9) : l'acteur et l'adresse IP, transmis
 * via `app.current_actor` / `app.current_ip`, que le déclencheur d'audit lit
 * pour renseigner chaque ligne du journal. Ces deux valeurs sont facultatives.
 */

export interface TenantTx {
  execute: (query: SQL) => Promise<unknown>;
}

export interface Transactional<Tx extends TenantTx> {
  transaction: <T>(fn: (tx: Tx) => Promise<T>) => Promise<T>;
}

/**
 * Contexte d'exécution d'une requête métier : l'organisation (obligatoire) et,
 * pour l'audit, l'acteur et son adresse IP (facultatifs).
 */
export interface TenantContext {
  organisationId: string;
  actorId?: string | null;
  ip?: string | null;
}

export async function withTenant<Tx extends TenantTx, T>(
  db: Transactional<Tx>,
  context: TenantContext,
  fn: (tx: Tx) => Promise<T>,
): Promise<T> {
  return db.transaction(async (tx) => {
    // Paramètres locaux à la transaction : jamais partagés entre requêtes du pool.
    await tx.execute(sql`select set_config('app.current_org', ${context.organisationId}, true)`);
    // Chaîne vide quand l'acteur/IP est absent ; le déclencheur d'audit fait
    // `NULLIF(..., '')` pour la retransformer en NULL.
    await tx.execute(sql`select set_config('app.current_actor', ${context.actorId ?? ""}, true)`);
    await tx.execute(sql`select set_config('app.current_ip', ${context.ip ?? ""}, true)`);
    return fn(tx);
  });
}
