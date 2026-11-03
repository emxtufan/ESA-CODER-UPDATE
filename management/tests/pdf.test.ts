import { inflateSync } from "node:zlib";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { HttpError } from "../server/lib/http";
import { PDF_BUSY, closePdfBrowser, createSerialQueue, renderPdf, sanitizeHtml } from "../server/lib/pdf";
import { contentDisposition } from "../server/modules/legal/pdf";
import { setup } from "./helpers";

const HTML = `<!doctype html><html><head><meta charset="utf-8"><style>@page{size:A4;margin:20mm}body{font:14pt serif}</style></head>
<body><h1>Grădinița Georgi, ăâîșț</h1><script>document.body.innerHTML="executat"</script><img src="http://127.0.0.1:1/x.png"></body></html>`;

/** Fluxurile decomprimate din PDF (acolo stau CMap-urile ToUnicode ale fonturilor). */
function pdfStreams(pdf: Buffer): string {
  const latin = pdf.toString("latin1");
  const out: string[] = [];
  const re = /stream\r?\n/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(latin))) {
    const start = m.index + m[0].length;
    const end = latin.indexOf("endstream", start);
    if (end < 0) break;
    try {
      out.push(inflateSync(pdf.subarray(start, end)).toString("latin1"));
    } catch {
      /* flux necomprimat sau alt filtru */
    }
  }
  return out.join("\n");
}

let available = true;
let pdf: Buffer | null = null;
let skipReason = "";

describe("pdf: Chromium", () => {
  beforeAll(async () => {
    try {
      pdf = await renderPdf(HTML, { PDF_CHROMIUM_PATH: process.env.PDF_CHROMIUM_PATH });
    } catch (error) {
      available = false;
      skipReason = error instanceof Error ? error.message : String(error);
    }
  }, 60_000);
  afterAll(() => closePdfBrowser());

  it("generează un PDF valid", (t) => {
    if (!available) return t.skip(`Chromium indisponibil: ${skipReason}`);
    expect(pdf!.subarray(0, 4).toString()).toBe("%PDF");
    expect(pdf!.length).toBeGreaterThan(1000);
  });

  it("păstrează textul cu diacritice (ToUnicode); scriptul nu se execută", (t) => {
    if (!available) return t.skip(`Chromium indisponibil: ${skipReason}`);
    const streams = pdfStreams(pdf!);
    // Dacă scriptul s-ar fi executat, titlul ar fi fost înlocuit cu „executat” și diacriticele ar lipsi.
    for (const ch of ["ă", "â", "î", "ș", "ț"]) {
      const hex = ch.charCodeAt(0).toString(16).toUpperCase().padStart(4, "0");
      expect(streams, `lipsește ${ch} (${hex})`).toContain(hex);
    }
  });

  it("răspunde prin API cu application/pdf și nume sigur", async (t) => {
    if (!available) return t.skip(`Chromium indisponibil: ${skipReason}`);
    const ctx = await setup();
    try {
      const cookie = await ctx.loginAs(await ctx.makeUser("super_admin"));
      const post = (body: unknown) =>
        fetch(`${ctx.url}/api/legal/pdf`, {
          method: "POST",
          headers: { "content-type": "application/json", "x-requested-with": "esa", cookie },
          body: JSON.stringify(body),
        });
      const res = await post({ html: HTML, filename: "Ofertă Grădinița.pdf" });
      expect(res.status).toBe(200);
      expect(res.headers.get("content-type")).toBe("application/pdf");
      const cd = res.headers.get("content-disposition")!;
      expect(cd).toContain("attachment");
      expect(cd).toContain("filename*=UTF-8''Ofert%C4%83%20Gr%C4%83dini%C8%9Ba.pdf");
      expect(Buffer.from(await res.arrayBuffer()).subarray(0, 4).toString()).toBe("%PDF");

      // corp mare, peste limita globală de 1 MB
      const big = await post({ html: `<!-- ${"a".repeat(2_000_000)} --><p>mare</p>`, filename: "mare" });
      expect(big.status).toBe(200);

      expect((await post({ html: "", filename: "a" })).status).toBe(422);
    } finally {
      await ctx.close();
    }
  }, 60_000);
});

