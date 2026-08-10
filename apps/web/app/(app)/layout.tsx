import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { getCurrentUser } from "@/lib/auth/current-user";
import { getActiveContext } from "@/lib/org/queries";

import { logoutAction } from "../(auth)/actions";
import { OrgSwitcher } from "./organizations/org-switcher";
import { Button } from "@/components/ui/button";

/**
 * Garde serveur de l'espace authentifié : sans session valide, on redirige vers
 * la connexion. Le middleware fait un premier filtrage sur la présence du
 * cookie ; la validation réelle (session non expirée, non révoquée) a lieu ici.
 */
export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const { active, memberships } = await getActiveContext(user.id);

  return (
    <div className="flex min-h-dvh flex-col bg-paper">
      <header className="flex items-center justify-between border-b border-border bg-surface px-4 py-3">
        <div className="flex items-center gap-4">
          <span className="font-semibold text-field">MissionOps</span>
          {active ? (
            <OrgSwitcher memberships={memberships} activeId={active.id} />
          ) : (
            <Link href="/organizations/new" className="text-sm text-field hover:underline">
              Créer une organisation
            </Link>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted">{user.fullName ?? user.email}</span>
          <form action={logoutAction}>
            <Button type="submit" variant="ghost" size="sm">
              Se déconnecter
            </Button>
          </form>
        </div>
      </header>
      <main className="flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
