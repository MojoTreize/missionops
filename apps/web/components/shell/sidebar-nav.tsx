"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/cn";
import { useT } from "@/lib/i18n/client";
import { isActivePath, NAV_ITEMS, SECONDARY_ITEMS } from "@/lib/nav";

/**
 * Navigation latérale (ordinateur). Met en évidence la section courante.
 */
export function SidebarNav({ secondary = [] }: { secondary?: string[] }) {
  const pathname = usePathname();
  const t = useT();
  const extra = SECONDARY_ITEMS.filter((item) => secondary.includes(item.href));

  return (
    <nav aria-label={t("shell.mainNav")} className="flex flex-col gap-1">
      {[...NAV_ITEMS, ...extra].map((item, index) => {
        const active = isActivePath(pathname, item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            data-separator={index === NAV_ITEMS.length ? "" : undefined}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active ? "bg-field-soft text-field" : "text-muted hover:bg-paper hover:text-ink",
              index === NAV_ITEMS.length && "mt-3 border-t border-border pt-3",
            )}
          >
            <Icon className="size-5 shrink-0" aria-hidden />
            {t(item.labelKey)}
          </Link>
        );
      })}
    </nav>
  );
}
