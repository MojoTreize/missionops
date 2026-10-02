# B8.2 — Accessibilité

> **Statut : partiel.**

## Objectif

Le produit passe un audit d'accessibilité : plusieurs bailleurs institutionnels
le vérifient.

## Contenu

- **Déjà en place** : primitives accessibles (Radix UI, B1.4), libellés de
  champ associés (`Field`), sélecteur de lieu en `combobox`, icônes décoratives
  masquées (`aria-hidden`), boutons d'icône libellés (`aria-label`), contrastes
  des jetons de design, interface utilisable à 375 px.
- **À faire** : audit AA complet (contrastes de chaque état, ordre de focus,
  annonces des changements dynamiques, notamment l'état de synchronisation),
  respect de `prefers-reduced-motion`.

## Décisions appliquées

- Textes par `t()` (ADR-008) : les libellés ARIA sont traduits comme le reste.

## Tests

À faire : `axe-core` dans les tests Playwright avec échec bloquant, parcours au
clavier seul, lecteur d'écran sur les trois écrans principaux.

## Fini quand

Zéro violation critique ou sérieuse sur tous les écrans.

## Hors périmètre de ce bloc

Refonte visuelle.

## Dépend de

B8.1 (performance).
