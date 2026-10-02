# B2.1 — Référentiel géographique

> **Statut : livré.**

## Objectif

Un collaborateur choisit la destination de sa mission en deux touches, même
sans réseau : il tape « nzer », il voit « Nzérékoré », il valide.

## Contenu

- **Référentiel national statique** (`packages/core/src/location/data.ts`), pur,
  embarqué dans le code donc disponible hors ligne : 8 régions, 33 préfectures,
  5 communes de Conakry et les principales sous-préfectures, hiérarchisées, avec
  variantes orthographiques. Codes stables ISO 3166-2:GN (`GN-D` = région de
  Kindia, `GN-KD` = préfecture de Kindia), suffixés pour les sous-préfectures
  et communes ; un code n'est jamais réutilisé.
- **Recherche** (`search.ts`) insensible à la casse, aux accents, apostrophes,
  tirets et espaces ; classement exact, début du nom, début d'une variante,
  contenu, puis niveau le plus haut. Chemin d'affichage (« Coyah · Kindia »).
- **Lieux propres à une organisation** : table `locations` (`parent_code`,
  `name`, `normalized_name`, `kind` : `site` / `village` / `autre`), RLS et
  audit, index unique partiel sous le même parent. Règles dans `rules.ts`
  (nom de 1 à 120 caractères, parent national existant, pas de doublon actif).
- **Écran « Organisation > Lieux »** (`/organizations/locations`) et composant
  `LocationPicker` (rôle `combobox`) utilisé par le formulaire de mission.

## Décisions appliquées

- Le national dans le code, l'organisationnel en base : aucune ligne sans
  `organisation_id` (ADR-001), retrait par `deleted_at` (ADR-005).
- **Coordonnées volontairement absentes**, du référentiel comme de la table :
  elles seront importées du jeu COD-AB (OCHA/HDX) plutôt que saisies de mémoire.
- Création et retrait réservés au Logisticien, au Directeur pays et à
  l'administrateur (`location:create|update|delete`) ; lecture pour tous.

## Tests

Unitaires (`location.test.ts`) : 8 régions et 33 préfectures, codes uniques et
parents existants, chemin d'affichage, « nzerekore » trouve « Nzérékoré »,
classement région/préfecture avant sous-préfecture, validation des lieux
d'organisation. Contrat Zod : parent validé contre le référentiel.

## Fini quand

Le sélecteur trouve « Nzérékoré » en tapant « nzer » sans réseau, et un
logisticien ajoute ses propres lieux.

## Hors périmètre de ce bloc

Coordonnées et cartes (import COD-AB, Phase 10) · vérification du découpage
contre COD-AB avant la mise en pilote · import en masse (B9.3).

## Dépend de

B1.12 (seed de démo).
