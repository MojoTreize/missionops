# B1.8 — Rôles et permissions

## Objectif

Chaque action vérifie un droit explicite. L'autorisation n'est pas dispersée
dans le code : elle passe par une seule porte, `can(user, action, resource)`.

## Contenu

- **Six rôles de base** (`@missionops/core/policy`) : Collaborateur, Manager,
  Logisticien, Finance, Directeur pays, Administrateur. Clé technique en
  `snake_case` (valeur stockée dans `memberships.role`) + libellé d'affichage.
- **Matrice de permissions** : ressources (`mission`, `expense`, `advance`,
  `receipt`, `member`, `organisation`, `approvalFlow`, `auditLog`) × actions
  (`create`, `read`, `update`, `delete`, `approve`, `export`). Source unique de
  vérité dans `matrix.ts` ; l'administrateur a tous les droits.
- **Fonction pure `can(acteur, action, ressource)`** : zéro I/O, instantanée,
  déterministe — testable exhaustivement.
- **Garde côté serveur** (`apps/web/lib/policy.ts`) : `getActor` (utilisateur +
  rôle dans l'organisation active), `can` pour le masquage d'interface,
  `requireCan` qui redirige vers `/login` (non authentifié) ou `/forbidden`
  (droit manquant).
- **Application** : l'invitation d'un membre est soumise au droit
  `member:create` (et non plus à un test « admin » codé en dur) ; le formulaire
  propose les six rôles ; la page membres masque l'invitation selon le droit.

## Décisions appliquées

- Autorisation centralisée : une seule fonction `can`, réutilisée par la garde
  serveur et par le masquage d'interface (pas de logique dupliquée).
- Domaine pur : la matrice et `can` ne connaissent ni session, ni base, ni
  React ; le rôle est le seul intrant.
- Rôle par défaut `collaborateur` si la valeur stockée est inconnue (tolérance
  aux données héritées).

## Tests

- Unitaire exhaustif (Vitest) : table complète rôle × ressource × action (293
  cas), écrite indépendamment de la matrice pour détecter toute divergence entre
  intention et implémentation, plus des invariants (admin tout-puissant, un
  Collaborateur ne peut pas approuver une dépense, gestion des membres et de
  l'organisation réservée à l'administrateur, journal d'audit réservé au
  Directeur pays et à l'administrateur).

## Fini quand

Aucune action de mutation n'existe sans passer par `can()`. À ce stade, la seule
mutation soumise à permission (invitation d'un membre) est gardée ; les futures
mutations métier réutiliseront la même porte.

## Hors périmètre de ce bloc

Le test E2E « un Collaborateur reçoit une 403 sur une route Finance » (Playwright
non encore installé) : la garde `/forbidden` et l'équivalent unitaire sont en
place ; l'E2E sera ajouté avec la suite E2E. Les rôles configurables par
organisation (table `roles`, phase ultérieure) et le journal d'audit (B1.9).

## Dépend de

B1.7 (isolation multi-tenant).
