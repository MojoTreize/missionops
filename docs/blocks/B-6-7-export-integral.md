# B6.7 — Export intégral de l'organisation

> **Statut : livré.**

## Objectif

Le client peut partir avec toutes ses données. C'est ce qui le rassure et le
fait rester.

## Contenu

- **`GET /api/exports/organisation`** (`organisationExport`) : un fichier JSON
  avec toutes les tables métier de l'organisation, **lignes supprimées
  logiquement comprises**, le journal d'audit et la liste des membres.
- Montants en chaînes (jamais de flottant), téléchargement `no-store`.
- Déclenchable par l'administrateur (`organisation:export`).

## Décisions appliquées

- ADR-001 : export exécuté dans le contexte isolé de l'organisation.
- ADR-002 et ADR-005.

## Tests

Intégration : l'export d'une organisation ne contient aucune donnée d'une
autre.

## Fini quand

Un export complet est produit, téléchargé et vérifié.

## Hors périmètre de ce bloc

Tables en CSV, fichiers (justificatifs et documents) et index HTML de
navigation · lien signé à durée limitée · test sur 2 000 missions.

## Dépend de

B6.6 (archivage).
