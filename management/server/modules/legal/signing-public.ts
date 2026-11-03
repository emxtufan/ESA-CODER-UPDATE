/**
 * Rutele publice de semnare (linkul cu token din email): starea cererii, documentele
 * de descărcat, codul unic trimis pe email și semnarea propriu-zisă. Nu au sesiune:
 * tokenul din link e singura autentificare, iar fiecare semnătură cere un cod OTP
 * trimis pe adresa semnatarului. Documentele semnate primesc o pagină de certificat
 * cu datele semnării, iar PDF-ul rezultat e păstrat lângă original.
 */
import { createHash, randomInt, timingSafeEqual } from "node:crypto";

import { and, eq, ne } from "drizzle-orm";
import express, { Router } from "express";
import { z } from "zod";

import { ACCEPT_TEXT, ESIGN_ARTICLE } from "../../../shared/signing";
import type { Db } from "../../db/client";
import { signatureRequests, type SignatureDoc } from "../../db/schema/legal";
import { contracts } from "../../db/schema/ops";
import { emailCode, emailDetails, emailLayout, emailList, type EmailBrand } from "../../integrations/emailLayout";
import { sendEmail } from "../../integrations/smtp";
import { HttpError, parse } from "../../lib/http";
import { renderPdf } from "../../lib/pdf";
import { getFile, putFile } from "../../lib/storage";
import { createLimiter } from "../../security/ratelimit";
import { appBaseUrl } from "../auth/routes";
import { contentDisposition } from "./pdf";
import { CONTRACT_STATUSES, loadProvider } from "./routes";
import { brandOf, loadByToken, maskEmail } from "./signatures";

type SignatureRow = typeof signatureRequests.$inferSelect;

/** Valabilitatea codului trimis pe email. */
const OTP_TTL_MS = 10 * 60 * 1000;

/** Pauza minimă între două coduri cerute pentru aceeași cerere. */
const OTP_RESEND_MS = 60 * 1000;

/** Încercări greșite permise pentru un cod. */
const MAX_OTP_ATTEMPTS = 5;

/** Limita semnăturii desenate (PNG ca data URL). */
const MAX_PNG = 400_000;

/** User-agent-ul se păstrează trunchiat (ca în `sessions`). */
const MAX_UA = 500;

/** Valoarea din `CONTRACT_STATUSES` care înseamnă „contract semnat”. */
const SIGNED_CONTRACT_STATUS = CONTRACT_STATUSES.find((status) => status.toLowerCase().includes("semnat"));

/** 60 de cereri pe minut și pe IP, pe tot routerul public. */
const publicLimiter = createLimiter(60, 60_000);

/** Data și ora semnării, în ora României. */
const RO_DATE = new Intl.DateTimeFormat("ro-RO", {
  dateStyle: "long",
  timeStyle: "medium",
  timeZone: "Europe/Bucharest",
});

const ESCAPES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

/** Escape pentru orice valoare care ajunge în HTML/PDF. */
function esc(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ESCAPES[char] ?? char);
}

/** SHA-256 hex, pentru OTP și pentru amprentele PDF-urilor semnate. */
function sha256(value: string | Buffer): string {
  return createHash("sha256").update(value).digest("hex");
}

const signSchema = z.object({
  code: z.string().regex(/^\d{6}$/, "Codul are exact 6 cifre"),
  name: z.string().trim().min(2, "Minimum 2 caractere").max(120, "Maximum 120 de caractere"),
  role: z.string().trim().max(120, "Maximum 120 de caractere").optional(),
  accepted: z.literal(true, "Acceptarea documentelor este obligatorie"),
  signaturePng: z
    .string()
    .max(MAX_PNG, "Semnătura este prea mare")
    .regex(/^data:image\/png;base64,/, "Semnătura trebuie să fie o imagine PNG"),
});

/** Tokenul din link: base64url (32 de octeți aleatori), altfel linkul e invalid. */
function tokenOf(value: string): string {
  if (!/^[A-Za-z0-9_-]{16,200}$/.test(value)) throw new HttpError(404, "not_found", "Link invalid");
  return value;
}

