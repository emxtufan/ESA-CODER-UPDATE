/**
 * Pagina publică de semnare (`/semnare/:token`), deschisă din linkul primit pe email:
 * documentele (toate paginile, din HTML-ul lor), confirmarea emailului cu un cod unic
 * și semnătura desenată. Nu are sesiune — tokenul din link e singura cheie de acces.
 *
 * Linkul se deschide des în browserul din aplicația de email (Yahoo, Gmail), care se închide
 * când semnatarul iese să citească codul. De aceea codul se cere primul, înainte de orice
 * completare, iar pagina redeschisă cere direct codul deja trimis (`otp` din starea cererii).
 */
import { useCallback, useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { useParams } from "react-router";

import { Button, Card, Checkbox, ErrorState, Field, Input, Modal, Spinner } from "@/components/ui";
import { api, ApiError } from "@/lib/api";

/** Codul trimis și încă valabil, din starea cererii. */
interface PendingOtp {
  sentTo: string;
  expiresAt: string;
  /** Din acest moment se poate cere un cod nou. */
  resendAt: string;
}

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
  otp: PendingOtp | null;
}

/** Dimensiunea pad-ului de semnătură, în pixeli CSS (PNG-ul rămâne mic). */
const PAD_W = 600;
const PAD_H = 200;

/** Mesajul de eroare afișabil pentru o cerere eșuată. */
function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  return "Cererea a eșuat. Încearcă din nou.";
}

/** Erorile după care codul nu mai poate fi folosit și trebuie cerut altul. */
const DEAD_CODE = new Set(["otp_expired", "rate_limited"]);

/**
 * Codul deja verificat, păstrat local până la semnare: dacă pagina se reîncarcă după confirmarea
 * emailului, semnatarul nu mai e întrebat de cod. Expiră odată cu codul de pe server.
 */
const savedKey = (token: string) => `esa-sign:${token}`;

function readSaved(token: string): string | null {
  try {
    const raw = window.localStorage.getItem(savedKey(token));
    const saved = raw ? (JSON.parse(raw) as { code?: string; until?: string }) : null;
    if (saved?.code && saved.until && Date.parse(saved.until) > Date.now()) return saved.code;
  } catch {
    // stocare indisponibilă (navigare privată) sau conținut invalid
  }
  clearSaved(token);
  return null;
}

function writeSaved(token: string, code: string, until: string): void {
  try {
    window.localStorage.setItem(savedKey(token), JSON.stringify({ code, until }));
  } catch {
    // fără stocare: codul se va cere din nou la reîncărcare
  }
}

function clearSaved(token: string): void {
  try {
    window.localStorage.removeItem(savedKey(token));
  } catch {
    // nimic de șters
  }
}

/**
 * Previzualizarea unui document: imaginile paginilor, randate pe server exact ca PDF-ul.
 * Pe telefon, un PDF într-un iframe arată doar prima pagină (iOS) sau nimic (browserele din
 * aplicațiile de email), iar HTML-ul micșorat iese din pagină (mărimea minimă a textului,
 * zoom-ul de text al sistemului). Imaginile se încarcă pe măsură ce semnatarul derulează.
 */
function DocPages({ apiPath, fileBase, title }: { apiPath: string; fileBase: string; title: string }) {
  const [count, setCount] = useState<number | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    setCount(null);
    setFailed(false);
    api<{ pages: number }>(`${apiPath}/pages`)
      .then((result) => alive && setCount(result.pages))
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, [apiPath]);

  if (failed) {
    return (
      <p className="px-2 py-6 text-center text-sm text-muted">
        Previzualizarea nu e disponibilă acum. Deschide PDF-ul de mai jos.
      </p>
    );
  }

  if (count === null) {
    return (
      <div className="flex aspect-[210/297] w-full flex-col items-center justify-center gap-2 rounded-md border border-line bg-white">
        <Spinner className="size-5 text-muted" />
        <p className="text-xs text-muted">Se pregătește documentul…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: count }, (_, k) => (
        <img
          key={k}
          src={`${fileBase}/pages/${k + 1}`}
          alt={`${title}, pagina ${k + 1} din ${count}`}
          loading={k < 2 ? "eager" : "lazy"}
          decoding="async"
          className="block aspect-[210/296.4] h-auto w-full rounded-md border border-line bg-white"
        />
      ))}
    </div>
  );
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

/** Pasul din fereastra de semnare: întâi confirmarea emailului, apoi semnătura. */
type Step = "email" | "sign";

