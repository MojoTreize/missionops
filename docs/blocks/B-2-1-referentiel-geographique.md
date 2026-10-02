# B2.1 — Référentiel géographique

> **Statut : brouillon, à valider avant implémentation.** Les points marqués
> « À trancher » doivent être décidés (idéalement avec le pilote) avant
> d'ouvrir la session de code.

## Objectif

Un collaborateur choisit la destination de sa mission en deux touches, même
sans réseau : il tape « nzer », il voit « Nzérékoré », il valide.

## Contexte

- Plan : section 10, bloc B2.1 ; ADR-001 (multi-tenant), ADR-005 (suppression
  logique), ADR-008 (i18n).
- Bloc précédent : B1.12 (seed de démo). Bloc suivant : B2.2 (modèle mission),
  qui référencera un lieu comme destination.
- Le hors ligne complet (IndexedDB, service worker) arrive en Phase 4. Ce bloc
  ne doit **pas** l'anticiper : le référentiel national est embarqué dans le
  code, ce qui suffit à le rendre disponible sans réseau.

## Décision de conception proposée

Deux sources de lieux, de nature différente :

1. **Référentiel national** (régions, préfectures, sous-préfectures, communes de
   Conakry) : **donnée statique versionnée dans `packages/core/location`**,
   identique pour toutes les organisations, jamais modifiée par un utilisateur.
   Chaque lieu porte un **code stable** (ex. `GN-KD` pour la région de Kindia,
   `GN-KD-COY` pour la préfecture de Coyah).
   - Hors ligne sans effort : c'est du code, il est dans le bundle.
   - Pas de conflit avec ADR-001 : il n'y a pas de ligne en base sans
     `organisation_id`.
2. **Lieux propres à une organisation** (base, entrepôt, centre de santé,
   village non référencé) : **table `locations`** en base, avec
   `organisation_id`, RLS et audit. Chaque lieu est rattaché à un lieu national
   parent (`parent_code`).

Une destination de mission (B2.2) référencera donc soit un code national, soit
l'`id` d'une ligne de `locations`.

**À trancher.** Alternative : tout mettre en base, avec un `organisation_id`
nul pour le national. Rejetée par défaut parce qu'elle oblige à affaiblir la
politique `org_isolation` (lignes à `organisation_id` nul) et qu'elle ne règle
pas le hors ligne avant la Phase 4.

## Règles métier

1. Le référentiel national couvre les **8 régions** (Conakry, Boké, Kindia,
   Mamou, Labé, Faranah, Kankan, Nzérékoré), les **33 préfectures** et les
   principales sous-préfectures, hiérarchisées (région → préfecture →
   sous-préfecture). Conakry est découpée en communes.
2. Chaque lieu a un nom officiel (avec accents), des **variantes
   orthographiques** connues (ex. « N'Zérékoré », « Nzerekore », « Guékédou » /
   « Guéckédou ») et des coordonnées approximatives (point central, précision
   indicative).
3. La recherche ignore la casse, les accents, les apostrophes, les tirets et les
   espaces : « nzerekore », « N'ZEREKORE » et « nzé » trouvent « Nzérékoré ».
4. Classement des résultats : correspondance exacte, puis début du nom, puis
   début d'une variante, puis contenu. À score égal, le niveau le plus haut
   d'abord (une préfecture avant une sous-préfecture homonyme).
5. Chaque résultat affiche son chemin (« Coyah · Kindia ») pour distinguer les
   homonymes.
6. Un lieu d'organisation a un nom (1 à 120 caractères), un parent national
   obligatoire, des coordonnées facultatives et un type (`site`, `village`,
   `autre`).
7. Seuls les rôles Logisticien, Directeur pays et Administrateur créent,
   modifient ou retirent un lieu d'organisation. Tous les membres les lisent.
   **À trancher** avec le pilote.
8. Retirer un lieu d'organisation = `deleted_at` (ADR-005). Un lieu retiré reste
   lisible sur les missions passées et disparaît de la recherche.
9. Deux lieux actifs d'une même organisation ne peuvent pas porter le même nom
   normalisé sous le même parent.

## Modèle de données

