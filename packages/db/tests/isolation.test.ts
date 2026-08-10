import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { PGlite } from "@electric-sql/pglite";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { withTenant } from "../src/tenant";

/**
 * Test d'isolation multi-tenant (§9.2 du plan) — « le test le plus important du
 * dépôt ». Deux volets :
 *  1. Structurel : toute table métier (hors tables système) porte
 *     `organisation_id` et a la Row Level Security activée, forcée et dotée de la
 *     politique d'isolation. Ajouter une table sans cela fait échouer la CI.
 *  2. Fonctionnel : sous un rôle applicatif non privilégié, une organisation ne
 *     voit jamais les données d'une autre, et ne peut pas en écrire pour elle.
 */

// Tables d'identité / routage, antérieures au choix d'une organisation : elles
// ne sont volontairement pas soumises à l'isolation par `organisation_id`.
const SYSTEM_TABLES = new Set([
  "organisations",
  "users",
  "sessions",
  "auth_tokens",
  "memberships",
  "invitations",
]);

const ORG_A = "11111111-1111-1111-1111-111111111111";
const ORG_B = "22222222-2222-2222-2222-222222222222";

const migrationsFolder = join(dirname(fileURLToPath(import.meta.url)), "..", "migrations");

const client = new PGlite();
const db = drizzle(client);

function rowsOf<T>(result: unknown): T[] {
  return (result as { rows: T[] }).rows;
}

beforeAll(async () => {
  await migrate(db, { migrationsFolder });

  // Table métier de démonstration, protégée via la fonction réutilisable.
  await client.exec(`
    create table demo_widgets (
      id uuid primary key default gen_random_uuid(),
      organisation_id uuid not null,
      label text not null
    );
    select enable_org_rls('demo_widgets');

    -- Rôle applicatif : ni propriétaire des tables ni superutilisateur, donc la
    -- RLS lui est réellement appliquée (contrairement au rôle d'amorçage).
    create role app_tenant nologin;
    grant usage on schema public to app_tenant;
    grant select, insert, update, delete on demo_widgets to app_tenant;
  `);

  // On amorce des données pour chaque organisation, en passant par la couche
  // d'accès. La session bascule sur le rôle applicatif.
  await client.exec("set role app_tenant");
  await withTenant(db, { organisationId: ORG_A }, (tx) =>
    tx.execute(
      sql`insert into demo_widgets (organisation_id, label) values (${ORG_A}, 'widget A')`,
    ),
  );
  await withTenant(db, { organisationId: ORG_B }, (tx) =>
    tx.execute(
      sql`insert into demo_widgets (organisation_id, label) values (${ORG_B}, 'widget B')`,
    ),
  );
  await client.exec("reset role");
});

afterAll(async () => {
  await client.close();
});

describe("garantie structurelle", () => {
  it("chaque table métier porte organisation_id et une RLS d'isolation", async () => {
    const tables = rowsOf<{ tablename: string }>(
      await client.query("select tablename from pg_tables where schemaname = 'public'"),
    ).map((r) => r.tablename);

    const businessTables = tables.filter((t) => !SYSTEM_TABLES.has(t));
    // Au moins la table de démonstration doit être présente et contrôlée.
    expect(businessTables).toContain("demo_widgets");

    for (const table of businessTables) {
      const hasOrgColumn =
        rowsOf(
          await client.query(
            "select 1 from information_schema.columns where table_schema = 'public' and table_name = $1 and column_name = 'organisation_id'",
            [table],
          ),
        ).length === 1;
      expect(hasOrgColumn, `${table} doit avoir organisation_id`).toBe(true);

      const rls = rowsOf<{ relrowsecurity: boolean; relforcerowsecurity: boolean }>(
        await client.query(
          "select relrowsecurity, relforcerowsecurity from pg_class where oid = ($1)::regclass",
          [table],
        ),
      )[0];
      expect(rls?.relrowsecurity, `${table} doit activer la RLS`).toBe(true);
      expect(rls?.relforcerowsecurity, `${table} doit forcer la RLS`).toBe(true);

      const hasPolicy =
        rowsOf(
          await client.query(
            "select 1 from pg_policies where schemaname = 'public' and tablename = $1 and policyname = 'org_isolation'",
            [table],
          ),
        ).length === 1;
      expect(hasPolicy, `${table} doit avoir la politique org_isolation`).toBe(true);
    }
  });
});

describe("garantie fonctionnelle", () => {
  it("chaque organisation ne voit que ses propres lignes", async () => {
    await client.exec("set role app_tenant");
    try {
      const seenByA = await withTenant(db, { organisationId: ORG_A }, (tx) =>
        tx.execute(sql`select organisation_id from demo_widgets`),
      );
      const seenByB = await withTenant(db, { organisationId: ORG_B }, (tx) =>
        tx.execute(sql`select organisation_id from demo_widgets`),
      );

      const orgsA = rowsOf<{ organisation_id: string }>(seenByA).map((r) => r.organisation_id);
      const orgsB = rowsOf<{ organisation_id: string }>(seenByB).map((r) => r.organisation_id);

      expect(orgsA).toEqual([ORG_A]);
      expect(orgsB).toEqual([ORG_B]);
    } finally {
      await client.exec("reset role");
    }
  });

  it("sans contexte d'organisation, aucune ligne n'est visible", async () => {
    await client.exec("set role app_tenant");
    try {
      const res = await db.execute(sql`select count(*)::int as n from demo_widgets`);
      expect(rowsOf<{ n: number }>(res)[0]?.n).toBe(0);
    } finally {
      await client.exec("reset role");
    }
  });

  it("une organisation ne peut pas écrire de ligne pour une autre", async () => {
    await client.exec("set role app_tenant");
    try {
      await expect(
        withTenant(db, { organisationId: ORG_A }, (tx) =>
          tx.execute(
            sql`insert into demo_widgets (organisation_id, label) values (${ORG_B}, 'intrus')`,
          ),
        ),
      ).rejects.toThrow();
    } finally {
      await client.exec("reset role");
    }
  });
});
