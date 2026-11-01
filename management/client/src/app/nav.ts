/** Navigația laterală: grupuri de module, fiecare item cu permisiune opțională. */
import { LayoutDashboard, ScrollText, Settings, type LucideIcon } from "lucide-react";

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  perm?: string;
}

export interface NavGroup {
  group: string;
  items: NavItem[];
}

/** Doar modulele implementate apar aici. */
export const NAV: NavGroup[] = [
  {
    group: "Dashboard",
    items: [{ label: "Dashboard", to: "/", icon: LayoutDashboard }],
  },
  {
    group: "Administrare",
    items: [
      { label: "Audit", to: "/audit", icon: ScrollText, perm: "audit.view" },
      { label: "Cont", to: "/settings", icon: Settings },
    ],
  },
];
