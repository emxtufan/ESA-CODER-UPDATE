/**
 * Nimic peste footer și semnătura peste tot: paginarea din client (paragrafe și rânduri de tabel
 * mai înalte decât o pagină) și pasul de așezare de pe server (`page-layout.js`): garanția de
 * pagină și semnătura Beneficiarului în fiecare loc de semnare și pe fiecare pagină.
 * Totul rulează în Chromium, ca în aplicație; testele se sar dacă lipsește.
 */
import { readFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";
import { fileURLToPath } from "node:url";

import { chromium, type Browser, type Page } from "playwright-core";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { CONTENT_LIMIT_MM, FOOTER_GAP_MM, applyLayout } from "../server/lib/pdf";

const read = (path: string): string => readFileSync(fileURLToPath(new URL(path, import.meta.url)), "utf8");

/** Motorul de paginare din client, ca script clasic (funcțiile devin globale). */
const ENGINE = stripTypeScriptTypes(read("../client/src/modules/legal/contract/engine.ts")).replace(/^export /gm, "");
const PAGE_CSS = read("../client/src/modules/legal/contract/page.css");
const DOSSIER_CSS = read("../client/src/modules/legal/dossier/dossier.css");

const MM = 96 / 25.4;

let browser: Browser | null = null;
let available = true;
let skipReason = "";

async function launch(): Promise<Browser> {
  const args = ["--no-sandbox", "--disable-dev-shm-usage"];
  try {
    return await chromium.launch({ args, executablePath: process.env.PDF_CHROMIUM_PATH });
  } catch {
    return chromium.launch({ channel: "chrome", args });
  }
}

/**
 * Pentru fiecare pagină: cât ocupă textul (mm de la începutul zonei de text, după transformări),
 * unde e limita lui (mm de la începutul zonei) și textul paginii.
 */
const MEASURE = `(() => {
  const MM = 96 / 25.4;
  return Array.from(document.querySelectorAll(".pg")).filter((pg) => pg.querySelector(":scope > .pc")).map((pg) => {
    const pc = pg.querySelector(":scope > .pc");
    const ftr = pg.querySelector(":scope > .ftr");
    const top = pc.getBoundingClientRect().top;
    let bottom = top;
    for (const el of pc.querySelectorAll("*")) {
      const r = el.getBoundingClientRect();
      if (r.width > 0 || r.height > 0) bottom = Math.max(bottom, r.bottom);
    }
    const limit = Math.min(${CONTENT_LIMIT_MM} * MM, ftr ? ftr.getBoundingClientRect().top - top - ${FOOTER_GAP_MM} * MM : Infinity);
    const mark = pg.querySelector(":scope > .esa-sign-mark");
    return {
      used: (bottom - top) / MM,
      limit: limit / MM,
      text: pc.textContent,
      markTop: mark ? (mark.getBoundingClientRect().top - top) / MM : null,
      scaled: pc.style.transform !== "",
    };
  });
})()`;

type PageInfo = { used: number; limit: number; text: string; markTop: number | null; scaled: boolean };

/** Pagina cu motorul de paginare și CSS-ul documentelor; avertismentele din consolă sunt colectate. */
async function enginePage(): Promise<{ page: Page; warnings: string[] }> {
  const page = await browser!.newPage();
  const warnings: string[] = [];
  page.on("console", (m) => {
    if (m.type() === "warning") warnings.push(m.text());
  });
  await page.setContent(
    `<!doctype html><html><head><meta charset="utf-8"><style>${PAGE_CSS}${DOSSIER_CSS}</style></head><body><div id="pages"></div></body></html>`,
  );
  await page.addScriptTag({ content: ENGINE });
  return { page, warnings };
}

async function paginateBody(page: Page, body: string): Promise<PageInfo[]> {
  await page.evaluate(
    `renderPages(document, ${JSON.stringify(body)}, {}, { logo: "", mail: "", phone: "", web: "" }, "Test")`,
  );
  return (await page.evaluate(MEASURE)) as PageInfo[];
}

/** Un document paginat ca cele exportate: pagini A4 cu antet, zona de text și footer. */
function paged(pages: string[]): string {
  const pg = (content: string) =>
    `<section class="pg"><div class="hdr"><span>Antet</span></div><div class="pc">${content}</div><div class="ftr"><div>Footer</div></div></section>`;
  return `<!doctype html><html><head><meta charset="utf-8"><style>${PAGE_CSS}${DOSSIER_CSS}</style></head><body><div id="pages">${pages.map(pg).join("")}</div></body></html>`;
}

/** Paragrafe de înălțime fixă, cât să ocupe `mm` din zona de text. */
const blocks = (mm: number) =>
  Array.from({ length: mm / 10 }, (_, i) => `<p style="height:10mm;margin:0">Rând ${i + 1}</p>`).join("");

/** Pagină fără JavaScript (ca pe server); scriptul de așezare rulează totuși prin `evaluate`. */
async function serverPage(html: string): Promise<Page> {
  const context = await browser!.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.emulateMedia({ media: "print" });
  await page.setContent(html, { waitUntil: "load" });
  return page;
}

/** O semnătură desenată ca pe pad: 600×200, fundal alb, o trăsătură și un punct scăpat într-un colț. */
async function drawnSignature(): Promise<string> {
  const page = await browser!.newPage();
  try {
    return (await page.evaluate(`(() => {
      const c = document.createElement("canvas");
      c.width = 600; c.height = 200;
      const g = c.getContext("2d");
      g.fillStyle = "#fff"; g.fillRect(0, 0, 600, 200);
      g.strokeStyle = "#1d1d1f"; g.lineWidth = 5; g.lineCap = "round";
      g.beginPath(); g.moveTo(250, 140); g.bezierCurveTo(280, 20, 330, 180, 360, 60); g.lineTo(400, 120); g.stroke();
      g.fillStyle = "#1d1d1f"; g.fillRect(20, 15, 4, 4);
      return c.toDataURL("image/png");
    })()`)) as string;
  } finally {
    await page.close();
  }
}

describe("paginare și așezare: nimic peste footer, semnătura peste tot", () => {
  beforeAll(async () => {
    try {
      browser = await launch();
    } catch (error) {
      available = false;
      skipReason = error instanceof Error ? error.message : String(error);
    }
  }, 60_000);

  afterAll(async () => {
    await browser?.close();
    browser = null;
  });

  it("un paragraf mai lung decât o pagină se rupe pe cuvinte, fără să treacă de limită", async (t) => {
    if (!available) return t.skip(`Chromium indisponibil: ${skipReason}`);
    const { page, warnings } = await enginePage();
    try {
      const words = Array.from({ length: 1400 }, (_, i) => `cuvânt${i}`);
      const pages = await paginateBody(page, `<h2>Titlu</h2><p>Introducere.</p><p>${words.join(" ")}</p><p>După.</p>`);

      expect(pages.length).toBeGreaterThanOrEqual(3);
      for (const p of pages) expect(p.used).toBeLessThanOrEqual(CONTENT_LIMIT_MM + 0.5);
      expect(warnings.filter((w) => w.includes("forțat"))).toEqual([]);

      // Toate cuvintele, o singură dată și în ordine.
      const found = pages.map((p) => p.text).join(" ").match(/cuvânt\d+/g) ?? [];
      expect(found).toEqual(words);
    } finally {
      await page.close();
    }
  });

  it("un rând de tabel mai înalt decât o pagină (Specificația) se continuă pe pagina următoare", async (t) => {
    if (!available) return t.skip(`Chromium indisponibil: ${skipReason}`);
    const { page, warnings } = await enginePage();
    try {
      const items = Array.from({ length: 120 }, (_, i) => `Serviciu ${i + 1} – descriere a serviciului`);
      const body =
        `<h2>Anexa 1 – Model de Comandă</h2><table><thead><tr><th>Câmp</th><th>Se completează</th></tr></thead><tbody>` +
        `<tr><td>Denumire</td><td>Proiect</td></tr><tr><td>Specificația</td><td>${items.join("<br>")}</td></tr>` +
        `<tr><td>Livrabile</td><td>Conform tabelului</td></tr></tbody></table>`;
      const pages = await paginateBody(page, body);

      expect(pages.length).toBeGreaterThanOrEqual(2);
      for (const p of pages) expect(p.used).toBeLessThanOrEqual(CONTENT_LIMIT_MM + 0.5);
      expect(warnings.filter((w) => w.includes("forțat"))).toEqual([]);
      const found = pages.map((p) => p.text).join(" ").match(/Serviciu \d+/g) ?? [];
      expect(found).toEqual(items.map((s) => s.split(" –")[0]));
    } finally {
      await page.close();
    }
  });

  it("pe server, o pagină care trece de limită e micșorată cât să încapă; celelalte rămân neatinse", async (t) => {
    if (!available) return t.skip(`Chromium indisponibil: ${skipReason}`);
    const page = await serverPage(paged([blocks(240), blocks(100)]));
    try {
      const report = await applyLayout(page);
      expect(report.fitted).toHaveLength(1);
      expect(report.fitted[0].page).toBe(1);
      expect(report.fitted[0].overMm).toBeGreaterThan(9);
      expect(report.fitted[0].scale).toBeLessThan(0.97);

      const [first, second] = (await page.evaluate(MEASURE)) as PageInfo[];
      expect(first.scaled).toBe(true);
      expect(first.used).toBeLessThanOrEqual(first.limit + 0.1);
      expect(second.scaled).toBe(false);
      expect(second.used).toBeCloseTo(100, 0);
    } finally {
      await page.context().close();
    }
  });

  it("la semnare: semnătura în fiecare loc al Beneficiarului și pe fiecare pagină, fără să treacă de limită", async (t) => {
    if (!available) return t.skip(`Chromium indisponibil: ${skipReason}`);
    const png = await drawnSignature();

    const contract =
      `<p><strong>Beneficiar – semnătura pentru acceptarea expresă a clauzelor de mai sus:</strong> …………………………</p>` +
      `<table><thead><tr class="header"><th>PRESTATOR</th><th>BENEFICIAR</th></tr></thead><tbody>` +
      `<tr><td>Prin: Ana Ionescu, administrator</td><td>Prin: <span class="f">Ion</span>, <span class="b">………………</span></td></tr>` +
      `<tr><td>Semnătura: electronică, art. 23.11</td><td>Semnătura: electronică, art. 23.11</td></tr>` +
      `<tr><td>Data: 03.11.2026</td><td>Data: 03.11.2026</td></tr></tbody></table>`;
    const annex =
      `<p>Anexa de servicii.</p><table class="sig"><thead><tr><th>PRESTATOR</th><th>BENEFICIAR</th></tr></thead><tbody>` +
      `<tr><td>Prin: Ana Ionescu<br><br>Semnătura: electronică, art. 23.11<br><br>Data: conform certificatului</td>` +
      `<td>Prin: Ion<br><br>Semnătura: electronică, art. 23.11<br><br>Data: conform certificatului</td></tr></tbody></table>` +
      `<h2>Anexa 2 – Model de proces-verbal de recepție</h2>` +
      `<table><thead><tr><th>PRESTATOR</th><th>BENEFICIAR</th></tr></thead><tbody>` +
      `<tr><td>Prin: Ana Ionescu</td><td>Prin: Ion</td></tr><tr><td>Semnătura: …………</td><td>Semnătura: …………</td></tr></tbody></table>`;
    // Pagina 3: aproape plină; semnătura din tabel are doar câțiva milimetri în plus.
    const full = `<h2>Anexa 3 – Acord</h2>` + blocks(190) + contract.slice(contract.indexOf("<table>"));
    const certificate = `<section class="pg"><h1>Certificat de semnare electronică</h1></section>`;
    const html = paged([contract, annex, full]).replace("</div></body>", `${certificate}</div></body>`);

    const page = await serverPage(html);
    try {
      const report = await applyLayout(page, {
        sign: { png, name: "Ion Popescu", role: "Administrator", date: "05.11.2026" },
      });
      // Acceptarea + tabelul contractului + anexa (pagina 2) + anexa (pagina 3); modelul de PV nu.
      expect(report.spots).toBe(4);
      expect(report.marks).toBe(3);

      const facts = (await page.evaluate(`(() => {
        const cells = (table, col) => Array.from(table.rows).slice(1).map((r) => r.cells[col].textContent.replace(/\\s+/g, " ").trim());
        const tables = Array.from(document.querySelectorAll(".pc table"));
        const lineTop = (cell, label) => {
          const walker = document.createTreeWalker(cell, NodeFilter.SHOW_TEXT);
          for (let n = walker.nextNode(); n; n = walker.nextNode()) {
            if (n.data.trim().startsWith(label)) { const r = document.createRange(); r.selectNodeContents(n); return r.getClientRects()[0].top; }
          }
          return null;
        };
        const annexRow = tables[1].rows[1];
        const imgs = Array.from(document.querySelectorAll(".esa-sig img"));
        return {
          prestator: cells(tables[0], 0),
          beneficiar: cells(tables[0], 1),
          annex: [annexRow.cells[0].innerText.replace(/\\s+/g, " ").trim(), annexRow.cells[1].innerText.replace(/\\s+/g, " ").trim()],
          model: cells(tables[2], 1),
          dataAligned: Math.abs(lineTop(annexRow.cells[0], "Data:") - lineTop(annexRow.cells[1], "Data:")),
          semnAligned: Math.abs(lineTop(annexRow.cells[0], "Semnătura:") - lineTop(annexRow.cells[1], "Semnătura:")),
          acceptance: document.querySelector(".pc p").textContent.includes("…"),
          imgs: imgs.map((i) => ({ w: i.getBoundingClientRect().width, h: i.getBoundingClientRect().height, natural: i.naturalWidth, loaded: i.complete && i.naturalWidth > 0 })),
          markImgs: document.querySelectorAll(".esa-sign-mark img").length,
          certificateMark: !!document.querySelector(".pg:last-child .esa-sign-mark"),
          markText: document.querySelector(".esa-sign-mark").textContent,
        };
      })()`)) as {
        prestator: string[];
        beneficiar: string[];
        annex: string[];
        model: string[];
        dataAligned: number;
        semnAligned: number;
        acceptance: boolean;
        imgs: { w: number; h: number; natural: number; loaded: boolean }[];
        markImgs: number;
        certificateMark: boolean;
        markText: string;
      };

      // PRESTATOR neatins; BENEFICIAR: numele și funcția semnatarului, semnătura, data contractului păstrată.
      expect(facts.prestator).toEqual([
        "Prin: Ana Ionescu, administrator",
        "Semnătura: electronică, art. 23.11",
        "Data: 03.11.2026",
      ]);
      expect(facts.beneficiar).toEqual(["Prin: Ion Popescu, Administrator", "Semnătura:", "Data: 03.11.2026"]);
      // Anexa: „Data: conform certificatului” devine data semnării; etichetele rămân aliniate cu PRESTATOR.
      expect(facts.annex[1]).toBe("Prin: Ion Popescu, Administrator Semnătura: Data: 05.11.2026");
      expect(facts.annex[0]).toContain("Data: conform certificatului");
      expect(facts.semnAligned).toBeLessThan(0.5);
      expect(facts.dataAligned).toBeLessThan(0.5);
      // Modelul gol de proces-verbal nu se semnează.
      expect(facts.model).toEqual(["Prin: Ion", "Semnătura: …………"]);
      expect(facts.acceptance).toBe(false);

      // Semnătura e decupată la trăsătură (punctul scăpat din colț nu lărgește decupajul: ~150 px din 600).
      expect(facts.imgs).toHaveLength(4);
      for (const img of facts.imgs) {
        expect(img.loaded).toBe(true);
        expect(img.natural).toBeLessThan(250);
        expect(img.h).toBeGreaterThan(3 * MM);
      }
      // Unde e loc, semnătura are înălțimea dorită (13 mm), nu doar cât un rând.
      expect(Math.max(...facts.imgs.map((i) => i.h))).toBeGreaterThan(10 * MM);
      expect(facts.markImgs).toBe(3);
      expect(facts.certificateMark).toBe(false);
      expect(facts.markText).toContain("Ion Popescu");
      expect(facts.markText).toContain("05.11.2026");

      // Nicio pagină peste limită; semnătura de pe pagină stă sub text, deasupra footerului.
      for (const p of (await page.evaluate(MEASURE)) as PageInfo[]) {
        expect(p.used).toBeLessThanOrEqual(p.limit + 0.3);
        expect(p.markTop).not.toBeNull();
        expect(p.markTop!).toBeGreaterThanOrEqual(p.used);
      }
    } finally {
      await page.context().close();
    }
  });

  it("o semnătură care nu se poate citi nu oprește documentul: numele și data se completează", async (t) => {
    if (!available) return t.skip(`Chromium indisponibil: ${skipReason}`);
    const annex =
      `<table class="sig"><thead><tr><th>PRESTATOR</th><th>BENEFICIAR</th></tr></thead><tbody>` +
      `<tr><td>Prin: Ana<br><br>Semnătura: electronică<br><br>Data: conform certificatului</td>` +
      `<td>Prin: Ion<br><br>Semnătura: electronică<br><br>Data: conform certificatului</td></tr></tbody></table>`;
    const page = await serverPage(paged([annex]));
    try {
      const report = await applyLayout(page, {
        sign: { png: "data:image/png;base64,iVBORw0KGgo=", name: "Ion Popescu", date: "05.11.2026" },
      });
      expect(report.spots).toBe(0);
      expect(report.marks).toBe(1);
      const text = (await page.evaluate(
        `document.querySelectorAll(".pc td")[1].innerText.replace(/\\s+/g, " ").trim()`,
      )) as string;
      expect(text).toBe("Prin: Ion Popescu Semnătura: electronică Data: 05.11.2026");
    } finally {
      await page.context().close();
    }
  });
});
