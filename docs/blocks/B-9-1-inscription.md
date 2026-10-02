# B9.1 — Autonomie d'installation

> **Statut : en cours de livraison.**

## Objectif

Une organisation démarre sans que l'équipe MissionOps intervienne.

## Contenu

- **Page publique `/signup`** (`signupInput` : nom complet, e-mail, mot de
  passe de 10 caractères au moins, nom de l'organisation). En une action :
  création du compte (ou finalisation d'un compte créé par invitation, sans mot
  de passe), de l'organisation dont l'auteur devient **administrateur**, de
  l'**abonnement d'essai** (`startTrial` : 30 jours, 10 places), puis ouverture
  de session et arrivée sur le tableau de bord.
- Une adresse déjà inscrite avec mot de passe est refusée (`email_taken`) :
  elle doit se connecter.
- Lien depuis la page de connexion.
- La suite du démarrage (devise, membres, lieux, circuit) se fait dans le
  paramétrage (B9.2) et les imports (B9.3) ; procédure accompagnée dans
  `docs/runbooks/nouvelle-organisation.md`.

## Décisions appliquées

- Mot de passe haché avec scrypt ; session `__Host-` (B1.5).
- ADR-001 : l'organisation créée est isolée dès sa première ligne.

## Tests

Contrat Zod de l'inscription ; intégration « plateforme (Phase 9) » de
`loop.test.ts` (essai démarré à la création).

## Fini quand

Une organisation réelle s'est installée sans aide, en moins de 30 minutes
pour une personne qui ne connaît pas l'équipe.

## Hors périmètre de ce bloc

Parcours guidé pas à pas avec progression sauvegardée · chargement du logo ·
mission de test créée automatiquement · vérification de l'adresse e-mail avant
création de l'organisation.

## Dépend de

B8.8.
