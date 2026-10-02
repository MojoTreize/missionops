# B3.8 — Réconciliation de l'avance

> **Statut : livré.**

## Objectif

Clôturer financièrement une mission : combien reste-t-il à rendre ou à
rembourser ?

## Contenu

- **Domaine** `reconcile` (`packages/core/src/reconciliation`) : total des
  avances (écritures inverses comprises) moins total des dépenses approuvées, en
  devise de base ; trois issues : l'agent reverse (`agent_reverse`),
  l'organisation rembourse (`org_rembourse`), équilibre (`solde`). Liste des
  dépenses en attente et des justificatifs manquants.
- **Table `reconciliations`** : statut `ouverte` → `soumise` → `validee`,
  totaux figés à la soumission, règlement (mode, référence, date), auteur et
  validateur.
- **Écran `/missions/[id]/reconciliation`** : soumission (`submitReconciliation`),
  enregistrement du règlement (`recordSettlement`), renvoi pour correction
  (`reopenReconciliation`).
- **Blocages explicites** (`checkSubmission`) : dépenses encore en attente,
  écarts non justifiés, justificatifs manquants sans motif.

## Décisions appliquées

- ADR-002 (taux figés), ADR-006 (la clôture passe par la machine à états).

## Tests

Unitaires : les trois issues, écriture inverse, blocage de la soumission.
Intégration : soumission, règlement, validation et clôture.

## Fini quand

Cinq missions réelles du pilote sont réconciliées et le comptable confirme les
montants.

## Hors périmètre de ce bloc

Validation financière (B3.10) · écarts (B3.9).

## Dépend de

B3.7 (suivi budgétaire).
