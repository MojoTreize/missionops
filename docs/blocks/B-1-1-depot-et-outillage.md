# B1.1 — Dépôt et outillage

## Objectif

`git clone && pnpm install && pnpm dev` fonctionne et affiche une page.

## Contenu

- Monorepo pnpm + Turborepo
- TypeScript strict (config partagée dans `packages/config`)
- ESLint (flat config) + Prettier
- Structure de dossiers de la section 3.1 du plan
- `README.md`, `CONTRIBUTING.md`, `CLAUDE.md`, `CHANGELOG.md`
- Modèles d'issue (`bloc`, `bug`, `terrain`) et de PR
- Application Next.js minimale dans `apps/web`

## Tests

Un développeur qui n'a jamais vu le projet démarre en moins de 10 minutes en
suivant le `README.md`.

## Fini quand

Vérifié réellement avec une personne extérieure au projet.

## Dépend de

B0.6 (décision continuer/arrêter).

## Hors périmètre de ce bloc

Intégration continue (B1.2) · base de données (B1.3) · jetons de design
et primitives (B1.4).
