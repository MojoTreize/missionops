#!/usr/bin/env bash
#
# Restauration MissionOps (B8.5) à partir des fichiers produits par
# scripts/backup.sh. Voir docs/runbooks/sauvegarde-restauration.md.
#
# Usage :
#   TARGET_DATABASE_URL=… scripts/restore.sh <fichier-db.dump[.gpg]> [<fichier-storage.tar.gz[.gpg]>]
#
# Variables :
#   TARGET_DATABASE_URL  (obligatoire) base cible. Son contenu est REMPLACÉ
#                        (pg_restore --clean --if-exists).
#   TARGET_STORAGE_DIR   (obligatoire si une archive de fichiers est fournie)
#                        répertoire cible des fichiers ; doit être vide ou absent.
#   CONFIRM_RESTORE      (facultatif) mettre « oui » pour une exécution non
#                        interactive (exercice de restauration automatisé).
#
# Les fichiers .gpg sont déchiffrés avec la clé privée du trousseau local.
# Un fichier .sha256 voisin, s'il existe, est vérifié avant toute écriture.
set -euo pipefail

if [ "$#" -lt 1 ] || [ "$#" -gt 2 ]; then
  echo "Usage : TARGET_DATABASE_URL=… $0 <db.dump[.gpg]> [<storage.tar.gz[.gpg]>]" >&2
  exit 2
fi
: "${TARGET_DATABASE_URL:?TARGET_DATABASE_URL doit être défini}"
db_input="$1"
storage_input="${2:-}"
if [ -n "$storage_input" ]; then
  : "${TARGET_STORAGE_DIR:?TARGET_STORAGE_DIR doit être défini pour restaurer les fichiers}"
fi

for cmd in pg_restore tar sha256sum; do
  command -v "$cmd" >/dev/null 2>&1 || { echo "Commande introuvable : $cmd" >&2; exit 1; }
done
inputs=("$db_input")
[ -z "$storage_input" ] || inputs+=("$storage_input")
for f in "${inputs[@]}"; do
  [ -f "$f" ] || { echo "Fichier introuvable : $f" >&2; exit 1; }
done

# Vérification des empreintes si le fichier .sha256 du même horodatage existe.
verify_sum() {
  local file="$1" dir base stamp sums
  dir="$(dirname "$file")"
  base="$(basename "$file")"
  stamp="$(printf '%s' "$base" | sed -n 's/^missionops-[a-z]*-\([0-9TZ]*\)\..*$/\1/p')"
  sums="$dir/missionops-$stamp.sha256"
  if [ -n "$stamp" ] && [ -f "$sums" ]; then
    (cd "$dir" && grep " $base\$" "missionops-$stamp.sha256" | sha256sum --check --status) \
      || { echo "Empreinte SHA-256 invalide : $file" >&2; exit 1; }
    echo "✓ Empreinte vérifiée : $base"
  else
    echo "! Pas de fichier d'empreintes pour $base : vérification ignorée" >&2
  fi
}
verify_sum "$db_input"
[ -z "$storage_input" ] || verify_sum "$storage_input"

# Garde-fou : la cible est écrasée. On affiche l'hôte et la base, jamais le mot de passe.
target_display="$(printf '%s' "$TARGET_DATABASE_URL" | sed -E 's#^([a-z]+://)[^@/]*@#\1***@#')"
echo "ATTENTION : la base cible va être remplacée : $target_display"
[ -z "$storage_input" ] || echo "ATTENTION : les fichiers seront restaurés dans : $TARGET_STORAGE_DIR"
if [ "${CONFIRM_RESTORE:-}" != "oui" ]; then
  if [ ! -t 0 ]; then
    echo "Exécution non interactive : définir CONFIRM_RESTORE=oui pour confirmer." >&2
    exit 1
  fi
  printf 'Tapez « restaurer » pour confirmer : '
  read -r answer
  [ "$answer" = "restaurer" ] || { echo "Abandon." >&2; exit 1; }
fi

workdir="$(mktemp -d)"
trap 'rm -rf "$workdir"' EXIT
chmod 700 "$workdir"

# Déchiffre si nécessaire et renvoie le chemin du fichier en clair.
plain() {
  local file="$1" out
  case "$file" in
    *.gpg)
      command -v gpg >/dev/null 2>&1 || { echo "Commande introuvable : gpg" >&2; exit 1; }
      out="$workdir/$(basename "${file%.gpg}")"
      gpg --batch --yes --decrypt --output "$out" "$file" >&2
      printf '%s' "$out"
      ;;
    *) printf '%s' "$file" ;;
  esac
}

started="$(date +%s)"
db_plain="$(plain "$db_input")"
echo "→ Base : pg_restore --clean --if-exists"
pg_restore --clean --if-exists --no-owner --no-privileges --exit-on-error \
  --dbname="$TARGET_DATABASE_URL" "$db_plain"

if [ -n "$storage_input" ]; then
  if [ -d "$TARGET_STORAGE_DIR" ] && [ -n "$(ls -A "$TARGET_STORAGE_DIR")" ]; then
    echo "TARGET_STORAGE_DIR n'est pas vide : $TARGET_STORAGE_DIR (restauration des fichiers refusée)" >&2
    exit 1
  fi
  storage_plain="$(plain "$storage_input")"
  echo "→ Fichiers : extraction dans $TARGET_STORAGE_DIR"
  mkdir -p "$TARGET_STORAGE_DIR"
  tar -xzf "$storage_plain" -C "$TARGET_STORAGE_DIR"
fi

echo "✓ Restauration terminée en $(($(date +%s) - started)) s."
echo "  Étapes suivantes : pnpm db:migrate sur la cible, puis GET /api/health."
