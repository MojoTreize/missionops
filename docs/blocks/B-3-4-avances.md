# B3.4 — Avances de mission

> **Statut : livré.**

## Objectif

Enregistrer les avances versées et voir le solde à tout moment.

## Contenu

- **Table `advances`** : bénéficiaire (membre), montant et devise, taux figé,
  montant en devise de base, date de versement, mode de paiement (`especes`,
  `mobile_money`, `virement`, `cheque`), référence, note, accord du Directeur
  pays, `reverses_id` pour les écritures inverses.
- **Règles** `checkAdvance` : mission `VALIDEE` ou `EN_COURS`, montant positif,
  plafond à **120 % du budget** (`ADVANCE_CEILING_BP`) au-delà duquel l'accord
  du Directeur pays (ou de l'administrateur) est exigé.
- **Services** `createAdvance` (notifie le bénéficiaire) et `cancelAdvance` :
  annulation par **écriture inverse**, jamais par modification.
- Saisie et liste sur la fiche mission, réservées à la finance et au Directeur
  pays.

## Décisions appliquées

- ADR-002 (taux figé au versement), ADR-005 (aucune écriture financière
  supprimée), séparation des tâches sur le plafond.

## Tests

Unitaires : avance acceptée sur mission validée, refus sur mission non validée
et montant nul, seuil de 120 % sauf accord du Directeur pays. Intégration :
avance en EUR convertie au taux figé ; écriture inverse prise en compte dans la
réconciliation.

## Fini quand

Le responsable finance du pilote a saisi 5 avances réelles et le solde
correspond à son tableur.

## Hors périmètre de ce bloc

Paiement effectif (mobile money) · avances hors mission.

## Dépend de

B3.3 (budget).
