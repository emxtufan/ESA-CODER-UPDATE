import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { strFromU8, unzipSync } from "fflate";
import { describe, expect, it } from "vitest";
import { computeTotals, type OfferConfig, type OfferLine, type OfferSnapshot, type ProviderValues } from "../shared/offers";
import { hdrHTML, type ImageSet } from "../client/src/modules/legal/contract/engine";
import { defaultValues } from "../client/src/modules/legal/contract/fields";
import template from "../client/src/modules/legal/contract/template.html?raw";
import {
  buildAmendment,
  buildDossierBody,
  buildHandoverPv,
  buildMaintenanceAnnex,
  buildOffer,
  buildScheduleAnnex,
  buildServicesAnnex,
  buildSummary,
  installmentPlan,
} from "../client/src/modules/legal/dossier/builders";
import { contractBodyHtml, htmlToDocx } from "../client/src/modules/legal/dossier/docx";
import { exportDraft, importDraft, lineFromService } from "../client/src/modules/legal/dossier/drafts";
import { fileName } from "../client/src/modules/legal/dossier/render";
import type { AmendmentInput, CatalogService, DossierInput } from "../client/src/modules/legal/dossier/types";
import { buildDossierZip } from "../client/src/modules/legal/dossier/zip";

const logoPng = new Uint8Array(readFileSync(fileURLToPath(new URL("../client/src/modules/legal/assets/logo.png", import.meta.url))));

const provider: ProviderValues = {
  esaMarca: "ESA Coder Solutions",
  esaNume: "ELEXA SOCIETY S.R.L.",
  esaCui: "52745149",
  esaRc: "J2025080665008",
  esaAdresa: "București, Sector 6, Bulevardul Iuliu Maniu nr. 1",
  esaIban: "",
  esaBanca: "",
  esaEmail: "support@esa-coder-solutions.com",
  esaTel: "0748 452 215",
  esaSite: "https://esa-coder-solutions.com",
  esaRep: "Ion Popescu",
  esaFunctie: "administrator",
};

let seq = 0;
function line(p: Partial<OfferLine> & { name: string }): OfferLine {
  seq++;
  return {
    id: `l${seq}`,
    serviceId: null,
    code: null,
    category: null,
    description: "",
    deliverables: "",
    acceptance: "",
    unit: "proiect",
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
    ...p,
  };
}

/** Grădinița Georgi: 400 € unic + mentenanță 50 €/lună × 3 = 550 €; video 150 € opțional; reclame 200 € direct. */
function georgiLines(): OfferLine[] {
  const pkg = line({ id: "pkg", name: "Redesign complet website", code: "B01", category: "B", isPackage: true, unitPrice: 40000, description: "Reconstruirea completă a site-ului." });
  const comp = (code: string, name: string, extra: Partial<OfferLine> = {}) =>
    line({ name, code, category: code[0], status: "included", packageLineId: "pkg", description: `Descriere ${name}`, deliverables: `Livrabil ${name}`, acceptance: `Criteriu ${name}`, ...extra });
  return [
    pkg,
    comp("B06", "Design responsive"),
    comp("C01", "Panou de administrare CMS"),
    comp("E06", "Integrare Facebook Page Feed"),
    comp("F01", "SEO tehnic website"),
    line({ name: "Mentenanță lunară website", code: "K04", category: "K", billing: "monthly", periods: 3, unitPrice: 5000, unit: "lună", deliverables: "Raport lunar", acceptance: "Raport transmis" }),
    line({ name: "Videoclip profesional de prezentare", code: "H01", category: "H", status: "optional", unitPrice: 15000, description: "Video de prezentare." }),
    line({ name: "Buget publicitar (achitat direct de client)", code: "G13", category: "G", status: "client_direct", unitPrice: 20000 }),
  ];
}

