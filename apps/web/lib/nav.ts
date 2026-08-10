import { BarChart3, Compass, LayoutDashboard, ReceiptText, type LucideIcon } from "lucide-react";

import type { MessageKey } from "./i18n/translate";

/**
 * Configuration de la navigation principale (B1.10) — source unique de vérité.
 *
 * Ces entrées alimentent à la fois la barre latérale (ordinateur) et la barre
 * d'onglets basse (mobile) : mêmes destinations, habillage différent selon
 * l'appareil. Toute section de premier niveau s'ajoute ici, jamais en double.
 *
 * Depuis B1.11, les libellés sont des clés de traduction résolues au rendu.
 */
export interface NavItem {
  href: string;
  labelKey: MessageKey;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard },
  { href: "/missions", labelKey: "nav.missions", icon: Compass },
  { href: "/expenses", labelKey: "nav.expenses", icon: ReceiptText },
  { href: "/reports", labelKey: "nav.reports", icon: BarChart3 },
];

/**
 * Une entrée est active si l'URL courante est cette route ou l'une de ses
 * sous-routes (`/missions` reste active sur `/missions/42`).
 */
export function isActivePath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Clés de traduction des routes connues, pour le fil d'Ariane. Une route absente
 * de cette table retombe sur une capitalisation du segment d'URL.
 */
export const ROUTE_LABEL_KEYS: Record<string, MessageKey> = {
  "/dashboard": "nav.dashboard",
  "/missions": "nav.missions",
  "/expenses": "nav.expenses",
  "/reports": "nav.reports",
  "/organizations": "routes.organization",
  "/organizations/new": "routes.newOrganization",
  "/organizations/members": "routes.members",
  "/forbidden": "routes.forbidden",
  "/profile": "routes.profile",
};

export interface Crumb {
  href: string;
  /** Clé de traduction si la route est connue, sinon `null`. */
  labelKey: MessageKey | null;
  /** Libellé de repli (segment capitalisé) pour les routes inconnues. */
  fallback: string;
  isLast: boolean;
}

function titleCase(segment: string): string {
  const spaced = segment.replace(/-/g, " ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/**
 * Construit le fil d'Ariane à partir du chemin courant : un maillon cumulatif
 * par segment, le dernier marqué comme page courante.
 */
export function buildBreadcrumbs(pathname: string): Crumb[] {
  const segments = pathname.split("/").filter(Boolean);
  const crumbs: Crumb[] = [];
  let href = "";
  for (let i = 0; i < segments.length; i += 1) {
    href += `/${segments[i]}`;
    crumbs.push({
      href,
      labelKey: ROUTE_LABEL_KEYS[href] ?? null,
      fallback: titleCase(segments[i] ?? ""),
      isLast: i === segments.length - 1,
    });
  }
  return crumbs;
}
