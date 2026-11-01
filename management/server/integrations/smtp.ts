/**
 * Trimitere de email prin SMTP. Fără configurare, aplicația nu blochează fluxul:
 * rezultatul e `not_configured` și apelantul decide ce face.
 */
import nodemailer from "nodemailer";
import type { Env } from "../env";

export type EmailResult =
  | { status: "sent"; id: string }
  | { status: "not_configured" }
  | { status: "failed"; error: string };

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
}

/** Emailul e configurat doar dacă există serverul, contul și expeditorul. */
export function isEmailConfigured(env: Env): boolean {
  return Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS && env.EMAIL_FROM);
}

/** Trimite un email HTML; nu aruncă niciodată. Eroarea conține doar codul, nu parola sau mesajul serverului. */
export async function sendEmail(env: Env, { to, subject, html }: EmailMessage): Promise<EmailResult> {
  if (!isEmailConfigured(env)) return { status: "not_configured" };

  // 465 = TLS direct; orice alt port trebuie să urce la TLS, altfel parola ar circula necriptat.
  const secure = env.SMTP_PORT === 465;
  try {
    const transport = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure,
      requireTLS: !secure,
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000,
    });
    const info = await transport.sendMail({ from: env.EMAIL_FROM, to, subject, html });
    return { status: "sent", id: info.messageId ?? "" };
  } catch (error) {
    const { responseCode, code } = error as { responseCode?: number; code?: string };
    return { status: "failed", error: `SMTP ${responseCode ?? code ?? "eroare"}` };
  }
}
