# ADR-001 — Multi-tenant par colonne partagée

- **Statut** : acceptée
- **Bloc** : B1.7 (isolation multi-tenant)
- **Date** : rédigée a posteriori, après fusion de B1.7

## Contexte

MissionOps héberge plusieurs organisations (ONG, ambassades, entreprises) dans
un même déploiement. Une fuite de données d'une organisation vers une autre
serait fatale commercialement : on vend de la confidentialité et de la
traçabilité à des structures qui rendent des comptes à des bailleurs.

Trois options classiques :

1. une base par organisation ;
2. un schéma PostgreSQL par organisation ;
3. une base et un schéma uniques, chaque ligne portant `organisation_id`.

## Décision

**Option 3, avec une défense en profondeur à deux niveaux.**

1. **En base : Row Level Security.** La fonction réutilisable
   `enable_org_rls(regclass)` (migration `0003_org_rls_isolation.sql`) active et
   _force_ la RLS (elle s'applique aussi au propriétaire de la table) et pose la
   politique `org_isolation`, qui n'expose que les lignes dont `organisation_id`
   vaut le paramètre de session `app.current_org`.
2. **Dans l'application : `withTenant`.** Toute requête métier passe par
   `withTenant(db, { organisationId, … }, fn)` (`packages/db/src/tenant.ts`),
   qui ouvre une transaction et fixe `app.current_org` _localement à la
   transaction_ (jamais partagé entre requêtes du pool). `organisationId` est un
   champ obligatoire : le typage refuse une requête sans organisation.
3. **Frontière imposée par ESLint.** `no-restricted-imports` interdit d'importer
   le driver `postgres`, Drizzle ou PGlite hors de `packages/db`.

## Conséquences

- **Une seule base à migrer, sauvegarder et superviser**, quel que soit le
  nombre de clients. Coût d'exploitation minimal pour une petite équipe.
- **La RLS n'agit que sous un rôle non superutilisateur.** Le rôle applicatif de
  production ne doit être ni superutilisateur ni `BYPASSRLS`. Le test
  d'isolation (`packages/db/tests/isolation.test.ts`) s'exécute volontairement
  sous un rôle non privilégié pour le prouver.
- **Toute nouvelle table métier** doit porter `organisation_id` et appeler
  `SELECT enable_org_rls('ma_table');` dans sa migration. Le volet structurel du
  test d'isolation fait échouer la CI sinon.
- **Exceptions assumées** : les tables d'identité et de routage
  (`organisations`, `users`, `sessions`, `auth_tokens`, `memberships`,
  `invitations`) précèdent le choix d'une organisation et ne sont pas soumises à
  `org_isolation`. Leur accès est contrôlé par l'application (session, policy).
- **Index** : chaque index d'une table métier commence par `organisation_id`
  (index composé `(organisation_id, …)`), pour que le filtre RLS reste bon
  marché. À vérifier à chaque revue de migration.
- **Exporter ou supprimer un client** (B6.7) est un filtrage, pas un
  `DROP DATABASE` : c'est plus lent, mais cohérent avec ADR-005.

## Alternatives écartées

- **Une base par organisation** : isolation maximale, mais migrations,
  sauvegardes et connexions multipliées par le nombre de clients. Hors de portée
  d'une équipe de un à quatre développeurs.
- **Un schéma par organisation** : mêmes coûts de migration, et Drizzle gère mal
  les schémas dynamiques.
- **Filtrage applicatif seul** (sans RLS) : un seul `where` oublié suffit à
  fuiter. Inacceptable.
