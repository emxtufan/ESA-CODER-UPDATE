import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { compute, fill, fmtDate, words, type Values } from "../client/src/modules/legal/contract/engine";
import { defaultValues } from "../client/src/modules/legal/contract/fields";
import template from "../client/src/modules/legal/contract/template.html?raw";
import { setup, type Setup } from "./helpers";

let ctx: Setup;
let cookie: string;
let clientId: string;
let projectId: string;

const year = new Date().getFullYear();
const data = { nr: "", data: "2026-03-05", clNume: "Delta SRL", proiect: "Site" };

function contract(body: Record<string, unknown> = {}) {
  return ctx.api("/api/legal/contracts", { method: "POST", cookie, body: { clientId, data, ...body } });
}

describe("legal: API", () => {
  beforeAll(async () => {
    ctx = await setup();
    cookie = await ctx.loginAs(await ctx.makeUser("super_admin"));
    clientId = (await ctx.api("/api/clients", { method: "POST", cookie, body: { companyName: "Delta", iban: "RO49AAAA1B31007593840000", bank: "BT" } })).json.item.id;
    projectId = (
      await ctx.api("/api/projects", { method: "POST", cookie, body: { name: "Site", clientId, type: "Landing Page", status: "Planned", priority: "Medium" } })
    ).json.item.id;
  });
  afterAll(() => ctx.close());

  it("refuză accesul neautentificat", async () => {
    expect((await ctx.api("/api/legal/provider")).status).toBe(401);
    expect((await ctx.api("/api/legal/contracts")).status).toBe(401);
    expect((await ctx.api("/api/legal/contracts/next-number")).status).toBe(401);
    expect((await ctx.api("/api/legal/contracts", { method: "POST", body: { clientId, data } })).status).toBe(401);
  });

  it("păstrează IBAN și banca clientului", async () => {
    const res = await ctx.api(`/api/clients/${clientId}`, { cookie });
    expect(res.json.item.iban).toBe("RO49AAAA1B31007593840000");
    expect(res.json.item.bank).toBe("BT");
  });

  it("întoarce valorile implicite ale prestatorului și le salvează", async () => {
    const first = await ctx.api("/api/legal/provider", { cookie });
    expect(first.status).toBe(200);
    expect(first.json.item.esaNume).toBe("ELEXA SOCIETY S.R.L.");
    expect(first.json.item.esaIban).toBe("");

    const put = await ctx.api("/api/legal/provider", { method: "PUT", cookie, body: { esaIban: "RO49AAAA1B31007593840000", esaBanca: "ING", altceva: "x" } });
    expect(put.status).toBe(200);
    const again = await ctx.api("/api/legal/provider", { cookie });
    expect(again.json.item.esaIban).toBe("RO49AAAA1B31007593840000");
    expect(again.json.item.esaBanca).toBe("ING");
    expect(again.json.item.esaCui).toBe("52745149");
    expect(again.json.item.altceva).toBeUndefined();

    expect((await ctx.api("/api/legal/provider", { method: "PUT", cookie, body: { esaIban: 5 } })).status).toBe(422);
  });

  it("numerotează 001, 002 și refuză duplicatele", async () => {
    expect((await ctx.api("/api/legal/contracts/next-number", { cookie })).json.number).toBe(`ESA-${year}-001`);

    const a = await contract();
    expect(a.status).toBe(201);
    expect(a.json.item.number).toBe(`ESA-${year}-001`);
    expect(a.json.item.title).toBe(`Contract-cadru nr. ESA-${year}-001`);
    expect(a.json.item.status).toBe("draft");

    const b = await contract();
    expect(b.json.item.number).toBe(`ESA-${year}-002`);
    expect((await ctx.api("/api/legal/contracts/next-number", { cookie })).json.number).toBe(`ESA-${year}-003`);

    const dup = await contract({ number: `ESA-${year}-001` });
    expect(dup.status).toBe(409);
    expect(dup.json.error.message).toMatch(/număr/);
  });

  it("face CRUD pe contracte", async () => {
    const created = await contract({ number: "X-1", projectId });
    expect(created.status).toBe(201);
    const id = created.json.item.id as string;
    expect(created.json.item.clientName).toBe("Delta");
    expect(created.json.item.projectName).toBe("Site");

    const got = await ctx.api(`/api/legal/contracts/${id}`, { cookie });
    expect(got.json.item.data.clNume).toBe("Delta SRL");

    const upd = await ctx.api(`/api/legal/contracts/${id}`, { method: "PUT", cookie, body: { status: "semnat", data: { ...data, proiect: "Nou" } } });
    expect(upd.status).toBe(200);
    expect(upd.json.item.status).toBe("semnat");
    expect(upd.json.item.signedAt).toMatch(/^2026-03-0[45]/);
    expect(upd.json.item.data.proiect).toBe("Nou");

    expect((await ctx.api(`/api/legal/contracts/${id}`, { method: "PUT", cookie, body: { status: "altceva" } })).status).toBe(422);
    expect((await ctx.api(`/api/legal/contracts/${id}`, { method: "PUT", cookie, body: { data: { a: 1 } } })).status).toBe(422);

    const list = await ctx.api(`/api/legal/contracts?clientId=${clientId}&q=Delta`, { cookie });
    expect(list.status).toBe(200);
    expect(list.json.total).toBeGreaterThanOrEqual(3);
    expect(list.json.items.find((r: any) => r.id === id).date).toBe("2026-03-05");

    expect((await ctx.api(`/api/legal/contracts/${id}`, { method: "DELETE", cookie })).status).toBe(204);
    expect((await ctx.api(`/api/legal/contracts/${id}`, { cookie })).status).toBe(404);
  });

  it("respinge clientul inexistent", async () => {
    const res = await contract({ clientId: "00000000-0000-4000-8000-000000000000" });
    expect(res.status).toBe(409);
  });
});

describe("legal: motorul contractului", () => {
  it("calculează valorile derivate", () => {
    const V: Values = { ...defaultValues(), termenPlata: "7", revizii: "3", garantie: "1", pret: "12500", moneda: "euro", tarifOrar: "" };
    const C = compute(V);
    expect(C.termenPlata.t).toBe("7 (șapte)");
    expect(C.revizii.t).toBe("3 (trei)");
    expect(C.garantieTxt.t).toBe("1 zi");
    expect(C.tarif55.t).toBe("comunicat în scris Beneficiarului");
    expect(C.pretTxt.t).toContain("euro");
    expect(words(25)).toBe("douăzeci și cinci");
    expect(fmtDate("2026-03-05")).toBe("05.03.2026");
  });

  it("completează șablonul: valori evidențiate, goluri cu puncte", () => {
    const V: Values = { ...defaultValues(), nr: "ESA-2026-001", data: "2026-03-05", clNume: "A & B <S.R.L.>" };
    const out = fill(template, V);
    expect(out).not.toMatch(/\{\{nr\}\}/);
    expect(out).toContain('<span class="f">ESA-2026-001</span>');
    expect(out).toContain('<span class="f">A &amp; B &lt;S.R.L.&gt;</span>');
    expect(out).toContain('<span class="b">' + "…".repeat(12) + "</span>");
    expect(out).not.toMatch(/\{\{\w+\}\}/);
  });
});
