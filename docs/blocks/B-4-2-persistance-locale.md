# B4.2 — Persistance locale

> **Statut : livré.**

## Objectif

Les données nécessaires au terrain sont disponibles sans réseau.

## Contenu

- **IndexedDB via Dexie** (`apps/web/lib/offline/db.ts`, base
  `missionops-terrain`) : magasins `bootstrap`, `outbox` et `photos`, indexés
  par statut, date de création et organisation.
- **Amorçage** `GET /api/terrain` : missions validées ou en cours de
  l'utilisateur (demandeur ou participant), devise de base, catégories, lieux
  de l'organisation. Copie locale datée (« Données du … »).
- Le référentiel national est dans le code (B2.1) : aucune réplication.
- **Éviction** : les éléments synchronisés depuis plus de 7 jours sont purgés
  du téléphone (ils existent côté serveur) ; les éléments en attente ou refusés
  ne sont jamais purgés.

## Décisions appliquées

- CLAUDE.md : jamais `localStorage` pour des données métier.
- ADR-001 : la copie locale est filtrée par organisation.

## Tests

E2E de la boucle avec saisie hors ligne (`e2e/mission-loop.spec.ts`).

## Fini quand

L'écran Terrain est utilisable hors ligne dès l'ouverture, après un premier
chargement en ligne.

## Hors périmètre de ce bloc

Consultation hors ligne de la fiche mission complète · réplication des taux de
change (inutile : conversion côté serveur, ADR-003).

## Dépend de

B4.1 (PWA).
