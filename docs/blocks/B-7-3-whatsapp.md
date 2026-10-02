# B7.3 — WhatsApp Business

> **Statut : partiel.** Le canal est codé ; la vérification Meta et l'envoi
> réel restent à faire.

## Objectif

Notifier là où les équipes lisent réellement.

## Contenu

- **`WhatsAppChannel`** : Cloud API de Meta, message **modèle** préapprouvé
  (`missionops_notification`) avec le texte de la notification en paramètre,
  délai d'attente de 10 s. Variables `WHATSAPP_TOKEN` et
  `WHATSAPP_PHONE_NUMBER_ID`.
- **Numéros guinéens normalisés** (`+224 620 …`, `00224…`, `620…` donnent
  `224620…`).
- **Consentement** : WhatsApp est désactivé par défaut ; chaque utilisateur
  l'active et saisit son numéro sur `/notifications`. Le choix est enregistré
  (`notification_preferences`) et journalisé.
- L'e-mail reste actif par défaut : il sert de repli.

## Décisions appliquées

- Messages sans montant ni justificatif, seulement la référence et un lien
  (`docs/conformite/hebergement.md`).

## Tests

Unitaire : modèle approuvé utilisé, numéro normalisé (requête simulée).

## Fini quand

Les notifications de validation partent en WhatsApp chez le pilote, avec repli
automatique en e-mail.

## Hors périmètre de ce bloc

Fenêtre de 24 heures et messages libres · suivi du coût par conversation ·
repli automatique sur échec · envoi réel vers cinq numéros guinéens.

## Dépend de

B7.2 (e-mail durci).
