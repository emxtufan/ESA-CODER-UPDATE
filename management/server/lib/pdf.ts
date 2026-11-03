/**
 * PDF din HTML, cu Chromium headless (`playwright-core`). Un singur browser, lansat leneș
 * și refolosit; cererile se procesează una câte una. JavaScript e dezactivat, iar rețeaua
 * e blocată (doar `data:`), deci HTML-ul primit nu poate executa cod sau accesa resurse.
 */
import { chromium, type Browser } from "playwright-core";

import type { Env } from "../env";
import { HttpError } from "./http";

export const PDF_UNAVAILABLE =
  "Generarea PDF pe server nu este disponibilă. Instalează Chromium: npx playwright install chromium (sau setează PDF_CHROMIUM_PATH).";

const TIMEOUT_MS = 30_000;

let browserPromise: Promise<Browser> | null = null;

/** Lansarea: calea din env, apoi Chromium-ul instalat de Playwright, apoi Chrome-ul sistemului. */
async function launch(env: Pick<Env, "PDF_CHROMIUM_PATH">): Promise<Browser> {
  const args = ["--no-sandbox", "--disable-dev-shm-usage"];
  if (env.PDF_CHROMIUM_PATH) {
    return chromium.launch({ executablePath: env.PDF_CHROMIUM_PATH, args });
  }
  try {
    return await chromium.launch({ args });
  } catch {
    return chromium.launch({ channel: "chrome", args });
  }
}

async function getBrowser(env: Pick<Env, "PDF_CHROMIUM_PATH">): Promise<Browser> {
  if (browserPromise) {
    const existing = await browserPromise.catch(() => null);
    if (existing?.isConnected()) return existing;
    browserPromise = null;
  }
  const pending = launch(env);
  browserPromise = pending;
  try {
    const browser = await pending;
    browser.on("disconnected", () => {
      if (browserPromise === pending) browserPromise = null;
    });
    return browser;
  } catch (error) {
    browserPromise = null;
    throw error;
  }
}

/** Închide browserul (la oprirea serverului). */
export async function closePdfBrowser(): Promise<void> {
  const pending = browserPromise;
  browserPromise = null;
  const browser = await pending?.catch(() => null);
  await browser?.close().catch(() => undefined);
}

/** Scoate din HTML tag-urile care pot redirecționa pagina sau schimba baza URL-urilor. */
export function sanitizeHtml(html: string): string {
  return html.replace(/<meta\b[^>]*\bhttp-equiv\s*=\s*["']?\s*refresh\b[^>]*>/gi, "").replace(/<base\b[^>]*>/gi, "");
}

async function render(rawHtml: string, env: Pick<Env, "PDF_CHROMIUM_PATH">): Promise<Buffer> {
  const html = sanitizeHtml(rawHtml);
  let browser: Browser;
  try {
    browser = await getBrowser(env);
  } catch {
    throw new HttpError(503, "pdf_unavailable", PDF_UNAVAILABLE);
  }

  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    const page = await context.newPage();
    await page.route("**/*", (route) => (route.request().url().startsWith("data:") ? route.continue() : route.abort()));
    const job = (async () => {
      await page.setContent(html, { waitUntil: "load", timeout: TIMEOUT_MS });
      return page.pdf({ preferCSSPageSize: true, printBackground: true });
    })();
    let timer: NodeJS.Timeout | undefined;
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new HttpError(504, "pdf_timeout", "Generarea PDF a depășit timpul permis")), TIMEOUT_MS);
    });
    try {
      return Buffer.from(await Promise.race([job, timeout]));
    } catch (error) {
      if (error instanceof HttpError) throw error;
      throw new HttpError(422, "pdf_render_failed", "Documentul nu a putut fi convertit în PDF.");
    } finally {
      clearTimeout(timer);
      job.catch(() => undefined);
    }
  } finally {
    await context.close().catch(() => undefined);
  }
}

/** Numărul maxim de cereri PDF în sistem (cea în lucru + cele în așteptare). */
export const MAX_PENDING_PDF = 8;

export const PDF_BUSY = "Serverul generează deja multe PDF-uri. Încearcă din nou în câteva secunde.";

/** Coadă serială cu plafon: peste `max` cereri neterminate, respinge cu 503 și `Retry-After`. */
export function createSerialQueue<A extends unknown[], T>(work: (...args: A) => Promise<T>, max = MAX_PENDING_PDF) {
  let tail: Promise<unknown> = Promise.resolve();
  let pending = 0;
  return (...args: A): Promise<T> => {
    if (pending >= max) {
      return Promise.reject(new HttpError(503, "pdf_busy", PDF_BUSY, undefined, { "Retry-After": "10" }));
    }
    pending += 1;
    const run = tail.then(() => work(...args));
    tail = run.then(
      () => undefined,
      () => undefined,
    );
    tail = tail.then(() => {
      pending -= 1;
    });
    return run;
  };
}

const enqueue = createSerialQueue(render);

/** Randează HTML-ul în PDF; cererile rulează în coadă, una câte una. */
export function renderPdf(html: string, env: Pick<Env, "PDF_CHROMIUM_PATH">): Promise<Buffer> {
  return enqueue(html, env);
}