describe("pdf: meta refresh", () => {
  afterAll(() => closePdfBrowser());

  it("elimină meta refresh și base din HTML", () => {
    const out = sanitizeHtml(`<head><META HTTP-EQUIV="Refresh" content="0;url=http://x"><base href="http://x/"><meta charset="utf-8"></head>`);
    expect(out).toBe(`<head><meta charset="utf-8"></head>`);
    expect(sanitizeHtml(`<meta content="1" http-equiv=refresh>`)).toBe("");
  });

  it("nu dă 500 pentru HTML cu meta refresh", async (t) => {
    let result: Buffer | null = null;
    try {
      result = await renderPdf(`<html><head><meta http-equiv="refresh" content="0;url=data:text/html,x"></head><body>ok</body></html>`, {
        PDF_CHROMIUM_PATH: process.env.PDF_CHROMIUM_PATH,
      });
    } catch (error) {
      if (error instanceof HttpError && error.status === 503) return t.skip(`Chromium indisponibil: ${error.message}`);
      expect(error).toBeInstanceOf(HttpError);
      expect((error as HttpError).status).toBe(422);
      return;
    }
    expect(result.subarray(0, 4).toString()).toBe("%PDF");
  }, 60_000);
});

describe("pdf: coada", () => {
  it("respinge cu 503 și Retry-After peste plafon, apoi se golește", async () => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => (release = resolve));
    const queue = createSerialQueue(async (n: number) => {
      await gate;
      return n;
    }, 3);

    const accepted = [queue(1), queue(2), queue(3)];
    const rejected = queue(4);
    await expect(rejected).rejects.toMatchObject({ status: 503, headers: { "Retry-After": "10" }, message: PDF_BUSY });

    release();
    expect(await Promise.all(accepted)).toEqual([1, 2, 3]);
    await new Promise((r) => setTimeout(r, 0));
    await expect(queue(5)).resolves.toBe(5);
  });

  it("rulează cererile pe rând", async () => {
    const order: string[] = [];
    const queue = createSerialQueue(async (name: string) => {
      order.push(`start ${name}`);
      await new Promise((r) => setTimeout(r, 5));
      order.push(`end ${name}`);
    });
    await Promise.all([queue("a"), queue("b")]);
    expect(order).toEqual(["start a", "end a", "start b", "end b"]);
  });
});

describe("http: erori de corp", () => {
  it("413 pentru corp peste limită, 400 pentru JSON invalid, pe toate routerele", async () => {
    const ctx = await setup();
    try {
      const cookie = await ctx.loginAs(await ctx.makeUser("super_admin"));
      const send = (path: string, body: string) =>
        fetch(`${ctx.url}${path}`, {
          method: "POST",
          headers: { "content-type": "application/json", "x-requested-with": "esa", cookie },
          body,
        });

      const big = await send("/api/legal/pdf", JSON.stringify({ html: "a".repeat(17 * 1024 * 1024), filename: "x" }));
      expect(big.status).toBe(413);
      expect((await big.json()).error).toMatchObject({ code: "payload_too_large", message: "Conținutul trimis este prea mare." });

      for (const path of ["/api/legal/pdf", "/api/clients", "/api/legal/documents/6f1c1f0e-0000-4000-8000-000000000000/archive"]) {
        const bad = await send(path, "{nu e json");
        expect(bad.status, path).toBe(400);
        expect((await bad.json()).error.message).toBe("JSON invalid.");
      }

      const tooBigGlobal = await send("/api/clients", JSON.stringify({ companyName: "a".repeat(2 * 1024 * 1024) }));
      expect(tooBigGlobal.status).toBe(413);
    } finally {
      await ctx.close();
    }
  }, 60_000);
});

describe("pdf: antet Content-Disposition", () => {
  it("păstrează diacriticele prin filename* și curăță caracterele periculoase", () => {
    const cd = contentDisposition('Anexă "x"\r\n/../a.pdf');
    expect(cd).not.toMatch(/[\r\n]/);
    expect(cd).toContain("attachment");
    expect(cd).toMatch(/filename="[\w.\- ]+\.pdf"/);
    expect(contentDisposition("Ofertă Grădinița")).toContain("filename*=UTF-8''Ofert%C4%83%20Gr%C4%83dini%C8%9Ba.pdf");
  });
});
