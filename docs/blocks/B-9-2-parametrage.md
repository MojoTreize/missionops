# B9.2 — Paramétrage par organisation

> **Statut : en cours de livraison.**

## Objectif

Chaque client adapte l'outil à ses procédures sans développement spécifique.

## Contenu

- **Écran `/organizations/settings`** (administrateur),
  `updateOrganisationSettings` validé par `organisationSettingsInput` :
  - nom de l'organisation ;
  - **devise de base** (GNF, EUR, USD), modifiable **seulement avant toute
    écriture monétaire** (`base_currency_locked`) ;
  - fuseau horaire (par défaut `Africa/Conakry`) ;
  - **plancher d'écart** à justifier en réconciliation (B3.9) ;
  - **en-tête, pied de page et libellés de signature** des documents (B5.2).
- **Membres** : changement de rôle (l'organisation garde au moins un
  administrateur) et retrait d'un membre par suppression logique de
  l'appartenance.
- Archivage des missions anciennes (B6.6) depuis le même écran.
- Circuit de validation : écran dédié (B2.5).

## Décisions appliquées

- ADR-002 : changer la base après coup rendrait faux tous les montants figés.
- ADR-005 : un membre retiré reste dans l'historique ; audit par déclencheur.

## Tests

Contrat Zod ; intégration « plateforme (Phase 9) » de `loop.test.ts` (rôles,
paramètres).

## Fini quand

Trois profils de configuration types sont livrés : ONG, entreprise, cabinet.

## Hors périmètre de ce bloc

Catégories de dépense par organisation · per diem par destination · champs
personnalisés · rôles personnalisés · logo.

## Dépend de

B9.1 (inscription).
