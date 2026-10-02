# B5.2 — Modèles par organisation

> **Statut : partiel.**

## Objectif

Le document porte l'identité du client, pas celle de MissionOps.

## Contenu

- **Paramètres de document dans `organisations.settings`** (pas de table
  `document_templates`) : en-tête, pied de page et libellés des signatures de
  l'ordre de mission (séparés par « ; », trois libellés par défaut).
- Nom de l'organisation sur chaque page ; pied de page personnalisé et
  pagination.
- Réglage depuis le paramétrage de l'organisation (`/organizations/settings`,
  B9.2).

## Décisions appliquées

- `readSettings` (`packages/services/src/organisation.ts`) : valeurs par défaut
  sûres si un paramètre manque.

## Tests

Rendu avec des libellés de signature personnalisés dans `documents.test.ts`.

## Fini quand

Le pilote a validé l'apparence de ses documents.

## Hors périmètre de ce bloc

**Logo** (chargement et rendu à toutes les tailles) · aperçu en direct ·
numérotation personnalisée des ordres de mission (la référence `MIS-AAAA-NNNN`
sert de numéro).

## Dépend de

B5.1 (moteur de rendu).
