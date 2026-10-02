# B9.3 — Import de données

> **Statut : en cours de livraison.**

## Objectif

Ne pas demander à un client de ressaisir ce qu'il a déjà.

## Contenu

- **Lecteur CSV pur** `packages/core/src/common/csv.ts` : séparateur « ; » ou
  « , » détecté, guillemets doubles, BOM UTF-8, fins de ligne CRLF ou LF,
  en-têtes normalisés (casse, accents, espaces), nombre de lignes borné.
- **Import des membres** (`prepareMemberImport`, colonnes `email ; role`) :
  format d'e-mail, rôle connu, doublons (dans le fichier ou déjà membres) et
  **places disponibles** vérifiés ; chaque ligne valide devient une invitation
  envoyée par e-mail.
- **Import des lieux d'organisation** (`importLocations`, colonnes
  `nom ; code_parent ; type`) : mêmes règles que la saisie (B2.1).
- **Rapport ligne par ligne** : nombre importé et erreurs (numéro de ligne,
  code) ; import partiel, les lignes valides passent.
- Formulaires d'import sur `/organizations/settings`.

## Décisions appliquées

- Mêmes règles du domaine que la saisie manuelle ; audit de chaque création.

## Tests

Unitaires du lecteur CSV : fichier Excel français (point-virgule, BOM, CRLF),
virgules, guillemets et lignes vides, borne du nombre de lignes. Intégration
« plateforme (Phase 9) » de `loop.test.ts` (imports).

## Fini quand

Les membres et les lieux du pilote sont importés sans ressaisie.

## Hors périmètre de ce bloc

Missions historiques, catégories et fournisseurs · aperçu avant validation ·
annulation d'un import.

## Dépend de

B9.2 (paramétrage).
