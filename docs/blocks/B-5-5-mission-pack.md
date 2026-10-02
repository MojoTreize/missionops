# B5.5 — Mission Pack

> **Statut : livré.**

## Objectif

Un dossier numérique unique remis à l'équipe au départ.

## Contenu

- **`renderMissionPack`** : synthèse de la mission, participants, budget
  autorisé par ligne, avances versées (écritures inverses signalées) avec total
  en devise de base, circuit de validation, checklist de départ, signatures.
- Disponible dès `VALIDEE`, versionné comme l'ordre de mission
  (`GET /api/missions/[id]/documents/mission_pack`).

## Décisions appliquées

- Montants affichés en devise d'origine et en devise de base au taux figé
  (ADR-002).

## Tests

PDF valide et déterministe (`documents.test.ts`).

## Fini quand

Une équipe pilote part réellement avec ce dossier sur son téléphone.

## Hors périmètre de ce bloc

Consultation hors ligne du PDF · logistique affectée, contacts locaux,
procédure d'incident et documents joints · génération automatique à la
validation (le dossier est généré à la demande).

## Dépend de

B5.4 (bande de mission), livré sans elle.
