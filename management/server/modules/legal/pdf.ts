/**
 * `POST /api/legal/pdf`: HTML paginat → PDF cu text selectabil, generat pe server.
 * Corpul poate avea până la 15 MB, deci ruta își are propriul parser JSON
 * (parserul global din `server/app.ts` o ocolește).
 */
import express, { Router } from "express";
import { z } from "zod";

import { renderPdf } from "../../lib/pdf";
import { parse } from "../../lib/http";
import { audit } from "../../security/audit";
import { requirePermission } from "../../security/guards";

export const PDF_BODY_LIMIT = "16mb";
const MAX_HTML = 15 * 1024 * 1024;

const pdfSchema = z.object({
  html: z.string().min(1, "Câmp obligatoriu").max(MAX_HTML, "HTML-ul este prea mare (maximum 15 MB)"),
  filename: z.string().trim().min(1, "Câmp obligatoriu").max(200, "Maximum 200 de caractere"),
});

/** Numele fișierului: ASCII sigur în `filename`, iar varianta cu diacritice în `filename*`. */
export function contentDisposition(filename: string): string {
  const base = filename.replace(/[\/\r\n"]+/g, "_").replace(/\.pdf$/i, "") + ".pdf";
  const ascii = base
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w.\- ]+/g, "_");
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(base).replace(/['()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`)}`;
}

export function legalPdfRouter(): Router {
  const router = Router();
  router.post("/", requirePermission("documents.view"), express.json({ limit: PDF_BODY_LIMIT }), async (req, res) => {
    const input = parse(pdfSchema, req.body);
    const pdf = await renderPdf(input.html, req.ctx.env);
    await audit(req, "legal_pdf_generated", "legal_pdf", null, { filename: input.filename, size: pdf.length });
    res
      .status(200)
      .set({
        "Content-Type": "application/pdf",
        "Content-Disposition": contentDisposition(input.filename),
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      })
      .send(pdf);
  });
  return router;
}
