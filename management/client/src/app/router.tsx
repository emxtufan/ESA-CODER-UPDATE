/** Rutele aplicației de management. */
import { lazy } from "react";
import { createBrowserRouter } from "react-router";

import Layout from "@/app/Layout";
import NotFound from "@/app/NotFound";
import { RequireAuth } from "@/lib/auth";
import LoginPage from "@/modules/auth/LoginPage";
import ResetPasswordPage from "@/modules/auth/ResetPasswordPage";
import AuditPage from "@/modules/audit/AuditPage";
import DashboardPage from "@/modules/dashboard/DashboardPage";
import AccountPage from "@/modules/settings/AccountPage";

// Paginile modulelor operaționale sunt încărcate la cerere (Suspense e în Layout).
const ClientsPage = lazy(() => import("@/modules/clients/ClientsPage"));
const ClientDetailPage = lazy(() => import("@/modules/clients/ClientDetailPage"));
const ProjectsPage = lazy(() => import("@/modules/projects/ProjectsPage"));
const ProjectDetailPage = lazy(() => import("@/modules/projects/ProjectDetailPage"));
const TasksPage = lazy(() => import("@/modules/tasks/TasksPage"));
const ObservationsPage = lazy(() => import("@/modules/observations/ObservationsPage"));
const InfrastructurePage = lazy(() => import("@/modules/infra/InfrastructurePage"));
const VaultPage = lazy(() => import("@/modules/vault/VaultPage"));

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  { path: "/reset-password", element: <ResetPasswordPage /> },
  {
    element: (
      <RequireAuth>
        <Layout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "clients", element: <ClientsPage /> },
      { path: "clients/:id", element: <ClientDetailPage /> },
      { path: "projects", element: <ProjectsPage /> },
      { path: "projects/:id", element: <ProjectDetailPage /> },
      { path: "tasks", element: <TasksPage /> },
      { path: "observations", element: <ObservationsPage /> },
      { path: "infrastructure", element: <InfrastructurePage /> },
      { path: "vault", element: <VaultPage /> },
      { path: "audit", element: <AuditPage /> },
      { path: "settings", element: <AccountPage /> },
    ],
  },
  { path: "*", element: <NotFound /> },
]);
