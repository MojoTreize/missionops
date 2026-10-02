# MissionOps - demarrage local en une commande (Windows).
#
# Installe ce qui manque (Node.js, pnpm, PostgreSQL 16 portable sans Docker),
# prepare la base de demonstration, compile puis lance l'application et ouvre
# le navigateur sur http://localhost:3000.
#
# Utilisation : double-cliquez sur scripts\demarrer.cmd, ou dans PowerShell :
#   powershell -ExecutionPolicy Bypass -File scripts\demarrer.ps1
# Options :
#   -Reinitialiser   remet les donnees de demonstration a zero
#   -Dev             lance le mode developpement (rechargement a chaud)

param([switch]$Reinitialiser, [switch]$Dev)

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

$Racine   = Split-Path -Parent $PSScriptRoot
$Donnees  = Join-Path $env:LOCALAPPDATA "MissionOps"
$PgVersion = "16.10-1"
$PgDir    = Join-Path $Donnees "pgsql"
$PgBin    = Join-Path $PgDir "bin"
$PgData   = Join-Path $Donnees "pgdata"
$PgLog    = Join-Path $Donnees "postgres.log"
$Port     = 5439
$Marqueur = Join-Path $Donnees "demo-chargee"

function Etape([string]$Message) { Write-Host "`n==> $Message" -ForegroundColor Green }
function Existe([string]$Commande) { [bool](Get-Command $Commande -ErrorAction SilentlyContinue) }
function Rafraichir-Path {
  $env:Path = [Environment]::GetEnvironmentVariable("Path", "Machine") + ";" +
              [Environment]::GetEnvironmentVariable("Path", "User") + ";" +
              (Join-Path $env:APPDATA "npm")
}
# Lance une commande externe et s'arrete si elle echoue. Fonction simple (sans
# param) : les options comme -D sont transmises telles quelles a la commande.
function Lancer {
  $Commande = $args[0]
  $Reste = @()
  if ($args.Count -gt 1) { $Reste = $args[1..($args.Count - 1)] }
  & $Commande @Reste
  if ($LASTEXITCODE -ne 0) { throw "La commande a echoue : $($args -join ' ')" }
}

Set-Location $Racine
New-Item -ItemType Directory -Force $Donnees | Out-Null

# ---------------------------------------------------------------- Node.js
Etape "Node.js"
if (-not (Existe node)) {
  if (-not (Existe winget)) {
    throw "Node.js est absent et winget n'est pas disponible. Installez Node.js 22 LTS depuis https://nodejs.org puis relancez."
  }
  winget install --id OpenJS.NodeJS.LTS -e --silent --accept-source-agreements --accept-package-agreements
  Rafraichir-Path
}
$Majeure = [int]((node -v).TrimStart("v").Split(".")[0])
if ($Majeure -lt 20) { throw "Node.js $(node -v) est trop ancien : installez Node.js 22 LTS (https://nodejs.org)." }
Write-Host "Node.js $(node -v)"

# ---------------------------------------------------------------- pnpm
Etape "pnpm"
if (-not (Existe pnpm)) {
  Lancer npm install -g pnpm@11
  Rafraichir-Path
}
Write-Host "pnpm $(pnpm -v)"

# ---------------------------------------------------------------- PostgreSQL
Etape "PostgreSQL 16 (portable, dans $Donnees)"
if (-not (Test-Path (Join-Path $PgBin "pg_ctl.exe"))) {
  $Zip = Join-Path $Donnees "pgsql.zip"
  Write-Host "Telechargement de PostgreSQL $PgVersion (environ 300 Mo)..."
  Invoke-WebRequest "https://get.enterprisedb.com/postgresql/postgresql-$PgVersion-windows-x64-binaries.zip" -OutFile $Zip
  Write-Host "Decompression..."
  Expand-Archive $Zip -DestinationPath $Donnees -Force
  Remove-Item $Zip
}
if (-not (Test-Path (Join-Path $PgData "PG_VERSION"))) {
  try {
    Lancer (Join-Path $PgBin "initdb.exe") -D $PgData -U postgres -A trust -E UTF8 --locale=C
  } catch {
    throw "PostgreSQL ne demarre pas. Installez 'Microsoft Visual C++ Redistributable x64' (https://aka.ms/vs/17/release/vc_redist.x64.exe) puis relancez. Detail : $_"
  }
}
$ErrorActionPreference = "Continue"
& (Join-Path $PgBin "pg_ctl.exe") -D $PgData status | Out-Null
$Demarre = ($LASTEXITCODE -eq 0)
$ErrorActionPreference = "Stop"
if (-not $Demarre) {
  Lancer (Join-Path $PgBin "pg_ctl.exe") -D $PgData -l $PgLog -o "-p $Port" -w start
}
$Psql = Join-Path $PgBin "psql.exe"
$Role = & $Psql -h localhost -p $Port -U postgres -tAc "select 1 from pg_roles where rolname = 'missionops'"
if ("$Role".Trim() -ne "1") {
  Lancer $Psql -h localhost -p $Port -U postgres -c "create role missionops login password 'missionops'"
  Lancer $Psql -h localhost -p $Port -U postgres -c "create database missionops owner missionops"
  if (Test-Path $Marqueur) { Remove-Item $Marqueur }
}
Write-Host "PostgreSQL pret sur le port $Port"

$env:DATABASE_URL = "postgres://missionops:missionops@localhost:$Port/missionops"
$env:CRON_SECRET = "local-" + [guid]::NewGuid().ToString()

# ---------------------------------------------------------------- Projet
Etape "Dependances du projet"
Lancer pnpm install

if ($Reinitialiser -or -not (Test-Path $Marqueur)) {
  Etape "Base de demonstration (Croix-Rouge Guinee, 9 missions)"
  Lancer pnpm db:reset
  Lancer pnpm db:seed:demo
  New-Item -ItemType File -Force $Marqueur | Out-Null
} else {
  Etape "Base de demonstration deja chargee (option -Reinitialiser pour repartir de zero)"
  Lancer pnpm db:migrate
}

Write-Host ""
Write-Host "  Application : http://localhost:3000" -ForegroundColor Cyan
Write-Host "  Mot de passe des comptes de demo : motdepasse-demo" -ForegroundColor Cyan
Write-Host "    finance  aissatou.bah@croix-rouge-guinee.demo"
Write-Host "    agent    alpha.diakite@croix-rouge-guinee.demo"
Write-Host "    admin    awa.diallo@croix-rouge-guinee.demo"
Write-Host "  Navigateur conseille : Chrome, Edge ou Firefox. Ctrl+C pour arreter."
Write-Host ""

Start-Job { Start-Sleep -Seconds 12; Start-Process "http://localhost:3000" } | Out-Null

if ($Dev) {
  Etape "Lancement en mode developpement"
  pnpm --filter @missionops/web dev
} else {
  Etape "Compilation (1 a 2 minutes)"
  Lancer pnpm --filter @missionops/web build
  Etape "Lancement"
  pnpm --filter @missionops/web start
}
