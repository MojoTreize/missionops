"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/cn";
import { useT } from "@/lib/i18n/client";
import { isActivePath, NAV_ITEMS } from "@/lib/nav";

/**
 * Barre d'onglets basse (mobile) — quatre entrées, cibles tactiles larges,
 * fixée en bas de l'écran. Masquée à partir de l'ordinateur (`md:`), où la
 * barre latérale prend le relais.
 */
export function BottomNav() {
  const pathname = usePathname();
  const t = useT();

  return (
    <nav
      aria-label={t("shell.mainNav")}
      className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] md:hidden"
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
              "flex min-h-14 flex-col items-center justify-center gap-1 px-1 py-2 text-xs font-medium transition-colors",
              active ? "text-field" : "text-muted hover:text-ink",
            )}
          >
            <Icon className="size-5 shrink-0" aria-hidden />
            <span className="truncate">{t(item.labelKey)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
