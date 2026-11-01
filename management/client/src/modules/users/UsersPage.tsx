import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import {
  Badge,
  Button,
  Checkbox,
  ConfirmDialog,
  DataTable,
  Field,
  Input,
  Modal,
  PageHeader,
  Pagination,
  Select,
  Tabs,
  useToast,
} from "@/components/ui";
import { api } from "@/lib/api";
import { useCan } from "@/lib/auth";
import { useListParams } from "@/lib/useListParams";
import { PERMISSION_ACTIONS, PERMISSION_MODULES, PERMISSIONS } from "@shared/permissions";

type Tone = "neutral" | "success" | "warning" | "danger" | "info";

type UsersTab = "users" | "roles";

interface UserItem {
  id: string;
  email: string;
  name: string;
  role: string;
  roleName: string;
  clientId: string | null;
  totpEnabled: boolean;
  invitedAt: string | null;
  disabledAt: string | null;
  lastLoginAt: string | null;
}

interface UserListResponse {
  items: UserItem[];
  total: number;
}

interface RoleItem {
  key: string;
  name: string;
  permissions: string[];
  isSystem: boolean;
}

interface RoleListResponse {
  items: RoleItem[];
}

interface InviteFormValues {
  email: string;
  name: string;
  roleKey: string;
  clientId: string;
}

interface InviteResponse {
  inviteUrl?: string | null;
}

const CLIENT_ROLE_KEY = "client";
const SUPER_ADMIN_ROLE_KEY = "super_admin";

function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("ro-RO", { dateStyle: "short", timeStyle: "short" });
}

function userStatus(user: UserItem): { tone: Tone; label: string } {
  if (user.disabledAt) return { tone: "danger", label: "Dezactivat" };
  if (!user.lastLoginAt && user.invitedAt) return { tone: "warning", label: "Invitat" };
  return { tone: "success", label: "Activ" };
}

