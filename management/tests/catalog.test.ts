import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { catalogCategories, catalogPackageItems, catalogPackages, catalogServices } from "../server/db/schema/legal";
import { CATEGORIES, PACKAGES, SERVICES, seedCatalog, shortOf } from "../server/modules/catalog/seed";
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
      expect(r.recommendedPrice).toBeNull();
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
