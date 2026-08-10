import "server-only";

import { and, desc, eq, isNull } from "drizzle-orm";

import { invitations, memberships, organisations, users } from "@missionops/db";

import { hashToken } from "@/lib/auth/tokens";
import { getDb } from "@/lib/db";

import { resolveActiveOrganisationId } from "./active";
import { slugify } from "./slug";

// Durée de validité d'une invitation (7 jours).
export const INVITATION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export interface MembershipView {
  organisationId: string;
  name: string;
  slug: string;
  role: string;
}

export interface CurrentOrganisation {
  id: string;
  name: string;
  slug: string;
  role: string;
}

/** Organisations auxquelles l'utilisateur appartient (actives). */
export async function getMemberships(userId: string): Promise<MembershipView[]> {
  return getDb()
    .select({
      organisationId: organisations.id,
      name: organisations.name,
      slug: organisations.slug,
      role: memberships.role,
    })
    .from(memberships)
    .innerJoin(organisations, eq(memberships.organisationId, organisations.id))
    .where(
      and(
        eq(memberships.userId, userId),
        isNull(memberships.deletedAt),
        isNull(organisations.deletedAt),
      ),
    )
    .orderBy(organisations.name);
}

/**
 * Résout l'organisation active de l'utilisateur (préférence persistée, sinon
 * première appartenance). Renvoie aussi la liste des appartenances.
 */
export async function getActiveContext(userId: string): Promise<{
  active: CurrentOrganisation | null;
  memberships: MembershipView[];
}> {
  const list = await getMemberships(userId);

  const preferredRows = await getDb()
    .select({ preferred: users.currentOrganisationId })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  const preferred = preferredRows[0]?.preferred ?? null;

  const activeId = resolveActiveOrganisationId(
    list.map((m) => m.organisationId),
    preferred,
  );

  const active = activeId ? (list.find((m) => m.organisationId === activeId) ?? null) : null;
  return {
    active: active
      ? { id: active.organisationId, name: active.name, slug: active.slug, role: active.role }
      : null,
    memberships: list,
  };
}

/** Bascule l'organisation active si l'utilisateur en est membre. */
export async function setCurrentOrganisation(
  userId: string,
  organisationId: string,
): Promise<void> {
  const rows = await getDb()
    .select({ id: memberships.id })
    .from(memberships)
    .where(
      and(
        eq(memberships.userId, userId),
        eq(memberships.organisationId, organisationId),
        isNull(memberships.deletedAt),
      ),
    )
    .limit(1);

  if (rows.length === 0) {
    throw new Error("L'utilisateur n'est pas membre de cette organisation.");
  }

  await getDb()
    .update(users)
    .set({ currentOrganisationId: organisationId })
    .where(eq(users.id, userId));
}

/** Génère un slug libre à partir du nom (suffixe numérique si nécessaire). */
async function uniqueSlug(name: string): Promise<string> {
  const base = slugify(name) || "organisation";
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const candidate = attempt === 0 ? base : `${base}-${attempt + 1}`;
    const existing = await getDb()
      .select({ id: organisations.id })
      .from(organisations)
      .where(eq(organisations.slug, candidate))
      .limit(1);
    if (existing.length === 0) {
      return candidate;
    }
  }
  // Extrêmement improbable : repli sur un suffixe temporel.
  return `${base}-${Date.now()}`;
}

/**
 * Crée une organisation, rattache l'utilisateur comme administrateur et en fait
 * son organisation active.
 */
export async function createOrganisation(
  userId: string,
  input: { name: string; country?: string | null },
): Promise<CurrentOrganisation> {
  const db = getDb();
  const slug = await uniqueSlug(input.name);

  const inserted = await db
    .insert(organisations)
    .values({ name: input.name, slug, country: input.country ?? null })
    .returning({ id: organisations.id, name: organisations.name, slug: organisations.slug });
  const org = inserted[0];
  if (!org) {
    throw new Error("Création de l'organisation impossible.");
  }

  await db.insert(memberships).values({ organisationId: org.id, userId, role: "admin" });
  await db.update(users).set({ currentOrganisationId: org.id }).where(eq(users.id, userId));

  return { id: org.id, name: org.name, slug: org.slug, role: "admin" };
}

