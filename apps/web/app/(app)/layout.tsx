import { Bell, LogOut } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { can, isRole } from "@missionops/core";
import { getSubscription, unreadCount } from "@missionops/services";

import { Logo } from "@/components/brand/logo";
import { AccountMenu } from "@/components/shell/account-menu";
import { BottomNav } from "@/components/shell/bottom-nav";
import { Breadcrumbs } from "@/components/shell/breadcrumbs";
import { GlobalSearch } from "@/components/shell/global-search";
import { SidebarNav } from "@/components/shell/sidebar-nav";
import { isPlatformAdmin } from "@/lib/admin";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getDb } from "@/lib/db";
import { getT } from "@/lib/i18n/server";
import { SECONDARY_ITEMS } from "@/lib/nav";
import { getActiveContext } from "@/lib/org/queries";

import { logoutAction } from "../(auth)/actions";
import { OrgSwitcher } from "./organizations/org-switcher";

function initials(name: string): string {
  const parts = name
    .replace(/@.*/, "")
    .split(/[\s._-]+/)
    .filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

/**
 * Coque de l'espace authentifié (B1.10, refonte visuelle).
 *
 * Garde serveur d'abord : sans session valide, on redirige vers la connexion.
 * Ordinateur : barre latérale vert profond (marque, organisation, navigation
 * groupée, carte utilisateur) et en-tête clair (fil d'Ariane, recherche,
 * notifications). Mobile : en-tête compact et barre d'onglets basse. Les deux
 * s'appuient sur la même configuration de navigation (`lib/nav`).
 */
export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const { active, memberships } = await getActiveContext(user.id);
  const role = active && isRole(active.role) ? active.role : "collaborateur";
  const secondary = SECONDARY_ITEMS.filter((item) =>
    item.href === "/admin"
      ? isPlatformAdmin(user.email)
      : !item.permission ||
        (active ? can({ role }, item.permission[0], item.permission[1]) : false),
  ).map((item) => item.href);
  const userName = user.fullName ?? user.email;
  const { t } = await getT();
  const ctx = active
    ? { organisationId: active.id, actor: { userId: user.id, role }, now: new Date() }
    : null;
  const [subscription, unread] = ctx
    ? await Promise.all([
        getSubscription(getDb(), ctx).catch(() => null),
        unreadCount(getDb(), ctx).catch(() => 0),
      ])
    : [null, 0];

  const bell = (
    <Link
      href="/notifications"
      aria-label={t("shell.notifications")}
      className="relative flex size-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-ink/5 hover:text-ink"
    >
      <Bell className="size-[1.15rem]" aria-hidden />
      {unread > 0 ? (
        <span className="tabular absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-ledger px-1 text-[0.6rem] font-bold text-white">
          {unread > 9 ? "9+" : unread}
        </span>
      ) : null}
    </Link>
  );

  return (
    <div className="min-h-dvh bg-paper md:grid md:grid-cols-[16.5rem_1fr]">
      {/* Lien d'évitement (B8.2) : premier élément focalisable au clavier. */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:rounded-md focus:bg-field focus:px-3 focus:py-2 focus:text-field-fg"
      >
        {t("shell.skipToContent")}
      </a>

      {/* Barre latérale — ordinateur uniquement */}
      <aside className="hidden bg-field-950 text-white md:block">
        <div className="sticky top-0 flex h-dvh flex-col">
          <div className="flex h-16 items-center px-5">
            <Link href="/dashboard" className="rounded-md">
              <Logo tone="light" />
            </Link>
          </div>
          <div className="mx-3 mb-4 rounded-xl border border-white/10 bg-white/[0.04] p-3">
            <p className="mb-1 text-[0.68rem] font-semibold uppercase tracking-[0.1em] text-field-200/80">
              {t("shell.organization")}
            </p>
            {active ? (
              <OrgSwitcher memberships={memberships} activeId={active.id} tone="dark" />
            ) : (
              <Link href="/organizations/new" className="text-sm text-field-200 hover:underline">
                {t("shell.createOrganization")}
              </Link>
            )}
          </div>
          <div className="flex-1 overflow-y-auto px-3 pb-4">
            <SidebarNav secondary={secondary} />
          </div>
          <div className="border-t border-white/10 p-3">
            <div className="flex items-center gap-3 rounded-xl p-2">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-field-400/25 text-sm font-semibold text-field-100">
                {initials(userName)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white" title={userName}>
                  {userName}
                </p>
                <Link href="/profile" className="text-xs text-field-200/70 hover:text-white">
                  {t("routes.profile")}
                </Link>
              </div>
              <form action={logoutAction}>
                <button
                  type="submit"
                  aria-label={t("shell.logout")}
                  title={t("shell.logout")}
                  className="flex size-9 items-center justify-center rounded-lg text-field-200/70 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <LogOut className="size-4" aria-hidden />
                </button>
              </form>
            </div>
          </div>
        </div>
      </aside>

      {/* Colonne principale */}
      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border/80 bg-paper/85 px-4 backdrop-blur md:px-8">
          {/* Marque — mobile uniquement */}
          <Link href="/dashboard" className="md:hidden">
            <Logo />
          </Link>
          {/* Fil d'Ariane — ordinateur uniquement */}
          <div className="hidden min-w-0 md:block">
            <Breadcrumbs />
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <GlobalSearch />
            {bell}
            {/* Menu compte — mobile uniquement */}
            <div className="md:hidden">
              <AccountMenu
                userName={userName}
                memberships={memberships}
                activeId={active?.id ?? null}
                secondary={secondary}
              />
            </div>
          </div>
        </header>

        {subscription && (subscription.status !== "active" || subscription.trialExpired) ? (
          <p role="alert" className="bg-warning-soft px-4 py-2 text-sm text-warning md:px-8">
            {subscription.status !== "active"
              ? t("settings.suspendedBanner")
              : t("settings.trialBanner")}
          </p>
        ) : null}
        <main
          id="main"
          tabIndex={-1}
          className="flex-1 px-4 py-6 pb-28 outline-none md:px-8 md:py-8 md:pb-12"
        >
          {children}
        </main>
      </div>

      {/* Barre d'onglets basse — mobile uniquement */}
      <BottomNav />
    </div>
  );
}
