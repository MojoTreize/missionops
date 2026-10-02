# B5.7 — Closure Pack

> **Statut : livré.**

## Objectif

Le document qui justifie l'utilisation des fonds : la pièce maîtresse du
produit.

## Contenu

- **`renderClosurePack`**, disponible quand la mission est `CLOTUREE`, dans
  l'ordre où un auditeur le demande : synthèse, réconciliation de l'avance,
  écarts avec leurs justifications, dépenses ligne à ligne (montant d'origine,
  taux figé, montant en base), avances, circuit de validation, rapport,
  chronologie terrain, historique des statuts, **intégrité** (empreinte SHA-256
  de chaque justificatif), **annexe paginée des justificatifs** (images
  intégrées), signatures.
- Versionné et immuable comme les autres documents.

## Décisions appliquées

- ADR-002 (taux figés), ADR-004 (historique), ADR-007 (empreintes).

## Tests

PDF valide et déterministe ; Closure Pack paginé contenant toutes les dépenses
et l'annexe des justificatifs.

## Fini quand

**Un auditeur ou un contrôleur de gestion accepte ce dossier sans rien refaire
à la main.**

## Hors périmètre de ce bloc

Export ZIP (PDF, CSV des dépenses, fichiers originaux) · extrait du journal
d'audit · génération sur une mission à 80 dépenses (à mesurer).

## Dépend de

B5.6 (rapport de mission).
