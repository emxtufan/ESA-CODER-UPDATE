/**
 * Configurarea aplicației, citită din environment (`.env` este încărcat de scriptul npm
 * cu `--env-file-if-exists`). În producție cheile de criptare/semnare sunt obligatorii;
 * în dev sunt opționale, dar dacă există sunt validate (ex. exact 64 caractere hex).
 */
import { z } from "zod";

/** Cheie AES-256-GCM / HMAC: exact 64 caractere hex (32 bytes). */
const hex64 = () => z.string().regex(/^[0-9a-f]{64}$/i, "Trebuie să fie exact 64 caractere hex");

/** Variabilele goale din `.env` sunt tratate ca „neconfigurat”, nu ca valoare invalidă. */
const optional = <T extends z.ZodType>(schema: T) =>
  z.preprocess((value) => (value === "" ? undefined : value), schema.optional());

const baseEnvSchema = z.object({
  // --- Aplicație ---
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  HOST: z.string().min(1).default("127.0.0.1"),
  PORT: z.coerce.number().int().min(1).max(65535).default(5100),
  APP_URL: optional(z.url()),

  // --- Bază de date ---
  /** Gol = PGlite local în `<DATA_DIR>/pg`. */
  DATABASE_URL: optional(z.string().min(1)),
  DATA_DIR: z.string().min(1).default("data"),

  // --- Criptare / semnare ---
  VAULT_MASTER_KEY: optional(hex64()),
  FILE_SIGNING_KEY: optional(hex64()),

  // --- Email (SMTP) ---
  SMTP_HOST: optional(z.string().min(1)),
  SMTP_PORT: z.coerce.number().int().min(1).max(65535).default(587),
  SMTP_USER: optional(z.string().min(1)),
  SMTP_PASS: optional(z.string().min(1)),
  EMAIL_FROM: optional(z.string().min(1)),

  // --- PDF pe server (Chromium headless) ---
  /** Calea către Chromium/Chrome; gol = Chromium-ul instalat de Playwright, apoi Chrome-ul sistemului. */
  PDF_CHROMIUM_PATH: optional(z.string().min(1)),

  // --- GitHub (API + webhooks) ---
  GITHUB_TOKEN: optional(z.string().min(1)),
  GITHUB_WEBHOOK_SECRET: optional(z.string().min(1)),

  // --- Storage S3-compatible (opțional; altfel storage local în DATA_DIR) ---
  S3_ENDPOINT: optional(z.url()),
  S3_BUCKET: optional(z.string().min(1)),
  S3_ACCESS_KEY: optional(z.string().min(1)),
  S3_SECRET_KEY: optional(z.string().min(1)),
});

/** În producție nu se pornește fără URL public și fără cheile de criptare/semnare. */
export const envSchema = baseEnvSchema.superRefine((env, ctx) => {
  if (env.NODE_ENV !== "production") return;

  for (const key of ["APP_URL", "VAULT_MASTER_KEY", "FILE_SIGNING_KEY"] as const) {
    if (!env[key]) {
      ctx.addIssue({
        code: "custom",
        message: "Obligatoriu în producție",
        path: [key],
      });
    }
  }
});

export type Env = z.infer<typeof envSchema>;

/**
 * Validează environment-ul și îl întoarce tipat. Aruncă la prima configurare invalidă,
 * cu toate problemele într-un singur mesaj (ca să nu pornească serverul pe jumătate configurat).
 */
export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const result = envSchema.safeParse(source);

  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `${issue.path.join(".") || "env"}: ${issue.message}`)
      .join("; ");
    throw new Error(`Configurare invalidă (.env): ${details}`);
  }

  return result.data;
}
