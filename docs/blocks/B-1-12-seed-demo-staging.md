# B1.12 — Seed de démonstration et staging

## Objectif

Disposer d'une base de démonstration réaliste, reconstructible en une seule
commande, et d'un environnement de validation (staging) déployé automatiquement
sur fusion dans `main`. On peut faire une démonstration à un prospect depuis le
staging, sur son téléphone, sans préparation.

## Contenu

- **Seed de démonstration** (`packages/db/src/seed-demo.ts`, script
  `db:seed:demo`) : construit un jeu de données ancré dans le contexte guinéen.
  - Deux organisations : « Croix-Rouge Guinée » (équipe complète) et « Médecins
    du Monde Guinée » (seconde organisation, pour éprouver l'isolation
    multi-tenant en démonstration).
  - Douze utilisateurs couvrant les six rôles (Administrateur, Directeur pays,
    Manager, Finance, Logisticien, Collaborateur), tous avec le même mot de passe
    de démonstration.
  - Appartenances (`memberships`) reliant chaque utilisateur à son organisation,
    organisation active positionnée, et deux invitations en attente pour peupler
    l'écran des membres.
  - Idempotent : si l'organisation pilote existe déjà, le seed s'arrête sans rien
    dupliquer. Flux recommandé : `pnpm db:reset && pnpm db:seed:demo`.
- **Sortie autonome conditionnelle** (`apps/web/next.config.mjs`) : `output:
"standalone"` activé uniquement quand `BUILD_STANDALONE=1` (image Docker), afin
  de ne pas casser le build local Windows ni la CI (les liens symboliques de la
  sortie autonome exigent un privilège absent sous Windows).
- **Image Docker** (`Dockerfile` multi-étage + `.dockerignore`) : build pnpm dans
  le monorepo, puis image d'exécution minimale (`node:22-alpine`, utilisateur non
  privilégié) n'embarquant que la sortie autonome, les fichiers statiques et
  `public/`.
- **Staging Fly.io** (`fly.toml`) : application `missionops-staging`, région UE
  (`cdg`), service HTTP en HTTPS, machines à l'arrêt automatique.
- **Déploiement continu** (`.github/workflows/deploy.yml`) : sur `push` vers
  `main`, applique les migrations (`db:migrate`) puis déploie (`flyctl deploy`).
- **Secrets documentés** (`.env.example`) : secrets GitHub
  (`STAGING_DATABASE_URL`, `FLY_API_TOKEN`) et secrets Fly (`DATABASE_URL`,
  `NEXT_PUBLIC_APP_URL`).

## Décisions appliquées

- Staging conteneurisé sur Fly.io (Docker), région UE, cohérent avec le stockage
  et l'hébergement de données décrits au plan.
- Migrations jouées par le workflow avant `fly deploy`, pas par un
  `release_command` : l'image d'exécution reste minimale (ni `tsx` ni scripts de
  migration).
- Seed volontairement limité aux tables du socle (organisations, utilisateurs,
  appartenances, invitations) et conçu pour être étendu : missions, dépenses et
  photos du §9.3 du plan viendront quand leurs tables existeront (Phase 2+).

## Tests

- Hors ligne : typecheck, lint, tests (35 web + 293 core + 10 db) et build local
  (non autonome) au vert. Le script `seed-demo.ts` est couvert par le typecheck
  et le lint du paquet `@missionops/db`.
- Le test « live » du seed (`pnpm db:reset && pnpm db:seed:demo`) requiert un
  Postgres accessible ; validé structurellement ici, à exécuter sur un
  environnement doté d'une base.

## Fini quand

`pnpm db:reset && pnpm db:seed:demo` reconstruit la base de démonstration, et une
fusion dans `main` déclenche migrations puis déploiement sur staging.

## Hors périmètre de ce bloc

Le déploiement reste inactif tant que la facturation CI et les secrets Fly
(`STAGING_DATABASE_URL`, `FLY_API_TOKEN`, secrets Fly de l'application) ne sont
pas configurés : l'échafaudage est en place et prêt à s'activer. Le seed ne
couvre pas encore les missions, dépenses et justificatifs (tables absentes du
socle).

## Dépend de

B1.6 (organisations et appartenances), B1.8 (rôles), B1.3 (migrations).
