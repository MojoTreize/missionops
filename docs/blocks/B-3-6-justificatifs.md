# B3.6 — Justificatifs

> **Statut : livré.**

## Objectif

Photographier un reçu et le rattacher à une dépense, de façon fiable.

## Contenu

- **Compression côté client** (`apps/web/lib/offline/photo.ts`) : grand côté
  1 600 px, JPEG 0,75, SHA-256 calculé sur le téléphone. PDF transmis tel quel.
- **Envoi** `POST /api/receipts` (`multipart/form-data` : `meta` JSON et
  `file`), 8 Mo au plus, types JPEG, PNG, WebP, PDF.
- **Service** `attachReceipt` : vérifie taille et empreinte annoncées
  (`size_mismatch`, `checksum_mismatch`), idempotent sur l'UUID, écrit le
  fichier via `BlobStore` sous `<org>/receipts/<dépense>/<justificatif>`.
- **Table `receipts`** : `storage_key`, `sha256`, `size_bytes`, `mime_type`,
  dimensions. Plusieurs justificatifs par dépense.
- **Lecture** `GET /api/receipts/[id]` (`readReceipt`) avec contrôle
  d'organisation et de droit ; un collaborateur ne voit que les siens.
- **Stockage** : pilote disque `apps/web/lib/server/storage.ts`, dans
  `STORAGE_DIR` (volume Fly `/data`).

## Décisions appliquées

- ADR-007 (compression client, stockage objet derrière une interface, la base
  ne garde que la référence et l'empreinte).

## Tests

Unitaires : dimensions cibles sans agrandissement. Intégration : justificatif
attaché, empreinte vérifiée, renvoi sans doublon.

## Fini quand

Un reçu photographié dans une voiture en mouvement reste lisible après
compression (à vérifier sur les 20 reçus réels de B0.3).

## Hors périmètre de ce bloc

Miniatures et visionneuse avec zoom · pilote S3 en région UE.

## Dépend de

B3.5 (saisie de dépense).
