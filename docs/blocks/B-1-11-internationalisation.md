# B1.11 — Internationalisation

## Objectif

L'interface existe en français (par défaut) et en anglais. Basculer la langue ne
laisse aucun texte en dur à l'écran.

## Contenu

- **Bibliothèque i18n légère** (`apps/web/lib/i18n/`), sans dépendance externe :
  - `locales.ts` : langues supportées (`fr`, `en`), langue par défaut, cookie de
    langue, libellés et étiquettes `Intl`.
  - `messages/fr.ts` (source de vérité) et `messages/en.ts` typé `Messages` : la
    forme du catalogue français impose celle de l'anglais à la compilation.
  - `translate.ts` : type `MessageKey` (clés « à points » dérivées du catalogue),
    résolution et interpolation `{param}`, `createTranslator`.
  - `format.ts` : `formatDate` / `formatNumber` localisés via `Intl`.
  - `server.ts` (`server-only`) : `getLocale` / `getT` lisant le cookie.
  - `client.tsx` : `I18nProvider`, hooks `useT` / `useLocale`.
- **Câblage** : le layout racine (`app/layout.tsx`) lit la langue, pose
  `<html lang>` et fournit le catalogue via `I18nProvider` ; les composants
  serveur traduisent avec `getT`, les composants clients avec `useT`.
- **Sélecteur de langue** dans le profil (`/profile`) : menu déroulant soumis à
  l'action serveur `setLocaleAction`, qui pose le cookie et recharge. Accès au
  profil depuis la barre latérale (ordinateur) et le menu compte (mobile).
- **Navigation** : `lib/nav.ts` porte désormais des clés de traduction
  (`labelKey`, `ROUTE_LABEL_KEYS`) résolues au rendu ; le fil d'Ariane retombe
  sur un libellé capitalisé pour les segments inconnus.
- **Traduction complète** des écrans (auth, coque, tableau de bord,
  organisations, sections, erreurs, 404) et des messages renvoyés par les actions
  serveur (`(auth)/actions.ts`, `(app)/organizations/actions.ts`).
- **Règle ESLint** `react/jsx-no-literals` sur `apps/web/**/*.tsx` interdisant les
  chaînes littérales dans le JSX (vitrine `kitchen-sink` exclue).

## Décisions appliquées

- Langue mémorisée dans un cookie lu côté serveur à chaque rendu : fonctionne
  hors ligne, sans base de données, et fixe `<html lang>` correctement.
- Français langue par défaut ; anglais présent dès le socle (ADR-008).
- Parité des catalogues garantie deux fois : au type (`en: Messages`) et à
  l'exécution (test de comparaison des clés).
- Les libellés d'attributs (`placeholder`, `aria-label`, `title`) sont traduits
  par discipline ; la règle ESLint couvre le contenu textuel du JSX.

## Tests

- Unitaire (Vitest) : aucune clé manquante ni en trop entre `fr` et `en`, aucune
  valeur vide, interpolation des paramètres, repli sur la clé absente.
- Unitaire : la navigation expose des clés de libellé ; le fil d'Ariane résout
  les routes connues et retombe sur un libellé capitalisé sinon.
- Hors ligne : typecheck, lint (dont `react/jsx-no-literals`), tests et build.

## Fini quand

Basculer la langue depuis le profil ne laisse aucun texte en dur à l'écran :
navigation, écrans, formulaires et messages d'action passent du français à
l'anglais.

## Hors périmètre de ce bloc

L'inspection visuelle en anglais sous navigateur (Playwright non encore
installé) : la parité des clés et la traduction des écrans sont vérifiées au type
et par test ; l'E2E sera ajouté avec la suite E2E. La langue n'est pas encore
persistée sur le profil utilisateur en base (cookie uniquement).

## Dépend de

B1.10 (coque applicative).
