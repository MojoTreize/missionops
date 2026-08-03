# MissionOps — contexte projet

## Ce qu'on construit

Plateforme de gestion des missions terrain pour ONG, ambassades et entreprises
en Guinée. Cœur du produit : la boucle
demande → validation → avance → dépenses terrain → réconciliation
→ dossier de clôture auditable.

## Contraintes non négociables

- Connexion instable : tout écran terrain doit fonctionner hors ligne
- Android d'entrée de gamme, écran 375 px, 3G
- Multi-devises GNF / EUR / USD, taux figé à la transaction
- Traçabilité totale : aucune suppression physique de données
- Français et anglais, français par défaut

## Stack

TypeScript strict · Next.js App Router · React · Tailwind ·
PostgreSQL · Drizzle ORM · Zod · Vitest · Playwright · pnpm + Turborepo

## Règles de code

- L'argent est TOUJOURS un entier + code devise. Jamais un flottant.
  Utiliser le type Money de packages/core/money. Jamais de calcul
  monétaire ailleurs.
- Toute table porte organisation_id. Toute requête est filtrée dessus.
- La logique métier va dans packages/core (pur, testable, sans I/O).
  Les routes et composants n'orchestrent que des appels au domaine.
- Toute entrée utilisateur est validée par un schéma Zod de
  packages/contracts, partagé client et serveur.
- Toute mutation écrit une entrée dans audit_log.
- Les textes d'interface passent par la fonction t(). Jamais de
  chaîne en dur dans un composant.
- Suppression = colonne deleted_at. Jamais de DELETE.

## Ce qu'il ne faut pas faire

- Ne pas ajouter de dépendance sans le demander d'abord
- Ne pas créer de fichier hors du périmètre du bloc en cours
- Ne pas modifier une migration déjà fusionnée : en créer une nouvelle
- Ne pas écrire de logique métier dans un composant React
- Ne pas utiliser localStorage pour des données métier (IndexedDB via
  la couche de synchronisation)

## Commandes

pnpm dev · pnpm test · pnpm test:e2e · pnpm db:migrate ·
pnpm db:seed:demo · pnpm lint · pnpm typecheck
