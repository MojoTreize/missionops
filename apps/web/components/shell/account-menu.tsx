"use client";

import Link from "next/link";
import { useState } from "react";
import { CircleUser, LogOut, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useT } from "@/lib/i18n/client";
import type { MembershipView } from "@/lib/org/queries";

import { logoutAction } from "@/app/(auth)/actions";
import { OrgSwitcher } from "@/app/(app)/organizations/org-switcher";

/**
 * Menu « compte » de l'en-tête mobile (B1.10). Rassemble ce qui ne tient pas
 * dans la barre d'onglets basse : organisation active, accès aux membres et
 * déconnexion — pour qu'aucune destination ne soit hors d'atteinte sur mobile.
 */
export function AccountMenu({
  userName,
  memberships,
  activeId,
}: {
  userName: string;
  memberships: MembershipView[];
  activeId: string | null;
}) {
  const [open, setOpen] = useState(false);
  const t = useT();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label={t("shell.accountMenu")}
          className="flex size-9 items-center justify-center rounded-md text-muted transition-colors hover:text-ink"
        >
          <CircleUser className="size-5" aria-hidden />
        </button>
      </SheetTrigger>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>{t("shell.account")}</SheetTitle>
          <p className="truncate text-sm text-muted" title={userName}>
            {userName}
          </p>
        </SheetHeader>

        {activeId ? (
          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium uppercase tracking-wide text-subtle">
              {t("shell.organization")}
            </span>
            <OrgSwitcher memberships={memberships} activeId={activeId} />
          </div>
        ) : (
          <Link
            href="/organizations/new"
            onClick={() => setOpen(false)}
            className="text-sm text-field hover:underline"
          >
            {t("shell.createOrganization")}
          </Link>
        )}

        <Link
          href="/organizations/members"
          onClick={() => setOpen(false)}
          className="flex items-center gap-3 rounded-md px-1 py-2 text-sm font-medium text-muted hover:text-ink"
        >
          <Users className="size-5 shrink-0" aria-hidden />
          {t("shell.members")}
        </Link>

        <Link
          href="/profile"
          onClick={() => setOpen(false)}
          className="flex items-center gap-3 rounded-md px-1 py-2 text-sm font-medium text-muted hover:text-ink"
        >
          <CircleUser className="size-5 shrink-0" aria-hidden />
          {t("routes.profile")}
        </Link>

        <form action={logoutAction} className="mt-auto">
          <Button type="submit" variant="ghost" size="sm" className="w-full justify-start gap-3">
            <LogOut className="size-5 shrink-0" aria-hidden />
            {t("shell.logout")}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
