import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { AccountMenu } from "@/components/shell/account-menu";
import { BottomNav } from "@/components/shell/bottom-nav";
import { Breadcrumbs } from "@/components/shell/breadcrumbs";
import { GlobalSearch } from "@/components/shell/global-search";
import { SidebarNav } from "@/components/shell/sidebar-nav";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getT } from "@/lib/i18n/server";
import { getActiveContext } from "@/lib/org/queries";

import { logoutAction } from "../(auth)/actions";
import { OrgSwitcher } from "./organizations/org-switcher";
import { Button } from "@/components/ui/button";

/**
 * Coque de l'espace authentifié (B1.10).
 *
 * Garde serveur d'abord : sans session valide, on redirige vers la connexion.
 * Puis la navigation, qui diffère selon l'appareil : barre latérale + fil
 * d'Ariane + recherche globale sur ordinateur ; en-tête compact + barre
 * d'onglets basse sur mobile. Les deux s'appuient sur la même configuration de
 * navigation (`lib/nav`).
 */
export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const { active, memberships } = await getActiveContext(user.id);
  const userName = user.fullName ?? user.email;
  const { t } = await getT();

  return (
    <div className="min-h-dvh bg-paper md:grid md:grid-cols-[16rem_1fr]">
      {/* Barre latérale — ordinateur uniquement */}
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-border bg-surface md:flex">
        <div className="flex h-14 items-center border-b border-border px-4">
          <Link href="/dashboard" className="font-semibold text-field">
            MissionOps
          </Link>
        </div>
        <div className="border-b border-border px-3 py-3">
          {active ? (
            <OrgSwitcher memberships={memberships} activeId={active.id} />
          ) : (
            <Link href="/organizations/new" className="text-sm text-field hover:underline">
              {t("shell.createOrganization")}
            </Link>
          )}
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          <SidebarNav />
        </div>
        <div className="border-t border-border p-3">
          <p className="truncate px-1 text-sm text-muted" title={userName}>
            {userName}
          </p>
          <Link href="/profile" className="mt-1 block px-1 text-sm text-field hover:underline">
            {t("routes.profile")}
          </Link>
          <form action={logoutAction} className="mt-2">
            <Button type="submit" variant="ghost" size="sm" className="w-full justify-start">
              {t("shell.logout")}
            </Button>
          </form>
        </div>
      </aside>

      {/* Colonne principale */}
      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-surface px-4">
          {/* Marque — mobile uniquement */}
          <Link href="/dashboard" className="font-semibold text-field md:hidden">
            MissionOps
          </Link>
          {/* Fil d'Ariane — ordinateur uniquement */}
          <div className="hidden md:block">
            <Breadcrumbs />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <GlobalSearch />
            {/* Menu compte — mobile uniquement */}
            <div className="md:hidden">
              <AccountMenu
                userName={userName}
                memberships={memberships}
                activeId={active?.id ?? null}
              />
            </div>
          </div>
        </header>

        {/* Marge basse sur mobile pour dégager la barre d'onglets */}
        <main className="flex-1 px-4 py-6 pb-24 md:pb-8">{children}</main>
      </div>

      {/* Barre d'onglets basse — mobile uniquement */}
      <BottomNav />
    </div>
  );
}
