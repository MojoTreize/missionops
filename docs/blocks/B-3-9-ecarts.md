# B3.9 — Écarts et justification

> **Statut : livré.**

## Objectif

Expliquer les écarts, parce que c'est ce que le bailleur demandera.

## Contenu

- **Domaine** `variancesToJustify` : catégories dont le réalisé dépasse le
  prévu de plus de 10 % (`VARIANCE_THRESHOLD_BP`) **et** d'au moins le plancher
  de l'organisation (en devise de base), ainsi que les dépenses non prévues.
- **Plancher paramétrable** par organisation (`varianceFloorMinor`, 50 000 par
  défaut), réglé dans le paramétrage (B9.2).
- **Table `variance_justifications`** : une justification par catégorie,
  saisie sur l'écran de réconciliation (`justifyVariance`).
- La soumission est bloquée tant qu'un écart reste sans justification.

## Décisions appliquées

- Seuils en points de base et en unités mineures : aucun flottant (ADR-002).

## Tests

Unitaires : petits écarts et écarts sous 10 % ignorés, dépense non prévue
(budget nul) à justifier, blocage de la soumission.

## Fini quand

Un rapport d'écart est produit (Closure Pack) et jugé exploitable par le
comptable du pilote.

## Hors périmètre de ce bloc

Typologie d'écarts paramétrable par organisation.

## Dépend de

B3.8 (réconciliation).
