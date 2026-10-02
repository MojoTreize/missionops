# B2.7 — Liste et calendrier des missions

> **Statut : livré.**

## Objectif

Voir toutes les missions et retrouver n'importe laquelle en quelques secondes.

## Contenu

- **Liste `/missions`** (`listMissions`) : filtre par statut (actives par
  défaut, archivées, ou un statut précis) et recherche sur titre et référence,
  conservés dans l'URL. Tableau dense sur ordinateur, cartes sur mobile.
- **Calendrier `/missions/calendar`** (`missionCalendar`) : grille mensuelle,
  missions actives par jour, navigation mois précédent / suivant.
- **Visibilité** : un collaborateur ne voit que ses missions et celles où il
  participe ; les autres rôles voient toute l'organisation.
- Le service accepte aussi un filtre de période (`from`, `to`) et « mes
  missions ».

## Décisions appliquées

- ADR-001 : tout passe par `withTenant` ; index `(organisation_id, …)`.
- Filtres dans l'URL : une vue se partage par lien.

## Tests

Intégration via la boucle complète ; recherche couverte par le test de
recherche globale.

## Fini quand

Le responsable logistique répond en 10 secondes à « qui est sur le terrain
aujourd'hui ? » (le tableau de bord, B6.2, l'affiche directement).

## Hors périmètre de ce bloc

Filtres destination et participant dans l'interface · mesure de performance
sur 2 000 missions.

## Dépend de

B2.6 (file de validation).
