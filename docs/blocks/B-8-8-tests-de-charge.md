# B8.8 — Tests de charge

> **Statut : partiel.**

## Objectif

Connaître ses limites avant de les atteindre.

## Contenu

- **`scripts/load-test.mjs`** : Node 22 sans dépendance (`fetch` global),
  requêtes GET de lecture uniquement sur `BASE_URL` (par défaut `/api/health`
  et `/login`, configurable par `PATHS`), `CONCURRENCY` clients pendant
  `DURATION_S` secondes, en-tête `COOKIE` facultatif pour des pages
  authentifiées. Affiche requêtes, débit, taux d'erreur et latences p50, p95,
  p99 par chemin ; code de sortie 1 au-delà de `MAX_ERROR_RATE`.
- À lancer contre `staging` uniquement (voir `docs/runbooks/supervision.md`).

## Décisions appliquées

- Sans écriture : le script ne crée aucune donnée et peut tourner sans risque.

## Tests

Vérification syntaxique (`node --check`) et exécution contre un serveur local.

## Fini quand

`docs/adr/capacite.md` documente les limites connues et le plan de croissance.

## Hors périmètre de ce bloc

À faire : scénarios du plan (50 organisations, 500 utilisateurs actifs, 5 000
missions par mois, pic de 200 appareils synchronisant en même temps), qui
demandent un seed de charge et des écritures sur `/api/sync`.

## Dépend de

B8.7 (conformité).
