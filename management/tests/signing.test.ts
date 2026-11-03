/**
 * Fluxul complet de semnare electronică: pachetul trimis de admin, linkul public cu
 * token, codul OTP primit pe email, semnarea propriu-zisă și PDF-ul semnat.
 * Chromium e necesar pentru PDF-uri, deci testul se sare dacă lipsește.
 */
import { randomUUID } from "node:crypto";

import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { closePdfBrowser, renderPdf } from "../server/lib/pdf";
import { fillSignerName } from "../server/modules/legal/signing-public";
import { setup } from "./helpers";

/** SMTP e înlocuit cu un transport fals, ca să citim linkul și codul din emailurile trimise. */
const smtp = vi.hoisted(() => ({ sendMail: vi.fn(), createTransport: vi.fn() }));
vi.mock("nodemailer", () => ({ default: { createTransport: smtp.createTransport } }));

const HTML = `<!doctype html><html><body><p>Contract</p></body></html>`;
/** Document paginat ca cele din aplicație (`.pg` = o pagină A4), pentru previzualizare. */
const PAGED = `<!doctype html><html><head><style>.pg{width:210mm;height:297mm}</style></head><body><div id="pages"><section class="pg"><p>Contract</p></section><section class="pg"><p>Pagina 2</p></section></div></body></html>`;
const PNG = "data:image/png;base64,iVBORw0KGgo=";
const SIGNER = "semnatar@test.local";
/** Emailul mascat așteptat în răspunsurile publice: „s***@test.local”. */
const SIGNER_MASKED = "s***@test.local";

let available = true;
let skipReason = "";

/** Ultimul email „trimis” către o adresă (mock-ul păstrează toate apelurile). */
function lastEmail(to: string): { subject: string; html: string } {
  const call = smtp.sendMail.mock.calls.filter(([message]) => message.to === to).at(-1);
  if (!call) throw new Error(`Niciun email trimis către ${to}`);
  return call[0] as { subject: string; html: string };
}

/** Numele semnatarului e scris în document; restul HTML-ului rămâne neatins. */
describe("semnare: numele semnatarului", () => {
  const MARKUP = `<p>Prin: <span data-sign-name="client">……</span></p>`;

  it("înlocuiește marcajul cu numele și rolul, escapat", () => {
    const filled = fillSignerName(MARKUP, "Ion <Pop>", "Administrator");
    expect(filled).toContain("Ion &lt;Pop&gt;, Administrator");
    expect(filled).not.toContain("data-sign-name");
  });

  it("fără rol rămâne doar numele", () => {
    const filled = fillSignerName(MARKUP, "Ion <Pop>");
    expect(filled).toBe(`<p>Prin: Ion &lt;Pop&gt;</p>`);
  });

  it("documentul fără marcaj rămâne neschimbat", () => {
    expect(fillSignerName(HTML, "Ion Popescu")).toBe(HTML);
  });
});

