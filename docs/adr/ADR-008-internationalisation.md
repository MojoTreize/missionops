# ADR-008 — Internationalisation dès le socle

- **Statut** : acceptée
- **Bloc** : B1.11 (internationalisation)
- **Date** : rédigée a posteriori, après fusion de B1.11

## Contexte

Les utilisateurs terrain en Guinée travaillent en français. Les sièges, les
bailleurs et une partie des expatriés lisent l'anglais. Ajouter l'i18n après
coup sur des centaines d'écrans coûte des semaines ; le faire au socle coûte une
demi-journée.

## Décision

1. **Français et anglais dès B1.11, français par défaut.**
2. **Bibliothèque maison, sans dépendance** (`apps/web/lib/i18n/`) :
   catalogues TypeScript, clés « à points », interpolation `{param}`, formats de
   date et de nombre via `Intl`.
3. **Le catalogue français est la source de vérité** : `messages/en.ts` est typé
   `Messages`, dérivé de `fr`. Une clé manquante en anglais est une erreur de
   compilation, et un test de parité le vérifie aussi à l'exécution.
4. **Langue mémorisée dans un cookie** lu côté serveur (`getLocale`, `getT`), qui
   fixe `<html lang>` au rendu. Fonctionne hors ligne et sans base.
5. **Aucune chaîne en dur dans le JSX** : la règle ESLint
   `react/jsx-no-literals` le refuse dans `apps/web` (vitrine `kitchen-sink`
   exclue).

## Conséquences

- **Chaque bloc livre ses textes dans les deux langues** (définition de
  « terminé », plan §4.3). Un texte manquant fait échouer le typecheck.
- **Les attributs** (`placeholder`, `aria-label`, `title`) ne sont pas couverts
  par la règle ESLint : ils passent par `t()` par discipline et en revue.
- **Les montants** ne passent pas par `formatNumber` : ils suivent ADR-002
  (`Money`), avec un formatage qui dépend de la devise.
- **Pas de pluralisation avancée ni d'ICU** : si un besoin réel apparaît
  (« 1 dépense » / « 3 dépenses »), on étend le traducteur ou on adopte une
  bibliothèque, ce qui passe par une demande d'ajout de dépendance.
- **Les documents PDF** (Phase 5) et les notifications (Phase 7) devront
  réutiliser les mêmes catalogues, ou des catalogues dérivés. À trancher en B5.1.

## Alternatives écartées

- **`next-intl`, `i18next`** : complets, mais une dépendance et des concepts de
  plus pour un besoin de deux langues. Rien n'empêche d'y migrer plus tard : les
  clés resteraient les mêmes.
- **Langue dans l'URL** (`/fr/…`, `/en/…`) : utile pour le référencement, inutile
  pour une application authentifiée, et cela complique le service worker hors
  ligne (Phase 4).
