/** Setarea parolei dintr-un link de invitație sau de resetare. */
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useSearchParams } from "react-router";
import { z } from "zod";

import { Button, Card, Field, Input } from "@/components/ui";
import { api, ApiError } from "@/lib/api";

const resetSchema = z
  .object({
    password: z.string().min(12, "Parola trebuie să aibă minim 12 caractere"),
    confirm: z.string().min(12, "Parola trebuie să aibă minim 12 caractere"),
  })
  .refine((values) => values.password === values.confirm, {
    message: "Parolele nu coincid",
    path: ["confirm"],
  });

type ResetValues = z.infer<typeof resetSchema>;

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const isInvite = searchParams.get("invite") === "1";

  const [done, setDone] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: { password: "", confirm: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      await api("/auth/reset-password", { method: "POST", body: { token, password: values.password } });
      setDone(true);
    } catch (error) {
      setServerError(error instanceof ApiError ? error.message : "Cererea a eșuat. Încearcă din nou.");
    }
  });

  const title = isInvite ? "Activează contul" : "Parolă nouă";

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <Card className="w-full max-w-sm">
        <h1 className="text-lg font-semibold text-text">{title}</h1>

        {!token ? (
          <>
            <p className="mt-3 text-sm text-muted">Linkul este invalid sau a expirat.</p>
            <Link to="/login" className="mt-4 inline-block text-sm text-primary hover:underline">
              Înapoi la autentificare
            </Link>
          </>
        ) : done ? (
          <>
            <p className="mt-3 text-sm text-text">Parola a fost setată.</p>
            <Link to="/login" className="mt-4 inline-block text-sm text-primary hover:underline">
              Mergi la autentificare
            </Link>
          </>
        ) : (
          <form className="mt-5 flex flex-col gap-3" onSubmit={onSubmit} noValidate>
            {serverError ? (
              <p role="alert" className="rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-xs text-danger">
                {serverError}
              </p>
            ) : null}

            <Field label="Parolă" htmlFor="password" required hint="Minim 12 caractere." error={errors.password?.message}>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                invalid={Boolean(errors.password)}
                {...register("password")}
              />
            </Field>

            <Field label="Confirmă parola" htmlFor="confirm" required error={errors.confirm?.message}>
              <Input
                id="confirm"
                type="password"
                autoComplete="new-password"
                invalid={Boolean(errors.confirm)}
                {...register("confirm")}
              />
            </Field>

            <Button type="submit" loading={isSubmitting} className="mt-1">
              Salvează parola
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}

export default ResetPasswordPage;
