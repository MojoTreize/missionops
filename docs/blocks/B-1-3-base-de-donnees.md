# B1.3 — Base de données et migrations

## Objectif

Un schéma versionné, appliqué automatiquement, réversible. `pnpm db:reset && pnpm db:migrate`
reconstruit la base depuis zéro sans erreur.

## Contenu

- **Drizzle ORM + drizzle-kit** configurés dans `packages/db` (pilote `postgres`).
- **Première migration** avec les tables fondatrices `organisations` et `users`
  (générée dans `packages/db/migrations/`).
- **Scripts** : `db:generate`, `db:migrate`, `db:reset`, `db:studio` (racine et paquet).
- **Postgres en service dans la CI** : les migrations sont appliquées sur une
  base vierge à chaque PR.
- **Postgres local** via `docker-compose.yml`.
- **Convention de nommage documentée** (voir `packages/db/README.md` et §7.6 du plan).

## Décisions appliquées

- ADR-001 — multi-tenant par colonne partagée : `organisations` est la table
  racine. `organisations` et `users` ne portent pas d'`organisation_id` (tables
  fondatrices) ; les tables métier l'ajouteront à partir de B1.6.
- ADR-005 — suppression logique : colonne `deleted_at` sur chaque table.
- ADR-008 — i18n dès le socle : `users.locale` (`fr` par défaut).
- §7.6 — `snake_case`, pluriel, `timestamptz`, pas d'`enum` PostgreSQL.

## Tests

- Hors ligne : `pnpm db:check` reconstruit la base depuis zéro en mémoire
  (PGlite, PostgreSQL 16 WASM) — aucune infrastructure requise.
- CI : `pnpm db:migrate` s'exécute sur un Postgres jetable à chaque PR.
- Local : `docker compose up -d` puis `pnpm db:reset` reconstruit la base.

## Fini quand

`pnpm db:check` reconstruit la base depuis zéro sans erreur (validé), et
`pnpm db:reset && pnpm db:migrate` fait de même sur un Postgres vierge.

## Hors périmètre de ce bloc

Les autres tables du modèle (§7.1 à §7.5), la Row Level Security et la couche
d'accès typée par `orgId` (B1.7), le journal d'audit par déclencheur (B1.9).

## Dépend de

B1.1 (dépôt et outillage).
