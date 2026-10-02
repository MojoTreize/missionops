# Runbook — Sauvegarde et restauration

> Une sauvegarde jamais restaurée n'est pas une sauvegarde.

## Ce qui est sauvegardé

| Élément                                     | Où                                 | Comment                                           |
| ------------------------------------------- | ---------------------------------- | ------------------------------------------------- |
| Base PostgreSQL (toutes les organisations)  | Postgres managé UE                 | `pg_dump --format=custom` quotidien               |
| Fichiers : justificatifs, documents générés | `STORAGE_DIR` (volume Fly `/data`) | archive `tar.gz` quotidienne du répertoire        |
| Instantanés de l'hébergeur                  | Postgres managé, volume Fly        | automatiques, en complément (pas en remplacement) |

La base et les fichiers vont **ensemble** : une base restaurée sans ses
fichiers produit des Closure Packs sans justificatifs (ADR-007).

## Objectifs

- **RPO (perte de données maximale acceptée)** : 24 h avec la sauvegarde
  quotidienne seule ; ramené à quelques minutes si l'offre Postgres managée
  active la restauration à un instant donné (PITR), à activer sur `pilote` et
  `production`.
- **RTO (délai de remise en service)** : 4 h, chronométré à chaque test de
  restauration.

## Sauvegarde quotidienne

Script : `scripts/backup.sh`. À lancer chaque nuit (02:00, heure de Conakry =
UTC) depuis une machine de confiance qui a accès à la base et au volume (par
exemple une machine Fly éphémère de l'application, ou un poste d'exploitation).

```sh
DATABASE_URL="<chaîne de l'environnement>" \
STORAGE_DIR=/data/storage \
BACKUP_DIR=/sauvegardes/missionops \
BACKUP_GPG_RECIPIENT=sauvegardes@missionops.example \
scripts/backup.sh
```

Le script produit, horodatés en UTC :

- `missionops-db-<horodatage>.dump.gpg` (pg_dump format custom) ;
- `missionops-storage-<horodatage>.tar.gz.gpg` (archive de `STORAGE_DIR`) ;
- `missionops-<horodatage>.sha256` (empreintes des fichiers produits).

En cas d'échec, les fichiers partiels sont supprimés et le code de sortie est
non nul : la tâche qui l'appelle doit alerter (voir [supervision](supervision.md)).

### Chiffrement

- Si `BACKUP_GPG_RECIPIENT` est défini, chaque fichier est chiffré avec la clé
  publique GPG de ce destinataire et la version en clair est supprimée.
- **Obligatoire pour `pilote` et `production`.** La clé privée n'est jamais sur
  la machine qui sauvegarde : elle est conservée hors ligne par deux personnes
  de l'équipe (voir [secrets](secrets.md)).

### Copie hors site et rétention

Copier le dossier du jour vers un stockage objet UE **d'un autre fournisseur ou
d'une autre région** que la base, en écriture seule pour le compte de
sauvegarde.

| Série       | Conservation | Règle                                        |
| ----------- | ------------ | -------------------------------------------- |
| Quotidienne | 30 jours     | toutes les sauvegardes des 30 derniers jours |
| Mensuelle   | 12 mois      | la sauvegarde du 1ᵉʳ de chaque mois          |

Purger au-delà par une règle de cycle de vie du stockage objet, pas à la main.

## Restauration

Script : `scripts/restore.sh`. Il vérifie les empreintes, demande une
confirmation explicite, puis remplace le contenu de la base cible
(`pg_restore --clean --if-exists`) et extrait les fichiers dans un répertoire
**vide**.

```sh
TARGET_DATABASE_URL="<chaîne de la base cible>" \
TARGET_STORAGE_DIR=/data/storage-restaure \
scripts/restore.sh \
  missionops-db-20261001T020000Z.dump.gpg \
  missionops-storage-20261001T020000Z.tar.gz.gpg
```

- Restaurer d'abord dans une **base neuve**, jamais directement sur la base de
  production en service.
- Le rôle de la base cible doit être le rôle applicatif non superutilisateur
  (ADR-001) pour que la RLS reste effective après bascule.
- Après restauration : `pnpm db:migrate` sur la cible (sans effet si à jour),
  puis basculer `DATABASE_URL` et `STORAGE_DIR` de l'application
  (`fly secrets set …`), redémarrer, vérifier `GET /api/health`.
- Pour une exécution automatisée (exercice), `CONFIRM_RESTORE=oui` remplace la
  confirmation interactive.

## Test de restauration mensuel

Le premier lundi de chaque mois, une personne qui n'a pas fait le précédent :

1. prend la dernière sauvegarde **hors site** de `pilote` ;
2. la restaure dans une base et un répertoire jetables ;
3. démarre l'application en local contre cette base (`DATABASE_URL`,
   `STORAGE_DIR`) ;
4. vérifie : connexion d'un compte de test, ouverture d'une mission clôturée,
   téléchargement de son Closure Pack avec les images des justificatifs, et
   concordance des empreintes SHA-256 d'au moins trois justificatifs avec la
   table `receipts` ;
5. **chronomètre** l'ensemble et consigne date, durée, sauvegarde utilisée et
   anomalies dans `docs/runbooks/journal-restauration.md` (à créer au premier
   exercice) ;
6. détruit la base et les fichiers jetables (ils contiennent des données
   réelles).

Un test qui dépasse le RTO, ou qui échoue, ouvre un incident de gravité 2.
