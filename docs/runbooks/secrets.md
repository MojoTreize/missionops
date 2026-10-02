# Runbook — Secrets

> Objectif : savoir quels secrets existent, où ils vivent, et comment en
> changer un sans interruption. **Aucune valeur de secret n'apparaît dans ce
> dépôt**, ni dans ce document, ni dans un journal, ni dans un ticket.

## Où vivent les secrets

- **Application** : secrets Fly.io de chaque application
  (`fly secrets set NOM=valeur --config fly.<env>.toml`). Ils sont injectés en
  variables d'environnement au démarrage ; modifier un secret redémarre les
  machines.
- **CI / déploiement** : secrets des environnements GitHub (`staging`, puis
  `pilote` et `production` avec approbation manuelle).
- **Développement local** : fichier `.env` non versionné, valeurs de
  développement uniquement. Jamais une valeur de `pilote` ou `production` sur un
  poste de développement.
- **Clé privée GPG des sauvegardes** : hors ligne, détenue par deux personnes.

## Inventaire

| Variable                   | Rôle                                                               | Sensible | Rotation                         |
| -------------------------- | ------------------------------------------------------------------ | -------- | -------------------------------- |
| `DATABASE_URL`             | connexion Postgres (rôle applicatif non superutilisateur, ADR-001) | oui      | 12 mois, ou départ d'un membre   |
| `STORAGE_DIR`              | répertoire des fichiers (`/data/storage` dans l'image)             | non      | —                                |
| `NEXT_PUBLIC_APP_URL`      | URL publique (liens des e-mails et des notifications)              | non      | —                                |
| `CRON_SECRET`              | authentifie l'appel de `POST /api/cron`                            | oui      | 6 mois                           |
| `RESEND_API_KEY`           | envoi d'e-mails transactionnels                                    | oui      | 12 mois                          |
| `MAIL_FROM`                | adresse d'expédition (domaine vérifié SPF/DKIM/DMARC)              | non      | —                                |
| `WHATSAPP_TOKEN`           | jeton de l'API WhatsApp Cloud (Meta)                               | oui      | selon l'expiration du jeton Meta |
| `WHATSAPP_PHONE_NUMBER_ID` | identifiant du numéro WhatsApp Business                            | non      | —                                |
| `SMS_ENDPOINT`             | URL de la passerelle SMS                                           | non      | —                                |
| `SMS_TOKEN`                | jeton de la passerelle SMS                                         | oui      | 12 mois                          |
| `PLATFORM_ADMIN_EMAILS`    | adresses ayant accès à la console interne `/admin` (virgules)      | oui      | à chaque arrivée ou départ       |
| `STAGING_DATABASE_URL`     | secret GitHub : migrations du staging dans `deploy.yml`            | oui      | avec `DATABASE_URL` du staging   |
| `FLY_API_TOKEN`            | secret GitHub : déploiement Fly.io                                 | oui      | 6 mois                           |
| `BACKUP_GPG_RECIPIENT`     | clé publique de chiffrement des sauvegardes                        | non      | si la clé privée est compromise  |

Sans `RESEND_API_KEY` / `MAIL_FROM`, `WHATSAPP_*` ou `SMS_*`, le canal
correspondant retombe sur la console (journal) : utile en développement,
**à vérifier avant toute mise en pilote**.

## Rotation sans interruption

Procédure générale :

1. Générer la nouvelle valeur chez le fournisseur (ou
   `openssl rand -base64 48` pour `CRON_SECRET`).
2. La poser : `fly secrets set NOM=… --config fly.<env>.toml` (redémarrage
   progressif des machines).
3. Mettre à jour le consommateur éventuel (ordonnanceur pour `CRON_SECRET`,
   GitHub pour les secrets de CI).
4. Vérifier : `GET /api/health`, un appel de `/api/cron`, un e-mail de test.
5. Révoquer l'ancienne valeur chez le fournisseur.
6. Consigner la date de rotation (registre interne, sans la valeur).

Cas particuliers :

- **`DATABASE_URL`** : créer un second rôle applicatif (mêmes droits, ni
  superutilisateur ni `BYPASSRLS`), basculer le secret, vérifier, puis
  désactiver l'ancien rôle. Penser à `STAGING_DATABASE_URL` côté GitHub.
- **`CRON_SECRET`** : la route n'accepte qu'une valeur. Changer le secret et
  l'ordonnanceur à quelques minutes d'intervalle ; un appel manqué est sans
  conséquence (les rappels sont idempotents et rattrapés au passage suivant).
- **Sessions utilisateurs** : elles ne dépendent d'aucun secret applicatif (jeton
  opaque, seule son empreinte est en base). Pour déconnecter tout le monde,
  révoquer les sessions en base (`deleted_at`), jamais par `DELETE`.

## Fuite d'un secret

C'est un incident (voir [incident](incident.md)) : G1 pour `DATABASE_URL`, G2
pour les autres. Rotation immédiate, puis recherche d'usage frauduleux dans les
journaux du fournisseur et dans `audit_log`. Si le secret a été commité,
la rotation suffit : réécrire l'historique Git ne rend pas un secret à nouveau
confidentiel.

## Révocation d'accès d'un membre de l'équipe

Le jour du départ : retirer son adresse de `PLATFORM_ADMIN_EMAILS`, ses accès
Fly.io, GitHub et fournisseurs, puis faire tourner tout secret qu'il a pu lire
(au minimum `DATABASE_URL`, `CRON_SECRET`, `FLY_API_TOKEN`).
