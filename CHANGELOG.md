# Journal des versions

Toutes les modifications notables sont consignées ici. Une ligne par bloc fusionné,
conformément à la définition de « terminé » du plan (section 4.3).

## [Non publié]

### Ajouté

- B1.1 — Dépôt et outillage : monorepo pnpm + Turborepo, TypeScript strict,
  ESLint, Prettier, structure de dossiers, `CLAUDE.md`, documentation et
  modèles d'issue/PR.
- B1.2 — Intégration continue : workflow GitHub Actions `ci.yml` (format, types,
  lint, tests, build) déclenché sur chaque PR, cache pnpm, garde-fou de 10 min,
  contrôle requis sur `main`.
- B1.3 — Base de données et migrations : Drizzle ORM dans `packages/db`,
  première migration (`organisations`, `users`), scripts `db:generate` /
  `db:migrate` / `db:reset` / `db:check` / `db:studio`, Postgres local
  (`docker-compose`) et en service dans la CI, validation hors ligne via PGlite,
  conventions de nommage documentées.
