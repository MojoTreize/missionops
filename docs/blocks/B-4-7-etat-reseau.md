# B4.7 — État du réseau et de la synchronisation

> **Statut : livré.**

## Objectif

L'utilisateur sait toujours si son travail est enregistré côté serveur.

## Contenu

- **Indicateur** `components/offline/network-status.tsx` : en ligne, hors
  ligne, synchronisation en cours, erreur (élément refusé), avec « N en attente
  d'envoi ».
- **Bouton « Synchroniser »** quand des éléments attendent et que le réseau
  est là.
- **Déclenchement automatique** (`use-sync.ts`) au retour du réseau
  (`online`) et au retour sur l'application (`focus`).
- **Liste des saisies locales** avec statut et réessai.

## Décisions appliquées

- État calculé par `networkState` (`packages/core/src/sync`), pur et testé.
- Messages par `t()`, sobres, jamais alarmants.

## Tests

Unitaires : résumé de file et état réseau déduit.

## Fini quand

Un utilisateur pilote répond correctement à « est-ce que ta dépense est
partie ? » sans appeler.

## Hors périmètre de ce bloc

Indicateur permanent dans la coque de toutes les pages (il est sur l'écran
Terrain).

## Dépend de

B4.6 (événements de mission).
