# Données personnelles

> Document de référence pour les appels d'offres, les questionnaires de
> sécurité et le contrat de sous-traitance. **À faire relire par un juriste**
> (droit guinéen et RGPD) avant toute diffusion contractuelle.

## Rôles

- **Le client (ONG, ambassade, entreprise) est responsable de traitement** : il
  décide pourquoi et comment les données de ses missions sont traitées.
- **MissionOps est sous-traitant** : nous traitons ces données pour le compte du
  client, sur ses instructions, dans le cadre d'un contrat de sous-traitance.
- **Nos propres sous-traitants** (sous-traitants ultérieurs) sont listés dans
  [hébergement](hebergement.md). Le client est informé de tout changement.

## Cadre juridique

- **Guinée** : la loi L/2016/037/AN relative à la cybersécurité et à la
  protection des données à caractère personnel en République de Guinée
  s'applique aux traitements réalisés pour des organisations établies en
  Guinée et aux personnes qui y résident. Les obligations précises qui en
  découlent (formalités préalables, autorité de contrôle compétente, transferts
  hors de Guinée, délais) doivent être confirmées par un juriste guinéen ; ce
  document n'en cite volontairement aucun article.
- **Union européenne** : le RGPD s'applique dès qu'un client, un bailleur ou une
  personne concernée est établi dans l'UE, et de nombreux bailleurs européens
  l'imposent contractuellement à leurs partenaires. MissionOps est conçu pour le
  respecter : hébergement en UE, registre, contrat de sous-traitance, droits des
  personnes, notification des violations.

## Inventaire des données

| Catégorie            | Données                                                                                                     | Où                                                    |
| -------------------- | ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| Identité et compte   | e-mail, nom complet, langue, empreinte du mot de passe (scrypt)                                             | `users`                                               |
| Appartenance         | organisation, rôle, invitations (e-mail invité)                                                             | `memberships`, `invitations`                          |
| Sessions et sécurité | empreinte du jeton de session, dates d'expiration ; e-mail et adresse IP dans la clé de limitation de débit | `sessions`, `auth_tokens`, `rate_limits`              |
| Missions             | objet, destination, dates, participants (membres ou nom d'un externe), rapport                              | `missions`, `mission_participants`, `mission_reports` |
| Argent               | avances (bénéficiaire, mode de paiement, référence), dépenses (description, montant)                        | `advances`, `expenses`                                |
| Justificatifs        | photos de reçus, qui peuvent porter un nom, un numéro de téléphone ou une signature                         | stockage de fichiers, `receipts`                      |
| Événements terrain   | départ, arrivée, point d'étape, incident, retour ; **position GPS facultative**                             | `mission_events`                                      |
| Communication        | préférences de canal, numéro WhatsApp, contenu des notifications                                            | `notification_preferences`, `notifications`           |
| Traçabilité          | acteur, action, valeurs avant et après, horodatage, adresse IP                                              | `audit_log`                                           |

**Données que nous ne collectons pas** : données de santé, copies de pièces
d'identité ou de passeport, position géographique continue. La position n'est
enregistrée qu'à l'occasion d'un événement terrain, sur action volontaire de
l'utilisateur et après son consentement explicite, à chaque fois ; refuser
n'empêche pas l'action.

## Finalités et bases légales

| Finalité                                            | Base légale (au sens du RGPD)                                                       |
| --------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Gérer les missions, les avances et les dépenses     | exécution du contrat entre le client et ses personnels ; intérêt légitime du client |
| Conserver les pièces justificatives                 | obligation légale (comptable) et obligations contractuelles envers les bailleurs    |
| Journal d'audit                                     | obligation légale et intérêt légitime (preuve, prévention de la fraude)             |
| Sécurité du service (sessions, limitation de débit) | intérêt légitime                                                                    |
| Notifications par e-mail, WhatsApp ou SMS           | exécution du contrat ; WhatsApp et SMS sur consentement de l'utilisateur            |
| Position GPS d'un événement terrain                 | consentement, recueilli à chaque événement                                          |

Le choix de la base légale appartient au client, responsable de traitement ;
ce tableau est la proposition par défaut.

## Droits des personnes

Accès, rectification, opposition, limitation, portabilité, effacement.

1. La demande arrive chez le client (responsable de traitement), ou chez nous et
   nous la transmettons au client sous 5 jours ouvrés.
2. **Accès et portabilité** : l'administrateur de l'organisation dispose de
   l'export intégral (JSON) ; nous extrayons les lignes concernant la personne.
3. **Rectification** : par l'utilisateur (profil) ou l'administrateur ; la
   modification est journalisée.
4. **Effacement** : voir ci-dessous. Réponse au client dans un délai qui lui
   permet de répondre lui-même dans le délai légal (un mois au sens du RGPD).

## Anonymisation plutôt que suppression

MissionOps ne supprime jamais physiquement une donnée métier (ADR-005) et le
journal d'audit est en écriture seule (ADR-004) : les pièces comptables doivent
pouvoir être produites pendant leur durée de conservation (voir
[conservation](conservation.md)).

Quand l'effacement est dû et qu'aucune obligation de conservation ne s'y
oppose, on **anonymise** :

- `users` : e-mail remplacé par une adresse technique non réversible, nom
  remplacé par « Personne anonymisée », mot de passe et sessions révoqués ;
- numéro WhatsApp et préférences effacés ;
- noms d'externes dans `mission_participants` remplacés ;
- les montants, dates et justificatifs comptables restent, rattachés à
  l'identifiant anonymisé ;
- l'opération elle-même est journalisée.

Les justificatifs et le journal d'audit peuvent encore contenir des données
identifiantes : ils restent conservés pendant la durée légale, puis sont purgés
au terme de celle-ci. Procédure exécutée par un script relu, jamais par des
requêtes manuelles. **Le script d'anonymisation reste à écrire** (B8.7).

## Violation de données

1. Traiter comme un incident G1 (voir [incident](../runbooks/incident.md)).
2. Informer le client sans délai injustifié, au plus tard 48 h après en avoir
   eu connaissance, avec : nature de la violation, catégories et nombre
   approximatif de personnes et d'enregistrements, conséquences probables,
   mesures prises.
3. Le client notifie l'autorité compétente (72 h au sens du RGPD) et, si
   nécessaire, les personnes concernées. Nous l'assistons.
4. Consigner la violation dans le registre interne, même sans notification.
