# ADR-006 — Machine à états explicite

- **Statut** : acceptée
- **Bloc** : B2.2 (modèle mission et machine à états)
- **Date** : rédigée a posteriori, après fusion de la Phase 2

## Contexte

Le statut d'une mission conditionne tout le reste : qui peut la modifier, si
une avance peut être versée, si une dépense peut être saisie, si le Closure
Pack peut être produit. Un statut modifié « à la main » par un écran ou un
script (une mission clôturée sans réconciliation, une mission validée par son
propre demandeur) ruine la valeur d'audit du produit.

## Décision

1. **Statuts fermés.** `MISSION_STATUSES` (`packages/core/src/mission/state-machine.ts`) :
   `BROUILLON`, `SOUMISE`, `VALIDEE`, `EN_COURS`, `TERMINEE`, `CLOTUREE`,
   `REJETEE`, `ANNULEE`. `CLOTUREE` et `ANNULEE` sont terminaux.
2. **Événements déclarés.** `submit`, `approve`, `reject`, `rework`, `revise`,
   `start`, `finish`, `close`, `cancel`. La table `TRANSITIONS` associe à chaque
   événement ses couples (départ → arrivée) autorisés :

   | Événement | Départ → arrivée                         |
   | --------- | ---------------------------------------- |
   | `submit`  | BROUILLON → SOUMISE                      |
   | `approve` | SOUMISE → VALIDEE                        |
   | `reject`  | SOUMISE → REJETEE                        |
   | `rework`  | REJETEE ou SOUMISE → BROUILLON           |
   | `revise`  | VALIDEE → SOUMISE (modification de fond) |
   | `start`   | VALIDEE → EN_COURS                       |
   | `finish`  | EN_COURS → TERMINEE                      |
   | `close`   | TERMINEE → CLOTUREE                      |
   | `cancel`  | BROUILLON, SOUMISE ou VALIDEE → ANNULEE  |

3. **Une fonction unique, `transition(sujet, événement, contexte)`**, pure, qui
   vérifie dans l'ordre : la transition existe, l'acteur en a le droit, les
   gardes métier sont satisfaites, le motif est fourni quand il est exigé. Elle
   renvoie l'entrée d'historique à persister (départ, arrivée, événement,
   acteur, commentaire, instant injecté).
4. **Erreurs nommées.** Chaque refus lève une `MissionTransitionError` portant
   un code stable : `TRANSITION_INTERDITE`, `DROIT_INSUFFISANT`,
   `DEMANDE_INCOMPLETE`, `VALIDATION_INCOMPLETE`,
   `RECONCILIATION_NON_VALIDEE`, `MOTIF_OBLIGATOIRE`. Les services les
   convertissent en `ServiceError` du même code, traduit à l'écran par `t()`.
5. **Règles de droit encodées dans la machine** : le demandeur ne valide jamais
   sa propre mission, même s'il est manager ; `close` est réservé aux rôles
   ayant `expense:approve` ; rejet et annulation exigent un motif.
6. **Une seule écriture de `missions.status`** dans tout le produit :
   `recordTransition` (`packages/services/src/missions.ts`). Elle met à jour le
   statut _conditionnellement à l'ancien statut_ (`WHERE status = départ`),
   horodate la colonne correspondante (`submitted_at`, `approved_at`…), écrit
   `mission_status_history` dans la même transaction, et le déclencheur d'audit
   (ADR-004) journalise le reste.

## Conséquences

- **Le test est exhaustif** : `mission.test.ts` génère un cas par paire
  état × événement (8 × 9) et vérifie l'état d'arrivée ou l'erreur
  `TRANSITION_INTERDITE`, plus l'absence de sortie d'un état terminal.
- **Concurrence** : deux validations simultanées ne peuvent pas faire avancer
  deux fois la mission ; la seconde échoue en `conflict`.
- **Les gardes viennent d'autres modules** : `draftValid` (règles de la
  demande), `approvalComplete` (circuit de validation, B2.5) et
  `reconciliationValidated` (B3.10) sont calculées par les services et passées
  à la machine. La machine ne lit pas la base.
- **Points d'entrée spécialisés** : `approve` et `reject` passent par
  `decideMission` (circuit), `close` par `validateReconciliation` ;
  `applyMissionEvent` refuse ces événements.
- **Ajouter un état ou un événement** est une décision de produit : elle modifie
  la table, le test exhaustif, les traductions et cet ADR.

## Alternatives écartées

- **Statut en texte libre mis à jour par chaque écran** : invérifiable, et
  chaque oubli devient une faille d'audit.
- **Bibliothèque de machines à états** (XState) : une dépendance lourde pour une
  table de neuf lignes, et une logique moins lisible par un auditeur.
- **Contraintes en base (déclencheur de transition)** : la règle de droit et les
  gardes métier ne s'expriment pas proprement en SQL ; on garde la règle dans
  `packages/core`, testable sans base.
