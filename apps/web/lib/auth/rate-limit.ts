/**
 * Limitation de débit à fenêtre glissante, en mémoire.
 *
 * La logique de décision `isRateLimited` est pure (horloge injectée) pour être
 * testable simplement. Le magasin `InMemoryRateLimiter` est un adaptateur : il
 * suffit pour un déploiement à instance unique. Une implémentation partagée
 * (base ou Redis) pourra le remplacer sans toucher aux appelants.
 */

export interface RateLimitPolicy {
  readonly max: number;
  readonly windowMs: number;
}

/**
 * Décide, pour une liste d'instants de tentatives (ms epoch), si une nouvelle
 * tentative doit être bloquée. Ne compte que les tentatives dans la fenêtre.
 */
export function isRateLimited(
  attempts: readonly number[],
  now: number,
  policy: RateLimitPolicy,
): boolean {
  const windowStart = now - policy.windowMs;
  const recent = attempts.filter((t) => t > windowStart);
  return recent.length >= policy.max;
}

export class InMemoryRateLimiter {
  private readonly attempts = new Map<string, number[]>();

  constructor(
    private readonly policy: RateLimitPolicy,
    private readonly now: () => number = () => Date.now(),
  ) {}

  /** `true` si la clé a atteint la limite sur la fenêtre courante. */
  isLimited(key: string): boolean {
    return isRateLimited(this.attempts.get(key) ?? [], this.now(), this.policy);
  }

  /** Enregistre une tentative et purge les entrées hors fenêtre. */
  record(key: string): void {
    const current = this.now();
    const windowStart = current - this.policy.windowMs;
    const recent = (this.attempts.get(key) ?? []).filter((t) => t > windowStart);
    recent.push(current);
    this.attempts.set(key, recent);
  }

  /** Réinitialise le compteur (ex. après une connexion réussie). */
  reset(key: string): void {
    this.attempts.delete(key);
  }
}