**Référentiel national** (`packages/core/location/data.ts`, pur, sans I/O) :

```
NationalLocation {
  code: string            // "GN-KD-COY", stable, jamais réutilisé
  level: "region" | "prefecture" | "sous_prefecture" | "commune"
  name: string            // "Coyah"
  aliases: string[]       // variantes orthographiques
  parentCode: string | null
  lat: number, lng: number // approximatifs, affichage uniquement
}
```

**Table `locations`** (nouvelle migration, sans modifier les migrations
existantes) : `id`, `organisation_id`, `parent_code`, `name`,
`normalized_name`, `kind`, `lat`, `lng`, `created_at`, `updated_at`,
`deleted_at`, `created_by`.

- `SELECT enable_org_rls('locations');` et `SELECT enable_audit('locations');`
- Index unique partiel
  `(organisation_id, parent_code, normalized_name) WHERE deleted_at IS NULL`.
- `parent_code` est validé côté application contre le référentiel national
  (pas de clé étrangère possible vers une donnée statique).

**Source des données — À trancher.** Utiliser un jeu de référence publié
(par exemple les limites administratives COD-AB de Guinée diffusées par
OCHA/HDX), en vérifiant la licence et la date. Ne pas saisir de coordonnées « de
mémoire ». Vérifier aussi que le découpage n'a pas changé (communes de
Conakry, réforme administrative récente) et noter la date de la source dans
`data.ts`.

## Interface

- **Composant `LocationPicker`** : un champ de recherche, une liste de
  résultats qui s'affiche dès la première lettre, sélection au toucher. Utilisable
  à 375 px, au clavier et au lecteur d'écran (rôle `combobox`).
- **Écran « Organisation > Lieux »** : liste des lieux de l'organisation,
  ajout et retrait dans un tiroir latéral (`Sheet`), réservé aux rôles de la
  règle 7.
- Tous les libellés passent par `t()`, en français et en anglais. Les noms de
  lieux ne se traduisent pas.

## Prérequis à lever avant le code

- **Zod** : CLAUDE.md impose un schéma Zod de `packages/contracts` pour toute
  entrée. Le paquet est vide et `zod` n'est pas installé. Ajouter la dépendance
  (accord requis) et créer `packages/contracts/location`, ou traiter Zod dans un
  bloc préalable.
- **Policy** : ajouter la ressource `location` à `packages/core/policy`
  (`permissions.ts`, `matrix.ts`) et étendre la table de vérité.

## Tests attendus

Unitaires (`packages/core/location`) :

- « nzerekore » sans accent trouve « Nzérékoré » (critère du plan)
- « N'ZEREKORE », « nzé », « guekedou » trouvent le bon lieu
- classement : « kin » renvoie la région et la préfecture de Kindia avant toute
  sous-préfecture contenant « kin »
- intégrité du référentiel : 8 régions, 33 préfectures, codes uniques, chaque
  `parentCode` existe, chaque préfecture a une région pour parent
- chemin d'affichage (« Coyah · Kindia »)
- normalisation d'un nom de lieu d'organisation

Intégration (`packages/db`, PGlite) :

- un lieu de l'organisation A est invisible depuis l'organisation B
- la création, la modification et le retrait d'un lieu écrivent dans
  `audit_log`
- doublon refusé sous le même parent, accepté après retrait du premier

Policy : la table de vérité couvre `location:*` pour les six rôles.

E2E : reporté tant que Playwright n'est pas installé (voir `e2e/`).

## Fini quand

Sur un téléphone en mode avion, après un premier chargement de la page, le
sélecteur trouve « Nzérékoré » en tapant « nzer », et un logisticien du pilote
a ajouté au moins trois lieux propres à son organisation.

## Hors périmètre de ce bloc

Cartes et géolocalisation (Phase 10) · stockage IndexedDB et mise en cache des
lieux d'organisation pour le hors ligne (B4.2) · distances et kilométrage
(Phase 10) · lien mission → destination (B2.2 / B2.3) · import de lieux en masse
(B9.3).

## Dépend de

B1.12 (seed de démo). Le seed de démo devra ajouter quelques lieux
d'organisation (un entrepôt à Kindia, une base à Nzérékoré).
