import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  computeTotals,
  contractedLines,
  diffLines,
  formatMoney,
  lineAmounts,
  type OfferConfig,
  type OfferLine,
} from "../shared/offers";
import { setup, type Setup } from "./helpers";

const year = new Date().getFullYear();
let seq = 0;

function line(over: Partial<OfferLine> = {}): OfferLine {
  seq += 1;
  return {
    id: `l${seq}`,
    serviceId: null,
    code: null,
    category: null,
    name: `Serviciu ${seq}`,
    description: "",
    deliverables: "",
    acceptance: "",
    unit: "serviciu",
    quantity: 1,
    unitPrice: 0,
    discountType: "none",
    discountValue: 0,
    billing: "one_time",
    periods: 1,
    status: "accepted",
    isPackage: false,
    packageLineId: null,
    duration: "",
    conditions: "",
    advanced: false,
    ...over,
  };
}

function config(lines: OfferLine[], over: Partial<OfferConfig> = {}): OfferConfig {
  return {
    currency: "EUR",
    vatRate: 0,
    lines,
    stages: [],
    installments: [],
    intro: "",
    notes: "",
    validityDays: 30,
    timeline: "",
    paymentTerms: "",
    projectName: "",
    website: "",
    ...over,
  };
}

/** Scenariul obligatoriu: 400 unic + 50 × 3 mentenanță = 550 EUR. */
function scenario(): OfferLine[] {
  return [
    line({ id: "web", name: "Website", unitPrice: 40000, description: "Website de prezentare cu 5 pagini, formular și hartă." }),
    line({ id: "mnt", name: "Mentenanță", unitPrice: 5000, billing: "monthly", periods: 3, unit: "lună", deliverables: "Verificări lunare" }),
    line({ id: "vid", name: "Videoclip", unitPrice: 15000, status: "optional" }),
    line({ id: "ads", name: "Buget reclame", unitPrice: 20000, status: "client_direct" }),
  ];
}

describe("offers: computeTotals", () => {
  it("scenariul obligatoriu: 550 EUR", () => {
    const t = computeTotals(config(scenario()));
    expect(t.net).toBe(55000);
    expect(t.oneTime).toBe(40000);
    expect(t.recurring).toBe(15000);
    expect(t.monthly).toBe(5000);
    expect(t.optional).toBe(15000);
    expect(t.clientDirect).toBe(20000);
    expect(t.vat).toBe(0);
    expect(t.gross).toBe(55000);
  });

  it("pachetul nu dublează costul componentelor incluse", () => {
    const lines = [
      line({ id: "pk", name: "Pachet", unitPrice: 40000, isPackage: true }),
      line({ id: "c1", unitPrice: 9000, status: "included", packageLineId: "pk" }),
      line({ id: "c2", unitPrice: 7000, status: "included", packageLineId: "pk" }),
    ];
    const t = computeTotals(config(lines));
    expect(t.net).toBe(40000);
    expect(contractedLines(lines).map((l) => l.id)).toEqual(["pk", "c1", "c2"]);
  });

  it("pachetul opțional nu intră în total, nici componentele lui", () => {
    const lines = [
      line({ id: "base", unitPrice: 10000 }),
      line({ id: "pk", unitPrice: 40000, isPackage: true, status: "optional" }),
      line({ id: "c1", unitPrice: 9000, status: "included", packageLineId: "pk" }),
    ];
    const t = computeTotals(config(lines));
    expect(t.net).toBe(10000);
    expect(t.optional).toBe(40000);
    expect(contractedLines(lines).map((l) => l.id)).toEqual(["base"]);
  });

  it("aplică reducerea procentuală și fixă", () => {
    const pct = computeTotals(config([line({ unitPrice: 10000, discountType: "percent", discountValue: 10 })]));
    expect(pct.net).toBe(9000);
    expect(pct.discount).toBe(1000);
    const fixed = computeTotals(config([line({ unitPrice: 10000, discountType: "fixed", discountValue: 1500 })]));
    expect(fixed.net).toBe(8500);
    // Reducerea nu depășește valoarea liniei.
    const over = computeTotals(config([line({ unitPrice: 1000, discountType: "fixed", discountValue: 5000 })]));
    expect(over.net).toBe(0);
    // Reducerea pe linie recurentă se aplică pe fiecare perioadă.
    const rec = computeTotals(config([line({ unitPrice: 5000, billing: "monthly", periods: 3, discountType: "percent", discountValue: 20 })]));
    expect(rec.net).toBe(12000);
    expect(rec.discount).toBe(3000);
  });

  it("calculează TVA 21%", () => {
    const t = computeTotals(config(scenario(), { vatRate: 21 }));
    expect(t.vat).toBe(11550);
    expect(t.gross).toBe(66550);
  });

  it("rotunjește la unități minore", () => {
    expect(computeTotals(config([line({ quantity: 1.5, unitPrice: 333 })])).net).toBe(500);
    expect(computeTotals(config([line({ unitPrice: 10001, discountType: "percent", discountValue: 33.33 })])).net).toBe(6668);
    expect(computeTotals(config([line({ unitPrice: 150 })], { vatRate: 21 })).vat).toBe(32);
    expect(computeTotals(config([line({ unitPrice: 101 })], { vatRate: 21 })).vat).toBe(21);
  });

  it("lineAmounts rotunjește corect jumătățile", () => {
    const gross = (quantity: number, unitPrice: number) => {
      const l = line({ quantity, unitPrice });
      return lineAmounts(l, [l]).gross;
    };
    expect(gross(1.005, 100)).toBe(101);
    expect(gross(1.255, 100)).toBe(126);
    expect(gross(2.5, 1)).toBe(3);
    const d = line({ unitPrice: 105, discountType: "percent", discountValue: 10 });
    expect(lineAmounts(d, [d]).discount).toBe(11);
    expect(computeTotals(config(scenario())).net).toBe(55000);
  });

  it("formatează sumele", () => {
    expect(formatMoney(55000, "EUR")).toBe("550 €");
    expect(formatMoney(123456, "RON")).toContain("lei");
  });
});

