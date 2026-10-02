# B3.10 — Validation financière

> **Statut : livré.**

## Objectif

Le comptable valide ou rejette chaque dépense, puis clôture la mission.

## Contenu

- **File finance `/finance`** (`financeQueue`) : réconciliations soumises et
  nombre de dépenses à traiter.
- **Décision par dépense** (`decideExpense`) sur `/expenses` : approuver, ou
  rejeter avec motif (le demandeur est notifié). Seule une dépense `soumise` se
  décide ; une dépense approuvée ne change plus.
- **Justificatif précisé après coup** (`explainMissingReceipt`).
- **Validation de la réconciliation** (`validateReconciliation`) : vérifie à
  nouveau les blocages, exige le règlement enregistré si le solde n'est pas nul,
  fige les totaux, puis clôture la mission (transition `close`, garde
  `reconciliationValidated`).

## Décisions appliquées

- Séparation des tâches : la finance ne valide pas ses propres dépenses
  (`self_approval`) ; celui qui soumet la réconciliation ne la valide pas
  (`self_validation`).
- ADR-006 : `close` réservé aux rôles ayant `expense:approve`.

## Tests

Unitaires : seule une dépense soumise se décide ; règlement et séparation des
tâches. Intégration : la finance valide les dépenses (jamais les siennes),
réconciliation jusqu'à la clôture.

## Fini quand

Le comptable du pilote a traité un mois complet de dépenses dans l'outil.

## Hors périmètre de ce bloc

Traitement par lot · demande de justificatif complémentaire comme action
distincte.

## Dépend de

B3.9 (écarts).
