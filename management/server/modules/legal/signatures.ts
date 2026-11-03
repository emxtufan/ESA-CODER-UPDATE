/**
 * Rutele de semnare electronică: pachetul de documente trimis spre semnare (HTML + PDF
 * salvate în storage, cu hash-uri), linkul cu token trimis pe email și descărcarea
 * documentelor. Semnarea propriu-zisă (linkul public) e un pas separat, iar ruta nu
 * atinge oferta sau contractul legat.
 */
import { createHash, randomBytes, randomUUID } from "node:crypto";

import { and, desc, eq } from "drizzle-orm";
import express, { Router } from "express";
import { z } from "zod";

import { SIGN_LINK_DAYS } from "../../../shared/signing";
import type { Db } from "../../db/client";
import { signatureRequests, type SignatureDoc } from "../../db/schema/legal";
import { sendEmail } from "../../integrations/smtp";
import { HttpError, parse } from "../../lib/http";
import { renderPdf, sanitizeHtml } from "../../lib/pdf";
import { getFile, putFile } from "../../lib/storage";
import { audit } from "../../security/audit";
import { requirePermission } from "../../security/guards";
import { appBaseUrl } from "../auth/routes";
import { contentDisposition, PDF_BODY_LIMIT } from "./pdf";
import { loadProvider } from "./routes";

/** Limita de HTML per document (aceeași ca la generarea PDF-ului). */
const MAX_HTML = 15 * 1024 * 1024;

const idSchema = z.object({ id: z.uuid("Identificator invalid") });

const docParams = z.object({
  id: z.uuid("Identificator invalid"),
  i: z.coerce.number().int().min(0, "Index invalid"),
});

const docSchema = z.object({
  title: z.string().trim().min(1, "Câmp obligatoriu").max(200, "Maximum 200 de caractere"),
  html: z.string().min(1, "Câmp obligatoriu").max(MAX_HTML, "HTML-ul este prea mare (maximum 15 MB)"),
});

const signatureSchema = z.object({
  offerId: z.uuid("Identificator invalid").optional(),
  contractId: z.uuid("Identificator invalid").optional(),
  email: z.email("Email invalid"),
  name: z.string().trim().max(120, "Maximum 120 de caractere").optional(),
  docs: z
    .array(docSchema)
    .min(1, "Minimum un document")
    .max(10, "Maximum 10 documente"),
});

const listQuery = z.object({
  offerId: z.uuid("Identificator invalid").optional(),
  contractId: z.uuid("Identificator invalid").optional(),
});

type SignatureRow = typeof signatureRequests.$inferSelect;

/** SHA-256 hex — formatul în care se stochează tokenul din link. */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Email mascat pentru liste și audit: „a***@domeniu.ro”. */
export function maskEmail(email: string): string {
  const [local = "", domain = ""] = email.split("@");
  return `${local.slice(0, 1) || "*"}***@${domain}`;
}

/** Cererea de semnare după tokenul din link (tokenul în clar nu se stochează). */
export async function loadByToken(db: Db, token: string): Promise<SignatureRow | null> {
  const [row] = await db
    .select()
    .from(signatureRequests)
    .where(eq(signatureRequests.tokenHash, hashToken(token)))
    .limit(1);
  return row ?? null;
}

/** Rândul public: fără hash-uri, fără starea OTP și fără semnătura desenată. */
type PublicSignatureRow = Omit<
  SignatureRow,
  "tokenHash" | "otpHash" | "otpExpiresAt" | "otpAttempts" | "otpSentAt" | "signaturePng"
>;

export function publicView(row: SignatureRow): PublicSignatureRow {
  const { tokenHash, otpHash, otpExpiresAt, otpAttempts, otpSentAt, signaturePng, ...rest } = row;
  return rest;
}