export function UsersPage() {
  const toast = useToast();

  const [tab, setTab] = useState<UsersTab>("users");

  const canCreate = useCan("users.create");
  const canUpdate = useCan("users.update");
  const canDelete = useCan("users.delete");

  const { page, pageSize, qInput, setQ, setPage, query } = useListParams();

  const [users, setUsers] = useState<UserItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api<UserListResponse>("/users", { query });
      setUsers(res?.items ?? []);
      setTotal(res?.total ?? 0);
    } catch (err) {
      setUsers([]);
      setTotal(0);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [query]);

  const loadRoles = useCallback(async () => {
    setRolesLoading(true);
    try {
      const res = await api<RoleListResponse>("/users/roles");
      setRoles(res?.items ?? []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Eroare la încărcarea rolurilor.");
    } finally {
      setRolesLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    void loadRoles();
  }, [loadRoles]);

  const roleOptions = useMemo(
    () => roles.map((role) => ({ value: role.key, label: role.name })),
    [roles],
  );

  /* ------------------------------ Invită ------------------------------ */

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);

  const inviteForm = useForm<InviteFormValues>({
    defaultValues: { email: "", name: "", roleKey: "", clientId: "" },
  });

  const selectedInviteRoleKey = inviteForm.watch("roleKey");
  const isClientRole = selectedInviteRoleKey === CLIENT_ROLE_KEY;
  const inviteErrors = inviteForm.formState.errors;

  function openInvite() {
    inviteForm.reset({ email: "", name: "", roleKey: "", clientId: "" });
    setInviteUrl(null);
    setInviteOpen(true);
    if (roles.length === 0) void loadRoles();
  }

  function closeInvite() {
    if (inviteLoading) return;
    setInviteOpen(false);
    setInviteUrl(null);
  }

  const submitInvite = inviteForm.handleSubmit(async (values) => {
    setInviteLoading(true);
    try {
      const body: { email: string; name: string; roleKey: string; clientId?: string } = {
        email: values.email.trim(),
        name: values.name.trim(),
        roleKey: values.roleKey,
      };
      if (values.roleKey === CLIENT_ROLE_KEY) body.clientId = values.clientId.trim();

      const res = await api<InviteResponse>("/users/invite", { method: "POST", body });
      await loadUsers();

      if (res?.inviteUrl) {
        setInviteUrl(res.inviteUrl);
        toast.success("Invitație creată. Trimite linkul manual.");
      } else {
        setInviteOpen(false);
        toast.success("Invitație trimisă.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Nu am putut trimite invitația.");
    } finally {
      setInviteLoading(false);
    }
  });

  /* ------------------------------ Editează ------------------------------ */

  const [editing, setEditing] = useState<UserItem | null>(null);
  const [editName, setEditName] = useState("");
  const [editRoleKey, setEditRoleKey] = useState("");
  const [editDisabled, setEditDisabled] = useState(false);
  const [editLoading, setEditLoading] = useState(false);

  function openEdit(user: UserItem) {
    setEditing(user);
    setEditName(user.name ?? "");
    setEditRoleKey(user.role ?? "");
    setEditDisabled(Boolean(user.disabledAt));
    if (roles.length === 0) void loadRoles();
  }

  function closeEdit() {
    if (editLoading) return;
    setEditing(null);
  }

  async function submitEdit() {
    if (!editing) return;
    setEditLoading(true);
    try {
      await api(`/users/${editing.id}`, {
        method: "PATCH",
        body: {
          name: editName.trim(),
          roleKey: editRoleKey,
          disabled: editDisabled,
        },
      });
      toast.success("Utilizator actualizat.");
      setEditing(null);
      await loadUsers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Nu am putut salva modificările.");
    } finally {
      setEditLoading(false);
    }
  }

  /* --------------------------- Revocă sesiuni --------------------------- */

  const [revokingId, setRevokingId] = useState<string | null>(null);

  async function revokeSessions(user: UserItem) {
    setRevokingId(user.id);
    try {
      await api(`/users/${user.id}/revoke-sessions`, { method: "POST" });
      toast.success("Sesiunile au fost revocate.");
      await loadUsers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Nu am putut revoca sesiunile.");
    } finally {
      setRevokingId(null);
    }
  }

  /* ------------------------------ Șterge ------------------------------ */

  const [deleting, setDeleting] = useState<UserItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      await api(`/users/${deleting.id}`, { method: "DELETE" });
      toast.success("Utilizator șters.");
      setDeleting(null);
      await loadUsers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Nu am putut șterge utilizatorul.");
    } finally {
      setDeleteLoading(false);
    }
  }

  /* ------------------------------ Roluri ------------------------------ */

  const [roleKey, setRoleKey] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [permissionsLoading, setPermissionsLoading] = useState(false);

  const selectedRole = useMemo(
    () => roles.find((role) => role.key === roleKey) ?? null,
    [roles, roleKey],
  );
  const isReadOnlyRole = selectedRole?.key === SUPER_ADMIN_ROLE_KEY;

  useEffect(() => {
    const role = roles.find((item) => item.key === roleKey);
    setSelectedPermissions(role ? [...role.permissions] : []);
  }, [roles, roleKey]);

  const matrixKeys = useMemo(() => {
    const keys: string[] = [];
    PERMISSION_MODULES.forEach((module) => {
      PERMISSION_ACTIONS.forEach((action) => {
        keys.push(`${module}.${action}`);
      });
    });
    return keys;
  }, []);

  const extraPermissions = useMemo(
    () => PERMISSIONS.filter((permission) => !matrixKeys.includes(permission)),
    [matrixKeys],
  );

  function togglePermission(key: string, checked: boolean) {
    if (isReadOnlyRole) return;
    setSelectedPermissions((prev) => {
      if (checked) return prev.includes(key) ? prev : [...prev, key];
      return prev.filter((permission) => permission !== key);
    });
  }

  async function savePermissions() {
    if (!selectedRole || isReadOnlyRole) return;
    setPermissionsLoading(true);
    try {
      await api(`/users/roles/${selectedRole.key}`, {
        method: "PATCH",
        body: { permissions: selectedPermissions },
      });
      toast.success("Permisiunile au fost salvate.");
      await loadRoles();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Nu am putut salva permisiunile.");
    } finally {
      setPermissionsLoading(false);
    }
  }

  /* ------------------------------ Render ------------------------------ */

  const actionsCell = (user: UserItem) => (
    <div className="flex flex-wrap items-center gap-1">
      {canUpdate && (
        <Button variant="ghost" size="sm" onClick={() => openEdit(user)}>
          Editează
        </Button>
      )}
      {canUpdate && (
        <Button
          variant="ghost"
          size="sm"
          loading={revokingId === user.id}
          onClick={() => void revokeSessions(user)}
        >
          Revocă sesiuni
        </Button>
      )}
      {canDelete && (
        <Button variant="ghost" size="sm" onClick={() => setDeleting(user)}>
          Șterge
        </Button>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Utilizatori"
        description="Administrează conturile, rolurile și permisiunile echipei."
        actions={
          <div className="flex items-center gap-2">
            {tab === "users" && (
              <Input
                placeholder="Caută utilizator…"
                value={qInput}
                onChange={(e) => setQ(e.target.value)}
              />
            )}
            {tab === "users" && canCreate && (
              <Button variant="primary" onClick={openInvite}>
                Invită utilizator
              </Button>
            )}
          </div>
        }
      />

      <Tabs
        items={[
          { value: "users", label: "Utilizatori" },
          { value: "roles", label: "Roluri" },
        ]}
        value={tab}
        onChange={(value) => setTab(value as UsersTab)}
      />

      {tab === "users" && (
        <div className="space-y-4">
          <DataTable
            columns={[
              {
                key: "name",
                header: "Nume",
                render: (user: UserItem) => <span className="font-medium">{user.name || "—"}</span>,
              },
              { key: "email", header: "Email", render: (user: UserItem) => user.email },
              {
                key: "role",
                header: "Rol",
                render: (user: UserItem) => user.roleName || user.role || "—",
              },
              {
                key: "totp",
                header: "2FA",
                render: (user: UserItem) =>
                  user.totpEnabled ? (
                    <Badge tone="success">Activ</Badge>
                  ) : (
                    <Badge tone="neutral">Inactiv</Badge>
                  ),
              },
              {
                key: "status",
                header: "Stare",
                render: (user: UserItem) => {
                  const status = userStatus(user);
                  return <Badge tone={status.tone}>{status.label}</Badge>;
                },
              },
              {
                key: "lastLoginAt",
                header: "Ultima conectare",
                render: (user: UserItem) => formatDateTime(user.lastLoginAt),
              },
              {
                key: "actions",
                header: "Acțiuni",
                hideOnMobile: true,
                render: (user: UserItem) => actionsCell(user),
              },
            ]}
            rows={users}
            rowKey={(user: UserItem) => user.id}
            loading={loading}
            error={error}
            onRetry={() => void loadUsers()}
            empty="Nu există utilizatori."
          />

          <Pagination page={page} pageSize={pageSize} total={total} onPage={setPage} />
        </div>
      )}

      {tab === "roles" && (
        <div className="space-y-6">
          <div className="max-w-sm">
            <Field label="Rol" htmlFor="role-select" required>
              <Select
                options={roleOptions}
                placeholder={rolesLoading ? "Se încarcă…" : "Alege rolul"}
                value={roleKey}
                onChange={(e) => setRoleKey(e.target.value)}
              />
            </Field>
          </div>

          {selectedRole && (
            <div className="space-y-6">
              {isReadOnlyRole && (
                <p className="text-sm text-slate-500">
                  Rolul super_admin este read-only și nu poate fi modificat.
                </p>
              )}

              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-slate-600">Modul</th>
                      {PERMISSION_ACTIONS.map((action) => (
                        <th key={action} className="px-3 py-2 text-center font-medium text-slate-600">
                          {action}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {PERMISSION_MODULES.map((module) => (
                      <tr key={module} className="border-t border-slate-100">
                        <td className="px-3 py-2 font-medium text-slate-700">{module}</td>
                        {PERMISSION_ACTIONS.map((action) => {
                          const permissionKey = `${module}.${action}`;
                          return (
                            <td key={permissionKey} className="px-3 py-2 text-center">
                              <Checkbox
                                label=""
                                checked={selectedPermissions.includes(permissionKey)}
                                disabled={isReadOnlyRole}
                                onChange={(e) => togglePermission(permissionKey, e.target.checked)}
                              />
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {extraPermissions.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-slate-700">Alte permisiuni</h3>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {extraPermissions.map((permission) => (
                      <Checkbox
                        key={permission}
                        label={permission}
                        checked={selectedPermissions.includes(permission)}
                        disabled={isReadOnlyRole}
                        onChange={(e) => togglePermission(permission, e.target.checked)}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <Button
                  variant="primary"
                  loading={permissionsLoading}
                  disabled={isReadOnlyRole}
                  onClick={() => void savePermissions()}
                >
                  Salvează
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      <Modal
        open={inviteOpen}
        onClose={closeInvite}
        title="Invită utilizator"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={closeInvite} disabled={inviteLoading}>
              Anulează
            </Button>
            <Button variant="primary" loading={inviteLoading} onClick={() => void submitInvite()}>
              Trimite invitația
            </Button>
          </div>
        }
      >
        <form className="space-y-4" onSubmit={submitInvite}>
          <Field label="Email" htmlFor="invite-email" required error={inviteErrors.email?.message}>
            <Input
              id="invite-email"
              type="email"
              invalid={Boolean(inviteErrors.email)}
              {...inviteForm.register("email", { required: "Emailul este obligatoriu." })}
            />
          </Field>

          <Field label="Nume" htmlFor="invite-name" required error={inviteErrors.name?.message}>
            <Input
              id="invite-name"
              invalid={Boolean(inviteErrors.name)}
              {...inviteForm.register("name", { required: "Numele este obligatoriu." })}
            />
          </Field>

          <Field label="Rol" htmlFor="invite-role" required error={inviteErrors.roleKey?.message}>
            <Select
              id="invite-role"
              options={roleOptions}
              placeholder={rolesLoading ? "Se încarcă…" : "Alege rolul"}
              invalid={Boolean(inviteErrors.roleKey)}
              {...inviteForm.register("roleKey", { required: "Rolul este obligatoriu." })}
            />
          </Field>

          {isClientRole && (
            /* devine select la modulul Clienți */
            <Field
              label="Client"
              htmlFor="invite-client"
              required
              error={inviteErrors.clientId?.message}
            >
              <Input
                id="invite-client"
                placeholder="ID client"
                invalid={Boolean(inviteErrors.clientId)}
                {...inviteForm.register("clientId", {
                  validate: (value) =>
                    inviteForm.getValues("roleKey") !== CLIENT_ROLE_KEY || value.trim().length > 0
                      ? true
                      : "Clientul este obligatoriu pentru rolul client.",
                })}
              />
            </Field>
          )}

          {inviteUrl && (
            <div className="space-y-1">
              <Field label="Link invitație" htmlFor="invite-url">
                <Input
                  id="invite-url"
                  readOnly
                  value={inviteUrl}
                  onFocus={(e) => e.currentTarget.select()}
                />
              </Field>
              <p className="text-sm text-slate-500">Emailul nu este configurat</p>
            </div>
          )}
        </form>
      </Modal>

      <Modal
        open={Boolean(editing)}
        onClose={closeEdit}
        title="Editează utilizator"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={closeEdit} disabled={editLoading}>
              Anulează
            </Button>
            <Button variant="primary" loading={editLoading} onClick={() => void submitEdit()}>
              Salvează
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Field label="Nume" htmlFor="edit-name" required>
            <Input id="edit-name" value={editName} onChange={(e) => setEditName(e.target.value)} />
          </Field>

          <Field label="Rol" htmlFor="edit-role" required>
            <Select
              options={roleOptions}
              placeholder="Alege rolul"
              value={editRoleKey}
              onChange={(e) => setEditRoleKey(e.target.value)}
            />
          </Field>

          <Checkbox
            label="Cont dezactivat"
            checked={editDisabled}
            onChange={(e) => setEditDisabled(e.target.checked)}
          />
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Șterge utilizator"
        message={`Sigur vrei să ștergi utilizatorul ${deleting?.email ?? ""}? Acțiunea este ireversibilă.`}
        confirmLabel="Șterge"
        danger
        loading={deleteLoading}
        onConfirm={() => void confirmDelete()}
        onCancel={() => {
          if (!deleteLoading) setDeleting(null);
        }}
      />
    </div>
  );
}

export default UsersPage;
