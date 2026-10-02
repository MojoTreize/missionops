import { ArrowLeft, Check, ShieldCheck } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { Logo } from "@/components/brand/logo";
import { BandMock } from "@/components/landing/mocks";
import { getT } from "@/lib/i18n/server";

/**
 * Mise en page des écrans non authentifiés (connexion, inscription,
 * réinitialisation). Mobile : une colonne, confortable au pouce (375 px).
 * Ordinateur : formulaire à gauche, panneau de marque vert profond à droite.
 */
export default async function AuthLayout({ children }: { children: ReactNode }) {
  const { t } = await getT();
  return (
    <div className="min-h-dvh bg-paper lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      <main className="flex min-h-dvh flex-col px-5 py-6 sm:px-10 lg:py-8">
        <div className="flex items-center justify-between">
          <Link href="/" className="rounded-md">
            <Logo />
          </Link>
          <Link
            href="/"
            className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-sm text-muted hover:text-ink"
          >
            <ArrowLeft className="size-4" aria-hidden />
            {t("auth.backHome")}
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-[25rem]">{children}</div>
        </div>
        <p className="text-center text-xs text-subtle">{t("app.tagline")}</p>
      </main>

      <aside className="relative isolate hidden overflow-hidden bg-field-950 text-white lg:flex lg:flex-col lg:justify-between lg:p-14">
        <div aria-hidden className="bg-grid absolute inset-0 -z-10 opacity-[0.07]" />
        <div
          aria-hidden
          className="absolute -right-32 -top-32 -z-10 size-[30rem] rounded-full bg-field-400/25 blur-[110px]"
        />
        <div
          aria-hidden
          className="absolute -bottom-40 -left-24 -z-10 size-[26rem] rounded-full bg-ledger/20 blur-[110px]"
        />
        <Logo tone="light" />
        <div className="max-w-lg">
          <p className="font-display text-balance text-4xl font-semibold leading-tight tracking-tight">
            {t("auth.panelTitle")}
          </p>
          <ul className="mt-8 flex flex-col gap-4">
            {(["panelPoint1", "panelPoint2", "panelPoint3"] as const).map((key) => (
              <li key={key} className="flex items-center gap-3 text-field-100/85">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-field-400/25 text-field-100">
                  <Check className="size-3.5" aria-hidden />
                </span>
                {t(`auth.${key}`)}
              </li>
            ))}
          </ul>
          <div className="mt-12 rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            <BandMock t={t} current={4} dark />
          </div>
        </div>
        <p className="flex items-center gap-2 text-sm text-field-100/60">
          <ShieldCheck className="size-4" aria-hidden />
          {t("auth.panelFoot")}
        </p>
      </aside>
    </div>
  );
}
