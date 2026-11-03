import { readFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";
import { fileURLToPath } from "node:url";

import { chromium, type Browser, type Page } from "playwright-core";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { fill } from "../client/src/modules/legal/contract/engine";
import template from "../client/src/modules/legal/contract/template.html?raw";

/** Tabelul din cazul 2: ambele celule (PRESTATOR și BENEFICIAR) trebuie completate. */
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

/** Textele celulelor cu „Semnătura” din rândurile de date ale tabelelor care au BENEFICIAR în antet. */
function beneficiaryCells(page: Page): Promise<string[][]> {
  return page.evaluate(() =>
    Array.from(document.querySelectorAll("table"))
      .filter((table) => {
        const header = table.rows[0];
        return !!header && Array.from(header.cells).some((c) =>
          (c.textContent ?? "").toUpperCase().includes("BENEFICIAR"),
        );
      })
      .map((table) => {
        const texts: string[] = [];
        for (const row of Array.from(table.rows).slice(1)) {
          for (const cell of Array.from(row.cells)) {
            const text = cell.textContent ?? "";
            if (text.includes("Semnătura")) texts.push(text);
          }
        }
        return texts;
      }),
  );
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

  it("completează Semnătura în ambele coloane ale tabelelor cu BENEFICIAR, idempotent", async (t) => {
    if (!available) return t.skip(`Chromium indisponibil: ${skipReason}`);
    const page = await pageWith(fill(template, {}));
    try {
      await mark(page);

      const tables = await beneficiaryCells(page);
      expect(tables).toHaveLength(3);
      for (const cells of tables) {
        expect(cells).toHaveLength(2);
        for (const text of cells) {
          expect(text).toContain("Semnătura: electronică, art. 23.11");
          expect(text).not.toContain("…");
        }
      }

      // „Data:” fără puncte (urmat de data contractului) rămâne neatins.
      expect(tables.flat().some((text) => text.includes("Data: conform certificatului"))).toBe(false);

      // A doua rulare nu schimbă nimic.
      const html = await page.evaluate(() => document.body.innerHTML);
      await mark(page);
      expect(await page.evaluate(() => document.body.innerHTML)).toBe(html);
    } finally {
      await page.close();
    }
  });

  it("completează Semnătura și Data în ambele celule ale tabelului PRESTATOR/BENEFICIAR", async (t) => {
    if (!available) return t.skip(`Chromium indisponibil: ${skipReason}`);
    const page = await pageWith(TABLE);
    try {
      await mark(page);

      const tables = await beneficiaryCells(page);
      expect(tables).toHaveLength(1);
      const cells = tables[0];
      expect(cells).toHaveLength(2);
      for (const text of cells) {
        expect(text).toContain("Semnătura: electronică, art. 23.11");
        expect(text).toContain("Data: conform certificatului");
        expect(text).not.toContain("…");
      }

      // A doua rulare nu schimbă nimic.
      const html = await page.evaluate(() => document.body.innerHTML);
      await mark(page);
      expect(await page.evaluate(() => document.body.innerHTML)).toBe(html);
    } finally {
      await page.close();
    }
  });
});
