import {
  ArrowRight,
  BadgeCheck,
  Building2,
  Check,
  ChevronDown,
  CloudOff,
  Coins,
  Database,
  FileCheck2,
  Fingerprint,
  Globe2,
  HandCoins,
  HeartHandshake,
  History,
  KeyRound,
  Landmark,
  LineChart,
  Menu,
  ShieldCheck,
  Smartphone,
  Workflow,
} from "lucide-react";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import type { ReactNode } from "react";

import { Logo } from "@/components/brand/logo";
import { BandMock, DashboardMock, HeroMock, LOOP_STEPS } from "@/components/landing/mocks";
import { SESSION_COOKIE_NAME } from "@/lib/auth/config";
import { cn } from "@/lib/cn";
import { getT } from "@/lib/i18n/server";
import type { Translator } from "@/lib/i18n/translate";

import { setLandingLocaleAction } from "./landing-actions";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return {
    title: t("landing.meta.title"),
    description: t("landing.meta.description"),
    openGraph: { title: t("landing.meta.title"), description: t("landing.meta.description") },
  };
}

const NAV = [
  { href: "#produit", key: "product" },
  { href: "#boucle", key: "loop" },
  { href: "#publics", key: "audiences" },
  { href: "#securite", key: "security" },
  { href: "#tarifs", key: "pricing" },
  { href: "#faq", key: "faq" },
] as const;

const LOOP_ICONS = {
  request: Workflow,
  approval: BadgeCheck,
  advance: HandCoins,
  field: Smartphone,
  reconciliation: Coins,
  closure: FileCheck2,
} as const;

const FEATURES = [
  { key: "offline", icon: CloudOff },
  { key: "currencies", icon: Coins },
  { key: "closure", icon: FileCheck2 },
  { key: "approvals", icon: BadgeCheck },
  { key: "budget", icon: LineChart },
  { key: "audit", icon: History },
] as const;

const AUDIENCES = [
  { key: "ngo", icon: HeartHandshake },
  { key: "embassy", icon: Landmark },
  { key: "company", icon: Building2 },
] as const;

const SECURITY = [
  { key: "hosting", icon: Globe2 },
  { key: "isolation", icon: Database },
  { key: "roles", icon: KeyRound },
  { key: "integrity", icon: Fingerprint },
] as const;

const PLANS = [
  { key: "trial", href: "/signup", featured: false },
  { key: "essential", href: "mailto:contact@missionops.app", featured: true },
  { key: "organisation", href: "mailto:contact@missionops.app", featured: false },
] as const;

const FAQ = ["1", "2", "3", "4", "5"] as const;

