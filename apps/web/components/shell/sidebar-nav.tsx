"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/cn";
import { isActivePath, NAV_ITEMS } from "@/lib/nav";

/**
 * Navigation latérale (ordinateur). Met en évidence la section courante.
 */
export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Navigation principale" className="flex flex-col gap-1">
      {NAV_ITEMS.map((item) => {
        const active = isActivePath(pathname, item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active ? "bg-field-soft text-field" : "text-muted hover:bg-paper hover:text-ink",
            )}
          >
            <Icon className="size-5 shrink-0" aria-hidden />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
