/**
 * Utilitare HTTP comune: erori cu cod stabil, validare Zod → 422, handler global
 * de erori și paginare standard pentru listări.
 */
import type { NextFunction, Request, Response } from "express";
import { ZodError, z } from "zod";

/**
 * Mesaje de validare în română, globale. Mesajele explicite din scheme rămân
 * prioritare; aici se traduc doar cele implicite ale Zod.
 */
z.config({
  customError: (iss) => {
    switch (iss.code) {
      case "invalid_type":
        return iss.input === undefined || iss.input === null ? "Câmp obligatoriu" : "Valoare invalidă";
      case "too_small":
        return iss.origin === "string" ? `Minimum ${iss.minimum} caractere` : `Minimum ${iss.minimum}`;
      case "too_big":
        return iss.origin === "string" ? `Maximum ${iss.maximum} caractere` : `Maximum ${iss.maximum}`;
      case "invalid_format":
        if (iss.format === "email") return "Email invalid";
        if (iss.format === "url") return "Adresă URL invalidă";
        return "Format invalid";
      case "invalid_value":
        return "Valoare invalidă";
      default:
        return undefined;
    }
  },
});

/** Câmpuri invalide: nume de câmp → mesaj. */
export type ErrorFields = Record<string, string>;

/** Eroare controlată: status HTTP + cod stabil + mesaj (opțional câmpuri invalide). */
export class HttpError extends Error {
  readonly status: number;
  readonly code: string;
  readonly fields?: ErrorFields;
  readonly headers?: Record<string, string>;

  constructor(status: number, code: string, message: string, fields?: ErrorFields, headers?: Record<string, string>) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.code = code;
    this.fields = fields;
    this.headers = headers;
  }
}

/** Validează date de intrare; orice eroare Zod devine 422 `validation_error`. */
export function parse<T extends z.ZodType>(schema: T, data: unknown): z.infer<T> {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof ZodError) {
      const fields: ErrorFields = {};
      for (const issue of error.issues) {
        const key = issue.path.join(".") || "_";
        fields[key] ??= issue.message;
      }
      throw new HttpError(422, "validation_error", "Date invalide", fields);
    }
    throw error;
  }
}

/** Forma răspunsului de eroare: `{ error: { code, message, fields? } }`. */
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof HttpError) {
    if (err.headers) res.set(err.headers);
    res.status(err.status).json({
      error: { code: err.code, message: err.message, fields: err.fields },
    });
    return;
  }

  // Erori din body-parser / middleware-uri Express (corp prea mare, JSON invalid etc.).
  if (typeof err === "object" && err !== null) {
    const { type, status, expose } = err as { type?: unknown; status?: unknown; expose?: unknown };
    if (type === "entity.too.large" || status === 413) {
      res.status(413).json({ error: { code: "payload_too_large", message: "Conținutul trimis este prea mare." } });
      return;
    }
    if (type === "entity.parse.failed") {
      res.status(400).json({ error: { code: "bad_request", message: "JSON invalid." } });
      return;
    }
    if (typeof status === "number" && status >= 400 && status < 500 && expose === true) {
      const text = err instanceof Error ? err.message : "Cerere invalidă";
      res.status(status).json({ error: { code: "bad_request", message: text } });
      return;
    }
  }

  const name = err instanceof Error ? err.name : "UnknownError";
  const message = err instanceof Error ? err.message : String(err);
  console.error(name, message);

  res.status(500).json({ error: { code: "internal", message: "Eroare internă" } });
}

/** Parametrii de listare: pagină, dimensiune, căutare, sortare. */
export const pageQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  q: z.string().trim().min(1).optional(),
  sort: z.string().min(1).optional(),
  dir: z.enum(["asc", "desc"]).optional(),
});

export type PageQuery = z.infer<typeof pageQuery>;

/** Răspuns standard de listare paginată. */
export interface Paged<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export function paged<T>(items: T[], total: number, q: PageQuery): Paged<T> {
  return { items, total, page: q.page, pageSize: q.pageSize };
}
