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
        <h1 className="text-[1.65rem] font-semibold leading-tight tracking-tight text-ink sm:text-3xl">
          {t("help.title")}
        </h1>
        <p className="mt-1.5 text-[0.95rem] text-muted">{t("help.subtitle")}</p>
      </div>
      {GUIDES.map((g) => (
        <details
          key={g}
          className="rounded-xl border border-border bg-surface shadow-xs p-4"
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
