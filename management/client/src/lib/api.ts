/**
 * Client HTTP pentru API-ul intern (`/api`): trimite mereu header-ul CSRF
 * `x-requested-with: esa`, cookie-urile same-origin și transformă răspunsurile
 * de eroare `{ error: { code, message, fields? } }` în `ApiError`.
 */

/** Câmpuri invalide: nume de câmp → mesaj (aceeași formă ca pe server). */
export type ApiFields = Record<string, string>;

/** Eroare de API: status HTTP + cod stabil + mesaj (opțional câmpuri invalide). */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly fields?: ApiFields;

  constructor(status: number, code: string, message: string, fields?: ApiFields) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

/** Valori acceptate în query string; `null`, `undefined` și `""` sunt ignorate. */
export type QueryValue = string | number | boolean | null | undefined;

/** Construiește `?a=1&b=2` dintr-un obiect de query (sau `""`). */
export function qs(query?: Record<string, QueryValue>): string {
  if (!query) return "";

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") continue;
    params.set(key, String(value));
  }

  const serialized = params.toString();
  return serialized ? `?${serialized}` : "";
}

export interface ApiOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  /** Obiect JSON sau `FormData` (trimis ca atare, fără `content-type`). */
  body?: unknown;
  query?: Record<string, QueryValue>;
  signal?: AbortSignal;
}

/** Forma răspunsului de eroare al serverului. */
interface ApiErrorBody {
  error?: { code?: string; message?: string; fields?: ApiFields };
}

/** Cerere către `/api<path>`; aruncă `ApiError` dacă răspunsul nu e ok. */
export async function api<T = unknown>(path: string, options: ApiOptions = {}): Promise<T> {
  const { method = "GET", body, query, signal } = options;

  const headers: Record<string, string> = {
    "x-requested-with": "esa",
    accept: "application/json",
  };

  let payload: BodyInit | undefined;
  if (body instanceof FormData) {
    payload = body;
  } else if (body !== undefined) {
    headers["content-type"] = "application/json";
    payload = JSON.stringify(body);
  }

  const response = await fetch(`/api${path}${qs(query)}`, {
    method,
    headers,
    body: payload,
    credentials: "same-origin",
    signal,
  });

  if (response.status === 204) return undefined as T;

  const data: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const error = (data as ApiErrorBody | null)?.error;
    throw new ApiError(
      response.status,
      error?.code ?? "http_error",
      error?.message ?? `Cerere eșuată (${response.status})`,
      error?.fields,
    );
  }

  return data as T;
}
