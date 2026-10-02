# B3.2 — Taux de change

> **Statut : livré.**

## Objectif

Toute conversion est datée, tracée et non recalculable a posteriori.

## Contenu

- **`packages/core/src/money/fx.ts`** : `FxRate` décimal exact (`bigint` à
  10 décimales, `RATE_SCALE`), `parseRate`, `convert` (arrondi commercial à
  l'unité mineure cible), `invertRate`, `identityRate`, `rateToString`.
- **Table `exchange_rates`** : devise source et cible, taux `numeric(30,10)`,
  date d'effet, source (`manuel` par défaut), auteur.
- **Service** `packages/services/src/fx.ts` : `resolveRate` choisit le taux le
  plus récent dont la date d'effet est antérieure ou égale à la date demandée,
  sinon l'inverse du taux réciproque ; sinon `rate_missing`. `rateFor` accepte
  aussi un taux saisi sur la ligne.
- **Écran `/finance/rates`** : saisie et historique, réservés à la finance et à
  l'administrateur.

## Décisions appliquées

- ADR-002 : chaque ligne fige `fx_rate_to_base`, `fx_rate_date` et le montant
  en devise de base ; jamais de valeur par défaut silencieuse.

## Tests

Unitaires : EUR → GNF arrondi à l'unité, GNF → EUR avec un petit taux, taux
identité, taux appliqué à la mauvaise devise, taux invalides, inversion.
Contrat Zod : même devise refusée. Intégration : avance en EUR convertie au
taux figé.

## Fini quand

Aucune conversion n'est possible sans date : `resolveRate` exige la date de
l'opération.

## Hors périmètre de ce bloc

Source automatique de taux (banque centrale) · taux par projet.

## Dépend de

B3.1 (Money).
