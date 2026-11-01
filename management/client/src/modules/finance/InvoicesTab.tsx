/**
 * Tab de facturi: listă embeddabilă (în proiect sau la client), formular RHF cu
 * linii de factură și detaliu cu plăți. API-ul lucrează în minor units, deci
 * formularul afișează lei și convertește la trimitere cu `Math.round(x * 100)`.
 */
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useFieldArray, useForm, type FieldErrors, type FieldPath } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";
import { useCan } from "@/lib/auth";
import {
  Badge,
  Button,
  ConfirmDialog,
  Field,
  Input,
  Modal,
  Select,
  Spinner,
  useToast,
  type DataTableColumn,
  type SelectOption,
} from "@/components/ui";
import {
  formatDate,
  formatMoney,
  statusTone,
  useRelationOptions,
  type FieldDef,
} from "@/components/resource/fields";
import { ResourcePage, type FilterDef } from "@/components/resource/ResourcePage";
import { CURRENCIES, INVOICE_STATUSES } from "@shared/enums";

/** Un rând din listarea `GET /invoices`. */
type InvoiceRow = {
  id: string;
  number: string;
  clientId: string | null;
  clientName: string | null;
  projectName: string | null;
  issueDate: string | null;
  dueDate: string | null;
  currency: string;
  subtotal: number;
  vat: number;
  total: number;
  status: string | null;
  paid: number;
  balance: number;
};

/** O linie de factură din `GET /invoices/:id`. */
type InvoiceItemRow = {
  description: string;
  quantity: string;
  unitPrice: number;
  vatRateBp: number;
  total: number;
};

/** O plată încasată pe factură. */
type PaymentRow = {
  id: string;
  amount: number;
  currency: string;
  paidAt: string;
  method: string | null;
  reference: string | null;
};

/** Detaliul complet al facturii (`GET /invoices/:id` → `{item}`). */
type InvoiceDetailItem = InvoiceRow & {
  projectId: string | null;
  externalId: string | null;
  items: InvoiceItemRow[];
  payments: PaymentRow[];
};

/** Valorile formularului: totul ca string, așa cum le întorc inputurile. */
type InvoiceLineValues = {
  description: string;
  quantity: string;
  unitPrice: string;
  vatRate: string;
};

type InvoiceFormValues = {
  number: string;
  clientId: string;
  projectId: string;
  issueDate: string;
  dueDate: string;
  currency: string;
  externalId: string;
  items: InvoiceLineValues[];
};

/** Câmpurile formularului de plată (suma în lei). */
type PaymentValues = {
  amount: string;
  paidAt: string;
  method: string;
  reference: string;
};

const CURRENCY_OPTIONS: SelectOption[] = CURRENCIES.map((currency) => ({
  value: currency,
  label: currency,
}));

const INVOICE_FILTERS: FilterDef[] = [
  { name: "status", label: "Status", options: INVOICE_STATUSES },
  { name: "currency", label: "Valută", options: CURRENCIES },
];

/** `ResourcePage` cere `fields`, dar lista e `readOnly`, deci formularul nu se deschide. */
const NO_FIELDS: FieldDef[] = [];

const INVOICE_COLUMNS: DataTableColumn<InvoiceRow>[] = [
  { key: "number", header: "Număr", sortable: true },
  { key: "clientName", header: "Client", render: (row) => row.clientName ?? "—" },
  {
    key: "projectName",
    header: "Proiect",
    hideOnMobile: true,
    render: (row) => row.projectName ?? "—",
  },
  { key: "issueDate", header: "Emisă", sortable: true, render: (row) => formatDate(row.issueDate) },
  {
    key: "dueDate",
    header: "Scadență",
    sortable: true,
    hideOnMobile: true,
    render: (row) => formatDate(row.dueDate),
  },
  {
    key: "total",
    header: "Total",
    align: "right",
    render: (row) => formatMoney(row.total, row.currency),
  },
  {
    key: "balance",
    header: "Sold",
    align: "right",
    render: (row) => formatMoney(row.balance, row.currency),
  },
  {
    key: "status",
    header: "Status",
    sortable: true,
    render: (row) => (row.status ? <Badge tone={statusTone(row.status)}>{row.status}</Badge> : "—"),
  },
];

