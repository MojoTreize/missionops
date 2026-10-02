# B3.3 — Budget prévisionnel

> **Statut : livré.**

## Objectif

Une mission porte un budget structuré par catégorie, pas un montant unique.

## Contenu

- **Table `budget_lines`** : catégorie, libellé, quantité, montant unitaire et
  devise, taux figé vers la base, date du taux, total en devise de base.
- **Catégories** (`EXPENSE_CATEGORIES`) : transport, carburant, hébergement,
  restauration, per diem, communication, fournitures, autre.
- **Domaine** `packages/core/src/budget` : `validateBudgetLine`, `lineTotal`,
  `budgetTotalBase`, `budgetByCategory`.
- **Fiche mission** : ajout et retrait de lignes (`addBudgetLine`,
  `removeBudgetLine`), modifiables tant que la mission est en brouillon ou
  validée.
- Le total en devise de base alimente les seuils du circuit de validation
  (B2.5) et le plafond des avances (B3.4).

## Décisions appliquées

- ADR-002 : chaque ligne a sa devise et son taux figé ; les totaux additionnent
  des montants en devise de base.
- ADR-005 : une ligne retirée garde sa trace (`deleted_at`).

## Tests

Unitaires : total en devise de base avec lignes en devises mixtes, validation
d'une ligne. Intégration : budget au-delà de 10 M GNF déclenchant l'étape du
Directeur pays ; isolation entre organisations.

## Fini quand

Le budget apparaît dans le circuit de validation et déclenche les seuils de
B2.5.

## Hors périmètre de ce bloc

Catégories modifiables par organisation (liste fixe à ce stade) · barèmes de
per diem (Phase 10).

## Dépend de

B3.2 (taux de change).
