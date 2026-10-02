# ADR-007 — Les photos (compression client)

- **Statut** : acceptée
- **Bloc** : B3.6 (justificatifs), appliquée en B4.5 (photo hors ligne)
- **Date** : rédigée a posteriori, après fusion des Phases 3 et 4

## Contexte

Un appareil photo de téléphone produit des images de 3 à 5 Mo. Sur une 3G
instable, un envoi de 4 Mo échoue souvent et l'utilisateur abandonne ; sur un
Android d'entrée de gamme, quelques dizaines de photos saturent l'espace
local. Or un reçu reste parfaitement lisible à une résolution bien plus faible.

Le justificatif est aussi une pièce comptable : il doit pouvoir être produit
intact des années plus tard, et il faut pouvoir prouver qu'il n'a pas changé.

## Décision

1. **Compression côté client avant tout stockage local ou envoi**
   (`apps/web/lib/offline/photo.ts`) : grand côté ramené à **1 600 px**
   (`PHOTO_MAX_EDGE`, sans jamais agrandir), ré-encodage **JPEG qualité 0,75**
   (`PHOTO_QUALITY`). Les constantes et le calcul des dimensions sont dans
   `packages/core/src/sync` (pur, testé). Un PDF est transmis tel quel.
2. **Somme de contrôle SHA-256 calculée sur le téléphone** (Web Crypto), sur le
   fichier compressé. Le serveur la recalcule à la réception
   (`attachReceipt`) et refuse le fichier si elle diffère (`checksum_mismatch`)
   ou si la taille annoncée ne correspond pas (`size_mismatch`).
3. **Types acceptés** : `image/jpeg`, `image/png`, `image/webp`,
   `application/pdf` (schéma Zod partagé). Taille maximale reçue : 8 Mo.
4. **Stockage objet derrière une interface.** Les services ne connaissent que
   `BlobStore` (`put`, `get`). Le pilote actuel
   (`apps/web/lib/server/storage.ts`) écrit sur disque dans `STORAGE_DIR`, monté
   sur le volume Fly.io `/data` en staging et en pilote. Un pilote compatible S3
   en région UE le remplacera sans toucher aux appelants.
5. **La base ne garde que la référence et les métadonnées** : table `receipts`
   avec `storage_key`
   (`<organisation_id>/receipts/<expense_id>/<receipt_id>`), `sha256`,
   `size_bytes`, `mime_type`, `width`, `height`. Jamais le binaire.
6. **Plusieurs justificatifs par dépense**, chacun identifié par un UUID client
   (envoi idempotent, ADR-003).

## Conséquences

- **Un reçu tient en 200 à 400 Ko** au lieu de 4 Mo : l'envoi aboutit en 3G et
  une centaine de photos tient dans IndexedDB.
- **Intégrité prouvable** : l'empreinte SHA-256 figure dans la base, dans le
  Closure Pack (annexe des justificatifs) et dans l'export intégral. Un
  auditeur peut vérifier qu'un fichier n'a pas été altéré.
- **La clé de stockage commence par l'organisation** : une sauvegarde, un export
  ou une purge par client reste un simple filtrage de préfixe.
- **Sauvegarde** : tant que le stockage est un volume disque, `STORAGE_DIR`
  doit être archivé avec la base (voir `docs/runbooks/sauvegarde-restauration.md`).
  Une base restaurée sans ses fichiers produit des Closure Packs incomplets.
- **Lisibilité à vérifier sur de vrais reçus** : les paramètres 1 600 px et
  0,75 sont ceux du plan ; ils restent à valider sur les reçus réels collectés
  en B0.3, en particulier les tickets thermiques.

## Alternatives écartées

- **Envoi de l'original, compression côté serveur** : ne règle ni la 3G ni la
  saturation du téléphone.
- **Stockage des binaires en base (`bytea`)** : alourdit les sauvegardes, les
  réplications et chaque requête qui touche la table.
- **WebP ou AVIF** : meilleure compression, mais encodage inégal sur les
  navigateurs Android anciens et relecture moins universelle par les auditeurs.
- **Compression plus forte (1 024 px, qualité 0,6)** : les petits caractères
  des reçus thermiques deviennent illisibles.
