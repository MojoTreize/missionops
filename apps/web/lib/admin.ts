/**
 * Administrateurs de la plateforme (console interne, B9.6) : liste d'adresses
 * dans `PLATFORM_ADMIN_EMAILS`, séparées par des virgules. Distinct du rôle
 * « admin » d'une organisation.
 */
export function isPlatformAdmin(email: string): boolean {
  const list = (process.env.PLATFORM_ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(email.toLowerCase());
}
