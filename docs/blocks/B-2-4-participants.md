# B2.4 — Participants

> **Statut : livré.**

## Objectif

Associer des personnes à une mission, avec leur rôle.

## Contenu

- **Table `mission_participants`** : membre de l'organisation (`user_id`) ou
  externe nommé (`external_name`), rôle `chef_mission`, `membre`, `chauffeur`
  ou `externe`.
- **Règles** `validateParticipants` : identité obligatoire, pas de doublon, au
  plus un chef de mission.
- **Services** `addParticipant` / `removeParticipant` (retrait par
  `deleted_at`) ; section participants de la fiche mission.
- **Alerte de planification** `overlappingMissions` : participants déjà engagés
  sur une autre mission active à la même période.
- Les participants membres reçoivent les notifications de la mission
  (annulation, rappels).

## Décisions appliquées

- ADR-005 : un participant retiré reste dans l'historique.
- Externes sans compte : aucun numéro de téléphone stocké à ce stade
  (minimisation des données).

## Tests

Unitaires : équipe valide, doublons, identité absente, deux chefs refusés.
Contrat Zod : identité exigée.

## Fini quand

Les participants apparaissent sur la fiche mission et reçoivent les
notifications.

## Hors périmètre de ce bloc

Téléphone des externes · disponibilité fine des personnes (congés).

## Dépend de

B2.3 (demande de mission).
