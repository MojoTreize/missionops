import type { Metadata } from "next";

import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: `${t("help.title")} — MissionOps` };
}

const GUIDES = ["request", "approve", "field", "finance", "closure", "install"] as const;

/** Aide et guides par rôle (B9.5). */
export default async function HelpPage() {
  const { t } = await getT();
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      <div>
        <h1 className="text-2xl font-semibold text-ink">{t("help.title")}</h1>
        <p className="text-sm text-muted">{t("help.subtitle")}</p>
      </div>
      {GUIDES.map((g) => (
        <details
          key={g}
          className="rounded-lg border border-border bg-surface p-4"
          open={g === "field"}
        >
          <summary className="cursor-pointer font-semibold">{t(`help.guides.${g}Title`)}</summary>
          <p className="mt-2 text-sm leading-relaxed">{t(`help.guides.${g}Body`)}</p>
        </details>
      ))}
      <p className="text-sm text-muted">{t("help.contact")}</p>
    </div>
  );
}
