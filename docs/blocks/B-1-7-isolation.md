# B1.7 — Isolation multi-tenant

## Objectif

Une fuite de données entre organisations est structurellement impossible. La
protection ne repose pas sur la vigilance du développeur mais sur la base et le
typage.

## Contenu

- **Row Level Security en base.** Une migration crée la fonction réutilisable
  `enable_org_rls(regclass)` : elle active la RLS, la force (elle s'applique même
  au propriétaire de la table) et pose la politique `org_isolation`. Celle-ci
  n'expose que les lignes dont `organisation_id` correspond au paramètre de
  session `app.current_org` (`NULLIF(current_setting('app.current_org', true),
'')::uuid`). Les futures tables métier appellent simplement
  `SELECT enable_org_rls('ma_table');`.
- **Couche d'accès `withTenant`** (`packages/db`). Toute requête métier passe par
  une transaction qui fixe `app.current_org` (local à la transaction) avant de
  s'exécuter. L'`orgId` est obligatoire et typé : il est impossible d'exécuter
  une requête sans contexte d'organisation.
- **Frontière imposée par ESLint.** Une règle `no-restricted-imports` interdit
  d'importer le driver `postgres`, la fabrique Drizzle ou PGlite hors de
  `packages/db`. Le reste du code passe par l'API typée de `@missionops/db`.
- **Test d'isolation générique** (§9.2, PGlite). Sous un rôle applicatif non
  privilégié (ni propriétaire ni superutilisateur, pour que la RLS s'applique
  réellement), deux organisations sont amorcées puis on vérifie que chacune ne
  voit que ses lignes, qu'aucune ligne n'est visible sans contexte, et qu'une
  organisation ne peut pas écrire pour une autre. Un volet structurel vérifie en
  plus que toute table métier (hors tables système) porte `organisation_id` et
  la politique d'isolation.

## Décisions appliquées

- ADR-001 — défense en profondeur à deux niveaux : RLS en base **et** couche
  d'accès applicative exigeant un `orgId`.
- Tables d'identité / routage exclues de l'isolation par `organisation_id`
  (`organisations`, `users`, `sessions`, `auth_tokens`, `memberships`,
  `invitations`) : elles précèdent le choix d'une organisation.
- Rôle applicatif non superutilisateur en production : condition nécessaire pour
  que la RLS soit effective (les superutilisateurs la contournent).

## Tests

- Intégration générique (Vitest + PGlite) : isolation en lecture et en écriture,
  absence de contexte, et contrôle structurel de chaque table métier.
- Migration validée hors ligne (PGlite) : la fonction `enable_org_rls` et la
  politique se créent sans erreur.

## Fini quand

Ajouter une table métier sans `organisation_id` (ni RLS d'isolation) fait échouer
la CI, et une requête d'une organisation ne peut jamais lire ni écrire les
données d'une autre.

## Hors périmètre de ce bloc

Les rôles et permissions applicatives (B1.8), le journal d'audit (B1.9). La
migration des requêtes existantes de `packages/db`/`apps/web` vers `withTenant`
se fera à mesure que les tables métier apparaîtront (aucune n'existe encore).

## Dépend de

B1.6 (organisations et appartenances).
