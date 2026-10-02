# B4.6 — Événements de mission

> **Statut : livré.**

## Objectif

Suivre le déroulement d'une mission sans promettre une protection qu'on ne
peut pas assurer.

## Contenu

- **Table `mission_events`** : type (`depart`, `arrivee`, `checkin`,
  `incident`, `retour`), note, instant, position facultative en
  micro-degrés entiers (`latitude_e6`, `longitude_e6`).
- **Saisie sur l'écran Terrain**, hors ligne via la file de synchronisation
  (`recordMissionEvent`, idempotent sur l'UUID client).
- **Position** : case « Joindre ma position » décochée par défaut, demande de
  géolocalisation à chaque événement ; un refus n'empêche pas l'action.
- **Chronologie** sur la fiche mission (`listMissionEvents`) et dans le Closure
  Pack.

## Décisions appliquées

- Plan §11 : aucun suivi continu, aucune promesse de sécurité.
- ADR-003 : création seulement.

## Tests

Contrat Zod du lot de synchronisation ; E2E hors ligne de la boucle.

## Fini quand

La chronologie de la mission est lisible sur la fiche.

## Hors périmètre de ce bloc

**Texte explicite dans l'interface** rappelant l'absence de suivi et de
garantie de sécurité (à ajouter) · déclaration et suivi d'incidents (B10.7).

## Dépend de

B4.5 (photo hors ligne).
