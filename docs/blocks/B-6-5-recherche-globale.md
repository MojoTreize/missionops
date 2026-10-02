# B6.5 — Recherche globale

> **Statut : livré.**

## Objectif

Trouver n'importe quoi depuis n'importe où.

## Contenu

- **`GET /api/search?q=…`** (`globalSearch`) : missions (titre, référence),
  dépenses (description) et membres ; 2 à 80 caractères, résultats groupés par
  type avec lien direct.
- **Champ de recherche dans la coque** (`components/shell/global-search.tsx`).

## Décisions appliquées

- ADR-001 : la recherche s'exécute dans le contexte de l'organisation ; un
  collaborateur ne trouve que ses missions.
- Caractères spéciaux de motif neutralisés.

## Tests

Intégration : recherche globale.

## Fini quand

La recherche remplace la navigation dans les usages quotidiens.

## Hors périmètre de ce bloc

Recherche plein texte PostgreSQL et insensibilité aux accents (aujourd'hui
`ILIKE`) · raccourci clavier · documents · mesure sous 200 ms sur le seed
complet.

## Dépend de

B6.4 (export comptable).
