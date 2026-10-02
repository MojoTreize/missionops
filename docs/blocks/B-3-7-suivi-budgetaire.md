# B3.7 — Le suivi budgétaire

> **Statut : livré.**

## Objectif

Voir en un coup d'œil, pendant la mission, où en est le budget.

## Contenu

- **Domaine** `trackBudget` (`packages/core/src/budget`) : prévu contre
  réalisé par catégorie et au total, en devise de base ; niveau `ok`,
  `warning` (à partir de 80 %, `WARNING_BASIS_POINTS`) ou `over` (au-delà de
  100 %).
- **Service** `budgetTracking` : dépenses approuvées, déjà converties au taux
  figé de chacune.
- **Encart de la fiche mission** : prévu, avancé, dépensé, solde, barres de
  progression et alerte visuelle.

## Décisions appliquées

- ADR-002 : aucun recalcul au taux du jour.

## Tests

Unitaires : consommation par catégorie avec alertes, sur un jeu en trois
devises ; cas du solde négatif couverts par la réconciliation (B3.8).

## Fini quand

Le chef de mission du pilote consulte cet encart spontanément pendant une
mission réelle.

## Hors périmètre de ce bloc

Suivi hors ligne de l'encart (le terrain affiche la file locale, pas le
budget).

## Dépend de

B3.6 (justificatifs).
