import { rateLimits, type Db } from "@missionops/db";
import { eq, sql } from "drizzle-orm";

/**
 * Limitation de débit partagée entre instances (B8.3), adossée à la table
 * système `rate_limits` (fenêtre fixe). Remplace le compteur en mémoire, qui
 * sautait à chaque redémarrage et ne protégeait qu'une instance.
 */
export interface RateLimitPolicy {
  readonly max: number;
  readonly windowMs: number;
}

export class DbRateLimiter {
  constructor(
    private readonly db: Db,
    private readonly policy: RateLimitPolicy,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async isLimited(key: string): Promise<boolean> {
    const rows = await this.db.select().from(rateLimits).where(eq(rateLimits.key, key)).limit(1);
    const row = rows[0];
    if (!row) return false;
    const expired = this.now().getTime() - row.windowStartedAt.getTime() >= this.policy.windowMs;
    return !expired && row.count >= this.policy.max;
  }

  /** Enregistre une tentative ; ouvre une nouvelle fenêtre si l'ancienne a expiré. */
  async record(key: string): Promise<void> {
    const now = this.now();
    // Chaînes ISO typées : le pilote postgres-js refuse les `Date` brutes dans
    // un fragment `sql` (PGlite les accepte, d'où un test d'intégration dédié).
    const nowIso = sql`${now.toISOString()}::timestamptz`;
    const windowStart = sql`${new Date(now.getTime() - this.policy.windowMs).toISOString()}::timestamptz`;
    await this.db
      .insert(rateLimits)
      .values({ key, count: 1, windowStartedAt: now })
      .onConflictDoUpdate({
        target: rateLimits.key,
        set: {
          count: sql`case when ${rateLimits.windowStartedAt} <= ${windowStart} then 1 else ${rateLimits.count} + 1 end`,
          windowStartedAt: sql`case when ${rateLimits.windowStartedAt} <= ${windowStart} then ${nowIso} else ${rateLimits.windowStartedAt} end`,
        },
      });
  }

  /** Remet le compteur à zéro (ex. après une connexion réussie). */
  async reset(key: string): Promise<void> {
    await this.db.update(rateLimits).set({ count: 0 }).where(eq(rateLimits.key, key));
  }
}
