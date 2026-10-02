# B4.4 — Dépense hors ligne

> **Statut : livré.**

## Objectif

Saisir une dépense sans aucun réseau, et savoir qu'elle est bien enregistrée.

## Contenu

- Le formulaire de l'écran Terrain écrit **toujours** dans la file locale, puis
  déclenche la synchronisation : un seul chemin, en ligne comme hors ligne.
- Message « Enregistré sur le téléphone » et liste des saisies locales avec
  leur statut (en attente, envoyée, refusée).
- **Conversion différée** : le serveur convertit à la réception, au taux en
  vigueur à la date de la dépense ; `created_offline` et `client_created_at`
  gardent l'origine.

## Décisions appliquées

- ADR-002 et ADR-003.

## Tests

E2E : saisie hors ligne puis retour en ligne (`e2e/mission-loop.spec.ts`).
Intégration : dépense reçue deux fois = un seul enregistrement.

## Fini quand

Testé en conditions réelles lors d'une mission du pilote hors de Conakry.

## Hors périmètre de ce bloc

Affichage du montant converti avant envoi.

## Dépend de

B4.3 (file de synchronisation).
