# B9.6 — Console d'administration interne

> **Statut : en cours de livraison.**

## Objectif

Diagnostiquer et gérer un client sans requête SQL manuelle.

## Contenu

- **Écran `/admin`**, réservé aux adresses listées dans
  `PLATFORM_ADMIN_EMAILS` (`isPlatformAdmin`) ; tout autre utilisateur est
  renvoyé vers `/forbidden`, et les actions vérifient à nouveau le droit.
- **Liste des organisations** (`platformOverview`) : date de création, membres,
  formule, statut, fin d'essai et indicateurs d'usage (B9.7).
- **Actions** (`setSubscription`) : suspendre, réactiver, changer de formule.

## Décisions appliquées

- **La console ne contourne pas la RLS** : chaque organisation est lue dans son
  propre contexte isolé (ADR-001).
- Le statut « admin plateforme » est distinct du rôle « admin » d'une
  organisation ; chaque modification d'abonnement passe par le déclencheur
  d'audit.

## Tests

Intégration « plateforme (Phase 9) » de `loop.test.ts` (console). À couvrir :
accès refusé hors de `PLATFORM_ADMIN_EMAILS`.

## Fini quand

Un incident client est diagnostiqué uniquement depuis la console.

## Hors périmètre de ce bloc

État des files de synchronisation · journaux d'envoi · prise de contrôle en
lecture seule avec consentement enregistré.

## Dépend de

B9.5 (support).