/** Pagina publică de semnare, fără login și fără Layout. */
export function SignPage() {
  const { token = "" } = useParams();

  const [state, setState] = useState<SignState | null>(null);
  const [loadError, setLoadError] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("email");
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [resendAt, setResendAt] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [code, setCode] = useState("");
  /** Codul confirmat la pasul 1, trimis din nou la semnare. */
  const [verifiedCode, setVerifiedCode] = useState<string | null>(null);

  const [accepted, setAccepted] = useState(false);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [signaturePng, setSignaturePng] = useState<string | null>(null);

  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [signing, setSigning] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const resendIn = Math.max(0, Math.ceil((resendAt - now) / 1000));

  /**
   * Starea cererii; prima vizualizare o marchează `viewed` pe server. La deschiderea paginii,
   * un cod deja trimis (semnatarul a ieșit să citească emailul) deschide direct fereastra de cod,
   * iar un cod deja confirmat sare direct la semnătură.
   */
  const load = useCallback(
    async (resume: boolean) => {
      setLoading(true);
      setLoadError(null);
      try {
        const next = await api<SignState>(`/public/sign/${encodeURIComponent(token)}`);
        setState(next);
        setName((current) => current || next.signerName || "");
        if (!resume || next.status === "signed") return;

        const saved = next.otp ? readSaved(token) : null;
        if (!next.otp) clearSaved(token);
        if (next.otp && saved) {
          setSentTo(next.otp.sentTo);
          setVerifiedCode(saved);
          setStep("sign");
          setOpen(true);
        } else if (next.otp) {
          setSentTo(next.otp.sentTo);
          setResendAt(Date.parse(next.otp.resendAt));
          setStep("email");
          setOpen(true);
        }
      } catch (error) {
        setLoadError(error);
      } finally {
        setLoading(false);
      }
    },
    [token],
  );

  useEffect(() => {
    void load(true);
  }, [load]);

  // Numărătoarea inversă pentru „Retrimite codul".
  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = window.setTimeout(() => setNow(Date.now()), 1000);
    return () => window.clearTimeout(timer);
  }, [resendIn, now]);

  /** Calea pentru `api()` (care adaugă singur `/api`) și adresa directă, pentru linkuri și iframe-uri. */
  const apiPath = `/public/sign/${encodeURIComponent(token)}`;
  const base = `/api${apiPath}`;
  /** Adresa PDF-ului unui document din pachet. */
  const docUrl = (i: number) => `${base}/docs/${i}`;

  /** Deschide fereastra de semnare; pad-ul pornește gol, restul datelor se păstrează. */
  const openModal = () => {
    setSignaturePng(null);
    setFormError(null);
    setNow(Date.now());
    setOpen(true);
  };

  /** Codul nu mai poate fi folosit: înapoi la pasul 1, cu un cod nou. */
  const restartEmailStep = (message: string) => {
    clearSaved(token);
    setVerifiedCode(null);
    setSentTo(null);
    setCode("");
    setStep("email");
    setFormError(message);
  };

  const sendOtp = async () => {
    setFormError(null);
    setSendingOtp(true);
    try {
      const result = await api<{ sentTo: string; resendAt: string }>(`${apiPath}/otp`, { method: "POST" });
      setSentTo(result.sentTo);
      setResendAt(Date.parse(result.resendAt));
      setNow(Date.now());
      setCode("");
    } catch (error) {
      setFormError(errorMessage(error));
    } finally {
      setSendingOtp(false);
    }
  };

  /** Pasul 1: confirmă codul; după asta semnatarul nu mai are de ce să iasă din pagină. */
  const verify = async () => {
    if (!/^\d{6}$/.test(code)) {
      setFormError("Codul are exact 6 cifre.");
      return;
    }
    setFormError(null);
    setVerifying(true);
    try {
      const result = await api<{ expiresAt: string }>(`${apiPath}/otp/verify`, { method: "POST", body: { code } });
      writeSaved(token, code, result.expiresAt);
      setVerifiedCode(code);
      setStep("sign");
    } catch (error) {
      if (error instanceof ApiError && DEAD_CODE.has(error.code)) restartEmailStep(error.message);
      else setFormError(errorMessage(error));
    } finally {
      setVerifying(false);
    }
  };

  /** Pasul 2: datele semnatarului și semnătura, cu codul confirmat. */
  const submit = async () => {
    if (!accepted) return setFormError("Trebuie să accepți declarația pentru a semna.");
    if (name.trim().length < 2) return setFormError("Completează numele complet.");
    if (!signaturePng) return setFormError("Desenează semnătura în chenar.");
    if (!verifiedCode) return restartEmailStep("Confirmă din nou adresa de e-mail.");

    setFormError(null);
    setSigning(true);
    try {
      await api(`${apiPath}/sign`, {
        method: "POST",
        body: { code: verifiedCode, name: name.trim(), role: role.trim() || undefined, accepted: true, signaturePng },
      });
      clearSaved(token);
      setOpen(false);
      await load(false);
    } catch (error) {
      if (error instanceof ApiError && (DEAD_CODE.has(error.code) || error.code === "otp_wrong")) {
        restartEmailStep(`${error.message}. Semnătura și datele rămân completate.`);
      } else {
        setFormError(errorMessage(error));
      }
    } finally {
      setSigning(false);
    }
  };

  if (loading && !state) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 py-10">
        <Spinner className="size-6 text-muted" />
      </div>
    );
  }

  if (!state) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 py-10">
        <ErrorState error={loadError} onRetry={() => void load(true)} />
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

  const codeInput = (
    <Field label="Cod din e-mail" htmlFor="signer-code" required hint="6 cifre.">
      <Input
        id="signer-code"
        value={code}
        onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
        onKeyDown={(event) => {
          if (event.key === "Enter") void verify();
        }}
        inputMode="numeric"
        autoComplete="one-time-code"
        autoFocus
        maxLength={6}
      />
    </Field>
  );

  let footer;
  if (step === "sign") {
    footer = (
      <>
        <Button variant="secondary" onClick={() => setOpen(false)}>
          Închide
        </Button>
        <Button loading={signing} onClick={submit}>
          Semnează
        </Button>
      </>
    );
  } else if (sentTo) {
    footer = (
      <>
        <Button variant="secondary" loading={sendingOtp} disabled={resendIn > 0} onClick={sendOtp}>
          {resendIn > 0 ? `Cod nou (${resendIn}s)` : "Trimite un cod nou"}
        </Button>
        <Button loading={verifying} onClick={verify}>
          Continuă
        </Button>
      </>
    );
  } else {
    footer = (
      <>
        <Button variant="secondary" onClick={() => setOpen(false)}>
          Renunță
        </Button>
        <Button loading={sendingOtp} onClick={sendOtp}>
          Trimite codul pe e-mail
        </Button>
      </>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-4 px-3 py-6 pb-28 sm:px-4">
      <header className="flex flex-col gap-1 px-1">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">{state.provider}</p>
        <h1 className="text-lg font-semibold text-text">Documente spre semnare</h1>
        <p className="text-sm text-muted">
          Citește documentele de mai jos, apoi apasă „Semnează”. Îți trimitem un cod pe e-mail la {state.signerEmail},
          iar după ce îl introduci desenezi semnătura.
        </p>
      </header>

      {state.docs.map((doc) => (
        <Card key={doc.i} title={doc.title} bodyClassName="flex flex-col gap-3 p-2 sm:p-3">
          <DocPages apiPath={`${apiPath}/docs/${doc.i}`} fileBase={docUrl(doc.i)} title={doc.title} />
          <a
            href={docUrl(doc.i)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-10 w-full items-center justify-center rounded-lg border border-line bg-white text-sm font-medium text-text hover:bg-bg"
          >
            Deschide PDF
          </a>
        </Card>
      ))}

      <div className="fixed inset-x-0 bottom-0 border-t border-line bg-background px-4 py-3">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3">
          <p className="min-w-0 text-xs text-muted">
            {sentTo && step === "email" ? `Cod trimis la ${sentTo}` : `${state.docs.length} documente`}
          </p>
          <Button onClick={openModal}>{sentTo && step === "email" ? "Introdu codul" : "Semnează"}</Button>
        </div>
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={step === "email" ? "Pasul 1 din 2: confirmă e-mailul" : "Pasul 2 din 2: semnătura"}
        footer={<div className="flex w-full flex-wrap justify-end gap-2">{footer}</div>}
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

          {step === "email" && !sentTo ? (
            <p className="text-sm text-text">
              Îți trimitem un cod de 6 cifre la <strong>{state.signerEmail}</strong>. Cu el confirmi că adresa îți
              aparține; după aceea completezi numele și desenezi semnătura.
            </p>
          ) : null}

          {step === "email" && sentTo ? (
            <>
              <p className="rounded-md border border-line bg-bg px-3 py-2 text-sm text-text">
                Am trimis codul la <strong>{sentTo}</strong>. Îl vezi și în subiectul e-mailului: „Cod de semnare: …”.
              </p>
              {codeInput}
              <p className="text-xs leading-relaxed text-muted">
                Dacă ieși din pagină ca să citești e-mailul, deschide din nou linkul de semnare: îți cerem direct codul
                primit, fără să trimitem altul. Codul e valabil 10 minute.
              </p>
            </>
          ) : null}

          {step === "sign" ? (
            <>
              <p className="rounded-md border border-success/30 bg-success-soft px-3 py-2 text-xs text-success">
                Adresa de e-mail a fost confirmată.
              </p>

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
            </>
          ) : null}
        </div>
      </Modal>
    </div>
  );
}

export default SignPage;
