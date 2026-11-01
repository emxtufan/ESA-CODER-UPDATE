/**
 * Utilitare HTTP comune: erori cu cod stabil, validare Zod → 422, handler global
 * de erori și paginare standard pentru listări.
 */
import type { NextFunction, Request, Response } from "express";
import { ZodError, z } from "zod";

/** Câmpuri invalide: nume de câmp → mesaj. */
export type ErrorFields = Record<string, string>;

/** Eroare controlată: status HTTP + cod stabil + mesaj (opțional câmpuri invalide). */
export class HttpError extends Error {
  readonly status: number;
  readonly code: string;
  readonly fields?: ErrorFields;

  constructor(status: number, code: string, message: string, fields?: ErrorFields) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.code = code;
    this.fields = fields;
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
    res.status(err.status).json({
      error: { code: err.code, message: err.message, fields: err.fields },
    });
    return;
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
