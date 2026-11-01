/** Autentificare: email + parolă, pas de cod 2FA și recuperarea parolei. */
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { z } from "zod";

import { Button, Card, Field, Input } from "@/components/ui";
import { api, ApiError } from "@/lib/api";

const loginSchema = z.object({
  email: z.string().min(1, "Emailul este obligatoriu").email("Email invalid"),
  password: z.string().min(1, "Parola este obligatorie"),
});

const mfaSchema = z.object({
  code: z.string().regex(/^\d{6}$/, "Codul are exact 6 cifre"),
});

const forgotSchema = z.object({
  email: z.string().min(1, "Emailul este obligatoriu").email("Email invalid"),
});

type LoginValues = z.infer<typeof loginSchema>;
type MfaValues = z.infer<typeof mfaSchema>;
type ForgotValues = z.infer<typeof forgotSchema>;
type Step = "login" | "mfa" | "forgot";

export function LoginPage() {
  const [step, setStep] = useState<Step>("login");
  const [serverError, setServerError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const loginForm = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });
  const mfaForm = useForm<MfaValues>({
    resolver: zodResolver(mfaSchema),
    defaultValues: { code: "" },
  });
  const forgotForm = useForm<ForgotValues>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: "" },
  });

  const goTo = (next: Step) => {
    setServerError(null);
    setInfo(null);
    setStep(next);
  };

  const finishLogin = async () => {
    await queryClient.invalidateQueries({ queryKey: ["me"] });
    navigate("/", { replace: true });
  };

  const onLogin = loginForm.handleSubmit(async (values) => {
    setServerError(null);
    setSubmitting(true);
    try {
      const result = await api<{ mfaRequired?: boolean }>("/auth/login", { method: "POST", body: values });
      if (result?.mfaRequired) {
        goTo("mfa");
        return;
      }
      await finishLogin();
    } catch (error) {
      setServerError(error instanceof ApiError ? error.message : "Autentificarea a eșuat. Încearcă din nou.");
    } finally {
      setSubmitting(false);
    }
  });

  const onMfa = mfaForm.handleSubmit(async (values) => {
    setServerError(null);
    setSubmitting(true);
    try {
      await api("/auth/2fa/verify", { method: "POST", body: { code: values.code } });
      await finishLogin();
    } catch (error) {
      setServerError(error instanceof ApiError ? error.message : "Codul nu a putut fi verificat.");
    } finally {
      setSubmitting(false);
    }
  });

  const onForgot = forgotForm.handleSubmit(async (values) => {
    setServerError(null);
    setSubmitting(true);
    try {
      await api("/auth/forgot-password", { method: "POST", body: { email: values.email } });
      setInfo("Dacă adresa există, ai primit un email");
    } catch (error) {
      setServerError(error instanceof ApiError ? error.message : "Cererea a eșuat. Încearcă din nou.");
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <Card className="w-full max-w-sm">
        <h1 className="text-lg font-semibold text-text">
          {step === "login" ? "Autentificare" : step === "mfa" ? "Verificare în doi pași" : "Recuperare parolă"}
        </h1>

        {step === "mfa" ? (
          <p className="mt-1 text-sm text-muted">Introdu codul de 6 cifre din aplicația de autentificare.</p>
        ) : null}

        {step === "forgot" && !info ? (
          <p className="mt-1 text-sm text-muted">Îți trimitem un link de resetare pe email.</p>
        ) : null}

        {serverError ? (
          <p role="alert" className="mt-4 rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-xs text-danger">
            {serverError}
          </p>
        ) : null}

        {info ? (
          <p role="status" className="mt-4 rounded-md border border-line bg-bg px-3 py-2 text-xs text-muted">
            {info}
          </p>
        ) : null}

        {step === "login" ? (
          <form className="mt-5 flex flex-col gap-3" onSubmit={onLogin} noValidate>
            <Field label="Email" htmlFor="email" required error={loginForm.formState.errors.email?.message}>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                invalid={Boolean(loginForm.formState.errors.email)}
                {...loginForm.register("email")}
              />
            </Field>

            <Field label="Parolă" htmlFor="password" required error={loginForm.formState.errors.password?.message}>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                invalid={Boolean(loginForm.formState.errors.password)}
                {...loginForm.register("password")}
              />
            </Field>

            <Button type="submit" loading={submitting} className="mt-1">
              Autentificare
            </Button>

            <button
              type="button"
              onClick={() => goTo("forgot")}
              className="self-center text-xs text-muted hover:text-text"
            >
              Am uitat parola
            </button>
          </form>
        ) : null}

        {step === "mfa" ? (
          <form className="mt-5 flex flex-col gap-3" onSubmit={onMfa} noValidate>
            <Field label="Cod de verificare" htmlFor="code" required error={mfaForm.formState.errors.code?.message}>
              <Input
                id="code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                invalid={Boolean(mfaForm.formState.errors.code)}
                {...mfaForm.register("code")}
              />
            </Field>

            <Button type="submit" loading={submitting} className="mt-1">
              Verifică
            </Button>

            <button type="button" onClick={() => goTo("login")} className="self-center text-xs text-muted hover:text-text">
              Anulează
            </button>
          </form>
        ) : null}

        {step === "forgot" ? (
          <form className="mt-5 flex flex-col gap-3" onSubmit={onForgot} noValidate>
            <Field label="Email" htmlFor="forgot-email" required error={forgotForm.formState.errors.email?.message}>
              <Input
                id="forgot-email"
                type="email"
                autoComplete="email"
                invalid={Boolean(forgotForm.formState.errors.email)}
                {...forgotForm.register("email")}
              />
            </Field>

            <Button type="submit" loading={submitting} className="mt-1">
              Trimite linkul
            </Button>

            <button type="button" onClick={() => goTo("login")} className="self-center text-xs text-muted hover:text-text">
              Înapoi la autentificare
            </button>
          </form>
        ) : null}
      </Card>
    </div>
  );
}

export default LoginPage;
