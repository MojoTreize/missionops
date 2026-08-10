import type { Metadata } from "next";

import { getT } from "@/lib/i18n/server";

import { LanguageForm } from "./language-form";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: `${t("meta.profile")} — MissionOps` };
}

/**
 * Profil de l'utilisateur (B1.11). Point d'entrée des préférences ; à ce stade,
 * le choix de la langue de l'interface.
 */
export default async function ProfilePage() {
  const { t } = await getT();
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8">
      <h1 className="text-xl font-semibold text-field">{t("profile.title")}</h1>

      <section className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-sm font-semibold text-field">{t("profile.languageTitle")}</h2>
          <p className="text-sm text-muted">{t("profile.languageDescription")}</p>
        </div>
        <LanguageForm />
      </section>
    </div>
  );
}
