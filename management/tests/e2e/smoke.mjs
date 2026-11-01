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
  let page;
  try {
    const context = await browser.newContext({ viewport: { width: 1360, height: 820 } });
    page = await context.newPage();
    page.on("console", (msg) => {
      if (msg.type() !== "error") return;
      const text = msg.text();
      // 401 pe /auth/me e normal cât timp utilizatorul nu e logat
      if (text.includes("status of 401")) return;
      consoleErrors.push(text);
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

    // 3. Audit
    await page.click("a[href='/audit']");
    await page.waitForTimeout(1500);
    await shot("4-audit.png");

    // 4. Setări
    await page.click("a[href='/settings']");
    await shot("5-settings.png");

    // 5. Client nou
    const stamp = Date.now();
    await page.click("a[href='/clients']");
    await page.getByRole("heading", { name: "Clienți" }).waitFor();
    await page.getByRole("button", { name: "Adaugă" }).click();
    await page.fill("dialog input[name=companyName]", `Client ${stamp}`);
    await page.getByRole("button", { name: "Salvează" }).click();
    await page.getByText(`Client ${stamp}`).first().waitFor();

    // 6. Proiect nou
    await page.click("a[href='/projects']");
    await page.getByRole("heading", { name: "Proiecte" }).waitFor();
    await page.getByRole("button", { name: "Adaugă" }).click();
    await page.fill("dialog input[name=name]", `Proiect ${stamp}`);
    await page.getByRole("option", { name: `Client ${stamp}` }).waitFor({ state: "attached" });
    await page.selectOption("dialog select[name=clientId]", { label: `Client ${stamp}` });
    await page.getByRole("button", { name: "Salvează" }).click();
    await page.getByText(`Proiect ${stamp}`).first().waitFor();
    await page.getByText(`Proiect ${stamp}`).first().click();
    await page.getByRole("tab", { name: "Timeline" }).waitFor();
    await shot("7-project.png");

    // 7. Kanban
    await page.click("a[href='/tasks']");
    await page.getByRole("heading", { name: "Taskuri" }).waitFor();
    await page.getByText("To Do").first().waitFor();
    await shot("8-kanban.png");

  // 7a. Infrastructură
  await page.click("a[href='/infrastructure']");
  await page.getByRole("heading", { name: "Infrastructură" }).first().waitFor();
  await shot("8a-infra.png");

  // 7b. Seif: secretul nu apare decât după reveal
  const secret = "s3cret-e2e-value";
  await page.click("a[href='/vault']");
  await page.getByRole("heading", { name: "Seif" }).waitFor();
  await page.getByRole("button", { name: "Adaugă" }).first().click();
  const credName = `E2E cred ${stamp}`;
  await page.fill("dialog[open] input[name=name]", credName);
  await page.selectOption("dialog[open] select[name=type]", { index: 1 });
  await page.fill("dialog[open] input[name=secret]", secret);
  await page.locator("dialog[open]").getByRole("button", { name: "Salvează" }).first().click();
  const credRow = page.locator("tr", { hasText: credName }).first();
  await credRow.waitFor();
  if ((await page.getByText(secret).count()) !== 0) throw new Error("secret vizibil înainte de reveal");
  await credRow.getByRole("button", { name: "Arată" }).click();
  await page.fill("#reveal-password", process.env.E2E_PASSWORD);
  await page.locator("dialog[open]").getByRole("button", { name: "Arată" }).click();
  await page.locator("dialog[open] code", { hasText: secret }).waitFor();
  await shot("8b-reveal.png");
  await page.locator("dialog[open]").getByRole("button", { name: "Închide" }).first().click();
  await page.locator("dialog[open]").waitFor({ state: "detached" });
  if ((await page.getByText(secret).count()) !== 0) throw new Error("secret rămas după închidere");
  await credRow.getByRole("button", { name: "Revocă" }).click();
  await page.locator("dialog[open]").getByRole("button", { name: "Revocă" }).click();
  await credRow.getByText("Revocat").waitFor();
  await shot("8c-revocat.png");

  // 7c. Tab Infrastructură în proiect
  await page.click("a[href='/projects']");
  await page.getByText(`Proiect ${stamp}`).first().click();
  await page.getByRole("tab", { name: "Infrastructură" }).click();
  for (const name of ["Servere", "Domenii", "Hosting", "Credențiale"]) {
    await page.getByRole("heading", { name }).waitFor();
  }
  await shot("8d-tab-infra.png");

  // 7d. GitHub: fără token apare „Neconectat”, iar sincronizarea e ascunsă
  await page.click("a[href='/github']");
  await page.getByRole("heading", { name: "GitHub" }).first().waitFor();
  await page.getByText("Neconectat", { exact: false }).first().waitFor();
  await page.getByRole("button", { name: "Adaugă" }).first().click();
  await page.fill("dialog[open] input[name=name]", `repo-${stamp}`);
  await page.fill("dialog[open] input[name=owner]", "esa");
  await page.locator("dialog[open]").getByRole("button", { name: "Salvează" }).first().click();
  await page.locator("tr", { hasText: `repo-${stamp}` }).first().waitFor();
  if ((await page.getByRole("button", { name: "Sincronizează" }).count()) !== 0) throw new Error("sync vizibil fără token");
  await shot("8e-github.png");

  // 7e. Deployments: înregistrare manuală, cu oră din formular
  await page.click("a[href='/deployments']");
  await page.getByRole("heading", { name: "Deployments" }).first().waitFor();
  await page.getByRole("button", { name: "Adaugă" }).first().click();
  await page.selectOption("dialog[open] select[name=projectId]", { label: `Proiect ${stamp}` });
  await page.selectOption("dialog[open] select[name=status]", { label: "Rolled Back" });
  await page.fill("dialog[open] input[name=environment]", `prod-${stamp}`);
  await page.fill("dialog[open] input[name=deployedAt]", "2026-03-05T14:30");
  await page.locator("dialog[open]").getByRole("button", { name: "Salvează" }).first().click();
  await page.locator("tr", { hasText: `prod-${stamp}` }).first().waitFor();
  await shot("8f-deployments.png");

    // 8. Căutare
    await page.fill("input[role=combobox]", `Client ${stamp}`);
    await page.getByRole("option").first().waitFor();
    await shot("9-search.png");
    await page.keyboard.press("Escape");

    // 9. Mobil
    await page.setViewportSize({ width: 390, height: 780 });
    await shot("6-mobile.png");
  } catch (err) {
    if (page) {
      try {
        await page.screenshot({ path: path.join(OUT_DIR, "fail.png") });
        const bodyText = await page.evaluate(() => document.body.innerText);
        console.error(`Screenshot de eșec: ${path.join(OUT_DIR, "fail.png")}`);
        console.error(`Primele 300 caractere din body.innerText:\n${bodyText.slice(0, 300)}`);
      } catch (captureErr) {
        console.error(`Nu am putut salva fail.png: ${captureErr instanceof Error ? captureErr.message : String(captureErr)}`);
      }
    }
    console.error(`consoleErrors (${consoleErrors.length}): ${JSON.stringify(consoleErrors)}`);
    throw err;
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
