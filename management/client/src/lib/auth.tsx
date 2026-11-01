/**
 * Sesiunea curentă: `useMe` (query `["me"]`), verificarea de permisiuni și
 * guard-ul de rută pentru zona de management.
 */
import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { Navigate } from "react-router";

import { Spinner } from "@/components/ui";
import { api, ApiError } from "@/lib/api";

export interface Me {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    clientId: string | null;
    totpEnabled: boolean;
  };
  permissions: string[];
}

/** Utilizatorul curent; `null` dacă nu există sesiune (401). */
export function useMe() {
  return useQuery<Me | null>({
    queryKey: ["me"],
    queryFn: async () => {
      try {
        return await api<Me>("/auth/me");
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) return null;
        throw error;
      }
    },
  });
}

/** `true` dacă utilizatorul curent are permisiunea (sau e super_admin). */
export function useCan(perm?: string): boolean {
  const { data } = useMe();

  if (data?.user.role === "super_admin") return true;
  if (!perm) return true;

  return data?.permissions.includes(perm) ?? false;
}

/** Cere o sesiune validă; altfel redirect la login (sau la portal, pentru clienți). */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { data, isLoading } = useMe();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!data) return <Navigate to="/login" replace />;

  // Portalul de client se implementează în faza 7.
  if (data.user.role === "client") return <Navigate to="/portal" replace />;

  return <>{children}</>;
}
