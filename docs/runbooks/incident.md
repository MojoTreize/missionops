# Runbook — Incident de production

> Objectif : n'importe qui dans l'équipe sait quoi faire à 3 heures du matin,
> et le client apprend l'incident par nous, pas par ses équipes.

## Niveaux de gravité

| Gravité | Définition                                                   | Exemples                                                                                   | Délai de prise en charge |
| ------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------ | ------------------------ |
| **G1**  | Fuite ou perte de données, ou service inutilisable pour tous | données d'une organisation visibles par une autre, base perdue, montants faux en série     | immédiat, 24 h / 24      |
| **G2**  | Fonction cœur dégradée pour une ou plusieurs organisations   | synchronisation refusée, justificatifs non enregistrés, Closure Pack impossible, connexion | 2 h ouvrées              |
| **G3**  | Gêne contournable                                            | e-mails en retard, rapport lent, erreur d'affichage                                        | jour ouvré suivant       |

En cas de doute, classer au niveau supérieur. On rétrograde plus tard.

## Premiers gestes (15 premières minutes)

1. **Ouvrir le fil d'incident** (canal d'équipe dédié) : heure de détection,
   symptôme, gravité supposée, qui pilote. Une seule personne pilote.
2. **Constater** :
   - `curl -fsS https://<app>.fly.dev/api/health` ;
   - `flyctl status --config fly.<env>.toml` ;
   - `flyctl logs --config fly.<env>.toml | grep '"level":"error"'` ;
   - le dernier déploiement (`flyctl releases`) : l'incident a-t-il commencé
     juste après ?
3. **Stabiliser avant de comprendre** :
   - régression après déploiement : revenir à la version précédente (voir
     [déploiement](deploiement.md#revenir-en-arrière)) ;
   - base saturée : `flyctl scale count` ou montée de taille de la machine, et
     vérifier les requêtes longues (`pg_stat_activity`) ;
   - envois en boucle : retirer `CRON_SECRET` de la tâche planifiée le temps de
     comprendre (les notifications restent en file, rien n'est perdu).
4. **Suspicion de fuite entre organisations (G1)** : couper l'accès
   (`flyctl scale count 0`) plutôt que laisser fuir. Ne rien effacer : le
   journal d'audit et les journaux applicatifs sont des preuves.
5. **Ne jamais** corriger des données à la main en SQL sans les écrire dans une
   migration ou un script relu, et sans sauvegarde préalable. Le déclencheur
   d'audit journalise toute modification, y compris les vôtres.

## Communication au client

- **G1 et G2** : premier message au référent du client **dans l'heure**, même
  sans diagnostic. Puis un point à heure fixe (toutes les 2 h pour G1) jusqu'à
  résolution.
- Canal : e-mail au référent et à l'administrateur de l'organisation, doublé
  d'un appel ou d'un WhatsApp pour G1.
- **Violation de données personnelles** : informer le client (responsable de
  traitement) sans délai injustifié, avec les éléments nécessaires à ses propres
  notifications (voir [données personnelles](../conformite/donnees-personnelles.md)).

Modèle de premier message :

> Objet : [MissionOps] Incident en cours — <symptôme en une ligne>
>
> Bonjour,
>
> Depuis <heure>, <ce que vos équipes peuvent constater>. Nous sommes en train
> de le traiter. <Ce qu'il faut faire en attendant : par exemple, « les
> dépenses saisies sur l'écran Terrain restent enregistrées sur le téléphone et
> partiront automatiquement au retour du service »>.
>
> Prochain point à <heure>.
>
> <Nom>, MissionOps

Ne jamais promettre une heure de résolution qu'on ne maîtrise pas. Dire ce
qu'on sait, ce qu'on ne sait pas, et quand on reviendra.

## Clôture et post-mortem

1. Message de fin d'incident au client : cause en une phrase, données touchées
   ou non, ce qui change pour éviter la récidive.
2. **Post-mortem écrit sous 5 jours ouvrés** pour tout G1 et G2, dans
   `docs/runbooks/post-mortems/AAAA-MM-JJ-titre.md` :
   - chronologie (détection, actions, résolution), en heure UTC ;
   - impact : organisations, utilisateurs, données, durée ;
   - cause racine et facteurs aggravants ;
   - ce qui a bien marché, ce qui a manqué (alerte, runbook, accès) ;
   - actions correctives avec responsable et échéance, suivies en issues.
3. Le post-mortem est **sans recherche de coupable** : on corrige le système,
   pas la personne.
4. Mettre à jour le runbook concerné si une étape manquait.
