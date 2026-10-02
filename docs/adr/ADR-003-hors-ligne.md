# ADR-003 — Hors ligne restreint aux créations

- **Statut** : acceptée
- **Bloc** : B4.3 (file de synchronisation), appliquée en B4.4 à B4.7
- **Date** : rédigée a posteriori, après fusion de la Phase 4

## Contexte

Les équipes terrain travaillent sur des Android d'entrée de gamme, en 3G
instable, et passent des journées entières sans réseau entre Conakry et
l'intérieur du pays. Elles doivent pouvoir saisir une dépense, photographier un
reçu et signaler leur départ ou leur arrivée sans connexion.

La synchronisation bidirectionnelle complète est le piège technique classique :
conflits de modification, fusions impossibles à reproduire, des mois de
travail. Or les opérations qui se font réellement sur le terrain sont presque
toutes des créations.

## Décision

1. **Le hors ligne ne couvre que des créations** : dépenses, événements de
   mission (départ, arrivée, point d'étape, incident, retour) et photos de
   justificatifs. Une création ne peut pas entrer en conflit avec une autre.
   Validations, budgets, avances, réconciliation et rapports de coûts restent
   en ligne : ils se font au bureau.
2. **UUID généré côté client.** Chaque élément reçoit son identifiant sur le
   téléphone (`crypto.randomUUID()`). Le serveur l'utilise comme clé primaire :
   un élément déjà reçu renvoie `duplicate` sans rien modifier. L'envoi est
   idempotent, un renvoi après coupure ne crée pas de doublon.
3. **Persistance locale dans IndexedDB via Dexie** (`apps/web/lib/offline/db.ts`,
   base `missionops-terrain`) : magasin `bootstrap` (missions de l'utilisateur,
   catégories, devise de base), `outbox` (créations en attente) et `photos`
   (justificatifs compressés). Jamais `localStorage` pour des données métier.
4. **Envoi par lots** : la file part vers `POST /api/sync` par lots de 20
   (le serveur en accepte 50), dans l'ordre de création. Chaque élément du lot
   est traité indépendamment et reçoit `created`, `duplicate` ou `rejected`.
   Les photos partent ensuite, une par une, vers `POST /api/receipts`
   (`multipart/form-data`, champs `meta` et `file`), une fois leur dépense
   arrivée côté serveur. Le serveur vérifie la taille et la somme SHA-256
   annoncées avant d'écrire le fichier.
5. **Logique de file pure** dans `packages/core/src/sync` : délai de reprise
   exponentiel (5 s, 10 s, 20 s… plafonné à 10 min), sélection des éléments dus,
   découpage en lots, interprétation de la réponse (un doublon est un succès,
   un refus est définitif et affiché), état réseau affiché.
6. **Service worker** (`apps/web/public/sw.js`) : cache d'abord pour les
   ressources statiques versionnées, réseau d'abord avec repli sur le cache puis
   sur `/offline` pour les navigations, réseau seul pour l'API sauf
   `GET /api/terrain` (réseau d'abord, repli sur le cache). Les écritures ne
   passent jamais par le service worker.

## Conséquences

- **Conversion de devise différée** : une dépense saisie hors ligne est
  convertie côté serveur, à la réception, au taux en vigueur à sa date de
  dépense (ADR-002). Le téléphone n'a pas besoin de connaître les taux.
- **Traçabilité** : `expenses.created_offline` et `client_created_at`
  conservent l'origine et l'heure réelle de saisie.
- **Refus visibles** : un élément refusé par le serveur (mission close, montant
  invalide) reste dans la file locale avec son motif et un bouton de réessai ;
  il n'est jamais supprimé en silence.
- **Isolation** : la file est filtrée par `organisationId` ; un changement
  d'organisation active n'envoie pas les éléments d'une organisation vers une
  autre.
- **Ce qui n'est pas hors ligne doit le dire** : une navigation vers un écran
  de bureau jamais mis en cache aboutit à la page `/offline`, qui renvoie vers
  l'écran Terrain, plutôt qu'à une erreur du navigateur.

## Alternatives écartées

- **Synchronisation bidirectionnelle complète** (CRDT, journal d'opérations
  rejouable) : coût et risque hors de proportion avec le besoin réel.
- **Solution clé en main** (PouchDB/CouchDB, bases synchronisées propriétaires)
  : impose un second moteur de données à côté de PostgreSQL et casse ADR-001.
- **Identifiants attribués par le serveur** : obligent à une étape de
  rapprochement et rendent les renvois non idempotents.
- **Background Sync du service worker** : support inégal selon les navigateurs
  Android ; la file applicative fonctionne partout et reste testable.
