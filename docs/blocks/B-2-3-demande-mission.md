# B2.3 — Créer une demande de mission

> **Statut : livré.**

## Objectif

Un collaborateur crée et soumet une demande depuis son téléphone en moins de
trois minutes.

## Contenu

- **Écran `/missions/new`** : formulaire sur une page (titre, objet,
  destination via `LocationPicker`, dates de début et de fin, mode de
  transport, notes), lisible à 375 px.
- **Enregistrement en `BROUILLON`** (`createMission`), puis soumission
  explicite (`submit`) depuis la fiche mission, qui notifie les validateurs de
  la première étape.
- **Règles** `packages/core/src/mission/rules.ts` (`validateDraft`) : titre
  (3 caractères min.), objet (10 min.), destination connue, dates ISO valides
  et ordonnées, durée de 90 jours au plus, transport choisi. La soumission est
  refusée tant qu'un point manque (`DEMANDE_INCOMPLETE`).
- **Schéma Zod partagé** `missionInput` (`packages/contracts`) : nettoyage des
  champs, destination obligatoire, `dates_order`.

## Décisions appliquées

- CLAUDE.md : validation Zod partagée client/serveur, logique dans
  `packages/core`, textes par `t()`.
- Dates comparées en chaînes ISO (jour calendaire de l'organisation), jamais en
  `Date` locale.

## Tests

Unitaires sur les règles et le schéma (chaque manque signalé, dates inversées
refusées) ; intégration dans la boucle complète (`loop.test.ts`) ; parcours
E2E de la boucle (`e2e/mission-loop.spec.ts`).

## Fini quand

Une personne qui découvre l'écran crée et soumet une demande en moins de trois
minutes (chronométrage à faire chez le pilote).

## Hors périmètre de ce bloc

Assistant en plusieurs étapes et enregistrement automatique du brouillon ·
refus d'une mission dans le passé (non implémenté) · budget (B3.3).

## Dépend de

B2.2 (modèle mission).
