# B6.4 — Export comptable et bailleur

> **Statut : livré.**

## Objectif

Livrer les données dans le format que le comptable attend déjà.

## Contenu

- **`GET /api/exports/accounting?from=…&to=…`** (`accountingExport`) : une ligne
  par écriture (dépense ou avance) avec date, type, mission, catégorie,
  description, personne, montant et devise d'origine, **taux figé** et sa date,
  montant en devise de base.
- **CSV séparé par « ; », UTF-8 avec BOM**, fins de ligne CRLF : s'ouvre
  directement dans Excel en configuration française. En-têtes et catégories
  traduits dans la langue de l'utilisateur.
- Période par défaut : du 1ᵉʳ janvier à aujourd'hui.

## Décisions appliquées

- ADR-002 : montants en chaînes décimales exactes, jamais en flottant.
- Accès `expense:export` (finance, Directeur pays, administrateur).

## Tests

Intégration : export CSV avec taux figés.

## Fini quand

Le comptable du pilote importe le fichier dans son logiciel sans retouche.

## Hors périmètre de ce bloc

Colonnes configurables · correspondance avec le plan comptable du client ·
format Excel natif · séparateur décimal et format de date paramétrables ·
export par projet financé.

## Dépend de

B6.3 (rapports de coûts).
