"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";

import { buildBreadcrumbs } from "@/lib/nav";
import { useT } from "@/lib/i18n/client";

/**
 * Fil d'Ariane (ordinateur). Dérivé du chemin courant ; le dernier maillon est
 * la page active. Masqué sur mobile, où l'en-tête compact suffit.
 */
export function Breadcrumbs() {
  const pathname = usePathname();
  const t = useT();
  const crumbs = buildBreadcrumbs(pathname);
  if (crumbs.length === 0) return null;

  return (
    <nav aria-label={t("shell.breadcrumb")}>
      <ol className="flex items-center gap-1.5 text-sm">
        {crumbs.map((crumb, index) => {
          const label = crumb.labelKey ? t(crumb.labelKey) : crumb.fallback;
          return (
            <li key={crumb.href} className="flex items-center gap-1.5">
              {index > 0 ? <ChevronRight className="size-4 text-subtle" aria-hidden /> : null}
              {crumb.isLast ? (
                <span aria-current="page" className="font-medium text-ink">
                  {label}
                </span>
              ) : (
                <Link href={crumb.href} className="text-muted hover:text-ink">
                  {label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
