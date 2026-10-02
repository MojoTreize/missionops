"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/cn";
import { useT } from "@/lib/i18n/client";
import { isActivePath, NAV_ITEMS, SECONDARY_ITEMS, type NavItem } from "@/lib/nav";

/**
 * Navigation latérale (ordinateur), sur fond vert profond : opérations
 * courantes d'abord, pilotage et administration ensuite.
 */
export function SidebarNav({ secondary = [] }: { secondary?: string[] }) {
  const pathname = usePathname();
  const t = useT();
  const extra = SECONDARY_ITEMS.filter((item) => secondary.includes(item.href));

  const link = (item: NavItem) => {
    const active = isActivePath(pathname, item.href);
    const Icon = item.icon;
    return (
      <Link
        key={item.href}
        href={item.href}
        aria-current={active ? "page" : undefined}
        className={cn(
          "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-[0.9rem] font-medium transition-colors",
          active ? "bg-white/10 text-white" : "text-field-200/80 hover:bg-white/5 hover:text-white",
        )}
      >
        {active ? (
          <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-field-400" aria-hidden />
        ) : null}
        <Icon
          className={cn(
            "size-[1.1rem] shrink-0",
            active ? "text-field-200" : "text-field-200/60 group-hover:text-field-200",
          )}
          aria-hidden
        />
        {t(item.labelKey)}
      </Link>
    );
  };

  return (
    <nav aria-label={t("shell.mainNav")} className="flex flex-col gap-6">
      <div className="flex flex-col gap-0.5">
        <p className="px-3 pb-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.1em] text-field-200/50">
          {t("shell.groupOperations")}
        </p>
        {NAV_ITEMS.map(link)}
      </div>
      {extra.length > 0 ? (
        <div className="flex flex-col gap-0.5">
          <p className="px-3 pb-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.1em] text-field-200/50">
            {t("shell.groupManagement")}
          </p>
          {extra.map(link)}
        </div>
      ) : null}
    </nav>
  );
}
