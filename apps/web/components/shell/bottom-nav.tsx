"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/cn";
import { useT } from "@/lib/i18n/client";
import { isActivePath, NAV_ITEMS } from "@/lib/nav";

/**
 * Barre d'onglets basse (mobile) — quatre entrées, cibles tactiles de 56 px,
 * pastille sur l'onglet actif. Masquée à partir de l'ordinateur.
 */
export function BottomNav() {
  const pathname = usePathname();
  const t = useT();

  return (
    <nav
      aria-label={t("shell.mainNav")}
      className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-border bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      {NAV_ITEMS.map((item) => {
        const active = isActivePath(pathname, item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-h-14 flex-col items-center justify-center gap-1 px-1 py-1.5 text-[0.7rem] font-medium transition-colors",
              active ? "text-field" : "text-muted hover:text-ink",
            )}
          >
            <span
              className={cn(
                "flex h-7 w-12 items-center justify-center rounded-full transition-colors",
                active ? "bg-field-soft" : "",
              )}
            >
              <Icon className="size-5 shrink-0" aria-hidden />
            </span>
            <span className="truncate">{t(item.labelKey)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
