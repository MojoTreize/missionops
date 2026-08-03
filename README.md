# MissionOps

**Le système d'exploitation des missions terrain en Guinée.**

MissionOps remplace WhatsApp, Excel et les reçus papier par un circuit unique :
de la demande de mission jusqu'au dossier de clôture accepté par le bailleur.

> Cœur du produit — la boucle argent-justificatif :
> demande → validation → avance → dépenses terrain (hors ligne, photo du reçu)
> → réconciliation → dossier de clôture exportable.

## Démarrer

Prérequis : [Node.js](https://nodejs.org) ≥ 20 et [pnpm](https://pnpm.io) ≥ 9.

```bash
git clone https://github.com/MojoTreize/missionops.git
cd missionops
pnpm install
pnpm dev
```

L'application est alors disponible sur http://localhost:3000.

## Structure du monorepo

```
missionops/
├── apps/
│   └── web/            # Next.js — PWA terrain + back-office
├── packages/
│   ├── core/           # domaine métier pur (argent, missions, réconciliation)
│   ├── db/             # Drizzle : schéma, migrations, requêtes
│   ├── contracts/      # schémas Zod partagés client ↔ serveur
│   ├── ui/             # design system
│   ├── documents/      # génération PDF (Mission Pack, Closure Pack)
│   ├── notifications/  # abstraction e-mail / WhatsApp / SMS
│   └── config/         # tsconfig, eslint, tailwind partagés
├── e2e/                # Playwright
└── docs/               # plan, ADR, fiches de bloc, specs, runbooks, terrain
```

## Commandes principales

| Commande         | Effet                                |
| ---------------- | ------------------------------------ |
| `pnpm dev`       | Lance l'application en développement |
| `pnpm build`     | Compile tous les paquets             |
| `pnpm lint`      | Analyse ESLint                       |
| `pnpm typecheck` | Vérification des types               |
| `pnpm test`      | Tests unitaires                      |
| `pnpm format`    | Formatage Prettier                   |

## Méthode

Le projet se construit **un bloc à la fois** : une spec écrite dans
`docs/blocks/`, une session, une Pull Request. Le plan complet vit dans
[docs/plan.md](docs/plan.md). Le contexte permanent pour l'assistant IA est
dans [CLAUDE.md](CLAUDE.md).

## Contribution

Voir [CONTRIBUTING.md](CONTRIBUTING.md).
