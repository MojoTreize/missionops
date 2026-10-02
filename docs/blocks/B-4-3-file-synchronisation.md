# B4.3 — File de synchronisation

> **Statut : livré.**

## Objectif

Ce qui est créé hors ligne remonte, exactement une fois.

## Contenu

- **Logique pure** `packages/core/src/sync` : `retryDelayMs` (5 s, 10 s,
  20 s… plafonné à 10 min), `dueEntries`, `batches`, `outcomeToStatus`
  (doublon = succès), `summarize`, `networkState`.
- **Moteur navigateur** `apps/web/lib/offline/sync.ts` : envoi de la file par
  lots de 20, dans l'ordre de création, vers `POST /api/sync` ; puis envoi des
  photos dont la dépense est arrivée. Coupure réseau : le lot repart en attente
  avec délai croissant.
- **Serveur** `processSyncBatch` (`packages/services/src/field.ts`) : lot de 1
  à 50 éléments validé par Zod (`syncBatch`), chaque élément traité
  indépendamment, réponse `created`, `duplicate` ou `rejected` avec code.
- **File d'échecs** visible sur l'écran Terrain, avec réessai manuel.

## Décisions appliquées

- ADR-003 : créations seulement, UUID client, idempotence.

## Tests

Unitaires : délais exponentiels plafonnés, éléments dus, lots, doublon traité
comme un succès. Intégration : dépenses idempotentes et rejeu d'un lot.

## Fini quand

50 opérations créées hors ligne remontent en exactement 50 enregistrements
(campagne B4.8).

## Hors périmètre de ce bloc

Modification ou suppression hors ligne (exclues par ADR-003).

## Dépend de

B4.2 (persistance locale).
