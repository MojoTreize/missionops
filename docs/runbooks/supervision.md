# Runbook — Supervision

> Objectif : savoir qu'un problème existe avant que le client n'appelle.

## Sonde de santé

`GET /api/health` (`apps/web/app/api/health/route.ts`) exécute `select 1` sur la
base et répond :

- `200 {"status":"ok","database":"ok","latencyMs":n}` ;
- `503 {"status":"degraded","database":"unreachable"}` si la base ne répond pas
  (et écrit une ligne `health_check_failed` en erreur).

Elle ne révèle aucune information sensible et ne demande pas d'authentification.

Utilisations :

1. **Contrôle Fly.io** (`fly.toml`, `[[http_service.checks]]`) : toutes les
   30 s, délai 5 s, période de grâce 20 s au démarrage. Une machine en échec est
   retirée du routage.
2. **Sonde externe** (service de disponibilité hébergé en UE) : interroger
   l'URL publique toutes les minutes depuis au moins deux régions ; alerte après
   trois échecs consécutifs. C'est elle qui mesure la disponibilité réelle vue
   des utilisateurs.

## Journaux structurés

`apps/web/lib/server/log.ts` écrit **une ligne JSON par événement** sur la sortie
standard :

```json
{
  "ts": "2026-10-02T08:00:00.000Z",
  "level": "error",
  "event": "health_check_failed",
  "error": { "name": "…", "message": "…" }
}
```

- Niveaux : `debug`, `info`, `warn`, `error`.
- Jamais de données personnelles sensibles ni de secret dans les champs.
- Lecture : `flyctl logs --config fly.<env>.toml`, filtrable avec `jq` :
  `flyctl logs | grep '^{' | jq 'select(.level=="error")'`.
- Rétention : celle de Fly.io est courte ; pour `pilote` et `production`,
  expédier les journaux vers un collecteur en région UE (journal d'au moins
  30 jours).

## Alertes

| Alerte                    | Seuil                                                   | Gravité |
| ------------------------- | ------------------------------------------------------- | ------- |
| Sonde externe en échec    | 3 échecs consécutifs                                    | G1      |
| Taux d'erreurs 5xx        | > 2 % des requêtes sur 5 min                            | G2      |
| Latence                   | p95 > 2 s sur 10 min                                    | G2      |
| Échecs de synchronisation | part de `rejected` dans `/api/sync` (à instrumenter)    | G2      |
| Boîte d'envoi bloquée     | `notifications` `en_attente` en hausse continue sur 1 h | G3      |
| Tâche planifiée muette    | aucun appel réussi de `/api/cron` depuis 30 min         | G3      |
| Sauvegarde quotidienne    | code de sortie non nul de `scripts/backup.sh`           | G2      |
| Espace du volume `/data`  | > 80 % utilisé                                          | G2      |

Chaque alerte renvoie vers le runbook [incident](incident.md). Une alerte qui
se déclenche sans action possible doit être corrigée ou supprimée : une alerte
ignorée habitue à ignorer les alertes.

## Requêtes de contrôle utiles

```sql
-- File d'envoi
SELECT status, count(*) FROM notifications GROUP BY status;
-- Échecs récents
SELECT created_at, channel, template, last_error FROM notifications
WHERE status = 'echec' ORDER BY created_at DESC LIMIT 20;
-- Comptes bloqués par la limitation de débit de connexion
SELECT key, count, blocked_until FROM rate_limits WHERE count >= 5;
```

Ces requêtes s'exécutent hors contexte d'organisation : sous le rôle
applicatif, la RLS masque les tables métier. Les lancer avec un rôle
d'exploitation en lecture seule, jamais avec le rôle applicatif modifié.

## Charge

`scripts/load-test.mjs` mesure débit, taux d'erreur et latences p50/p95/p99 sur
des routes de lecture (par défaut `/api/health` et `/login`) :

```sh
BASE_URL=https://missionops-staging.fly.dev CONCURRENCY=50 DURATION_S=60 node scripts/load-test.mjs
```

À lancer sur `staging` uniquement, et à refaire après chaque changement de
taille de machine ou de base.
