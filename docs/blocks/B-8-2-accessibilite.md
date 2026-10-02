# B8.2 — Accessibilité

> **Statut : livré** pour l'audit automatisé ; test au lecteur d'écran à
> faire avec un utilisateur réel.

## Objectif

Le produit passe un audit d'accessibilité : plusieurs bailleurs institutionnels
le vérifient.

## Contenu

- **Déjà en place** : primitives accessibles (Radix UI, B1.4), libellés de
  champ associés (`Field`), sélecteur de lieu en `combobox`, icônes décoratives
  masquées (`aria-hidden`), boutons d'icône libellés (`aria-label`), contrastes
  des jetons de design, interface utilisable à 375 px.
- **Contrastes** : jetons `muted`, `subtle`, `warning` et `ledger` foncés pour
  atteindre 4,5:1 sur papier, surface et fonds clairs.
- **Clavier** : lien d'évitement « Aller au contenu », `main` focalisable.
- **Annonces** : indicateur réseau et retours d'action en `role="status"` /
  `role="alert"` (`aria-live`).
- **Animations** : `prefers-reduced-motion` respecté globalement.

## Décisions appliquées

- Textes par `t()` (ADR-008) : les libellés ARIA sont traduits comme le reste.

## Tests

`e2e/accessibility.spec.ts` : axe-core (WCAG 2.1 A/AA) sur huit écrans et la
connexion, échec bloquant sur toute violation « serious » ou « critical ».
Reste à faire : parcours au clavier seul et lecteur d'écran, à la main.

## Fini quand

Zéro violation critique ou sérieuse sur tous les écrans.

## Hors périmètre de ce bloc

Refonte visuelle.

## Dépend de

B8.1 (performance).
