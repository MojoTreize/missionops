#!/usr/bin/env bash
# MissionOps — démarrage local en une commande (macOS et Linux).
#
# Installe ce qui manque (Node.js via nvm, pnpm, PostgreSQL 16 sans Docker),
# prépare la base de démonstration, compile puis lance l'application et ouvre
# le navigateur sur http://localhost:3000.
#
# Utilisation :  bash scripts/demarrer.sh
# Options     :  --reinitialiser   remet les données de démonstration à zéro
#                --dev             mode développement (rechargement à chaud)
set -euo pipefail

REINIT=0
DEV=0
for arg in "$@"; do
  case "$arg" in
    --reinitialiser) REINIT=1 ;;
    --dev) DEV=1 ;;
  esac
done

RACINE="$(cd "$(dirname "$0")/.." && pwd)"
DONNEES="$HOME/.missionops"
PG_VERSION="16.10-1"
PGDATA="$DONNEES/pgdata"
PORT=5439
MARQUEUR="$DONNEES/demo-chargee"

etape() { printf '\n\033[32m==> %s\033[0m\n' "$1"; }
existe() { command -v "$1" >/dev/null 2>&1; }

mkdir -p "$DONNEES"
cd "$RACINE"

# ------------------------------------------------------------------ Node.js
etape "Node.js"
export NVM_DIR="$HOME/.nvm"
if ! existe node; then
  if [ ! -s "$NVM_DIR/nvm.sh" ]; then
    curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
  fi
  # shellcheck disable=SC1091
  . "$NVM_DIR/nvm.sh"
  nvm install 22
fi
if [ "$(node -p 'process.versions.node.split(".")[0]')" -lt 20 ]; then
  [ -s "$NVM_DIR/nvm.sh" ] || curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
  # shellcheck disable=SC1091
  . "$NVM_DIR/nvm.sh"
  nvm install 22
fi
echo "Node.js $(node -v)"

# ------------------------------------------------------------------ pnpm
etape "pnpm"
if ! existe pnpm; then
  npm install -g pnpm@11 || {
    echo "npm install -g a échoué (droits) : installation de pnpm dans le dossier personnel."
    curl -fsSL https://get.pnpm.io/install.sh | env PNPM_VERSION=11.9.0 sh -
    export PNPM_HOME="$HOME/.local/share/pnpm"
    export PATH="$PNPM_HOME:$PATH"
  }
fi
echo "pnpm $(pnpm -v)"

# ------------------------------------------------------------------ PostgreSQL
etape "PostgreSQL 16"
PGBIN=""
for dir in "$DONNEES/pgsql/bin" /usr/lib/postgresql/16/bin /opt/homebrew/opt/postgresql@16/bin \
  /usr/local/opt/postgresql@16/bin /Applications/Postgres.app/Contents/Versions/16/bin; do
  if [ -x "$dir/pg_ctl" ]; then PGBIN="$dir"; break; fi
done
if [ -z "$PGBIN" ] && existe pg_ctl && pg_ctl --version | grep -qE ' (1[6-9]|[2-9][0-9])\.'; then
  PGBIN="$(dirname "$(command -v pg_ctl)")"
fi
if [ -z "$PGBIN" ]; then
  if [ "$(uname)" = "Darwin" ]; then
    echo "Téléchargement de PostgreSQL $PG_VERSION (environ 340 Mo)…"
    curl -fL -o "$DONNEES/pgsql.zip" \
      "https://get.enterprisedb.com/postgresql/postgresql-$PG_VERSION-osx-binaries.zip"
    unzip -q -o "$DONNEES/pgsql.zip" -x 'pgsql/pgAdmin 4/*' 'pgsql/stackbuilder/*' -d "$DONNEES"
    rm "$DONNEES/pgsql.zip"
    PGBIN="$DONNEES/pgsql/bin"
  elif existe apt-get; then
    echo "Installation de PostgreSQL via apt (mot de passe administrateur demandé)…"
    sudo apt-get update && sudo apt-get install -y postgresql
    PGBIN="$(ls -d /usr/lib/postgresql/*/bin | sort -V | tail -1)"
  elif existe dnf; then
    sudo dnf install -y postgresql-server
    PGBIN="$(dirname "$(command -v pg_ctl)")"
  else
    echo "Installez PostgreSQL 16 puis relancez ce script." >&2
    exit 1
  fi
fi
echo "Binaires : $PGBIN"

if [ ! -f "$PGDATA/PG_VERSION" ]; then
  "$PGBIN/initdb" -D "$PGDATA" -U postgres -A trust -E UTF8 --locale=C
fi
if ! "$PGBIN/pg_ctl" -D "$PGDATA" status >/dev/null 2>&1; then
  "$PGBIN/pg_ctl" -D "$PGDATA" -l "$DONNEES/postgres.log" -o "-p $PORT -k $DONNEES" -w start
fi
PSQL=("$PGBIN/psql" -h localhost -p "$PORT" -U postgres)
if [ "$("${PSQL[@]}" -tAc "select 1 from pg_roles where rolname = 'missionops'")" != "1" ]; then
  "${PSQL[@]}" -c "create role missionops login password 'missionops'"
  "${PSQL[@]}" -c "create database missionops owner missionops"
  rm -f "$MARQUEUR"
fi
echo "PostgreSQL prêt sur le port $PORT"

export DATABASE_URL="postgres://missionops:missionops@localhost:$PORT/missionops"
CRON_SECRET="local-$(node -p 'require("crypto").randomUUID()')"
export CRON_SECRET

# ------------------------------------------------------------------ Projet
etape "Dépendances du projet"
pnpm install

if [ "$REINIT" = 1 ] || [ ! -f "$MARQUEUR" ]; then
  etape "Base de démonstration (Croix-Rouge Guinée, 9 missions)"
  pnpm db:reset
  pnpm db:seed:demo
  touch "$MARQUEUR"
else
  etape "Base de démonstration déjà chargée (--reinitialiser pour repartir de zéro)"
  pnpm db:migrate
fi

cat <<'TEXTE'

  Application : http://localhost:3000
  Mot de passe des comptes de démo : motdepasse-demo
    finance  aissatou.bah@croix-rouge-guinee.demo
    agent    alpha.diakite@croix-rouge-guinee.demo
    admin    awa.diallo@croix-rouge-guinee.demo
  Navigateur conseillé : Chrome, Edge ou Firefox. Ctrl+C pour arrêter.

TEXTE

ouvrir() {
  sleep 12
  if existe open; then open "http://localhost:3000"; elif existe xdg-open; then xdg-open "http://localhost:3000"; fi
}

if [ "$DEV" = 1 ]; then
  etape "Lancement en mode développement"
  ouvrir >/dev/null 2>&1 &
  pnpm --filter @missionops/web dev
else
  etape "Compilation (1 à 2 minutes)"
  pnpm --filter @missionops/web build
  etape "Lancement"
  ouvrir >/dev/null 2>&1 &
  pnpm --filter @missionops/web start
fi
