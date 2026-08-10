import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { PGlite } from "@electric-sql/pglite";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { withTenant } from "../src/tenant";

/**
 * Test d'intégration du journal d'audit (B1.9, ADR-004).
 *
 * On monte une table métier de démonstration, on lui attache le déclencheur
 * générique via `enable_audit`, puis on vérifie que :
 *  1. chaque type de mutation (INSERT / UPDATE / DELETE) produit exactement une
 *     ligne d'audit correcte, avec l'acteur et le contexte transmis ;
 *  2. une modification faite directement en SQL est aussi journalisée ;
 *  3. `audit_log` est en écriture seule : UPDATE et DELETE échouent.
 */

const ORG = "11111111-1111-1111-1111-111111111111";
const ACTOR = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";

const migrationsFolder = join(dirname(fileURLToPath(import.meta.url)), "..", "migrations");

const client = new PGlite();
const db = drizzle(client);

function rowsOf<T>(result: unknown): T[] {
  return (result as { rows: T[] }).rows;
}

async function auditRows() {
  // Lecture en superutilisateur (RLS contournée) pour inspecter le journal.
  return rowsOf<{
    table_name: string;
    row_id: string;
    action: string;
    actor_id: string | null;
    ip: string | null;
    organisation_id: string;
    before_data: { label: string } | null;
    after_data: { label: string } | null;
  }>(await client.query("select * from audit_log order by logged_at, action"));
}

beforeAll(async () => {
  await migrate(db, { migrationsFolder });

  await client.exec(`
    create table demo_things (
      id uuid primary key default gen_random_uuid(),
      organisation_id uuid not null,
      label text not null
    );
    select enable_org_rls('demo_things');
    select enable_audit('demo_things');

    -- Rôle applicatif non privilégié : la RLS et les droits lui sont réellement
    -- appliqués. Il peut muter la table métier et lire/insérer l'audit, mais on
    -- ne lui accorde jamais UPDATE/DELETE sur audit_log.
    create role app_tenant nologin;
    grant usage on schema public to app_tenant;
    grant select, insert, update, delete on demo_things to app_tenant;
    grant select, insert on audit_log to app_tenant;
  `);
});

afterAll(async () => {
  await client.close();
});

describe("chaque mutation produit une ligne d'audit", () => {
  const rowId = "dddddddd-dddd-dddd-dddd-dddddddddddd";

  it("INSERT journalise l'action, l'acteur et la valeur après", async () => {
    await client.exec("set role app_tenant");
    try {
      await withTenant(db, { organisationId: ORG, actorId: ACTOR, ip: "10.0.0.9" }, (tx) =>
        tx.execute(
          sql`insert into demo_things (id, organisation_id, label) values (${rowId}, ${ORG}, 'initial')`,
        ),
      );
    } finally {
      await client.exec("reset role");
    }

    const rows = await auditRows();
    expect(rows).toHaveLength(1);
    const entry = rows[0]!;
    expect(entry.table_name).toBe("demo_things");
    expect(entry.row_id).toBe(rowId);
    expect(entry.action).toBe("insert");
    expect(entry.actor_id).toBe(ACTOR);
    expect(entry.ip).toBe("10.0.0.9");
    expect(entry.organisation_id).toBe(ORG);
    expect(entry.before_data).toBeNull();
    expect(entry.after_data?.label).toBe("initial");
  });

  it("UPDATE journalise l'état avant et après", async () => {
    await client.exec("set role app_tenant");
    try {
      await withTenant(db, { organisationId: ORG, actorId: ACTOR }, (tx) =>
        tx.execute(sql`update demo_things set label = 'modifié' where id = ${rowId}`),
      );
    } finally {
      await client.exec("reset role");
    }

    const rows = await auditRows();
    const entry = rows.find((r) => r.action === "update")!;
    expect(entry).toBeDefined();
    expect(entry.before_data?.label).toBe("initial");
    expect(entry.after_data?.label).toBe("modifié");
  });

  it("DELETE journalise l'état avant, sans état après", async () => {
    await client.exec("set role app_tenant");
    try {
      await withTenant(db, { organisationId: ORG, actorId: ACTOR }, (tx) =>
        tx.execute(sql`delete from demo_things where id = ${rowId}`),
      );
    } finally {
      await client.exec("reset role");
    }

    const rows = await auditRows();
    const entry = rows.find((r) => r.action === "delete")!;
    expect(entry).toBeDefined();
    expect(entry.before_data?.label).toBe("modifié");
    expect(entry.after_data).toBeNull();

    // Exactement une ligne par mutation : trois au total.
    expect(rows.filter((r) => r.row_id === rowId)).toHaveLength(3);
  });

  it("une mutation directe en SQL est aussi journalisée", async () => {
    const other = "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee";
    await client.exec(
      `insert into demo_things (id, organisation_id, label) values ('${other}', '${ORG}', 'direct')`,
    );

    const rows = await auditRows();
    const entry = rows.find((r) => r.row_id === other)!;
    expect(entry).toBeDefined();
    expect(entry.action).toBe("insert");
    // Aucune requête applicative : ni acteur ni IP, mais la ligne existe.
    expect(entry.actor_id).toBeNull();
    expect(entry.ip).toBeNull();
    expect(entry.after_data?.label).toBe("direct");
  });
});

describe("audit_log est en écriture seule", () => {
  it("un UPDATE sur audit_log échoue", async () => {
    await expect(client.exec("update audit_log set action = 'falsifié'")).rejects.toThrow(
      /écriture seule/,
    );
  });

  it("un DELETE sur audit_log échoue", async () => {
    await expect(client.exec("delete from audit_log")).rejects.toThrow(/écriture seule/);
  });
});
