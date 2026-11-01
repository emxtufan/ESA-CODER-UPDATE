/**
 * Seiful de credențiale (§7): listă de metadate peste `GET /vault` plus trei acțiuni pe
 * rând — dezvăluire (cu parola contului și, dacă e activ, cod TOTP), rotație și revocare.
 *
 * Secretul în clar trăiește doar în memoria modalului de dezvăluire: `POST /vault/:id/reveal`
 * e apelat direct în handler, niciodată prin `useQuery`, ca să nu ajungă în cache sau în URL.
 * Serverul fără cheie configurată răspunde 503 `vault_not_configured`, iar toast-ul preia
 * mesajul lui.
 */
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { Badge, Button, ConfirmDialog, Field, Input, Modal, useToast } from "@/components/ui";
import type { DataTableColumn } from "@/components/ui";
import { ResourcePage } from "@/components/resource/ResourcePage";
import type { FieldDef } from "@/components/resource/fields";
import { api, ApiError } from "@/lib/api";
import { useCan, useMe } from "@/lib/auth";
import { CREDENTIAL_TYPES } from "@shared/enums";

/** Un rând din listarea `GET /vault` (doar metadate; `secret_enc` nu părăsește serverul). */
export type VaultRow = {
  id: string;
  name: string;
  type: string;
  username: string | null;
  projectName: string | null;
  rotatedAt: string | null;
  revokedAt: string | null;
};

/** Coloanele listării: starea revocării e singura informație de risc. */
export const VAULT_COLUMNS: DataTableColumn<VaultRow>[] = [
  { key: "name", header: "Nume", sortable: true },
  { key: "type", header: "Tip" },
  { key: "username", header: "Utilizator", render: (row) => row.username ?? "—" },
  { key: "projectName", header: "Proiect", hideOnMobile: true, render: (row) => row.projectName ?? "—" },
  {
    key: "stare",
    header: "Stare",
    render: (row) =>
      row.revokedAt ? <Badge tone="danger">Revocat</Badge> : <Badge tone="success">Activ</Badge>,
  },
];

/** Câmpurile credențialei: `secret` apare doar la creare, restul sunt metadate. */
export const VAULT_FIELDS: FieldDef[] = [
  { name: "name", label: "Nume", type: "text", required: true },
  { name: "type", label: "Tip", type: "select", options: CREDENTIAL_TYPES, required: true },
  { name: "projectId", label: "Proiect", type: "relation", endpoint: "/projects" },
  { name: "serverId", label: "Server", type: "relation", endpoint: "/servers" },
  { name: "username", label: "Utilizator", type: "text" },
  { name: "secret", label: "Secret", type: "password", required: true, omitOnEdit: true },
  { name: "url", label: "URL", type: "url" },
  { name: "notes", label: "Note", type: "textarea", span: 2 },
];

/** Mesajul unei erori de API (serverul îl trimite deja în română). */
function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError && error.message) return error.message;
  return error instanceof Error && error.message ? error.message : fallback;
}

/** Cât timp secretul rămâne afișat înainte de a fi șters din memorie. */
const REVEAL_TTL_MS = 30_000;

interface RevealModalProps {
  credential: VaultRow | null;
  onClose: () => void;
}

