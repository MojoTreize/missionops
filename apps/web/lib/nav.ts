import {
  BarChart3,
  Bell,
  CheckSquare,
  Compass,
  GitBranch,
  Landmark,
  LayoutDashboard,
  LifeBuoy,
  MapPin,
  ReceiptText,
  ScrollText,
  Settings,
  Shield,
  Smartphone,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { Action, Resource } from "@missionops/core";

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
  { href: "/terrain", labelKey: "nav.terrain", icon: Smartphone },
  { href: "/expenses", labelKey: "nav.expenses", icon: ReceiptText },
];

/**
 * Entrées secondaires (barre latérale et menu compte), chacune soumise à un
 * droit de la matrice : on n'affiche que ce que le rôle peut ouvrir.
 */
export interface SecondaryNavItem extends NavItem {
  permission: [Action, Resource] | null;
}

export const SECONDARY_ITEMS: SecondaryNavItem[] = [
  {
    href: "/approvals",
    labelKey: "nav.approvals",
    icon: CheckSquare,
    permission: ["approve", "mission"],
  },
  { href: "/finance", labelKey: "nav.finance", icon: Landmark, permission: ["approve", "expense"] },
  { href: "/reports", labelKey: "nav.reports", icon: BarChart3, permission: ["read", "report"] },
  { href: "/notifications", labelKey: "nav.notifications", icon: Bell, permission: null },
  {
    href: "/organizations/members",
    labelKey: "routes.members",
    icon: Users,
    permission: ["read", "member"],
  },
  {
    href: "/organizations/locations",
    labelKey: "nav.locations",
    icon: MapPin,
    permission: ["read", "location"],
  },
  {
    href: "/organizations/approval-flow",
    labelKey: "nav.approvalFlow",
    icon: GitBranch,
    permission: ["update", "approvalFlow"],
  },
  { href: "/audit", labelKey: "nav.audit", icon: ScrollText, permission: ["read", "auditLog"] },
  {
    href: "/organizations/settings",
    labelKey: "nav.settings",
    icon: Settings,
    permission: ["update", "organisation"],
  },
  { href: "/help", labelKey: "nav.help", icon: LifeBuoy, permission: null },
  { href: "/admin", labelKey: "nav.admin", icon: Shield, permission: null },
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
  "/terrain": "nav.terrain",
  "/approvals": "nav.approvals",
  "/finance": "nav.finance",
  "/finance/rates": "rates.title",
  "/notifications": "nav.notifications",
  "/missions/new": "missions.newMission",
  "/missions/calendar": "missions.calendarView",
  "/missions/:id/edit": "missions.detail.edit",
  "/missions/:id/reconciliation": "missions.detail.reconciliation",
  "/missions/:id/report": "missions.detail.report",
  "/organizations/locations": "nav.locations",
  "/organizations/approval-flow": "nav.approvalFlow",
  "/organizations/settings": "nav.settings",
  "/audit": "nav.audit",
  "/admin": "nav.admin",
  "/help": "nav.help",
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
    // Un identifiant technique (UUID) n'est jamais montré : « Fiche ».
    const isId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      segments[i] ?? "",
    );
    crumbs.push({
      href,
      labelKey: isId
        ? "routes.detail"
        : (ROUTE_LABEL_KEYS[href] ??
          ROUTE_LABEL_KEYS[href.replace(/\/[0-9a-f-]{36}/gi, "/:id")] ??
          null),
      fallback: titleCase(segments[i] ?? ""),
      isLast: i === segments.length - 1,
    });
  }
  return crumbs;
}
