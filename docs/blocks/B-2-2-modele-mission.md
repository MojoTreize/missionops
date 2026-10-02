# B2.2 — Modèle mission et machine à états

> **Statut : livré.**

## Objectif

Le cycle de vie d'une mission est déclaré une fois et impossible à contourner.

## Contenu

- **Table `missions`** : référence `MIS-AAAA-NNNN` séquentielle par
  organisation et par année, titre, objet, demandeur, destination (code national
  _ou_ lieu d'organisation), dates, mode de transport, horodatages de chaque
  étape (`submitted_at` … `closed_at`, `cancelled_at`, `archived_at`). Table
  `mission_status_history` (départ, arrivée, événement, commentaire, acteur).
- **Machine à états** `packages/core/src/mission/state-machine.ts` : huit
  statuts (`BROUILLON`, `SOUMISE`, `VALIDEE`, `EN_COURS`, `TERMINEE`,
  `CLOTUREE`, `REJETEE`, `ANNULEE`), neuf événements (`submit`, `approve`,
  `reject`, `rework`, `revise`, `start`, `finish`, `close`, `cancel`) et une
  fonction unique `transition()` qui vérifie existence, droit, gardes et motif.
- **Erreurs nommées** `MissionTransitionError` : `TRANSITION_INTERDITE`,
  `DROIT_INSUFFISANT`, `DEMANDE_INCOMPLETE`, `VALIDATION_INCOMPLETE`,
  `RECONCILIATION_NON_VALIDEE`, `MOTIF_OBLIGATOIRE`.
- **Écriture unique de `missions.status`** : `recordTransition`
  (`packages/services/src/missions.ts`), conditionnée à l'ancien statut, avec
  l'historique dans la même transaction.

## Décisions appliquées

- ADR-006 (machine à états explicite), ADR-004 (audit par déclencheur),
  ADR-001 (RLS sur `missions` et `mission_status_history`).
- Le demandeur ne valide jamais sa propre mission ; `close` réservé à la finance.

## Tests

Unitaires exhaustifs : chaque paire état × événement (8 × 9), aucune sortie
d'un état terminal, droits par rôle, chaque garde et chaque erreur nommée.

## Fini quand

Aucun code ne modifie `missions.status` en dehors de `recordTransition`.

## Hors périmètre de ce bloc

Formulaire de demande (B2.3), circuit de validation (B2.5).

## Dépend de

B2.1 (référentiel géographique).
