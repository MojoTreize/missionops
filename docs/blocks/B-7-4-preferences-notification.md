# B7.4 — Préférences de notification

> **Statut : partiel.**

## Objectif

Personne ne se désabonne de tout parce qu'il reçoit trop.

## Contenu

- **Table `notification_preferences`** (une ligne active par membre) : e-mail
  (oui par défaut), WhatsApp, SMS, numéro.
- **Écran `/notifications`** : centre de notifications (non lues, tout marquer
  comme lu) et choix des canaux (`getPreferences`, `savePreferences`).
- Le centre de notifications in-app reçoit toujours une copie.

## Décisions appliquées

- Préférences par canal, appliquées au moment d'enfiler (`enqueue`).

## Tests

Intégration via la boucle (notifications enfilées selon les préférences).

## Fini quand

Aucun utilisateur pilote ne s'est désabonné globalement après un mois.

## Hors périmètre de ce bloc

Réglage par type d'événement · plages horaires de silence · regroupement
quotidien.

## Dépend de

B7.3 (WhatsApp).
