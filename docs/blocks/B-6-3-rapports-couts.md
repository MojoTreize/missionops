# B6.3 — Rapports de coûts

> **Statut : livré.**

## Objectif

Répondre aux questions de la direction sans tableur.

## Contenu

- **Écran `/reports`** (`costReport`) sur une période (début, fin) conservée
  dans l'URL : total, répartition par catégorie, par mois, par destination
  (avec nombre de missions) et par mission (budget contre réalisé).
- Graphiques sobres en barres (`components/charts/bar-list.tsx`), tableaux
  lisibles, lien vers l'export comptable de la même période.

## Décisions appliquées

- Tout en devise de base, à partir des montants figés de chaque ligne.
- Accès `report:read` (manager, finance, Directeur pays, administrateur).

## Tests

Intégration : rapport de coûts en devise de base.

## Fini quand

Le directeur pays prépare sa réunion mensuelle avec ces écrans.

## Hors périmètre de ce bloc

Répartition par département · test de cohérence systématique « somme des
détails = total ».

## Dépend de

B6.2 (tableau de bord).
