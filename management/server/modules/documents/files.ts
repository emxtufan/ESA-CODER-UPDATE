import { createHmac, timingSafeEqual } from "node:crypto";
import { HttpError } from "../../lib/http";

/** Doar formate care nu pot rula cod în browser: fără HTML și SVG. */
const ALLOWED: Record<string, { ext: string; magic?: number[]; inline?: boolean }> = {
  "application/pdf": { ext: "pdf", magic: [0x25, 0x50, 0x44, 0x46], inline: true },
  "image/png": { ext: "png", magic: [0x89, 0x50, 0x4e, 0x47], inline: true },
  "image/jpeg": { ext: "jpg", magic: [0xff, 0xd8, 0xff], inline: true },
  "image/webp": { ext: "webp", magic: [0x52, 0x49, 0x46, 0x46], inline: true },
  "text/plain": { ext: "txt" },
  "text/csv": { ext: "csv" },
  "application/zip": { ext: "zip", magic: [0x50, 0x4b] },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": { ext: "docx", magic: [0x50, 0x4b] },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": { ext: "xlsx", magic: [0x50, 0x4b] },
};

/** Tipul declarat trebuie să fie permis și să corespundă cu primii octeți ai fișierului. */
export function assertAllowedFile(mime: string, data: Buffer): void {
  const rule = ALLOWED[mime];
  if (!rule) throw new HttpError(415, "file_type_not_allowed", "Tip de fișier nepermis");
  if (data.length === 0) throw new HttpError(422, "empty_file", "Fișierul este gol");
  if (rule.magic && !rule.magic.every((byte, i) => data[i] === byte)) {
    throw new HttpError(415, "file_type_mismatch", "Conținutul nu corespunde tipului de fișier");
  }
}

export const canPreview = (mime: string | null) => Boolean(mime && ALLOWED[mime]?.inline);

/** Antete pentru servire: niciodată sniffing; previzualizarea rulează izolată. */
export function fileHeaders(mime: string | null, name: string, inline: boolean): Record<string, string> {
  const safeName = name.replace(/[^\w.\- ]+/g, "_").slice(0, 120) || "document";
  const allowInline = inline && canPreview(mime);
  return {
    "Content-Type": allowInline && mime ? mime : "application/octet-stream",
    "Content-Disposition": `${allowInline ? "inline" : "attachment"}; filename="${safeName}"`,
    "X-Content-Type-Options": "nosniff",
    "Content-Security-Policy": "sandbox; default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; object-src 'self'",
    "Cache-Control": "private, no-store",
  };
}

const signature = (key: string, versionId: string, expires: number) =>
  createHmac("sha256", Buffer.from(key, "hex")).update(`${versionId}.${expires}`).digest("hex");

export function signLink(key: string, versionId: string, expires: number): string {
  return signature(key, versionId, expires);
}

/** Link temporar: semnătură validă, comparată în timp constant, și neexpirat. */
export function verifyLink(key: string, versionId: string, expires: number, sig: string, now = Date.now()): boolean {
  if (!Number.isFinite(expires) || expires < now) return false;
  const expected = Buffer.from(signature(key, versionId, expires));
  const got = Buffer.from(sig);
  return got.length === expected.length && timingSafeEqual(got, expected);
}