/** Cererea din link, cu starea ei verificată: 404 pentru token necunoscut, 410 pentru anulat/expirat. */
async function resolve(db: Db, token: string): Promise<SignatureRow> {
  const row = await loadByToken(db, token);
  if (!row) throw new HttpError(404, "not_found", "Link invalid");
  if (row.status === "cancelled") throw new HttpError(410, "gone", "Cererea a fost anulată");
  if (row.status !== "signed" && row.expiresAt.getTime() < Date.now()) {
    throw new HttpError(410, "gone", "Linkul a expirat");
  }
  return row;
}

/** Datele prestatorului, așa cum vin din `loadProvider`. */
type Provider = Awaited<ReturnType<typeof loadProvider>>;

/** Un document din cerere, cu HTML-ul original și numărul lui de pagini. */
interface OriginalDoc {
  doc: SignatureDoc;
  html: string;
  pages: number;
}

interface CertificateInput {
  doc: SignatureDoc;
  documents: OriginalDoc[];
  total: number;
  pages: number;
  row: SignatureRow;
  provider: Provider;
  now: Date;
  ip: string | null;
  ua: string | null;
  name: string;
  role: string | null;
  signaturePng: string;
}

/** Numărul de pagini al unui document: câte secțiuni `class="pg` are HTML-ul original. */
function pageCount(html: string): number {
  return html.split('class="pg').length - 1;
}

/** Celula tabelelor din certificat: bordură subțire, text compact. */
const CERT_CELL = "border:0.5pt solid #999;padding:2.6pt 6pt;text-align:left;vertical-align:top";

/** Un rând etichetă/valoare din tabelele certificatului. */
function certRow(label: string, value: string): string {
  return `<tr><th style="${CERT_CELL}background:#f3f3f3;width:32%">${esc(label)}</th><td style="${CERT_CELL};word-break:break-word">${esc(value)}</td></tr>`;
}

/** Un tabel etichetă/valoare, cu titlul deasupra lui. */
function certTable(title: string, rows: Array<[string, string]>): string {
  return [
    `<h2 style="font-size:11.5pt;margin:0 0 1.2mm">${esc(title)}</h2>`,
    `<table style="border-collapse:collapse;width:100%;font-size:9.5pt;line-height:1.3">`,
    `<tbody>`,
    rows.map(([label, value]) => certRow(label, value)).join(""),
    `</tbody>`,
    `</table>`,
  ].join("");
}

/** Pagina de certificat a semnării, cu toate valorile escapate. */
function certificate({
  doc,
  documents,
  total,
  pages,
  row,
  provider,
  now,
  ip,
  ua,
  name,
  role,
  signaturePng,
}: CertificateInput): string {
  const documentsTable = [
    `<h2 style="font-size:11.5pt;margin:0 0 1.2mm">Documente semnate</h2>`,
    `<table style="border-collapse:collapse;width:100%;font-size:8.5pt;line-height:1.25">`,
    `<thead><tr>`,
    `<th style="${CERT_CELL}background:#f3f3f3;width:7%">Nr.</th>`,
    `<th style="${CERT_CELL}background:#f3f3f3;width:26%">Document</th>`,
    `<th style="${CERT_CELL}background:#f3f3f3;width:9%">Pagini</th>`,
    `<th style="${CERT_CELL}background:#f3f3f3">Amprentă SHA-256 (originală)</th>`,
    `</tr></thead>`,
    `<tbody>`,
    documents
      .map(
        (item, index) =>
          `<tr><td style="${CERT_CELL};text-align:center">${index + 1}</td><td style="${CERT_CELL}">${esc(item.doc.title)}</td><td style="${CERT_CELL};text-align:center">${item.pages}</td><td style="${CERT_CELL};word-break:break-all">${esc(item.doc.sha256)}</td></tr>`,
      )
      .join(""),
    `</tbody>`,
    `</table>`,
    `<p style="margin:1.5mm 0 3.5mm">Total: ${total} pagini.</p>`,
  ].join("");

  const issuer = certTable("Emitent (Prestator)", [
    ["Denumire legală", provider.esaNume],
    ["CUI", provider.esaCui],
    ["Reprezentant", provider.esaRep],
  ]);

  const signer = certTable("Semnatar (Beneficiar)", [
    ["Nume", name],
    ["Funcție", role || "—"],
    ["E-mail (verificat prin cod unic)", row.signerEmail],
    ["Data și ora", `${RO_DATE.format(now)} (${now.toISOString()})`],
    ["Adresă IP", ip || "—"],
    ["Browser", ua || "—"],
  ]);

  const closing = `Prezentul certificat face parte integrantă din documentele enumerate mai sus și validează semnătura Beneficiarului pentru toate paginile acestora (${total} pagini), conform ${ESIGN_ARTICLE} din Contract. Este atașat ca ultimă pagină a documentului „${doc.title}” (pagina ${pages + 1}).`;

  return [
    `<section class="pg" style="padding:16mm;font-size:11pt;line-height:1.35;text-align:left;box-sizing:border-box;break-before:page;page-break-before:always">`,
    `<h1 style="font-size:14pt;text-align:center;margin:0 0 1mm">Certificat de semnare electronică</h1>`,
    `<p style="text-align:center;margin:0 0 3.5mm;font-size:10pt">ID cerere: ${esc(row.id)}</p>`,
    documentsTable,
    issuer,
    `<p style="margin:1.5mm 0 3.5mm">Transmis spre semnare la ${esc(RO_DATE.format(row.createdAt))} către ${esc(row.signerEmail)}</p>`,
    signer,
    `<p style="margin:3.5mm 0 0"><b>Declarație acceptată:</b> ${esc(ACCEPT_TEXT)}</p>`,
    `<p style="margin:3mm 0 0"><b>Semnătura:</b></p>`,
    `<img src="${esc(signaturePng)}" alt="Semnătura semnatarului" style="display:block;max-height:28mm;max-width:90mm">`,
    `<p style="margin:3.5mm 0 0;font-size:9.5pt">${esc(closing)}</p>`,
    `</section>`,
  ].join("");
}