function config(lines: OfferLine[], extra: Partial<OfferConfig> = {}): OfferConfig {
  return {
    currency: "EUR",
    vatRate: 0,
    lines,
    stages: [{ id: "s1", name: "Livrare site", deliverables: "Site publicat", term: "2026-12-15", firm: false }],
    installments: [
      { id: "i1", label: "Avans", percent: 50, due: "la semnare" },
      { id: "i2", label: "Rest", percent: 50, due: "la predare" },
    ],
    intro: "",
    notes: "",
    validityDays: 30,
    timeline: "6 săptămâni",
    paymentTerms: "50% avans, 50% la predare",
    projectName: "Redesign website",
    website: "gradinitageorgi.ro",
    ...extra,
  };
}

function snapshot(cfg: OfferConfig, clNume = "Grădinița Georgi"): OfferSnapshot {
  return {
    offer: { id: "o1", number: "OF-2026-001", date: "2026-11-03", version: 1, kind: "offer", title: "Ofertă Grădinița Georgi" },
    config: cfg,
    totals: computeTotals(cfg),
    client: { clNume, clSediu: "Iași", clRc: "J22/1/2020", clCui: "12345678", clIban: "", clBanca: "", clEmail: "", clTel: "", clRep: "Maria Georgi", clFunctie: "director" },
    provider,
    acceptedAt: null,
  };
}

function input(cfg = config(georgiLines()), data: Record<string, unknown> = {}, clNume?: string): DossierInput {
  return {
    snapshot: snapshot(cfg, clNume),
    contract: { number: "ESA-2026-001", date: "2026-11-05", cmdNr: "CMD-1" },
    doc: { number: "7", date: "2026-11-10", data },
  };
}

/** Verificare minimă de well-formedness XML (etichete închise corect). */
function wellFormed(xml: string): boolean {
  const stack: string[] = [];
  const re = /<\?[\s\S]*?\?>|<!--[\s\S]*?-->|<(\/?)([A-Za-z][\w:.-]*)((?:\s+[\w:.-]+="[^"]*")*)\s*(\/?)>/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml))) {
    if (xml.slice(last, m.index).includes("<")) return false;
    last = re.lastIndex;
    if (!m[2]) continue;
    if (m[4]) continue;
    if (m[1]) {
      if (stack.pop() !== m[2]) return false;
    } else stack.push(m[2]);
  }
  return stack.length === 0 && !xml.slice(last).includes("<");
}

describe("dosar: contractul rămâne identic", () => {
  const img: ImageSet = { logo: "data:L", mail: "m", phone: "p", web: "w" };
  it("hdrHTML(img) este identic cu varianta veche", () => {
    const old = '<div class="hdr"><img src="' + img.logo + '" alt="ESA Coder Solutions"><span>Contract-cadru de prestări servicii web design și dezvoltare software</span></div>';
    expect(hdrHTML(img)).toBe(old);
    expect(hdrHTML(img, "Ofertă comercială")).toContain("<span>Ofertă comercială</span>");
  });
});

