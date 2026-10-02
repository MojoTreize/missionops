# B5.3 — Ordre de mission

> **Statut : livré.**

## Objectif

Générer le document officiel signable dès la validation.

## Contenu

- **`renderOrdreMission`** : synthèse de la mission (référence, objet,
  destination, dates), participants, circuit de validation avec décisions et
  dates, cases de signature selon les libellés de l'organisation.
- Disponible dès `VALIDEE` (puis `EN_COURS`, `TERMINEE`, `CLOTUREE`), dans la
  langue de l'utilisateur.
- **Téléchargement** `GET /api/missions/[id]/documents/ordre_mission`.
- **Versionnement** (`generateMissionDocument`) : table `documents` (type,
  version, `storage_key`, `sha256`, taille, langue). Un contenu identique
  renvoie la version existante ; un contenu modifié crée une nouvelle version,
  l'ancienne reste disponible.

## Décisions appliquées

- Documents immuables, empreinte SHA-256 en base (ADR-004, ADR-005).

## Tests

PDF valide et déterministe ; intégration : documents versionnés et immuables.

## Fini quand

Le pilote remplace son modèle Word par le document généré.

## Hors périmètre de ce bloc

QR code vers la fiche en ligne · comparaison avec l'ordre papier du pilote.

## Dépend de

B5.2 (modèles par organisation).
