# Politique de conservation

> Principe : on conserve ce qu'un bailleur ou un auditeur peut réclamer, aussi
> longtemps qu'il peut le réclamer, et rien de plus. Rien n'est supprimé
> physiquement en cours de vie (ADR-005) ; la fin de conservation se traite par
> anonymisation ou par purge contrôlée.

## Durées

| Données                                                                           | Durée                                                             | Justification                                                     |
| --------------------------------------------------------------------------------- | ----------------------------------------------------------------- | ----------------------------------------------------------------- |
| Pièces comptables : avances, dépenses, justificatifs, réconciliations, taux figés | **10 ans** après la clôture de l'exercice de la mission           | obligations comptables usuelles et exigences des bailleurs        |
| Documents générés (ordre de mission, Mission Pack, Closure Pack)                  | 10 ans, comme les pièces qu'ils justifient                        | le Closure Pack est la pièce de justification remise au bailleur  |
| Missions, participants, rapports, événements terrain                              | 10 ans après la clôture de la mission                             | contexte indissociable des pièces comptables                      |
| Journal d'audit (`audit_log`)                                                     | **illimitée** pendant la vie du contrat                           | preuve de l'intégrité de tout le reste ; écriture seule (ADR-004) |
| Comptes utilisateurs                                                              | durée de l'appartenance, puis anonymisation sur demande           | voir [données personnelles](donnees-personnelles.md)              |
| Sessions et jetons de connexion                                                   | 30 jours (session), 15 min (lien magique), 1 h (réinitialisation) | sécurité ; révoqués par `deleted_at`                              |
| Notifications envoyées                                                            | 12 mois                                                           | diagnostic de délivrabilité                                       |
| Compteurs de limitation de débit                                                  | fenêtre de 15 minutes                                             | sécurité                                                          |
| Journaux applicatifs                                                              | 30 jours                                                          | diagnostic d'incident                                             |
| Sauvegardes                                                                       | 30 jours (quotidiennes), 12 mois (mensuelles)                     | voir [sauvegarde](../runbooks/sauvegarde-restauration.md)         |

Les durées comptables sont des valeurs par défaut prudentes. Un client ou un
bailleur peut exiger une durée différente (cinq ans pour certains contrats,
davantage pour d'autres) : la durée contractuelle la plus longue applicable
l'emporte, et elle est consignée dans le contrat de sous-traitance. À faire
valider par un juriste et un expert-comptable pour la Guinée.

## Archivage

- Depuis le paramétrage de l'organisation, l'administrateur archive en une
  action les missions **clôturées ou annulées depuis plus de 180 jours** : elles
  quittent les listes courantes et deviennent **en lecture seule**
  (`missions.archived_at`). Toute tentative de modification est refusée. Rien
  n'est supprimé.
- Les documents générés sont **immuables et versionnés** (table `documents`) :
  régénérer un document modifié crée une nouvelle version, l'ancienne reste
  disponible avec son empreinte SHA-256.
- L'**export intégral** (JSON) permet au client de constituer sa propre archive,
  lisible sans l'application.

## Fin de contrat

1. L'organisation reçoit son export intégral et, sur demande, l'archive de ses
   fichiers.
2. L'abonnement passe au statut `resiliee` ; les comptes perdent l'accès.
3. Les données sont conservées pendant la durée de conservation comptable
   restante, sauf instruction écrite contraire du client (qui devient alors
   seul responsable de leur conservation).
4. Au terme : anonymisation des données personnelles et purge des fichiers, par
   un script relu et journalisé. Les sauvegardes antérieures expirent d'elles-mêmes
   selon leur rétention (12 mois au plus).
