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
- B1.4 — Jetons de design et primitives : Tailwind CSS avec palette, typographie,
  espacement, rayons et ombres en variables CSS ; primitives Button, Input,
  Select, Dialog, Sheet, Table, Badge, Toast, EmptyState, Skeleton et
  MoneyDisplay ; page `/kitchen-sink` responsive (375px et 1440px), navigable au
  clavier.
- B1.5 — Authentification et session : connexion par lien magique et par mot de
  passe (scrypt), sessions en cookies `httpOnly` (jetons hachés en base),
  réinitialisation de mot de passe, limitation de débit de la connexion,
  middleware et garde serveur des routes `(app)`, écrans `/login`,
  `/forgot-password`, `/reset-password`, script `db:seed`, tests unitaires
  (Vitest) de la logique d'auth.
- B1.6 — Organisations et appartenances : tables `memberships` et `invitations`,
  colonne `users.current_organisation_id` pour l'organisation active persistée,
  création d'organisation (avec adhésion administrateur), invitation d'un membre
  par e-mail à usage unique et acceptation, sélecteur d'organisation dans
  l'en-tête, résolution serveur de l'organisation active, écrans
  `/organizations/new` et `/organizations/members`, tests unitaires du slug et de
  la résolution de l'organisation active.
- B1.7 — Isolation multi-tenant : Row Level Security en base (fonction
  réutilisable `enable_org_rls`, politique `org_isolation` fondée sur le
  paramètre de session `app.current_org`), couche d'accès `withTenant` exigeant
  un `orgId` obligatoire, règle ESLint interdisant l'instanciation du client de
  base hors de `packages/db`, et test d'intégration générique (PGlite) vérifiant,
  sous un rôle non privilégié, qu'aucune organisation ne voit ni n'écrit les
  données d'une autre.
