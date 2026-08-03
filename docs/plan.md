# MissionOps — Plan de construction

**Le système d'exploitation des missions terrain en Guinée**

Document de référence technique et opérationnel · Version 1.0

---

## 0. Comment lire ce document

Ce plan découpe la construction de MissionOps en **11 phases** et **environ 95 blocs**. Un bloc est une unité de travail qui tient dans une session de travail avec Claude, produit une seule Pull Request, et laisse le produit dans un état fonctionnel.

Chaque bloc suit le même format :

| Champ          | Sens                                                       |
| -------------- | ---------------------------------------------------------- |
| **Objectif**   | La phrase qu'on doit pouvoir dire une fois le bloc terminé |
| **Contenu**    | Ce qui est construit concrètement                          |
| **Tests**      | Ce qui prouve que ça marche                                |
| **Fini quand** | Le critère de sortie, non négociable                       |
| **Dépend de**  | Les blocs qui doivent être finis avant                     |

Chaque bloc se décompose ensuite en 5 à 15 tâches, écrites dans son fichier de spécification (`docs/blocks/B-x-y.md`). C'est là que vivent tes « mille étapes ». Le présent document est la carte ; les fiches de bloc sont le terrain.

**Ordre de lecture recommandé :** sections 1 à 5 en entier avant de toucher au clavier. Puis la section 10 bloc par bloc, au fil de l'eau.

---

## 1. Le produit en une page

### La promesse

> MissionOps remplace WhatsApp, Excel et les reçus papier par un circuit unique : de la demande de mission jusqu'au dossier de clôture accepté par le bailleur.

### Le cœur du produit — la boucle argent-justificatif

```
Demande de mission
      ↓
   Validation hiérarchique
      ↓
   Avance décaissée
      ↓
   Dépenses saisies sur le terrain (hors ligne, photo du reçu)
      ↓
   Réconciliation de l'avance
      ↓
   Dossier de clôture exportable
```

Tout le reste du produit est construit autour de cette boucle. Si une fonctionnalité ne sert pas cette boucle, elle attend.

### Dans le périmètre de la V1

Missions · validation · budget prévisionnel · avances · dépenses · justificatifs photo · réconciliation · Mission Pack · Closure Pack · journal d'audit · multi-devises · hors ligne partiel · français et anglais.

### Explicitement hors périmètre V1

Flotte et entretien véhicule · kilométrage · carburant · catalogue fournisseurs · évaluations de prestataires · gestion RH · paie · check-in de sécurité temps réel · géolocalisation continue · tableau de bord analytique avancé · application native · API publique.

Ces sujets ne sont pas abandonnés. Ils sont en Phase 10. Les écrire ici sert à pouvoir dire non pendant dix-huit mois.

### La règle du refus

Toute demande client hors périmètre reçoit la même réponse : _« C'est noté dans la feuille de route. Voici ce que nous livrons ce trimestre. »_ Puis on l'inscrit dans `docs/backlog-refuse.md` avec le nom du client et la date. Si trois clients différents demandent la même chose, elle remonte dans le plan.

---

## 2. Les dix principes de construction

**1. Le pilote avant le code.** Aucune ligne de code produit avant qu'une organisation réelle ait accepté d'être partenaire de conception.

**2. Un bloc, une PR, un jour.** Si un bloc prend plus de deux jours, il était trop gros : on le coupe.

**3. Toujours déployable.** La branche `main` est déployée automatiquement sur `staging`. Elle ne doit jamais être cassée.

**4. La spécification précède l'implémentation.** On écrit `docs/blocks/B-x-y.md` avant de demander quoi que ce soit à Claude. Un bloc sans spec écrite n'est pas prêt.

**5. Le domaine métier est pur et testé.** Le calcul d'argent, la machine à états, la réconciliation vivent dans `packages/core`, sans base de données, sans réseau, sans React. C'est la seule partie du code où on exige 90 % de couverture.

**6. Multi-tenant dès le premier jour.** Chaque table porte `organisation_id`. Aucune exception, jamais, même pour une table qui « ne servira qu'à nous ».

**7. Rien ne se supprime.** Suppression logique uniquement. Le journal d'audit est en écriture seule. On vend de la traçabilité ; on ne peut pas la trouer.

**8. Mobile d'abord, 3G d'abord.** Chaque écran est conçu sur 375 px de large et testé sur un vrai téléphone Android d'entrée de gamme, réseau bridé.

**9. Ennuyeux par défaut.** Aucune technologie choisie pour son intérêt intellectuel. La nouveauté du produit est métier, pas technique.

**10. Une chose belle plutôt que dix choses correctes.** Le Closure Pack doit être si propre qu'un contrôleur de gestion le préfère à son propre classeur. C'est là qu'on met l'effort esthétique.

---

## 3. Le dépôt GitHub

### 3.1 Structure du monorepo

Un seul dépôt, `missionops`, privé. Monorepo géré avec **pnpm workspaces** et **Turborepo**.

```
missionops/
├── apps/
│   └── web/                    # Next.js — PWA terrain + back-office
│       ├── app/
│       │   ├── (auth)/         # connexion, invitation
│       │   ├── (app)/          # application authentifiée
│       │   └── api/            # routes serveur
│       ├── components/
│       └── public/
│
├── packages/
│   ├── core/                   # DOMAINE MÉTIER PUR — zéro dépendance externe
│   │   ├── money/              # Money, devises, taux, arrondis
│   │   ├── mission/            # machine à états, règles de validation
│   │   ├── expense/            # règles de dépense
│   │   ├── reconciliation/     # calcul de solde d'avance
│   │   └── policy/             # rôles et permissions
│   ├── db/                     # Drizzle : schéma, migrations, requêtes
│   ├── contracts/              # schémas Zod partagés client ↔ serveur
│   ├── ui/                     # design system
│   ├── documents/              # génération PDF (Mission Pack, Closure Pack)
│   ├── notifications/          # abstraction e-mail / WhatsApp / SMS
│   └── config/                 # tsconfig, eslint, tailwind partagés
│
├── e2e/                        # Playwright
├── docs/
│   ├── adr/                    # décisions d'architecture (ADR-001.md…)
│   ├── blocks/                 # une fiche par bloc du plan
│   ├── specs/                  # spécifications fonctionnelles
│   ├── runbooks/               # procédures d'exploitation
│   └── terrain/                # notes de Phase 0, artefacts clients
├── .github/
│   ├── workflows/
│   ├── ISSUE_TEMPLATE/
│   └── pull_request_template.md
├── CLAUDE.md                   # contexte permanent pour Claude
├── CONTRIBUTING.md
└── README.md
```

**Pourquoi cette forme.** `packages/core` isolé du reste est la décision la plus rentable du projet : c'est ce qui rend le calcul d'argent testable en millisecondes, sans base de données, et compréhensible par un auditeur. `packages/contracts` garantit que le formulaire du téléphone et l'API du serveur ne peuvent pas diverger silencieusement.

### 3.2 Branches et commits

**Trunk-based.** Une seule branche longue : `main`. Toutes les autres sont des branches de bloc, courtes, fusionnées en moins de 48 heures.

```
main
 ├── b/1-5-authentification
 ├── b/3-4-avances-mission
 └── fix/expense-currency-rounding
```

Nommage : `b/<numéro-de-bloc>-<slug>` pour un bloc du plan, `fix/<slug>` pour un correctif, `chore/<slug>` pour l'outillage.

**Commits conventionnels**, parce qu'ils permettent de générer le journal des versions automatiquement :

```
feat(expense): saisie de dépense hors ligne
fix(money): arrondi GNF sur conversion EUR
test(reconciliation): cas de l'avance supérieure aux dépenses
docs(adr): ADR-007 stratégie de synchronisation
chore(ci): cache pnpm dans le workflow
```

**Fusion en squash uniquement.** Un bloc = un commit sur `main`. L'historique de `main` se lit comme le plan de ce document.

### 3.3 Protection de `main`

Réglages GitHub à activer dès le premier jour :