describe("dosar: oferta", () => {
  const html = buildOffer(input());
  it("conține valoarea, opționalul, costurile directe", () => {
    expect(html).toContain("550 €");
    expect(html).toContain("din care 400 € unic + 50 €/lună × 3 luni");
    const opt = html.slice(html.indexOf("Servicii opționale, cu tarif separat"));
    expect(opt).toContain("Videoclip profesional");
    expect(opt).toContain("150 €");
    expect(opt).toContain("nu sunt incluse");
    expect(html.slice(0, html.indexOf("Servicii opționale, cu tarif separat"))).not.toContain("Videoclip");
    const direct = html.slice(html.indexOf("Costuri achitate direct de beneficiar"));
    expect(direct).toContain("Buget publicitar");
    expect(direct).toContain("200 €");
    expect(html).toContain("inclus în pachet");
    expect(html).toContain("Ofertă comercială pentru Grădinița Georgi");
    expect(html).toContain("Nr. 7 din 10.11.2026");
  });
  it("notele de categorie apar numai când categoria e prezentă", () => {
    expect(html).toContain("nu garantează poziții"); // F
    expect(html).toContain("condiționată de disponibilitatea tehnică și de permisiunile Meta"); // E06
    expect(html).toContain("achitate de beneficiar direct platformelor"); // G
    expect(html).not.toContain("Shopify"); // L
    expect(html).toContain("implică minori"); // H (videoclipul)
    expect(html).not.toContain("portal privat"); // D avansat
    const noF = georgiLines().filter((l) => l.code !== "F01" && l.code !== "G13");
    const h2 = buildOffer(input(config(noF)));
    expect(h2).not.toContain("nu garantează poziții");
    const withL = [...georgiLines(), line({ name: "Abonament Shopify", code: "L13", category: "L", status: "client_direct", billing: "monthly", unitPrice: 3900 })];
    expect(buildOffer(input(config(withL)))).toContain("Shopify");
  });
  it("TVA: cota apare când există", () => {
    expect(html).toContain("Prețurile nu includ TVA");
    expect(buildOffer(input(config(georgiLines(), { vatRate: 19 })))).toContain("Total cu TVA: <strong>654,50 €</strong>");
  });
  it("valorile utilizatorului sunt escapate", () => {
    const evil = "<script>alert(1)</script>";
    const i = input(config(georgiLines(), { intro: evil, notes: evil }), { x: evil }, evil);
    i.snapshot.client.clRep = evil;
    for (const out of [buildOffer(i), buildServicesAnnex(i), buildHandoverPv(i), buildScheduleAnnex(i), buildSummary(i)]) {
      expect(out).not.toContain("<script");
      expect(out).toContain("&lt;script&gt;");
    }
  });
});

describe("dosar: anexa de servicii", () => {
  const html = buildServicesAnnex(input());
  it("conține numai serviciile contractate, total 550", () => {
    expect(html).toContain("Anexa nr. 1.1 – Servicii și deviz");
    expect(html).toContain("Contractul nr. ESA-2026-001 din 05.11.2026 / Comanda nr. CMD-1");
    expect(html).not.toContain("Videoclip");
    expect(html).not.toContain("Buget publicitar");
    expect(html).toContain("Design responsive");
    expect(html).toContain("art. 6");
    expect(html).toContain("art. 7");
    expect(html).toMatch(/Valoare netă<\/td><td class="r">550 €/);
    expect(html).toMatch(/Total de plată<\/td><td class="r">550 €/);
    expect(html).toContain("Criteriu Design responsive");
  });
  it("codul, UM și sumele nu se rup în mijlocul cuvântului", () => {
    // Fără `nw`, `overflow-wrap:anywhere` îngusta coloanele până la „Co/d”, „servi/ciu”, „4.99/0 lei”.
    expect(html).toContain('<th class="nw">Cod</th>');
    expect(html).toContain('<th class="nw">UM</th>');
    const tbody = html.slice(html.indexOf("<tbody>"), html.indexOf("</tbody>"));
    const money = [...tbody.matchAll(/<td class="r">(.*?)<\/td>/g)].map((m) => m[1]).filter((c) => /\d €/.test(c));
    expect(money.length).toBeGreaterThan(0);
    for (const cell of money) expect(cell).toMatch(/^<span class="nw">[^<]*\d €<\/span>/);
  });
});

