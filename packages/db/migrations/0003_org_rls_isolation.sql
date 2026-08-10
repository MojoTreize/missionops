-- Custom SQL migration file, put your code below! --

-- Isolation multi-tenant (B1.7). Défense en profondeur niveau base : chaque
-- table métier active la Row Level Security et n'expose que les lignes de
-- l'organisation courante, lue depuis le paramètre de session `app.current_org`.
--
-- La couche d'accès applicative (`withTenant`, packages/db) ouvre une
-- transaction et positionne ce paramètre avant toute requête. Le rôle
-- applicatif n'est ni propriétaire des tables ni superutilisateur : la RLS lui
-- est donc réellement appliquée.

-- Fonction réutilisable : active l'isolation par organisation sur une table.
-- Les futures migrations de tables métier appellent simplement
-- `SELECT enable_org_rls('ma_table');`.
CREATE OR REPLACE FUNCTION enable_org_rls(target regclass) RETURNS void AS $fn$
BEGIN
  EXECUTE format('ALTER TABLE %s ENABLE ROW LEVEL SECURITY', target);
  -- FORCE : la politique s'applique aussi au propriétaire de la table.
  EXECUTE format('ALTER TABLE %s FORCE ROW LEVEL SECURITY', target);
  EXECUTE format('DROP POLICY IF EXISTS org_isolation ON %s', target);
  EXECUTE format(
    'CREATE POLICY org_isolation ON %s'
    || ' USING (organisation_id = NULLIF(current_setting(''app.current_org'', true), '''')::uuid)'
    || ' WITH CHECK (organisation_id = NULLIF(current_setting(''app.current_org'', true), '''')::uuid)',
    target
  );
END;
$fn$ LANGUAGE plpgsql;