/** Pagina de certificat, inserată înainte de ultimul `</body>` al documentului. */
function withCertificate(html: string, page: string): string {
  const index = html.toLowerCase().lastIndexOf("</body");
  if (index === -1) return `${html}${page}`;
  return `${html.slice(0, index)}${page}${html.slice(index)}`;
}

interface OtpEmailInput {
  code: string;
  titles: string[];
  brand: EmailBrand;
}

/** Emailul cu codul de acces (fără resurse externe). */
function otpEmail({ code, titles, brand }: OtpEmailInput): string {
  return emailLayout({
    preheader: "Codul dumneavoastră de semnare",
    heading: "Codul de semnare",
    body: [
      `<p style="margin:0 0 16px;">Introduceți codul de mai jos pentru a semna documentele:</p>`,
      emailCode(code),
      emailList(titles),
    ].join(""),
    note: "Codul expiră în 10 minute. Dacă nu ați solicitat semnarea, ignorați acest mesaj.",
    brand,
  });
}

interface SignedEmailInput {
  titles: string[];
  link: string;
  name: string;
  role: string | null;
  now: Date;
  brand: EmailBrand;
}

/** Emailul de confirmare pentru semnatar: documentele semnate și linkul lor. */
function signedEmail({ titles, link, name, role, now, brand }: SignedEmailInput): string {
  return emailLayout({
    preheader: "Semnătura a fost înregistrată",
    heading: "Documentele au fost semnate",
    body: [
      `<p style="margin:0 0 16px;">Vă mulțumim! Semnătura a fost înregistrată.</p>`,
      emailDetails([
        ["Semnat de", role ? `${name} (${role})` : name],
        ["Data și ora", RO_DATE.format(now)],
        ["Documente", titles.join(", ")],
      ]),
    ].join(""),
    button: { label: "Descarcă documentele semnate", url: link },
    note: "Păstrați acest e-mail; linkul rămâne activ 30 de zile de la trimitere.",
    brand,
  });
}

interface ProviderEmailInput {
  titles: string[];
  dossierLink: string | null;
  name: string;
  role: string | null;
  email: string;
  ip: string | null;
  now: Date;
  brand: EmailBrand;
}

