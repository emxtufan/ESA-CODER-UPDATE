/**
 * Scheletul zonei de management: sidebar fix pe desktop, drawer pe mobil,
 * header cu utilizatorul curent și conținutul rutei în `<main id="main">`.
 */
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, LogOut, Menu, X } from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router";

import { NAV, type NavItem } from "@/app/nav";
import { Button, Spinner, cn } from "@/components/ui";
import { api } from "@/lib/api";
import { useCan, useMe } from "@/lib/auth";
import { GlobalSearch } from "@/modules/search/GlobalSearch";

function SidebarLink({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) {
  const allowed = useCan(item.perm);
  if (!allowed) return null;

  const Icon = item.icon;

  return (
    <NavLink
      to={item.to}
      end={item.to === "/"}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
          isActive ? "bg-black/5 font-medium text-text" : "text-muted hover:bg-black/[0.03] hover:text-text",
        )
      }
    >
      <Icon aria-hidden="true" className="size-4 shrink-0" />
      <span className="truncate">{item.label}</span>
    </NavLink>
  );
}

function Sidebar({ onNavigate, onClose }: { onNavigate?: () => void; onClose?: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center justify-between gap-2 px-4">
        <span className="truncate text-sm font-semibold text-text">ESA Management</span>
        {onClose ? (
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Închide meniul">
            <X aria-hidden="true" className="size-4" />
          </Button>
        ) : null}
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-2 py-4">
        {NAV.map((group) => (
          <div key={group.group} className="space-y-1">
            <p className="px-3 text-xs font-medium uppercase tracking-wide text-muted">{group.group}</p>
            {group.items.map((item) => (
              <SidebarLink key={item.to} item={item} onNavigate={onNavigate} />
            ))}
          </div>
        ))}
      </nav>
    </div>
  );
}

export function Layout() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const { data: me } = useMe();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { data: unread } = useQuery({
    queryKey: ["unread-count"],
    queryFn: () => api<{ count: number }>("/notifications/unread-count"),
    refetchInterval: 60000,
  });
  const unreadCount = unread?.count ?? 0;

  useEffect(() => {
    if (!drawerOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDrawerOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [drawerOpen]);

  const closeDrawer = () => setDrawerOpen(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await api("/auth/logout", { method: "POST" });
    } catch {
      // Deconectarea locală are loc oricum.
    }
    queryClient.clear();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-bg">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-card focus:px-3 focus:py-2 focus:text-sm focus:text-text"
      >
        Sari la conținut
      </a>

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 border-r border-line bg-sidebar/80 backdrop-blur-xl lg:block">
        <Sidebar />
      </aside>

      {drawerOpen ? (
        <div className="lg:hidden">
          <div className="fixed inset-0 z-40 bg-black/60" onClick={closeDrawer} aria-hidden="true" />
          <aside className="fixed inset-y-0 left-0 z-50 w-60 border-r border-line bg-sidebar/80 backdrop-blur-xl">
            <Sidebar onNavigate={closeDrawer} onClose={closeDrawer} />
          </aside>
        </div>
      ) : null}

      <div className="lg:pl-60">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line bg-bg/80 px-4 backdrop-blur-xl lg:px-8">
          <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setDrawerOpen(true)} aria-label="Deschide meniul">
            <Menu aria-hidden="true" className="size-4" />
          </Button>

          <GlobalSearch />

          <div className="ml-auto flex items-center gap-3">
            <Link
              to="/notifications"
              aria-label="Notificări"
              className="relative inline-flex size-9 items-center justify-center rounded-md text-muted transition-colors hover:bg-card hover:text-text"
            >
              <Bell aria-hidden="true" className="size-4" />
              {unreadCount > 0 ? (
                <span className="absolute -right-0.5 -top-0.5 inline-flex min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold leading-4 text-white">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              ) : null}
            </Link>

            <div className="text-right leading-tight">
              <p className="text-sm font-medium text-text">{me?.user.name ?? "—"}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout} loading={loggingOut}>
              <LogOut aria-hidden="true" className="size-4" />
              Deconectare
            </Button>
          </div>
        </header>

        <main id="main" className="mx-auto w-full max-w-[1400px] p-4 lg:p-8">
          <Suspense
            fallback={
              <div className="flex justify-center p-8">
                <Spinner />
              </div>
            }
          >
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}

export default Layout;
