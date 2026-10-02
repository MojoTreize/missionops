# B9.7 — Mesure de l'usage

> **Statut : en cours de livraison.**

## Objectif

Savoir quelles organisations décrochent, avant le renouvellement.

## Contenu

Indicateurs du plan (§12.3), calculés par organisation et affichés dans la
console `/admin` :

- **missions créées ce mois-ci** ;
- **part des missions clôturées avec un Closure Pack** généré ;
- **délai médian entre le retour de mission et la clôture** financière, en
  jours ;
- **couverture des justificatifs** : part des dépenses accompagnées d'au moins
  un justificatif (per diem compté comme couvert).

## Décisions appliquées

- Agrégats seulement : aucune donnée personnelle ne sort de l'organisation.
- Lecture dans le contexte isolé de chaque organisation (ADR-001) ; ratios en
  points de base, sans flottant.

## Tests

Vérifier que les indicateurs ne franchissent jamais la frontière entre
organisations.

## Fini quand

On peut répondre à « quel client risque de ne pas renouveler ? » avec des
chiffres.

## Hors périmètre de ce bloc

Utilisateurs actifs hebdomadaires · délai moyen de validation · alerte interne
sur baisse d'activité · historique mois par mois.

## Dépend de

B9.6 (console interne).