/** Emailul către furnizor: ce s-a semnat și de către cine. */
function providerEmail({ titles, dossierLink, name, role, email, ip, now, brand }: ProviderEmailInput): string {
  return emailLayout({
    preheader: `${name} a semnat documentele trimise spre semnare`,
    heading: `${name} a semnat`,
    body: emailDetails([
      ["Semnatar", name],
      ["Funcție", role ?? "—"],
      ["E-mail", email],
      ["Data și ora", RO_DATE.format(now)],
      ["Adresă IP", ip ?? "—"],
      ["Documente", titles.join(", ")],
    ]),
    button: dossierLink ? { label: "Deschide dosarul", url: dossierLink } : undefined,
    brand,
  });
}

/** Rutele publice de semnare: starea cererii, documentele, codul OTP și semnarea. */
export function publicSignRouter(): Router {
  const router = Router();

  router.use((req, _res, next) => {
    if (!publicLimiter.hit(req.ip ?? "unknown")) {
      throw new HttpError(429, "rate_limited", "Prea multe cereri. Încearcă din nou într-un minut.");
    }
    next();
  });

  /** Starea cererii pentru pagina de semnare; prima vizualizare marchează `viewed`. */
  router.get("/:token", async (req, res) => {
    const { db } = req.ctx;
    const token = tokenOf(req.params.token);
    const row = await resolve(db, token);

    const [viewed] =
      row.status === "sent"
        ? await db
            .update(signatureRequests)
            .set({ status: "viewed", viewedAt: new Date() })
            .where(eq(signatureRequests.id, row.id))
            .returning()
        : [];
    const current = viewed ?? row;

    const provider = await loadProvider(db);
    res.json({
      status: current.status,
      signerName: current.signerName,
      signerEmail: maskEmail(current.signerEmail),
      provider: provider.esaMarca,
      docs: current.docs.map((doc, i) => ({ i, title: doc.title })),
      signedAt: current.signedAt,
      signedName: current.signedName,
      expiresAt: current.expiresAt,
      acceptText: ACCEPT_TEXT,
    });
  });

  /** PDF-ul unui document din pachet: originalul sau versiunea semnată. */
  router.get("/:token/docs/:i", async (req, res) => {
    const { db, env } = req.ctx;
    const token = tokenOf(req.params.token);
    const row = await resolve(db, token);

    const index = Number(req.params.i);
    const doc = Number.isInteger(index) && index >= 0 ? row.docs[index] : undefined;
    if (!doc) throw new HttpError(404, "not_found", "Documentul nu există");

    const isSigned = row.status === "signed";
    const key = isSigned && doc.signedPdfKey ? doc.signedPdfKey : doc.pdfKey;

    const pdf = await getFile(env, key);
    res
      .status(200)
      .set({
        "Content-Type": "application/pdf",
        "Content-Disposition": contentDisposition(`${doc.title}${isSigned ? "-semnat" : ""}`).replace(
          /^attachment/,
          "inline",
        ),
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      })
      .send(pdf);
  });

  /** Trimite un cod de semnare pe emailul semnatarului (unul pe minut). */
  router.post("/:token/otp", async (req, res) => {
    const { db, env } = req.ctx;
    const token = tokenOf(req.params.token);
    const row = await resolve(db, token);
    if (row.status === "signed") throw new HttpError(409, "conflict", "Documentele sunt deja semnate");

    const now = new Date();
    if (row.otpSentAt && row.otpSentAt.getTime() > now.getTime() - OTP_RESEND_MS) {
      throw new HttpError(429, "rate_limited", "Codul a fost trimis deja. Încearcă din nou într-un minut.");
    }

    const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
    await db
      .update(signatureRequests)
      .set({
        otpHash: sha256(`${row.id}:${code}`),
        otpExpiresAt: new Date(now.getTime() + OTP_TTL_MS),
        otpAttempts: 0,
        otpSentAt: now,
      })
      .where(eq(signatureRequests.id, row.id));

    const provider = await loadProvider(db);
    const result = await sendEmail(env, {
      to: row.signerEmail,
      subject: `Cod de semnare: ${code}`,
      html: otpEmail({ code, titles: row.docs.map((doc) => doc.title), brand: brandOf(provider) }),
    });
    if (result.status !== "sent") {
      throw new HttpError(503, "email_failed", "Codul nu a putut fi trimis pe email. Încearcă din nou.");
    }

    res.json({ sentTo: maskEmail(row.signerEmail) });
  });

  /** Semnarea propriu-zisă: codul OTP, datele semnatarului, semnătura desenată și PDF-urile semnate. */
  router.post("/:token/sign", express.json({ limit: "1mb" }), async (req, res) => {
    const { db, env } = req.ctx;
    const token = tokenOf(req.params.token);
    const input = parse(signSchema, req.body);
    const row = await resolve(db, token);
    if (row.status === "signed") throw new HttpError(409, "conflict", "Documentele sunt deja semnate");

    const now = new Date();
    if (!row.otpHash || !row.otpExpiresAt || row.otpExpiresAt.getTime() < now.getTime()) {
      throw new HttpError(422, "otp_expired", "Codul a expirat, cere unul nou");
    }
    if (row.otpAttempts >= MAX_OTP_ATTEMPTS) {
      throw new HttpError(429, "rate_limited", "Prea multe încercări, cere un cod nou");
    }

    const expected = Buffer.from(row.otpHash, "utf8");
    const received = Buffer.from(sha256(`${row.id}:${input.code}`), "utf8");
    if (expected.length !== received.length || !timingSafeEqual(expected, received)) {
      await db
        .update(signatureRequests)
        .set({ otpAttempts: row.otpAttempts + 1 })
        .where(eq(signatureRequests.id, row.id));
      throw new HttpError(422, "otp_wrong", "Cod greșit");
    }

    const ip = req.ip ?? null;
    const ua = req.get("user-agent")?.slice(0, MAX_UA) ?? null;
    const role = input.role && input.role !== "" ? input.role : null;

    const provider = await loadProvider(db);

    const originals: OriginalDoc[] = [];
    for (const doc of row.docs) {
      const html = (await getFile(env, doc.htmlKey)).toString("utf8");
      originals.push({ doc, html, pages: pageCount(html) });
    }
    const total = originals.reduce((sum, item) => sum + item.pages, 0);

    const docs: SignatureDoc[] = [];
    for (const [i, { doc, html, pages }] of originals.entries()) {
      const page = certificate({
        doc,
        documents: originals,
        total,
        pages,
        row,
        provider,
        now,
        ip,
        ua,
        name: input.name,
        role,
        signaturePng: input.signaturePng,
      });
      const pdf = await renderPdf(withCertificate(html, page), env);
      const signedPdfKey = `signatures/${row.id}/${i}.signed.pdf`;
      await putFile(env, signedPdfKey, pdf);
      docs.push({ ...doc, signedPdfKey, signedSha256: sha256(pdf) });
    }

    const [updated] = await db
      .update(signatureRequests)
      .set({
        status: "signed",
        signedAt: now,
        signedName: input.name,
        signedRole: role,
        signedIp: ip,
        signedUa: ua,
        signaturePng: input.signaturePng,
        otpHash: null,
        docs,
      })
      .where(and(eq(signatureRequests.id, row.id), ne(signatureRequests.status, "signed")))
      .returning();
    if (!updated) throw new HttpError(409, "conflict", "Documentele sunt deja semnate");

    if (row.contractId && SIGNED_CONTRACT_STATUS) {
      await db
        .update(contracts)
        .set({ status: SIGNED_CONTRACT_STATUS, signedAt: now })
        .where(eq(contracts.id, row.contractId));
    }

    const brand = brandOf(provider);
    const titles = docs.map((doc) => doc.title);
    const link = `${appBaseUrl(env)}/semnare/${token}`;
    const dossierLink = row.offerId ? `${appBaseUrl(env)}/legal/offers/${row.offerId}/dossier` : null;
    await sendEmail(env, {
      to: row.signerEmail,
      subject: `Documente semnate – ${provider.esaMarca}`,
      html: signedEmail({ titles, link, name: input.name, role, now, brand }),
    });
    await sendEmail(env, {
      to: provider.esaEmail,
      subject: `Semnat: ${titles.join(", ")} – ${input.name}`,
      html: providerEmail({ titles, dossierLink, name: input.name, role, email: row.signerEmail, ip, now, brand }),
    });

    res.json({ status: "signed", signedAt: now.toISOString() });
  });

  return router;
}
