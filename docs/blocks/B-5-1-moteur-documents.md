# B5.1 — Moteur de rendu de documents

> **Statut : livré.**

## Objectif

Produire un PDF identique à chaque exécution.

## Contenu

- **Paquet `packages/documents`** au-dessus de **pdf-lib**, rendu côté serveur.
- **Moteur de mise en page** `layout.ts` : format A4, titres, paragraphes,
  tableaux à hauteur de ligne variable avec en-tête répété à chaque page,
  cases de signature, images (JPEG, PNG), en-tête sur chaque page, pied de page
  avec mention et numérotation « page n / N ».
- **Polices standard PDF (Helvetica)** : rien à embarquer, rendu identique
  partout ; `sanitize` remplace les caractères hors WinAnsi (espaces fines
  d'`Intl`, guillemets typographiques, flèches).
- **Déterminisme** : mêmes données et même date de génération donnent les
  mêmes octets ; aucune date implicite (`generatedAt` injecté).
- **Libellés** par le traducteur `t` fourni par l'appelant ; aucun calcul
  monétaire dans le paquet, seulement la mise en forme de `Money`.

## Décisions appliquées

- pdf-lib plutôt que React-PDF ou Typst : léger, sans binaire externe,
  déterministe. ADR-002 et ADR-008 respectés.

## Tests

`documents.test.ts` : chaque type produit un PDF valide et deux rendus
identiques octet pour octet ; nettoyage WinAnsi.

## Fini quand

Un document de 20 pages se génère en moins de 3 secondes (à mesurer en
staging).

## Hors périmètre de ce bloc

Filigrane « brouillon » · polices embarquées (caractères hors WinAnsi).

## Dépend de

B4.8.
