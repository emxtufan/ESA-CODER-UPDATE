/**
 * Smoke E2E pe aplicația reală (rulat cu `node`, nu cu vitest).
 *
 * Env:
 *   E2E_BASE      - baza URL (implicit http://127.0.0.1:5199)
 *   E2E_EMAIL     - emailul contului de test (obligatoriu)
 *   E2E_PASSWORD  - parola contului de test (obligatoriu, nu se loghează niciodată)
 *   E2E_OUT       - directorul pentru screenshots (implicit os.tmpdir())
 */
import { mkdirSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { chromium } from "playwright";

const BASE = process.env.E2E_BASE ?? "http://127.0.0.1:5199";
const EMAIL = process.env.E2E_EMAIL;
const PASSWORD = process.env.E2E_PASSWORD;
const OUT_DIR = process.env.E2E_OUT ?? os.tmpdir();
const HEALTH_TIMEOUT_MS = 60_000;

if (!EMAIL || !PASSWORD) {
  console.error("Lipsesc E2E_EMAIL / E2E_PASSWORD din mediu.");
  process.exit(1);
}

/** Așteaptă ca /api/health să răspundă OK, max `HEALTH_TIMEOUT_MS`. */
async function waitForHealth() {
  const deadline = Date.now() + HEALTH_TIMEOUT_MS;
  let lastError = "fără răspuns";
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${BASE}/api/health`);
      if (res.ok) return;
      lastError = `HTTP ${res.status}`;
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`/api/health nu a răspuns în ${HEALTH_TIMEOUT_MS}ms (ultima eroare: ${lastError})`);
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  await waitForHealth();

  const browser = await chromium.launch({ headless: true });
  const consoleErrors = [];
  try {
    const context = await browser.newContext({ viewport: { width: 1360, height: 820 } });
    const page = await context.newPage();
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });
    page.on("pageerror", (err) => {
      consoleErrors.push(err instanceof Error ? err.message : String(err));
    });

    const shot = (name) => page.screenshot({ path: path.join(OUT_DIR, name) });

    // 1. Login
    await page.goto(`${BASE}/`);
    await page.waitForSelector("input[name=email]");
    await shot("1-login.png");

    await page.fill("input[name=email]", EMAIL);
    await page.fill("input[type=password]", PASSWORD);
    await page.click("button[type=submit]");
    await page.getByText("Dashboard").first().waitFor();
    await shot("2-dash.png");

    // 2. Utilizatori
    await page.click("a[href='/users']");
    await page.getByText(EMAIL).first().waitFor();
    await shot("3-users.png");

    // 3. Audit
    await page.click("a[href='/audit']");
    await page.waitForTimeout(1500);
    await shot("4-audit.png");

    // 4. Setări
    await page.click("a[href='/settings']");
    await shot("5-settings.png");

    // 5. Mobil
    await page.setViewportSize({ width: 390, height: 780 });
    await shot("6-mobile.png");
  } finally {
    await browser.close();
  }

  console.log(`OK ${JSON.stringify(consoleErrors)}`);
  if (consoleErrors.length > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
