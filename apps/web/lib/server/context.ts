import "server-only";

import { redirect } from "next/navigation";

import { ServiceError, type ServiceContext } from "@missionops/services";

import { clientIp } from "@/lib/auth/server";
import { getT } from "@/lib/i18n/server";
import { getActor, type ServerActor } from "@/lib/policy";

/**
 * Pont entre la requête Next.js et les services applicatifs : construit le
 * contexte (organisation, acteur, instant, IP) à partir de la session.
 */
export async function serviceContext(): Promise<ServiceContext & { actorInfo: ServerActor }> {
  const actor = await getActor();
  if (!actor) {
    redirect("/login");
  }
  return {
    organisationId: actor.organisationId,
    actor: { userId: actor.userId, role: actor.role },
    now: new Date(),
    ip: await clientIp(),
    actorInfo: actor,
  };
}

import type { FormState } from "./form-state";

export type { FormState };

/** Traduit une erreur de service en message lisible (clé `errors.<code>`). */
export async function errorState(error: unknown): Promise<FormState> {
  const { t } = await getT();
  if (error instanceof ServiceError) {
    const fields: Record<string, string> = {};
    for (const [field, code] of Object.entries(error.details)) {
      fields[field] = translateError(t, code, "errors.field");
    }
    return { status: "error", message: translateError(t, error.code), fields };
  }
  // Les redirections de Next.js doivent continuer leur chemin.
  throw error;
}

type T = Awaited<ReturnType<typeof getT>>["t"];

export function translateError(
  t: T,
  code: string,
  fallback: "errors.generic" | "errors.field" = "errors.generic",
): string {
  const key = `errors.${code}` as Parameters<T>[0];
  const text = t(key);
  return text === key ? t(fallback) : text;
}
