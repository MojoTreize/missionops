# ADR-005 — Suppression logique généralisée

- **Statut** : acceptée
- **Bloc** : B1.3 (base de données et migrations)
- **Date** : rédigée a posteriori, après fusion de B1.3

## Contexte

Une mission, une dépense ou un justificatif peut être réclamé par un bailleur
des années après les faits. Une donnée supprimée physiquement est une donnée
qu'on ne peut plus produire, et un trou dans la piste d'audit (ADR-004).

## Décision

1. **Aucun `DELETE` physique sur les données métier.** « Supprimer » signifie
   renseigner `deleted_at`.
2. **Colonnes temporelles communes** : `created_at`, `updated_at` et
   `deleted_at` (`timestamptz`), définies une seule fois dans
   `packages/db/src/schema/columns.ts` (`timestamps`) et réutilisées par chaque
   table.
3. **Les lectures excluent par défaut les lignes supprimées** : une requête qui
   doit voir les lignes supprimées (audit, export intégral) le dit
   explicitement.

## Conséquences

- **La révocation d'une session** (déconnexion) est elle-même une suppression
  logique (`sessions.deleted_at`).
- **Une écriture financière n'est jamais « supprimée »** mais annulée par une
  écriture inverse (avance, dépense : voir la Phase 3). `deleted_at` sert aux
  objets de gestion (brouillon abandonné, lieu retiré), pas à l'argent.
- **Contraintes d'unicité** : une contrainte `unique` simple empêche de recréer
  une ligne « supprimée » (même slug, même e-mail). Utiliser des index uniques
  partiels `WHERE deleted_at IS NULL` quand c'est le comportement voulu.
- **Le filtrage par défaut n'est pas encore outillé.** Le plan prévoit des « vues
  filtrées par défaut » ; aujourd'hui chaque requête doit ajouter
  `isNull(table.deletedAt)` à la main. À outiller (helper dans `packages/db`,
  ou vues) quand les premières tables métier arrivent (Phase 2), avant que
  l'oubli ne devienne courant.
- **Droit à l'effacement** (données personnelles) : la suppression logique ne
  suffira pas toujours. Le cas sera traité par une procédure d'anonymisation
  documentée (B8.7), pas par un `DELETE`.

## Alternatives écartées

- **`DELETE` + table d'archive** : deux chemins de lecture, et une archive
  facile à oublier dans les migrations.
- **Booléen `is_deleted`** : perd la date de suppression, que l'auditeur demande.
