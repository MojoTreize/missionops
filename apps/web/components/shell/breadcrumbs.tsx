"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";

import { buildBreadcrumbs } from "@/lib/nav";

/**
 * Fil d'Ariane (ordinateur). Dérivé du chemin courant ; le dernier maillon est
 * la page active. Masqué sur mobile, où l'en-tête compact suffit.
 */
export function Breadcrumbs() {
  const pathname = usePathname();
  const crumbs = buildBreadcrumbs(pathname);
  if (crumbs.length === 0) return null;

  return (
    <nav aria-label="Fil d'Ariane">
      <ol className="flex items-center gap-1.5 text-sm">
        {crumbs.map((crumb, index) => (
          <li key={crumb.href} className="flex items-center gap-1.5">
            {index > 0 ? <ChevronRight className="size-4 text-subtle" aria-hidden /> : null}
            {crumb.isLast ? (
              <span aria-current="page" className="font-medium text-ink">
                {crumb.label}
              </span>
            ) : (
              <Link href={crumb.href} className="text-muted hover:text-ink">
                {crumb.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