/** Trouve un utilisateur par e-mail ou le crée (sans mot de passe). */
async function ensureUserByEmail(email: string): Promise<string> {
  const db = getDb();
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (existing[0]) {
    return existing[0].id;
  }
  const created = await db.insert(users).values({ email }).returning({ id: users.id });
  const id = created[0]?.id;
  if (!id) {
    throw new Error("Création de l'utilisateur invité impossible.");
  }
  return id;
}

/** Crée une invitation et renvoie le jeton en clair (pour l'e-mail). */
export async function createInvitation(input: {
  organisationId: string;
  invitedBy: string;
  email: string;
  role: string;
  rawToken: string;
}): Promise<void> {
  await ensureUserByEmail(input.email);
  await getDb()
    .insert(invitations)
    .values({
      organisationId: input.organisationId,
      email: input.email,
      role: input.role,
      tokenHash: hashToken(input.rawToken),
      invitedBy: input.invitedBy,
      expiresAt: new Date(Date.now() + INVITATION_TTL_MS),
    });
}

export interface MemberView {
  userId: string;
  email: string;
  fullName: string | null;
  role: string;
}

/** Membres actifs d'une organisation. */
export async function getMembers(organisationId: string): Promise<MemberView[]> {
  return getDb()
    .select({
      userId: users.id,
      email: users.email,
      fullName: users.fullName,
      role: memberships.role,
    })
    .from(memberships)
    .innerJoin(users, eq(memberships.userId, users.id))
    .where(and(eq(memberships.organisationId, organisationId), isNull(memberships.deletedAt)))
    .orderBy(users.email);
}

export interface PendingInvitation {
  id: string;
  email: string;
  role: string;
  createdAt: Date;
}

/** Invitations en attente (non acceptées) d'une organisation. */
export async function getPendingInvitations(organisationId: string): Promise<PendingInvitation[]> {
  return getDb()
    .select({
      id: invitations.id,
      email: invitations.email,
      role: invitations.role,
      createdAt: invitations.createdAt,
    })
    .from(invitations)
    .where(
      and(
        eq(invitations.organisationId, organisationId),
        isNull(invitations.acceptedAt),
        isNull(invitations.deletedAt),
      ),
    )
    .orderBy(desc(invitations.createdAt));
}

/**
 * Accepte une invitation : vérifie le jeton (valide, non expiré, non accepté) et
 * que l'e-mail correspond à l'utilisateur connecté, crée l'appartenance et fait
 * de l'organisation la nouvelle organisation active. Renvoie l'`id` de
 * l'organisation, ou `null` si l'invitation est invalide.
 */
export async function acceptInvitation(
  rawToken: string,
  userId: string,
  userEmail: string,
): Promise<string | null> {
  const db = getDb();
  const rows = await db
    .select({
      id: invitations.id,
      organisationId: invitations.organisationId,
      email: invitations.email,
      role: invitations.role,
    })
    .from(invitations)
    .where(and(eq(invitations.tokenHash, hashToken(rawToken)), isNull(invitations.acceptedAt)))
    .limit(1);

  const invitation = rows[0];
  if (!invitation || invitation.email !== userEmail) {
    return null;
  }

  await db
    .insert(memberships)
    .values({ organisationId: invitation.organisationId, userId, role: invitation.role })
    .onConflictDoNothing({ target: [memberships.organisationId, memberships.userId] });

  await db
    .update(invitations)
    .set({ acceptedAt: new Date() })
    .where(eq(invitations.id, invitation.id));
  await db
    .update(users)
    .set({ currentOrganisationId: invitation.organisationId })
    .where(eq(users.id, userId));

  return invitation.organisationId;
}