describe("dosar: graficul", () => {
  it("tranșele 50/50 dau exact 400 €", () => {
    const html = buildScheduleAnnex(input());
    expect(html).toContain("Anexa nr. 1.2");
    expect(html).toMatch(/Avans<\/td><td class="r">50%<\/td><td class="r">200 €/);
    expect(html).toMatch(/Total<\/td><td class="r">100%<\/td><td class="r">400 €/);
    expect(html).not.toContain("ATENȚIE");
    expect(html).toContain("art. 5.4");
    expect(html).toContain("15.12.2026");
  });
  it("rotunjirea merge pe ultima tranșă", () => {
    const p = installmentPlan(10000, [
      { id: "a", label: "1", percent: 33.33, due: "" },
      { id: "b", label: "2", percent: 33.33, due: "" },
      { id: "c", label: "3", percent: 33.34, due: "" },
    ]);
    expect(p.rows.map((r) => r.amount)).toEqual([3333, 3333, 3334]);
    expect(p.sum).toBe(10000);
    const p3 = installmentPlan(10000, [
      { id: "a", label: "1", percent: 33.333, due: "" },
      { id: "b", label: "2", percent: 33.333, due: "" },
      { id: "c", label: "3", percent: 33.334, due: "" },
    ]);
    expect(p3.sum).toBe(10000);
  });
  it("avertizează când procentele nu dau 100", () => {
    const cfg = config(georgiLines(), { installments: [{ id: "a", label: "Avans", percent: 30, due: "" }, { id: "b", label: "Rest", percent: 60, due: "" }] });
    expect(buildScheduleAnnex(input(cfg))).toContain("ATENȚIE: suma procentelor este 90%");
  });
});

describe("dosar: mentenanța", () => {
  it("aruncă eroare fără servicii recurente", () => {
    const cfg = config(georgiLines().filter((l) => l.billing === "one_time"));
    expect(() => buildMaintenanceAnnex(input(cfg))).toThrow(/servicii recurente/);
  });
  it("listează liniile recurente și condițiile", () => {
    const html = buildMaintenanceAnnex(input());
    expect(html).toContain("Anexa nr. 1.3");
    expect(html).toContain("Mentenanță lunară website");
    expect(html).not.toContain("Redesign");
    for (const a of ["13.5", "5.4", "19.5", "13.6"]) expect(html).toContain(a);
    expect(html).toContain("150 €");
  });
});

describe("dosar: actul adițional", () => {
  it("arată diferențele și noua valoare", () => {
    const before = snapshot(config(georgiLines()));
    const after = georgiLines();
    // ids stabile între versiuni: reutilizăm id-urile din `before`
    const ids = before.config.lines.map((l) => l.id);
    after.forEach((l, i) => (l.id = ids[i]));
    after.forEach((l) => {
      if (l.packageLineId) l.packageLineId = before.config.lines.find((p) => p.isPackage)!.id;
    });
    const pkg = after.find((l) => l.isPackage)!;
    pkg.unitPrice = 45000;
    const video = after.find((l) => l.code === "H01")!;
    video.status = "accepted";
    const inp: AmendmentInput = { ...input(config(after)), before };
    const html = buildAmendment(inp);
    expect(html).toContain("Act adițional nr. 7 la Contractul nr. ESA-2026-001 din 05.11.2026");
    expect(html).toContain("art. 23.2");
    expect(html).toContain("art. 1270");
    expect(html).toContain("+ adăugat");
    expect(html).toContain("~ modificat");
    expect(html).toContain("preț unitar");
    expect(html).toContain('class="add"');
    expect(html).toMatch(/Valoare netă<\/td><td class="r">550 €<\/td><td class="r">750 €<\/td><td class="r">\+200 €/);
    expect(html).toContain("rămân neschimbate");
    expect(html).toContain("Art. 5. Intrarea în vigoare");
    expect(() => buildAmendment({ ...inp, before: undefined as never })).toThrow();
  });
});

