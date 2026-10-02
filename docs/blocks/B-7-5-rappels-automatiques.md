# B7.5 — Rappels automatiques

> **Statut : livré.**

## Objectif

Le système relance à la place de l'équipe : c'est une grande partie de sa
valeur perçue.

## Contenu

- **`generateReminders`** (`packages/services/src/reminders.ts`), pour chaque
  organisation, dans son propre contexte isolé :
  - lendemain du retour : penser à saisir ses dépenses ;
  - trois jours après le retour : rapport de mission attendu ;
  - validations en attente depuis plus de 48 h : rappel au validateur.
- **`runScheduledJobs`** : rappels puis envoi de la boîte d'envoi, déclenchés
  par `POST /api/cron` toutes les 5 minutes (`Authorization: Bearer
$CRON_SECRET`, comparaison à temps constant). Voir
  `docs/runbooks/taches-planifiees.md`.
- **Acteur système traçable** : l'administrateur le plus ancien de
  l'organisation.

## Décisions appliquées

- Clé d'idempotence datée du jour : une double exécution n'envoie aucun
  doublon.
- Horloge injectée (`now`) : les règles restent testables.

## Tests

Intégration de la boucle ; à compléter : tâches planifiées avec horloge
simulée et double exécution.

## Fini quand

Le taux de rapports remis à temps chez le pilote augmente de façon mesurable.

## Hors périmètre de ce bloc

Justificatif manquant, avance non justifiée depuis 30 jours, échéance
d'archivage.

## Dépend de

B7.4 (préférences).
