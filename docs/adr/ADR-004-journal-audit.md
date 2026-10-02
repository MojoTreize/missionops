# ADR-004 — Journal d'audit en écriture seule

- **Statut** : acceptée
- **Bloc** : B1.9 (journal d'audit)
- **Date** : rédigée a posteriori, après fusion de B1.9

## Contexte

Le produit vend de la traçabilité. Un bailleur ou un auditeur doit pouvoir
demander, trois ans plus tard, « qui a modifié ce montant, quand, et quelle était
la valeur avant ». Si la journalisation dépend de la discipline des
développeurs (« penser à appeler `logAudit()` »), elle finira par être oubliée.
Si elle peut être modifiée, elle ne prouve rien.

## Décision

1. **Une table `audit_log` en écriture seule** : organisation, table, ligne,
   action (`insert` / `update` / `delete`), acteur, adresse IP, valeurs avant et
   après en JSONB, horodatage.
2. **Écrite par un déclencheur PostgreSQL**, pas par le code applicatif. La
   fonction générique `audit_row_change()` (migration `0005_audit_log.sql`)
   s'attache à une table par `SELECT enable_audit('ma_table');`. Une
   modification faite directement en SQL, hors application, est donc journalisée
   elle aussi.
3. **Le contexte vient de `withTenant`** : l'acteur et l'IP sont transmis par les
   paramètres de session `app.current_actor` et `app.current_ip`, locaux à la
   transaction. Ils sont facultatifs : un script de maintenance produit une ligne
   d'audit sans acteur, mais en produit une.
4. **Immutabilité garantie deux fois** : un déclencheur `BEFORE UPDATE OR DELETE`
   rejette toute altération, même du propriétaire, et les droits `UPDATE` et
   `DELETE` sont retirés (`REVOKE … FROM PUBLIC`).
5. **Lecture cloisonnée** : `audit_log` est elle-même sous `org_isolation`
   (ADR-001).

## Conséquences

- **Toute nouvelle table métier** appelle `enable_audit('ma_table')` dans sa
  migration, en plus de `enable_org_rls` (ADR-001).
- **Le volume croît sans limite.** Il faudra partitionner par mois et archiver à
  froid (B6.6) avant que la table ne pèse sur les sauvegardes. On n'archive
  jamais en supprimant.
- **Les valeurs complètes sont copiées** : si une table contient un jour une
  donnée sensible (pièce d'identité, coordonnées bancaires), elle se retrouve
  dans le journal. Il faudra alors décider, table par table, de masquer ces
  colonnes dans le déclencheur.
- **Limite connue** : les tables d'identité (`memberships`, `invitations`, …) ne
  portent pas encore le déclencheur. Un changement de rôle n'est donc pas
  journalisé aujourd'hui. À traiter comme une dette prioritaire : une élévation
  de privilège est précisément ce qu'un auditeur cherche.
- **`audit_row_change` journalise aussi `DELETE`**, même si l'application n'en
  émet jamais (ADR-005) : un `DELETE` exécuté à la main laisse une trace.

## Alternatives écartées

- **Journalisation applicative** (appel explicite dans chaque service) :
  oubliable, et aveugle aux modifications faites hors application.
- **Event sourcing complet** : beaucoup plus puissant, mais un changement de
  modèle profond pour un bénéfice que le journal par déclencheur couvre déjà.
- **Service externe de journalisation** : une dépendance de plus, une donnée
  réglementaire hors de la base, et un risque de perte en cas de panne réseau.
