# B8.1 — Performance en conditions réelles

> **Statut : partiel.** Les choix d'architecture sont faits ; les budgets ne
> sont pas encore mesurés ni verrouillés en CI.

## Objectif

L'application reste utilisable sur un téléphone d'entrée de gamme en 3G.

## Contenu

- **Déjà en place** : découpage du code par route (App Router), rendu serveur
  des écrans de bureau, écran Terrain servi depuis le cache du service worker,
  référentiel géographique embarqué (aucun aller-retour), photos compressées à
  200–400 Ko (ADR-007), lots de synchronisation de 20 éléments.
- **Index** : chaque index métier commence par `organisation_id` (ADR-001).
- **À faire** : budget de moins de 200 Ko de JavaScript initial et premier
  affichage utile en moins de 3 s en 3G bridée ; analyse des plans d'exécution
  et des requêtes N+1 ; mesure sur le vrai téléphone de test.

## Décisions appliquées

- Pas de bibliothèque d'interface lourde ; graphiques en CSS
  (`bar-list.tsx`).

## Tests

À faire : Lighthouse en CI avec seuil bloquant, `size-limit` bloquant.

## Fini quand

Les seuils sont atteints et verrouillés en CI.

## Hors périmètre de ce bloc

Tests de charge serveur (B8.8).

## Dépend de

B7.5.