/** Dezvăluirea secretului: parolă (+ cod TOTP), afișare temporară și copiere. */
function RevealModal({ credential, onClose }: RevealModalProps) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const totpEnabled = useMe().data?.user.totpEnabled ?? false;

  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [secret, setSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const hideTimer = useRef<number | null>(null);
  const credentialId = credential?.id ?? null;

  // La unmount secretul și temporizatorul dispar, indiferent cum s-a închis modalul.
  useEffect(() => {
    return () => {
      if (hideTimer.current !== null) window.clearTimeout(hideTimer.current);
      setPassword("");
      setCode("");
      setSecret(null);
      setError(null);
    };
  }, []);

  // Deschiderea altei credențiale pornește de la zero, fără resturi din rândul anterior.
  useEffect(() => {
    if (credentialId === null) return;
    setPassword("");
    setCode("");
    setSecret(null);
    setError(null);
  }, [credentialId]);

  function handleClose() {
    if (hideTimer.current !== null) {
      window.clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
    setPassword("");
    setCode("");
    setSecret(null);
    setError(null);
    onClose();
  }

  async function handleReveal() {
    if (!credential) return;

    setLoading(true);
    setError(null);
    try {
      const body = totpEnabled ? { password, code } : { password };
      const data = await api<{ secret: string }>(`/vault/${credential.id}/reveal`, {
        method: "POST",
        body,
      });

      setSecret(data.secret);
      setPassword("");
      setCode("");

      if (hideTimer.current !== null) window.clearTimeout(hideTimer.current);
      hideTimer.current = window.setTimeout(() => {
        hideTimer.current = null;
        setSecret(null);
      }, REVEAL_TTL_MS);

      await queryClient.invalidateQueries({ queryKey: ["resource", "/vault"] });
      toast.success("Secret dezvăluit.");
    } catch (err) {
      const message = errorMessage(err, "Dezvăluirea a eșuat.");
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  async function copySecret() {
    if (!secret) return;
    try {
      await navigator.clipboard.writeText(secret);
      toast.success("Secret copiat în clipboard.");
    } catch {
      toast.error("Copierea a eșuat.");
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    void handleReveal();
  }

  const canSubmit = password.length > 0 && (!totpEnabled || code.trim().length === 6);

  return (
    <Modal
      open={credential !== null}
      onClose={handleClose}
      title={credential ? `Arată secretul — ${credential.name}` : "Arată secretul"}
      footer={
        secret === null ? (
          <>
            <Button variant="ghost" onClick={handleClose} disabled={loading}>
              Anulează
            </Button>
            <Button
              variant="primary"
              loading={loading}
              disabled={!canSubmit}
              onClick={() => void handleReveal()}
            >
              Arată
            </Button>
          </>
        ) : (
          <Button variant="ghost" onClick={handleClose}>
            Închide
          </Button>
        )
      }
    >
      {secret === null ? (
        <form className="grid grid-cols-1 gap-4" onSubmit={handleSubmit}>
          <Field
            label="Parola ta"
            htmlFor="reveal-password"
            required
            hint="Se cere pentru fiecare dezvăluire; încercările sunt limitate."
          >
            <Input
              id="reveal-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </Field>

          {totpEnabled ? (
            <Field
              label="Cod de verificare"
              htmlFor="reveal-code"
              required
              hint="Codul din aplicația de autentificare (6 cifre)."
            >
              <Input
                id="reveal-code"
                inputMode="numeric"
                maxLength={6}
                autoComplete="one-time-code"
                value={code}
                onChange={(event) => setCode(event.target.value)}
              />
            </Field>
          ) : null}

          {error ? <p className="text-sm text-danger">{error}</p> : null}
        </form>
      ) : (
        <div className="grid gap-3">
          <p className="text-sm text-muted">
            Secretul se ascunde automat după 30 de secunde. Nu îl lăsa în clipboard mai mult
            decât e nevoie.
          </p>
          <div className="flex flex-wrap items-start gap-2">
            <code className="select-all break-all rounded-sm border border-line bg-bg px-3 py-2 text-sm text-text">
              {secret}
            </code>
            <Button variant="secondary" size="sm" onClick={() => void copySecret()}>
              Copiază
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

interface RotateModalProps {
  credential: VaultRow | null;
  onClose: () => void;
}

/** Rotația secretului: secret nou + parola contului curent. */
function RotateModal({ credential, onClose }: RotateModalProps) {
  const toast = useToast();
  const queryClient = useQueryClient();

  const [secret, setSecret] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const credentialId = credential?.id ?? null;

  useEffect(() => {
    if (credentialId === null) return;
    setSecret("");
    setPassword("");
    setError(null);
  }, [credentialId]);

  async function handleRotate() {
    if (!credential) return;

    setLoading(true);
    setError(null);
    try {
      await api(`/vault/${credential.id}/rotate`, {
        method: "POST",
        body: { secret, password },
      });

      toast.success(`Am rotit secretul credențialei „${credential.name}”.`);
      setSecret("");
      setPassword("");
      await queryClient.invalidateQueries({ queryKey: ["resource", "/vault"] });
      onClose();
    } catch (err) {
      const message = errorMessage(err, "Rotația a eșuat.");
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  const canSubmit = secret.length > 0 && password.length > 0;

  return (
    <Modal
      open={credential !== null}
      onClose={onClose}
      title={credential ? `Rotește secretul — ${credential.name}` : "Rotește secretul"}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Anulează
          </Button>
          <Button
            variant="primary"
            loading={loading}
            disabled={!canSubmit}
            onClick={() => void handleRotate()}
          >
            Rotește
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4">
        <Field
          label="Secret nou"
          htmlFor="rotate-secret"
          required
          hint="Secretul vechi rămâne doar în istoricul de audit, fără conținut."
        >
          <Input
            id="rotate-secret"
            type="password"
            autoComplete="new-password"
            value={secret}
            onChange={(event) => setSecret(event.target.value)}
          />
        </Field>

        <Field label="Parola ta" htmlFor="rotate-password" required hint="Confirmă identitatea.">
          <Input
            id="rotate-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </Field>

        {error ? <p className="text-sm text-danger">{error}</p> : null}
      </div>
    </Modal>
  );
}

/** Pagina seifului: listă de credențiale + dezvăluire, rotație și revocare. */
export default function VaultPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const canReveal = useCan("vault.reveal");

  const [revealing, setRevealing] = useState<VaultRow | null>(null);
  const [rotating, setRotating] = useState<VaultRow | null>(null);
  const [revoking, setRevoking] = useState<VaultRow | null>(null);
  const [revokeLoading, setRevokeLoading] = useState(false);

  async function confirmRevoke() {
    if (!revoking) return;

    setRevokeLoading(true);
    try {
      await api(`/vault/${revoking.id}/revoke`, { method: "POST" });
      toast.success(`Am revocat credențiala „${revoking.name}”.`);
      setRevoking(null);
      await queryClient.invalidateQueries({ queryKey: ["resource", "/vault"] });
    } catch (err) {
      toast.error(errorMessage(err, "Revocarea a eșuat."));
    } finally {
      setRevokeLoading(false);
    }
  }

  return (
    <>
      <ResourcePage<VaultRow>
        title="Seif"
        description="Credențialele sunt criptate AES-256-GCM, iar secretele se citesc doar prin dezvăluire cu parolă (+ cod 2FA), cu urmă în audit. Dacă serverul răspunde că seiful nu este configurat (503), lipsește cheia VAULT_MASTER_KEY din configurare."
        endpoint="/vault"
        perm="vault"
        itemName="credențial"
        columns={VAULT_COLUMNS}
        fields={VAULT_FIELDS}
        rowActions={(row) =>
          row.revokedAt ? null : (
            <div
              className="flex items-center gap-1"
              onClick={(event) => event.stopPropagation()}
              onKeyDown={(event) => event.stopPropagation()}
            >
              {canReveal ? (
                <Button variant="ghost" size="sm" onClick={() => setRevealing(row)}>
                  Arată
                </Button>
              ) : null}
              <Button variant="ghost" size="sm" onClick={() => setRotating(row)}>
                Rotește
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setRevoking(row)}>
                Revocă
              </Button>
            </div>
          )
        }
      />

      <RevealModal credential={revealing} onClose={() => setRevealing(null)} />

      <RotateModal credential={rotating} onClose={() => setRotating(null)} />

      <ConfirmDialog
        open={revoking !== null}
        title="Revocă credențiala"
        message={
          revoking
            ? `Sigur revoci credențiala „${revoking.name}”? Secretul nu va mai putea fi dezvăluit.`
            : ""
        }
        confirmLabel="Revocă"
        danger
        loading={revokeLoading}
        onConfirm={() => void confirmRevoke()}
        onCancel={() => setRevoking(null)}
      />
    </>
  );
}
