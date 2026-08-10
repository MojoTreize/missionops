# @missionops/db

Seule couche autorisée à parler à PostgreSQL. Drizzle ORM : schéma, migrations,
client. Depuis le bloc B1.7, chaque requête métier passe par `withTenant(orgId,
…)` qui exige un `orgId` typé, non optionnel (ADR-001), et une règle ESLint
interdit d'importer `postgres`, Drizzle ou PGlite hors de ce paquet.

## Contenu

- `src/schema/` — tables et types (`organisations`, `users`, …).
- `src/client.ts` — fabrique du client (`createDbClient`).
- `src/tenant.ts` — couche d'accès multi-tenant (`withTenant`) : ouvre une
  transaction et fixe `app.current_org` pour la Row Level Security (B1.7).
- `src/migrate.ts` — applique les migrations en attente.
- `src/reset.ts` — réinitialise le schéma public puis rejoue les migrations
  (développement et CI uniquement).
- `src/seed.ts` — insère un jeu de démonstration (organisation + utilisateur).
- `migrations/` — SQL versionné généré par Drizzle Kit. **Ne jamais éditer à la
  main** : modifier le schéma puis régénérer.
- `drizzle.config.ts` — configuration Drizzle Kit.

## Commandes

Depuis la racine du dépôt :

| Commande           | Effet                                                            |
| ------------------ | ---------------------------------------------------------------- |
| `pnpm db:generate` | Génère une migration SQL à partir du schéma (hors ligne)         |
| `pnpm db:migrate`  | Applique les migrations en attente                               |
| `pnpm db:reset`    | Réinitialise la base puis rejoue toutes les migrations           |
| `pnpm db:check`    | Reconstruit la base depuis zéro en mémoire (PGlite), sans Docker |
| `pnpm db:seed`     | Insère un jeu de démonstration (organisation + utilisateur)      |
| `pnpm db:studio`   | Ouvre Drizzle Studio                                             |

## Base locale

```bash
docker compose up -d          # Postgres 16 sur localhost:5432
cp .env.example .env          # DATABASE_URL déjà renseignée pour ce Postgres
pnpm db:reset                 # reconstruit la base depuis zéro
```

## Conventions de nommage

- Tables au pluriel, en anglais, en `snake_case` ; colonnes en `snake_case`.
- Identifiants : `uuid` avec `gen_random_uuid()`.
- Instants en `timestamptz` ; dates seules en `date`.
- Montants : suffixe `_minor` (entier) + colonne `_currency` associée (ADR-002).
- Suppression logique : colonne `deleted_at` partout (ADR-005) ; pas de `DELETE`
  physique sur les données métier.
- Pas d'`enum` PostgreSQL : des tables de référence (un `enum` migre mal).
- Colonnes obligatoires des tables métier (à partir de B1.6) : `id`,
  `organisation_id`, `created_at`, `created_by`, `updated_at`, `updated_by`,
  `deleted_at`, avec l'index `(organisation_id, created_at desc) where deleted_at is null`.
- `organisations` et `users` sont des tables fondatrices : pas d'`organisation_id`.
- Isolation multi-tenant (B1.7) : chaque nouvelle table métier appelle
  `SELECT enable_org_rls('ma_table');` dans sa migration, et toute requête passe
  par `withTenant`. Le test d'isolation générique (`tests/isolation.test.ts`)
  échoue si une table métier oublie `organisation_id` ou la politique.
