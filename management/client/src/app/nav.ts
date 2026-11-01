/** Navigația laterală: grupuri de module, fiecare item cu permisiune opțională. */
import { LayoutDashboard, ScrollText, Settings, Users, type LucideIcon } from "lucide-react";

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
      { label: "Utilizatori", to: "/users", icon: Users, perm: "users.view" },
      { label: "Audit", to: "/audit", icon: ScrollText, perm: "audit.view" },
      { label: "Cont", to: "/settings", icon: Settings },
    ],
  },
];
