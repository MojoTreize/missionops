#!/usr/bin/env bash
#
# Sauvegarde MissionOps (B8.5) : base PostgreSQL + fichiers (justificatifs,
# documents générés). Voir docs/runbooks/sauvegarde-restauration.md.
#
# Variables :
#   DATABASE_URL          (obligatoire) chaîne de connexion de la base à sauvegarder
#   STORAGE_DIR           (obligatoire) répertoire des fichiers (ex. /data/storage)
#   BACKUP_DIR            (facultatif)  destination, par défaut ./backups
#   BACKUP_GPG_RECIPIENT  (facultatif)  clé GPG destinataire : si définie, les
#                                       archives sont chiffrées et les fichiers
#                                       en clair supprimés
#
# Produit, horodaté en UTC (AAAAMMJJTHHMMSSZ) :
#   missionops-db-<horodatage>.dump[.gpg]          pg_dump format custom
#   missionops-storage-<horodatage>.tar.gz[.gpg]   archive de STORAGE_DIR
#   missionops-<horodatage>.sha256                 empreintes des fichiers produits
#
# Usage : DATABASE_URL=… STORAGE_DIR=… scripts/backup.sh
set -euo pipefail

: "${DATABASE_URL:?DATABASE_URL doit être défini}"
: "${STORAGE_DIR:?STORAGE_DIR doit être défini}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
BACKUP_GPG_RECIPIENT="${BACKUP_GPG_RECIPIENT:-}"

for cmd in pg_dump tar sha256sum; do
  command -v "$cmd" >/dev/null 2>&1 || { echo "Commande introuvable : $cmd" >&2; exit 1; }
done
if [ -n "$BACKUP_GPG_RECIPIENT" ]; then
  command -v gpg >/dev/null 2>&1 || { echo "Commande introuvable : gpg" >&2; exit 1; }
fi
if [ ! -d "$STORAGE_DIR" ]; then
  echo "STORAGE_DIR introuvable : $STORAGE_DIR" >&2
  exit 1
fi

umask 077
mkdir -p "$BACKUP_DIR"
stamp="$(date -u +%Y%m%dT%H%M%SZ)"
db_file="$BACKUP_DIR/missionops-db-$stamp.dump"
storage_file="$BACKUP_DIR/missionops-storage-$stamp.tar.gz"
sum_file="$BACKUP_DIR/missionops-$stamp.sha256"

# Nettoie les fichiers partiels en cas d'échec.
cleanup() {
  status=$?
  if [ "$status" -ne 0 ]; then
    rm -f "$db_file" "$storage_file" "$db_file.gpg" "$storage_file.gpg" "$sum_file"
    echo "Sauvegarde échouée (code $status), fichiers partiels supprimés." >&2
  fi
}
trap cleanup EXIT

echo "→ Base : pg_dump format custom"
pg_dump --format=custom --no-owner --no-privileges --file="$db_file" "$DATABASE_URL"

echo "→ Fichiers : archive de $STORAGE_DIR"
tar -czf "$storage_file" -C "$STORAGE_DIR" .

produced=("$db_file" "$storage_file")
if [ -n "$BACKUP_GPG_RECIPIENT" ]; then
  echo "→ Chiffrement GPG pour $BACKUP_GPG_RECIPIENT"
  encrypted=()
  for f in "${produced[@]}"; do
    gpg --batch --yes --trust-model always --encrypt \
      --recipient "$BACKUP_GPG_RECIPIENT" --output "$f.gpg" "$f"
    rm -f "$f"
    encrypted+=("$f.gpg")
  done
  produced=("${encrypted[@]}")
fi

(cd "$BACKUP_DIR" && sha256sum "${produced[@]##*/}") >"$sum_file"

echo "✓ Sauvegarde terminée :"
for f in "${produced[@]}" "$sum_file"; do
  printf '  %s (%s)\n' "$f" "$(du -h "$f" | cut -f1)"
done
