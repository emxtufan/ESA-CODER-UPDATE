import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { asc, eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { catalogCategories, catalogPackageItems, catalogPackages, catalogServices } from "../server/db/schema/legal";
import { importCatalogFile } from "../server/modules/catalog/transfer";
import { CATEGORIES, PACKAGES, PRICES, SERVICES, seedCatalog, shortOf } from "../server/modules/catalog/seed";
import { setup, type Setup } from "./helpers";

let ctx: Setup;
let cookie: string;

describe("catalog: seed", () => {
  beforeAll(async () => {
    ctx = await setup();
    cookie = await ctx.loginAs(await ctx.makeUser("super_admin"));
  });
  afterAll(() => ctx.close());

  it("încarcă categoriile A–L", async () => {
    const rows = await ctx.db.select().from(catalogCategories);
    expect(rows.map((r) => r.code).sort()).toEqual("ABCDEFGHIJKL".split(""));
    expect(rows.find((r) => r.code === "G")?.note).toContain("bugetele publicitare");
    expect(rows.find((r) => r.code === "F")?.note).toContain("nu garantează");
  });

  it("încarcă serviciile cu stările și unitățile corecte", async () => {
    const rows = await ctx.db.select().from(catalogServices);
    expect(rows).toHaveLength(SERVICES.length);
    expect(rows).toHaveLength(144);
    const by = new Map(rows.map((r) => [r.code, r]));

    for (const code of ["G13", "L13"]) expect(by.get(code)?.defaultStatus).toBe("client_direct");
    for (const code of ["D08", "D09", "D10", "D11", "D12"]) {
      expect(by.get(code)).toMatchObject({ advanced: true, defaultStatus: "optional" });
    }
    expect(rows.filter((r) => r.advanced)).toHaveLength(5);
    expect(by.get("K08")?.unit).toBe("oră");
    expect(by.get("B05")?.unit).toBe("pagină");
    expect(by.get("K04")).toMatchObject({ billing: "monthly", unit: "lună" });
    expect(by.get("G02")?.billing).toBe("monthly");
    expect(by.get("B02")).toMatchObject({ billing: "one_time", defaultStatus: "accepted", defaultPeriods: 1 });

    for (const r of rows) {
      expect(r.recommendedPrice).toBe(PRICES[r.code] !== undefined ? PRICES[r.code] * 100 : null);
      expect(r.deliverables.length).toBeGreaterThan(10);
      expect(r.acceptance.length).toBeGreaterThan(10);
      expect(r.shortDescription.length).toBeGreaterThan(5);
      expect(r.shortDescription.length).toBeLessThanOrEqual(90);
      expect(r.categoryCode).toBe(r.code[0]);
    }
    // fără promisiuni de rezultat
    expect(by.get("F02")?.acceptance).toMatch(/nu se garantează/);
  });

  it("încarcă cele 12 pachete cu componentele corecte", async () => {
    const pkgs = await ctx.db.select().from(catalogPackages);
    expect(pkgs).toHaveLength(12);
    expect(pkgs.filter((p) => p.billing === "monthly").map((p) => p.name).sort()).toEqual(["Mentenanță Website", "Social Media Management"]);

    const res = await ctx.api("/api/catalog/packages", { cookie });
    const items: any[] = res.json.items;
    expect(items).toHaveLength(12);
    for (const spec of PACKAGES) {
      const got = items.find((p) => p.name === spec.name);
      expect(got.items.map((s: any) => s.code)).toEqual(spec.codes);
    }
    const mnt = items.find((p) => p.name === "Mentenanță Website");
    expect(mnt.items.map((s: any) => s.code)).toEqual(["K04", "K05", "K06", "K07", "K08"]);
    expect(mnt.serviceIds).toHaveLength(5);
    expect(CATEGORIES).toHaveLength(12);
  });

  it("este idempotent și nu suprascrie modificările", async () => {
    const [b01] = await ctx.db.select().from(catalogServices).where(eq(catalogServices.code, "B01"));
    await ctx.db
      .update(catalogServices)
      .set({ name: "Modificat de utilizator", recommendedPrice: 12345, currency: "EUR" })
      .where(eq(catalogServices.id, b01!.id));
    await ctx.db.update(catalogCategories).set({ name: "Altă denumire" }).where(eq(catalogCategories.code, "A"));

    await seedCatalog(ctx.db);
    await seedCatalog(ctx.db);

    expect(await ctx.db.select().from(catalogServices)).toHaveLength(144);
    expect(await ctx.db.select().from(catalogPackages)).toHaveLength(12);
    const items = await ctx.db.select().from(catalogPackageItems);
    expect(items.length).toBe(PACKAGES.reduce((sum, p) => sum + p.codes.length, 0));
    const [after] = await ctx.db.select().from(catalogServices).where(eq(catalogServices.code, "B01"));
    expect(after).toMatchObject({ name: "Modificat de utilizator", recommendedPrice: 12345 });
    expect((await ctx.db.select().from(catalogCategories).where(eq(catalogCategories.code, "A")))[0]?.name).toBe("Altă denumire");
  });

  it("scurtează descrierile la o limită naturală", () => {
    const long = "Analiza unui website existent pentru identificarea problemelor de design, navigare, performanță, accesibilitate și conversie, însoțită de recomandări prioritizate.";
    const short = shortOf(long);
    expect(short.length).toBeLessThanOrEqual(90);
    expect(long.startsWith(short)).toBe(true);
    expect(shortOf("Scurt.")).toBe("Scurt");
  });
});

describe("catalog: API", () => {
  beforeAll(async () => {
    ctx = await setup();
    cookie = await ctx.loginAs(await ctx.makeUser("super_admin"));
  });
  afterAll(() => ctx.close());

  it("refuză accesul fără sesiune", async () => {
    expect((await ctx.api("/api/catalog/services")).status).toBe(401);
    expect((await ctx.api("/api/catalog/categories")).status).toBe(401);
    expect((await ctx.api("/api/catalog/packages")).status).toBe(401);
    expect((await ctx.api("/api/catalog/services", { method: "POST", body: {} })).status).toBe(401);
  });

  it("cere permisiunile de scriere", async () => {
    const finance = await ctx.loginAs(await ctx.makeUser("finance"));
    expect((await ctx.api("/api/catalog/services", { cookie: finance })).status).toBe(200);
    expect((await ctx.api("/api/catalog/categories/B", { method: "PUT", cookie: finance, body: { name: "x" } })).status).toBe(403);
    const first = (await ctx.api("/api/catalog/services?q=B01", { cookie })).json.items[0];
    expect((await ctx.api(`/api/catalog/services/${first.id}`, { method: "DELETE", cookie: finance })).status).toBe(403);
    expect((await ctx.api(`/api/catalog/services/${first.id}`, { method: "PUT", cookie: finance, body: { name: "x" } })).status).toBe(403);
  });

  it("listează și modifică categoriile", async () => {
    const list = await ctx.api("/api/catalog/categories", { cookie });
    expect(list.json.items.map((c: any) => c.code)).toEqual("ABCDEFGHIJKL".split(""));
    const put = await ctx.api("/api/catalog/categories/A", { method: "PUT", cookie, body: { note: "Notă nouă" } });
    expect(put.json.item).toMatchObject({ code: "A", note: "Notă nouă" });
    expect((await ctx.api("/api/catalog/categories/Z", { method: "PUT", cookie, body: { note: "x" } })).status).toBe(404);
    expect((await ctx.api("/api/catalog/categories/A", { method: "PUT", cookie, body: { note: "x".repeat(2001) } })).status).toBe(422);
  });

  it("caută fără diacritice și filtrează după categorie", async () => {
    const all = await ctx.api("/api/catalog/services", { cookie });
    expect(all.json.total).toBeGreaterThanOrEqual(144);
    expect(all.json.items.length).toBe(all.json.total);

    const a = await ctx.api("/api/catalog/services?q=mentenanța", { cookie });
    const b = await ctx.api("/api/catalog/services?q=MENTENANTA", { cookie });
    expect(a.json.total).toBeGreaterThan(0);
    expect(b.json.total).toBe(a.json.total);

    const code = await ctx.api("/api/catalog/services?q=l13", { cookie });
    expect(code.json.items.map((s: any) => s.code)).toContain("L13");

    const cat = await ctx.api("/api/catalog/services?category=L", { cookie });
    expect(cat.json.total).toBe(13);
    expect(cat.json.items.every((s: any) => s.categoryCode === "L")).toBe(true);

    expect((await ctx.api("/api/catalog/services?category=ZZ", { cookie })).status).toBe(422);
  });

  it("creează servicii personalizate cu cod automat, le modifică, arhivează și șterge", async () => {
    const a = await ctx.api("/api/catalog/services", { method: "POST", cookie, body: { categoryCode: "B", name: "Pagină specială" } });
    expect(a.status).toBe(201);
    expect(a.json.item).toMatchObject({ code: "B16", categoryCode: "B", unit: "serviciu", billing: "one_time", defaultStatus: "accepted", recommendedPrice: null });
    const b = await ctx.api("/api/catalog/services", {
      method: "POST",
      cookie,
      body: { categoryCode: "B", name: "Altă pagină", recommendedPrice: 25000, currency: "EUR", defaultQuantity: 2.5 },
    });
    expect(b.json.item).toMatchObject({ code: "B17", recommendedPrice: 25000, currency: "EUR", defaultQuantity: 2.5 });
    const manual = await ctx.api("/api/catalog/services", { method: "POST", cookie, body: { categoryCode: "B", name: "Manual", code: "b99" } });
    expect(manual.json.item.code).toBe("B99");
    expect((await ctx.api("/api/catalog/services", { method: "POST", cookie, body: { categoryCode: "B", name: "Duplicat", code: "B99" } })).status).toBe(409);

    const bad = (body: Record<string, unknown>) => ctx.api("/api/catalog/services", { method: "POST", cookie, body: { categoryCode: "B", name: "Test", ...body } });
    expect((await bad({ recommendedPrice: 10.5 })).status).toBe(422);
    expect((await bad({ recommendedPrice: -5 })).status).toBe(422);
    expect((await bad({ defaultQuantity: -1 })).status).toBe(422);
    expect((await bad({ name: "" })).status).toBe(422);
    expect((await bad({ name: "x".repeat(201) })).status).toBe(422);
    expect((await bad({ categoryCode: "Q" })).status).toBe(422);
    expect((await bad({ billing: "weekly" })).status).toBe(422);

    const id = a.json.item.id;
    const put = await ctx.api(`/api/catalog/services/${id}`, { method: "PUT", cookie, body: { name: "Pagină specială 2", recommendedPrice: 9900, currency: "RON" } });
    expect(put.json.item).toMatchObject({ name: "Pagină specială 2", recommendedPrice: 9900, currency: "RON", code: "B16" });

    const arch = await ctx.api(`/api/catalog/services/${id}/archive`, { method: "POST", cookie });
    expect(arch.json.item.archivedAt).toBeTruthy();
    expect((await ctx.api("/api/catalog/services?q=B16", { cookie })).json.total).toBe(0);
    const archived = await ctx.api("/api/catalog/services?archived=true", { cookie });
    expect(archived.json.items.map((s: any) => s.code)).toContain("B16");
    expect((await ctx.api("/api/catalog/services?archived=all&q=B16", { cookie })).json.total).toBe(1);
    const un = await ctx.api(`/api/catalog/services/${id}/unarchive`, { method: "POST", cookie });
    expect(un.json.item.archivedAt).toBeNull();

    expect((await ctx.api(`/api/catalog/services/${id}`, { method: "DELETE", cookie })).status).toBe(204);
    expect((await ctx.api(`/api/catalog/services/${id}`, { cookie })).status).toBe(404);
  });

  it("blochează ștergerea unui serviciu din pachet", async () => {
    const k04 = (await ctx.api("/api/catalog/services?q=K04", { cookie })).json.items.find((s: any) => s.code === "K04");
    const del = await ctx.api(`/api/catalog/services/${k04.id}`, { method: "DELETE", cookie });
    expect(del.status).toBe(409);
    expect(del.json.error.message).toMatch(/Mentenanță Website/);
    expect(del.json.error.message).toMatch(/Arhivează/);
    expect((await ctx.api(`/api/catalog/services/${k04.id}`, { cookie })).status).toBe(200);
  });

  it("face CRUD pe pachete", async () => {
    const svc = (await ctx.api("/api/catalog/services?category=I", { cookie })).json.items.slice(0, 3);
    const ids = svc.map((s: any) => s.id);
    const created = await ctx.api("/api/catalog/packages", {
      method: "POST",
      cookie,
      body: { name: "Pachet nou", description: "Test", billing: "monthly", serviceIds: ids },
    });
    expect(created.status).toBe(201);
    const pkg = created.json.item;
    expect(pkg.serviceIds).toEqual(ids);
    expect(pkg.items.map((s: any) => s.code)).toEqual(svc.map((s: any) => s.code));
    expect(pkg.recommendedPrice).toBeNull();

    expect((await ctx.api("/api/catalog/packages", { method: "POST", cookie, body: { name: "Pachet nou" } })).status).toBe(409);
    expect((await ctx.api("/api/catalog/packages", { method: "POST", cookie, body: { name: "Alt pachet", serviceIds: ["00000000-0000-4000-8000-000000000000"] } })).status).toBe(409);
    expect((await ctx.api("/api/catalog/packages", { method: "POST", cookie, body: { name: "Alt pachet", recommendedPrice: 1.5 } })).status).toBe(422);

    const reversed = [...ids].reverse();
    const put = await ctx.api(`/api/catalog/packages/${pkg.id}`, { method: "PUT", cookie, body: { name: "Pachet nou 2", billing: "one_time", serviceIds: reversed.slice(0, 2) } });
    expect(put.json.item).toMatchObject({ name: "Pachet nou 2", billing: "one_time" });
    expect(put.json.item.serviceIds).toEqual(reversed.slice(0, 2));

    const arch = await ctx.api(`/api/catalog/packages/${pkg.id}/archive`, { method: "POST", cookie });
    expect(arch.json.item.archivedAt).toBeTruthy();
    expect((await ctx.api("/api/catalog/packages", { cookie })).json.items.some((p: any) => p.id === pkg.id)).toBe(false);
    expect((await ctx.api("/api/catalog/packages?archived=true", { cookie })).json.items.map((p: any) => p.id)).toEqual([pkg.id]);
    await ctx.api(`/api/catalog/packages/${pkg.id}/unarchive`, { method: "POST", cookie });

    // serviciile pachetului nu se pot șterge, dar după ștergerea pachetului da
    const first = reversed[0]!;
    expect((await ctx.api(`/api/catalog/services/${first}`, { method: "DELETE", cookie })).status).toBe(409);
    expect((await ctx.api(`/api/catalog/packages/${pkg.id}`, { method: "DELETE", cookie })).status).toBe(204);
    expect((await ctx.api(`/api/catalog/packages/${pkg.id}`, { cookie })).status).toBe(404);
    expect((await ctx.api("/api/catalog/packages", { cookie })).json.items).toHaveLength(12);
  });
});

describe("catalog: export / import", () => {
  let c: Setup;
  let ck: string;
  beforeAll(async () => {
    c = await setup();
    ck = await c.loginAs(await c.makeUser("super_admin"));
  });
  afterAll(() => c.close());

  const importCall = (data: unknown, dryRun?: boolean) =>
    c.api("/api/catalog/import", { method: "POST", cookie: ck, body: { data, dryRun } });
  const exportFile = async () => (await c.api("/api/catalog/export", { cookie: ck })).json;
  const service = async (code: string) => (await c.db.select().from(catalogServices).where(eq(catalogServices.code, code)))[0]!;

  it("401 fără sesiune", async () => {
    expect((await c.api("/api/catalog/export")).status).toBe(401);
    expect((await c.api("/api/catalog/import", { method: "POST", body: { data: {} } })).status).toBe(401);
  });

  it("export → modificare → import readuce valorile din fișier", async () => {
    const res = await c.api("/api/catalog/export", { cookie: ck });
    expect(res.status).toBe(200);
    const file = res.json;
    expect(file).toMatchObject({ format: "esa-catalog", version: 1 });
    expect(file.services).toHaveLength(144);
    expect(file.packages).toHaveLength(12);
    expect(file.services[0]).not.toHaveProperty("id");

    // fișierul exportat după setarea prețului
    const before = await service("B02");
    await c.db.update(catalogServices).set({ recommendedPrice: 123400, currency: "EUR" }).where(eq(catalogServices.code, "B02"));
    const priced = await exportFile();
    expect(priced.services.find((s: any) => s.code === "B02")).toMatchObject({ recommendedPrice: 123400, currency: "EUR" });

    // prețul se strică în DB, apoi se readuce din fișier
    await c.db.update(catalogServices).set({ recommendedPrice: 5, currency: "RON" }).where(eq(catalogServices.code, "B02"));
    const imported = await importCall(priced);
    expect(imported.status).toBe(200);
    expect(imported.json.services).toEqual({ created: 0, updated: 1, unchanged: 143 });
    expect(imported.json.packages).toEqual({ created: 0, updated: 0, unchanged: 12 });
    expect(await service("B02")).toMatchObject({ id: before.id, recommendedPrice: 123400, currency: "EUR" });

    // al doilea import al aceluiași fișier nu schimbă nimic
    expect((await importCall(priced)).json.services).toEqual({ created: 0, updated: 0, unchanged: 144 });
    await c.db.update(catalogServices).set({ recommendedPrice: null, currency: null }).where(eq(catalogServices.code, "B02"));
  });

  it("creează serviciu și pachet noi, cu componentele în ordine", async () => {
    const file = await exportFile();
    file.services.push({ ...file.services[0], code: "Z99", categoryCode: "A", name: "Serviciu nou", recommendedPrice: 5000, currency: "RON" });
    file.packages.push({ ...file.packages[0], name: "Pachet importat", serviceCodes: ["Z99", "A01"] });
    const res = await importCall(file);
    expect(res.status).toBe(200);
    expect(res.json.services).toMatchObject({ created: 1, updated: 0 });
    expect(res.json.packages).toMatchObject({ created: 1, updated: 0 });
    const pkgs = (await c.api("/api/catalog/packages", { cookie: ck })).json.items;
    const pkg = pkgs.find((p: any) => p.name === "Pachet importat");
    expect(pkg.items.map((s: any) => s.code)).toEqual(["Z99", "A01"]);
    expect((await service("Z99")).recommendedPrice).toBe(5000);

    // pachet existent: componentele se înlocuiesc
    file.packages.find((p: any) => p.name === "Pachet importat").serviceCodes = ["A01"];
    const again = await importCall(file);
    expect(again.json.packages).toMatchObject({ created: 0, updated: 1 });
    const pkg2 = (await c.api("/api/catalog/packages", { cookie: ck })).json.items.find((p: any) => p.name === "Pachet importat");
    expect(pkg2.items.map((s: any) => s.code)).toEqual(["A01"]);
  });

  it("dryRun nu scrie nimic", async () => {
    const file = await exportFile();
    file.services.push({ ...file.services[0], code: "Z98", name: "Doar test" });
    file.services.find((s: any) => s.code === "A01").recommendedPrice = 777;
    file.packages.push({ ...file.packages[0], name: "Pachet fantomă", serviceCodes: ["Z98"] });
    const res = await importCall(file, true);
    expect(res.json).toMatchObject({ dryRun: true, services: { created: 1, updated: 1 }, packages: { created: 1 } });
    expect(await c.db.select().from(catalogServices).where(eq(catalogServices.code, "Z98"))).toHaveLength(0);
    expect((await service("A01")).recommendedPrice).toBe(PRICES.A01 * 100);
    expect(await c.db.select().from(catalogPackages).where(eq(catalogPackages.name, "Pachet fantomă"))).toHaveLength(0);
  });

  it("cod necunoscut în pachet → 422 fără modificări", async () => {
    const file = await exportFile();
    file.services.find((s: any) => s.code === "A01").recommendedPrice = 4242;
    file.packages[0].serviceCodes = [...file.packages[0].serviceCodes, "Q77", "Q78"];
    const res = await importCall(file);
    expect(res.status).toBe(422);
    expect(res.json.error.message).toContain("Q77");
    expect(res.json.error.message).toContain("Q78");
    expect((await service("A01")).recommendedPrice).toBe(PRICES.A01 * 100);
  });

  it("format greșit, versiune greșită sau câmpuri invalide → 422", async () => {
    const file = await exportFile();
    expect((await importCall({ ...file, format: "altceva" })).status).toBe(422);
    expect((await importCall({ ...file, version: 2 })).status).toBe(422);
    expect((await importCall({ ...file, extra: 1 })).status).toBe(422);
    expect((await importCall("nu e obiect")).status).toBe(422);
    const bad = await exportFile();
    bad.services[0].recommendedPrice = 1.5;
    expect((await importCall(bad)).status).toBe(422);
  });

  it("starea de arhivare se aplică", async () => {
    const file = await exportFile();
    file.services.find((s: any) => s.code === "A02").archived = true;
    await importCall(file);
    expect((await service("A02")).archivedAt).not.toBeNull();
    file.services.find((s: any) => s.code === "A02").archived = false;
    await importCall(file);
    expect((await service("A02")).archivedAt).toBeNull();
  });

  it("CATALOG_IMPORT_FILE: nu suprascrie, dar creează ce lipsește", async () => {
    const dir = await mkdtemp(join(tmpdir(), "esa-catalog-"));
    try {
      const file = await exportFile();
      file.services.find((s: any) => s.code === "A03").recommendedPrice = 9999;
      file.services.push({ ...file.services[0], code: "Z97", name: "Serviciu din fișier" });
      const path = join(dir, "catalog.json");
      await writeFile(path, JSON.stringify(file));

      await c.db.update(catalogServices).set({ name: "Modificat de utilizator" }).where(eq(catalogServices.code, "A03"));
      const result = await importCatalogFile(c.db, path);
      expect(result?.services).toMatchObject({ created: 1, updated: 0 });
      expect(await service("A03")).toMatchObject({ name: "Modificat de utilizator", recommendedPrice: PRICES.A03 * 100 });
      expect((await service("Z97")).name).toBe("Serviciu din fișier");

      // fișier lipsă sau stricat: nu aruncă
      expect(await importCatalogFile(c.db, join(dir, "lipsa.json"))).toBeNull();
      await writeFile(path, "{ nu e json");
      expect(await importCatalogFile(c.db, path)).toBeNull();
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});

describe("catalog: prețuri din seed", () => {
  let c: Setup;
  beforeAll(async () => { c = await setup(); });
  afterAll(() => c.close());
  const service = async (code: string) => (await c.db.select().from(catalogServices).where(eq(catalogServices.code, code)))[0]!;

  it("serviciile și pachetele au prețuri în RON", async () => {
    expect(await service("B02")).toMatchObject({ recommendedPrice: 249000, currency: "RON" });
    const [pkg] = await c.db.select().from(catalogPackages).where(eq(catalogPackages.name, "Website Start"));
    expect(pkg).toMatchObject({ recommendedPrice: 249000, currency: "RON" });
    const items = await c.db.select({ code: catalogServices.code }).from(catalogPackageItems)
      .innerJoin(catalogServices, eq(catalogServices.id, catalogPackageItems.serviceId))
      .where(eq(catalogPackageItems.packageId, pkg!.id)).orderBy(asc(catalogPackageItems.sort));
    expect(items.map((i) => i.code)).toEqual(["B04", "B06", "B07", "B08", "B09", "E01", "E05", "F02", "F13", "K01", "K03"]);
  });

  it("completează doar prețurile lipsă", async () => {
    await c.db.update(catalogServices).set({ recommendedPrice: 100 }).where(eq(catalogServices.code, "B02"));
    await c.db.update(catalogServices).set({ recommendedPrice: null }).where(eq(catalogServices.code, "B03"));
    await seedCatalog(c.db);
    expect((await service("B02")).recommendedPrice).toBe(100);
    expect((await service("B03")).recommendedPrice).toBe(PRICES.B03 * 100);
  });
});
