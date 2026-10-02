# B8.5 — Sauvegardes et restauration

> **Statut : partiel.** Les scripts et la procédure existent ; la
> planification et le premier exercice restent à faire.

## Objectif

Pouvoir perdre la base sans perdre le client.

## Contenu

- **`scripts/backup.sh`** : `pg_dump` format custom et archive `tar.gz` de
  `STORAGE_DIR`, horodatés en UTC dans `BACKUP_DIR`, chiffrement GPG si
  `BACKUP_GPG_RECIPIENT` est défini, fichier d'empreintes SHA-256, nettoyage
  des fichiers partiels en cas d'échec.
- **`scripts/restore.sh`** : vérification des empreintes, déchiffrement,
  confirmation explicite (ou `CONFIRM_RESTORE=oui`), `pg_restore --clean
--if-exists` vers `TARGET_DATABASE_URL`, extraction des fichiers dans un
  répertoire vide.
- **Runbook** `docs/runbooks/sauvegarde-restauration.md` : rétention 30 jours /
  12 mois, copie hors site, RPO 24 h (minutes avec PITR), RTO 4 h, test de
  restauration mensuel chronométré.

## Décisions appliquées

- La base et les fichiers se sauvegardent ensemble (ADR-007).

## Tests

Validation syntaxique (`bash -n`) et aller-retour sauvegarde → restauration
avec chiffrement sur des données factices. À faire : exercice complet réel.

## Fini quand

Le premier exercice de restauration est réussi et documenté.

## Hors périmètre de ce bloc

Réplication dans une seconde région · PITR (option de l'hébergeur à activer).

## Dépend de

B8.4 (observabilité).
