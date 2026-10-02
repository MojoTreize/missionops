import { isCurrency, isRole, type Currency, type Role } from "@missionops/core";
import { memberships, organisations, users, type Db } from "@missionops/db";
import { and, eq, isNull } from "drizzle-orm";

import { ServiceError } from "./context";

/** Paramètres typés d'une organisation (colonne `settings`, B9.2). */
export interface OrganisationSettings {
  /** Plancher d'écart à justifier, en unités mineures de la devise de base. */
  varianceFloorMinor: bigint;
  documentHeader: string | null;
  documentFooter: string | null;
  /** Libellés des signatures de l'ordre de mission, séparés par « ; ». */
  signatureLabels: string[];
}

export interface OrganisationView {
  id: string;
  name: string;
  slug: string;
  baseCurrency: Currency;
  timezone: string;
  settings: OrganisationSettings;
}

const DEFAULT_SIGNATURES = ["Le demandeur", "Le responsable hiérarchique", "La direction"];

export function readSettings(raw: unknown): OrganisationSettings {
  const value = (raw ?? {}) as Record<string, unknown>;
  const floor = typeof value.varianceFloorMinor === "string" ? value.varianceFloorMinor : "50000";
  const labels =
    typeof value.signatureLabels === "string" && value.signatureLabels.trim()
      ? value.signatureLabels
          .split(";")
          .map((s) => s.trim())
          .filter(Boolean)
      : DEFAULT_SIGNATURES;
  return {
    varianceFloorMinor: /^\d+$/.test(floor) ? BigInt(floor) : 50_000n,
    documentHeader: typeof value.documentHeader === "string" ? value.documentHeader : null,
    documentFooter: typeof value.documentFooter === "string" ? value.documentFooter : null,
    signatureLabels: labels,
  };
}

export async function getOrganisation(db: Db, organisationId: string): Promise<OrganisationView> {
  const rows = await db
    .select()
    .from(organisations)
    .where(and(eq(organisations.id, organisationId), isNull(organisations.deletedAt)))
    .limit(1);
  const org = rows[0];
  if (!org) throw new ServiceError("not_found");
  return {
    id: org.id,
    name: org.name,
    slug: org.slug,
    baseCurrency: isCurrency(org.baseCurrency) ? org.baseCurrency : "GNF",
    timezone: org.timezone,
    settings: readSettings(org.settings),
  };
}

export interface MemberSummary {
  userId: string;
  email: string;
  fullName: string | null;
  role: Role;
  locale: string;
}

/** Membres actifs de l'organisation, éventuellement filtrés par rôle. */
export async function listMembers(
  db: Db,
  organisationId: string,
  role?: Role,
): Promise<MemberSummary[]> {
  const rows = await db
    .select({
      userId: users.id,
      email: users.email,
      fullName: users.fullName,
      role: memberships.role,
      locale: users.locale,
    })
    .from(memberships)
    .innerJoin(users, eq(memberships.userId, users.id))
    .where(
      and(
        eq(memberships.organisationId, organisationId),
        isNull(memberships.deletedAt),
        isNull(users.deletedAt),
        role ? eq(memberships.role, role) : undefined,
      ),
    )
    .orderBy(users.email);
  return rows.map((r) => ({ ...r, role: isRole(r.role) ? r.role : "collaborateur" }));
}

export function displayName(member: { fullName: string | null; email: string }): string {
  return member.fullName ?? member.email;
}