describe("semnare: flux complet", () => {
  beforeAll(async () => {
    try {
      await renderPdf(HTML, { PDF_CHROMIUM_PATH: process.env.PDF_CHROMIUM_PATH });
    } catch (error) {
      available = false;
      skipReason = error instanceof Error ? error.message : String(error);
    }
  }, 60_000);
  afterAll(() => closePdfBrowser());

  it("link public, OTP, semnătură și PDF semnat", async (t) => {
    if (!available) return t.skip(`Chromium indisponibil: ${skipReason}`);

    const ctx = await setup();
    try {
      // SMTP configurat (altfel codul OTP nu poate fi „trimis”) și transport fals.
      ctx.env.SMTP_HOST = "mail.test.ro";
      ctx.env.SMTP_PORT = 587;
      ctx.env.SMTP_USER = "esa@test.ro";
      ctx.env.SMTP_PASS = "parola-secreta";
      ctx.env.EMAIL_FROM = "esa@test.ro";
      smtp.createTransport.mockReturnValue({ sendMail: smtp.sendMail });
      smtp.sendMail.mockResolvedValue({ messageId: "m1" });

      const cookie = await ctx.loginAs(await ctx.makeUser("super_admin"));

      // 1. Adminul trimite pachetul spre semnare; tokenul apare doar în linkul din email.
      const created = await ctx.api("/api/legal/signatures", {
        method: "POST",
        cookie,
        body: { email: SIGNER, name: "Ion Popescu", docs: [{ title: "Test", html: PAGED }] },
      });
      expect(created.status).toBe(201);
      expect(created.json.status).toBe("sent");
      expect(created.json.emailSent).toBe(true);
      const requestId = created.json.id as string;

      const token = /\/semnare\/([A-Za-z0-9_-]+)/.exec(lastEmail(SIGNER).html)?.[1];
      if (!token) throw new Error("Linkul de semnare lipsește din email");

      // 2. Prima vizualizare marchează cererea ca văzută; emailul rămâne mascat.
      const state = await ctx.api(`/api/public/sign/${token}`);
      expect(state.status).toBe(200);
      expect(state.json.status).toBe("viewed");
      expect(state.json.signerEmail).toBe(SIGNER_MASKED);
      expect(state.json.docs).toHaveLength(1);
      expect(state.json.otp).toBeNull();

      // 2b. Previzualizarea (și pe telefon): paginile ca imagini PNG, randate o dată, apoi din storage.
      const pages = await ctx.api(`/api/public/sign/${token}/docs/0/pages`);
      expect(pages.status).toBe(200);
      expect(pages.json.pages).toBe(2);
      const image = await fetch(`${ctx.url}/api/public/sign/${token}/docs/0/pages/2`);
      expect(image.status).toBe(200);
      expect(image.headers.get("content-type")).toBe("image/png");
      expect(Buffer.from(await image.arrayBuffer()).subarray(1, 4).toString()).toBe("PNG");
      expect((await ctx.api(`/api/public/sign/${token}/docs/0/pages`)).json.pages).toBe(2);
      expect((await fetch(`${ctx.url}/api/public/sign/${token}/docs/0/pages/3`)).status).toBe(404);
      expect((await fetch(`${ctx.url}/api/public/sign/${token}/docs/5/pages`)).status).toBe(404);

      // 3. Un singur cod pe minut: al doilea cerut imediat e refuzat.
      const otp = await ctx.api(`/api/public/sign/${token}/otp`, { method: "POST" });
      expect(otp.status).toBe(200);
      expect(otp.json.sentTo).toBe(SIGNER_MASKED);
      expect((await ctx.api(`/api/public/sign/${token}/otp`, { method: "POST" })).status).toBe(429);

      const otpMail = lastEmail(SIGNER);
      expect(otpMail.subject).toContain("Cod de semnare");
      const code = /Cod de semnare: (\d{6})/.exec(`${otpMail.subject} ${otpMail.html}`)?.[1];
      if (!code) throw new Error("Codul de semnare lipsește din email");

      // 3b. Pagina redeschisă (după citirea emailului) vede codul trimis, fără să ceară altul.
      const reopened = await ctx.api(`/api/public/sign/${token}`);
      expect(reopened.json.otp.sentTo).toBe(SIGNER_MASKED);
      expect(Date.parse(reopened.json.otp.expiresAt)).toBeGreaterThan(Date.now());
      expect(Date.parse(reopened.json.otp.resendAt)).toBeGreaterThan(Date.now());

      // 3c. Confirmarea emailului: codul greșit e refuzat, cel corect prelungește valabilitatea (~30 min).
      const verify = (c: string) => ctx.api(`/api/public/sign/${token}/otp/verify`, { method: "POST", body: { code: c } });
      expect((await verify("12")).status).toBe(422);
      const wrongVerify = await verify(code === "000000" ? "111111" : "000000");
      expect(wrongVerify.status).toBe(422);
      expect(wrongVerify.json.error.code).toBe("otp_wrong");
      const verified = await verify(code);
      expect(verified.status).toBe(200);
      expect(verified.json.verified).toBe(true);
      expect(Date.parse(verified.json.expiresAt)).toBeGreaterThan(Date.now() + 25 * 60_000);
      const afterVerify = await ctx.api(`/api/public/sign/${token}`);
      expect(afterVerify.json.otp.expiresAt).toBe(verified.json.expiresAt);

      const signBody = (code1: string) => ({
        code: code1,
        name: "Ion Popescu",
        role: "Administrator",
        accepted: true,
        signaturePng: PNG,
      });
      const sign = (body: unknown) =>
        ctx.api(`/api/public/sign/${token}/sign`, { method: "POST", body });

      // 4. Cod greșit și acceptare lipsă sunt refuzate.
      expect((await sign(signBody(code === "000000" ? "111111" : "000000"))).status).toBe(422);
      expect((await sign({ code, name: "Ion Popescu", role: "Administrator", signaturePng: PNG })).status).toBe(422);

      // 5. Semnarea corectă: 200, starea devine signed, a doua semnare e conflict.
      const signed = await sign(signBody(code));
      expect(signed.status).toBe(200);
      expect(signed.json.status).toBe("signed");
      const afterSign = await ctx.api(`/api/public/sign/${token}`);
      expect(afterSign.json.status).toBe("signed");
      expect(afterSign.json.signedName).toBe("Ion Popescu");
      expect(afterSign.json.otp).toBeNull();
      expect((await sign(signBody(code))).status).toBe(409);

      // 6. PDF-ul public e versiunea semnată; adminul vede datele semnării, fără hash-uri.
      const pdf = await fetch(`${ctx.url}/api/public/sign/${token}/docs/0`);
      expect(pdf.status).toBe(200);
      expect(pdf.headers.get("content-type")).toBe("application/pdf");
      expect(Buffer.from(await pdf.arrayBuffer()).subarray(0, 4).toString()).toBe("%PDF");

      const list = await ctx.api("/api/legal/signatures", { cookie });
      expect(list.status).toBe(200);
      const row = list.json.items.find((item: { id: string }) => item.id === requestId);
      expect(row).toBeDefined();
      expect(row.signedIp).toBeTruthy();
      expect(row.signedName).toBe("Ion Popescu");
      expect(row.tokenHash).toBeUndefined();
      expect(row.otpHash).toBeUndefined();
      expect(JSON.stringify(list.json)).not.toContain("tokenHash");
      expect(JSON.stringify(list.json)).not.toContain("otpHash");

      // 7. Un token care nu există dă 404, nu 500.
      expect((await ctx.api(`/api/public/sign/${randomUUID().replace(/-/g, "")}`)).status).toBe(404);
    } finally {
      await ctx.close();
    }
  }, 120_000);
});
