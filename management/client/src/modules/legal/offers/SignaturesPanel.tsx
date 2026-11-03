/** Panoul de semnare electronică: trimitere spre semnare, urmărire stare, retrimitere și anulare. */
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { formatDate } from "@/components/resource/fields";
import {
  Badge,
  Button,
  Card,
  Checkbox,
  ConfirmDialog,
  EmptyState,
  Input,
  Modal,
  useToast,
} from "@/components/ui";
import { api } from "@/lib/api";
import type { DossierDocType } from "@shared/offers";

import { LabeledField } from "./Inputs";

type SignatureStatus = "sent" | "viewed" | "signed" | "cancelled";

interface Row {
  id: string;
  status: SignatureStatus;
  signerEmail: string;
  signerName: string;
  docs: { title: string; signedPdfKey?: string }[];
  createdAt: string;
  viewedAt: string | null;
  signedAt: string | null;
  signedName: string | null;
  signedRole: string | null;
  signedIp: string | null;
  signedUa: string | null;
  expiresAt: string | null;
}

const STATUS: Record<SignatureStatus, { tone: "warning" | "info" | "success" | "neutral"; label: string }> = {
  sent: { tone: "warning", label: "Trimis" },
  viewed: { tone: "info", label: "Văzut" },
  signed: { tone: "success", label: "Semnat" },
  cancelled: { tone: "neutral", label: "Anulat" },
};

const SMTP_ERROR = "Cererea e creată, dar e-mailul n-a plecat. Verifică SMTP și apasă Retrimite.";

