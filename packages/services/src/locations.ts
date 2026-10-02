import { orgLocationInput } from "@missionops/contracts";
import {
  SEARCHABLE_NATIONAL,
  displayPath,
  getNationalLocation,
  normalizeSearch,
  validateOrgLocation,
  type SearchableLocation,
} from "@missionops/core";
import { locations, type Db } from "@missionops/db";
import { and, asc, eq, isNull } from "drizzle-orm";

import { ServiceError, authorize, parse, tenant, type ServiceContext } from "./context";

/** Lieux d'organisation (B2.1). Le référentiel national est dans le domaine. */
export interface OrgLocationView {
  id: string;
  name: string;
  parentCode: string;
  parentLabel: string;
  kind: string;
}

export async function listOrgLocations(db: Db, ctx: ServiceContext): Promise<OrgLocationView[]> {
  authorize(ctx, "read", "location");
  return tenant(db, ctx, async (tx) => {
    const rows = await tx
      .select()
      .from(locations)
      .where(isNull(locations.deletedAt))
      .orderBy(asc(locations.name));
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      parentCode: r.parentCode,
      parentLabel: displayPath(r.parentCode),
      kind: r.kind,
    }));
  });
}

/** Lieux cherchables : référentiel national + lieux de l'organisation. */
export async function searchableLocations(
  db: Db,
  ctx: ServiceContext,
): Promise<(SearchableLocation & { path: string })[]> {
  const own = await listOrgLocations(db, ctx);
  return [
    ...SEARCHABLE_NATIONAL.map((l) => ({ ...l, path: displayPath(l.id) })),
    ...own.map((l) => ({
      id: l.id,
      name: l.name,
      level: "organisation" as const,
      path: `${l.name} · ${getNationalLocation(l.parentCode)?.name ?? l.parentCode}`,
    })),
  ];
}

export async function createOrgLocation(
  db: Db,
  ctx: ServiceContext,
  input: unknown,
): Promise<OrgLocationView> {
  authorize(ctx, "create", "location");
  const value = parse(orgLocationInput, input);
  return tenant(db, ctx, async (tx) => {
    const existing = await tx
      .select({ normalizedName: locations.normalizedName, parentCode: locations.parentCode })
      .from(locations)
      .where(and(eq(locations.parentCode, value.parentCode), isNull(locations.deletedAt)));
    const issue = validateOrgLocation(value, existing);
    if (issue) throw new ServiceError(issue);
    const inserted = await tx
      .insert(locations)
      .values({
        organisationId: ctx.organisationId,
        createdBy: ctx.actor.userId,
        name: value.name,
        normalizedName: normalizeSearch(value.name),
        parentCode: value.parentCode,
        kind: value.kind,
      })
      .returning();
    const row = inserted[0]!;
    return {
      id: row.id,
      name: row.name,
      parentCode: row.parentCode,
      parentLabel: displayPath(row.parentCode),
      kind: row.kind,
    };
  });
}

/** Retire un lieu (suppression logique, ADR-005). */
export async function removeOrgLocation(db: Db, ctx: ServiceContext, id: string): Promise<void> {
  authorize(ctx, "delete", "location");
  await tenant(db, ctx, async (tx) => {
    const updated = await tx
      .update(locations)
      .set({ deletedAt: ctx.now, updatedBy: ctx.actor.userId, updatedAt: ctx.now })
      .where(and(eq(locations.id, id), isNull(locations.deletedAt)))
      .returning({ id: locations.id });
    if (updated.length === 0) throw new ServiceError("not_found");
  });
}

/** Libellé d'une destination (code national ou lieu d'organisation). */
export async function destinationLabel(
  tx: Db,
  destination: { destinationCode: string | null; destinationLocationId: string | null },
): Promise<string> {
  if (destination.destinationLocationId) {
    const rows = await tx
      .select({ name: locations.name, parentCode: locations.parentCode })
      .from(locations)
      .where(eq(locations.id, destination.destinationLocationId))
      .limit(1);
    const row = rows[0];
    if (row) return `${row.name} · ${getNationalLocation(row.parentCode)?.name ?? ""}`;
  }
  return destination.destinationCode ? displayPath(destination.destinationCode) : "—";
}
