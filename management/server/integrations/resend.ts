/**
 * Trimitere de email prin Resend. Fără configurare, aplicația nu blochează fluxul:
 * rezultatul e `not_configured` și apelantul decide ce face.
 */
import type { Env } from "../env";

const RESEND_ENDPOINT = "https://api.resend.com/emails";

export type EmailResult =
  | { status: "sent"; id: string }
  | { status: "not_configured" }
  | { status: "failed"; error: string };

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
}

/** Emailul e configurat doar dacă există și cheia API, și expeditorul. */
export function isEmailConfigured(env: Env): boolean {
  return Boolean(env.RESEND_API_KEY && env.EMAIL_FROM);
}

/** Trimite un email HTML; nu aruncă niciodată și nu expune cheia API în erori. */
export async function sendEmail(env: Env, { to, subject, html }: EmailMessage): Promise<EmailResult> {
  if (!isEmailConfigured(env)) return { status: "not_configured" };

  try {
    const response = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: env.EMAIL_FROM, to, subject, html }),
    });

    if (!response.ok) return { status: "failed", error: `HTTP ${response.status}` };

    const data = (await response.json()) as { id?: string };
    return { status: "sent", id: data.id ?? "" };
  } catch {
    return { status: "failed", error: "Cererea către Resend a eșuat" };
  }
}
