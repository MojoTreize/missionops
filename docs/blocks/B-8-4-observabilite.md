# B8.4 — Observabilité

> **Statut : partiel.**

## Objectif

Savoir qu'un problème existe avant que le client n'appelle.

## Contenu

- **Sonde `GET /api/health`** : `select 1` sur la base, `200 ok` ou
  `503 degraded`, sans information sensible ; branchée sur les contrôles Fly.io
  (`fly.toml`, toutes les 30 s).
- **Journaux structurés** `apps/web/lib/server/log.ts` : une ligne JSON par
  événement (`ts`, `level`, `event`, champs), erreurs sérialisées ; utilisés
  par les erreurs d'API et la sonde.
- **Runbook** `docs/runbooks/supervision.md` : sonde externe, alertes, requêtes
  de contrôle.

## Décisions appliquées

- Jamais de données personnelles sensibles ni de secret dans les journaux.

## Tests

E2E : la sonde de santé répond.

## Fini quand

Une alerte a réellement prévenu d'un incident avant le client.

## Hors périmètre de ce bloc

À faire : Sentry en région UE avec l'organisation concernée, métriques
applicatives, tableau de bord de disponibilité, alertes sur taux d'erreur,
latence et échecs de synchronisation.

## Dépend de

B8.3 (sécurité applicative).
