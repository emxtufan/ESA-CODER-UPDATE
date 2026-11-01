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

  // 7f. Financiar: factură cu linii, emitere, plată parțială
  await page.click("a[href='/finance']");
  await page.getByRole("heading", { name: "Financiar" }).first().waitFor();
  await page.getByRole("button", { name: "Factură nouă" }).click();
  await page.fill("dialog[open] input[name=number]", `F-${stamp}`);
  await page.selectOption("dialog[open] select[name=clientId]", { index: 1 });
  await page.fill("dialog[open] input[name=dueDate]", "2099-01-10");
  await page.fill("dialog[open] input[name='items.0.description']", "Dezvoltare");
  await page.fill("dialog[open] input[name='items.0.quantity']", "2");
  await page.fill("dialog[open] input[name='items.0.unitPrice']", "100");
  await shot("8g-factura-form.png");
  await page.locator("dialog[open]").getByRole("button", { name: "Salvează" }).click();
  const invoiceRow = page.locator("tr", { hasText: `F-${stamp}` }).first();
  await invoiceRow.waitFor();
  await invoiceRow.getByRole("button", { name: "Detalii" }).click();
  await page.locator("dialog[open]").getByRole("button", { name: "Emite" }).click();
  await page.locator("#invoice-payment-amount").waitFor();
  const suggested = Number(await page.inputValue("#invoice-payment-amount"));
  if (suggested !== 242) throw new Error(`sold sugerat greșit: ${suggested}`);
  await page.fill("#invoice-payment-amount", "100");
  await page.locator("dialog[open]").getByRole("button", { name: "Înregistrează plata" }).click();
  await page.locator("dialog[open]").getByText("Partially Paid").first().waitFor();
  await shot("8h-factura-platita.png");
  await page.locator("dialog[open]").getByRole("button", { name: "Închide" }).first().click();

  // 7g. Cheltuială, curs și profit
  await page.goto(new URL("/finance?tab=expenses", page.url()).href);
  await page.getByRole("button", { name: "Adaugă" }).first().click();
  await page.fill("dialog[open] input[name=name]", `Chelt ${stamp}`);
  await page.selectOption("dialog[open] select[name=category]", { index: 1 });
  await page.fill("dialog[open] input[name=amount]", "50");
  await page.selectOption("dialog[open] select[name=currency]", { label: "RON" });
  await page.fill("dialog[open] input[name=spentAt]", "2026-01-12");
  await page.locator("dialog[open]").getByRole("button", { name: "Salvează" }).first().click();
  await page.locator("tr", { hasText: `Chelt ${stamp}` }).first().waitFor();
  await page.goto(new URL("/finance?tab=rates", page.url()).href);
  await page.getByRole("button", { name: "Adaugă" }).first().click();
  await page.fill("dialog[open] input[name=date]", new Date((Number(stamp) % 1e9) * 1000).toISOString().slice(0, 10));
  await page.selectOption("dialog[open] select[name=fromCurrency]", { label: "EUR" });
  await page.selectOption("dialog[open] select[name=toCurrency]", { label: "RON" });
  await page.fill("dialog[open] input[name=rate]", "4.97");
  await page.locator("dialog[open]").getByRole("button", { name: "Salvează" }).first().click();
  await page.locator("tr", { hasText: "4.97" }).first().waitFor();
  await page.goto(new URL("/finance?tab=profit", page.url()).href);
  await page.getByText("Cheltuieli").first().waitFor();
  await shot("8i-profit.png");

  // 7h. Documente: fișier încărcat, versiune și descărcare
  await page.click("a[href='/documents']");
  await page.getByRole("heading", { name: "Documente" }).first().waitFor();
  await page.getByRole("button", { name: "Adaugă" }).first().click();
  await page.fill("dialog[open] input[name=name]", `Doc ${stamp}`);
  await page.selectOption("dialog[open] select[name=type]", { index: 1 });
  await page.locator("dialog[open]").getByRole("button", { name: "Salvează" }).first().click();
  const docRow = page.locator("tr", { hasText: `Doc ${stamp}` }).first();
  await docRow.waitFor();
  await docRow.locator("input[type=file]").setInputFiles({ name: "contract.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.7 e2e") });
  await docRow.getByText("v1").waitFor();
  await docRow.getByRole("button", { name: "Versiuni" }).click();
  await page.locator("dialog[open]").getByText("Descarcă").first().waitFor();
  await shot("8j-documente.png");
  await page.locator("dialog[open]").getByRole("button", { name: "Închide" }).first().click();

  // 7i. Mentenanță și notificări
  await page.click("a[href='/maintenance']");
  await page.getByRole("heading", { name: "Mentenanță" }).first().waitFor();
  await page.getByRole("button", { name: "Adaugă" }).first().click();
  await page.selectOption("dialog[open] select[name=projectId]", { label: `Proiect ${stamp}` });
  await page.selectOption("dialog[open] select[name=plan]", { label: "Standard" });
  await page.fill("dialog[open] input[name=monthlyPrice]", "150");
  await page.selectOption("dialog[open] select[name=currency]", { label: "EUR" });
  await page.locator("dialog[open]").getByRole("button", { name: "Salvează" }).first().click();
  await page.locator("tr", { hasText: `Proiect ${stamp}` }).first().waitFor();
  await shot("8k-mentenanta.png");
  await page.click("a[aria-label='Notificări']");
  await page.getByRole("heading", { name: "Notificări" }).first().waitFor();
  await page.getByText(`Factura F-${stamp} a fost emisă`).first().waitFor();
  await shot("8l-notificari.png");

  // 7j. Dashboard
  await page.goto(`${BASE}/`);
  await page.getByRole("heading", { name: "Dashboard" }).first().waitFor();
  await shot(`dashboard-${stamp}.png`);

  // 7k. Monitorizare: verificare nouă
  await page.goto(new URL("/monitoring", BASE).href);
  await page.getByRole("heading", { name: "Monitorizare" }).first().waitFor();
  await page.getByRole("button", { name: "Adaugă" }).first().click();
  await page.selectOption("dialog[open] select[name=projectId]", { index: 1 });
  const checkUrl = `https://example.com/e2e-${stamp}`;
  await page.fill("dialog[open] input[name=url]", checkUrl);
  await page.locator("dialog[open]").getByRole("button", { name: "Salvează" }).first().click();
  await page.locator("tr", { hasText: checkUrl }).first().waitFor();
  await shot(`monitoring-${stamp}.png`);

  // 7l. Monitorizare: incidente și servere
  const incidentsResponse = page.waitForResponse((res) => res.url().includes("/api/monitoring/incidents"));
  await page.goto(new URL("/monitoring?tab=incidents", BASE).href);
  await incidentsResponse;
  await page.getByRole("tab", { name: "Incidente" }).waitFor();
  await page.goto(new URL("/monitoring?tab=servers", BASE).href);
  await page.getByText(/Neconectat|Niciun server adăugat/).first().waitFor();
  await shot(`monitoring-servers-${stamp}.png`);

  // 7m. Rapoarte: export CSV/Excel și raport de taskuri
  await page.goto(new URL("/reports", BASE).href);
  await page.getByRole("heading", { name: "Rapoarte" }).first().waitFor();
  const csvHref = await page.getByRole("link", { name: "CSV" }).first().getAttribute("href");
  const xlsxHref = await page.getByRole("link", { name: "Excel" }).first().getAttribute("href");
  if (!csvHref || !csvHref.includes("format=csv")) throw new Error(`link CSV fără format=csv: ${csvHref}`);
  if (!xlsxHref || !xlsxHref.includes("format=xlsx")) throw new Error(`link Excel fără format=xlsx: ${xlsxHref}`);
  const tasksReport = page.waitForResponse((res) => res.url().includes("/api/reports/tasks") && res.status() === 200);
  await page.selectOption("#report-type", "tasks");
  await tasksReport;
  await shot(`reports-${stamp}.png`);

  // 7n. Proiect creat mai sus, tab "Operațiuni"
  await page.click("a[href='/projects']");
  await page.getByRole("heading", { name: "Proiecte" }).waitFor();
  await page.getByText(`Proiect ${stamp}`).first().click();
  await page.getByRole("tab", { name: "Timeline" }).waitFor();
  const projectUrl = new URL(page.url());
  projectUrl.searchParams.set("tab", "operations");
  await page.goto(projectUrl.href);
  await page.getByRole("heading", { name: "Monitorizare" }).first().waitFor();
  await shot(`project-operations-${stamp}.png`);

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