/** Data de azi în formatul cerut de un input `date`. */
function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Number tolerant la input gol sau invalid (formularul lucrează cu string-uri). */
function toNumber(value: string): number {
  const parsed = Number(String(value).replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback;
}

/** Mesajul de eroare al unui câmp dintr-o linie de factură (`items.N.câmp`). */
function lineError(
  errors: FieldErrors<InvoiceFormValues>,
  index: number,
  name: keyof InvoiceLineValues,
): string | undefined {
  const list = errors.items;
  if (!Array.isArray(list)) return undefined;
  const entry = list[index] as FieldErrors<InvoiceLineValues> | undefined;
  const field = entry?.[name] as { message?: string } | undefined;
  return field?.message;
}

/** Valorile inițiale ale formularului de factură. */
function invoiceDefaults(clientId?: string, projectId?: string): InvoiceFormValues {
  return {
    number: "",
    clientId: clientId ?? "",
    projectId: projectId ?? "",
    issueDate: today(),
    dueDate: "",
    currency: "RON",
    externalId: "",
    items: [{ description: "", quantity: "1", unitPrice: "", vatRate: "21" }],
  };
}

/** Valorile inițiale ale formularului de plată (suma pornește de la sold). */
function paymentDefaults(balance = 0): PaymentValues {
  return {
    amount: balance > 0 ? (balance / 100).toFixed(2) : "",
    paidAt: today(),
    method: "",
    reference: "",
  };
}

/** Tab-ul de facturi; `projectId`/`clientId` se trimit ca filtre listei. */
export function InvoicesTab({ projectId, clientId }: { projectId?: string; clientId?: string }) {
  const canCreate = useCan("finance.create");

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);

  const extraQuery = useMemo(() => {
    const query: Record<string, string> = {};
    if (projectId) query.projectId = projectId;
    if (clientId) query.clientId = clientId;
    return query;
  }, [projectId, clientId]);

  function openCreate() {
    setEditingId(null);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditingId(null);
  }

  return (
    <div className="space-y-4">
      {canCreate ? (
        <div className="flex justify-end">
          <Button variant="primary" onClick={openCreate}>
            Factură nouă
          </Button>
        </div>
      ) : null}

      <ResourcePage<InvoiceRow>
        title="Facturi"
        endpoint="/invoices"
        perm="finance"
        itemName="factură"
        columns={INVOICE_COLUMNS}
        fields={NO_FIELDS}
        filters={INVOICE_FILTERS}
        extraQuery={extraQuery}
        readOnly
        embedded
        rowActions={(row) => (
          <Button variant="ghost" size="sm" onClick={() => setDetailId(row.id)}>
            Detalii
          </Button>
        )}
      />

      <InvoiceForm
        open={formOpen}
        invoiceId={editingId}
        clientId={clientId}
        projectId={projectId}
        onClose={closeForm}
      />

      <InvoiceDetail
        invoiceId={detailId}
        onClose={() => setDetailId(null)}
        onEdit={(id) => {
          setDetailId(null);
          setEditingId(id);
          setFormOpen(true);
        }}
      />
    </div>
  );
}

type InvoiceFormProps = {
  open: boolean;
  invoiceId: string | null;
  clientId?: string;
  projectId?: string;
  onClose(): void;
};

