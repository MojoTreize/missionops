# B8.1 — Performance en conditions réelles

> **Statut : livré** pour le budget JavaScript ; la mesure 3G sur le vrai
> téléphone reste à faire avec le pilote.

## Objectif

L'application reste utilisable sur un téléphone d'entrée de gamme en 3G.

## Contenu

- **Déjà en place** : découpage du code par route (App Router), rendu serveur
  des écrans de bureau, écran Terrain servi depuis le cache du service worker,
  référentiel géographique embarqué (aucun aller-retour), photos compressées à
  200–400 Ko (ADR-007), lots de synchronisation de 20 éléments.
- **Index** : chaque index métier commence par `organisation_id` (ADR-001).
- **Budget JavaScript** : `apps/web/scripts/check-bundle.mjs` additionne le
  JavaScript initial gzippé de chaque page (layouts compris) et échoue au-delà
  de 200 Ko ; étape bloquante de la CI après le build. Page la plus lourde :
  l'écran Terrain (~197 Ko, Dexie et Zod compris).
- **À faire** : premier affichage utile en moins de 3 s en 3G bridée mesuré
  sur le vrai téléphone ; analyse des plans d'exécution sur données pilote.

## Décisions appliquées

- Pas de bibliothèque d'interface lourde ; graphiques en CSS
  (`bar-list.tsx`).

## Tests

Budget JavaScript bloquant en CI (`pnpm --filter @missionops/web check:bundle`).
Lighthouse en CI : non retenu pour l'instant (dépendance lourde) ; à revoir.

## Fini quand

Les seuils sont atteints et verrouillés en CI.

## Hors périmètre de ce bloc

Tests de charge serveur (B8.8).

## Dépend de

B7.5.
