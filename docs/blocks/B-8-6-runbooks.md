# B8.6 — Runbooks

> **Statut : livré** (rédaction) ; chaque runbook reste à faire suivre par
> quelqu'un qui ne l'a pas écrit.

## Objectif

N'importe qui dans l'équipe peut gérer un incident à 3 heures du matin.

## Contenu

`docs/runbooks/` :

- `deploiement.md` : staging, pilote, production, migrations, retour arrière ;
- `sauvegarde-restauration.md` : sauvegarde, restauration, test mensuel ;
- `incident.md` : gravité, premiers gestes, communication client,
  post-mortem ;
- `taches-planifiees.md` : `POST /api/cron` toutes les 5 minutes ;
- `secrets.md` : inventaire, rotation, fuite, révocation d'accès ;
- `nouvelle-organisation.md` : installation d'un client ;
- `supervision.md` : sonde de santé, journaux JSON, alertes.

## Décisions appliquées

- Aucune valeur de secret dans les runbooks.

## Tests

Un membre de l'équipe exécute un runbook sans aide et signale ce qui manque.

## Fini quand

Chaque runbook a été suivi au moins une fois par quelqu'un qui ne l'a pas écrit.

## Hors périmètre de ce bloc

Procédure d'astreinte (rotation des personnes) · migration risquée détaillée
au-delà de la section du runbook de déploiement.

## Dépend de

B8.5 (sauvegardes).
