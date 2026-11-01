/** Rutele aplicației de management. */
import { createBrowserRouter } from "react-router";

import Layout from "@/app/Layout";
import NotFound from "@/app/NotFound";
import { RequireAuth } from "@/lib/auth";
import LoginPage from "@/modules/auth/LoginPage";
import ResetPasswordPage from "@/modules/auth/ResetPasswordPage";
import AuditPage from "@/modules/audit/AuditPage";
import DashboardPage from "@/modules/dashboard/DashboardPage";
import AccountPage from "@/modules/settings/AccountPage";
import UsersPage from "@/modules/users/UsersPage";

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
      { path: "users", element: <UsersPage /> },
      { path: "audit", element: <AuditPage /> },
      { path: "settings", element: <AccountPage /> },
    ],
  },
  { path: "*", element: <NotFound /> },
]);
