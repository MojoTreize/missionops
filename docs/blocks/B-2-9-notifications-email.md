# B2.9 — Notifications par e-mail

> **Statut : livré.**

## Objectif

Personne n'a besoin d'aller voir l'application pour savoir qu'on l'attend.

## Contenu

- **Boîte d'envoi transactionnelle** (`packages/services/src/notifications.ts`,
  table `notifications`) : le code métier enfile dans la même transaction que
  l'événement. Une ligne `in_app` (centre de notifications `/notifications`) et
  une par canal choisi.
- **Modèles** : mission soumise, validation requise, mission validée, rejetée
  ou annulée, avance versée, dépense rejetée, réconciliation soumise ou validée,
  rappels. Textes bilingues par `t()`, langue du destinataire.
- **Clé d'idempotence** `dedupe_key` unique par organisation : un renvoi ne
  crée jamais de doublon. L'acteur ne se notifie jamais lui-même.

## Décisions appliquées

- Si la transaction échoue, rien n'est notifié ; si elle réussit, la
  notification finira par partir (envoi par la tâche planifiée, B7.1).
- ADR-008 : modèles bilingues.

## Tests

Intégration via la boucle complète (notifications enfilées) ; canaux testés en
B7.1.

## Fini quand

Le pilote reçoit ses e-mails en production et ne les trouve pas dans les
indésirables.

## Hors périmètre de ce bloc

Désinscription par catégorie (les préférences portent sur les canaux, B7.4) ·
envoi effectif et délivrabilité (B7.1, B7.2) · rappel à 48 h (B7.5).

## Dépend de

B2.8 (modification et annulation).
