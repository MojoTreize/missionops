# B1.2 — Intégration continue

## Objectif

Chaque Pull Request déclenche automatiquement une CI qui vérifie le formatage,
les types, le lint, les tests et le build. Une PR ne peut être fusionnée que si
la CI est verte.

## Contenu

- `.github/workflows/ci.yml` déclenché sur chaque `pull_request` vers `main`
  (et sur `push` vers `main`).
- Étapes : installation pnpm avec cache → format (Prettier) → types
  (`tsc --noEmit`) → lint (ESLint) → tests unitaires (Vitest) → build
  (`turbo build`).
- Annulation automatique des exécutions obsolètes (`concurrency`).
- Permissions minimales (`contents: read`).
- Garde-fou de durée : `timeout-minutes: 10` (règle du plan §3.5).
- Contrôle de statut requis sur `main` : la CI doit passer avant fusion.

## Hors périmètre de ce bloc

Ces étapes de la cible §3.5 arriveront avec les blocs qui les rendent utiles :

- Tests d'intégration + Postgres en service → avec `packages/db` (B1.3).
- Migrations sur base vierge → avec les migrations (B1.3).
- Tests E2E Playwright → avec les premiers parcours (B1.5+).
- `size-limit` (seuil de bundle) → avec le budget de performance.
- `deploy.yml` (staging) → avec l'environnement de déploiement (fin de phase 1).

## Tests

- Ouvrir une PR : le job « Vérifications » se lance et passe au vert.
- Introduire volontairement une erreur de type ou de lint : la CI échoue et
  bloque la fusion.

## Fini quand

- La CI tourne sur une vraie PR, est verte, et dure moins de 10 minutes.
- Le contrôle « Vérifications » est requis dans la protection de `main`.

## Dépend de

B1.1 (dépôt et outillage).
