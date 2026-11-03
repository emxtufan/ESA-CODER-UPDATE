/**
 * Pagina publică de semnare (`/semnare/:token`), deschisă din linkul primit pe email:
 * starea cererii, PDF-urile documentelor, codul unic trimis pe email și semnătura
 * desenată. Nu are sesiune — tokenul din link e singura cheie de acces.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { useParams } from "react-router";

import { Button, Card, Checkbox, ErrorState, Field, Input, Modal, Spinner } from "@/components/ui";
import { api, ApiError } from "@/lib/api";

/** Răspunsul lui `GET /api/public/sign/:token`. */
interface SignState {
  status: "sent" | "viewed" | "signed";
  signerName: string;
  /** Adresa semnatarului, mascată de server. */
  signerEmail: string;
  provider: string;
  docs: Array<{ i: number; title: string }>;
  signedAt: string | null;
  signedName: string | null;
  expiresAt: string;
  acceptText: string;
}

/** Dimensiunea pad-ului de semnătură, în pixeli CSS (PNG-ul rămâne mic). */
const PAD_W = 600;
const PAD_H = 200;

/** Cât timp butonul „Retrimite codul" rămâne dezactivat (aceeași pauză ca pe server). */
const RESEND_SECONDS = 60;

/** Mesajul de eroare afișabil pentru o cerere eșuată. */
function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  return "Cererea a eșuat. Încearcă din nou.";
}

/** Pregătește canvas-ul: fundal alb, rezoluție după `devicePixelRatio` și stilul creionului. */
function prepare(canvas: HTMLCanvasElement): CanvasRenderingContext2D | null {
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const ratio = window.devicePixelRatio || 1;
  canvas.width = Math.round(PAD_W * ratio);
  canvas.height = Math.round(PAD_H * ratio);
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, PAD_W, PAD_H);
  ctx.lineWidth = 2.5;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = "#1d1d1f";
  return ctx;
}

interface SignaturePadProps {
  /** Primește semnătura ca data URL PNG sau `null` când pad-ul e gol. */
  onChange: (dataUrl: string | null) => void;
}

/** Pad-ul de semnătură: desenare cu degetul sau cu mouse-ul, ștergere completă. */
function SignaturePad({ onChange }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [empty, setEmpty] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) prepare(canvas);
  }, []);

  /** Coordonatele pointerului, aduse în sistemul de desenare (600×200 CSS px). */
  const pointOf = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * PAD_W,
      y: ((event.clientY - rect.top) / rect.height) * PAD_H,
    };
  };

  const startStroke = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const ctx = event.currentTarget.getContext("2d");
    if (!ctx) return;

    event.currentTarget.setPointerCapture(event.pointerId);
    drawing.current = true;

    const { x, y } = pointOf(event);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 0.1, y);
    ctx.stroke();
  };

  const stroke = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;

    const ctx = event.currentTarget.getContext("2d");
    if (!ctx) return;

    const { x, y } = pointOf(event);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const endStroke = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    drawing.current = false;
    setEmpty(false);
    onChange(event.currentTarget.toDataURL("image/png"));
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    prepare(canvas);
    setEmpty(true);
    onChange(null);
  };

  return (
    <div className="flex flex-col gap-2">
      <canvas
        ref={canvasRef}
        aria-label="Pad de semnătură"
        onPointerDown={startStroke}
        onPointerMove={stroke}
        onPointerUp={endStroke}
        onPointerCancel={endStroke}
        style={{ touchAction: "none" }}
        className="h-auto w-full max-w-[600px] touch-none rounded-lg border border-line bg-white"
      />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted">
          {empty ? "Desenează semnătura cu degetul sau cu mouse-ul." : "Semnătura a fost desenată."}
        </p>
        <Button variant="ghost" size="sm" onClick={clear}>
          Șterge
        </Button>
      </div>
    </div>
  );
}

