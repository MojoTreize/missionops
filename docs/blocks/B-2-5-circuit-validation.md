# B2.5 — Circuit de validation configurable

> **Statut : livré.**

## Objectif

Chaque organisation définit qui valide quoi, selon le montant.

## Contenu

- **Table `approval_steps`** : position, rôle validateur, seuil minimal de
  budget en unités mineures de la devise de base (`null` = toujours).
- **Domaine** `packages/core/src/approval/flow.ts` : `requiredSteps` (étapes
  applicables selon le budget, seuil atteint inclus), `approvalState` (en
  attente, validé, rejeté), `validateFlow` (circuit vide, positions en double,
  seuil négatif).
- **Circuit par défaut** (`DEFAULT_FLOW`) : manager, puis Directeur pays à
  partir de 10 000 000 GNF.
- **Écran `/organizations/approval-flow`** (administrateur) : jusqu'à quatre
  étapes, seuils saisis en unités majeures.

## Décisions appliquées

- ADR-002 : seuils comparés au budget total en devise de base, au taux figé de
  chaque ligne.
- Le circuit en vigueur au moment de la soumission s'applique ; chaque
  soumission ouvre un nouveau cycle (`approvals.cycle`).

## Tests

Unitaires : seuil du Directeur pays (montant égal au seuil inclus), tri par
position, état du circuit, contrôle de qui peut décider, validation de la
configuration. Intégration : budget au-delà de 10 M GNF, deux validations
successives.

## Fini quand

Le pilote a configuré son propre circuit réel, sans aide.

## Hors périmètre de ce bloc

Circuits différents par type de mission ou par projet · délégation de
validation.

## Dépend de

B2.4 (participants), B3.3 pour le budget.
