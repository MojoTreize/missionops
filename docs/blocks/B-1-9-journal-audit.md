# B1.9 — Journal d'audit

## Objectif

Toute modification est tracée sans que le développeur ait à y penser. La trace
est produite par la base de données, pas par le code applicatif : on ne peut pas
l'oublier, et une modification faite directement en SQL est journalisée de la
même façon.

## Contenu

- **Table `audit_log`** (`packages/db/src/schema/audit_log.ts`) : `organisation_id`,
  `table_name`, `row_id`, `action` (`insert`/`update`/`delete`), `actor_id`,
  `ip`, `before_data`/`after_data` en JSONB, `logged_at`. Deux index de lecture
  (par organisation + date, par entité). Aucune clé étrangère : le journal doit
  survivre indépendamment du cycle de vie des lignes qu'il trace.
- **Déclencheur générique `audit_row_change`** (migration `0005_audit_log`) :
  capture `to_jsonb(OLD)` / `to_jsonb(NEW)` selon l'opération et insère une ligne
  d'audit. Posé sur une table métier via `SELECT enable_audit('ma_table');`.
- **Contexte utilisateur** : l'acteur et l'adresse IP sont transmis par la couche
  d'accès `withTenant` via des paramètres de session locaux à la transaction
  (`app.current_actor`, `app.current_ip`), lus par le déclencheur avec
  `NULLIF(current_setting(..., true), '')`.
- **Isolation multi-tenant** : `audit_log` porte `organisation_id` et l'isolation
  `org_isolation` — la lecture du journal reste cloisonnée par organisation
  (l'écran d'audit sera réservé au Directeur pays et à l'Administrateur, droit
  `auditLog:read` déjà présent dans la matrice B1.8).
- **Immutabilité** : déclencheur `audit_log_immutable` (`BEFORE UPDATE OR DELETE`)
  qui lève une exception, plus `REVOKE UPDATE, DELETE ... FROM PUBLIC`. Aucune
  altération possible, même pour le propriétaire de la table.

## Décisions appliquées

- Journalisation par déclencheur de base et non par le code (ADR-004) : la trace
  ne dépend pas de la discipline du développeur ni du chemin d'appel.
- Table append-only : `UPDATE`/`DELETE` interdits par déclencheur _et_ par
  privilèges, défense en profondeur.
- Contexte acteur/IP facultatif : une mutation hors requête applicative (script
  de maintenance, SQL direct) produit tout de même une ligne, sans acteur ni IP.
- `withTenant` reçoit désormais un contexte objet
  `{ organisationId, actorId?, ip? }` plutôt qu'un simple `orgId`, afin de porter
  le contexte d'audit sans multiplier les variantes.

## Tests

- Intégration (Vitest + PGlite) : sur une table de démonstration auditée,
  `INSERT` / `UPDATE` / `DELETE` produisent chacune exactement une ligne correcte
  (action, acteur, IP, organisation, valeurs avant/après). Une insertion faite
  directement en SQL est aussi journalisée (sans acteur ni IP). Toute tentative
  d'`UPDATE` ou de `DELETE` sur `audit_log` échoue.

## Fini quand

Une modification faite directement en SQL est aussi journalisée — vérifié par le
test d'intégration.

## Hors périmètre de ce bloc

L'écran de consultation du journal (phase ultérieure) et l'attachement du
déclencheur aux tables métier réelles (elles n'existent pas encore ; chacune
appellera `enable_audit` lors de sa création).

## Dépend de

B1.7 (isolation multi-tenant).
