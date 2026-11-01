/**
 * Pagină generică de resursă: listă cu căutare/filtre/sortare/paginare peste
 * `DataTable` și formular de creare/modificare generat din `FieldDef[]`.
 *
 * Endpoint-urile urmează convenția API-ului: `GET /resursa` → `{ items, total }`,
 * `POST /resursa` și `PATCH /resursa/:id` → `{ item }`, `DELETE /resursa/:id`.
 */
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm, type FieldValues } from "react-hook-form";
import { useNavigate } from "react-router";

import {
  Button,
  ConfirmDialog,
  DataTable,
  Field,
  Input,
  Modal,
  PageHeader,
  Pagination,
  Select,
  useToast,
  type DataTableColumn,
} from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import { useCan } from "@/lib/auth";
import { useListParams } from "@/lib/useListParams";

import {
  ResourceFormField,
  formValuesToBody,
  normalizeOptions,
  resourceDefaults,
  useRelationOptions,
  type FieldDef,
  type FieldOption,
} from "./fields";

export { formatDate, formatMoney, statusTone } from "./fields";
export type { FieldDef, FieldOption, FieldType } from "./fields";

/** Un filtru de listă: apare ca `Select` și se scrie în URL. */
export interface FilterDef {
  /** Numele din query string (trimis ca atare către API). */
  name: string;
  label: string;
  options?: readonly FieldOption[];
  /** Opțiuni aduse de la `GET endpoint?pageSize=100` (ex. lista de clienți). */
  endpoint?: string;
  labelKey?: string;
}

export interface ResourcePageConfig<T> {
  title: string;
  description?: string;
  /** Prefixul rutelor API (ex. `/clients`). */
  endpoint: string;
  /** Modulul de permisiuni: `clients` → `clients.view/create/update/delete`. */
  perm: string;
  columns: DataTableColumn<T>[];
  fields: FieldDef[];
  filters?: FilterDef[];
  searchPlaceholder?: string;
  /** Dacă e dat, click pe rând navighează; altfel deschide formularul de modificare. */
  detailPath?: (row: T) => string;
  /** Valori inițiale la creare (inclusiv câmpuri fără UI, ex. `projectId`). */
  defaults?: Record<string, unknown>;
  /** Parametri fixați în listare (ex. `{ projectId }`). */
  extraQuery?: Record<string, string | number>;
  /** Fără `PageHeader` când pagina e încorporată într-un tab sau într-un detaliu. */
  embedded?: boolean;
  /** `false` ascunde butonul de ștergere, indiferent de permisiune. */
  canDelete?: boolean;
  /** Acțiuni suplimentare pe rând, afișate în coloana de acțiuni (ex. „Convertește în task”). */
  rowActions?: (row: T) => ReactNode;
  /** Doar citire: fără buton de creare, fără click pe rând și fără editare/ștergere. */
  readOnly?: boolean;
  /** Numele entității în mesaje (ex. „client”). */
  itemName: string;
}

/** Identificatorul unui rând (`id` din răspunsul API). */
function rowId(row: unknown): string {
  return String((row as { id?: string | number } | null)?.id ?? "");
}

/** Un `Select` de filtru, cu opțiunile statice plus cele aduse de la `endpoint`. */
function FilterSelect({
  filter,
  value,
  onChange,
}: {
  filter: FilterDef;
  value: string;
  onChange: (value: string | null) => void;
}) {
  const relation = useRelationOptions(filter.endpoint, filter.labelKey);
  const options = useMemo(
    () => [{ value: "", label: "Toate" }, ...normalizeOptions(filter.options), ...relation.options],
    [filter.options, relation.options],
  );

  return (
    <Field label={filter.label} htmlFor={`filtru-${filter.name}`} className="w-full sm:w-48">
      <Select
        id={`filtru-${filter.name}`}
        options={options}
        value={value}
        onChange={(event) => onChange(event.target.value || null)}
      />
    </Field>
  );
}

interface ResourceFormModalProps<T> {
  open: boolean;
  row: T | null;
  fields: FieldDef[];
  endpoint: string;
  defaults?: Record<string, unknown>;
  itemName: string;
  onClose: () => void;
}

/** Modal de creare/modificare: formular react-hook-form pe două coloane. */
function ResourceFormModal<T>({
  open,
  row,
  fields,
  endpoint,
  defaults,
  itemName,
  onClose,
}: ResourceFormModalProps<T>) {
  const toast = useToast();
  const queryClient = useQueryClient();

  const form = useForm<FieldValues>();
  const editing = row !== null;

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    const source = row === null ? null : (row as unknown as Record<string, unknown>);
    form.reset(resourceDefaults(fields, source, defaults));
  }, [open, row, fields, defaults, form]);

  const values = form.watch();
  const visibleFields = fields.filter(
    (field) => !(editing && field.omitOnEdit) && (!field.showIf || field.showIf(values)),
  );

  const submit = form.handleSubmit(async (formValues) => {
    setSaving(true);
    try {
      const body = formValuesToBody(fields, formValues, editing);
      await api(editing ? `${endpoint}/${rowId(row)}` : endpoint, {
        method: editing ? "PATCH" : "POST",
        body: editing ? body : { ...(defaults ?? {}), ...body },
      });

      toast.success(editing ? `Am salvat modificările pentru ${itemName}.` : `Am adăugat ${itemName}.`);
      await queryClient.invalidateQueries({ queryKey: ["resource", endpoint] });
      onClose();
    } catch (error) {
      if (error instanceof ApiError && error.fields) {
        for (const [name, message] of Object.entries(error.fields)) {
          form.setError(name, { message });
        }
      }
      toast.error(error instanceof Error ? error.message : "Salvarea a eșuat.");
    } finally {
      setSaving(false);
    }
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`${editing ? "Editează" : "Adaugă"} ${itemName}`}
      className="max-w-2xl"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Anulează
          </Button>
          <Button variant="primary" loading={saving} onClick={() => void submit()}>
            Salvează
          </Button>
        </>
      }
    >
      <form className="grid grid-cols-1 gap-4 sm:grid-cols-2" onSubmit={submit}>
        {visibleFields.map((field) => (
          <ResourceFormField key={field.name} field={field} form={form} />
        ))}
      </form>
    </Modal>
  );
}