function SectionHeading({
  eyebrow,
  title,
  subtitle,
  dark = false,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  dark?: boolean;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p
        className={cn(
          "text-sm font-semibold uppercase tracking-[0.12em]",
          dark ? "text-field-200" : "text-field",
        )}
      >
        {eyebrow}
      </p>
      <h2
        className={cn(
          "font-display text-balance mt-3 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl",
          dark ? "text-white" : "text-ink",
        )}
      >
        {title}
      </h2>
      {subtitle ? (
        <p
          className={cn(
            "text-balance mt-4 text-base sm:text-lg",
            dark ? "text-field-100/75" : "text-muted",
          )}
        >
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}

function CtaLink({
  href,
  children,
  variant = "primary",
  className,
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "light" | "ghostDark" | "outline";
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 text-[0.95rem] font-semibold transition-colors",
        variant === "primary" && "bg-ledger text-white shadow-sm hover:bg-ledger-hover",
        variant === "light" && "bg-white text-field-950 shadow-sm hover:bg-field-50",
        variant === "ghostDark" && "border border-white/20 text-white hover:bg-white/10",
        variant === "outline" && "border border-border-strong bg-surface text-ink hover:bg-paper",
        className,
      )}
    >
      {children}
    </Link>
  );
}

function LanguageToggle({
  t,
  locale,
  className,
}: {
  t: Translator;
  locale: string;
  className?: string;
}) {
  return (
    <form action={setLandingLocaleAction} className={className}>
      <input type="hidden" name="locale" value={locale === "fr" ? "en" : "fr"} />
      <button
        type="submit"
        aria-label={t("landing.nav.languageLabel")}
        className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-field-100/80 transition-colors hover:bg-white/10 hover:text-white"
      >
        <Globe2 className="size-4" aria-hidden />
        {t("landing.nav.language")}
      </button>
    </form>
  );
}

/**
 * Page d'accueil publique. Composant serveur, sans JavaScript client : le
 * menu mobile et la FAQ reposent sur `<details>`, la langue sur un formulaire.
 * Une personne déjà connectée retrouve un accès direct à l'application.
 */
export default async function LandingPage() {
  const { t, locale } = await getT();
  const signedIn = (await cookies()).has(SESSION_COOKIE_NAME);

  return (
    <div className="min-h-dvh bg-paper text-ink">
      <a
        href="#contenu"
        className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:rounded-md focus:bg-field focus:px-3 focus:py-2 focus:text-field-fg"
      >
        {t("shell.skipToContent")}
      </a>

      {/* ------------------------------------------------------------ Héros */}
      <div className="relative isolate overflow-hidden bg-field-950 text-white">
        <div aria-hidden className="bg-grid absolute inset-0 -z-10 opacity-[0.07]" />
        <div
          aria-hidden
          className="absolute -top-40 right-[-10%] -z-10 size-[38rem] rounded-full bg-field-400/25 blur-[120px]"
        />
        <div
          aria-hidden
          className="absolute bottom-[-12rem] left-[-8rem] -z-10 size-[28rem] rounded-full bg-ledger/20 blur-[120px]"
        />

        <header className="mx-auto flex h-18 max-w-7xl items-center gap-4 px-5 py-4 sm:px-8">
          <Link href="/" className="rounded-md">
            <Logo tone="light" />
          </Link>
          <nav
            aria-label={t("landing.nav.menu")}
            className="ml-8 hidden items-center gap-1 xl:flex"
          >
            {NAV.map((item) => (
              <a
                key={item.key}
                href={item.href}
                className="rounded-lg px-3 py-2 text-sm font-medium text-field-100/75 transition-colors hover:bg-white/5 hover:text-white"
              >
                {t(`landing.nav.${item.key}`)}
              </a>
            ))}
          </nav>
          <div className="ml-auto hidden items-center gap-1.5 md:flex">
            <LanguageToggle t={t} locale={locale} />
            {signedIn ? (
              <CtaLink href="/dashboard" variant="light" className="ml-2 min-h-10 px-4 text-sm">
                {t("landing.nav.openApp")}
                <ArrowRight className="size-4" aria-hidden />
              </CtaLink>
            ) : (
              <>
                <Link
                  href="/login"
                  className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-white hover:bg-white/10"
                >
                  {t("landing.nav.login")}
                </Link>
                <CtaLink href="/signup" variant="light" className="ml-1 min-h-10 px-4 text-sm">
                  {t("landing.nav.start")}
                </CtaLink>
              </>
            )}
          </div>
          {/* Menu mobile sans JavaScript */}
          <details className="group relative ml-auto md:hidden">
            <summary
              aria-label={t("landing.nav.menu")}
              className="flex size-11 cursor-pointer list-none items-center justify-center rounded-lg text-white hover:bg-white/10 [&::-webkit-details-marker]:hidden"
            >
              <Menu className="size-5" aria-hidden />
            </summary>
            <div className="absolute right-0 top-13 z-40 w-[min(20rem,calc(100vw-2.5rem))] rounded-2xl border border-white/10 bg-field-900 p-2 shadow-lg">
              {NAV.map((item) => (
                <a
                  key={item.key}
                  href={item.href}
                  className="flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-field-100 hover:bg-white/10"
                >
                  {t(`landing.nav.${item.key}`)}
                </a>
              ))}
              <div className="my-2 border-t border-white/10" />
              <LanguageToggle t={t} locale={locale} />
              <div className="mt-2 grid gap-2 p-1">
                {signedIn ? (
                  <CtaLink href="/dashboard" variant="light">
                    {t("landing.nav.openApp")}
                  </CtaLink>
                ) : (
                  <>
                    <CtaLink href="/signup" variant="light">
                      {t("landing.nav.start")}
                    </CtaLink>
                    <CtaLink href="/login" variant="ghostDark">
                      {t("landing.nav.login")}
                    </CtaLink>
                  </>
                )}
              </div>
            </div>
          </details>
        </header>

        <section
          id="contenu"
          className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-14 px-5 pb-24 pt-10 sm:px-8 sm:pb-52 sm:pt-16 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-12 lg:pb-48 lg:pt-20"
        >
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-field-100 sm:text-sm">
              <span className="size-1.5 rounded-full bg-field-400" aria-hidden />
              {t("landing.hero.badge")}
            </p>
            <h1 className="font-display text-balance mt-6 text-[2.5rem] font-semibold leading-[1.08] tracking-tight sm:text-5xl lg:text-[3.6rem]">
              {t("landing.hero.title")}
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-field-100/80 sm:text-lg">
              {t("landing.hero.subtitle")}
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <CtaLink href={signedIn ? "/dashboard" : "/signup"}>
                {signedIn ? t("landing.nav.openApp") : t("landing.hero.primary")}
                <ArrowRight className="size-4" aria-hidden />
              </CtaLink>
              {signedIn ? null : (
                <CtaLink href="/login" variant="ghostDark">
                  {t("landing.hero.secondary")}
                </CtaLink>
              )}
            </div>
            <p className="mt-5 text-sm text-field-100/60">{t("landing.hero.note")}</p>
          </div>
          <HeroMock t={t} locale={locale} />
        </section>
      </div>

      {/* ------------------------------------------------------- Preuves */}
      <section aria-label={t("landing.nav.product")} className="border-b border-border bg-surface">
        <dl className="mx-auto grid max-w-7xl grid-cols-2 divide-border px-5 sm:px-8 lg:grid-cols-4 lg:divide-x">
          {(
            [
              ["offline", "offlineHint"],
              ["currencies", "currenciesHint"],
              ["audit", "auditHint"],
              ["mobile", "mobileHint"],
            ] as const
          ).map(([value, hint]) => (
            <div key={value} className="px-2 py-7 text-center lg:px-6">
              <dt className="tabular text-lg font-semibold text-ink sm:text-xl">
                {t(`landing.proof.${value}`)}
              </dt>
              <dd className="mt-1 text-sm text-muted">{t(`landing.proof.${hint}`)}</dd>
            </div>
          ))}
        </dl>
      </section>

      <main>
        {/* ------------------------------------------------------- Boucle */}
        <section id="boucle" className="scroll-mt-6 px-5 py-20 sm:px-8 sm:py-28">
          <SectionHeading
            eyebrow={t("landing.loop.eyebrow")}
            title={t("landing.loop.title")}
            subtitle={t("landing.loop.subtitle")}
          />
          <div className="mx-auto mt-14 max-w-6xl">
            <div className="mx-auto mb-10 max-w-3xl rounded-2xl border border-border bg-surface p-5 shadow-xs">
              <BandMock t={t} current={5} />
            </div>
            <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {LOOP_STEPS.map((step, index) => {
                const Icon = LOOP_ICONS[step];
                return (
                  <li
                    key={step}
                    className="relative rounded-2xl border border-border bg-surface p-6 shadow-xs transition-shadow hover:shadow-md"
                  >
                    <div className="flex items-center justify-between">
                      <span className="flex size-11 items-center justify-center rounded-xl bg-field-softer text-field">
                        <Icon className="size-5" aria-hidden />
                      </span>
                      <span className="tabular font-display text-3xl font-semibold text-field-400">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                    </div>
                    <h3 className="mt-5 text-lg font-semibold">
                      {t(`landing.loop.${step}.title`)}
                    </h3>
                    <p className="mt-2 text-[0.95rem] leading-relaxed text-muted">
                      {t(`landing.loop.${step}.text`)}
                    </p>
                  </li>
                );
              })}
            </ol>
          </div>
        </section>

        {/* ------------------------------------------------ Fonctionnalités */}
        <section
          id="produit"
          className="scroll-mt-6 border-y border-border bg-surface px-5 py-20 sm:px-8 sm:py-28"
        >
          <SectionHeading
            eyebrow={t("landing.features.eyebrow")}
            title={t("landing.features.title")}
            subtitle={t("landing.features.subtitle")}
          />
          <div className="mx-auto mt-14 grid max-w-6xl gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ key, icon: Icon }) => (
              <div key={key}>
                <span
                  className={cn(
                    "flex size-11 items-center justify-center rounded-xl",
                    key === "currencies" ? "bg-ledger-soft text-ledger" : "bg-field text-white",
                  )}
                >
                  <Icon className="size-5" aria-hidden />
                </span>
                <h3 className="mt-5 text-lg font-semibold">{t(`landing.features.${key}.title`)}</h3>
                <p className="mt-2 text-[0.95rem] leading-relaxed text-muted">
                  {t(`landing.features.${key}.text`)}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ---------------------------------------------- Bureau et terrain */}
        <section className="px-5 py-20 sm:px-8 sm:py-28">
          <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.12em] text-field">
                {t("landing.showcase.eyebrow")}
              </p>
              <h2 className="font-display text-balance mt-3 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
                {t("landing.showcase.title")}
              </h2>
              <ul className="mt-8 flex flex-col gap-5">
                {(["point1", "point2", "point3"] as const).map((point) => (
                  <li key={point} className="flex gap-3">
                    <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-field text-white">
                      <Check className="size-3.5" aria-hidden />
                    </span>
                    <span className="text-[0.95rem] leading-relaxed text-ink-soft sm:text-base">
                      {t(`landing.showcase.${point}`)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <DashboardMock t={t} locale={locale} />
          </div>
        </section>

        {/* ------------------------------------------------------- Publics */}
        <section
          id="publics"
          className="scroll-mt-6 border-y border-border bg-surface-2 px-5 py-20 sm:px-8 sm:py-28"
        >
          <SectionHeading
            eyebrow={t("landing.audiences.eyebrow")}
            title={t("landing.audiences.title")}
          />
          <div className="mx-auto mt-14 grid max-w-6xl gap-5 md:grid-cols-3">
            {AUDIENCES.map(({ key, icon: Icon }) => (
              <div
                key={key}
                className="group rounded-2xl border border-border bg-surface p-7 shadow-xs transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <span className="flex size-12 items-center justify-center rounded-2xl bg-field-softer text-field transition-colors group-hover:bg-field group-hover:text-white">
                  <Icon className="size-6" aria-hidden />
                </span>
                <h3 className="mt-6 text-xl font-semibold">
                  {t(`landing.audiences.${key}.title`)}
                </h3>
                <p className="mt-3 text-[0.95rem] leading-relaxed text-muted">
                  {t(`landing.audiences.${key}.text`)}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ------------------------------------------------------ Sécurité */}
        <section
          id="securite"
          className="relative isolate scroll-mt-6 overflow-hidden bg-field-950 px-5 py-20 text-white sm:px-8 sm:py-28"
        >
          <div aria-hidden className="bg-grid absolute inset-0 -z-10 opacity-[0.06]" />
          <SectionHeading
            dark
            eyebrow={t("landing.security.eyebrow")}
            title={t("landing.security.title")}
            subtitle={t("landing.security.subtitle")}
          />
          <div className="mx-auto mt-14 grid max-w-6xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {SECURITY.map(({ key, icon: Icon }) => (
              <div key={key} className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
                <Icon className="size-6 text-field-200" aria-hidden />
                <h3 className="mt-5 font-semibold">{t(`landing.security.${key}.title`)}</h3>
                <p className="mt-2 text-sm leading-relaxed text-field-100/70">
                  {t(`landing.security.${key}.text`)}
                </p>
              </div>
            ))}
          </div>
          <div className="mx-auto mt-10 flex max-w-6xl items-center justify-center gap-2 text-sm text-field-100/60">
            <ShieldCheck className="size-4" aria-hidden />
            {t("landing.footer.hosted")}
          </div>
        </section>

        {/* -------------------------------------------------------- Tarifs */}
        <section id="tarifs" className="scroll-mt-6 px-5 py-20 sm:px-8 sm:py-28">
          <SectionHeading
            eyebrow={t("landing.pricing.eyebrow")}
            title={t("landing.pricing.title")}
            subtitle={t("landing.pricing.subtitle")}
          />
          <div className="mx-auto mt-14 grid max-w-6xl gap-5 lg:grid-cols-3">
            {PLANS.map(({ key, href, featured }) => (
              <div
                key={key}
                className={cn(
                  "relative flex flex-col rounded-2xl border p-7",
                  featured
                    ? "border-field bg-field-950 text-white shadow-lg"
                    : "border-border bg-surface shadow-xs",
                )}
              >
                {featured ? (
                  <span className="absolute -top-3 left-7 rounded-full bg-ledger px-3 py-1 text-xs font-semibold text-white">
                    {t("landing.pricing.popular")}
                  </span>
                ) : null}
                <h3
                  className={cn("text-lg font-semibold", featured ? "text-field-100" : "text-ink")}
                >
                  {t(`landing.pricing.${key}.name`)}
                </h3>
                <p className="mt-4 flex items-baseline gap-2">
                  <span className="font-display text-4xl font-semibold tracking-tight">
                    {t(`landing.pricing.${key}.price`)}
                  </span>
                  <span className={cn("text-sm", featured ? "text-field-100/70" : "text-muted")}>
                    {t(`landing.pricing.${key}.period`)}
                  </span>
                </p>
                <p
                  className={cn(
                    "mt-3 text-[0.95rem]",
                    featured ? "text-field-100/80" : "text-muted",
                  )}
                >
                  {t(`landing.pricing.${key}.text`)}
                </p>
                <ul className="mt-6 flex flex-1 flex-col gap-3 text-[0.95rem]">
                  {(["f1", "f2", "f3"] as const).map((f) => (
                    <li key={f} className="flex gap-2.5">
                      <Check
                        className={cn(
                          "mt-0.5 size-4 shrink-0",
                          featured ? "text-field-200" : "text-field",
                        )}
                        aria-hidden
                      />
                      {t(`landing.pricing.${key}.${f}`)}
                    </li>
                  ))}
                </ul>
                <CtaLink
                  href={href}
                  variant={featured ? "primary" : "outline"}
                  className="mt-8 w-full"
                >
                  {t(`landing.pricing.${key}.cta`)}
                </CtaLink>
              </div>
            ))}
          </div>
        </section>

        {/* ----------------------------------------------------------- FAQ */}
        <section
          id="faq"
          className="scroll-mt-6 border-t border-border bg-surface px-5 py-20 sm:px-8 sm:py-28"
        >
          <SectionHeading eyebrow={t("landing.faq.eyebrow")} title={t("landing.faq.title")} />
          <div className="mx-auto mt-12 max-w-3xl divide-y divide-border rounded-2xl border border-border bg-surface">
            {FAQ.map((n) => (
              <details key={n} className="group px-5 sm:px-6">
                <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-4 text-left font-semibold [&::-webkit-details-marker]:hidden">
                  {t(`landing.faq.q${n}`)}
                  <ChevronDown
                    className="size-5 shrink-0 text-muted transition-transform group-open:rotate-180"
                    aria-hidden
                  />
                </summary>
                <p className="pb-5 text-[0.95rem] leading-relaxed text-muted">
                  {t(`landing.faq.a${n}`)}
                </p>
              </details>
            ))}
          </div>
        </section>

        {/* ------------------------------------------------- Appel final */}
        <section className="px-5 py-20 sm:px-8 sm:py-24">
          <div className="relative isolate mx-auto max-w-6xl overflow-hidden rounded-3xl bg-field px-6 py-14 text-center text-white sm:px-12 sm:py-20">
            <div aria-hidden className="bg-grid absolute inset-0 -z-10 opacity-10" />
            <div
              aria-hidden
              className="absolute -right-24 -top-24 -z-10 size-80 rounded-full bg-ledger/30 blur-[90px]"
            />
            <h2 className="font-display text-balance mx-auto max-w-3xl text-3xl font-semibold leading-tight tracking-tight sm:text-[2.6rem]">
              {t("landing.cta.title")}
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base text-field-50/85 sm:text-lg">
              {t("landing.cta.subtitle")}
            </p>
            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <CtaLink href={signedIn ? "/dashboard" : "/signup"} variant="light">
                {signedIn ? t("landing.nav.openApp") : t("landing.cta.primary")}
                <ArrowRight className="size-4" aria-hidden />
              </CtaLink>
              {signedIn ? null : (
                <CtaLink href="/login" variant="ghostDark">
                  {t("landing.cta.secondary")}
                </CtaLink>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* -------------------------------------------------------- Pied */}
      <footer className="border-t border-border bg-surface">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:px-8 md:grid-cols-[2fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-sm text-sm text-muted">{t("landing.footer.tagline")}</p>
          </div>
          <div>
            <h2 className="text-sm font-semibold">{t("landing.footer.product")}</h2>
            <ul className="mt-4 flex flex-col gap-2.5 text-sm text-muted">
              {NAV.slice(0, 5).map((item) => (
                <li key={item.key}>
                  <a href={item.href} className="hover:text-ink">
                    {t(`landing.nav.${item.key}`)}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-sm font-semibold">{t("landing.footer.company")}</h2>
            <ul className="mt-4 flex flex-col gap-2.5 text-sm text-muted">
              <li>
                <Link href="/help" className="hover:text-ink">
                  {t("landing.footer.help")}
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-ink">
                  {t("landing.nav.login")}
                </Link>
              </li>
              <li>
                <a href={`mailto:${t("landing.footer.contactEmail")}`} className="hover:text-ink">
                  {t("landing.footer.contactEmail")}
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border">
          <div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-6 text-xs text-subtle sm:flex-row sm:items-center sm:justify-between sm:px-8">
            <p>{t("landing.footer.rights")}</p>
            <p className="flex items-center gap-1.5">
              <ShieldCheck className="size-3.5" aria-hidden />
              {t("landing.footer.hosted")}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
