import { BarChart3, Compass, LayoutDashboard, ReceiptText, type LucideIcon } from "lucide-react";

/**
 * Configuration de la navigation principale (B1.10) — source unique de vérité.
 *
 * Ces entrées alimentent à la fois la barre latérale (ordinateur) et la barre
 * d'onglets basse (mobile) : mêmes destinations, habillage différent selon
 * l'appareil. Toute section de premier niveau s'ajoute ici, jamais en double.
 */
export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/missions", label: "Missions", icon: Compass },
  { href: "/expenses", label: "Dépenses", icon: ReceiptText },
  { href: "/reports", label: "Rapports", icon: BarChart3 },
];

/**
 * Une entrée est active si l'URL courante est cette route ou l'une de ses
 * sous-routes (`/missions` reste active sur `/missions/42`).
 */
export function isActivePath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Libellés des routes connues, pour le fil d'Ariane. Une route absente de cette
 * table retombe sur une capitalisation du segment d'URL.
 */
export const ROUTE_LABELS: Record<string, string> = {
  "/dashboard": "Tableau de bord",
  "/missions": "Missions",
  "/expenses": "Dépenses",
  "/reports": "Rapports",
  "/organizations": "Organisation",
  "/organizations/new": "Nouvelle organisation",
  "/organizations/members": "Membres",
  "/forbidden": "Accès refusé",
};

export interface Crumb {
  href: string;
  label: string;
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
      label: ROUTE_LABELS[href] ?? titleCase(segments[i] ?? ""),
      isLast: i === segments.length - 1,
    });
  }
  return crumbs;
}
