-- Journal d'audit en écriture seule (B1.9, ADR-004).
--
-- La table `audit_log` est créée par la migration précédente. Ici on met en
-- place la mécanique qui la remplit et la protège :
--   1. un déclencheur générique `audit_row_change` capturant chaque mutation ;
--   2. une fonction `enable_audit(table)` pour l'attacher à une table métier ;
--   3. l'isolation multi-tenant sur `audit_log` (lecture cloisonnée) ;
--   4. l'immutabilité : aucun UPDATE ni DELETE, même pour le propriétaire.

-- Contexte utilisateur transmis par la couche d'accès (`withTenant`) via des
-- paramètres de session locaux à la transaction, au même titre que
-- `app.current_org`. Ces valeurs sont facultatives : une mutation hors requête
-- applicative (script de maintenance) produit tout de même une ligne d'audit,
-- simplement sans acteur ni IP.

-- 1. Déclencheur générique : une ligne d'audit par mutation.
CREATE OR REPLACE FUNCTION audit_row_change() RETURNS trigger AS $fn$
DECLARE
  v_before jsonb;
  v_after jsonb;
  v_org uuid;
  v_row uuid;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_after := to_jsonb(NEW);
    v_org := (v_after ->> 'organisation_id')::uuid;
    v_row := (v_after ->> 'id')::uuid;
  ELSIF TG_OP = 'UPDATE' THEN
    v_before := to_jsonb(OLD);
    v_after := to_jsonb(NEW);
    v_org := (v_after ->> 'organisation_id')::uuid;
    v_row := (v_after ->> 'id')::uuid;
  ELSE -- DELETE
    v_before := to_jsonb(OLD);
    v_org := (v_before ->> 'organisation_id')::uuid;
    v_row := (v_before ->> 'id')::uuid;
  END IF;

  INSERT INTO audit_log (
    organisation_id, table_name, row_id, action, actor_id, ip, before_data, after_data
  ) VALUES (
    v_org,
    TG_TABLE_NAME,
    v_row,
    lower(TG_OP),
    NULLIF(current_setting('app.current_actor', true), '')::uuid,
    NULLIF(current_setting('app.current_ip', true), ''),
    v_before,
    v_after
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$fn$ LANGUAGE plpgsql;
--> statement-breakpoint

-- 2. Attache le déclencheur d'audit à une table métier. Les futures migrations
--    appellent simplement `SELECT enable_audit('ma_table');`.
CREATE OR REPLACE FUNCTION enable_audit(target regclass) RETURNS void AS $fn$
BEGIN
  EXECUTE format('DROP TRIGGER IF EXISTS audit_trigger ON %s', target);
  EXECUTE format(
    'CREATE TRIGGER audit_trigger AFTER INSERT OR UPDATE OR DELETE ON %s'
    || ' FOR EACH ROW EXECUTE FUNCTION audit_row_change()',
    target
  );
END;
$fn$ LANGUAGE plpgsql;
--> statement-breakpoint

-- 3. Isolation multi-tenant sur le journal : sa lecture reste cloisonnée par
--    organisation (écran d'audit réservé au Directeur pays et à l'Admin). Le
--    déclencheur d'audit n'est jamais posé sur `audit_log` lui-même.
SELECT enable_org_rls('audit_log');
--> statement-breakpoint

-- 4. Immutabilité : aucune modification ni suppression, même pour le
--    propriétaire de la table. Un déclencheur rejette toute tentative — une
--    ligne d'audit modifiée directement en SQL échoue elle aussi.
CREATE OR REPLACE FUNCTION audit_log_prevent_change() RETURNS trigger AS $fn$
BEGIN
  RAISE EXCEPTION 'audit_log est en écriture seule : UPDATE et DELETE sont interdits';
END;
$fn$ LANGUAGE plpgsql;
--> statement-breakpoint

DROP TRIGGER IF EXISTS audit_log_immutable ON audit_log;
--> statement-breakpoint

CREATE TRIGGER audit_log_immutable
  BEFORE UPDATE OR DELETE ON audit_log
  FOR EACH ROW EXECUTE FUNCTION audit_log_prevent_change();
--> statement-breakpoint

-- Défense supplémentaire au niveau des privilèges : on retire explicitement
-- UPDATE et DELETE. Le rôle applicatif ne peut qu'insérer (via le déclencheur)
-- et lire son organisation.
REVOKE UPDATE, DELETE ON audit_log FROM PUBLIC;