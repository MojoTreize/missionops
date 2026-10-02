"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { fieldErrors, formDataToObject, signupInput } from "@missionops/contracts";
import { users } from "@missionops/db";
import { startTrial } from "@missionops/services";

import { hashPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { getT } from "@/lib/i18n/server";
import { createOrganisation } from "@/lib/org/queries";
import { translateError, type FormState } from "@/lib/server/context";

/**
 * Inscription en libre-service (B9.1) : compte, organisation (dont l'auteur
 * devient administrateur) et essai gratuit, sans intervention de notre part.
 */
export async function signupAction(_: FormState, form: FormData): Promise<FormState> {
  const { t } = await getT();
  const parsed = signupInput.safeParse(formDataToObject(form));
  if (!parsed.success) {
    const fields = Object.fromEntries(
      Object.entries(fieldErrors(parsed.error)).map(([k, code]) => [k, translateError(t, code)]),
    );
    return { status: "error", message: translateError(t, "invalid_input"), fields };
  }
  const { email, password, fullName, organisationName } = parsed.data;
  const db = getDb();
  const existing = (await db.select().from(users).where(eq(users.email, email)).limit(1))[0];
  // Un compte existant avec mot de passe doit se connecter ; un compte créé par
  // une invitation (sans mot de passe) peut finaliser son inscription.
  if (existing?.passwordHash) {
    return {
      status: "error",
      message: translateError(t, "email_taken"),
      fields: { email: translateError(t, "email_taken") },
    };
  }
  const passwordHash = await hashPassword(password);
  let userId: string;
  if (existing) {
    await db.update(users).set({ passwordHash, fullName }).where(eq(users.id, existing.id));
    userId = existing.id;
  } else {
    const inserted = await db
      .insert(users)
      .values({ email, fullName, passwordHash })
      .returning({ id: users.id });
    userId = inserted[0]!.id;
  }
  const org = await createOrganisation(userId, { name: organisationName, country: "GN" });
  await startTrial(db, org.id, userId, new Date());
  await createSession(userId);
  redirect("/dashboard");
}
