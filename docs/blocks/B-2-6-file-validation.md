# B2.6 — File de validation

> **Statut : livré.**

## Objectif

Un manager traite ses validations en attente en une minute.

## Contenu

- **Table `approvals`** : mission, cycle, position, rôle, décision
  (`approved` / `rejected`), commentaire, auteur.
- **Écran `/approvals`** (`approvalQueue`) : missions dont l'étape en attente
  correspond au rôle de l'acteur, avec étape, dates, destination et budget
  visibles sans ouvrir la mission.
- **Décision** depuis la fiche mission (`decideMission`) : valider, ou rejeter
  avec motif obligatoire. La dernière approbation fait passer la mission en
  `VALIDEE` ; un rejet la met en `REJETEE`, que le demandeur reprend en
  brouillon (`rework`).

## Décisions appliquées

- Séparation des tâches : un validateur ne valide ni sa propre demande, ni deux
  fois la même étape (`self_approval`, `already_decided`).
- ADR-006 : la décision passe par la machine à états.

## Tests

Unitaires (`canDecide`) ; intégration : le demandeur ne peut pas valider, le
manager voit la mission dans sa file, validation en deux étapes.

## Fini quand

Le manager du pilote a traité 10 validations réelles.

## Hors périmètre de ce bloc

Validation par lot · action « demander une modification » distincte du rejet.

## Dépend de

B2.5 (circuit de validation).
