/**
 * Punctul de intrare al aplicației: clientul React Query, providerii globali și
 * routerul. Orice eroare 401 invalidatează `["me"]`, ca guard-urile să reevaluețeze
 * sesiunea.
 */
import { QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router";

import { router } from "@/app/router";
import { ToastProvider } from "@/components/ui";
import { ApiError } from "@/lib/api";

import "./styles.css";

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      if (error instanceof ApiError && error.status === 401) {
        void queryClient.invalidateQueries({ queryKey: ["me"] });
      }
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (failureCount, error) => {
        if (error instanceof ApiError && [401, 403, 404].includes(error.status)) return false;
        return failureCount < 1;
      },
    },
  },
});

const container = document.getElementById("root");
if (!container) throw new Error("Elementul #root lipsește din index.html");

createRoot(container).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <RouterProvider router={router} />
      </ToastProvider>
    </QueryClientProvider>
  </StrictMode>,
);
