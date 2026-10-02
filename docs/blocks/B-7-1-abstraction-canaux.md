# B7.1 — Abstraction des canaux

> **Statut : livré.**

## Objectif

Le code métier ne sait pas par quel canal part une notification.

## Contenu

- **`packages/notifications`** : interface `Channel` (`send(message)`) et
  implémentations `ResendEmailChannel`, `WhatsAppChannel`, `HttpSmsChannel` et
  `ConsoleChannel` (journalise au lieu d'envoyer). `channelsFromEnv` choisit
  l'implémentation selon les variables configurées, avec repli sur la console.
- **`DeliveryError`** avec indicateur d'erreur définitive (adresse refusée)
  ou temporaire.
- **Boîte d'envoi** (`notifications`, B2.9) dépilée par `dispatchOutbox` :
  délai de 2^tentatives minutes entre deux essais, abandon après 5 tentatives
  (`echec`, motif dans `last_error`).
- **Envoyeur** `apps/web/lib/server/notify.ts` : rend le modèle dans la langue
  du destinataire et ajoute le lien vers la mission. Appelé par la tâche
  planifiée `POST /api/cron`.

## Décisions appliquées

- Aucun appel direct à un fournisseur hors de ce paquet.
- Modèles nommés (`NOTIFICATION_TEMPLATES`) et bilingues (ADR-008).

## Tests

`channels.test.ts` : numéros guinéens normalisés, e-mail via Resend avec
classement des erreurs, modèle WhatsApp approuvé, repli sur la console sans
configuration (requêtes HTTP simulées).

## Fini quand

Aucun appel direct à un fournisseur en dehors de ce paquet.

## Hors périmètre de ce bloc

Versionnement des modèles · arrêt immédiat des nouvelles tentatives sur erreur
définitive (aujourd'hui retentée jusqu'à 5 fois).

## Dépend de

B6.7.