- Pull Request obligatoire, pas de push direct
- 1 approbation requise (à partir de 2 personnes dans l'équipe)
- Tous les contrôles CI doivent passer
- Branche à jour avec `main` avant fusion
- Suppression automatique de la branche après fusion
- Historique linéaire imposé

### 3.4 Issues et suivi

Un **GitHub Project** en tableau, colonnes : `Backlog` → `Spec à écrire` → `Prête` → `En cours` → `En revue` → `Sur staging` → `Validée pilote`.

La colonne `Validée pilote` est la seule qui compte. Une fonctionnalité fusionnée mais jamais utilisée par le client réel n'est pas terminée.

**Modèles d'issue** (`.github/ISSUE_TEMPLATE/`) :

- `bloc.md` — un bloc du plan, avec la checklist du format standard
- `bug.md` — reproduction, attendu, obtenu, environnement, téléphone et réseau
- `terrain.md` — remontée d'un utilisateur réel, avec le nom de l'organisation

**Étiquettes** : `phase-1` … `phase-10` · `domaine:money` `domaine:mission` `domaine:offline` `domaine:documents` · `bloqueur` · `terrain` · `dette`.

### 3.5 Intégration continue

`.github/workflows/ci.yml` — déclenché sur chaque PR :

| Étape               | Outil                          | Durée cible |
| ------------------- | ------------------------------ | ----------- |
| Installation        | pnpm avec cache                | < 30 s      |
| Types               | `tsc --noEmit`                 | < 60 s      |
| Lint & format       | ESLint + Prettier              | < 30 s      |
| Tests unitaires     | Vitest                         | < 60 s      |
| Tests d'intégration | Vitest + Postgres en service   | < 3 min     |
| Migrations          | application sur base vierge    | < 30 s      |
| Build               | `turbo build`                  | < 2 min     |
| E2E                 | Playwright, parcours critiques | < 5 min     |
| Taille du bundle    | `size-limit`, seuil dur        | instantané  |

**Règle :** si la CI dépasse 10 minutes, on l'optimise avant d'ajouter des tests. Une CI lente est une CI que l'équipe contourne.

`.github/workflows/deploy.yml` — sur fusion dans `main` : migrations puis déploiement sur `staging`. Production déployée manuellement, par étiquette de version.

### 3.6 Environnements

| Environnement | Usage                                  | Données               |
| ------------- | -------------------------------------- | --------------------- |
| local         | développement                          | seed de démo          |
| `staging`     | validation interne, démos commerciales | seed de démo réaliste |
| `pilote`      | le client partenaire, données réelles  | réelles, sauvegardées |
| `production`  | à partir du 2ᵉ client                  | réelles               |

`pilote` est séparé de `production` pendant six mois. Cela permet de casser des choses en production sans toucher au client qui t'a fait confiance.

---

## 4. La méthode de travail

### 4.1 Seul (mois 1 à 4)

Un rythme hebdomadaire simple :

- **Lundi matin** — relire le plan, choisir les 3 à 5 blocs de la semaine, écrire leurs fiches de spec.
- **Mardi à jeudi** — implémentation, un bloc par session, une PR par bloc.
- **Vendredi matin** — déploiement sur `pilote`, session avec l'utilisateur réel.
- **Vendredi après-midi** — noter les retours dans `docs/terrain/`, ajuster le plan.

Ce vendredi est sacré. Un projet qui ne rencontre pas son utilisateur chaque semaine dérive en un mois.

### 4.2 À plusieurs (à partir du mois 4)

Tes trois amis développeurs sont un accélérateur seulement si le découpage est bon. Sinon ils sont un ralentisseur.

**Découpe par tranche verticale, jamais par couche.**

Mauvais découpage : « toi le back, toi le front, toi la base ». Chaque fonctionnalité exige alors trois personnes coordonnées, et tout le monde attend tout le monde.

Bon découpage : chaque personne prend un bloc entier, de la migration de base jusqu'à l'écran, et le mène jusqu'à `staging`.

**Répartition des domaines de propriété**, pour que les conflits de fusion soient rares :

| Personne | Domaine                              | Fichiers principalement touchés                          |
| -------- | ------------------------------------ | -------------------------------------------------------- |
| Toi      | Missions, validation, terrain client | `core/mission`, `app/(app)/missions`                     |
| Dev 2    | Argent, budget, réconciliation       | `core/money`, `core/reconciliation`, `app/(app)/finance` |
| Dev 3    | Hors ligne, PWA, photos              | `apps/web/lib/sync`, service worker                      |
| Dev 4    | Documents, exports, design system    | `packages/documents`, `packages/ui`                      |

La propriété n'est pas une exclusivité : c'est le réviseur par défaut et le responsable de la cohérence du domaine.

**Rituels, réduits au minimum :**

- Point de 15 minutes, deux fois par semaine, en visio. Trois questions : ce que j'ai fusionné, ce sur quoi je bloque, ce que je prends ensuite.
- Revue de code sous 24 heures. Une PR qui attend est un dev qui attend.
- Une session commune d'une heure par mois : on relit `main` ensemble et on supprime du code mort.

**Règle de fusion en équipe :** une PR ne dépasse jamais 400 lignes modifiées hors fichiers générés. Au-delà, on refuse la revue et on demande de couper. Ce n'est pas de la sévérité, c'est de la lucidité : personne ne relit sérieusement 1 200 lignes.

### 4.3 Définition de « terminé »

Un bloc est terminé quand **tous** ces points sont vrais :

- [ ] La spec `docs/blocks/B-x-y.md` est à jour avec ce qui a réellement été fait
- [ ] Les tests décrits dans la spec existent et passent
- [ ] La CI est verte
- [ ] Le code est relu et approuvé par une autre personne (si l'équipe > 1)
- [ ] Testé à la main sur un téléphone Android réel, réseau bridé en 3G
- [ ] Textes présents en français **et** en anglais
- [ ] Aucune régression sur le seed de démo
- [ ] Déployé sur `staging`
- [ ] Une ligne ajoutée dans `CHANGELOG.md`

### 4.4 La dette technique

Une seule règle : toute dette contractée volontairement devient une issue étiquetée `dette`, écrite **le jour même**, avec la raison et le coût estimé de remboursement. Un vendredi par mois est consacré à en rembourser deux ou trois.

La dette non écrite est la seule qui tue un projet.

---

## 5. Travailler avec Claude Opus 5

C'est le cœur de ta question, et c'est là que la plupart des projets construits avec une IA échouent. Ils échouent toujours de la même manière : une session unique, gigantesque, qui produit dix mille lignes que personne ne comprend, et qui devient impossible à modifier au troisième changement d'avis.

La méthode qui fonctionne tient en une phrase : **un bloc = une spec écrite = une session = une PR.**

### 5.1 Le fichier `CLAUDE.md`

C'est le contexte permanent, lu à chaque session. Il doit rester court — moins de 200 lignes — sinon il est ignoré. Voici la version à créer au bloc B1.1 :

```markdown
# MissionOps — contexte projet

## Ce qu'on construit

Plateforme de gestion des missions terrain pour ONG, ambassades
et entreprises en Guinée. Cœur du produit : la boucle
demande → validation → avance → dépenses terrain → réconciliation
→ dossier de clôture auditable.

## Contraintes non négociables

- Connexion instable : tout écran terrain doit fonctionner hors ligne
- Android d'entrée de gamme, écran 375 px, 3G
- Multi-devises GNF / EUR / USD, taux figé à la transaction
- Traçabilité totale : aucune suppression physique de données
- Français et anglais, français par défaut

## Stack

TypeScript strict · Next.js App Router · React · Tailwind ·
PostgreSQL · Drizzle ORM · Zod · Vitest · Playwright · pnpm + Turborepo

## Règles de code

- L'argent est TOUJOURS un entier + code devise. Jamais un flottant.
  Utiliser le type Money de packages/core/money. Jamais de calcul
  monétaire ailleurs.
- Toute table porte organisation_id. Toute requête est filtrée dessus.
- La logique métier va dans packages/core (pur, testable, sans I/O).
  Les routes et composants n'orchestrent que des appels au domaine.
- Toute entrée utilisateur est validée par un schéma Zod de
  packages/contracts, partagé client et serveur.
- Toute mutation écrit une entrée dans audit_log.
- Les textes d'interface passent par la fonction t(). Jamais de
  chaîne en dur dans un composant.
- Suppression = colonne deleted_at. Jamais de DELETE.

## Ce qu'il ne faut pas faire

- Ne pas ajouter de dépendance sans le demander d'abord
- Ne pas créer de fichier hors du périmètre du bloc en cours
- Ne pas modifier une migration déjà fusionnée : en créer une nouvelle
- Ne pas écrire de logique métier dans un composant React
- Ne pas utiliser localStorage pour des données métier (IndexedDB via
  la couche de synchronisation)

## Commandes

pnpm dev · pnpm test · pnpm test:e2e · pnpm db:migrate ·
pnpm db:seed:demo · pnpm lint · pnpm typecheck
```

### 5.2 La fiche de bloc — le vrai livrable avant le code

Modèle à copier dans `docs/blocks/` :

```markdown
# B3.4 — Avances de mission

## Objectif

Un responsable finance peut enregistrer une avance versée pour une
mission validée, en GNF, EUR ou USD, et le solde de l'avance est
visible à tout moment.

## Contexte

Lire d'abord : docs/specs/argent.md, packages/core/money/README.md
Bloc précédent : B3.3 (budget prévisionnel)

## Règles métier

1. Une avance ne peut être créée que sur une mission au statut
   VALIDEE ou EN_COURS.
2. Une mission peut recevoir plusieurs avances (complément en cours
   de mission).
3. Le total des avances ne peut pas dépasser 120 % du budget
   prévisionnel sans une validation supplémentaire du Country Director.
4. Le taux de change appliqué est celui en vigueur à la date de
   versement, figé dans la ligne.
5. Une avance versée ne peut pas être modifiée, seulement annulée
   par une écriture inverse.

## Modèle de données

Table advances : id, organisation_id, mission_id, amount_minor,
currency, fx_rate_to_base, fx_rate_date, paid_at, paid_by,
payment_method, reference, note, cancelled_at, cancelled_by,
created_at, created_by

## Interface

- Écran "Finance > Avances" : liste filtrable par mission et statut
- Formulaire de versement en tiroir latéral
- Encart sur la fiche mission : total avancé / total dépensé / solde

## Tests attendus

Unitaires (packages/core) :

- calcul du solde avec plusieurs avances et devises mélangées
- refus si mission non validée
- déclenchement du seuil 120 %
- annulation par écriture inverse, solde recalculé
  Intégration :
- création d'avance écrit bien dans audit_log
- une avance d'une organisation A est invisible depuis l'organisation B
  E2E :
- parcours complet : valider une mission, verser une avance,
  vérifier le solde sur la fiche mission

## Fini quand

Le responsable finance du pilote a enregistré 5 avances réelles
et le solde affiché correspond à son tableur.

## Hors périmètre de ce bloc

Réconciliation (B3.8) · export comptable (B6.4) · notification
de versement (B7.2)
```

Cette fiche prend 20 minutes à écrire. Elle économise trois heures de va-et-vient et surtout elle t'oblige à décider avant de construire, quand décider est encore gratuit.

### 5.3 Le modèle de prompt de session

```
Nous travaillons sur MissionOps. Lis CLAUDE.md et
docs/blocks/B3-4-avances-mission.md.

Périmètre de cette session : uniquement le bloc B3.4.

Avant d'écrire du code, propose-moi :
1. la migration de base de données
2. la signature des fonctions du domaine dans packages/core
3. la liste des fichiers que tu vas créer ou modifier

Attends ma validation avant d'implémenter.

Ensuite, implémente dans cet ordre :
migration → domaine + tests unitaires → couche d'accès aux données
→ route serveur + validation Zod → interface → test E2E

Fichiers hors périmètre à ne pas toucher : tout ce qui est en
dehors de packages/core/money, packages/db, et
apps/web/app/(app)/finance.
```

Les deux instructions les plus rentables sont _« attends ma validation avant d'implémenter »_ et la liste explicite des fichiers hors périmètre. Sans elles, la session déborde et ta PR devient irrelisable.

### 5.4 Ce qu'il faut faire soi-même

Certaines choses ne se délèguent pas, même à un très bon modèle :

- **Les règles métier.** Le seuil de 120 %, le seuil de validation du Country Director, le fait qu'une avance ne se modifie pas — ça sort du terrain, pas d'un modèle.
- **Le modèle de données.** C'est la décision la plus durable du projet. Relis chaque migration ligne à ligne.
- **La lecture des tests.** Un test qui passe mais qui teste la mauvaise chose est pire que pas de test. Lis les assertions, pas seulement le résultat vert.
- **La revue de sécurité.** Chaque requête filtre-t-elle sur `organisation_id` ? Vérifie-le toi-même, à chaque PR, jusqu'à ce que ce soit un réflexe.

### 5.5 Le rythme d'une session type

| Temps       | Activité                                            |
| ----------- | --------------------------------------------------- |
| 0–20 min    | Écrire ou relire la fiche de bloc                   |
| 20–30 min   | Plan proposé par Claude, discussion, validation     |
| 30–120 min  | Implémentation par itérations, tests à chaque étape |
| 120–150 min | Relecture humaine complète du diff, corrections     |
| 150–170 min | Test manuel sur téléphone, ouverture de la PR       |

Trois heures par bloc, en moyenne. Environ 95 blocs. C'est un ordre de grandeur utile pour se projeter, pas un engagement.

---

## 6. Architecture technique

### 6.1 La pile

| Couche      | Choix                                                   | Justification                                |
| ----------- | ------------------------------------------------------- | -------------------------------------------- |
| Langage     | TypeScript, mode strict                                 | Une seule langue du terrain au serveur       |
| Application | Next.js, App Router                                     | Web et API dans un seul déploiement          |
| Interface   | React + Tailwind + Radix UI                             | Composants accessibles, sans framework lourd |
| Base        | PostgreSQL                                              | Relationnel, JSON, recherche, tout en un     |
| ORM         | Drizzle                                                 | Proche du SQL, migrations lisibles, léger    |
| Validation  | Zod                                                     | Un schéma, deux usages : client et serveur   |
| Hors ligne  | IndexedDB via Dexie + Service Worker                    | Contrôle fin, pas de magie                   |
| Fichiers    | Stockage objet compatible S3, région UE                 | Justificatifs photo                          |
| PDF         | React-PDF ou Typst                                      | Rendu déterministe, testable                 |
| Tests       | Vitest + Playwright                                     | Rapides, un seul écosystème                  |
| Hébergement | Vercel ou Fly.io (Paris/Francfort) + Postgres managé UE | Exigence bailleur                            |
| Erreurs     | Sentry, région UE                                       |                                              |

Pour démarrer vite, **Supabase** en région UE couvre base, authentification et stockage en un seul fournisseur. La condition à respecter : ne jamais appeler le client Supabase directement depuis un composant React. Tout passe par `packages/db`. Ainsi, si tu dois migrer vers Postgres autogéré dans deux ans, tu changes une couche, pas l'application.

### 6.2 Les huit décisions structurantes

Ces décisions sont chères à corriger plus tard. Chacune fait l'objet d'un ADR dans `docs/adr/`.

**ADR-001 — Multi-tenant par colonne partagée.** Une seule base, `organisation_id` sur chaque table, index composé `(organisation_id, …)` sur chaque index. Défense en profondeur à deux niveaux : Row Level Security en base **et** une couche d'accès applicative qui exige un `orgId` en paramètre obligatoire, impossible à oublier parce que le typage le refuse.

**ADR-002 — L'argent.** Un montant est toujours `{ amountMinor: bigint, currency: 'GNF' | 'EUR' | 'USD' }`. Le GNF n'a pas de sous-unité en usage réel ; l'EUR et l'USD en ont deux. Le nombre de décimales est une propriété de la devise, pas une constante globale. Toute conversion enregistre `fx_rate` et `fx_rate_date` dans la ligne concernée, figés à jamais. Aucun historique n'est jamais recalculé au taux du jour — un auditeur refuse cela, et il a raison.

**ADR-003 — Hors ligne restreint aux créations.** La synchronisation bidirectionnelle complète est le piège technique classique : des mois de travail et des conflits impossibles à reproduire. On restreint le hors ligne à trois opérations, toutes des créations : saisir une dépense, joindre une photo, faire un check-in. Une création ne peut pas entrer en conflit. Chaque élément porte un UUID généré côté client, ce qui rend l'envoi idempotent et élimine les doublons. Validations, plannings et rapports restent en ligne uniquement : ils se font au bureau.

**ADR-004 — Journal d'audit en écriture seule.** Table `audit_log` append-only : acteur, organisation, entité, action, valeurs avant et après en JSONB, horodatage, adresse IP. Écrite par un déclencheur de base de données plutôt que par le code applicatif, pour qu'on ne puisse pas l'oublier. Aucune permission de `UPDATE` ni de `DELETE` sur cette table, même pour le rôle applicatif.

**ADR-005 — Suppression logique généralisée.** Colonne `deleted_at` partout, vues filtrées par défaut. On ne perd jamais une donnée qu'un bailleur pourrait réclamer trois ans plus tard.

**ADR-006 — Machine à états explicite.** Le statut d'une mission n'est pas une chaîne libre. Les transitions autorisées sont déclarées dans `packages/core/mission/state-machine.ts` et testées exhaustivement. Toute transition passe par une fonction unique qui vérifie les droits, applique la règle et journalise.

**ADR-007 — Les photos.** Compression côté client avant envoi : un reçu lisible tient en 200 à 400 Ko, pas en 4 Mo. Redimensionnement à 1 600 px sur le grand côté, JPEG qualité 0,75. Sur une 3G instable, c'est la différence entre un envoi qui aboutit et un utilisateur qui abandonne. Stockage objet, la base ne garde que la référence, la somme de contrôle et les métadonnées.

**ADR-008 — Internationalisation dès le socle.** Français et anglais dès le bloc B1.11, pas « plus tard ». Ajouter l'i18n après coup sur 300 écrans est un chantier de plusieurs semaines. Le faire dès le début coûte une demi-journée.

### 6.3 Les frontières internes

```
      Interface (React)
              │  n'appelle que des actions serveur
              ▼
      Actions serveur / routes API
              │  valide avec Zod, résout l'organisation et les droits
              ▼
      Services applicatifs
              │  orchestre : domaine + base + journal + notifications
              ▼
   ┌──────────┴──────────┐
   ▼                     ▼
packages/core        packages/db
(pur, sans I/O)      (SQL, transactions)
```

La règle qui tient tout : **`packages/core` n'importe rien**. Ni React, ni Drizzle, ni `fetch`, ni `Date.now()`. Le temps y est injecté en paramètre. C'est ce qui rend ses tests instantanés et déterministes, et c'est ce qui permettra un jour d'auditer les règles de calcul sans lire une ligne de code d'interface.

---

## 7. Le modèle de données

### 7.1 Tables du socle

| Table           | Rôle                                                        |
| --------------- | ----------------------------------------------------------- |
| `organisations` | Le locataire. Nom, pays, devise de base, fuseau, paramètres |
| `users`         | Compte individuel, indépendant de l'organisation            |
| `memberships`   | Lien utilisateur × organisation × rôle                      |
| `roles`         | Rôles configurables par organisation                        |
| `invitations`   | Invitations en attente                                      |
| `audit_log`     | Journal en écriture seule                                   |
| `settings`      | Paramétrage par organisation, clé-valeur typé               |

### 7.2 Tables missions

| Table                  | Rôle                                                            |
| ---------------------- | --------------------------------------------------------------- |
| `locations`            | Référentiel : régions, préfectures, sous-préfectures de Guinée  |
| `missions`             | Cœur : objectif, destination, dates, statut, priorité, créateur |
| `mission_participants` | Participants, avec leur rôle dans la mission                    |
| `approval_flows`       | Circuit de validation configuré par l'organisation              |
| `approval_steps`       | Étapes d'un circuit : rôle requis, seuil de montant, ordre      |
| `approvals`            | Décisions réelles : qui, quand, quoi, commentaire               |
| `mission_events`       | Journal métier : départ, check-in, arrivée, retour              |

### 7.3 Tables argent

| Table                | Rôle                                                     |
| -------------------- | -------------------------------------------------------- |
| `currencies`         | GNF, EUR, USD : décimales, symbole, arrondi              |
| `exchange_rates`     | Taux datés, source, saisie manuelle possible             |
| `budget_lines`       | Budget prévisionnel par catégorie                        |
| `expense_categories` | Catégories, alignables sur le plan comptable du client   |
| `advances`           | Avances versées                                          |
| `expenses`           | Dépenses réelles                                         |
| `receipts`           | Justificatifs : fichier, somme de contrôle, OCR éventuel |
| `reconciliations`    | Clôture financière d'une mission, solde, écritures       |

### 7.4 Tables documents

| Table                | Rôle                                               |
| -------------------- | -------------------------------------------------- |
| `document_templates` | Modèles par organisation : en-tête, logo, mentions |
| `documents`          | Documents générés, versionnés, immuables           |
| `mission_reports`    | Rapport de mission, résultats, difficultés         |
| `attachments`        | Pièces jointes libres                              |

### 7.5 Colonnes obligatoires sur chaque table métier

```sql
id              uuid primary key
organisation_id uuid not null references organisations(id)
created_at      timestamptz not null default now()
created_by      uuid not null references users(id)
updated_at      timestamptz not null default now()
updated_by      uuid
deleted_at      timestamptz
```

Et systématiquement, l'index qui compte :

```sql
create index on <table> (organisation_id, created_at desc)
  where deleted_at is null;
```

### 7.6 Convention de nommage

Tables au pluriel, en anglais, en `snake_case`. Colonnes en `snake_case`. Les montants portent toujours le suffixe `_minor` et sont accompagnés d'une colonne `_currency`. Les dates seules sont en `date`, les instants en `timestamptz`. Aucun `enum` PostgreSQL : des tables de référence, parce qu'un `enum` se modifie mal en migration.

---

## 8. Le design system

Tu veux quelque chose de beau et de convaincant. Précisons ce que cela veut dire ici, parce que ce n'est pas la même beauté qu'un site vitrine.

### 8.1 Le brief

Deux publics, deux contextes physiques opposés :

**Le collaborateur terrain.** Téléphone tenu d'une main, à Nzérékoré, en plein soleil, batterie à 20 %, réseau instable, parfois avec des gants ou les mains sales. Il veut faire une chose et repartir. Cibles tactiles larges, contraste élevé, très peu de texte, retour immédiat sur chaque action, état de synchronisation toujours visible.

**Le valideur au bureau.** Écran d'ordinateur, à Conakry ou au siège à Bruxelles. Il veut de la densité : voir vingt missions, comparer, décider vite. Tableaux, filtres, raccourcis clavier.

Ce sont deux produits dans une même base de code. Ne pas essayer de faire une interface unique qui fasse mal les deux.

### 8.2 Direction visuelle

La tentation est de faire un tableau de bord SaaS de plus. Le problème est que ton document le plus important n'est pas un écran : c'est le **Closure Pack**, un PDF qu'un contrôleur de gestion va imprimer, annoter et classer. L'identité du produit doit donc naître du document, pas de l'écran — et l'écran doit ressembler au document, l'inverse de l'habitude.

Une direction cohérente avec ce raisonnement :

**Palette.** Une base neutre légèrement chaude qui tienne à l'impression comme à l'écran, un vert profond comme couleur institutionnelle, une couleur d'accent réservée exclusivement aux états d'argent, et une échelle de statut à quatre valeurs.

```
--ink        #14201C   texte, en-têtes de document
--paper      #FAF9F6   fond
--field      #1F5C4A   vert institutionnel, actions principales
--ledger     #B4531A   accent argent : montants, écarts, soldes
--muted      #6B7770   texte secondaire, libellés
```

Statuts : brouillon (gris) · en attente (ambre) · validée (vert) · clôturée (encre) · incident (rouge, uniquement là).

**Typographie.** Un caractère à chasse fixe ou tabulaire pour tous les montants, sans exception — les chiffres doivent s'aligner verticalement dans une colonne, c'est la base de la lecture financière et c'est aussi ce qui rend un document crédible. Un sans-serif à forte lisibilité pour l'interface. Un serif discret pour les titres de documents PDF uniquement, qui donne au Closure Pack l'aspect d'une pièce officielle et non d'une capture d'écran.

**L'élément signature.** La _bande de mission_ : une frise horizontale compacte qui montre en un coup d'œil où en est une mission — demande, validation, avance, terrain, dépenses, clôture — avec l'état de chaque étape et le solde d'avance à droite. Elle apparaît en haut de la fiche mission à l'écran, et **en en-tête du Mission Pack et du Closure Pack**. C'est le même objet visuel dans le produit et dans le document. C'est ce que les gens retiendront et ce qu'ils montreront à leur direction.

Toute l'audace du design va dans cet élément. Le reste reste calme et discipliné.

### 8.3 Le plancher de qualité

Non négociable, sur chaque écran :

- Utilisable sur 375 px de large
- Cibles tactiles d'au moins 44 px
- Contraste conforme AA
- Focus clavier visible
- `prefers-reduced-motion` respecté
- Chaque écran a un état vide, un état de chargement et un état d'erreur conçus, pas improvisés
- Les textes en français d'abord ; l'anglais ne doit jamais casser une mise en page (les libellés anglais sont plus courts, les français débordent — concevoir sur le français)

### 8.4 L'écriture d'interface

Les mots sont du matériau de conception, pas de la décoration.

- Nommer par ce que la personne contrôle, pas par la manière dont le système est construit. On gère des « justificatifs », pas des « pièces jointes typées ».
- Voix active. Le bouton dit exactement ce qui arrive : « Verser l'avance », pas « Soumettre ».
- Une action garde le même nom du bouton jusqu'à la confirmation : « Valider la mission » produit « Mission validée ».
- Les erreurs ne s'excusent pas et ne sont jamais vagues. Elles disent ce qui s'est passé et quoi faire : « Cette dépense dépasse le budget de la ligne Transport de 450 000 GNF. Ajustez le montant ou demandez une rallonge. »
- Un écran vide est une invitation à agir, pas un constat.

---

## 9. La stratégie de test

### 9.1 La forme de la pyramide

| Niveau      | Outil                  | Volume | Ce qu'on y teste                                                     |
| ----------- | ---------------------- | ------ | -------------------------------------------------------------------- |
| Unitaire    | Vitest                 | ~70 %  | Domaine pur : argent, transitions, réconciliation, permissions       |
| Intégration | Vitest + Postgres réel | ~25 %  | Requêtes, migrations, isolation entre organisations, journal d'audit |
| E2E         | Playwright             | ~5 %   | Une dizaine de parcours critiques seulement                          |

**Objectifs de couverture, différenciés :** 90 % sur `packages/core`, 60 % sur `packages/db`, aucun objectif chiffré sur l'interface. Poursuivre la couverture sur les composants React produit des tests fragiles qui cassent à chaque changement de maquette et n'attrapent aucun bug réel.

### 9.2 Les tests qui comptent vraiment

Les bugs qui te coûteront des clients ne sont pas des bugs d'interface. Ce sont ceux-là :

**Isolation entre organisations.** Un test d'intégration générique, rejoué automatiquement sur _chaque_ table métier : créer deux organisations, insérer des données dans chacune, vérifier qu'aucune requête de l'une ne voit celles de l'autre. Ce test échoue le jour où quelqu'un oublie un filtre. C'est le test le plus important du dépôt.

**Argent.** Arrondis GNF sans sous-unité. Conversions croisées EUR → GNF → USD. Somme de dépenses en devises mixtes. Avance annulée puis re-versée. Écart budgétaire négatif. Chaque cas de la spécification a son test nommé en français, lisible par quelqu'un qui ne code pas.

**Réconciliation.** Le calcul du solde d'avance est le cœur de ta valeur. Table de cas exhaustive : dépenses inférieures à l'avance, supérieures, égales, avec annulation partielle, avec justificatif manquant, avec devises mélangées.

**Machine à états.** Test exhaustif sur toutes les paires (statut, transition) : les transitions autorisées passent, toutes les autres échouent avec une erreur explicite.

**Hors ligne.** Playwright avec `context.setOffline(true)` : saisir trois dépenses hors ligne, joindre deux photos, revenir en ligne, vérifier qu'exactement trois dépenses et deux photos remontent — pas quatre, pas deux. Puis rejouer la synchronisation deux fois de suite pour prouver l'idempotence.

**Documents.** Tests par fichier de référence : on génère le Closure Pack sur un jeu de données figé, on compare au PDF de référence. Toute modification visuelle non intentionnelle fait échouer la CI. Le fichier de référence n'est mis à jour que délibérément, dans un commit dédié.

### 9.3 Les données de test

Un seed de démo réaliste, `pnpm db:seed:demo`, qui construit :

- 2 organisations, dont une pour tester l'isolation
- 12 utilisateurs répartis sur 6 rôles
- 40 missions dans tous les statuts, sur de vraies destinations guinéennes : Kindia, Nzérékoré, Boké, Labé, Kankan, Mamou
- Des montants en GNF réalistes — les ordres de grandeur comptent, un budget mission ne fait pas 12 000 GNF
- Des justificatifs photographiés, dont deux volontairement flous et un illisible, parce que c'est la réalité du terrain
- Une mission avec un écart budgétaire, une avec un incident, une avec un justificatif manquant

Ce seed sert au développement, aux tests, et aux démonstrations commerciales. Trois usages pour un seul effort, donc il vaut la peine d'y consacrer une journée entière.

### 9.4 Le test manuel obligatoire

Aucune automatisation ne remplace ceci, à faire avant chaque déploiement sur `pilote` :

Un **vrai téléphone Android d'entrée de gamme**, acheté exprès, jamais le tien. Le navigateur bridé en « Slow 3G » dans les outils de développement. Le mode avion activé au milieu d'une saisie. Un test en plein soleil, dehors, pour vérifier le contraste réel.

Écris ce parcours dans `docs/runbooks/test-manuel.md` et suis-le à la lettre à chaque fois. Quinze minutes qui attrapent ce que trois heures de tests automatisés ne verront jamais.

---

## 10. Le plan par blocs

---

### PHASE 0 — Terrain et fondations

**Durée : 4 à 6 semaines · Zéro ligne de code produit · Fait seul**

C'est la phase que tout le monde saute et c'est celle qui détermine si le projet a un sens. Son but n'est pas de préparer le développement, c'est de découvrir le vrai processus, celui que personne ne sait décrire en réunion.

#### B0.1 — Recruter le pilote

**Objectif.** Une organisation à Conakry accepte formellement d'être partenaire de conception.
**Contenu.** Cibler une ONG internationale de taille moyenne, 20 à 60 missions hors Conakry par mois, avec un responsable logistique ou administratif-financier qui souffre réellement. Faire 12 à 15 entretiens pour en trouver une. Accord écrit d'une page : accès aux processus, une heure par semaine, engagement de tester, en échange de la gratuité pendant 18 mois et d'une influence sur la feuille de route.
**Tests.** Cette personne répond-elle à tes messages en moins de 24 heures ? Sinon, ce n'est pas le bon pilote.
**Fini quand.** L'accord est signé et la réunion hebdomadaire est dans les deux agendas.
**Dépend de.** Rien.

#### B0.2 — Cartographier le processus réel

**Objectif.** Un schéma du parcours d'une mission, du besoin jusqu'à l'archivage, validé par trois personnes différentes de l'organisation.
**Contenu.** Suivre trois missions de bout en bout. Noter chaque acteur, chaque document, chaque validation, chaque délai, chaque endroit où l'information change de support. Chronométrer.
**Tests.** Faire relire le schéma séparément par le logisticien, le comptable et le directeur pays. Les désaccords entre eux sont l'information la plus utile de toute la phase.
**Fini quand.** `docs/terrain/processus-actuel.md` est écrit et les trois relectures sont faites.
**Dépend de.** B0.1

#### B0.3 — Collecter les artefacts

**Objectif.** Disposer des vrais documents, pas de leur description.
**Contenu.** Récupérer : formulaire d'ordre de mission actuel, tableur de suivi des avances, modèle de rapport de mission, exigences du bailleur, format d'export réclamé par le comptable, photos de vrais reçus, dernier rapport d'audit. Anonymiser et archiver dans `docs/terrain/artefacts/`.
**Tests.** Peux-tu reconstituer une mission passée complète uniquement avec ces documents ?
**Fini quand.** Au moins 20 reçus réels photographiés sont archivés — ils serviront de jeu de test pendant trois ans.
**Dépend de.** B0.1

#### B0.4 — Opérer 20 missions à la main

**Objectif.** Faire le travail du logiciel manuellement, pour découvrir ce qu'aucun entretien ne révèle.
**Contenu.** Un formulaire en ligne, un tableur partagé, un dossier cloud, un groupe WhatsApp. Toi derrière, tu traites chaque demande. Tenir un journal des frictions : chaque fois que tu perds du temps, note pourquoi.
**Tests.** Le journal des frictions contient-il au moins 30 entrées ? Sinon tu n'as pas fait le travail sérieusement.
**Fini quand.** 20 missions traitées et `docs/terrain/journal-frictions.md` est rempli.
**Dépend de.** B0.2, B0.3

#### B0.5 — Figer la spécification V1

**Objectif.** Une spécification fonctionnelle de la boucle argent-justificatif, dérivée des frictions observées.
**Contenu.** Chaque fonctionnalité de la V1 doit pointer vers au moins une friction du journal. Celles qui ne pointent vers rien sont supprimées, quel que soit ton attachement pour elles. Écrire les maquettes fil de fer des 12 écrans principaux, sur papier ou dans un outil simple.
**Tests.** Faire dérouler les maquettes par l'utilisateur pilote, qui raconte à voix haute ce qu'il ferait. Noter chaque hésitation.
**Fini quand.** `docs/specs/v1.md` est écrit et le pilote a validé les maquettes.
**Dépend de.** B0.4

#### B0.6 — Décision continuer ou arrêter

**Objectif.** Répondre honnêtement à trois questions avant d'investir des mois.
**Contenu.** Le pilote utilise-t-il spontanément le dispositif manuel, ou faut-il le relancer ? Y a-t-il un budget logiciel décidé localement, ou tout vient-il du siège ? As-tu identifié deux autres organisations avec le même problème ?
**Tests.** Trois oui francs. Deux oui et une hésitation : continuer en réduisant le périmètre. Moins de deux : changer de cible avant de coder.
**Fini quand.** La décision est écrite et datée dans `docs/terrain/decision-phase-0.md`.
**Dépend de.** B0.5

---

### PHASE 1 — Le socle technique

**Durée : 3 à 4 semaines · 12 blocs · Fait seul, ou à deux maximum**

Cette phase ne produit aucune valeur visible pour le client, et c'est normal. Elle rend toutes les phases suivantes deux fois plus rapides. Ne la bâcle pas et n'y passe pas non plus deux mois.

#### B1.1 — Dépôt et outillage

**Objectif.** `git clone && pnpm install && pnpm dev` fonctionne et affiche une page.
**Contenu.** Monorepo pnpm + Turborepo, TypeScript strict, ESLint, Prettier, Husky avec lint-staged, structure de dossiers de la section 3.1, `README.md`, `CONTRIBUTING.md`, `CLAUDE.md`, modèles d'issue et de PR.
**Tests.** Un développeur qui n'a jamais vu le projet démarre en moins de 10 minutes en suivant le README.
**Fini quand.** Vérifié réellement avec un de tes trois amis.
**Dépend de.** B0.6

#### B1.2 — Intégration continue

**Objectif.** Chaque PR est vérifiée automatiquement en moins de 10 minutes.
**Contenu.** Workflow GitHub Actions : cache pnpm, `typecheck`, `lint`, `test`, `build`. Protection de `main` activée. Badge dans le README.
**Tests.** Ouvrir une PR volontairement cassée sur chaque contrôle et vérifier que chacun échoue bien.
**Fini quand.** Impossible de pousser sur `main` sans PR verte.
**Dépend de.** B1.1

#### B1.3 — Base de données et migrations

**Objectif.** Un schéma versionné, appliqué automatiquement, réversible.
**Contenu.** Drizzle configuré, première migration avec `organisations` et `users`, scripts `db:migrate`, `db:reset`, `db:studio`. Postgres en service dans la CI. Convention de nommage documentée.
**Tests.** Appliquer toutes les migrations sur une base vierge dans la CI, à chaque PR.
**Fini quand.** `pnpm db:reset && pnpm db:migrate` reconstruit la base depuis zéro sans erreur.
**Dépend de.** B1.1

#### B1.4 — Jetons de design et primitives

**Objectif.** Une base visuelle cohérente, avant tout écran.
**Contenu.** Palette, échelle typographique, échelle d'espacement, rayons, ombres, en variables CSS et en configuration Tailwind. Primitives : `Button`, `Input`, `Select`, `Dialog`, `Sheet`, `Table`, `Badge`, `Toast`, `EmptyState`, `Skeleton`, `MoneyDisplay`. Une page `/kitchen-sink` qui affiche tout.
**Tests.** Inspection visuelle sur 375 px et 1 440 px. Navigation clavier complète sur `/kitchen-sink`.
**Fini quand.** Aucun écran ultérieur n'a besoin de définir une couleur ou un espacement en dur.
**Dépend de.** B1.1

#### B1.5 — Authentification

**Objectif.** Se connecter et se déconnecter, de façon sûre.
**Contenu.** Lien magique par e-mail plus mot de passe en secours, sessions en cookies `httpOnly`, limitation de débit sur la connexion, réinitialisation, middleware de protection des routes.
**Tests.** E2E connexion et déconnexion. Test de limitation de débit. Vérifier qu'un lien magique expiré et un lien déjà utilisé sont refusés.
**Fini quand.** Un utilisateur du seed peut se connecter sur `staging` depuis un téléphone.
**Dépend de.** B1.3, B1.4

#### B1.6 — Organisations et appartenances

**Objectif.** Un utilisateur appartient à une ou plusieurs organisations et peut basculer de l'une à l'autre.
**Contenu.** Tables `organisations`, `memberships`, `invitations`. Création d'organisation, invitation par e-mail, sélecteur d'organisation dans l'en-tête, résolution de l'organisation courante côté serveur.
**Tests.** Intégration : un utilisateur membre de deux organisations ne voit que les données de celle qui est active.
**Fini quand.** Le basculement fonctionne et l'organisation active est persistée entre les sessions.
**Dépend de.** B1.5

#### B1.7 — Isolation multi-tenant

**Objectif.** Une fuite de données entre organisations est structurellement impossible.
**Contenu.** Row Level Security activée sur toutes les tables. Couche d'accès applicative où chaque fonction exige un `orgId` typé, non optionnel. Règle ESLint personnalisée interdisant l'appel direct au client de base hors de `packages/db`. Le test d'isolation générique de la section 9.2.
**Tests.** Le test générique, exécuté automatiquement sur chaque table métier existante et future.
**Fini quand.** Ajouter une table sans `organisation_id` fait échouer la CI.
**Dépend de.** B1.6

#### B1.8 — Rôles et permissions

**Objectif.** Chaque action vérifie un droit explicite.
**Contenu.** Six rôles de base : Collaborateur, Manager, Logisticien, Finance, Directeur pays, Administrateur. Matrice de permissions dans `packages/core/policy`, fonction `can(user, action, resource)`, garde côté serveur et masquage côté interface.
**Tests.** Table exhaustive rôle × action, testée intégralement en unitaire. E2E : un Collaborateur reçoit une erreur 403 sur une route Finance.
**Fini quand.** Aucune action de mutation n'existe sans appel à `can()`.
**Dépend de.** B1.7

#### B1.9 — Journal d'audit

**Objectif.** Toute modification est tracée sans que le développeur ait à y penser.
**Contenu.** Table `audit_log`, déclencheur PostgreSQL générique appliqué à chaque table métier, capture des valeurs avant et après en JSONB, contexte utilisateur transmis via `set_config`. Aucun droit `UPDATE` ni `DELETE` sur la table.
**Tests.** Intégration : chaque type de mutation produit exactement une ligne d'audit correcte. Tentative de modification d'une ligne d'audit : doit échouer.
**Fini quand.** Une modification faite directement en SQL est aussi journalisée.
**Dépend de.** B1.7

#### B1.10 — Coque applicative

**Objectif.** La navigation existe et diffère selon l'appareil.
**Contenu.** Sur mobile : barre d'onglets basse à 4 entrées, en-tête compact. Sur ordinateur : barre latérale, fil d'Ariane, recherche globale. Gestion des états de chargement, page 404, page d'erreur.
**Tests.** Navigation clavier complète. Test sur 375 px sans défilement horizontal.
**Fini quand.** On peut circuler dans l'application vide sans jamais se retrouver bloqué.
**Dépend de.** B1.4, B1.6

#### B1.11 — Internationalisation

**Objectif.** Toute l'interface bascule entre français et anglais.
**Contenu.** Bibliothèque i18n légère, fichiers de traduction, français par défaut, sélecteur dans le profil, formats de date et de nombre localisés. Règle ESLint interdisant les chaînes littérales dans le JSX.
**Tests.** Test automatique : aucune clé manquante entre les deux fichiers de langue. Inspection visuelle en anglais pour vérifier qu'aucune mise en page ne casse.
**Fini quand.** Basculer la langue ne laisse aucun texte en dur à l'écran.
**Dépend de.** B1.10

#### B1.12 — Seed de démo et environnement staging

**Objectif.** Une base de démonstration réaliste, reconstructible en une commande, et un `staging` déployé automatiquement.
**Contenu.** Le seed décrit en 9.3. Déploiement automatique de `main` sur `staging`, migrations incluses. Variables d'environnement documentées dans `.env.example`.
**Tests.** `pnpm db:reset && pnpm db:seed:demo` fonctionne. Le déploiement automatique fonctionne sur une PR de test.
**Fini quand.** Tu peux faire une démonstration à un prospect depuis `staging`, sur ton téléphone, sans préparation.
**Dépend de.** B1.11

> **Jalon 1 — Socle prêt.** À partir d'ici, les blocs deviennent parallélisables et tu peux intégrer tes trois amis.

---

### PHASE 2 — Missions et validation

**Durée : 3 à 4 semaines · 9 blocs · Parallélisable à 2**

#### B2.1 — Référentiel géographique

**Objectif.** Choisir une destination en deux touches, hors ligne.
**Contenu.** Table `locations` avec les 8 régions, 33 préfectures et principales sous-préfectures de Guinée, hiérarchisées, avec coordonnées approximatives. Possibilité pour une organisation d'ajouter ses propres lieux. Composant de sélection avec recherche insensible aux accents.
**Tests.** Unitaire : rechercher « nzerekore » sans accent trouve « Nzérékoré ».
**Fini quand.** Le référentiel est embarqué côté client et fonctionne sans réseau.
**Dépend de.** B1.12

#### B2.2 — Modèle mission et machine à états

**Objectif.** Le cycle de vie d'une mission est déclaré et impossible à contourner.
**Contenu.** Table `missions`. États : `BROUILLON` → `SOUMISE` → `VALIDEE` → `EN_COURS` → `TERMINEE` → `CLOTUREE`, plus `REJETEE` et `ANNULEE`. Machine à états dans `packages/core/mission`, fonction de transition unique vérifiant droit, règle et journalisation.
**Tests.** Test exhaustif de toutes les paires état × transition. Chaque transition interdite produit une erreur nommée.
**Fini quand.** Aucun code ne modifie `missions.status` en dehors de la fonction de transition.
**Dépend de.** B2.1

#### B2.3 — Créer une demande de mission

**Objectif.** Un collaborateur crée et soumet une demande depuis son téléphone en moins de trois minutes.
**Contenu.** Formulaire en plusieurs étapes : objectif, destination, dates, priorité, besoins logistiques. Enregistrement automatique en brouillon. Validation Zod partagée. Récapitulatif avant soumission.
**Tests.** E2E complet sur viewport mobile. Unitaire sur le schéma : dates incohérentes refusées, mission dans le passé refusée.
**Fini quand.** Chronométré à moins de trois minutes par une personne qui découvre l'écran.
**Dépend de.** B2.2

#### B2.4 — Participants

**Objectif.** Associer des personnes à une mission, avec leur rôle.
**Contenu.** Table `mission_participants`. Sélection parmi les membres de l'organisation, ajout de participants externes par nom et téléphone, désignation d'un chef de mission.
**Tests.** Intégration : un participant ne peut pas être ajouté deux fois. Un chef de mission unique par mission.
**Fini quand.** Les participants apparaissent sur la fiche mission et recevront les notifications.
**Dépend de.** B2.3

#### B2.5 — Circuit de validation configurable

**Objectif.** Chaque organisation définit qui valide quoi, selon le montant.
**Contenu.** Tables `approval_flows` et `approval_steps`. Étapes ordonnées, rôle requis, seuil de montant déclencheur. Écran de configuration réservé à l'administrateur. Circuit par défaut fourni.
**Tests.** Unitaire : le calcul du circuit applicable à une mission donnée, avec plusieurs seuils. Cas limite du montant exactement égal au seuil.
**Fini quand.** Le pilote a configuré son propre circuit réel, sans ton aide.
**Dépend de.** B2.4

#### B2.6 — File de validation

**Objectif.** Un manager traite ses validations en attente en une minute.
**Contenu.** Table `approvals`. Écran « À valider » avec le contexte essentiel visible sans ouvrir la mission. Actions valider, rejeter avec motif obligatoire, demander une modification. Validation par lot pour les missions à faible enjeu.
**Tests.** E2E : soumettre puis valider en deux étapes successives. Intégration : un validateur ne peut pas valider deux fois la même étape, ni valider sa propre demande.
**Fini quand.** Le manager du pilote a traité 10 validations réelles.
**Dépend de.** B2.5

#### B2.7 — Liste et calendrier des missions

**Objectif.** Voir toutes les missions et retrouver n'importe laquelle en quelques secondes.
**Contenu.** Liste dense sur ordinateur avec filtres statut, destination, période, participant. Vue en cartes sur mobile. Vue calendrier mensuelle. URL partageable qui conserve les filtres.
**Tests.** Performance : la liste reste fluide avec 2 000 missions dans le seed.
**Fini quand.** Le responsable logistique arrive à répondre en 10 secondes à « qui est sur le terrain aujourd'hui ? ».
**Dépend de.** B2.6

#### B2.8 — Modification, report et annulation

**Objectif.** Gérer le fait que les missions changent tout le temps.
**Contenu.** Modification d'une mission déjà validée avec revalidation conditionnelle selon l'ampleur du changement. Report de dates. Annulation avec motif et traitement de l'avance déjà versée.
**Tests.** Unitaire : quels changements déclenchent une revalidation. E2E : annuler une mission avec avance versée.
**Fini quand.** Toutes les modifications apparaissent dans le journal d'audit avec avant et après.
**Dépend de.** B2.7

#### B2.9 — Notifications par e-mail

**Objectif.** Personne n'a besoin d'aller voir l'application pour savoir qu'on l'attend.
**Contenu.** Envois transactionnels : demande soumise, validation requise, mission validée ou rejetée, rappel de validation en attente depuis 48 heures. Modèles bilingues, désinscription par catégorie.
**Tests.** Intégration avec un serveur de messagerie de test. Vérifier qu'aucun doublon n'est envoyé lors d'un renvoi.
**Fini quand.** Le pilote reçoit ses e-mails en production et ne les trouve pas dans les indésirables.
**Dépend de.** B2.8

> **Jalon 2 — Le circuit de mission tourne en réel chez le pilote.** À ce stade tu peux déjà faire une démonstration convaincante.

---

### PHASE 3 — L'argent

**Durée : 5 à 6 semaines · 10 blocs · Parallélisable à 2, mais B3.1 et B3.2 d'abord, par une seule personne**

C'est la phase la plus délicate et la plus précieuse. Un bug ici ne se pardonne pas : un client qui trouve une erreur de solde ne fait plus jamais confiance à l'outil. Prends ton temps, teste plus que partout ailleurs.

#### B3.1 — Le type Money

**Objectif.** Une seule manière de représenter et calculer de l'argent dans tout le code.
**Contenu.** `packages/core/money` : type `{ amountMinor: bigint, currency }`, opérations `add`, `subtract`, `multiply`, `allocate`, `compare`, `format`. Décimales par devise (GNF : 0, EUR et USD : 2). Interdiction structurelle d'additionner deux devises différentes sans conversion explicite. Formatage localisé.
**Tests.** Couverture 100 % sur ce module, sans exception. Tests de propriétés : la somme d'une répartition est toujours égale au montant initial, quel que soit le nombre de parts.
**Fini quand.** Une règle ESLint interdit `number` pour tout identifiant contenant `amount`, `price`, `budget`, `cost`.
**Dépend de.** B2.9

#### B3.2 — Taux de change

**Objectif.** Toute conversion est datée, tracée et non recalculable a posteriori.
**Contenu.** Table `exchange_rates` : devise source, devise cible, taux, date de validité, source, saisi par. Saisie manuelle par l'administrateur, éventuellement complétée par une source automatique. Fonction de résolution du taux applicable à une date donnée.
**Tests.** Unitaire : résolution du taux pour une date sans taux exact, cas du taux le plus récent antérieur. Refus si aucun taux disponible — jamais de valeur par défaut silencieuse.
**Fini quand.** Aucune conversion n'est possible dans le code sans fournir une date.
**Dépend de.** B3.1

#### B3.3 — Budget prévisionnel

**Objectif.** Une mission porte un budget structuré par catégorie, pas un montant unique.
**Contenu.** Tables `expense_categories` et `budget_lines`. Catégories par défaut : transport, carburant, hébergement, restauration, per diem, communication, matériel, divers. Modifiables par organisation. Ajout du budget à l'étape de demande de mission.
**Tests.** Unitaire : total budgétaire avec des lignes en devises mixtes. Intégration : les catégories d'une organisation sont invisibles pour une autre.
**Fini quand.** Le budget apparaît dans le circuit de validation et déclenche les seuils de B2.5.
**Dépend de.** B3.2

#### B3.4 — Avances de mission

**Objectif.** Enregistrer les avances versées et voir le solde à tout moment.
**Contenu.** Table `advances`. Versement, avances multiples, mode de paiement, référence. Taux figé au versement. Seuil de dépassement du budget déclenchant une validation supplémentaire. Annulation par écriture inverse, jamais par modification.
**Tests.** Voir la fiche de bloc modèle en section 5.2.
**Fini quand.** Le responsable finance du pilote a saisi 5 avances réelles et le solde correspond à son tableur.
**Dépend de.** B3.3

#### B3.5 — Saisie de dépense

**Objectif.** Enregistrer une dépense en moins de 30 secondes sur un téléphone.
**Contenu.** Table `expenses`. Formulaire minimal : montant, devise, catégorie, date, description courte. Valeurs par défaut intelligentes : devise de l'organisation, date du jour, dernière catégorie utilisée. Clavier numérique. Mode brouillon.
**Tests.** E2E chronométré sur viewport mobile. Unitaire : refus d'une dépense antérieure au début de la mission.
**Fini quand.** Chronométré à moins de 30 secondes, mesuré sur un vrai téléphone.
**Dépend de.** B3.4

#### B3.6 — Justificatifs

**Objectif.** Photographier un reçu et le rattacher à une dépense, de façon fiable.
**Contenu.** Table `receipts`. Capture par l'appareil photo, compression côté client selon l'ADR-007, envoi vers le stockage objet, miniature, visionneuse plein écran avec zoom, somme de contrôle SHA-256 pour garantir l'intégrité, plusieurs justificatifs par dépense.
**Tests.** Intégration : une photo de 4 Mo ressort à moins de 400 Ko. La somme de contrôle est stable. Test avec les 20 vrais reçus collectés en B0.3.
**Fini quand.** Un reçu photographié dans une voiture en mouvement reste lisible après compression.
**Dépend de.** B3.5

#### B3.7 — Le suivi budgétaire

**Objectif.** Voir en un coup d'œil, pendant la mission, où en est le budget.
**Contenu.** Encart sur la fiche mission : prévu, avancé, dépensé, solde, par catégorie et au total. Barres de progression, alerte visuelle au dépassement de 80 % et de 100 %. Tous les montants convertis dans la devise de base à taux figé.
**Tests.** Unitaire : calcul complet sur un jeu de données avec trois devises. Tous les cas limites du solde négatif.
**Fini quand.** Le chef de mission du pilote consulte cet encart spontanément pendant une mission réelle.
**Dépend de.** B3.6

#### B3.8 — Réconciliation de l'avance

**Objectif.** Clôturer financièrement une mission : combien reste-t-il à rendre ou à rembourser ?
**Contenu.** Table `reconciliations`. Calcul du solde : total avances moins total dépenses justifiées. Trois issues : reliquat à restituer, complément dû au collaborateur, équilibre. Enregistrement de la restitution effective. Blocage de la clôture si un justificatif obligatoire manque, avec liste explicite de ce qui manque.
**Tests.** Table de cas exhaustive de la section 9.2. C'est le module le plus testé du projet.
**Fini quand.** Cinq missions réelles du pilote sont réconciliées et le comptable confirme les montants.
**Dépend de.** B3.7

#### B3.9 — Écarts et justification

**Objectif.** Expliquer les écarts, parce que c'est ce que le bailleur demandera.
**Contenu.** Calcul de l'écart par ligne budgétaire, en valeur et en pourcentage. Champ de justification obligatoire au-delà d'un seuil paramétrable. Typologie d'écarts paramétrable par organisation.
**Tests.** Unitaire : seuil de déclenchement, écart sur une ligne à budget nul.
**Fini quand.** Un rapport d'écart est produit et jugé exploitable par le comptable du pilote.
**Dépend de.** B3.8

#### B3.10 — Validation financière

**Objectif.** Le comptable valide ou rejette chaque dépense, ligne par ligne.
**Contenu.** File de traitement finance. Actions : approuver, rejeter avec motif, demander un justificatif complémentaire. Traitement par lot. Verrouillage : une dépense approuvée devient immuable.
**Tests.** Intégration : une dépense approuvée ne peut plus être modifiée. E2E du parcours complet de validation.
**Fini quand.** Le comptable du pilote a traité un mois complet de dépenses dans l'outil.
**Dépend de.** B3.9

> **Jalon 3 — La boucle argent est complète.** C'est ici que le produit devient vendable.

---

### PHASE 4 — Terrain et hors ligne

**Durée : 4 à 5 semaines · 8 blocs · Une seule personne, c'est un domaine qui se partage mal**

#### B4.1 — PWA installable

**Objectif.** L'application s'installe sur l'écran d'accueil et s'ouvre sans navigateur visible.
**Contenu.** Manifeste, icônes, écran de démarrage, service worker avec stratégie de cache de la coque applicative, invitation à installer, gestion des mises à jour avec rechargement contrôlé.
**Tests.** Audit Lighthouse PWA au vert. Installation testée sur Android et iOS.
**Fini quand.** Installée sur le téléphone de trois utilisateurs pilotes.
**Dépend de.** B3.10

#### B4.2 — Persistance locale

**Objectif.** Les données nécessaires au terrain sont disponibles sans réseau.
**Contenu.** Dexie sur IndexedDB. Réplication locale de : missions de l'utilisateur, participants, catégories de dépense, référentiel de lieux, taux de change en vigueur. Politique d'éviction pour ne pas saturer un téléphone d'entrée de gamme.
**Tests.** Intégration : mode avion activé, la fiche mission reste consultable intégralement.
**Fini quand.** L'application est utilisable en consultation, hors ligne, dès l'ouverture.
**Dépend de.** B4.1

#### B4.3 — File de synchronisation

**Objectif.** Ce qui est créé hors ligne remonte, exactement une fois.
**Contenu.** File persistante d'opérations. UUID généré côté client. Envoi idempotent, le serveur ignore un UUID déjà reçu. Reprise avec délai exponentiel. Traitement dans l'ordre. File d'échecs consultable par l'utilisateur, avec action de réessai manuel.
**Tests.** Les tests d'idempotence de la section 9.2. Coupure réseau au milieu d'un envoi. Rejeu complet de la file deux fois de suite.
**Fini quand.** 50 opérations créées hors ligne remontent en exactement 50 enregistrements.
**Dépend de.** B4.2

#### B4.4 — Dépense hors ligne

**Objectif.** Saisir une dépense sans aucun réseau, et savoir qu'elle est bien enregistrée.
**Contenu.** Branchement du formulaire de B3.5 sur la file de synchronisation. Marquage visuel « en attente d'envoi ». Conversion de devise différée si le taux n'est pas connu localement.
**Tests.** E2E hors ligne : trois dépenses saisies, retour en ligne, trois dépenses présentes côté serveur.
**Fini quand.** Testé en conditions réelles lors d'une mission du pilote hors de Conakry.
**Dépend de.** B4.3

#### B4.5 — Photo hors ligne

**Objectif.** Photographier un reçu sans réseau et l'envoyer plus tard, sans perte.
**Contenu.** Capture, compression et stockage du binaire en IndexedDB. File d'envoi séparée, avec reprise. Indicateur de progression. Alerte si le stockage local approche de la saturation.
**Tests.** 20 photos capturées hors ligne, retour en ligne, 20 fichiers présents avec sommes de contrôle correspondantes. Test avec un téléphone dont le stockage est presque plein.
**Fini quand.** Aucune photo perdue sur 100 essais successifs.
**Dépend de.** B4.4

#### B4.6 — Événements de mission

**Objectif.** Suivre le déroulement d'une mission sans promettre une protection que tu ne peux pas assurer.
**Contenu.** Table `mission_events`. Actions volontaires uniquement : confirmer le départ, faire un point d'étape, signaler l'arrivée, signaler le retour. Position GPS optionnelle et explicitement consentie à chaque fois. Fonctionne hors ligne. Aucun suivi continu, aucune promesse de sécurité — un texte le dit clairement dans l'interface.
**Tests.** E2E hors ligne. Vérifier que le refus de partager la position n'empêche pas l'action.
**Fini quand.** La chronologie de la mission est lisible sur la fiche.
**Dépend de.** B4.5

#### B4.7 — État du réseau et de la synchronisation

**Objectif.** L'utilisateur sait toujours si son travail est enregistré côté serveur.
**Contenu.** Indicateur permanent : en ligne, hors ligne, synchronisation en cours, N éléments en attente. Écran de détail de la file. Bouton de synchronisation manuelle. Messages clairs, jamais alarmants.
**Tests.** Test visuel dans chaque état. Test de bascule répétée en ligne / hors ligne.
**Fini quand.** Un utilisateur pilote répond correctement à « est-ce que ta dépense est partie ? » sans t'appeler.
**Dépend de.** B4.6

#### B4.8 — Campagne de tests hors ligne

**Objectif.** Prouver la fiabilité avant de le promettre commercialement.
**Contenu.** Suite Playwright dédiée : dix scénarios de perte de réseau à des moments différents. Test manuel sur une vraie route Conakry–Kindia, avec les coupures réelles.
**Tests.** La suite complète passe dix fois de suite sans échec intermittent.
**Fini quand.** Le trajet réel est fait et documenté dans `docs/terrain/test-offline-kindia.md`.
**Dépend de.** B4.7

> **Jalon 4 — Le terrain fonctionne réellement hors ligne.** C'est ton principal argument face à un logiciel international.

---

### PHASE 5 — Mission Pack et Closure Pack

**Durée : 3 à 4 semaines · 7 blocs · Parallélisable à 2**

C'est la fonctionnalité qui fait dire oui. Elle mérite un soin disproportionné.

#### B5.1 — Moteur de rendu de documents

**Objectif.** Produire un PDF identique à chaque exécution.
**Contenu.** Choix technique arrêté par un ADR. Rendu côté serveur, polices embarquées, gestion de la pagination, en-tête et pied de page avec numérotation, filigrane pour les brouillons.
**Tests.** Le même jeu de données produit deux fichiers strictement identiques, octet pour octet, hors horodatage.
**Fini quand.** La génération d'un document de 20 pages prend moins de 3 secondes.
**Dépend de.** B4.8

#### B5.2 — Modèles par organisation

**Objectif.** Le document porte l'identité du client, pas la tienne.
**Contenu.** Table `document_templates`. Logo, en-tête, pied de page, mentions légales, coordonnées, numérotation personnalisée des ordres de mission. Écran de configuration avec aperçu en direct.
**Tests.** Rendu avec un logo très grand, très petit, transparent, absent.
**Fini quand.** Le pilote a chargé son logo et validé l'apparence.
**Dépend de.** B5.1

#### B5.3 — Ordre de mission

**Objectif.** Générer le document officiel signable dès la validation.
**Contenu.** Numérotation automatique, objectif, destination, dates, participants, budget autorisé, bloc de signature, QR code renvoyant à la fiche en ligne.
**Tests.** Fichier de référence. Comparaison avec l'ordre de mission papier réel du pilote.
**Fini quand.** Le pilote remplace son modèle Word par le document généré.
**Dépend de.** B5.2

#### B5.4 — La bande de mission

**Objectif.** L'élément signature de la section 8.2, utilisable à l'écran et dans les documents.
**Contenu.** Composant unique rendu en SVG, réutilisé dans l'interface React et dans le PDF. Six étapes, état de chacune, solde d'avance.
**Tests.** Rendu dans les deux contextes, comparaison visuelle. Test avec chaque combinaison d'états.
**Fini quand.** Le même composant produit exactement la même chose à l'écran et sur papier.
**Dépend de.** B5.3

#### B5.5 — Mission Pack

**Objectif.** Un dossier numérique unique remis à l'équipe au départ.
**Contenu.** Assemblage en un PDF : bande de mission, ordre de mission, programme, participants avec contacts, logistique affectée, contacts locaux, budget autorisé, checklist de départ, procédure en cas d'incident, documents joints. Généré à la validation, téléchargeable et consultable hors ligne.
**Tests.** Fichier de référence. Génération sur une mission avec zéro participant, et sur une mission avec quinze.
**Fini quand.** Une équipe pilote part réellement avec ce dossier sur son téléphone.
**Dépend de.** B5.4

#### B5.6 — Rapport de mission

**Objectif.** Le rapport se remplit sur le téléphone, au retour, en dix minutes.
**Contenu.** Table `mission_reports`. Formulaire guidé : objectifs atteints, activités réalisées, résultats chiffrés, difficultés, recommandations, suites à donner. Modèle de rapport paramétrable par organisation. Enregistrement automatique, fonctionne hors ligne.
**Tests.** E2E hors ligne. Test avec un rapport de 4 000 caractères saisi sur téléphone.
**Fini quand.** Trois rapports réels sont saisis directement dans l'outil par des collaborateurs pilotes.
**Dépend de.** B5.5

#### B5.7 — Closure Pack

**Objectif.** Le document qui justifie l'utilisation des fonds. La pièce maîtresse du produit.
**Contenu.** Un PDF unique : page de garde, bande de mission, rapport, tableau des dépenses avec renvoi numéroté vers chaque justificatif, images des justificatifs en annexe paginée, réconciliation de l'avance, tableau des écarts avec justifications, incidents, historique des validations avec dates et noms, extrait du journal d'audit. Export complémentaire en ZIP contenant le PDF, un CSV des dépenses et les fichiers originaux.
**Tests.** Fichier de référence strict. Génération sur une mission à 80 dépenses. Vérification que chaque renvoi pointe vers la bonne annexe.
**Fini quand.** **Un auditeur ou un contrôleur de gestion accepte ce dossier sans rien refaire à la main.** C'est le jalon le plus important du projet.
**Dépend de.** B5.6

> **Jalon 5 — Le produit est complet et défendable.** À partir d'ici, tu vends.

---

### PHASE 6 — Rapports, audit et exports

**Durée : 3 semaines · 7 blocs · Parallélisable à 3**

#### B6.1 — Consultation du journal d'audit

**Objectif.** Répondre à « qui a modifié ce montant, et quand ? » en moins de 30 secondes.
**Contenu.** Écran d'audit filtrable par entité, acteur, période, type d'action. Affichage lisible des différences avant/après. Accès réservé aux rôles Directeur pays et Administrateur.
**Tests.** Performance sur 500 000 lignes d'audit dans le seed.
**Fini quand.** Un auditeur externe navigue seul dans cet écran sans explication.
**Dépend de.** B5.7

#### B6.2 — Tableau de bord opérationnel

**Objectif.** L'écran d'accueil du responsable des opérations.
**Contenu.** Missions en cours, équipes sur le terrain aujourd'hui, validations en attente, avances non justifiées avec ancienneté, dépassements budgétaires, justificatifs manquants. Chaque indicateur cliquable vers la liste correspondante.
**Tests.** Chaque chiffre du tableau de bord est vérifié par un test d'intégration contre le seed.
**Fini quand.** Le responsable pilote ouvre cet écran en premier chaque matin.
**Dépend de.** B6.1

#### B6.3 — Rapports de coûts

**Objectif.** Répondre aux questions de la direction sans tableur.
**Contenu.** Coût par mission, par destination, par catégorie, par département, par période. Comparaison prévu contre réalisé. Graphiques sobres, tableaux exportables. Filtres persistants dans l'URL.
**Tests.** Cohérence : la somme des rapports détaillés égale toujours le total global.
**Fini quand.** Le directeur pays prépare sa réunion mensuelle avec ces écrans.
**Dépend de.** B6.2

#### B6.4 — Export comptable et bailleur

**Objectif.** Livrer les données dans le format que le comptable attend déjà.
**Contenu.** Exports CSV et Excel avec colonnes configurables par organisation, mise en correspondance des catégories avec le plan comptable du client, format de date et séparateur décimal paramétrables, export par période ou par projet financé.
**Tests.** Le fichier exporté s'ouvre correctement dans Excel en configuration française et anglaise, sans corruption d'accents ni de nombres.
**Fini quand.** Le comptable du pilote importe le fichier dans son logiciel sans retouche.
**Dépend de.** B6.3

#### B6.5 — Recherche globale

**Objectif.** Trouver n'importe quoi depuis n'importe où.
**Contenu.** Recherche plein texte PostgreSQL sur missions, personnes, destinations, dépenses, documents. Raccourci clavier, résultats groupés par type, insensible aux accents.
**Tests.** Performance sous 200 ms sur le seed complet. Recherche sans accent trouvant les termes accentués.
**Fini quand.** La recherche remplace la navigation dans les usages quotidiens.
**Dépend de.** B6.4

#### B6.6 — Archivage

**Objectif.** Conserver ce que les bailleurs exigent, souvent cinq à dix ans.
**Contenu.** Archivage d'une mission clôturée : gel des données, Closure Pack figé, sortie des listes actives. Politique de rétention paramétrable. Export d'archive complet, autonome et lisible sans l'application.
**Tests.** Une mission archivée est inmodifiable. L'archive exportée s'ouvre sans le logiciel.
**Fini quand.** Un exercice annuel complet est archivé et vérifié.
**Dépend de.** B6.5

#### B6.7 — Export intégral de l'organisation

**Objectif.** Le client peut partir avec toutes ses données. Paradoxalement, c'est ce qui le rassure et le fait rester.
**Contenu.** Export complet : toutes les tables en CSV, tous les fichiers, tous les documents générés, un index HTML de navigation. Déclenchable par l'administrateur de l'organisation, livré par lien signé à durée limitée.
**Tests.** L'export d'une organisation ne contient aucune donnée d'une autre. Test sur une organisation à 2 000 missions.
**Fini quand.** Un export complet est produit, téléchargé et vérifié.
**Dépend de.** B6.6

---

### PHASE 7 — Communication

**Durée : 2 à 3 semaines · 5 blocs · Une personne**

⚠️ **Commence la vérification WhatsApp Business dès la Phase 3.** C'est administratif, cela prend plusieurs semaines, et cela peut avancer en parallèle du développement. Ne découvre pas ce délai au moment où tu en as besoin.

#### B7.1 — Abstraction des canaux

**Objectif.** Le code métier ne sait pas par quel canal part une notification.
**Contenu.** `packages/notifications` : interface unique, implémentations e-mail, WhatsApp, SMS. Modèles nommés et versionnés, bilingues. File d'envoi avec reprise sur échec.
**Tests.** Implémentation factice utilisée dans tous les tests. Basculement de canal sans modification du code appelant.
**Fini quand.** Aucun appel direct à un fournisseur en dehors de ce paquet.
**Dépend de.** B6.7

#### B7.2 — E-mail transactionnel durci

**Objectif.** Les e-mails arrivent en boîte de réception, pas en indésirables.
**Contenu.** Fournisseur en région UE, SPF, DKIM et DMARC configurés, domaine d'envoi dédié, suivi des rebonds, gestion des désinscriptions, journal des envois.
**Tests.** Score d'un outil de test de délivrabilité supérieur à 9 sur 10.
**Fini quand.** Trois organisations différentes reçoivent bien les e-mails, testé chez chacune.
**Dépend de.** B7.1

#### B7.3 — WhatsApp Business

**Objectif.** Notifier là où les équipes lisent réellement.
**Contenu.** Cloud API de Meta. Entreprise vérifiée, modèles de messages soumis et approuvés à l'avance, gestion de la fenêtre de 24 heures, suivi du coût par conversation, consentement explicite enregistré par utilisateur.
**Tests.** Envoi réel vers cinq numéros guinéens. Comportement en cas de rejet d'un modèle.
**Fini quand.** Les notifications de validation partent en WhatsApp chez le pilote, avec repli automatique en e-mail.
**Dépend de.** B7.2

#### B7.4 — Préférences de notification

**Objectif.** Personne ne se désabonne de tout parce qu'il reçoit trop.
**Contenu.** Réglage par utilisateur et par type d'événement, choix du canal, plages horaires de silence, regroupement quotidien optionnel.
**Tests.** Une préférence de silence est réellement respectée, y compris pour les envois différés.
**Fini quand.** Aucun utilisateur pilote ne s'est désabonné globalement après un mois.
**Dépend de.** B7.3

#### B7.5 — Rappels automatiques

**Objectif.** Le système relance à ta place, c'est une grande partie de sa valeur perçue.
**Contenu.** Tâches planifiées : validation en attente depuis 48 heures, rapport de mission non remis 5 jours après le retour, justificatif manquant, avance non justifiée depuis 30 jours, échéance d'archivage.
**Tests.** Test des tâches planifiées avec horloge simulée. Vérifier l'absence de doublons en cas de double exécution.
**Fini quand.** Le taux de rapports remis à temps chez le pilote augmente de façon mesurable.
**Dépend de.** B7.4

---

### PHASE 8 — Durcissement

**Durée : 3 à 4 semaines · 8 blocs · Parallélisable à 4**

Cette phase précède l'arrivée du deuxième client payant. Elle transforme un logiciel qui marche en un logiciel dont on peut être responsable.

#### B8.1 — Performance en conditions réelles

**Objectif.** L'application reste utilisable sur un téléphone d'entrée de gamme en 3G.
**Contenu.** Budget de performance : moins de 200 Ko de JavaScript initial, premier affichage utile en moins de 3 secondes en 3G bridée. Découpage du code par route, chargement différé des images, optimisation des requêtes N+1, index manquants ajoutés après analyse des plans d'exécution.
**Tests.** Lighthouse en CI avec seuil bloquant. `size-limit` bloquant. Mesure sur le vrai téléphone de test.
**Fini quand.** Les seuils sont atteints et verrouillés en CI.
**Dépend de.** B7.5

#### B8.2 — Accessibilité

**Objectif.** Le produit passe un audit d'accessibilité — plusieurs bailleurs institutionnels le vérifient.
**Contenu.** Conformité AA : contrastes, navigation clavier intégrale, libellés ARIA, ordre de focus, annonces des changements dynamiques, respect de `prefers-reduced-motion`.
**Tests.** `axe-core` intégré aux tests Playwright, échec bloquant. Parcours complet au clavier seul. Test avec un lecteur d'écran sur les trois écrans principaux.
**Fini quand.** Zéro violation critique ou sérieuse sur tous les écrans.
**Dépend de.** B8.1

#### B8.3 — Sécurité applicative

**Objectif.** Résister à un questionnaire de sécurité d'ONG internationale.
**Contenu.** Audit des dépendances automatisé, analyse statique CodeQL, détection de secrets dans l'historique, en-têtes de sécurité complets, politique de sécurité de contenu stricte, limitation de débit sur toutes les routes de mutation, rotation des secrets documentée, revue manuelle de chaque route pour la vérification d'organisation et de droit.
**Tests.** Tentatives délibérées : accéder à une ressource d'une autre organisation par identifiant direct, élever ses droits, injecter du script dans un champ texte, téléverser un fichier exécutable.
**Fini quand.** La checklist de revue de sécurité est intégrée au modèle de PR.
**Dépend de.** B8.2

#### B8.4 — Observabilité

**Objectif.** Savoir qu'un problème existe avant que le client n'appelle.
**Contenu.** Sentry en région UE avec identification de l'organisation concernée, journaux structurés, métriques applicatives, tableau de bord de disponibilité, alertes sur taux d'erreur, latence et échecs de synchronisation.
**Tests.** Provoquer une erreur en `staging` et vérifier que l'alerte arrive.
**Fini quand.** Une alerte t'a réellement prévenu d'un incident avant le client.
**Dépend de.** B8.3

#### B8.5 — Sauvegardes et restauration

**Objectif.** Pouvoir perdre la base sans perdre le client.
**Contenu.** Sauvegardes automatiques quotidiennes, restauration à un instant donné, sauvegarde du stockage objet, réplication dans une seconde région, objectifs documentés de perte maximale et de délai de reprise.
**Tests.** **Exercice de restauration complet, réel, chronométré, une fois par trimestre.** Une sauvegarde jamais restaurée n'est pas une sauvegarde.
**Fini quand.** Le premier exercice est réussi et documenté.
**Dépend de.** B8.4

#### B8.6 — Runbooks

**Objectif.** N'importe qui dans l'équipe peut gérer un incident à 3 heures du matin.
**Contenu.** `docs/runbooks/` : déploiement, restauration, migration risquée, incident de production, révocation d'accès, ajout d'une organisation, procédure d'astreinte, modèle de communication de crise au client.
**Tests.** Un membre de l'équipe exécute un runbook sans aide et signale ce qui manque.
**Fini quand.** Chaque runbook a été suivi au moins une fois par quelqu'un qui ne l'a pas écrit.
**Dépend de.** B8.5

#### B8.7 — Conformité et documentation client

**Objectif.** Répondre à un appel d'offres sans improviser.
**Contenu.** Page publique de confidentialité et de traitement des données, registre des traitements, contrat de sous-traitance type, liste des sous-traitants, localisation des données, politique de rétention, procédure d'exercice des droits, questionnaire de sécurité standard pré-rempli.
**Tests.** Faire relire par un juriste. C'est une dépense, pas un luxe.
**Fini quand.** Un questionnaire de sécurité réel a été rempli en moins de deux heures.
**Dépend de.** B8.6

#### B8.8 — Tests de charge

**Objectif.** Connaître ses limites avant de les atteindre.
**Contenu.** Scénarios : 50 organisations, 500 utilisateurs actifs, 5 000 missions par mois, pic de synchronisation de 200 appareils revenant en ligne simultanément.
**Tests.** Mesurer, identifier le point de rupture, documenter le seuil de mise à l'échelle.
**Fini quand.** `docs/adr/capacite.md` documente les limites connues et le plan de croissance.
**Dépend de.** B8.7

> **Jalon 6 — Prêt pour le multi-client.**

---

### PHASE 9 — Passage à l'échelle commerciale

**Durée : 4 à 5 semaines · 7 blocs**

#### B9.1 — Autonomie d'installation

**Objectif.** Une organisation démarre sans que tu interviennes.
**Contenu.** Parcours guidé : créer l'organisation, choisir la devise de base, importer les utilisateurs, choisir un circuit de validation type, charger le logo, créer une première mission de test. Progression sauvegardée.
**Tests.** Une personne qui ne te connaît pas démarre seule, chronométrée, en moins de 30 minutes.
**Fini quand.** Une organisation réelle s'est installée sans ton aide.
**Dépend de.** B8.8

#### B9.2 — Paramétrage par organisation

**Objectif.** Chaque client adapte l'outil à ses procédures sans développement spécifique.
**Contenu.** Écran d'administration : catégories, circuits de validation, seuils, per diem par destination, modèles de documents, champs personnalisés sur les missions, rôles.
**Tests.** Configurer trois organisations aux règles très différentes sans toucher au code.
**Fini quand.** Trois profils de configuration types sont livrés : ONG, entreprise, cabinet.
**Dépend de.** B9.1

#### B9.3 — Import de données

**Objectif.** Ne pas demander à un client de ressaisir son historique.
**Contenu.** Import CSV : utilisateurs, missions historiques, catégories, fournisseurs. Aperçu avant validation, rapport d'erreurs ligne par ligne, import partiel possible, annulation d'un import.
**Tests.** Import d'un fichier volontairement sale : accents, dates en trois formats, montants avec espaces, lignes vides, doublons.
**Fini quand.** L'historique complet du pilote est importé.
**Dépend de.** B9.2

#### B9.4 — Abonnement et facturation

**Objectif.** Encaisser sans intervention manuelle.
**Contenu.** Formules par nombre d'utilisateurs actifs ou de missions. Facturation en EUR ou USD pour les sièges, arrangement local pour les clients guinéens. Factures conformes, période d'essai, gestion des impayés avec dégradation progressive plutôt que coupure brutale.
**Tests.** Cycle complet en environnement de test, y compris échec de paiement et reprise.
**Fini quand.** Le deuxième client paie automatiquement.
**Dépend de.** B9.3

#### B9.5 — Support et documentation

**Objectif.** Les utilisateurs se débloquent sans t'écrire.
**Contenu.** Aide contextuelle intégrée, guide utilisateur bilingue, courtes vidéos de moins de deux minutes filmées sur téléphone, foire aux questions alimentée par les vraies questions reçues, canal de support avec engagement de délai affiché.
**Tests.** Mesurer la part de questions déjà couvertes par la documentation.
**Fini quand.** Le volume de sollicitations directes baisse alors que le nombre d'utilisateurs augmente.
**Dépend de.** B9.4

#### B9.6 — Console d'administration interne

**Objectif.** Diagnostiquer un problème client sans requête SQL manuelle.
**Contenu.** Console réservée à ton équipe : liste des organisations, indicateurs d'usage, état des files de synchronisation, journaux d'envoi, prise de contrôle en lecture seule avec consentement enregistré et journalisation systématique.
**Tests.** Toute action dans la console est journalisée. La prise de contrôle est impossible sans trace.
**Fini quand.** Un incident client est diagnostiqué uniquement depuis la console.
**Dépend de.** B9.5

#### B9.7 — Mesure de l'usage

**Objectif.** Savoir quelles organisations sont en train de décrocher, avant le renouvellement.
**Contenu.** Indicateurs par organisation : missions créées, taux de clôture, délai moyen de validation, part de dépenses avec justificatif, utilisateurs actifs hebdomadaires. Alerte interne sur baisse d'activité. Aucune donnée personnelle exportée hors du cadre du contrat.
**Tests.** Vérifier que les indicateurs ne franchissent jamais la frontière entre organisations.
**Fini quand.** Tu peux répondre à « quel client risque de ne pas renouveler ? » avec des chiffres.
**Dépend de.** B9.6

---

### PHASE 10 — Extensions

**À partir du mois 18 · Ordre déterminé par la demande réelle, pas par ce document**

Ces blocs ne sont détaillés que lorsqu'au moins trois clients payants ont demandé le module concerné. Les décrire en détail aujourd'hui serait de la fiction.

| Bloc   | Module                                           | Déclencheur                              |
| ------ | ------------------------------------------------ | ---------------------------------------- |
| B10.1  | Véhicules et affectation                         | 3 clients avec flotte propre             |
| B10.2  | Chauffeurs vérifiés, documents, disponibilité    | après B10.1                              |
| B10.3  | Kilométrage, carburant, entretien                | après B10.2                              |
| B10.4  | Fournisseurs : vérification, contrats, documents | demande récurrente en appel d'offres     |
| B10.5  | Évaluation des prestataires                      | après B10.4                              |
| B10.6  | Hébergements et réservations                     | demande terrain                          |
| B10.7  | Incidents : déclaration, suivi, analyse          | exigence de conformité client            |
| B10.8  | Per diem automatisés par barème                  | demande RH                               |
| B10.9  | API publique et webhooks                         | premier client demandant une intégration |
| B10.10 | Connecteurs comptables                           | après B10.9                              |
| B10.11 | Application mobile native                        | uniquement si un contrat l'exige         |
| B10.12 | Tableaux de bord multi-pays                      | premier client régional                  |

**Le module qui a le plus de valeur commerciale et le moins de coût technique est B10.4, Fournisseurs.** C'est le pont vers ton avantage structurel : le réseau de prestataires vérifiés, décrit dans ton second document. Ce qui n'était pas viable comme produit de départ devient un module très défendable une fois que les missions sont déjà dans ton système.

---

## 11. Sécurité, conformité et hébergement

Trois décisions doivent être prises au premier jour, pas en Phase 8, parce qu'elles sont très chères à corriger ensuite.

**Localisation des données.** Beaucoup d'ONG internationales, d'agences des Nations unies et de bailleurs institutionnels imposent une localisation des données, le plus souvent dans l'Union européenne. Héberge en région UE — Paris ou Francfort — dès la première ligne de code, pour la base, le stockage des fichiers, les journaux et les erreurs. Migrer une base de production entre régions plus tard est un chantier avec interruption de service.

**Le sous-traitant, c'est toi.** Dans le vocabulaire du RGPD, tes clients sont responsables de traitement et tu es sous-traitant. Cela implique un contrat de sous-traitance, un registre, une liste de tes propres sous-traitants et une procédure de notification en cas de violation. Prépare-les en Phase 8, mais sache dès maintenant que cela viendra.

**Les données que tu ne veux pas.** Ne collecte jamais de données de santé, ni de position géographique continue, ni de copie de passeport, sauf demande explicite d'un client avec une base juridique claire. Chaque catégorie de données sensible ajoutée multiplie tes obligations. Le fait de ne pas les avoir est un argument commercial, pas une lacune.

**Ce que tu ne promets jamais.** Ton second document le disait déjà et c'est juste : pas de protection physique, pas d'assistance médicale, pas de garantie sécuritaire. MissionOps est un outil de coordination. Toute fonctionnalité touchant à la sécurité des personnes doit renvoyer vers les procédures et les partenaires qualifiés du client, avec un texte explicite dans l'interface. Cette limite doit figurer dans tes conditions générales et dans ton discours commercial. Elle te protège, et elle est honnête.

---

## 12. Rythme et jalons

### 12.1 Le calendrier réaliste

Deux hypothèses, parce que la vitesse dépend entièrement de la disponibilité réelle.

| Phase                   | Seul, à temps partiel | À 4, à temps plein |
| ----------------------- | --------------------- | ------------------ |
| Phase 0 — Terrain       | Mois 1–2              | Mois 1             |
| Phase 1 — Socle         | Mois 2–3              | Mois 2             |
| Phase 2 — Missions      | Mois 4–5              | Mois 3             |
| Phase 3 — Argent        | Mois 6–8              | Mois 4–5           |
| Phase 4 — Hors ligne    | Mois 9–10             | Mois 6             |
| Phase 5 — Documents     | Mois 11–12            | Mois 7             |
| Phase 6 — Rapports      | Mois 13–14            | Mois 8             |
| Phase 7 — Communication | Mois 15               | Mois 9             |
| Phase 8 — Durcissement  | Mois 16–17            | Mois 10            |
| Phase 9 — Échelle       | Mois 18–19            | Mois 11–12         |
| Phase 10 — Extensions   | Mois 20+              | Mois 13+           |

Ces chiffres supposent que tu ne changes pas de périmètre. Chaque fonctionnalité ajoutée hors plan décale tout d'un mois. C'est le vrai risque, pas la difficulté technique.

### 12.2 Les six jalons qui comptent

| Jalon                       | Preuve                               | Ce que ça débloque       |
| --------------------------- | ------------------------------------ | ------------------------ |
| 1 — Socle prêt              | Un dev externe démarre en 10 min     | Intégrer l'équipe        |
| 2 — Circuit de mission réel | 20 missions validées dans l'outil    | Faire des démonstrations |
| 3 — Boucle argent complète  | Le comptable confirme les soldes     | Commencer à vendre       |
| 4 — Hors ligne prouvé       | Trajet Conakry–Kindia documenté      | Argument différenciant   |
| 5 — Closure Pack accepté    | Un auditeur ne refait rien à la main | **Le produit existe**    |
| 6 — Multi-client            | Le 2ᵉ client s'installe seul         | Passer à l'échelle       |

Le jalon 5 est le seul qui compte vraiment. Avant lui, tu as un prototype prometteur. Après lui, tu as une entreprise.

### 12.3 Ce qu'il faut mesurer chaque mois

Pas des lignes de code ni des commits. Ceci :

- Missions créées dans l'outil ce mois-ci chez le pilote
- Part de missions clôturées avec un Closure Pack complet
- Délai médian entre le retour de mission et la clôture financière
- Part de dépenses accompagnées d'un justificatif photographié
- Nombre de fois où quelqu'un a contourné l'outil en revenant à WhatsApp

Ce dernier indicateur est le plus honnête de tous. Une seule question à poser chaque vendredi : _« qu'est-ce que tu as fait cette semaine en dehors de l'outil, et pourquoi ? »_

---

## 13. Les pièges connus

**Construire la Phase 10 en Phase 2.** La flotte et les fournisseurs sont plus amusants à construire que la réconciliation d'avance. C'est exactement pour ça qu'il faut résister. Le plan est ordonné par valeur client, pas par plaisir de développement.

**La synchronisation bidirectionnelle.** Si tu te surprends à écrire du code de résolution de conflits, arrête-toi et relis l'ADR-003. Le hors ligne est restreint aux créations pour une raison.

**Le client qui demande une fonctionnalité pendant la démonstration.** Ne dis jamais oui dans la salle. Note, remercie, réponds par écrit sous 48 heures après avoir regardé le plan à froid.

**La refonte visuelle prématurée.** Tu vas avoir honte de tes écrans vers le mois 6. Ne les refais pas. Refais-les en Phase 8, une seule fois, quand tu sauras ce que le produit est devenu.

**Le deuxième client trop tôt.** Un deuxième client avant le jalon 5 double ta charge de support et divise ta vitesse par deux, sans rien valider de plus. Attends.

**L'équipe qui grandit avant le socle.** N'intègre pas tes trois amis avant le jalon 1. Quatre personnes sur un dépôt sans CI, sans conventions et sans design system produisent moins qu'une seule.

**Le siège qui impose l'outil.** Le risque commercial numéro un, identifié plus tôt. Vérifie à chaque prospect : qui décide des outils du bureau pays, et existe-t-il un budget logiciel décidé localement ? Si la réponse est toujours « le siège », oriente-toi vers les ONG nationales, les sociétés minières, les cabinets et les projets financés localement.

**Confondre activité et progrès.** Cinquante commits dans une semaine sans qu'un utilisateur réel ait touché quoi que ce soit, c'est zéro progrès. Le vendredi avec le pilote est le seul juge.

---

## 14. La checklist de démarrage

### Cette semaine

- [ ] Créer le dépôt privé `missionops` sur GitHub
- [ ] Créer le GitHub Project avec les 7 colonnes de la section 3.4
- [ ] Copier ce document dans `docs/plan.md` et le versionner
- [ ] Créer `docs/blocks/`, `docs/adr/`, `docs/terrain/`, `docs/runbooks/`
- [ ] Écrire `CLAUDE.md` avec le contenu de la section 5.1
- [ ] Créer les issues B0.1 à B0.6 dans le projet
- [ ] Établir la liste de 20 organisations à contacter à Conakry
- [ ] Envoyer les 8 premières demandes d'entretien

### Ce mois-ci

- [ ] Mener 12 à 15 entretiens
- [ ] Signer le pilote (B0.1)
- [ ] Lancer la vérification WhatsApp Business — c'est long, commence maintenant
- [ ] Réserver le nom de domaine et créer les comptes d'hébergement en région UE
- [ ] Décider avec tes trois amis qui prend quel domaine, et à partir de quand

### Avant la première ligne de code produit

- [ ] Les six blocs de Phase 0 sont terminés
- [ ] `docs/terrain/journal-frictions.md` contient au moins 30 entrées
- [ ] `docs/specs/v1.md` est écrit et validé par le pilote
- [ ] La décision de B0.6 est écrite et datée

---

## Un dernier mot

Ce document est un plan, pas un contrat. Il va changer, et c'est sain — mais il doit changer par écrit, dans le dépôt, avec une raison datée. Un plan qui dérive silencieusement est un plan qui n'existe plus.

Deux repères pour t'orienter quand tu hésiteras :

Le premier est le journal des frictions de la Phase 0. Chaque fois qu'une décision te paraîtra ambiguë, relis-le. La réponse y est presque toujours.

Le second est cette question, à poser au pilote chaque vendredi : _« si je débranchais MissionOps lundi matin, qu'est-ce qui te manquerait ? »_

Tant que la réponse est « rien de grave », il reste du travail. Le jour où la réponse est « je ne pourrais plus justifier mes dépenses au bailleur », le produit est indispensable — et c'était exactement ton objectif de départ.
