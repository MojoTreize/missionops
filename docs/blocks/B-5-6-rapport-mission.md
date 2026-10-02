# B5.6 — Rapport de mission

> **Statut : livré.**

## Objectif

Le rapport se remplit sur le téléphone, au retour, en dix minutes.

## Contenu

- **Table `mission_reports`** : synthèse, résultats, difficultés,
  recommandations, date de remise.
- **Écran `/missions/[id]/report`** (`getMissionReport`, `saveMissionReport`) :
  enregistrement puis remise ; possible en `EN_COURS` et `TERMINEE` ; un
  rapport remis ne se modifie plus (`report_submitted`).
- Rappel automatique trois jours après le retour (B7.5) ; rapport repris dans
  le Closure Pack.

## Décisions appliquées

- Schéma Zod partagé `missionReportInput` ; audit par déclencheur.

## Tests

Intégration via la boucle complète.

## Fini quand

Trois rapports réels sont saisis directement dans l'outil par des
collaborateurs pilotes.

## Hors périmètre de ce bloc

Saisie hors ligne et enregistrement automatique · modèle de rapport
paramétrable par organisation.

## Dépend de

B5.5 (Mission Pack).
