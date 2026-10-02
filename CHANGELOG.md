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
- Correctif outillage : `allowBuilds` (esbuild, sharp) pour pnpm 11 ; `db:reset`
  supprime aussi le journal des migrations Drizzle.
- Phase 2 — Missions et validation : référentiel géographique national embarqué
  et recherche insensible aux accents, lieux d'organisation (B2.1) ; machine à
  états explicite à erreurs nommées (B2.2) ; demande de mission (B2.3) ;
  participants (B2.4) ; circuit de validation configurable à seuils et
  séparation des tâches (B2.5) ; file de validation (B2.6) ; liste et calendrier
  (B2.7) ; modification avec revalidation, annulation motivée (B2.8) ;
  notifications enfilées dans la transaction (B2.9).
- Phase 3 — L'argent : type `Money` en bigint et taux figés à l'échelle 10^10
  (B3.1, B3.2) ; budget prévisionnel multi-devises (B3.3) ; avances à écriture
  inverse et plafond de 120 % (B3.4) ; dépenses idempotentes (B3.5) ;
  justificatifs avec somme de contrôle (B3.6) ; suivi budgétaire (B3.7) ;
  réconciliation (B3.8) ; écarts justifiés (B3.9) ; validation financière et
  clôture (B3.10).
- Phase 4 — Terrain et hors ligne : PWA installable et service worker (B4.1) ;
  IndexedDB via Dexie (B4.2) ; file de synchronisation idempotente (B4.3) ;
  dépense et photo compressée hors ligne (B4.4, B4.5) ; événements de mission
  (B4.6) ; indicateur réseau (B4.7) ; parcours E2E hors ligne (B4.8).
- Phase 5 — Documents : moteur PDF déterministe (B5.1) ; modèles par
  organisation (B5.2) ; ordre de mission (B5.3) ; Mission Pack (B5.5) ; rapport
  de mission (B5.6) ; Closure Pack avec empreintes SHA-256 et annexe des
  justificatifs, versions immuables (B5.7).
- Phase 6 — Rapports, audit, exports : journal d'audit consultable (B6.1) ;
  tableau de bord par rôle (B6.2) ; rapports de coûts (B6.3) ; export comptable
  CSV (B6.4) ; recherche globale (B6.5) ; archivage (B6.6) ; export intégral
  JSON (B6.7).
- Phase 7 — Communication : abstraction des canaux (B7.1) ; e-mail
  transactionnel via Resend (B7.2) ; WhatsApp Business par modèle (B7.3) ;
  préférences (B7.4) ; rappels automatiques et tâche planifiée (B7.5).
- Phase 8 — Durcissement : en-têtes de sécurité et limitation de débit partagée
  (B8.3) ; lien d'évitement (B8.2) ; journaux JSON et sonde de santé (B8.4) ;
  scripts de sauvegarde et de restauration (B8.5) ; runbooks (B8.6) ;
  documentation de conformité (B8.7) ; script de charge (B8.8).
- Phase 9 — Échelle commerciale : inscription en libre-service et essai (B9.1) ;
  paramétrage de l'organisation (B9.2) ; imports CSV (B9.3) ; abonnements et
  places (B9.4) ; aide (B9.5) ; console d'administration interne (B9.6) et
  indicateurs d'usage (B9.7).
- Tests : 600+ tests unitaires du domaine, tests d'intégration PGlite de la
  boucle complète sous RLS, 7 parcours Playwright dont la boucle complète hors
  ligne ; job E2E en CI.
- Compléments : bande de mission à l'écran et dans les documents (B5.4) ;
  demande de modification et validation par lot (B2.6) ; recherche insensible
  aux accents (B6.5) ; couverture 100 % bloquante et tests de propriétés sur
  l'argent, règle ESLint « jamais de number pour un montant » (B3.1) ;
  axe-core bloquant et contrastes AA (B8.2) ; budget JavaScript bloquant
  (B8.1) ; campagne hors ligne automatisée (B4.8).
- Sécurité : Next.js 15.5.27, drizzle-orm 0.45, surcharges sharp, postcss,
  nanoid (`pnpm audit --prod` propre) ; CodeQL et audit en CI ; limitation de
  débit des routes de synchronisation ; remontée d'erreurs Sentry sans SDK ;
  tâche planifiée déclenchée par GitHub Actions.
- Refonte visuelle : nouveau logo et icônes, typographies Inter et Source Serif
  4, barre latérale sombre groupée, tableau de bord à indicateurs, connexion en
  deux panneaux, cartes et titres harmonisés ; page d'accueil publique
  bilingue sans JavaScript client ; corrections issues du test en direct
  (fiche mission à 375 px, calendrier mobile, libellés du journal d'audit,
  contrastes AA) ; contrôle axe-core de la page d'accueil (16 parcours
  Playwright).
- Démarrage local en une commande sans Docker : `scripts/demarrer.cmd`
  (Windows) et `scripts/demarrer.sh` (macOS, Linux).
