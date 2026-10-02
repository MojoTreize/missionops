# B9.4 — Abonnement et facturation

> **Statut : en cours de livraison.** Facturation manuelle.

## Objectif

Encadrer l'usage par une formule, sans couper brutalement un client.

## Contenu

- **Table `subscriptions`** (une ligne active par organisation) : formule,
  statut (`active`, `suspendue`, `resiliee`), places, fin d'essai, prix
  facultatif (montant en unités mineures et devise).
- **Formules** (`PLANS`, `packages/services/src/platform.ts`) : `essai`
  (10 places, 30 jours), `essentiel` (25 places), `organisation` (200 places).
- **Limite de places appliquée aux invitations** (`assertSeatAvailable`) :
  invitation et import refusés au-delà des places ou si l'abonnement n'est pas
  actif (`plan_limit`).
- **Changement de formule, suspension et réactivation** depuis la console
  interne (B9.6).
- **Facturation manuelle** : facture émise hors application (EUR ou USD, ou
  arrangement local pour les clients guinéens).

## Décisions appliquées

- Dégradation progressive : une organisation suspendue garde l'accès à ses
  données ; seules les nouvelles invitations sont bloquées.
- ADR-002 pour le prix ; audit sur `subscriptions`.

## Tests

Intégration « plateforme (Phase 9) » de `loop.test.ts` (essai, places).

## Fini quand

Le deuxième client est facturé selon sa formule.

## Hors périmètre de ce bloc

Paiement en ligne et prélèvement · factures générées · relances d'impayés ·
formules au nombre de missions.

## Dépend de

B9.3 (import).
