# Runbook — Déploiement

> Objectif : mettre une version en ligne sur `staging`, `pilote` ou
> `production`, appliquer ses migrations, et savoir revenir en arrière.

## Environnements

| Environnement | Application Fly.io   | Déclenchement                       | Données               |
| ------------- | -------------------- | ----------------------------------- | --------------------- |
| `staging`     | `missionops-staging` | automatique à chaque fusion `main`  | seed de démo          |
| `pilote`      | `missionops-pilote`  | manuel, après validation en staging | réelles, sauvegardées |
| `production`  | `missionops`         | manuel, après une semaine en pilote | réelles, sauvegardées |

Toutes les applications sont en région `cdg` (Paris), avec un Postgres managé en
UE et un volume `/data` pour les fichiers (voir
[hébergement](../conformite/hebergement.md)). Seul `staging` est outillé à ce
jour (`fly.toml`, `.github/workflows/deploy.yml`). Pour `pilote` et
`production`, créer un fichier `fly.<env>.toml` copié de `fly.toml` (nom
d'application, `min_machines_running = 1`, pas d'arrêt automatique) et un
environnement GitHub protégé par une approbation manuelle.

## Avant de déployer

1. La CI de `main` est verte (lint, typecheck, tests).
2. Lire la liste des migrations nouvelles depuis le dernier déploiement :
   `git diff --stat <tag-précédent>..HEAD -- packages/db/migrations`.
3. Pour `pilote` et `production` : une **sauvegarde fraîche** existe
   (`scripts/backup.sh`, voir [sauvegarde](sauvegarde-restauration.md)), et la
   version tourne en `staging` depuis au moins 24 h sans erreur dans les
   journaux.
4. Prévenir le client pilote si une migration risquée est prévue (voir
   ci-dessous).

## Déployer

### Staging (automatique)

La fusion dans `main` déclenche `deploy.yml` : `pnpm db:migrate` avec le
secret `STAGING_DATABASE_URL`, puis `flyctl deploy --remote-only --config fly.toml`.
Suivre l'exécution dans l'onglet Actions. Rien à faire de plus.

### Pilote et production (manuel)

```sh
git checkout main && git pull
git tag -a v0.X.Y -m "Version 0.X.Y" && git push origin v0.X.Y

# 1. Migrations, depuis un poste de confiance, avec la chaîne de l'environnement
DATABASE_URL="<chaîne pilote>" pnpm db:migrate

# 2. Déploiement de l'image
flyctl deploy --remote-only --config fly.pilote.toml
```

Les migrations passent **avant** le déploiement : le code en cours d'exécution
doit donc tolérer le nouveau schéma (voir « Migrations risquées »).

## Vérifier

1. `curl -fsS https://<app>.fly.dev/api/health` renvoie `{"status":"ok","database":"ok",…}`.
2. `flyctl status --config fly.<env>.toml` : toutes les machines `started`, contrôles `passing`.
3. `flyctl logs --config fly.<env>.toml` : aucune ligne `"level":"error"` dans
   les cinq minutes qui suivent.
4. Parcours manuel : connexion, liste des missions, ouverture d'une fiche,
   écran Terrain.
5. La tâche planifiée tourne toujours (voir [tâches planifiées](taches-planifiees.md)).

## Migrations

- **Ne jamais modifier une migration déjà fusionnée** : en créer une nouvelle
  (`pnpm db:generate`, puis relecture du SQL produit).
- **Toute nouvelle table métier** appelle `enable_org_rls` et `enable_audit`
  (ADR-001, ADR-004) ; le test d'isolation échoue sinon.
- **Migrations risquées** (renommage, suppression de colonne, changement de
  type, index sur une grosse table) : procéder en deux temps.
  1. Version N : ajouter la nouvelle colonne, écrire dans les deux.
  2. Version N+1 : basculer les lectures, puis retirer l'ancienne colonne.
     Créer les index lourds avec `CREATE INDEX CONCURRENTLY` dans une migration
     dédiée. Tester la migration sur une copie restaurée de la base pilote avant
     de la jouer en pilote.

## Revenir en arrière

**Code seul (aucune migration dans la version)** :

```sh
flyctl releases --config fly.<env>.toml          # repérer la version précédente
flyctl deploy --config fly.<env>.toml --image <image de la version précédente>
```

**Avec migration** : les migrations ne sont pas réversibles automatiquement.

1. Si la migration est _additive_ (nouvelle table, nouvelle colonne
   facultative), revenir au code précédent suffit : l'ancien code ignore ce
   qu'il ne connaît pas.
2. Sinon, écrire une **migration corrective** (nouvelle migration, jamais une
   modification de l'ancienne) et la déployer.
3. En dernier recours (données corrompues), restaurer la sauvegarde prise avant
   le déploiement : voir [sauvegarde et restauration](sauvegarde-restauration.md).
   Toute écriture faite depuis est perdue : c'est un incident de gravité 1.

Consigner chaque retour arrière dans le journal d'incident (voir
[incident](incident.md)).