/** Creare/editare factură: antet + linii (`useFieldArray`) + totaluri live. */
function InvoiceForm({ open, invoiceId, clientId, projectId, onClose }: InvoiceFormProps) {
  const toast = useToast();
  const queryClient = useQueryClient();

  const form = useForm<InvoiceFormValues>({ defaultValues: invoiceDefaults(clientId, projectId) });
  const {
    fields: lineFields,
    append,
    remove,
  } = useFieldArray({ control: form.control, name: "items" });

  const clients = useRelationOptions("/clients", "companyName");
  const projects = useRelationOptions("/projects");

  const detailQuery = useQuery({
    queryKey: ["invoice", invoiceId],
    queryFn: () => api<{ item: InvoiceDetailItem }>(`/invoices/${invoiceId}`),
    enabled: open && !!invoiceId,
  });
  const editing = detailQuery.data?.item ?? null;

  useEffect(() => {
    if (!open) return;
    if (!invoiceId) {
      form.reset(invoiceDefaults(clientId, projectId));
      return;
    }
    if (!editing) return;

    form.reset({
      number: editing.number,
      clientId: editing.clientId ?? "",
      projectId: editing.projectId ?? "",
      issueDate: (editing.issueDate ?? "").slice(0, 10) || today(),
      dueDate: (editing.dueDate ?? "").slice(0, 10),
      currency: editing.currency || "RON",
      externalId: editing.externalId ?? "",
      items:
        editing.items.length > 0
          ? editing.items.map((line) => ({
              description: line.description,
              quantity: line.quantity,
              unitPrice: (line.unitPrice / 100).toFixed(2),
              vatRate: (line.vatRateBp / 100).toFixed(2),
            }))
          : invoiceDefaults(clientId, projectId).items,
    });
  }, [open, invoiceId, editing, clientId, projectId, form]);

  const saveMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      invoiceId
        ? api<{ item: InvoiceDetailItem }>(`/invoices/${invoiceId}`, { method: "PATCH", body })
        : api<{ item: InvoiceDetailItem }>("/invoices", { method: "POST", body }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resource", "/invoices"] });
      if (invoiceId) queryClient.invalidateQueries({ queryKey: ["invoice", invoiceId] });
      toast.success(invoiceId ? "Factura a fost actualizată." : "Factura a fost creată.");
      onClose();
    },
    onError: (error) => {
      if (error instanceof ApiError && error.fields) {
        for (const [name, message] of Object.entries(error.fields)) {
          form.setError(name as FieldPath<InvoiceFormValues>, { message });
        }
      }
      toast.error(errorMessage(error, "Salvarea facturii a eșuat."));
    },
  });

  const submit = form.handleSubmit((values) => {
    saveMutation.mutate({
      number: values.number.trim(),
      clientId: values.clientId,
      projectId: values.projectId || null,
      issueDate: values.issueDate,
      dueDate: values.dueDate,
      currency: values.currency,
      externalId: values.externalId.trim(),
      items: (values.items ?? []).map((line) => ({
        description: line.description.trim(),
        quantity: line.quantity,
        unitPrice: Math.round(toNumber(line.unitPrice) * 100),
        vatRateBp: Math.round(toNumber(line.vatRate) * 100),
      })),
    });
  });

  const errors = form.formState.errors;
  const currency = form.watch("currency") || "RON";
  const lines = form.watch("items") ?? [];
  const totals = lines.reduce(
    (acc, line) => {
      const net = Math.round((Math.round(toNumber(line.quantity) * 1000) * toNumber(line.unitPrice)) / 1000);
      const vat = Math.round((net * toNumber(line.vatRate)) / 100);
      return { net: acc.net + net, vat: acc.vat + vat };
    },
    { net: 0, vat: 0 },
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={invoiceId ? "Editează factura" : "Factură nouă"}
      className="max-w-3xl"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saveMutation.isPending}>
            Anulează
          </Button>
          <Button variant="primary" loading={saveMutation.isPending} onClick={() => void submit()}>
            Salvează
          </Button>
        </>
      }
    >
      {invoiceId && detailQuery.isLoading ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : invoiceId && detailQuery.error ? (
        <p className="text-sm text-danger">
          {errorMessage(detailQuery.error, "Nu am putut încărca factura.")}
        </p>
      ) : (
        <form noValidate onSubmit={submit} className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Număr" htmlFor="invoice-number" required error={errors.number?.message}>
              <Input
                id="invoice-number"
                invalid={Boolean(errors.number)}
                {...form.register("number", { required: "Numărul este obligatoriu." })}
              />
            </Field>

            <Field label="Client" htmlFor="invoice-client" required error={errors.clientId?.message}>
              <Select
                id="invoice-client"
                options={clients.options}
                placeholder={clients.loading ? "Se încarcă…" : "Alege clientul"}
                invalid={Boolean(errors.clientId)}
                {...form.register("clientId", { required: "Clientul este obligatoriu." })}
              />
            </Field>

            <Field label="Proiect" htmlFor="invoice-project">
              <Select
                id="invoice-project"
                options={[{ value: "", label: "—" }, ...projects.options]}
                invalid={Boolean(errors.projectId)}
                {...form.register("projectId")}
              />
            </Field>

            <Field label="Valută" htmlFor="invoice-currency">
              <Select
                id="invoice-currency"
                options={CURRENCY_OPTIONS}
                invalid={Boolean(errors.currency)}
                {...form.register("currency")}
              />
            </Field>

            <Field label="Data emiterii" htmlFor="invoice-issue-date">
              <Input
                id="invoice-issue-date"
                type="date"
                invalid={Boolean(errors.issueDate)}
                {...form.register("issueDate")}
              />
            </Field>

            <Field label="Scadență" htmlFor="invoice-due-date">
              <Input
                id="invoice-due-date"
                type="date"
                invalid={Boolean(errors.dueDate)}
                {...form.register("dueDate")}
              />
            </Field>
          </div>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-text">Linii factură</h3>

            {lineFields.map((lineField, index) => (
              <div key={lineField.id} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Field
                  label="Descriere"
                  htmlFor={`invoice-line-${index}-description`}
                  error={lineError(errors, index, "description")}
                  className="col-span-2"
                >
                  <Input
                    id={`invoice-line-${index}-description`}
                    invalid={Boolean(lineError(errors, index, "description"))}
                    {...form.register(`items.${index}.description`)}
                  />
                </Field>

                <Field
                  label="Cantitate"
                  htmlFor={`invoice-line-${index}-quantity`}
                  error={lineError(errors, index, "quantity")}
                >
                  <Input
                    id={`invoice-line-${index}-quantity`}
                    type="number"
                    step="0.001"
                    inputMode="decimal"
                    invalid={Boolean(lineError(errors, index, "quantity"))}
                    {...form.register(`items.${index}.quantity`)}
                  />
                </Field>

                <Field
                  label="Preț unitar (lei)"
                  htmlFor={`invoice-line-${index}-unit-price`}
                  error={lineError(errors, index, "unitPrice")}
                >
                  <Input
                    id={`invoice-line-${index}-unit-price`}
                    type="number"
                    step="0.01"
                    inputMode="decimal"
                    placeholder="0.00"
                    invalid={Boolean(lineError(errors, index, "unitPrice"))}
                    {...form.register(`items.${index}.unitPrice`)}
                  />
                </Field>

                <Field
                  label="TVA %"
                  htmlFor={`invoice-line-${index}-vat-rate`}
                  error={lineError(errors, index, "vatRate")}
                  className="col-span-2 sm:col-span-1"
                >
                  <Input
                    id={`invoice-line-${index}-vat-rate`}
                    type="number"
                    step="0.01"
                    inputMode="decimal"
                    invalid={Boolean(lineError(errors, index, "vatRate"))}
                    {...form.register(`items.${index}.vatRate`)}
                  />
                </Field>

                <div className="col-span-2 flex items-end justify-end sm:col-span-3">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={lineFields.length === 1}
                    onClick={() => remove(index)}
                  >
                    Șterge linia
                  </Button>
                </div>
              </div>
            ))}

            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => append({ description: "", quantity: "1", unitPrice: "", vatRate: "21" })}
            >
              Adaugă linie
            </Button>
          </section>

          <div className="flex flex-col items-end gap-1 border-t border-line pt-3">
            <TotalRow label="Net" value={formatMoney(Math.round(totals.net * 100), currency)} />
            <TotalRow label="TVA" value={formatMoney(Math.round(totals.vat * 100), currency)} />
            <TotalRow
              label="Total"
              value={formatMoney(Math.round((totals.net + totals.vat) * 100), currency)}
              strong
            />
          </div>
        </form>
      )}
    </Modal>
  );
}

