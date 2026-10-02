# B7.2 — E-mail transactionnel durci

> **Statut : partiel.** Le code est prêt ; la configuration DNS et les mesures
> de délivrabilité restent à faire.

## Objectif

Les e-mails arrivent en boîte de réception, pas en indésirables.

## Contenu

- **`ResendEmailChannel`** : API HTTP de Resend (région UE à configurer),
  délai d'attente, erreurs 4xx classées définitives, 5xx retentées. Variables
  `RESEND_API_KEY` et `MAIL_FROM`.
- **Journal des envois** : chaque notification garde statut, tentatives,
  dernière erreur et date d'envoi.
- **À faire (exploitation)** : domaine d'envoi dédié, SPF, DKIM et DMARC,
  suivi des rebonds (webhook du fournisseur).

## Décisions appliquées

- Hébergement UE (`docs/conformite/hebergement.md`) ; secrets hors dépôt
  (`docs/runbooks/secrets.md`).

## Tests

Unitaires du canal (réponses simulées). À faire : score d'un outil de test de
délivrabilité supérieur à 9 sur 10.

## Fini quand

Trois organisations différentes reçoivent bien les e-mails, testé chez chacune.

## Hors périmètre de ce bloc

Lien de désinscription dans l'e-mail · version HTML mise en forme.

## Dépend de

B7.1 (abstraction des canaux).
