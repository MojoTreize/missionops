/**
 * Résout l'organisation active d'un utilisateur, de façon pure et testable.
 *
 * Règle : on garde l'organisation préférée (persistée sur l'utilisateur) si
 * l'utilisateur en est toujours membre ; sinon on retombe sur la première de
 * ses appartenances ; sinon `null` (aucune organisation).
 */
export function resolveActiveOrganisationId(
  memberOrganisationIds: readonly string[],
  preferredId: string | null,
): string | null {
  if (preferredId && memberOrganisationIds.includes(preferredId)) {
    return preferredId;
  }
  return memberOrganisationIds[0] ?? null;
}