/** Pagina de resursă: listă + formular + confirmare de ștergere. */
export function ResourcePage<T>({
  title,
  description,
  endpoint,
  perm,
  columns,
  fields,
  filters,
  searchPlaceholder = "Caută…",
  detailPath,
  defaults,
  extraQuery,
  embedded = false,
  canDelete: allowDelete = true,
  rowActions,
  itemName,
  readOnly = false,
}: ResourcePageConfig<T>) {
  const toast = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const canCreate = useCan(`${perm}.create`) && !readOnly;
  const canUpdate = useCan(`${perm}.update`) && !readOnly;
  const canDelete = useCan(`${perm}.delete`) && allowDelete && !readOnly;

  const list = useListParams();
  const query = useMemo(() => ({ ...list.query, ...(extraQuery ?? {}) }), [list.query, extraQuery]);

  const { data, isLoading, error, refetch } = useQuery<{ items: T[]; total: number }>({
    queryKey: ["resource", endpoint, query],
    queryFn: () => api<{ items: T[]; total: number }>(endpoint, { query }),
  });

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<T | null>(null);
  const [deleting, setDeleting] = useState<T | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(row: T) {
    setEditing(row);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditing(null);
  }

  function handleSort(key: string) {
    if (key === list.sort) list.setSort(key, list.dir === "asc" ? "desc" : "asc");
    else list.setSort(key, "asc");
  }

  async function confirmDelete() {
    if (!deleting) return;

    setDeleteLoading(true);
    try {
      await api(`${endpoint}/${rowId(deleting)}`, { method: "DELETE" });
      toast.success(`Am șters ${itemName}.`);
      setDeleting(null);
      await queryClient.invalidateQueries({ queryKey: ["resource", endpoint] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ștergerea a eșuat.");
    } finally {
      setDeleteLoading(false);
    }
  }

  const actionColumn: DataTableColumn<T> = {
    key: "actions",
    header: "Acțiuni",
    align: "right",
    hideOnMobile: true,
    render: (row: T) => (
      <div
        className="flex flex-wrap items-center justify-end gap-1"
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.stopPropagation()}
      >
        {rowActions?.(row)}
        {canUpdate ? (
          <Button variant="ghost" size="sm" onClick={() => openEdit(row)}>
            Editează
          </Button>
        ) : null}
        {canDelete ? (
          <Button variant="ghost" size="sm" onClick={() => setDeleting(row)}>
            Șterge
          </Button>
        ) : null}
      </div>
    ),
  };

  const tableColumns = canUpdate || canDelete || rowActions ? [...columns, actionColumn] : columns;

  return (
    <div className="space-y-4">
      {embedded ? null : (
        <PageHeader
          title={title}
          description={description}
          actions={
            canCreate ? (
              <Button variant="primary" onClick={openCreate}>
                Adaugă
              </Button>
            ) : undefined
          }
        />
      )}

      <div className="flex flex-wrap items-end gap-3">
        <div className="w-full sm:w-64">
          <Input
            value={list.qInput}
            onChange={(event) => list.setQ(event.target.value)}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
          />
        </div>

        {(filters ?? []).map((filter) => (
          <FilterSelect
            key={filter.name}
            filter={filter}
            value={list.filters[filter.name] ?? ""}
            onChange={(value) => list.setFilter(filter.name, value)}
          />
        ))}

        {embedded && canCreate ? (
          <Button variant="primary" onClick={openCreate}>
            Adaugă
          </Button>
        ) : null}
      </div>

      <DataTable
        columns={tableColumns}
        rows={data?.items ?? []}
        rowKey={(row: T) => rowId(row)}
        sort={list.sort ? { key: list.sort, dir: list.dir } : undefined}
        onSort={handleSort}
        onRowClick={
          readOnly
            ? undefined
            : detailPath
              ? (row: T) => navigate(detailPath(row))
              : openEdit
        }
        loading={isLoading}
        error={error}
        onRetry={() => void refetch()}
      />

      <Pagination page={list.page} pageSize={list.pageSize} total={data?.total ?? 0} onPage={list.setPage} />

      <ResourceFormModal
        open={formOpen}
        row={editing}
        fields={fields}
        endpoint={endpoint}
        defaults={defaults}
        itemName={itemName}
        onClose={closeForm}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        title={`Șterge ${itemName}`}
        message={`Sigur vrei să ștergi ${itemName}? Acțiunea este ireversibilă.`}
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
