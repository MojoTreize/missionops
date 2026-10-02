# B8.7 — Conformité et documentation client

> **Statut : partiel.** La documentation de référence est rédigée ; elle doit
> être relue par un juriste.

## Objectif

Répondre à un appel d'offres sans improviser.

## Contenu

`docs/conformite/` :

- `donnees-personnelles.md` : rôles (client responsable, MissionOps
  sous-traitant), loi guinéenne L/2016/037/AN et RGPD, inventaire des données,
  bases légales, droits, anonymisation plutôt que suppression, violations ;
- `hebergement.md` : localisation UE (Fly.io `cdg`, Postgres managé UE,
  stockage objet UE à venir), sous-traitants ultérieurs, transferts ;
- `conservation.md` : durées (pièces comptables 10 ans, audit illimité),
  archivage, fin de contrat ;
- `securite.md` : mesures techniques (RLS, audit en écriture seule, scrypt,
  cookies `__Host-`, CSP, limitation de débit, séparation des tâches).

## Décisions appliquées

- ADR-001, 004, 005, 007 ; plan §11.

## Tests

Relecture par un juriste (droit guinéen et RGPD).

## Fini quand

Un questionnaire de sécurité réel a été rempli en moins de deux heures.

## Hors périmètre de ce bloc

Page publique de confidentialité · registre des traitements · contrat de
sous-traitance type · questionnaire standard pré-rempli · script
d'anonymisation.

## Dépend de

B8.6 (runbooks).
