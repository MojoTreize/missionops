# Runbook — Installer une nouvelle organisation

> Objectif : un nouveau client est opérationnel en moins d'une demi-journée,
> idéalement sans nous (B9.1). Ce runbook sert quand on l'accompagne.

## 1. Avant l'installation

- Contrat signé ou essai accepté, avec le **contrat de sous-traitance** (voir
  [données personnelles](../conformite/donnees-personnelles.md)).
- Un **référent** côté client : il deviendra administrateur de l'organisation.
- Rassembler avec lui : devise de base (GNF, EUR ou USD), circuit de validation
  réel (qui valide, à partir de quel montant), liste des membres (e-mail, rôle),
  lieux propres (bases, entrepôts, sites), logo et mentions des documents,
  libellés des signatures de l'ordre de mission.

## 2. Création

**En libre-service (cas normal)** : le référent ouvre `/signup`, saisit son nom,
son e-mail, un mot de passe et le nom de l'organisation. Cela crée le compte,
l'organisation (il en devient administrateur) et un abonnement **essai** de
30 jours limité à 10 places.

**Accompagnée** : le faire en partage d'écran avec le référent, pour qu'il
garde ses identifiants. Ne jamais créer un compte avec un mot de passe qu'on
lui transmettrait ensuite.

## 3. Paramétrage (`/organizations/settings`)

1. **Devise de base et fuseau horaire** (par défaut GNF et `Africa/Conakry`).
   La devise de base n'est modifiable **qu'avant la première écriture
   monétaire** (ADR-002) : la fixer dès maintenant.
2. **Plancher d'écart** à justifier en réconciliation (en devise de base).
3. **En-tête, pied de page et libellés de signature** des documents.
4. **Taux de change** (`/finance/rates`) : saisir au moins EUR→GNF et USD→GNF
   à la date du jour si l'organisation manipule plusieurs devises. Sans taux,
   une saisie en devise étrangère est refusée (`rate_missing`).
5. **Circuit de validation** (`/organizations/approval-flow`) : à défaut,
   circuit par défaut manager, puis Directeur pays au-delà de 10 000 000 GNF.

## 4. Données de départ

- **Membres** : import CSV (colonnes `email ; role`) depuis la page de
  paramétrage, ou invitations une à une (`/organizations/members`). Chaque ligne
  devient une invitation par e-mail. Le nombre de places de l'abonnement est
  vérifié avant l'envoi.
- **Lieux** : import CSV (colonnes `nom ; code_parent ; type`), le code parent
  étant un code du référentiel national (ex. `GN-D` pour Kindia), ou saisie
  dans `/organizations/locations`.
- Le rapport d'import liste les lignes refusées avec leur motif : le corriger
  avec le référent, puis réimporter les seules lignes refusées.

## 5. Vérification avec le référent

1. Créer une mission de test, la soumettre, la faire valider par un membre du
   circuit.
2. Saisir une dépense depuis l'écran Terrain d'un téléphone, avec photo, en
   mode avion puis retour en ligne.
3. Vérifier la réception des e-mails (et pas en indésirables).
4. Générer l'ordre de mission et vérifier l'en-tête, le pied de page et les
   signatures.
5. Annuler la mission de test (avec motif) : elle reste visible, rien n'est
   supprimé.

## 6. Après l'installation

- **Abonnement** : à la fin de l'essai, passer l'organisation sur sa formule
  (`essentiel` 25 places, `organisation` 200 places) depuis la console interne
  `/admin`. La facturation est manuelle à ce stade (facture émise hors
  application).
- Ajouter l'organisation au suivi mensuel d'usage (console `/admin`).
- Donner au référent le lien d'aide `/help` et le canal de support.
