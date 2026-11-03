/**
 * PDF din HTML, cu Chromium headless (`playwright-core`). Un singur browser, lansat leneș
 * și refolosit; cererile se procesează una câte una. JavaScript e dezactivat, iar rețeaua
 * e blocată (doar `data:`), deci HTML-ul primit nu poate executa cod sau accesa resurse.
 * Singurul cod rulat în pagină e scriptul nostru de așezare (`page-layout.js`).
 */
import { readFileSync } from "node:fs";

import { chromium, type Browser, type Page } from "playwright-core";

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

/** Înălțimea zonei de text a unei pagini, aceeași ca la paginarea din client (`limitPx`). */
export const CONTENT_LIMIT_MM = 230;
/** Distanța minimă dintre text și linia footerului (acolo stă semnătura de pe fiecare pagină). */
export const FOOTER_GAP_MM = 10;

/** Semnătura Beneficiarului, pusă în document la semnare. */
export interface SignStamp {
  /** Semnătura desenată (data URL PNG). */
  png: string;
  name: string;
  role?: string | null;
  /** Data semnării, gata formatată (zz.ll.aaaa). */
  date: string;
}

export interface RenderOptions {
  sign?: SignStamp | null;
}

/** Ce a schimbat scriptul de așezare: paginile micșorate, locurile semnate, paginile marcate. */
export interface LayoutReport {
  fitted: { page: number; scale: number; overMm: number }[];
  spots: number;
  marks: number;
}

/** Scriptul de așezare, citit ca text: o funcție rulată în pagină cu `page.evaluate`. */
const LAYOUT_SCRIPT = readFileSync(new URL("./page-layout.js", import.meta.url), "utf8").trim();

/**
 * Ultimul pas înaintea randării: semnătura (la semnare), apoi garanția că textul fiecărei
 * pagini se termină deasupra footerului, apoi semnătura de pe fiecare pagină. Pagina trebuie
 * să fie deja în media `print`, ca măsurătorile să fie cele din PDF.
 */
export async function applyLayout(page: Page, options: RenderOptions = {}): Promise<LayoutReport> {
  const sign = options.sign
    ? { ...options.sign, role: options.sign.role ?? null, heightMm: 13, maxWidthMm: 55, markMm: 8, markWidthMm: 34 }
    : null;
  const args = JSON.stringify({ limitMm: CONTENT_LIMIT_MM, gapMm: FOOTER_GAP_MM, sign });
  const report = (await page.evaluate(`(${LAYOUT_SCRIPT})(${args})`)) as LayoutReport;
  if (report.fitted.length) {
    const pages = report.fitted.map((f) => `p${f.page} +${f.overMm}mm ×${f.scale}`).join(", ");
    console.warn(`PDF: pagini micșorate ca textul să rămână deasupra footerului: ${pages}`);
  }
  return report;
}

/** Scoate din HTML tag-urile care pot redirecționa pagina sau schimba baza URL-urilor. */
export function sanitizeHtml(html: string): string {
  return html.replace(/<meta\b[^>]*\bhttp-equiv\s*=\s*["']?\s*refresh\b[^>]*>/gi, "").replace(/<base\b[^>]*>/gi, "");
}

async function render(rawHtml: string, env: Pick<Env, "PDF_CHROMIUM_PATH">, options: RenderOptions): Promise<Buffer> {
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
    await page.emulateMedia({ media: "print" });
    const job = (async () => {
      await page.setContent(html, { waitUntil: "load", timeout: TIMEOUT_MS });
      await applyLayout(page, options);
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

/**
 * Densitatea imaginilor de pagină: A4 (794 px CSS) devine 1191 px, cât lățimea fizică a unui telefon.
 * PNG: text clar (fără artefacte JPEG) și cel mai mic la această densitate (~200 KB pe pagină).
 */
const IMAGE_SCALE = 1.5;
/** Un document lung (contractul are ~20 de pagini) are nevoie de mai mult timp decât un PDF. */
const IMAGE_TIMEOUT_MS = 90_000;

/**
 * Fiecare pagină A4 (`.pg`) din HTML-ul paginat, ca PNG, randată exact ca în PDF (media `print`,
 * aceleași fonturi). Pe telefon, HTML-ul micșorat nu e fiabil: browserele impun o mărime minimă a
 * textului sau aplică zoom-ul de text al sistemului, iar textul iese din pagină; imaginile nu.
 */
async function renderImages(
  rawHtml: string,
  env: Pick<Env, "PDF_CHROMIUM_PATH">,
  options: RenderOptions,
): Promise<Buffer[]> {
  const html = sanitizeHtml(rawHtml);
  let browser: Browser;
  try {
    browser = await getBrowser(env);
  } catch {
    throw new HttpError(503, "pdf_unavailable", PDF_UNAVAILABLE);
  }

  const context = await browser.newContext({
    javaScriptEnabled: false,
    deviceScaleFactor: IMAGE_SCALE,
    viewport: { width: 900, height: 1300 },
  });
  try {
    const page = await context.newPage();
    await page.route("**/*", (route) => (route.request().url().startsWith("data:") ? route.continue() : route.abort()));
    await page.emulateMedia({ media: "print" });
    const job = (async () => {
      await page.setContent(html, { waitUntil: "load", timeout: IMAGE_TIMEOUT_MS });
      await applyLayout(page, options);
      const images: Buffer[] = [];
      for (const pg of await page.locator(".pg").all()) {
        images.push(await pg.screenshot({ type: "png", animations: "disabled" }));
      }
      return images;
    })();
    let timer: NodeJS.Timeout | undefined;
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(
        () => reject(new HttpError(504, "pdf_timeout", "Previzualizarea a depășit timpul permis")),
        IMAGE_TIMEOUT_MS,
      );
    });
    try {
      return await Promise.race([job, timeout]);
    } catch (error) {
      if (error instanceof HttpError) throw error;
      throw new HttpError(422, "pdf_render_failed", "Documentul nu a putut fi afișat.");
    } finally {
      clearTimeout(timer);
      job.catch(() => undefined);
    }
  } finally {
    await context.close().catch(() => undefined);
  }
}

/** O singură coadă pentru tot ce folosește browserul (PDF-uri și imagini de pagină). */
const enqueue = createSerialQueue((job: () => Promise<unknown>) => job());

/** Randează HTML-ul în PDF; cererile rulează în coadă, una câte una. */
export function renderPdf(
  html: string,
  env: Pick<Env, "PDF_CHROMIUM_PATH">,
  options: RenderOptions = {},
): Promise<Buffer> {
  return enqueue(() => render(html, env, options)) as Promise<Buffer>;
}

/** Paginile HTML-ului paginat ca imagini PNG (în aceeași coadă cu PDF-urile). */
export function renderPageImages(
  html: string,
  env: Pick<Env, "PDF_CHROMIUM_PATH">,
  options: RenderOptions = {},
): Promise<Buffer[]> {
  return enqueue(() => renderImages(html, env, options)) as Promise<Buffer[]>;
}
