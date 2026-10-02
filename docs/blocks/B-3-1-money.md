# B3.1 — Le type Money

> **Statut : livré.**

## Objectif

Une seule manière de représenter et de calculer de l'argent dans tout le code.

## Contenu

- **`packages/core/src/money`** : `Money = { amountMinor: bigint, currency }`,
  devises `GNF` (0 décimale), `EUR` et `USD` (2 décimales), décimales portées
  par la devise (`CURRENCY_DECIMALS`).
- **Opérations** : `add`, `subtract`, `negate`, `abs`, `sum`, `compare`,
  `equals`, `multiply`, `percentOf` (points de base), `allocate` (répartition
  sans perte), `divRound` (arrondi commercial, seule règle d'arrondi).
- **Saisie et sortie** : `parseMoney` (« 1 250 000 », « 12,50 »), refus des
  décimales en GNF ; `toDecimalString`, `formatMoney` localisé sans flottant ;
  `toJson` / `fromJson` en chaînes.
- Mélanger deux devises lève `CurrencyMismatchError`.

## Décisions appliquées

- ADR-002 (entier + devise). CLAUDE.md : aucun calcul monétaire hors de ce
  module.

## Tests

Unitaires (`money.test.ts`) : opérations, refus du mélange de devises et des
non-entiers, arrondi de la demi-unité, répartition de 100 en trois parts et
d'un montant négatif sans perte, saisies humaines, formatage au-delà de 2^53,
JSON aller-retour.

## Fini quand

Tout montant du produit est un `Money`. **Reste à faire** : la règle ESLint
interdisant `number` pour les identifiants `amount`, `price`, `budget`, `cost`
(critère du plan), et la mesure de couverture à 100 %.

## Hors périmètre de ce bloc

Taux de change et conversion (B3.2).

## Dépend de

B2.9.
