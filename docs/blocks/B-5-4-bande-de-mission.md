# B5.4 — La bande de mission

> **Statut : non commencé.**

## Objectif

L'élément signature de la section 8.2 du plan, utilisable à l'écran et dans les
documents.

## Contenu

- À faire : composant unique rendu en SVG, réutilisé dans l'interface React et
  dans les PDF : six étapes de la mission, état de chacune, solde d'avance.
- Aujourd'hui, l'écran montre le statut par un badge (`status-badge.tsx`) et
  les documents par la synthèse de mission ; aucun composant commun.

## Décisions appliquées

- Le calcul des étapes et du solde viendra de `packages/core` (machine à états,
  réconciliation) ; le composant ne fera que dessiner.

## Tests

Rendu dans les deux contextes, comparaison visuelle, chaque combinaison
d'états.

## Fini quand

Le même composant produit exactement la même chose à l'écran et sur papier.

## Hors périmètre de ce bloc

Animation à l'écran.

## Dépend de

B5.3 (ordre de mission).
