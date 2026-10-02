# Mesures de sécurité

> Réponse type aux questionnaires de sécurité des ONG internationales et des
> bailleurs. Chaque mesure renvoie au code ou à la décision qui la porte.

## Isolation entre organisations

- **Row Level Security PostgreSQL, forcée** sur chaque table métier : la
  politique `org_isolation` n'expose que les lignes de l'organisation fixée
  dans la transaction (`app.current_org`). Elle s'applique aussi au
  propriétaire des tables (ADR-001).
- **Couche d'accès `withTenant`** : toute requête métier s'exécute dans une
  transaction qui fixe l'organisation ; le typage refuse une requête sans
  organisation.
- **Rôle applicatif sans privilège** : ni superutilisateur ni `BYPASSRLS` en
  production. Un test automatisé, exécuté sous un rôle non privilégié, prouve
  qu'une organisation ne lit ni n'écrit les données d'une autre, et fait
  échouer la CI si une table métier est créée sans `organisation_id` ni
  politique d'isolation.
- **Fichiers rangés par organisation** (`<organisation_id>/…`), servis
  uniquement après contrôle de l'organisation et des droits.
- **Console interne** : réservée aux adresses de `PLATFORM_ADMIN_EMAILS`. Elle
  lit chaque organisation dans son propre contexte isolé et ne contourne pas la
  RLS.

## Traçabilité

- **Journal d'audit en écriture seule** (ADR-004) : un déclencheur de base
  enregistre chaque insertion, modification et suppression sur les tables
  métier (acteur, organisation, entité, action, valeurs avant et après en JSONB,
  horodatage, adresse IP). Un déclencheur d'immuabilité et la révocation de
  `UPDATE` / `DELETE` empêchent toute modification du journal, y compris par le
  rôle applicatif.
- **Aucune suppression physique** (ADR-005) : « supprimer » renseigne
  `deleted_at` ; une écriture financière s'annule par une écriture inverse.
- **Machine à états** (ADR-006) : le statut d'une mission ne change que par une
  fonction unique qui vérifie le droit et écrit l'historique.
- **Documents immuables** : chaque document généré est versionné, avec son
  empreinte SHA-256 ; les justificatifs portent la leur, vérifiée à la réception.

## Authentification et sessions

- **Mots de passe hachés avec scrypt** (Node, `N = 16384`, `r = 8`, `p = 1`, sel
  aléatoire de 16 octets, clé de 64 octets), comparaison à temps constant.
  Aucun mot de passe en clair ni réversible n'est stocké.
- **Lien de connexion par e-mail** valable 15 minutes, lien de réinitialisation
  valable 1 heure, à usage unique ; seule l'empreinte du jeton est en base.
- **Cookie de session `__Host-missionops_session`** : `Secure`, `HttpOnly`,
  `SameSite=Lax`, `Path=/`, sans domaine (le préfixe `__Host-` l'impose). Le
  jeton est opaque ; la base n'en garde que l'empreinte. Durée : 30 jours ;
  déconnexion = révocation en base.
- **Limitation de débit de la connexion** partagée entre instances (table
  `rate_limits`) : 5 tentatives par fenêtre de 15 minutes, par couple e-mail et
  adresse IP.

## Contrôle d'accès et séparation des tâches

- **Six rôles** (collaborateur, manager, logisticien, finance, Directeur pays,
  administrateur) et une **matrice de permissions unique** testée de façon
  exhaustive (rôle × ressource × action). Chaque service vérifie la
  permission avant toute lecture ou écriture.
- **Séparation des tâches inscrite dans le domaine** :
  - le demandeur ne valide jamais sa propre mission, même s'il est manager ;
  - un validateur ne décide pas deux fois la même étape du circuit ;
  - la finance ne valide pas une dépense qu'elle a elle-même saisie ;
  - la personne qui soumet une réconciliation ne peut pas la valider ;
  - une avance qui porte le total au-delà de 120 % du budget exige l'accord du
    Directeur pays ;
  - le journal d'audit n'est lisible que par le Directeur pays et
    l'administrateur.
- **Validation des entrées** : toute entrée utilisateur passe par un schéma Zod
  partagé client et serveur (`packages/contracts`).

## Sécurité web

- **En-têtes** (`apps/web/next.config.mjs`) : `Content-Security-Policy` sans
  origine tierce (`default-src 'self'`, `frame-ancestors 'none'`,
  `object-src 'none'`, `form-action 'self'`, `base-uri 'self'`),
  `Strict-Transport-Security` (1 an, sous-domaines), `X-Frame-Options: DENY`,
  `X-Content-Type-Options: nosniff`, `Referrer-Policy:
strict-origin-when-cross-origin`, `Permissions-Policy` (caméra et
  géolocalisation pour l'origine seule, micro interdit),
  `Cross-Origin-Opener-Policy: same-origin`. En-tête `X-Powered-By` retiré.
- **Limite connue** : `script-src` autorise `'unsafe-inline'`, requis par
  l'hydratation de Next.js. Évolution prévue : nonces par requête.
- **HTTPS forcé** par l'hébergeur ; aucun service n'écoute en clair.
- **Téléversements** : types acceptés limités (`image/jpeg`, `image/png`,
  `image/webp`, `application/pdf`), 8 Mo au plus, taille et empreinte SHA-256
  vérifiées ; clés de stockage construites par le serveur et protégées contre
  la traversée de répertoire.
- **Tâche planifiée** protégée par un secret (`Authorization: Bearer`),
  comparé à temps constant.

## Exploitation

- Conteneur exécuté sous un **utilisateur non privilégié**.
- **Secrets** hors du dépôt, dans le coffre de l'hébergeur et de la CI, avec une
  procédure de rotation (voir [secrets](../runbooks/secrets.md)).
- **Sauvegardes quotidiennes chiffrées** (GPG), copie hors site, test de
  restauration mensuel (voir
  [sauvegarde](../runbooks/sauvegarde-restauration.md)).
- **Journaux structurés** sans données sensibles ni secrets, sonde de santé et
  alertes (voir [supervision](../runbooks/supervision.md)).
- **Hébergement en UE** (voir [hébergement](hebergement.md)).

## Reste à faire

Analyse statique CodeQL et audit automatisé des dépendances en CI, détection
de secrets dans l'historique, limitation de débit étendue à toutes les routes
de mutation, Sentry en région UE, checklist de revue de sécurité dans le modèle
de PR, test d'intrusion externe avant le deuxième client.