type InvoiceDetailProps = {
  invoiceId: string | null;
  onClose(): void;
  onEdit(id: string): void;
};

/** Detaliul facturii: antet, linii, totaluri, plăți și acțiunile permise de status. */
function InvoiceDetail({ invoiceId, onClose, onEdit }: InvoiceDetailProps) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const canCreate = useCan("finance.create");
  const canUpdate = useCan("finance.update");
  const canDelete = useCan("finance.delete");

  const detailQuery = useQuery({
    queryKey: ["invoice", invoiceId],
    queryFn: () => api<{ item: InvoiceDetailItem }>(`/invoices/${invoiceId}`),
    enabled: !!invoiceId,
  });
  const item = detailQuery.data?.item ?? null;

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<PaymentRow | null>(null);
  const [payment, setPayment] = useState<PaymentValues>(paymentDefaults());

  useEffect(() => {
    if (!item) return;
    setPayment(paymentDefaults(item.balance));
  }, [item]);

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ["resource", "/invoices"] });
    if (invoiceId) queryClient.invalidateQueries({ queryKey: ["invoice", invoiceId] });
  }

  const issueMutation = useMutation({
    mutationFn: () => api(`/invoices/${invoiceId}/issue`, { method: "POST" }),
    onSuccess: () => {
      refresh();
      toast.success("Factura a fost emisă.");
    },
    onError: (err) => toast.error(errorMessage(err, "Emiterea facturii a eșuat.")),
  });

  const cancelMutation = useMutation({
    mutationFn: () => api(`/invoices/${invoiceId}/cancel`, { method: "POST" }),
    onSuccess: () => {
      refresh();
      toast.success("Factura a fost anulată.");
    },
    onError: (err) => toast.error(errorMessage(err, "Anularea facturii a eșuat.")),
  });

  const deleteMutation = useMutation({
    mutationFn: () => api(`/invoices/${invoiceId}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resource", "/invoices"] });
      setConfirmDelete(false);
      toast.success("Factura a fost ștearsă.");
      onClose();
    },
    onError: (err) => toast.error(errorMessage(err, "Ștergerea facturii a eșuat.")),
  });

  const addPaymentMutation = useMutation({
    mutationFn: () =>
      api("/payments", {
        method: "POST",
        body: {
          invoiceId,
          amount: Math.round(toNumber(payment.amount) * 100),
          paidAt: payment.paidAt,
          method: payment.method.trim(),
          reference: payment.reference.trim(),
        },
      }),
    onSuccess: () => {
      refresh();
      toast.success("Plata a fost înregistrată.");
    },
    onError: (err) => toast.error(errorMessage(err, "Înregistrarea plății a eșuat.")),
  });

  const deletePaymentMutation = useMutation({
    mutationFn: (paymentId: string) => api(`/payments/${paymentId}`, { method: "DELETE" }),
    onSuccess: () => {
      refresh();
      setPaymentToDelete(null);
      toast.success("Plata a fost ștearsă.");
    },
    onError: (err) => toast.error(errorMessage(err, "Ștergerea plății a eșuat.")),
  });

  function submitPayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    addPaymentMutation.mutate();
  }

  const status = item?.status ?? null;
  const isDraft = status === "Draft";
  const showPaymentForm = status === "Issued" || status === "Partially Paid" || status === "Overdue";
  const canCancel = showPaymentForm && (item?.paid ?? 0) === 0;
  const currency = item?.currency ?? "RON";

  return (
    <>
      <Modal
        open={invoiceId !== null}
        onClose={onClose}
        title={item ? `Factura ${item.number}` : "Factură"}
        className="max-w-3xl"
        footer={
          <>
            <Button variant="ghost" onClick={onClose}>
              Închide
            </Button>
            {item && canUpdate && isDraft ? (
              <Button variant="secondary" onClick={() => onEdit(item.id)}>
                Editează
              </Button>
            ) : null}
            {item && canDelete && isDraft ? (
              <Button variant="danger" onClick={() => setConfirmDelete(true)}>
                Șterge
              </Button>
            ) : null}
            {item && canUpdate && canCancel ? (
              <Button
                variant="danger"
                loading={cancelMutation.isPending}
                onClick={() => cancelMutation.mutate()}
              >
                Anulează
              </Button>
            ) : null}
            {item && canUpdate && isDraft ? (
              <Button
                variant="primary"
                loading={issueMutation.isPending}
                onClick={() => issueMutation.mutate()}
              >
                Emite
              </Button>
            ) : null}
          </>
        }
      >
        {detailQuery.isLoading ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : detailQuery.error ? (
          <p className="text-sm text-danger">
            {errorMessage(detailQuery.error, "Nu am putut încărca factura.")}
          </p>
        ) : !item ? (
          <p className="text-sm text-muted">Factura nu a fost găsită.</p>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-text">{item.number}</h3>
              {item.status ? <Badge tone={statusTone(item.status)}>{item.status}</Badge> : null}
            </div>

            <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted">Client</dt>
                <dd className="text-text">{item.clientName ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-muted">Proiect</dt>
                <dd className="text-text">{item.projectName ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-muted">Emisă</dt>
                <dd className="text-text">{formatDate(item.issueDate)}</dd>
              </div>
              <div>
                <dt className="text-muted">Scadență</dt>
                <dd className="text-text">{formatDate(item.dueDate)}</dd>
              </div>
            </dl>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted">
                    <th className="pb-2 font-medium">Descriere</th>
                    <th className="pb-2 text-right font-medium">Cantitate</th>
                    <th className="pb-2 text-right font-medium">Preț unitar</th>
                    <th className="pb-2 text-right font-medium">TVA</th>
                    <th className="pb-2 text-right font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {item.items.map((line, index) => (
                    <tr key={`${index}-${line.description}`} className="border-t border-line">
                      <td className="py-2 pr-3 text-text">{line.description}</td>
                      <td className="py-2 text-right text-text">{line.quantity}</td>
                      <td className="py-2 text-right text-text">
                        {formatMoney(line.unitPrice, currency)}
                      </td>
                      <td className="py-2 text-right text-text">{`${line.vatRateBp / 100}%`}</td>
                      <td className="py-2 text-right text-text">{formatMoney(line.total, currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col items-end gap-1 border-t border-line pt-3">
              <TotalRow label="Subtotal" value={formatMoney(item.subtotal, currency)} />
              <TotalRow label="TVA" value={formatMoney(item.vat, currency)} />
              <TotalRow label="Total" value={formatMoney(item.total, currency)} strong />
              <TotalRow label="Încasat" value={formatMoney(item.paid, currency)} />
              <TotalRow label="Sold" value={formatMoney(item.balance, currency)} />
            </div>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-text">Plăți</h3>

              {item.payments.length === 0 ? (
                <p className="text-sm text-muted">Nicio plată înregistrată.</p>
              ) : (
                <ul className="space-y-2">
                  {item.payments.map((entry) => (
                    <li
                      key={entry.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-line p-3"
                    >
                      <span className="text-sm text-text">
                        {formatMoney(entry.amount, entry.currency)} · {formatDate(entry.paidAt)}
                        {entry.method ? ` · ${entry.method}` : ""}
                        {entry.reference ? ` · ${entry.reference}` : ""}
                      </span>
                      {canDelete ? (
                        <Button variant="ghost" size="sm" onClick={() => setPaymentToDelete(entry)}>
                          Șterge
                        </Button>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}

              {showPaymentForm && canCreate ? (
                <form noValidate onSubmit={submitPayment} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field
                    label="Sumă (lei)"
                    htmlFor="invoice-payment-amount"
                    required
                    hint="Implicit soldul rămas; se trimite în bani (×100)."
                  >
                    <Input
                      id="invoice-payment-amount"
                      type="number"
                      step="0.01"
                      inputMode="decimal"
                      value={payment.amount}
                      onChange={(event) =>
                        setPayment((prev) => ({ ...prev, amount: event.target.value }))
                      }
                    />
                  </Field>

                  <Field label="Data plății" htmlFor="invoice-payment-date" required>
                    <Input
                      id="invoice-payment-date"
                      type="date"
                      value={payment.paidAt}
                      onChange={(event) =>
                        setPayment((prev) => ({ ...prev, paidAt: event.target.value }))
                      }
                    />
                  </Field>

                  <Field label="Metodă" htmlFor="invoice-payment-method">
                    <Input
                      id="invoice-payment-method"
                      value={payment.method}
                      onChange={(event) =>
                        setPayment((prev) => ({ ...prev, method: event.target.value }))
                      }
                    />
                  </Field>

                  <Field label="Referință" htmlFor="invoice-payment-reference">
                    <Input
                      id="invoice-payment-reference"
                      value={payment.reference}
                      onChange={(event) =>
                        setPayment((prev) => ({ ...prev, reference: event.target.value }))
                      }
                    />
                  </Field>

                  <div className="sm:col-span-2">
                    <Button
                      type="submit"
                      variant="secondary"
                      disabled={!payment.amount || !payment.paidAt}
                      loading={addPaymentMutation.isPending}
                    >
                      Înregistrează plata
                    </Button>
                  </div>
                </form>
              ) : null}
            </section>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={confirmDelete}
        title="Șterge factura"
        message={item ? `Sigur ștergi factura ${item.number}? Acțiunea este ireversibilă.` : ""}
        confirmLabel="Șterge"
        danger
        loading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate()}
        onCancel={() => {
          if (!deleteMutation.isPending) setConfirmDelete(false);
        }}
      />

      <ConfirmDialog
        open={paymentToDelete !== null}
        title="Șterge plata"
        message={
          paymentToDelete
            ? `Sigur ștergi plata de ${formatMoney(paymentToDelete.amount, paymentToDelete.currency)}?`
            : ""
        }
        confirmLabel="Șterge"
        danger
        loading={deletePaymentMutation.isPending}
        onConfirm={() => {
          if (paymentToDelete) deletePaymentMutation.mutate(paymentToDelete.id);
        }}
        onCancel={() => {
          if (!deletePaymentMutation.isPending) setPaymentToDelete(null);
        }}
      />
    </>
  );
}

/** O linie de total din antetul de sume (etichetă + valoare formatată). */
function TotalRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-end gap-3 text-sm">
      <span className="text-muted">{label}</span>
      <span className={strong ? "font-semibold text-text" : "text-text"}>{value}</span>
    </div>
  );
}
