# B4.8 — Campagne de tests hors ligne

> **Statut : livré** pour la campagne automatisée ; le trajet réel
> Conakry–Kindia reste à mener avec le pilote.

## Objectif

Prouver la fiabilité du hors ligne avant de la promettre commercialement.

## Contenu

- **Parcours Playwright** `e2e/mission-loop.spec.ts` : la boucle complète,
  dont la saisie hors ligne et le retour en ligne.
- **Campagne automatisée** `e2e/offline-campaign.spec.ts` : réponse perdue
  après enregistrement côté serveur (renvoi reconnu comme doublon, une seule
  dépense en base), coupure entre la dépense et la photo, erreur serveur
  passagère (503), démarrage hors ligne avec plusieurs saisies et un événement,
  saisie refusée signalée avec « Réessayer ». Un lot refusé en bloc (400/422)
  passe en « Refusé » au lieu d'être retenté sans fin.
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
