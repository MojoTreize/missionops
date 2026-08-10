# B1.6 — Organisations et appartenances

## Objectif

Un utilisateur appartient à une ou plusieurs organisations et peut basculer de
l'une à l'autre. L'organisation active est résolue côté serveur et persiste
entre les sessions et les appareils.

## Contenu

- **Tables** : `memberships` (lien utilisateur × organisation avec `role` en
  `text`, unicité sur `(organisation_id, user_id)`) et `invitations` (e-mail,
  rôle, jeton haché, expiration, acceptation). Colonne
  `users.current_organisation_id` pour mémoriser l'organisation active.
- **Résolution de l'organisation active** (`lib/org/active.ts`, pur) : on garde
  la préférence persistée si l'utilisateur en est toujours membre, sinon on
  retombe sur sa première appartenance, sinon `null`.
- **Création d'organisation** : l'utilisateur devient administrateur et
  l'organisation devient active. Slug unique dérivé du nom (`lib/org/slug.ts`).
- **Invitation par e-mail** : jeton à usage unique (7 jours), lien envoyé par le
  transport de développement ; acceptation possible uniquement par le compte
  dont l'adresse correspond à l'invitation.
- **Sélecteur d'organisation** dans l'en-tête `(app)` : bascule côté serveur et
  rafraîchit la vue.
- **Écrans** : `/organizations/new` (création / accueil quand aucune
  organisation) et `/organizations/members` (liste des membres, invitations en
  attente, formulaire d'invitation réservé aux administrateurs).

## Décisions appliquées

- ADR-001 — multi-tenant par colonne partagée : `memberships` et `invitations`
  portent `organisation_id`.
- ADR-005 — suppression logique : `deleted_at` partout, aucune suppression
  physique.
- §7.6 — pas d'`enum` PostgreSQL : `memberships.role` et `invitations.role` sont
  des `text` (la table de rôles arrive en B1.8).
- Organisation active persistée sur `users.current_organisation_id` (et non en
  session), afin qu'elle survive entre les sessions et les appareils, validée à
  chaque résolution contre les appartenances réelles.

## Tests

- Unitaires (Vitest) : `slugify` (accents, espaces, tirets superflus) et
  `resolveActiveOrganisationId` (préférence valide, préférence invalide, absence
  de préférence, aucune organisation — couvre le basculement entre deux
  organisations).
- Migration validée hors ligne (PGlite) : `memberships` et `invitations`
  présentes, base reconstruite depuis zéro.

## Fini quand

Un utilisateur membre de deux organisations peut basculer entre elles et
l'organisation active persiste entre les sessions. Hors ligne, tout est vert :
types, lint, tests, build, migration.

## Hors périmètre de ce bloc

La couche d'accès typée par `organisation_id` / RLS (B1.7), les rôles et
permissions applicatives (B1.8), un vrai transport d'e-mail.

## Dépend de

B1.5 (authentification et session).
