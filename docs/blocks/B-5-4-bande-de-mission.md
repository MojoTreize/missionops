# B5.4 — La bande de mission

> **Statut : livré.**

## Objectif

L'élément signature de la section 8.2 du plan, utilisable à l'écran et dans les
documents.

## Contenu

- **Modèle pur** (`packages/core/src/mission/band.ts`) : six étapes (demande,
  validation, avance, terrain, réconciliation, clôture), chacune `done`,
  `current`, `upcoming` ou `stopped` (mission rejetée ou annulée), et le solde
  de l'avance.
- **Géométrie unique** (`packages/documents/src/band.ts`, `bandShape`) : les
  coordonnées sont calculées une fois ; deux rendus les dessinent sans
  recalculer :
  - `bandToSvg` : SVG autonome, sans script, texte échappé, affiché en tête de
    la fiche mission ;
  - `Layout.band` : primitives pdf-lib, en tête de l'ordre de mission, du
    Mission Pack et du Closure Pack.
- **Service** : `missionBandSvg` (fiche web) et `documentData` (documents)
  calculent la bande depuis la mission, ses avances et sa réconciliation.

## Décisions appliquées

- Le domaine décide de l'état des étapes ; les rendus ne font que dessiner.
- Palette : vert institutionnel (fait), accent grand-livre (en cours), rouge
  (arrêt), gris (à venir) ; libellés en encre de texte.

## Tests

- Unitaire : chaque statut × avance versée ou non (combinaisons d'états).
- Documents : SVG à six nœuds, texte échappé, aucun script ; PDF valide pour
  chaque statut.

## Fini quand

Le même modèle produit la même bande à l'écran et sur papier.

## Hors périmètre de ce bloc

Animation à l'écran.

## Dépend de

B5.3 (ordre de mission).
