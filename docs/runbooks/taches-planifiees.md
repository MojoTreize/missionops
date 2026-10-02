# Runbook — Tâches planifiées

> Objectif : les rappels partent et la boîte d'envoi se vide, sans
> intervention.

## Ce que fait la tâche

Une seule route : `POST /api/cron` (`apps/web/app/api/cron/route.ts`). À chaque
appel, pour chaque organisation active (dans son propre contexte isolé, au nom
de son administrateur le plus ancien) :

1. **Rappels du jour** (B7.5, `packages/services/src/reminders.ts`) :
   - lendemain du retour de mission : penser à saisir ses dépenses ;
   - trois jours après le retour : rapport de mission attendu ;
   - validations en attente depuis plus de 48 h : rappel au validateur.
2. **Envoi de la boîte d'envoi** (B7.1) : les notifications `en_attente` partent
   sur leur canal (e-mail Resend, WhatsApp, SMS, ou console si le canal n'est pas
   configuré). Échec : nouvel essai avec un délai de 2^tentatives minutes,
   abandon après 5 tentatives (statut `echec`, motif dans `last_error`).

Chaque rappel porte une clé d'idempotence (`dedupe_key`) datée du jour : deux
exécutions rapprochées, ou un appel rejoué, n'envoient **jamais** de doublon.

Réponse : `{"organisations": n, "reminders": n, "sent": n, "failed": n}`.

## Fréquence et authentification

- **Toutes les 5 minutes.**
- En-tête obligatoire `Authorization: Bearer $CRON_SECRET`. Sans secret
  configuré côté serveur, la route refuse tout appel (401). Comparaison à temps
  constant.

## Mise en place

N'importe quel ordonnanceur capable d'un `POST` HTTPS convient. Exemple avec
`curl` :

```sh
curl -fsS -X POST \
  -H "Authorization: Bearer $CRON_SECRET" \
  https://missionops-staging.fly.dev/api/cron
```

Options, de la plus simple à la plus robuste :

1. **crontab** d'une machine d'exploitation :
   `*/5 * * * * curl -fsS -X POST -H "Authorization: Bearer $CRON_SECRET" https://<app>/api/cron >/dev/null`
2. **GitHub Actions** (`on: schedule: - cron: "*/5 * * * *"`) avec le secret
   d'environnement `CRON_SECRET`. Attention : GitHub ne garantit pas la
   ponctualité et peut sauter des exécutions aux heures chargées.
3. **Machine planifiée Fly.io** (`fly machine run … --schedule`) qui exécute le
   même `curl`.

Avec `auto_stop_machines`, l'appel réveille l'application : prévoir un délai
d'attente `curl` d'au moins 30 s (`--max-time 30`).

## Vérifier

- La réponse JSON est renvoyée avec le code 200.
- En base, la file ne grossit pas :
  `SELECT status, count(*) FROM notifications GROUP BY status;`
  (`en_attente` doit rester faible et stable).
- Les lignes `echec` récentes ont un `last_error` explicite.

## Dépannage

| Symptôme                      | Cause probable                                       | Action                                                               |
| ----------------------------- | ---------------------------------------------------- | -------------------------------------------------------------------- |
| 401                           | secret absent ou différent côté serveur/ordonnanceur | `fly secrets list`, réaligner le secret (voir [secrets](secrets.md)) |
| `sent: 0` et file qui grossit | canal non configuré : envoi en console               | vérifier `RESEND_API_KEY` et `MAIL_FROM`                             |
| beaucoup d'`echec`            | fournisseur en panne ou adresse refusée              | lire `last_error` ; une erreur 4xx ne se corrige pas seule           |
| aucun rappel                  | aucune organisation avec administrateur actif        | normal en staging vide                                               |

Couper temporairement les envois : suspendre l'ordonnanceur. Rien n'est perdu,
les notifications attendent dans la file.
