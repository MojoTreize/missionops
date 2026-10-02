# B6.1 — Consultation du journal d'audit

> **Statut : livré.**

## Objectif

Répondre à « qui a modifié ce montant, et quand ? » en moins de 30 secondes.

## Contenu

- **Écran `/audit`** (`auditLogPage`, `packages/services/src/reports.ts`) :
  filtres par table, identifiant de ligne, acteur et période ; pages de 50
  entrées, les plus récentes d'abord.
- **Différences lisibles** : seuls les champs modifiés sont affichés, avant et
  après côte à côte ; `updated_at` et `updated_by` sont ignorés.
- Acteur affiché par son nom ; action (création, modification, suppression).

## Décisions appliquées

- ADR-004 : lecture seule d'un journal en écriture seule, cloisonné par RLS.
- Accès réservé au Directeur pays et à l'administrateur (`auditLog:read`).

## Tests

Intégration : recherche et journal d'audit ; chaque mutation de la boucle est
journalisée. Policy : seuls Directeur pays et administrateur lisent le journal.

## Fini quand

Un auditeur externe navigue seul dans cet écran sans explication.

## Hors périmètre de ce bloc

Mesure de performance sur 500 000 lignes · filtre par type d'action ·
libellés métier des tables et des champs.

## Dépend de

B5.7 (Closure Pack).
