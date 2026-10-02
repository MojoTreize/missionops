# B6.2 — Tableau de bord opérationnel

> **Statut : livré.**

## Objectif

L'écran d'accueil du responsable des opérations.

## Contenu

- **Écran `/dashboard`** (`dashboard`) : missions par statut, équipes sur le
  terrain aujourd'hui, missions à venir, mes brouillons, validations en attente,
  dépenses à traiter, réconciliations à valider, dépenses et avances du mois en
  devise de base, part des dépenses avec justificatif, délai médian entre retour
  et clôture.
- Chaque indicateur renvoie vers la liste correspondante.

## Décisions appliquées

- Montants additionnés en devise de base au taux figé (ADR-002) ; indicateurs
  du plan §12.3 (justificatifs, délai de clôture).

## Tests

Intégration : tableau de bord en devise de base sur les données de la boucle.

## Fini quand

Le responsable pilote ouvre cet écran en premier chaque matin.

## Hors périmètre de ce bloc

Avances non justifiées avec ancienneté · dépassements budgétaires listés ·
vérification de chaque chiffre contre le seed de démo.

## Dépend de

B6.1 (journal d'audit).
