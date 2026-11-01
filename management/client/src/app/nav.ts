/** Navigația laterală: grupuri de module, fiecare item cu permisiune opțională. */
import {
  Building2,
  FolderKanban,
  GitBranch,
  KeyRound,
  LayoutDashboard,
  ListChecks,
  Rocket,
  ScrollText,
  Server,
  Settings,
  StickyNote,
  Wallet,
  type LucideIcon,
} from "lucide-react";

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
    group: "Operațional",
    items: [
      { label: "Proiecte", to: "/projects", icon: FolderKanban, perm: "projects.view" },
      { label: "Clienți", to: "/clients", icon: Building2, perm: "clients.view" },
      { label: "Taskuri", to: "/tasks", icon: ListChecks, perm: "tasks.view" },
      { label: "Observații", to: "/observations", icon: StickyNote, perm: "observations.view" },
    ],
  },
  {
    group: "Infrastructură",
    items: [
      { label: "Infrastructură", to: "/infrastructure", icon: Server, perm: "infrastructure.view" },
      { label: "Seif", to: "/vault", icon: KeyRound, perm: "vault.view" },
    ],
  },
  {
    group: "Dezvoltare",
    items: [
      { label: "GitHub", to: "/github", icon: GitBranch, perm: "github.view" },
      { label: "Deployments", to: "/deployments", icon: Rocket, perm: "deployments.view" },
    ],
  },
  {
    group: "Financiar",
    items: [{ label: "Financiar", to: "/finance", icon: Wallet, perm: "finance.view" }],
  },
  {
    group: "Administrare",
    items: [
      { label: "Audit", to: "/audit", icon: ScrollText, perm: "audit.view" },
      { label: "Cont", to: "/settings", icon: Settings },
    ],
  },
];
