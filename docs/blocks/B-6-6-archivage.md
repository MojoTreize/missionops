# B6.6 — Archivage

> **Statut : livré.**

## Objectif

Conserver ce que les bailleurs exigent, souvent cinq à dix ans.

## Contenu

- **`archiveMissions`** : les missions clôturées ou annulées depuis plus d'un
  nombre de jours donné reçoivent `archived_at`. Elles quittent les listes
  courantes (filtre « archivées ») et deviennent en lecture seule : toute
  transition ou écriture financière est refusée.
- Action réservée à l'administrateur, depuis le paramétrage de l'organisation
  (seuil de 180 jours).
- Le Closure Pack est déjà figé et versionné (B5.7).

## Décisions appliquées

- ADR-005 : rien n'est supprimé. Politique de durées dans
  `docs/conformite/conservation.md`.

## Tests

Intégration : archivage réservé à l'administrateur et sans effet hors de
l'organisation.

## Fini quand

Un exercice annuel complet est archivé et vérifié.

## Hors périmètre de ce bloc

Politique de rétention paramétrable par organisation · archive autonome
lisible sans l'application (en partie couverte par l'export intégral, B6.7).

## Dépend de

B6.5 (recherche globale).
