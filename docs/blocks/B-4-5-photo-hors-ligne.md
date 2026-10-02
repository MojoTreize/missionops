# B4.5 — Photo hors ligne

> **Statut : livré.**

## Objectif

Photographier un reçu sans réseau et l'envoyer plus tard, sans perte.

## Contenu

- Capture, compression (1 600 px, JPEG 0,75) et empreinte SHA-256 sur le
  téléphone ; binaire stocké dans le magasin `photos` d'IndexedDB avec sa
  dépense, sa taille et ses dimensions.
- **File d'envoi séparée** : une photo part vers `POST /api/receipts` seulement
  quand sa dépense est synchronisée ; même délai de reprise que la file
  principale ; refus définitif affiché.
- Taille de la photo prête affichée (« Photo prête (… Ko) »).

## Décisions appliquées

- ADR-007 (compression client, empreinte vérifiée côté serveur), ADR-003.

## Tests

Unitaires : dimensions cibles. Intégration : empreinte vérifiée, renvoi sans
doublon.

## Fini quand

Aucune photo perdue sur 100 essais successifs (campagne B4.8).

## Hors périmètre de ce bloc

Indicateur de progression d'envoi · alerte de saturation du stockage local
(`navigator.storage.estimate`).

## Dépend de

B4.4 (dépense hors ligne).
