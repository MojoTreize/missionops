# Hébergement et localisation des données

> Exigence de nombreux bailleurs et agences : les données restent dans l'Union
> européenne. MissionOps héberge tout en UE depuis la première ligne de code.

## Localisation

| Composant                                   | Fournisseur / service             | Région                    | État              |
| ------------------------------------------- | --------------------------------- | ------------------------- | ----------------- |
| Application (Next.js, conteneur Docker)     | Fly.io                            | `cdg` (Paris, France)     | en service        |
| Base de données PostgreSQL                  | Postgres managé                   | UE (Paris ou Francfort)   | en service        |
| Fichiers (justificatifs, documents générés) | volume Fly.io monté sur `/data`   | `cdg`, avec l'application | en service        |
| Fichiers, cible                             | stockage objet compatible S3      | UE                        | à venir           |
| Sauvegardes chiffrées (copie hors site)     | stockage objet                    | UE, autre site            | à mettre en place |
| E-mails transactionnels                     | Resend                            | région UE à configurer    | en service        |
| Notifications WhatsApp                      | Meta, WhatsApp Cloud API          | hors UE possible          | facultatif        |
| SMS                                         | passerelle HTTP (selon le client) | selon le prestataire      | facultatif        |

Le passage du volume disque au stockage objet ne change rien pour les
utilisateurs : le code n'utilise que l'interface `BlobStore` (ADR-007).

## Sous-traitants ultérieurs

La liste ci-dessus vaut liste des sous-traitants ultérieurs. Pour chacun :
contrat ou conditions de traitement des données signés, région vérifiée, et
information du client avant tout changement.

**WhatsApp et SMS** : ces canaux transportent le texte des notifications (objet
de la mission, référence, lien) vers des opérateurs qui peuvent traiter hors
UE. Ils sont désactivés par défaut, activés par organisation et par
utilisateur, sur consentement. Les notifications ne contiennent ni montant
détaillé ni justificatif. L'e-mail reste le canal de repli.

## Transferts

- Aucune donnée n'est hébergée en Guinée ni hors UE par MissionOps, à
  l'exception éventuelle des canaux WhatsApp et SMS ci-dessus.
- Les utilisateurs accèdent au service depuis la Guinée (et ailleurs) : c'est un
  accès à distance, chiffré (HTTPS, HSTS).
- La conformité de l'hébergement en UE au regard de la loi guinéenne
  L/2016/037/AN (transferts de données hors de Guinée) est à confirmer par un
  juriste guinéen pour chaque client (voir
  [données personnelles](donnees-personnelles.md)).

## Isolation entre clients

Une seule base pour toutes les organisations, chaque ligne porte
`organisation_id`, et la Row Level Security de PostgreSQL empêche une
organisation de lire ou d'écrire les données d'une autre (ADR-001). Les fichiers
sont rangés sous un préfixe par organisation. Voir [sécurité](securite.md).

## Réversibilité

L'administrateur d'une organisation peut télécharger à tout moment l'export
intégral de ses données (JSON : toutes les tables métier, lignes supprimées
logiquement comprises, et le journal d'audit). Les fichiers sont fournis sur
demande, en archive, en attendant leur intégration à l'export.
