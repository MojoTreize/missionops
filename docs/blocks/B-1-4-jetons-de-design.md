# B1.4 — Jetons de design et primitives

## Objectif

Une base visuelle cohérente, avant tout écran. Les jetons (couleurs, typographie,
espacement, rayons, ombres) et les primitives d'interface sont définis une fois et
réutilisés partout, testés à 375px (terrain) et 1440px (bureau).

## Contenu

- **Tailwind CSS** configuré dans `apps/web` (PostCSS), avec les jetons exposés en
  variables CSS dans `app/globals.css` : palette (`--ink`, `--paper`, `--field`,
  `--ledger`, `--muted`), échelle typographique, espacement, rayons, ombres.
- **Primitives** dans `apps/web/components/ui/` : `Button`, `Input`, `Label`,
  `Select`, `Dialog`, `Sheet`, `Table`, `Badge`, `Toast` (+ `use-toast`),
  `EmptyState`, `Skeleton`, `MoneyDisplay`.
- **Utilitaires** : `lib/cn.ts` (fusion de classes), `lib/money.ts` (formatage
  monétaire).
- **Page `/kitchen-sink`** : galerie de tous les jetons et primitives.

## Décisions appliquées

- ADR-002 — argent : `MoneyDisplay` formate `{ amountMinor, currency }` sans perte
  de précision.
- ADR-008 — i18n dès le socle : libellés et formats prêts pour FR/EN.
- Design brief §8 — deux publics : agent terrain sur mobile (cibles tactiles
  larges, fort contraste) et validateur bureau (densité, tableaux, clavier).

## Tests

- Rendu vérifié à **375px** et **1440px** sur `/kitchen-sink`.
- Navigation **entièrement au clavier** (focus visibles, ordre logique).
- `pnpm build` compile la chaîne Tailwind/PostCSS sans erreur.

## Fini quand

`/kitchen-sink` affiche tous les jetons et primitives, le rendu est correct à
375px et 1440px, et la page est navigable au clavier.

## Hors périmètre de ce bloc

Les écrans métier, l'authentification (B1.5), la mise en page applicative avec
navigation (B1.6).

## Dépend de

B1.1 (dépôt et outillage).