describe("dosar: PV", () => {
  it("fără rezultate nu marchează nimic ca recepționat", () => {
    const html = buildHandoverPv(input());
    const tbody = html.slice(html.indexOf("<tbody>"), html.indexOf("</tbody>"));
    expect(tbody).not.toMatch(/acceptat|respins|nepredat/);
    expect(tbody).toContain("……");
    expect(html).toContain("Proces-verbal de predare-primire și recepție nr. 7 din 10.11.2026");
    expect(html).toContain("art. 6.5–6.8");
    expect(html).toContain("art. 13");
  });
  it("completează rezultatele indicate", () => {
    const html = buildHandoverPv(input(config(georgiLines()), { results: { pkg: "accepted_minor", l2: "bogus" } }));
    expect(html).toContain("<strong>acceptat cu defecte minore</strong>");
    expect(html).not.toContain("bogus");
    // „acceptat” nu se rupe în „accepta/t”: coloana se rupe doar între cuvinte.
    expect(html).toContain('<th class="nb">Rezultat</th>');
    expect(html).toMatch(/<td class="nb"><strong>acceptat cu defecte minore<\/strong>/);
  });
});

describe("dosar: centralizator", () => {
  it("grupează pe stare, cu recapitulare", () => {
    const html = buildSummary(input());
    for (const g of ["Servicii contractate – plată unică", "Servicii contractate – recurente", "Servicii incluse în pachete", "Servicii opționale, neacceptate", "Costuri achitate direct de client"]) {
      expect(html).toContain(g);
    }
    expect(html).toMatch(/Total contract<\/td><td class="r">550 €/);
    expect(html).toContain("nu fac parte din valoarea contractuală");
  });
  it("dispecerul acoperă toate tipurile", () => {
    const inp = { ...input(), before: snapshot(config(georgiLines())) };
    for (const t of ["offer", "services_annex", "schedule_annex", "handover_pv", "amendment", "maintenance_annex", "summary"] as const) {
      expect(buildDossierBody(t, inp).length).toBeGreaterThan(100);
    }
  });
});

describe("dosar: nume de fișier", () => {
  it("fără diacritice și caractere speciale", () => {
    expect(fileName("offer", input())).toBe("Oferta_OF-2026-001_Gradinita_Georgi");
    expect(fileName("handover_pv", input(config(georgiLines()), {}, "Școala „Ștefan” & Co.")).startsWith("PV_Predare_Primire_7_Scoala_Stefan_Co")).toBe(true);
  });
});

describe("dosar: DOCX", () => {
  const files = unzipSync(htmlToDocx(buildOffer(input()), { title: "Ofertă comercială", provider, logoPng }));
  it("conține textul, diacriticele, logo-ul și NUMPAGES", () => {
    const doc = strFromU8(files["word/document.xml"]);
    expect(doc).toContain("Grădinița Georgi");
    expect(doc).toContain("Mentenanță lunară website");
    expect(doc).toContain("550 €");
    expect(doc).toContain("w:tblHeader");
    expect(doc).toContain("w:numPr");
    expect(files["word/media/logo.png"]).toBeDefined();
    expect(files["word/media/logo.png"].length).toBe(logoPng.length);
    expect(strFromU8(files["word/footer1.xml"])).toContain("NUMPAGES");
    expect(strFromU8(files["word/footer1.xml"])).toContain("52745149");
    expect(strFromU8(files["word/header1.xml"])).toContain("Ofertă comercială");
    expect(strFromU8(files["word/_rels/header1.xml.rels"])).toContain("media/logo.png");
    expect(strFromU8(files["word/styles.xml"])).toContain("Calibri");
  });
  it("toate părțile sunt XML bine format", () => {
    for (const [name, data] of Object.entries(files)) {
      if (/\.(xml|rels)$/.test(name)) expect(wellFormed(strFromU8(data)), name).toBe(true);
    }
  });
  it("escapează XML-ul", () => {
    const f = unzipSync(htmlToDocx("<p>A &amp; B &lt;x&gt; &quot;q&quot;</p>", { title: "T & <t>", provider, logoPng }));
    const doc = strFromU8(f["word/document.xml"]);
    expect(doc).toContain("A &amp; B &lt;x&gt; &quot;q&quot;");
    expect(wellFormed(strFromU8(f["word/header1.xml"]))).toBe(true);
  });
  it("funcționează și pentru contract", () => {
    const V = { ...defaultValues(), nr: "ESA-2026-001", data: "2026-11-05", clNume: "Grădinița Georgi", inc1: "1", inc2: "", inc3: "" };
    const body = contractBodyHtml(V, template);
    expect(body).toContain("Anexa 1 – Model de Comandă");
    expect(body).not.toContain('data-annex="2"');
    expect(body).not.toContain('data-annex="3"');
    const f = unzipSync(htmlToDocx(body, { title: "Contract-cadru", provider, logoPng }));
    const doc = strFromU8(f["word/document.xml"]);
    expect(doc).toContain("Grădinița Georgi");
    expect(doc).toContain("Art. 24");
    expect(doc).toContain("w:pageBreakBefore");
    expect(wellFormed(doc)).toBe(true);
  });
});