export function SignaturesPanel(props: {
  offerId: string;
  contractId?: string | null;
  canCreate: boolean;
  available: { type: DossierDocType; label: string }[];
  defaultEmail: string;
  defaultName: string;
  buildDocs: (types: DossierDocType[]) => Promise<{ title: string; html: string }[]>;
}) {
  const queryClient = useQueryClient();
  const toast = useToast();

  const [open, setOpen] = useState(false);
  const [types, setTypes] = useState<DossierDocType[]>([]);
  const [email, setEmail] = useState(props.defaultEmail);
  const [name, setName] = useState(props.defaultName);
  const [cancelId, setCancelId] = useState<string | null>(null);

  const signatures = useQuery({
    queryKey: ["signatures", props.offerId],
    queryFn: async () =>
      (await api<{ items: Row[] }>("/legal/signatures", { query: { offerId: props.offerId } })).items,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["signatures", props.offerId] });

  const send = useMutation({
    mutationFn: async (vars: { email: string; name: string; types: DossierDocType[] }) => {
      const docs = await props.buildDocs(vars.types);
      return api<{ emailSent: boolean }>("/legal/signatures", {
        method: "POST",
        body: {
          offerId: props.offerId,
          contractId: props.contractId ?? undefined,
          email: vars.email,
          name: vars.name,
          docs,
        },
      });
    },
    onSuccess: (result, vars) => {
      setOpen(false);
      if (result.emailSent) toast.success(`Trimis la ${vars.email}`);
      else toast.error(SMTP_ERROR);
      void invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const resend = useMutation({
    mutationFn: (vars: { id: string; email: string }) =>
      api<{ emailSent: boolean }>(`/legal/signatures/${vars.id}/resend`, { method: "POST" }),
    onSuccess: (result, vars) => {
      if (result.emailSent) toast.success(`Trimis la ${vars.email}`);
      else toast.error(SMTP_ERROR);
      void invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const cancel = useMutation({
    mutationFn: (id: string) => api<{ ok: boolean }>(`/legal/signatures/${id}/cancel`, { method: "POST" }),
    onSuccess: () => {
      setCancelId(null);
      toast.success("Cerere de semnare anulată");
      void invalidate();
    },
    onError: (error: Error) => {
      setCancelId(null);
      toast.error(error.message);
    },
  });

  function openModal() {
    setTypes(props.available.map((item) => item.type));
    setEmail(props.defaultEmail);
    setName(props.defaultName);
    setOpen(true);
  }

  function toggle(type: DossierDocType, checked: boolean) {
    setTypes((current) => (checked ? [...current, type] : current.filter((item) => item !== type)));
  }

  function submit() {
    send.mutate({ email: email.trim(), name: name.trim(), types });
  }

  const rows = signatures.data ?? [];

  return (
    <Card
      title="Semnare electronică"
      description="Trimite documentele ofertei spre semnare și urmărește starea fiecărei cereri."
      actions={props.canCreate ? <Button onClick={openModal}>Trimite spre semnare</Button> : undefined}
    >
      {signatures.isLoading ? (
        <p className="text-sm text-muted">Se încarcă…</p>
      ) : signatures.isError ? (
        <p className="text-sm text-danger">
          {signatures.error instanceof Error ? signatures.error.message : "Eroare la încărcarea cererilor."}
        </p>
      ) : rows.length === 0 ? (
        <EmptyState
          title="Niciun document trimis spre semnare"
          description="După ce trimiți oferta spre semnare, cererile apar aici."
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-muted">
                <th className="py-2 pr-3 font-medium">Documente</th>
                <th className="py-2 pr-3 font-medium">Destinatar</th>
                <th className="py-2 pr-3 font-medium">Stare</th>
                <th className="py-2 pr-3 font-medium">Trimis</th>
                <th className="py-2 pr-3 font-medium">Semnat la</th>
                <th className="py-2 pr-3 font-medium">Semnatar</th>
                <th className="py-2 pr-3 font-medium">IP</th>
                <th className="py-2 font-medium">Acțiuni</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const status = STATUS[row.status];
                return (
                  <tr
                    key={row.id}
                    className="border-t border-border align-top"
                    title={`Browser: ${row.signedUa ?? "-"} · Văzut: ${row.viewedAt} · Expiră: ${row.expiresAt}`}
                  >
                    <td className="py-2 pr-3">
                      <ul className="space-y-1">
                        {row.docs.map((doc, index) => {
                          const signed = row.status === "signed" && Boolean(doc.signedPdfKey);
                          return (
                            <li key={`${row.id}-${index}`}>
                              <a
                                className="text-primary underline underline-offset-2"
                                href={`/api/legal/signatures/${row.id}/docs/${index}${signed ? "?signed=1" : ""}`}
                                target="_blank"
                                rel="noreferrer"
                              >
                                {doc.title} — {signed ? "PDF semnat" : "Original"}
                              </a>
                            </li>
                          );
                        })}
                      </ul>
                    </td>
                    <td className="py-2 pr-3">
                      <div className="text-text">{row.signerName}</div>
                      <div className="text-xs text-muted">{row.signerEmail}</div>
                    </td>
                    <td className="py-2 pr-3">
                      <Badge tone={status.tone}>{status.label}</Badge>
                    </td>
                    <td className="py-2 pr-3 text-text">{formatDate(row.createdAt)}</td>
                    <td className="py-2 pr-3 text-text">{formatDate(row.signedAt)}</td>
                    <td className="py-2 pr-3">
                      <div className="text-text">{row.signedName ?? "-"}</div>
                      <div className="text-xs text-muted">{row.signedRole ?? "-"}</div>
                    </td>
                    <td className="py-2 pr-3 text-xs text-muted">{row.signedIp ?? "-"}</td>
                    <td className="py-2">
                      {row.status === "sent" || row.status === "viewed" ? (
                        <div className="flex gap-2">
                          <Button
                            variant="secondary"
                            loading={resend.isPending && resend.variables?.id === row.id}
                            onClick={() => resend.mutate({ id: row.id, email: row.signerEmail })}
                          >
                            Retrimite
                          </Button>
                          <Button variant="ghost" onClick={() => setCancelId(row.id)}>
                            Anulează
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Trimite spre semnare"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={send.isPending}>
              Renunță
            </Button>
            <Button
              onClick={submit}
              loading={send.isPending}
              disabled={types.length === 0 || email.trim() === ""}
            >
              Trimite
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-text">Documente</p>
            {props.available.length === 0 ? (
              <p className="text-sm text-muted">Nu există documente disponibile spre semnare.</p>
            ) : (
              props.available.map((item) => (
                <Checkbox
                  key={item.type}
                  label={item.label}
                  checked={types.includes(item.type)}
                  onChange={(event) => toggle(item.type, event.target.checked)}
                />
              ))
            )}
          </div>
          <LabeledField label="Email" required>
            <Input
              type="email"
              value={email}
              placeholder="nume@exemplu.ro"
              onChange={(event) => setEmail(event.target.value)}
            />
          </LabeledField>
          <LabeledField label="Nume">
            <Input value={name} onChange={(event) => setName(event.target.value)} />
          </LabeledField>
        </div>
      </Modal>

      <ConfirmDialog
        open={cancelId !== null}
        title="Anulează cererea de semnare"
        message="Linkul trimis destinatarului nu va mai putea fi folosit. Vrei să anulezi cererea?"
        danger
        confirmLabel="Anulează cererea"
        loading={cancel.isPending}
        onConfirm={() => {
          if (cancelId) cancel.mutate(cancelId);
        }}
        onCancel={() => setCancelId(null)}
      />
    </Card>
  );
}