/** Escape pentru titlurile introduse de utilizator, în corpul emailului. */
function escapeHtml(value: string): string {
  const map: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  return value.replace(/[&<>"']/g, (char) => map[char] ?? char);
}

/** Email scurt cu titlurile documentelor și linkul de semnare (fără resurse externe). */
function signEmail(titles: string[], link: string): string {
  return [
    `<h1>Documente spre semnare</h1>`,
    `<ul>${titles.map((title) => `<li>${escapeHtml(title)}</li>`).join("")}</ul>`,
    `<p><a href="${link}">Deschide documentele și semnează</a></p>`,
    `<p>Sau copiază linkul în browser: ${link}</p>`,
    `<p>Linkul e valabil ${SIGN_LINK_DAYS} de zile.</p>`,
  ].join("");
}

/** Linkul public de semnare pentru un token proaspăt. */
function signLink(env: Parameters<typeof appBaseUrl>[0], token: string): string {
  return `${appBaseUrl(env)}/semnare/${token}`;
}

/** Momentul expirării unui link nou. */
function expiryFrom(now: Date): Date {
  return new Date(now.getTime() + SIGN_LINK_DAYS * 24 * 60 * 60 * 1000);
}

export function signaturesRouter(): Router {
  const router = Router();

  /** Trimite un pachet de documente spre semnare: HTML + PDF în storage, link pe email. */
  router.post(
    "/signatures",
    requirePermission("documents.create"),
    express.json({ limit: PDF_BODY_LIMIT }),
    async (req, res) => {
      const { db, env } = req.ctx;
      const input = parse(signatureSchema, req.body);
      const id = randomUUID();

      const docs: SignatureDoc[] = [];
      for (const [index, doc] of input.docs.entries()) {
        const html = sanitizeHtml(doc.html);
        const pdf = await renderPdf(html, env);
        const htmlKey = `signatures/${id}/${index}.html`;
        const pdfKey = `signatures/${id}/${index}.pdf`;
        await putFile(env, htmlKey, Buffer.from(html, "utf8"));
        await putFile(env, pdfKey, pdf);
        docs.push({ title: doc.title, htmlKey, pdfKey, sha256: createHash("sha256").update(pdf).digest("hex") });
      }

      const token = randomBytes(32).toString("base64url");
      const [row] = await db
        .insert(signatureRequests)
        .values({
          id,
          offerId: input.offerId ?? null,
          contractId: input.contractId ?? null,
          signerEmail: input.email,
          signerName: input.name ?? null,
          tokenHash: hashToken(token),
          status: "sent",
          docs,
          expiresAt: expiryFrom(new Date()),
          createdBy: req.auth?.user.id ?? null,
        })
        .returning();
      if (!row) throw new HttpError(500, "internal", "Cererea de semnare nu a putut fi salvată");

      const provider = await loadProvider(db);
      const result = await sendEmail(env, {
        to: input.email,
        subject: `Document spre semnare – ${provider.esaMarca}`,
        html: signEmail(
          docs.map((doc) => doc.title),
          signLink(env, token),
        ),
      });

      await audit(req, "signature.create", "signature_request", id, {
        offerId: input.offerId ?? null,
        contractId: input.contractId ?? null,
        email: maskEmail(input.email),
        docs: docs.length,
        delivery: result.status,
      });

      res.status(201).json({ ...publicView(row), emailSent: result.status === "sent" });
    },
  );

  /** Cererile de semnare pentru o ofertă sau un contract, cele mai noi primele. */
  router.get("/signatures", requirePermission("documents.view"), async (req, res) => {
    const query = parse(listQuery, req.query);
    const conditions = [
      query.offerId ? eq(signatureRequests.offerId, query.offerId) : undefined,
      query.contractId ? eq(signatureRequests.contractId, query.contractId) : undefined,
    ].filter((condition) => condition !== undefined);

    const rows = await req.ctx.db
      .select()
      .from(signatureRequests)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(signatureRequests.createdAt));

    res.json({ items: rows.map(publicView) });
  });

  /** PDF-ul unui document din pachet: originalul sau versiunea semnată (`?signed=1`). */
  router.get("/signatures/:id/docs/:i", requirePermission("documents.view"), async (req, res) => {
    const { db, env } = req.ctx;
    const { id, i } = parse(docParams, req.params);
    const [row] = await db.select().from(signatureRequests).where(eq(signatureRequests.id, id)).limit(1);
    if (!row) throw new HttpError(404, "not_found", "Cererea de semnare nu există");

    const doc = row.docs[i];
    if (!doc) throw new HttpError(404, "not_found", "Documentul nu există");

    const signed = req.query.signed === "1";
    const key = signed ? doc.signedPdfKey : doc.pdfKey;
    if (!key) throw new HttpError(404, "file_missing", "Documentul semnat lipsește");

    const pdf = await getFile(env, key);
    res
      .status(200)
      .set({
        "Content-Type": "application/pdf",
        "Content-Disposition": contentDisposition(`${doc.title}${signed ? "-semnat" : ""}`).replace(/^attachment/, "inline"),
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      })
      .send(pdf);
  });

  /** Retrimite linkul: token nou, valabilitate nouă, OTP resetat. */
  router.post("/signatures/:id/resend", requirePermission("documents.create"), async (req, res) => {
    const { db, env } = req.ctx;
    const { id } = parse(idSchema, req.params);
    const [row] = await db.select().from(signatureRequests).where(eq(signatureRequests.id, id)).limit(1);
    if (!row) throw new HttpError(404, "not_found", "Cererea de semnare nu există");
    if (row.status !== "sent" && row.status !== "viewed") {
      throw new HttpError(409, "conflict", "Doar cererile trimise sau vizualizate pot fi retrimise");
    }

    const token = randomBytes(32).toString("base64url");
    const [updated] = await db
      .update(signatureRequests)
      .set({
        tokenHash: hashToken(token),
        expiresAt: expiryFrom(new Date()),
        otpHash: null,
        otpExpiresAt: null,
        otpAttempts: 0,
        otpSentAt: null,
      })
      .where(eq(signatureRequests.id, id))
      .returning();
    if (!updated) throw new HttpError(500, "internal", "Cererea de semnare nu a putut fi actualizată");

    const provider = await loadProvider(db);
    const result = await sendEmail(env, {
      to: row.signerEmail,
      subject: `Document spre semnare – ${provider.esaMarca}`,
      html: signEmail(
        row.docs.map((doc) => doc.title),
        signLink(env, token),
      ),
    });

    await audit(req, "signature.resend", "signature_request", id, {
      email: maskEmail(row.signerEmail),
      delivery: result.status,
    });

    res.json({ ...publicView(updated), emailSent: result.status === "sent" });
  });

  /** Anulează o cerere nesemnată; linkurile ei devin inutile. */
  router.post("/signatures/:id/cancel", requirePermission("documents.update"), async (req, res) => {
    const db = req.ctx.db;
    const { id } = parse(idSchema, req.params);
    const [row] = await db.select().from(signatureRequests).where(eq(signatureRequests.id, id)).limit(1);
    if (!row) throw new HttpError(404, "not_found", "Cererea de semnare nu există");
    if (row.status === "signed") throw new HttpError(409, "conflict", "Documentele sunt deja semnate");

    const [updated] = await db
      .update(signatureRequests)
      .set({ status: "cancelled" })
      .where(eq(signatureRequests.id, id))
      .returning();
    if (!updated) throw new HttpError(500, "internal", "Cererea de semnare nu a putut fi actualizată");

    await audit(req, "signature.cancel", "signature_request", id, {});
    res.json(publicView(updated));
  });

  return router;
}