describe("offers: diffLines", () => {
  it("găsește liniile adăugate, șterse și modificate", () => {
    const before = [line({ id: "a", unitPrice: 1000 }), line({ id: "b", unitPrice: 2000 }), line({ id: "o", status: "optional" })];
    const after = [
      { ...before[0]!, unitPrice: 1500 },
      line({ id: "c", unitPrice: 3000 }),
      { ...before[2]!, status: "optional" as const },
    ];
    const diff = diffLines(before, after);
    expect(diff.find((d) => d.kind === "changed")?.fields).toEqual(["unitPrice"]);
    expect(diff.find((d) => d.kind === "removed")?.before?.id).toBe("b");
    expect(diff.find((d) => d.kind === "added")?.after?.id).toBe("c");
    expect(diff).toHaveLength(3);
  });

  it("ignoră liniile necontractate", () => {
    const optional = line({ id: "x", status: "optional" });
    expect(diffLines([optional], [])).toEqual([]);
  });
});

describe("offers: API", () => {
  let ctx: Setup;
  let cookie: string;
  let clientId: string;
  let offerId: string;
  let contractId: string;
  let contractNumber: string;

  const createBody = (lines = scenario(), extra: Record<string, unknown> = {}) => ({
    clientId,
    date: "2026-03-05",
    title: "Site Georgi",
    data: config(lines, {
      projectName: "Redesign gradinitageorgi.ro",
      stages: [{ id: "s1", name: "Design", deliverables: "Machete", term: "15 zile", firm: false }],
      installments: [
        { id: "i1", label: "Avans", percent: 50, due: "la semnare" },
        { id: "i2", label: "Rest", percent: 50, due: "la predare" },
      ],
    }),
    ...extra,
  });

  beforeAll(async () => {
    ctx = await setup();
    cookie = await ctx.loginAs(await ctx.makeUser("super_admin"));
    clientId = (
      await ctx.api("/api/clients", {
        method: "POST",
        cookie,
        body: {
          companyName: "Georgi",
          legalName: "Grădinița Georgi S.R.L.",
          cui: "RO123",
          address: "Str. Florilor 1",
          city: "București",
          postalCode: "010101",
          primaryEmail: "contact@georgi.ro",
          contactPerson: "Ion Georgi",
          position: "administrator",
        },
      })
    ).json.item.id;
  });
  afterAll(() => ctx.close());

  it("refuză accesul fără sesiune", async () => {
    expect((await ctx.api("/api/legal/offers")).status).toBe(401);
    expect((await ctx.api("/api/legal/offers/next-number")).status).toBe(401);
    expect((await ctx.api("/api/legal/offers", { method: "POST", body: createBody() })).status).toBe(401);
    expect((await ctx.api("/api/legal/pdf", { method: "POST", body: { html: "<p>x</p>", filename: "a" } })).status).toBe(401);
  });

  it("creează oferta, ignoră totalurile trimise de client și numerotează", async () => {
    expect((await ctx.api("/api/legal/offers/next-number", { cookie })).json.number).toBe(`OF-${year}-001`);
    const body = createBody();
    const res = await ctx.api("/api/legal/offers", {
      method: "POST",
      cookie,
      body: { ...body, totals: { net: 1 }, netTotal: 1, version: 9, status: "accepted" },
    });
    expect(res.status).toBe(201);
    const item = res.json.item;
    offerId = item.id;
    expect(item.number).toBe(`OF-${year}-001`);
    expect(item.status).toBe("draft");
    expect(item.version).toBe(1);
    expect(item.totals.net).toBe(55000);
    expect(item.netTotal).toBe(55000);
    expect(item.client.name).toBe("Georgi");
    expect(item.parent).toBeNull();
    expect(item.contract).toBeNull();
    expect((await ctx.api("/api/legal/offers/next-number", { cookie })).json.number).toBe(`OF-${year}-002`);
  });

  it("validează strict datele", async () => {
    const bad = (mutate: (b: any) => void) => {
      const body = createBody();
      mutate(body);
      return ctx.api("/api/legal/offers", { method: "POST", cookie, body });
    };
    expect((await bad((b) => (b.data.lines[0].unitPrice = 10.5))).status).toBe(422);
    expect((await bad((b) => (b.data.lines[0].unitPrice = -1))).status).toBe(422);
    expect((await bad((b) => (b.data.lines[0].quantity = -2))).status).toBe(422);
    expect(
      (
        await bad((b) => {
          b.data.lines[0].discountType = "percent";
          b.data.lines[0].discountValue = 150;
        })
      ).status,
    ).toBe(422);
    expect((await bad((b) => (b.data.vatRate = 120))).status).toBe(422);
    expect((await bad((b) => (b.data.lines[0].name = "x".repeat(201)))).status).toBe(422);
    expect((await bad((b) => (b.data.lines[1].id = b.data.lines[0].id))).status).toBe(422);
    expect((await bad((b) => (b.date = "2026-13-40"))).status).toBe(422);
    expect((await bad((b) => (b.clientId = "00000000-0000-4000-8000-000000000000"))).status).toBe(409);
  });

  it("păstrează versiuni la fiecare salvare", async () => {
    const lines = scenario();
    lines[0]!.unitPrice = 50000;
    const res = await ctx.api(`/api/legal/offers/${offerId}`, { method: "PUT", cookie, body: { data: createBody(lines).data } });
    expect(res.status).toBe(200);
    expect(res.json.item.version).toBe(2);
    expect(res.json.item.totals.net).toBe(65000);

    const versions = await ctx.api(`/api/legal/offers/${offerId}/versions`, { cookie });
    expect(versions.json.items.map((v: any) => v.version)).toEqual([2, 1]);
    const v1 = await ctx.api(`/api/legal/offers/${offerId}/versions/1`, { cookie });
    expect(v1.json.item.totals.net).toBe(55000);
    expect(v1.json.item.data.lines[0].unitPrice).toBe(40000);
    expect((await ctx.api(`/api/legal/offers/${offerId}/versions/7`, { cookie })).status).toBe(404);

    // revenim la 550 EUR pentru restul fluxului
    const back = await ctx.api(`/api/legal/offers/${offerId}`, { method: "PUT", cookie, body: { data: createBody().data } });
    expect(back.json.item.version).toBe(3);
    expect(back.json.item.totals.net).toBe(55000);
  });

  it("listează și filtrează ofertele", async () => {
    const list = await ctx.api(`/api/legal/offers?clientId=${clientId}&status=draft&kind=offer&q=georgi`, { cookie });
    expect(list.status).toBe(200);
    expect(list.json.total).toBe(1);
    expect(list.json.items[0]).toMatchObject({
      id: offerId,
      number: `OF-${year}-001`,
      kind: "offer",
      status: "draft",
      netTotal: 55000,
      currency: "EUR",
      date: "2026-03-05",
      version: 3,
      clientName: "Georgi",
    });
    expect((await ctx.api(`/api/legal/offers?status=accepted`, { cookie })).json.total).toBe(0);
  });

  it("refuză acceptarea cu tranșe care nu fac 100% sau fără linii contractate", async () => {
    const draft = await ctx.api("/api/legal/offers", {
      method: "POST",
      cookie,
      body: createBody([line({ status: "optional", unitPrice: 100 })], { number: "OF-TEST-1" }),
    });
    expect(draft.status).toBe(201);
    expect((await ctx.api(`/api/legal/offers/${draft.json.item.id}/accept`, { method: "POST", cookie })).status).toBe(409);
    expect((await ctx.api(`/api/legal/offers/${draft.json.item.id}`, { method: "DELETE", cookie })).status).toBe(204);
    expect((await ctx.api(`/api/legal/offers/${draft.json.item.id}`, { cookie })).status).toBe(404);

    const badPct = createBody();
    badPct.data.installments[1]!.percent = 40;
    const o = await ctx.api("/api/legal/offers", { method: "POST", cookie, body: badPct });
    const res = await ctx.api(`/api/legal/offers/${o.json.item.id}/accept`, { method: "POST", cookie });
    expect(res.status).toBe(422);
    expect((await ctx.api(`/api/legal/offers/${o.json.item.id}`, { method: "DELETE", cookie })).status).toBe(204);
  });

  it("schimbă starea (fără accepted) și acceptă oferta cu snapshot", async () => {
    expect((await ctx.api(`/api/legal/offers/${offerId}/status`, { method: "POST", cookie, body: { status: "accepted" } })).status).toBe(422);
    const sent = await ctx.api(`/api/legal/offers/${offerId}/status`, { method: "POST", cookie, body: { status: "sent" } });
    expect(sent.json.item.status).toBe("sent");
    expect(sent.json.item.sentAt).toBeTruthy();

    const res = await ctx.api(`/api/legal/offers/${offerId}/accept`, { method: "POST", cookie });
    expect(res.status).toBe(200);
    const item = res.json.item;
    expect(item.status).toBe("accepted");
    expect(item.acceptedAt).toBeTruthy();
    const snap = item.acceptedSnapshot;
    expect(snap.offer).toMatchObject({ id: offerId, number: `OF-${year}-001`, version: 3, kind: "offer" });
    expect(snap.totals.net).toBe(55000);
    expect(snap.client.clNume).toBe("Grădinița Georgi S.R.L.");
    expect(snap.client.clSediu).toBe("Str. Florilor 1, București, 010101");
    expect(snap.client.clEmail).toBe("contact@georgi.ro");
    expect(snap.provider.esaMarca).toBe("ESA Coder Solutions");
    expect(snap.provider.esaTel).toBe("0748 452 215");
    expect(snap.acceptedAt).toBeTruthy();

    // nu se mai acceptă și nu se mai schimbă starea
    expect((await ctx.api(`/api/legal/offers/${offerId}/accept`, { method: "POST", cookie })).status).toBe(409);
    expect((await ctx.api(`/api/legal/offers/${offerId}/status`, { method: "POST", cookie, body: { status: "draft" } })).status).toBe(409);
  });

  it("blochează modificarea și ștergerea ofertei acceptate", async () => {
    const put = await ctx.api(`/api/legal/offers/${offerId}`, { method: "PUT", cookie, body: { title: "Altul" } });
    expect(put.status).toBe(409);
    expect(put.json.error.message).toBe("Oferta acceptată nu se mai modifică. Creează un act adițional.");
    expect((await ctx.api(`/api/legal/offers/${offerId}`, { method: "DELETE", cookie })).status).toBe(409);
  });

  it("nu permite act adițional înainte de contract", async () => {
    expect((await ctx.api(`/api/legal/offers/${offerId}/amendments`, { method: "POST", cookie })).status).toBe(409);
  });

  it("creează contractul cu datele precompletate", async () => {
    const res = await ctx.api(`/api/legal/offers/${offerId}/contract`, { method: "POST", cookie });
    expect(res.status).toBe(201);
    expect(res.json.created).toBe(true);
    const c = res.json.item;
    contractId = c.id;
    contractNumber = c.number;
    expect(c.number).toBe(`ESA-${year}-001`);
    expect(c.kind).toBe("generated");
    expect(c.offerId).toBe(offerId);
    expect(c.data).toMatchObject({
      nr: `ESA-${year}-001`,
      clNume: "Grădinița Georgi S.R.L.",
      esaMarca: "ESA Coder Solutions",
      esaNume: "ELEXA SOCIETY S.R.L.",
      cmdNr: "1",
      proiect: "Redesign gradinitageorgi.ro",
      tip: "",
      pret: "550",
      moneda: "euro",
      plati: "50% la semnare; 50% la predare",
      inc1: "1",
      inc2: "1",
      inc3: "1",
    });
    expect(c.data.data).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(c.data.spec).toContain("Website – Website de prezentare");
    expect(c.data.spec).not.toContain("Videoclip");
    expect(c.data.livrabile).toBe("Conform Anexei nr. 1.1 – Servicii și deviz (secțiunea „Livrabile și criterii de recepție”), parte integrantă din prezenta Comandă.");
    expect(c.data.etape).toBe("Design – 15 zile (estimativ)");
    expect(c.data.mentenanta).toContain("Mentenanță");
    expect(c.data.mentenanta).toContain("50 €/lună, 3 luni");
    expect(c.data.terti).toContain("Buget reclame: Beneficiar direct");

    const again = await ctx.api(`/api/legal/offers/${offerId}/contract`, { method: "POST", cookie });
    expect(again.status).toBe(200);
    expect(again.json.created).toBe(false);
    expect(again.json.item.id).toBe(contractId);

    const detail = await ctx.api(`/api/legal/offers/${offerId}`, { cookie });
    expect(detail.json.item.contract).toEqual({ id: contractId, number: contractNumber });
    // contractul apare și în API-ul contractelor generate
    const got = await ctx.api(`/api/legal/contracts/${contractId}`, { cookie });
    expect(got.json.item.data.pret).toBe("550");
  });

  it("generează documentele dosarului, cu numerotare și versiuni", async () => {
    const post = (type: string, body: Record<string, unknown> = {}) =>
      ctx.api(`/api/legal/offers/${offerId}/documents`, { method: "POST", cookie, body: { type, ...body } });

    const of = await post("offer");
    expect(of.status).toBe(201);
    expect(of.json.item).toMatchObject({ type: "offer", number: `OF-${year}-001`, version: 1, status: "draft" });

    const annex = await post("services_annex");
    expect(annex.json.item).toMatchObject({ type: "services_annex", number: contractNumber, version: 1, contractId });
    expect(annex.json.item.snapshot.totals.net).toBe(55000);
    expect((await post("schedule_annex")).status).toBe(201);
    expect((await post("summary")).status).toBe(201);
    expect((await post("maintenance_annex")).status).toBe(201);

    const pv = await post("handover_pv", { date: "2026-04-01", data: { results: ["ok"] } });
    expect(pv.json.item).toMatchObject({ type: "handover_pv", number: `PV-${year}-001`, date: "2026-04-01", version: 1 });
    expect(pv.json.item.data).toEqual({ results: ["ok"] });
    const pv2 = await post("handover_pv");
    expect(pv2.json.item).toMatchObject({ number: `PV-${year}-001`, version: 2 });

    expect((await post("amendment")).status).toBe(409);
    expect((await post("nu_exista")).status).toBe(422);

    const list = await ctx.api(`/api/legal/offers/${offerId}/documents`, { cookie });
    expect(list.json.items).toHaveLength(7);
    expect(list.json.items[0].snapshot).toBeUndefined();

    // actualizare și ștergere
    const id = pv2.json.item.id;
    const upd = await ctx.api(`/api/legal/documents/${id}`, { method: "PUT", cookie, body: { data: { x: 1 }, status: "final", snapshot: {} } });
    expect(upd.json.item.status).toBe("final");
    expect(upd.json.item.data).toEqual({ x: 1 });
    expect(upd.json.item.snapshot.totals.net).toBe(55000);
    expect((await ctx.api(`/api/legal/documents/${id}`, { method: "DELETE", cookie })).status).toBe(409);
    expect((await ctx.api(`/api/legal/documents/${pv.json.item.id}`, { method: "DELETE", cookie })).status).toBe(204);
  });

  it("refuză anexa de mentenanță fără servicii recurente", async () => {
    const o = await ctx.api("/api/legal/offers", { method: "POST", cookie, body: createBody([line({ unitPrice: 1000 })]) });
    const id = o.json.item.id;
    const post = (type: string) => ctx.api(`/api/legal/offers/${id}/documents`, { method: "POST", cookie, body: { type } });
    // oferta ciornă: doar documentul „offer”
    expect((await post("services_annex")).status).toBe(409);
    const doc = await post("offer");
    expect(doc.status).toBe(201);
    expect(doc.json.item.snapshot.acceptedAt).toBeNull();
    expect((await ctx.api(`/api/legal/offers/${id}/accept`, { method: "POST", cookie })).status).toBe(200);
    expect((await post("maintenance_annex")).status).toBe(409);
    expect((await post("services_annex")).status).toBe(201);
  });

  it("snapshot-ul rămâne neschimbat după modificarea catalogului și a clientului", async () => {
    const upd = await ctx.api(`/api/clients/${clientId}`, {
      method: "PATCH",
      cookie,
      body: { companyName: "Georgi Nou", legalName: "Altă Denumire S.R.L.", address: "Str. Nouă 9" },
    });
    expect(upd.status).toBe(200);
    const services = await ctx.api("/api/catalog/services?q=B01", { cookie });
    const put = await ctx.api(`/api/catalog/services/${services.json.items[0].id}`, { method: "PUT", cookie, body: { name: "Redesign modificat" } });
    expect(put.status).toBe(200);

    const cur = await ctx.api(`/api/legal/offers/${offerId}/current`, { cookie });
    expect(cur.json.item.id).toBe(offerId);
    expect(cur.json.item.acceptedSnapshot.client.clNume).toBe("Grădinița Georgi S.R.L.");
    expect(cur.json.item.acceptedSnapshot.client.clSediu).toBe("Str. Florilor 1, București, 010101");

    const doc = await ctx.api(`/api/legal/offers/${offerId}/documents`, { method: "POST", cookie, body: { type: "summary" } });
    expect(doc.json.item.version).toBe(2);
    expect(doc.json.item.snapshot.client.clNume).toBe("Grădinița Georgi S.R.L.");
  });

  it("creează, modifică și acceptă un act adițional", async () => {
    const res = await ctx.api(`/api/legal/offers/${offerId}/amendments`, { method: "POST", cookie });
    expect(res.status).toBe(201);
    const am = res.json.item;
    expect(am).toMatchObject({ kind: "amendment", status: "draft", number: `${contractNumber}-AA1`, clientId, contractId, version: 1 });
    expect(am.parent).toEqual({ id: offerId, number: `OF-${year}-001` });
    expect(am.data.lines).toHaveLength(4);
    expect(am.totals.net).toBe(55000);
    // documentul de act adițional cere oferta acceptată
    expect((await ctx.api(`/api/legal/offers/${am.id}/documents`, { method: "POST", cookie, body: { type: "amendment" } })).status).toBe(409);

    // adăugăm videoclipul (opțional → acceptat)
    const data = structuredClone(am.data);
    data.lines.find((l: any) => l.id === "vid").status = "accepted";
    const upd = await ctx.api(`/api/legal/offers/${am.id}`, { method: "PUT", cookie, body: { data } });
    expect(upd.json.item.version).toBe(2);
    expect(upd.json.item.totals.net).toBe(70000);

    // moneda actului adițional nu se schimbă
    expect((await ctx.api(`/api/legal/offers/${am.id}`, { method: "PUT", cookie, body: { data: { ...data, currency: "RON" } } })).status).toBe(409);

    expect((await ctx.api(`/api/legal/offers/${am.id}/accept`, { method: "POST", cookie })).status).toBe(200);

    const doc = await ctx.api(`/api/legal/offers/${am.id}/documents`, { method: "POST", cookie, body: { type: "amendment" } });
    expect(doc.status).toBe(201);
    expect(doc.json.item.number).toBe("1");
    expect(doc.json.item.snapshot.before.totals.net).toBe(55000);
    expect(doc.json.item.snapshot.after.totals.net).toBe(70000);
    expect(doc.json.item.contractId).toBe(contractId);

    // configurația în vigoare este acum cea a actului adițional
    const cur = await ctx.api(`/api/legal/offers/${offerId}/current`, { cookie });
    expect(cur.json.item.id).toBe(am.id);

    // al doilea act adițional pornește de la configurația în vigoare
    const second = await ctx.api(`/api/legal/offers/${offerId}/amendments`, { method: "POST", cookie });
    expect(second.json.item.number).toBe(`${contractNumber}-AA2`);
    expect(second.json.item.totals.net).toBe(70000);
    expect(second.json.item.parent.id).toBe(am.id);

    // cât timp există un act adițional în lucru, nu se creează altul
    const third = await ctx.api(`/api/legal/offers/${offerId}/amendments`, { method: "POST", cookie });
    expect(third.status).toBe(409);
    expect(third.json.error.message).toContain(`${contractNumber}-AA2`);
  });

  it("acceptarea unui act adițional vechi nu suprascrie unul acceptat între timp", async () => {
    const mk = async () => {
      const o = await ctx.api("/api/legal/offers", { method: "POST", cookie, body: createBody() });
      const id = o.json.item.id;
      expect((await ctx.api(`/api/legal/offers/${id}/accept`, { method: "POST", cookie })).status).toBe(200);
      expect((await ctx.api(`/api/legal/offers/${id}/contract`, { method: "POST", cookie })).status).toBe(201);
      return id as string;
    };
    const baseId = await mk();
    const aa1 = (await ctx.api(`/api/legal/offers/${baseId}/amendments`, { method: "POST", cookie })).json.item;
    const setStatus = (id: string, status: string) => ctx.api(`/api/legal/offers/${id}/status`, { method: "POST", cookie, body: { status } });
    expect((await setStatus(aa1.id, "rejected")).status).toBe(200);
    const aa2 = (await ctx.api(`/api/legal/offers/${baseId}/amendments`, { method: "POST", cookie })).json.item;
    expect(aa2.parent.id).toBe(baseId);
    // AA1 revine în lucru și e acceptat; AA2 a rămas pe baza veche
    expect((await setStatus(aa1.id, "draft")).status).toBe(200);
    expect((await ctx.api(`/api/legal/offers/${aa1.id}/accept`, { method: "POST", cookie })).status).toBe(200);
    const stale = await ctx.api(`/api/legal/offers/${aa2.id}/accept`, { method: "POST", cookie });
    expect(stale.status).toBe(409);
    expect(stale.json.error.message).toContain("nu mai e în vigoare");
    expect((await ctx.api(`/api/legal/offers/${baseId}/current`, { cookie })).json.item.id).toBe(aa1.id);
  });

  it("refuză reducerea fixă neîntreagă", async () => {
    const lines = [line({ unitPrice: 10000, discountType: "fixed", discountValue: 10.5 })];
    const res = await ctx.api("/api/legal/offers", { method: "POST", cookie, body: createBody(lines) });
    expect(res.status).toBe(422);
    expect(res.json.error.fields["data.lines.0.discountValue"]).toBeTruthy();
  });

  it("documentele finale nu se modifică; contractul nu se creează ca document", async () => {
    expect((await ctx.api(`/api/legal/offers/${offerId}/documents`, { method: "POST", cookie, body: { type: "contract" } })).status).toBe(422);
    const doc = (await ctx.api(`/api/legal/offers/${offerId}/documents`, { method: "POST", cookie, body: { type: "handover_pv" } })).json.item;
    const put = (body: Record<string, unknown>) => ctx.api(`/api/legal/documents/${doc.id}`, { method: "PUT", cookie, body });
    expect((await put({ status: "final" })).status).toBe(200);
    expect((await put({ data: { x: 2 } })).status).toBe(409);
    expect((await put({ date: "2026-05-01" })).status).toBe(409);
    expect((await put({ status: "draft" })).status).toBe(200);
    expect((await put({ data: { x: 3 } })).status).toBe(200);
  });

  it("arhivează PDF-ul în modulul Documente", async () => {
    const list = await ctx.api(`/api/legal/offers/${offerId}/documents`, { cookie });
    const doc = list.json.items.find((d: any) => d.type === "services_annex");
    const pdf = Buffer.from("%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF\n").toString("base64");

    const notPdf = await ctx.api(`/api/legal/documents/${doc.id}/archive`, {
      method: "POST",
      cookie,
      body: { pdfBase64: Buffer.from("nu e pdf").toString("base64"), filename: "x.pdf" },
    });
    expect(notPdf.status).toBe(415);
    const res = await ctx.api(`/api/legal/documents/${doc.id}/archive`, { method: "POST", cookie, body: { pdfBase64: pdf, filename: "Anexa servicii.pdf" } });
    expect(res.status).toBe(201);
    expect(res.json.item.documentId).toBe(res.json.document.id);
    expect(res.json.document.version).toBe(1);

    const stored = await ctx.api(`/api/documents/${res.json.document.id}`, { cookie });
    expect(stored.json.item).toMatchObject({ name: "Anexa servicii.pdf", type: "Contracts", clientId });

    // o a doua arhivare adaugă o versiune la același document
    const again = await ctx.api(`/api/legal/documents/${doc.id}/archive`, { method: "POST", cookie, body: { pdfBase64: pdf, filename: "Anexa servicii.pdf" } });
    expect(again.json.document).toMatchObject({ id: res.json.document.id, version: 2 });

    // document final și arhivat: nu mai revine în ciornă și nu se modifică
    const put = (body: Record<string, unknown>) => ctx.api(`/api/legal/documents/${doc.id}`, { method: "PUT", cookie, body });
    expect((await put({ status: "final" })).status).toBe(200);
    expect((await put({ status: "draft" })).status).toBe(409);
    expect((await put({ data: { y: 1 } })).status).toBe(409);
  });

  it("cere permisiunile potrivite", async () => {
    const finance = await ctx.loginAs(await ctx.makeUser("finance"));
    expect((await ctx.api("/api/legal/offers", { cookie: finance })).status).toBe(200);
    expect((await ctx.api(`/api/legal/offers/${offerId}`, { method: "PUT", cookie: finance, body: { title: "x" } })).status).toBe(403);
    expect((await ctx.api(`/api/legal/offers/${offerId}`, { method: "DELETE", cookie: finance })).status).toBe(403);
    expect((await ctx.api(`/api/legal/offers/${offerId}/accept`, { method: "POST", cookie: finance })).status).toBe(403);
  });
});
