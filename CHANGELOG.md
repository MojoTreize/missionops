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
- B1.8 — Rôles et permissions : six rôles de base (Collaborateur, Manager,
  Logisticien, Finance, Directeur pays, Administrateur), matrice de permissions
  et fonction pure `can(user, action, resource)` dans `@missionops/core/policy`,
  garde serveur (`requireCan`, `getActor`) avec page `/forbidden` et masquage
  côté interface, invitation de membre soumise au droit `member:create` avec les
  six rôles assignables, table de vérité exhaustive rôle × ressource × action
  testée intégralement (293 cas).
- B1.9 — Journal d'audit : table `audit_log` en écriture seule (ADR-004),
  déclencheur PostgreSQL générique `audit_row_change` attaché aux tables métier
  via `enable_audit`, capture des valeurs avant/après en JSONB, contexte acteur
  et adresse IP transmis par `withTenant` (`app.current_actor`,
  `app.current_ip`), isolation multi-tenant du journal, immutabilité garantie
  par déclencheur et retrait des droits `UPDATE`/`DELETE`, tests d'intégration
  (PGlite) : chaque mutation produit une ligne correcte, une modification directe
  en SQL est journalisée, toute altération du journal échoue.
- B1.10 — Coque applicative : navigation adaptée à l'appareil à partir d'une
  configuration unique (`lib/nav`) — barre latérale, fil d'Ariane et recherche
  globale (Ctrl/⌘ + K) sur ordinateur ; en-tête compact, barre d'onglets basse à
  quatre entrées et menu compte sur mobile ; pages `/missions`, `/expenses`,
  `/reports` (états vides), états de chargement (`loading`), frontière d'erreur
  (`error`) et page 404 globale (`not-found`) ; test unitaire de la
  configuration de navigation et du fil d'Ariane.
- B1.11 — Internationalisation : bibliothèque i18n légère et sans dépendance
  (catalogues français et anglais typés, traducteur à clés « à points » avec
  interpolation, formats de date et de nombre via `Intl`), français par défaut,
  langue mémorisée dans un cookie lu côté serveur (`I18nProvider`, `getT`,
  `useT`), sélecteur de langue dans le profil (`/profile`), refonte des libellés
  de navigation en clés de traduction, traduction de tous les écrans et messages
  d'action serveur, règle ESLint `react/jsx-no-literals` interdisant les chaînes
  littérales dans le JSX de l'application web, test de parité garantissant
  l'absence de clé manquante entre les deux langues.
- B1.12 — Seed de démonstration et staging : script `db:seed:demo`
  (`packages/db/src/seed-demo.ts`) reconstruisant en une commande une base
  réaliste ancrée dans le contexte guinéen — deux organisations (dont une
  seconde pour éprouver l'isolation), douze utilisateurs couvrant les six rôles,
  appartenances et invitations en attente — idempotente et utilisable via
  `pnpm db:reset && pnpm db:seed:demo` ; sortie autonome Next.js conditionnelle
  (`BUILD_STANDALONE`), `Dockerfile` multi-étage et `.dockerignore`, `fly.toml`
  (staging Fly.io, région UE) et workflow `deploy.yml` (migrations puis
  déploiement sur fusion dans `main`), documentation des secrets dans
  `.env.example`. Le déploiement reste inactif tant que la facturation CI et les
  secrets Fly ne sont pas configurés.
