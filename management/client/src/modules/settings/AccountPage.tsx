import { useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  Badge,
  Button,
  Card,
  DataTable,
  Field,
  Input,
  PageHeader,
  Tabs,
  useToast,
} from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import { useMe } from "@/lib/auth";

const TAB_ITEMS = [
  { value: "profile", label: "Profil" },
  { value: "password", label: "Parolă" },
  { value: "two-factor", label: "2FA" },
  { value: "sessions", label: "Sesiuni" },
];

function getErrorMessage(err: unknown, fallback = "A apărut o eroare."): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return fallback;
}

/* ------------------------------------------------------------------ Profil */

function ProfileTab() {
  const { data } = useMe();
  const user = data?.user;

  const rows = [
    { label: "Nume", value: user?.name },
    { label: "Email", value: user?.email },
    { label: "Rol", value: user?.role },
  ];

  return (
    <Card title="Profil" description="Informațiile contului tău.">
      <dl className="grid gap-4">
        {rows.map((row) => (
          <div key={row.label} className="grid gap-1">
            <dt className="text-sm text-muted-foreground">{row.label}</dt>
            <dd className="text-sm font-medium">{row.value ?? "—"}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}

/* ------------------------------------------------------------------ Parolă */

const passwordSchema = z
  .object({
    current: z.string().min(1, "Parola actuală este obligatorie"),
    next: z.string().min(12, "Parola nouă trebuie să aibă minim 12 caractere"),
    confirm: z.string().min(1, "Confirmarea parolei este obligatorie"),
  })
  .refine((values) => values.next === values.confirm, {
    path: ["confirm"],
    message: "Parolele nu coincid",
  });

type PasswordValues = z.infer<typeof passwordSchema>;

function PasswordTab() {
  const toast = useToast();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { current: "", next: "", confirm: "" },
  });

  const mutation = useMutation({
    mutationFn: (values: { current: string; next: string }) =>
      api("/auth/change-password", { method: "POST", body: values }),
    onSuccess: () => {
      reset();
      toast.success("Parola a fost schimbată.");
    },
    onError: (err) =>
      toast.error(getErrorMessage(err, "Parola nu a putut fi schimbată.")),
  });

  const onSubmit = handleSubmit(({ current, next }) =>
    mutation.mutate({ current, next }),
  );

  return (
    <Card
      title="Schimbă parola"
      description="Parola nouă trebuie să aibă minim 12 caractere."
    >
      <form className="grid gap-4" onSubmit={onSubmit} noValidate>
        <Field
          label="Parola actuală"
          htmlFor="current-password"
          error={errors.current?.message}
          required
        >
          <Input
            id="current-password"
            type="password"
            autoComplete="current-password"
            invalid={Boolean(errors.current)}
            {...register("current")}
          />
        </Field>

        <Field
          label="Parola nouă"
          htmlFor="new-password"
          error={errors.next?.message}
          required
        >
          <Input
            id="new-password"
            type="password"
            autoComplete="new-password"
            invalid={Boolean(errors.next)}
            {...register("next")}
          />
        </Field>

        <Field
          label="Confirmă parola nouă"
          htmlFor="confirm-password"
          error={errors.confirm?.message}
          required
        >
          <Input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            invalid={Boolean(errors.confirm)}
            {...register("confirm")}
          />
        </Field>

        <div>
          <Button type="submit" loading={mutation.isPending}>
            Salvează parola
          </Button>
        </div>
      </form>
    </Card>
  );
}

/* --------------------------------------------------------------------- 2FA */

const twoFactorSetupSchema = z.object({
  password: z.string().min(1, "Parola este obligatorie"),
});

const twoFactorCodeSchema = z.object({
  code: z.string().min(1, "Codul este obligatoriu"),
});

const twoFactorDisableSchema = z.object({
  password: z.string().min(1, "Parola este obligatorie"),
  code: z.string().min(1, "Codul este obligatoriu"),
});

type TwoFactorSetupValues = z.infer<typeof twoFactorSetupSchema>;
type TwoFactorCodeValues = z.infer<typeof twoFactorCodeSchema>;
type TwoFactorDisableValues = z.infer<typeof twoFactorDisableSchema>;

type TwoFactorSetupResult = { secret: string; otpauthUrl: string };

function TwoFactorTab() {
  const { data } = useMe();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [setupData, setSetupData] = useState<TwoFactorSetupResult | null>(null);

  const isEnabled = Boolean(data?.user?.totpEnabled);

  const setupForm = useForm<TwoFactorSetupValues>({
    resolver: zodResolver(twoFactorSetupSchema),
    defaultValues: { password: "" },
  });
  const enableForm = useForm<TwoFactorCodeValues>({
    resolver: zodResolver(twoFactorCodeSchema),
    defaultValues: { code: "" },
  });
  const disableForm = useForm<TwoFactorDisableValues>({
    resolver: zodResolver(twoFactorDisableSchema),
    defaultValues: { password: "", code: "" },
  });

  const setupMutation = useMutation({
    mutationFn: (values: { password: string }) =>
      api<TwoFactorSetupResult>("/auth/2fa/setup", { method: "POST", body: values }),
    onSuccess: (result) => {
      setSetupData(result);
      setupForm.reset();
      toast.success("Secretul 2FA a fost generat.");
    },
    onError: (err) =>
      toast.error(getErrorMessage(err, "Secretul 2FA nu a putut fi generat.")),
  });

  const enableMutation = useMutation({
    mutationFn: (values: { code: string }) =>
      api("/auth/2fa/enable", { method: "POST", body: values }),
    onSuccess: async () => {
      setSetupData(null);
      enableForm.reset();
      await queryClient.invalidateQueries({ queryKey: ["me"] });
      toast.success("2FA a fost activat.");
    },
    onError: (err) =>
      toast.error(getErrorMessage(err, "Codul nu a putut fi validat.")),
  });

  const disableMutation = useMutation({
    mutationFn: (values: { password: string; code: string }) =>
      api("/auth/2fa/disable", { method: "POST", body: values }),
    onSuccess: async () => {
      disableForm.reset();
      await queryClient.invalidateQueries({ queryKey: ["me"] });
      toast.success("2FA a fost dezactivat.");
    },
    onError: (err) =>
      toast.error(getErrorMessage(err, "2FA nu a putut fi dezactivat.")),
  });

  if (isEnabled) {
    const onDisable = disableForm.handleSubmit((values) =>
      disableMutation.mutate(values),
    );

    return (
      <Card
        title="Autentificare în doi pași"
        description="2FA este activ pe acest cont."
      >
        <form className="grid gap-4" onSubmit={onDisable} noValidate>
          <Field
            label="Parola"
            htmlFor="disable-2fa-password"
            error={disableForm.formState.errors.password?.message}
            required
          >
            <Input
              id="disable-2fa-password"
              type="password"
              autoComplete="current-password"
              invalid={Boolean(disableForm.formState.errors.password)}
              {...disableForm.register("password")}
            />
          </Field>

          <Field
            label="Cod din aplicația de autentificare"
            htmlFor="disable-2fa-code"
            error={disableForm.formState.errors.code?.message}
            required
          >
            <Input
              id="disable-2fa-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              invalid={Boolean(disableForm.formState.errors.code)}
              {...disableForm.register("code")}
            />
          </Field>

          <div>
            <Button
              type="submit"
              variant="danger"
              loading={disableMutation.isPending}
            >
              Dezactivează 2FA
            </Button>
          </div>
        </form>
      </Card>
    );
  }

  const onSetup = setupForm.handleSubmit((values) =>
    setupMutation.mutate(values),
  );
  const onEnable = enableForm.handleSubmit((values) =>
    enableMutation.mutate(values),
  );

  return (
    <div className="grid gap-4">
      <Card
        title="Activează autentificarea în doi pași"
        description="Confirmă parola pentru a genera un secret TOTP."
      >
        <form className="grid gap-4" onSubmit={onSetup} noValidate>
          <Field
            label="Parola"
            htmlFor="setup-2fa-password"
            error={setupForm.formState.errors.password?.message}
            required
          >
            <Input
              id="setup-2fa-password"
              type="password"
              autoComplete="current-password"
              invalid={Boolean(setupForm.formState.errors.password)}
              {...setupForm.register("password")}
            />
          </Field>

          <div>
            <Button type="submit" loading={setupMutation.isPending}>
              Generează secretul
            </Button>
          </div>
        </form>
      </Card>

      {setupData && (
        <Card
          title="Secret 2FA"
          description="Adaugă secretul în aplicația de autentificare, apoi confirmă codul."
        >
          <div className="grid gap-3">
            <code className="select-all break-all rounded border p-2 text-xs">
              {setupData.secret}
            </code>
            <code className="select-all break-all rounded border p-2 text-xs">
              {setupData.otpauthUrl}
            </code>
          </div>
        </Card>
      )}

      <Card
        title="Confirmă codul"
        description="Introdu codul generat de aplicația de autentificare."
      >
        <form className="grid gap-4" onSubmit={onEnable} noValidate>
          <Field
            label="Cod"
            htmlFor="enable-2fa-code"
            error={enableForm.formState.errors.code?.message}
            required
          >
            <Input
              id="enable-2fa-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              invalid={Boolean(enableForm.formState.errors.code)}
              {...enableForm.register("code")}
            />
          </Field>

          <div>
            <Button type="submit" loading={enableMutation.isPending}>
              Activează 2FA
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

/* ---------------------------------------------------------------- Sesiuni */

type Session = {
  id: string;
  ip: string;
  userAgent: string;
  lastSeenAt: string;
  current: boolean;
};

function SessionsTab() {
  const queryClient = useQueryClient();
  const toast = useToast();

  const sessionsQuery = useQuery({
    queryKey: ["auth", "sessions"],
    queryFn: () => api<{ items: Session[] }>("/auth/sessions"),
  });

  const revokeMutation = useMutation({
    mutationFn: (id: string) => api(`/auth/sessions/${id}`, { method: "DELETE" }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["auth", "sessions"] });
      toast.success("Sesiunea a fost revocată.");
    },
    onError: (err) =>
      toast.error(getErrorMessage(err, "Sesiunea nu a putut fi revocată.")),
  });

  const columns: {
    key: string;
    header: string;
    render?: (row: Session) => ReactNode;
  }[] = [
    { key: "ip", header: "IP", render: (row) => row.ip ?? "—" },
    {
      key: "userAgent",
      header: "Dispozitiv",
      render: (row) => row.userAgent ?? "—",
    },
    {
      key: "lastSeenAt",
      header: "Ultima activitate",
      render: (row) =>
        row.lastSeenAt ? new Date(row.lastSeenAt).toLocaleString("ro-RO") : "—",
    },
    {
      key: "current",
      header: "Stare",
      render: (row) =>
        row.current ? <Badge tone="success">Sesiune curentă</Badge> : null,
    },
    {
      key: "actions",
      header: "Acțiuni",
      render: (row) => (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={row.current}
          loading={revokeMutation.isPending && revokeMutation.variables === row.id}
          onClick={() => revokeMutation.mutate(row.id)}
        >
          Revocă
        </Button>
      ),
    },
  ];

  return (
    <Card
      title="Sesiuni active"
      description="Dispozitivele conectate la acest cont."
    >
      <DataTable
        columns={columns}
        rows={sessionsQuery.data?.items ?? []}
        rowKey="id"
        loading={sessionsQuery.isLoading}
        error={sessionsQuery.error}
        onRetry={() => sessionsQuery.refetch()}
      />
    </Card>
  );
}

/* -------------------------------------------------------------------- Pagina */

export function AccountPage() {
  const [tab, setTab] = useState("profile");

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Cont"
        description="Profilul tău, securitatea contului și sesiunile active."
      />

      <Tabs items={TAB_ITEMS} value={tab} onChange={setTab} />

      {tab === "profile" && <ProfileTab />}
      {tab === "password" && <PasswordTab />}
      {tab === "two-factor" && <TwoFactorTab />}
      {tab === "sessions" && <SessionsTab />}
    </div>
  );
}

export default AccountPage;
