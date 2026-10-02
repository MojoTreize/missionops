# B4.8 — Campagne de tests hors ligne

> **Statut : partiel.** Le parcours automatisé existe ; la campagne terrain
> reste à mener.

## Objectif

Prouver la fiabilité du hors ligne avant de la promettre commercialement.

## Contenu

- **Parcours Playwright** `e2e/mission-loop.spec.ts` : la boucle complète,
  dont la saisie hors ligne et le retour en ligne.
- **À faire** : dix scénarios de perte de réseau à des moments différents
  (pendant un lot, entre la dépense et la photo, pendant l'envoi de la photo,
  changement d'organisation…), exécutés dix fois de suite sans échec
  intermittent.
- **À faire** : trajet réel Conakry–Kindia avec les coupures réelles, documenté
  dans `docs/terrain/test-offline-kindia.md`.

## Décisions appliquées

- ADR-003 et ADR-007 : ce sont leurs promesses qu'on vérifie.

## Tests

La suite complète passe dix fois de suite sans échec intermittent.

## Fini quand

Le trajet réel est fait et documenté.

## Hors périmètre de ce bloc

Tests de charge de la synchronisation (B8.8).

## Dépend de

B4.7 (état du réseau).