/** Pagina publică de semnare, fără login și fără Layout. */
export function SignPage() {
  const { token = "" } = useParams();

  const [state, setState] = useState<SignState | null>(null);
  const [loadError, setLoadError] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);

  const [open, setOpen] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [signaturePng, setSignaturePng] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [resendIn, setResendIn] = useState(0);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [signing, setSigning] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  /** Starea cererii; prima vizualizare o marchează `viewed` pe server. */
  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      setState(await api<SignState>(`/public/sign/${encodeURIComponent(token)}`));
    } catch (error) {
      setLoadError(error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  // Numărătoarea inversă pentru „Retrimite codul".
  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = window.setTimeout(() => setResendIn((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [resendIn]);

  /** Adresa PDF-ului unui document din pachet. */
  const docUrl = (i: number) => `/api/public/sign/${encodeURIComponent(token)}/docs/${i}`;

  /** Deschide popup-ul de semnare, cu numele semnatarului precompletat. */
  const openModal = () => {
    setAccepted(false);
    setName(state?.signerName ?? "");
    setRole("");
    setSignaturePng(null);
    setSentTo(null);
    setCode("");
    setResendIn(0);
    setFormError(null);
    setOpen(true);
  };

  /** Verificările locale cerute înainte de codul pe email și înainte de semnare. */
  const validate = (): string | null => {
    if (!accepted) return "Trebuie să accepți declarația pentru a semna.";
    if (name.trim().length < 2) return "Completează numele complet.";
    if (!signaturePng) return "Desenează semnătura în chenar.";
    return null;
  };

  const sendOtp = async () => {
    const problem = validate();
    if (problem) {
      setFormError(problem);
      return;
    }

    setFormError(null);
    setSendingOtp(true);
    try {
      const result = await api<{ sentTo: string }>(`/public/sign/${encodeURIComponent(token)}/otp`, {
        method: "POST",
      });
      setSentTo(result.sentTo);
      setResendIn(RESEND_SECONDS);
    } catch (error) {
      setFormError(errorMessage(error));
    } finally {
      setSendingOtp(false);
    }
  };

  const submit = async () => {
    const problem = validate();
    if (problem) {
      setFormError(problem);
      return;
    }
    if (!/^\d{6}$/.test(code)) {
      setFormError("Codul are exact 6 cifre.");
      return;
    }

    setFormError(null);
    setSigning(true);
    try {
      await api(`/public/sign/${encodeURIComponent(token)}/sign`, {
        method: "POST",
        body: {
          code,
          name: name.trim(),
          role: role.trim() || undefined,
          accepted: true,
          signaturePng,
        },
      });
      setOpen(false);
      await load();
    } catch (error) {
      setFormError(errorMessage(error));
    } finally {
      setSigning(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 py-10">
        <Spinner className="size-6 text-muted" />
      </div>
    );
  }

  if (!state) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 py-10">
        <ErrorState error={loadError} onRetry={() => void load()} />
      </div>
    );
  }

  if (state.status === "signed") {
    const signedAt = state.signedAt ? new Date(state.signedAt).toLocaleString("ro-RO") : "—";

    return (
      <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-4 px-4 py-10">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">{state.provider}</p>

        <Card title="Documente semnate">
          <p className="text-sm text-text">
            Documentele au fost semnate de {state.signedName} la {signedAt}.
          </p>

          <ul className="mt-4 flex flex-col">
            {state.docs.map((doc) => (
              <li
                key={doc.i}
                className="flex flex-wrap items-center justify-between gap-2 border-t border-line py-2 first:border-t-0"
              >
                <span className="min-w-0 text-sm text-text">{doc.title}</span>
                <a className="text-sm text-primary hover:underline" href={docUrl(doc.i)} download>
                  Descarcă
                </a>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-4 px-4 py-6 pb-28">
      <header className="flex flex-col gap-1">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">{state.provider}</p>
        <h1 className="text-lg font-semibold text-text">Documente spre semnare</h1>
        <p className="text-sm text-muted">
          Semnarea se face cu un cod trimis pe e-mail la {state.signerEmail}.
        </p>
      </header>

      {state.docs.map((doc) => (
        <Card
          key={doc.i}
          title={doc.title}
          actions={
            <a
              className="text-sm text-primary hover:underline"
              href={docUrl(doc.i)}
              target="_blank"
              rel="noreferrer"
            >
              Deschide PDF
            </a>
          }
          bodyClassName="p-3"
        >
          <iframe
            src={docUrl(doc.i)}
            title={doc.title}
            className="h-[80vh] w-full rounded-lg border border-line bg-white"
          />
        </Card>
      ))}

      <div className="fixed inset-x-0 bottom-0 border-t border-line bg-background px-4 py-3">
        <div className="mx-auto flex w-full max-w-3xl justify-end">
          <Button onClick={openModal}>Semnează</Button>
        </div>
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Semnează documentele"
        footer={
          <div className="flex w-full flex-wrap justify-end gap-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Renunță
            </Button>
            {sentTo ? (
              <>
                <Button variant="secondary" loading={sendingOtp} disabled={resendIn > 0} onClick={sendOtp}>
                  {resendIn > 0 ? `Retrimite codul (${resendIn}s)` : "Retrimite codul"}
                </Button>
                <Button loading={signing} onClick={submit}>
                  Semnează
                </Button>
              </>
            ) : (
              <Button loading={sendingOtp} onClick={sendOtp}>
                Trimite codul pe e-mail
              </Button>
            )}
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          {formError ? (
            <p
              role="alert"
              className="rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-xs text-danger"
            >
              {formError}
            </p>
          ) : null}

          <Checkbox
            checked={accepted}
            onChange={(event) => setAccepted(event.target.checked)}
            className="items-start"
            label={<span className="text-xs leading-relaxed text-muted">{state.acceptText}</span>}
          />

          <Field label="Nume complet" htmlFor="signer-name" required>
            <Input
              id="signer-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoComplete="name"
              maxLength={120}
            />
          </Field>

          <Field label="Funcție" htmlFor="signer-role" hint="Opțional.">
            <Input
              id="signer-role"
              value={role}
              onChange={(event) => setRole(event.target.value)}
              maxLength={120}
            />
          </Field>

          <Field label="Semnătură" required>
            <SignaturePad onChange={setSignaturePng} />
          </Field>

          {sentTo ? (
            <>
              <p className="rounded-md border border-line bg-bg px-3 py-2 text-xs text-muted">
                Am trimis un cod la {sentTo}
              </p>
              <Field label="Cod din e-mail" htmlFor="signer-code" required hint="6 cifre.">
                <Input
                  id="signer-code"
                  value={code}
                  onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                />
              </Field>
            </>
          ) : null}
        </div>
      </Modal>
    </div>
  );
}

export default SignPage;
