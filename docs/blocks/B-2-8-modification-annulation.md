# B2.8 — Modification, report et annulation

> **Statut : livré.**

## Objectif

Gérer le fait que les missions changent tout le temps.

## Contenu

- **Modification** `/missions/[id]/edit` (`updateMission`) : possible en
  `BROUILLON` et en `VALIDEE` (`isEditable`).
- **Revalidation conditionnelle** : une modification des dates ou de la
  destination d'une mission validée est substantielle (`isSubstantialChange`)
  et la renvoie en `SOUMISE` (événement `revise`), avec un nouveau cycle de
  validation. Les autres changements ne déclenchent rien.
- **Annulation** (`cancel`) depuis `BROUILLON`, `SOUMISE` ou `VALIDEE`, motif
  obligatoire, notification du demandeur et des participants.
- **Avances déjà versées** : elles restent ; leur annulation se fait par
  écriture inverse (B3.4). Une mission annulée est verrouillée pour les
  nouvelles écritures financières.

## Décisions appliquées

- ADR-006 (transitions `revise`, `cancel`), ADR-004 (avant/après dans
  `audit_log`), ADR-005 (rien n'est supprimé).

## Tests

Unitaires : modifications substantielles et états modifiables, motif
obligatoire. Intégration : chaque mutation journalisée dans `audit_log`.

## Fini quand

Toutes les modifications apparaissent dans le journal d'audit avec avant et
après.

## Hors périmètre de ce bloc

Report en un clic distinct de la modification · règlement guidé de l'avance
d'une mission annulée (passe aujourd'hui par l'écriture inverse).

## Dépend de

B2.7 (liste des missions).
