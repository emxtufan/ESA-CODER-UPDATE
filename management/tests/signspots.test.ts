import { readFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";
import { fileURLToPath } from "node:url";

import { chromium, type Browser, type Page } from "playwright-core";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { fill } from "../client/src/modules/legal/contract/engine";
import template from "../client/src/modules/legal/contract/template.html?raw";
import { applySignature } from "../server/modules/legal/signing-public";

/** Tabelul din cazul 2: doar celula BENEFICIAR trebuie marcată, o dată. */
const TABLE = `<table><tr><th>PRESTATOR</th><th>BENEFICIAR</th></tr><tr><td>Prin: X<br><br>Semnătura: ……<br><br>Data: ……</td><td>Prin: Y<br><br>Semnătura: ……<br><br>Data: ……</td></tr></table>`;

/** Sursele `signSpots.ts` compilează într-un script clasic, injectat în pagină. */
const script = stripTypeScriptTypes(
  readFileSync(fileURLToPath(new URL("../client/src/modules/legal/dossier/signSpots.ts", import.meta.url)), "utf8"),
).replace(/^export /gm, "");

let browser: Browser | null = null;
let available = true;
let skipReason = "";

/** Calea din env, apoi Chromium-ul instalat de Playwright, apoi Chrome-ul sistemului. */
async function launch(): Promise<Browser> {
  const args = ["--no-sandbox", "--disable-dev-shm-usage"];
  try {
    return await chromium.launch({ args, executablePath: process.env.PDF_CHROMIUM_PATH });
  } catch {
    return chromium.launch({ channel: "chrome", args });
  }
}

/** Pagina cu HTML-ul dat și funcția globală `markSignSpots` injectată. */
async function pageWith(content: string): Promise<Page> {
  const page = await browser!.newPage();
  await page.setContent(content);
  await page.addScriptTag({ content: script });
  return page;
}

async function mark(page: Page): Promise<void> {
  await page.evaluate(() => (window as unknown as { markSignSpots: (doc: Document) => void }).markSignSpots(document));
}

function counts(page: Page): Promise<{ sign: number; date: number }> {
  return page.evaluate(() => ({
    sign: document.querySelectorAll('span[data-sign="client"]').length,
    date: document.querySelectorAll('span[data-sign-date="client"]').length,
  }));
}

describe("signSpots: marcaj semnături", () => {
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

  it("marchează doar Semnătura în contractul completat, idempotent", async (t) => {
    if (!available) return t.skip(`Chromium indisponibil: ${skipReason}`);
    const page = await pageWith(fill(template, {}));
    try {
      await mark(page);

      expect(await counts(page)).toEqual({ sign: 3, date: 0 });

      // Toate marcajele stau în celula de pe coloana BENEFICIAR a tabelului lor.
      const misplaced = await page.evaluate(() => {
        const spans = Array.from(document.querySelectorAll('span[data-sign="client"]'));
        return spans.filter((span) => {
          const cell = span.closest("td,th") as HTMLTableCellElement | null;
          const header = cell?.closest("table")?.rows[0];
          if (!cell || !header) return true;
          const th = header.cells[cell.cellIndex];
          return !th || !(th.textContent ?? "").toUpperCase().includes("BENEFICIAR");
        }).length;
      });
      expect(misplaced).toBe(0);

      // A doua rulare nu adaugă nimic.
      await mark(page);
      expect(await counts(page)).toEqual({ sign: 3, date: 0 });
    } finally {
      await page.close();
    }
  });

  it("marchează Semnătura și Data în celula BENEFICIAR, idempotent", async (t) => {
    if (!available) return t.skip(`Chromium indisponibil: ${skipReason}`);
    const page = await pageWith(TABLE);
    try {
      await mark(page);

      expect(await counts(page)).toEqual({ sign: 1, date: 1 });

      const second = await page.evaluate(() => {
        const cell = (document.querySelectorAll("tr")[1] as HTMLTableRowElement).cells[1];
        return {
          sign: cell.querySelectorAll('span[data-sign="client"]').length,
          date: cell.querySelectorAll('span[data-sign-date="client"]').length,
        };
      });
      expect(second).toEqual({ sign: 1, date: 1 });

      await mark(page);
      expect(await counts(page)).toEqual({ sign: 1, date: 1 });
    } finally {
      await page.close();
    }
  });

  it("completează marcajele cu imaginea semnăturii și data semnării", async (t) => {
    if (!available) return t.skip(`Chromium indisponibil: ${skipReason}`);
    const page = await pageWith(TABLE);
    try {
      await mark(page);
      const html = await page.evaluate(() => document.body.innerHTML);
      const signed = applySignature(html, "data:image/png;base64,iVBORw0KGgo=", "05.03.2026");
      expect(signed).toContain("<img");
      expect(signed).toContain("05.03.2026");
    } finally {
      await page.close();
    }
  });
});