describe("dosar: ZIP", () => {
  it("are structura PDF/, Word/, configuratie-oferta.json", () => {
    const z = unzipSync(buildDossierZip([{ name: "PDF/a.pdf", data: new Uint8Array([1, 2]) }, { name: "Word/a.docx", data: new Uint8Array([3]) }], { a: 1 }));
    expect(Object.keys(z).sort()).toEqual(["PDF/a.pdf", "Word/a.docx", "configuratie-oferta.json"]);
    expect(JSON.parse(strFromU8(z["configuratie-oferta.json"]))).toEqual({ a: 1 });
    expect(() => buildDossierZip([{ name: "../x", data: new Uint8Array() }], {})).toThrow();
  });
});

describe("dosar: ciorne", () => {
  const svc = (code: string, extra: Partial<CatalogService> = {}): CatalogService => ({
    id: `id-${code}`,
    code,
    categoryCode: code[0],
    name: `Serviciu ${code}`,
    shortDescription: `scurt ${code}`,
    description: `detaliat ${code}`,
    deliverables: "",
    acceptance: "",
    unit: "proiect",
    defaultQuantity: 1,
    recommendedPrice: null,
    currency: "EUR",
    billing: "one_time",
    defaultPeriods: 1,
    defaultStatus: "accepted",
    advanced: false,
    duration: "",
    conditions: "",
    ...extra,
  });
  const catalog = ["B01", "B06", "B07", "B08", "B09", "C01", "C03", "C04", "C07", "C09", "E01", "E04", "E06", "F01", "F02", "F15", "F09", "F10", "F11", "H01", "G01", "G04", "G13"].map((c) => svc(c, c === "H01" ? { recommendedPrice: 15000 } : {}));
  const v1 = {
    format: "esa-oferta",
    version: 1,
    state: {
      client: "Grădinița Georgi",
      website: "gradinitageorgi.ro",
      price: "400",
      currency: "EUR",
      date: "2026-11-03",
      ref: "OF-2026-001",
      intro: "Salut",
      notes: "Obs",
      validity: "30 de zile",
      timeline: "6 săptămâni",
      payment: "50/50",
      provider: "ESA",
      company: "ELEXA",
      cui: "52745149",
      reg: "J2025080665008",
      email: "a@b.ro",
      phone: "0748 452 215",
      services: { cms: true, announcements: true, prices: true, contact: true, facebook: true, seo: true, meta: true, tiktok: true, google: true, video: true, ads: true },
    },
  };

  it("importă v1 ca pachet Redesign cu componente", () => {
    const d = importDraft(JSON.stringify(v1), catalog);
    expect(d.version).toBe(1);
    expect(d.warnings).toEqual([]);
    const pkg = d.config.lines.find((l) => l.isPackage)!;
    expect(pkg.name).toBe("Serviciu B01");
    expect(pkg.unitPrice).toBe(40000);
    expect(pkg.status).toBe("accepted");
    const codes = (st: string) => d.config.lines.filter((l) => l.status === st).map((l) => l.code).sort();
    expect(codes("included")).toEqual(["B06", "B07", "B08", "B09", "C01", "C03", "C04", "C07", "C09", "E01", "E04", "E06", "F01", "F02", "F09", "F10", "F11", "F15"].sort());
    expect(d.config.lines.filter((l) => l.status === "included").every((l) => l.packageLineId === pkg.id && l.unitPrice === 0)).toBe(true);
    expect(codes("optional")).toEqual(["G01", "G04", "H01"]);
    expect(codes("client_direct")).toEqual(["G13"]);
    expect(d.config.validityDays).toBe(30);
    expect(d.config.paymentTerms).toBe("50/50");
    expect(d.config.timeline).toBe("6 săptămâni");
    expect(d.config.website).toBe("gradinitageorgi.ro");
    expect(d.offer.number).toBe("OF-2026-001");
    expect(d.legacy?.cui).toBe("52745149");
    expect(computeTotals(d.config).net).toBe(40000);
  });
  it("v1 cu servicii bifate parțial și prețuri în format românesc", () => {
    const s = { ...v1, state: { ...v1.state, price: "1.250,50 €", services: { cms: true } } };
    const d = importDraft(JSON.stringify(s), catalog);
    expect(d.config.lines.find((l) => l.isPackage)!.unitPrice).toBe(125050);
    expect(d.config.lines.map((l) => l.code).sort()).toEqual(["B01", "B06", "B07", "B08", "B09", "C01", "C03", "C04"]);
  });
  it("v1: servicii lipsă din catalog dau avertismente", () => {
    const d = importDraft(JSON.stringify(v1), catalog.filter((c) => c.code !== "F10"));
    expect(d.warnings.join(" ")).toContain("F10");
  });
  it("export v2 și import înapoi", () => {
    const cfg = config(georgiLines());
    const json = exportDraft({ number: "OF-1", date: "2026-11-03", title: "T", clientId: null, projectId: null, config: cfg });
    expect(JSON.parse(json)).toMatchObject({ format: "esa-oferta", version: 2, offer: { number: "OF-1" } });
    const d = importDraft(json, catalog);
    expect(d.version).toBe(2);
    expect(d.config).toEqual(cfg);
  });
  it("validare strictă, cu mesaje în română", () => {
    expect(() => importDraft("nu e json", catalog)).toThrow("JSON valid");
    expect(() => importDraft(JSON.stringify({ format: "altceva" }), catalog)).toThrow("ciornă de ofertă");
    expect(() => importDraft(JSON.stringify({ format: "esa-oferta", version: 9 }), catalog)).toThrow("nu este acceptată");
    expect(() => importDraft(JSON.stringify({ format: "esa-oferta", version: 2, offer: {}, config: { currency: "GBP" } }), catalog)).toThrow("currency");
    const bad = JSON.parse(exportDraft({ number: "", date: "", title: "", clientId: null, projectId: null, config: config(georgiLines()) }));
    bad.config.lines[0].unitPrice = 1.5;
    expect(() => importDraft(JSON.stringify(bad), catalog)).toThrow("unitPrice");
    expect(() => importDraft("x".repeat(201 * 1024), catalog)).toThrow("200 KB");
    expect(() => importDraft(JSON.stringify({ ...v1, state: { ...v1.state, currency: "GBP" } }), catalog)).toThrow("Moneda");
  });
  it("lineFromService preia prețul numai în aceeași monedă", () => {
    const s = svc("H01", { recommendedPrice: 15000, defaultStatus: "optional" });
    expect(lineFromService(s, "EUR").unitPrice).toBe(15000);
    expect(lineFromService(s, "RON").unitPrice).toBe(0);
    expect(lineFromService(s, "EUR").status).toBe("optional");
    expect(lineFromService(s, "EUR").id).not.toBe(lineFromService(s, "EUR").id);
    expect(lineFromService(svc("B06", { defaultStatus: "included" }), "EUR").status).toBe("accepted");
  });
});
