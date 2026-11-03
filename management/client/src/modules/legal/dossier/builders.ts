/**
 * Builder-ele HTML ale dosarului contractual. Fiecare funcție este pură și întoarce corpul
 * documentului (string HTML) cu elementele pe care paginarea le știe: h1, h2, p, ul, ol,
 * table cu thead/tbody, `section.annex`, `h2.brk`. Toate valorile utilizatorului trec prin
 * `esc()`. Sumele vin numai din `shared/offers.ts` (formatMoney, computeTotals, lineAmounts,
 * contractedLines, diffLines); nimic nu se recalculează în alt mod.
 *
 * Textele juridice sunt modele și trimit la articolele din `contract/template.html`.
 */
import {
  BILLING_LABELS,
  computeTotals,
  contractedLines,
  diffLines,
  formatMoney,
  lineAmounts,
  type Billing,
  type LineAmounts,
  type LineChange,
  type OfferConfig,
  type OfferLine,
  type OfferSnapshot,
  type OfferTotals,
  type PaymentInstallment,
} from "@shared/offers";
import type { Currency } from "@shared/enums";
import { esc } from "../contract/engine";
import type { AmendmentInput, DossierInput, DossierRenderType } from "./types";

/** Numerotarea anexelor noi la Comandă (anexele contractului-cadru sunt 1–3). Ușor de schimbat. */
export const ANNEX_NUMBERS = {
  services: "1.1",
  schedule: "1.2",
  maintenance: "1.3",
} as const;

/** Rezultatele posibile ale unui livrabil în PV. */
export const PV_RESULTS: Record<string, string> = {
  accepted: "acceptat",
  accepted_minor: "acceptat cu defecte minore",
  rejected: "respins",
  not_delivered: "nepredat",
};

const BLANK = "……………";

/* ------------------------------------------------------------------ utilitare */

const g = (v: string | null | undefined): string => (v ?? "").trim();

/** Dată ISO → `ZZ.LL.AAAA`; alt text rămâne neschimbat. */
export function fmtDay(v: string | null | undefined): string {
  const s = g(v);
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  return m ? `${m[3]}.${m[2]}.${m[1]}` : s;
}

const blank = (v: string | null | undefined): string => (g(v) ? esc(g(v)) : BLANK);

type Cell = string | { h: string; span?: number; cls?: string };
interface Col {
  h: string;
  /** `r` = aliniat la dreapta, `c` = centrat. */
  cls?: string;
}
interface Row {
  cells: Cell[];
  cls?: string;
}

/** Tabel cu thead/tbody. Celulele sunt HTML deja escapat. */
function table(cols: Col[], rows: Row[], cls?: string): string {
  const head = cols.map((c) => `<th${c.cls ? ` class="${c.cls}"` : ""}>${esc(c.h)}</th>`).join("");
  const body = rows
    .map((r) => {
      let ci = 0;
      const tds = r.cells
        .map((c) => {
          const o = typeof c === "string" ? { h: c } : c;
          const colCls = o.cls ?? cols[ci]?.cls;
          ci += o.span ?? 1;
          return `<td${o.span && o.span > 1 ? ` colspan="${o.span}"` : ""}${colCls ? ` class="${colCls}"` : ""}>${o.h}</td>`;
        })
        .join("");
      return `<tr${r.cls ? ` class="${r.cls}"` : ""}>${tds}</tr>`;
    })
    .join("");
  return `<table${cls ? ` class="${cls}"` : ""}><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}

const h1 = (t: string): string => `<h1>${esc(t)}</h1>`;
const h2 = (t: string, brk = false): string => `<h2${brk ? ' class="brk"' : ""}>${esc(t)}</h2>`;
const para = (html: string, cls?: string): string => `<p${cls ? ` class="${cls}"` : ""}>${html}</p>`;
const ul = (items: string[]): string => `<ul>${items.map((i) => `<li>${i}</li>`).join("")}</ul>`;
/** Denumirea unei linii; pachetele apar îngroșat. */
const nm = (l: OfferLine): string => (l.isPackage ? `<strong>${esc(l.name)}</strong>` : esc(l.name));
const mut = (t: string): string => `<span class="mut">${esc(t)}</span>`;
/** Text deja escapat, pe un singur rând (sume în tabele: „4.990 lei” nu se rupe). */
const nw = (html: string): string => `<span class="nw">${html}</span>`;

interface Ctx {
  s: OfferSnapshot;
  cfg: OfferConfig;
  cur: Currency;
  t: OfferTotals;
  m: (n: number) => string;
}

function ctxOf(s: OfferSnapshot): Ctx {
  const cfg = s.config;
  return { s, cfg, cur: cfg.currency, t: computeTotals(cfg), m: (n) => formatMoney(n, cfg.currency) };
}

const periodWord = (b: Billing, n: number): string => {
  const [one, few, many] = b === "yearly" ? ["an", "ani", "de ani"] : ["lună", "luni", "de luni"];
  return n === 1 ? one : n < 20 ? few : many;
};
const perUnit = (b: Billing): string => (b === "yearly" ? "an" : "lună");

const fmtPct = (p: number): string => `${p.toLocaleString("ro-RO", { maximumFractionDigits: 2 })}%`;
const fmtQty = (q: number): string => q.toLocaleString("ro-RO", { maximumFractionDigits: 3 });

/** „50 € / lună × 3 luni”; pentru plata unică, doar suma. */
function periodicText(l: OfferLine, a: LineAmounts, m: (n: number) => string): string {
  if (l.billing === "one_time") return m(a.net);
  return `${m(a.net)}/${perUnit(l.billing)} × ${a.periods} ${periodWord(l.billing, a.periods)}`;
}

/** Linie de nivel superior (nu e componentă de pachet), cu componentele ei. */
interface LineNode {
  line: OfferLine;
  comps: OfferLine[];
}

function nodes(lines: OfferLine[], pick: (l: OfferLine) => boolean): LineNode[] {
  return lines
    .filter((l) => l.status !== "included" && pick(l))
    .map((l) => ({
      line: l,
      comps: l.isPackage ? lines.filter((c) => c.status === "included" && c.packageLineId === l.id) : [],
    }));
}

const isRecurring = (l: OfferLine): boolean => l.billing !== "one_time";

function categoryOf(l: OfferLine): string {
  return (l.category ?? l.code?.[0] ?? "").toUpperCase();
}

/** Părțile contractante, ca paragrafe (valorile lipsă sunt omise). */
function partiesHtml(s: OfferSnapshot): string {
  const p = s.provider;
  const c = s.client;
  const join = (bits: Array<string | false>): string => bits.filter(Boolean).join(", ");
  const prest = join([
    `<strong>${esc(g(p.esaNume) || g(p.esaMarca) || "Prestator")}</strong>`,
    !!g(p.esaMarca) && g(p.esaMarca) !== g(p.esaNume) && `marca ${esc(g(p.esaMarca))}`,
    !!g(p.esaAdresa) && `cu sediul în ${esc(g(p.esaAdresa))}`,
    !!g(p.esaRc) && `înregistrată la Registrul Comerțului sub nr. ${esc(g(p.esaRc))}`,
    !!g(p.esaCui) && `CUI ${esc(g(p.esaCui))}`,
    !!g(p.esaRep) && `reprezentată prin ${esc(g(p.esaRep))}${g(p.esaFunctie) ? `, în calitate de ${esc(g(p.esaFunctie))}` : ""}`,
    "denumită în continuare <strong>„Prestatorul”</strong>",
  ]);
  const ben = join([
    `<strong>${esc(g(c.clNume) || BLANK)}</strong>`,
    !!g(c.clSediu) && `cu sediul în ${esc(g(c.clSediu))}`,
    !!g(c.clRc) && `înregistrată la Registrul Comerțului sub nr. ${esc(g(c.clRc))}`,
    !!g(c.clCui) && `CUI ${esc(g(c.clCui))}`,
    !!g(c.clRep) && `reprezentată prin ${esc(g(c.clRep))}${g(c.clFunctie) ? `, în calitate de ${esc(g(c.clFunctie))}` : ""}`,
    "denumită în continuare <strong>„Beneficiarul”</strong>",
  ]);
  return para(prest + ",") + para("și") + para(ben + ".");
}

/** Contractul și Comanda la care se raportează documentul. */
function contractRef(input: DossierInput): string {
  const c = input.contract;
  return `Contractul nr. ${c ? blank(c.number) : BLANK} din ${c ? (fmtDay(c.date) || BLANK) : BLANK} / Comanda nr. ${c ? blank(c.cmdNr) : BLANK}`;
}

function signatures(s: OfferSnapshot): string {
  const cell = (rep: string) => `Prin: ${blank(rep)}<br><br>Semnătura: ${BLANK}<br><br>Data: ${BLANK}`;
  return table(
    [{ h: "PRESTATOR" }, { h: "BENEFICIAR" }],
    [{ cells: [cell(s.provider.esaRep), cell(s.client.clRep)] }],
    "sig",
  );
}

function annexNo(input: DossierInput, dflt: string): string {
  const v = input.doc.data.annexNo;
  return typeof v === "string" && v.trim() ? v.trim() : dflt;
}

function annexHead(no: string, title: string, input: DossierInput): string {
  return h2(`Anexa nr. ${no} – ${title}`) + para(`la ${contractRef(input)}`);
}

const MINUS = "−";
const signed = (n: number, m: (n: number) => string): string => (n > 0 ? `+${m(n)}` : n < 0 ? `${MINUS}${m(-n)}` : m(0));

/* ------------------------------------------------------------------ note de categorie */

/** Notele aplicabile, numai pentru categoriile prezente în ofertă (textele din specificație). */
export function categoryNotes(lines: OfferLine[]): string[] {
  const cats = new Set(lines.map(categoryOf));
  const notes: string[] = [];
  if (lines.some((l) => l.code === "E06")) {
    notes.push(
      "Preluarea postărilor de pe pagina Facebook este condiționată de disponibilitatea tehnică și de permisiunile Meta, în limitele API-ului și ale politicilor Meta.",
    );
  }
  const advanced = lines.some((l) => l.advanced || (categoryOf(l) === "D" && /^D(0[89]|1[0-2])$/.test(l.code ?? "")));
  if (advanced) {
    notes.push(
      "Dezvoltările avansate pentru instituții educaționale (portal privat pentru părinți, notificări, jurnal de activități, galerii private, management de cereri și documente) sunt ofertate separat. Ele implică date personale și, posibil, date ale minorilor și necesită analiză GDPR, control de acces, protecție a datelor, reguli de retenție și cerințe funcționale aprobate înainte de contractare.",
    );
  }
  if (cats.has("F")) notes.push("Optimizările SEO nu garantează poziții, trafic sau rezultate comerciale specifice.");
  if (cats.has("G")) {
    notes.push(
      "Onorariile pentru configurarea și administrarea campaniilor sunt separate de bugetele publicitare. Sumele cheltuite pe Meta, Google sau TikTok sunt achitate de beneficiar direct platformelor, dacă nu se stabilește expres alt aranjament contractual.",
    );
  }
  if (cats.has("H")) {
    notes.push(
      "Pentru filmări și fotografii care implică minori, proiectul include verificarea drepturilor de utilizare a imaginii și a consimțămintelor necesare.",
    );
  }
  if (cats.has("L")) {
    notes.push(
      "Abonamentul Shopify, aplicațiile plătite și comisioanele de plată sunt contractate și plătite de beneficiar direct către Shopify și furnizorii aplicațiilor. Funcționalitățile depind de planul Shopify ales.",
    );
  }
  return notes;
}

/* ------------------------------------------------------------------ 1. oferta comercială */

export function buildOffer(input: DossierInput): string {
  const { s, cfg, t, m } = ctxOf(input.snapshot);
  const out: string[] = [];
  const clientName = g(s.client.clNume) || g(s.offer.title) || "client";
  const nr = g(input.doc.number) || g(s.offer.number);
  const date = fmtDay(input.doc.date || s.offer.date);

  out.push(para("PROPUNERE COMERCIALĂ", "kicker"));
  out.push(h1(`Ofertă comercială pentru ${clientName}`));
  out.push(para(`<strong>Nr. ${nr ? esc(nr) : BLANK} din ${date || BLANK}</strong>`));

  const marca = g(s.provider.esaMarca) || g(s.provider.esaNume) || "Prestatorul";
  const intro = g(cfg.intro)
    ? esc(g(cfg.intro))
    : `${esc(marca)} propune ${g(cfg.projectName) ? `realizarea proiectului „${esc(g(cfg.projectName))}”` : "serviciile descrise mai jos"} pentru ${esc(clientName)}${g(cfg.website) ? `, pentru website-ul ${esc(g(cfg.website))}` : ""}.`;
  out.push(para(intro));

  /* valoarea ofertei */
  out.push(h2("Valoarea ofertei"));
  out.push(para(esc(m(t.net)), "big"));
  const recLines = cfg.lines.filter((l) => l.status === "accepted" && isRecurring(l));
  if (recLines.length) {
    const parts: string[] = [];
    if (t.oneTime > 0) parts.push(`${m(t.oneTime)} unic`);
    for (const l of recLines) parts.push(periodicText(l, lineAmounts(l, cfg.lines), m));
    out.push(para(`din care ${esc(parts.join(" + "))}`));
  }
  out.push(
    para(
      cfg.vatRate > 0
        ? `Valoare netă, fără TVA. TVA ${esc(fmtPct(cfg.vatRate))}: ${esc(m(t.vat))}. Total cu TVA: <strong>${esc(m(t.gross))}</strong>.`
        : "Prețurile nu includ TVA.",
    ),
  );

  /* servicii incluse (plată unică) */
  const oneTime = nodes(cfg.lines, (l) => l.status === "accepted" && !isRecurring(l));
  if (oneTime.length) {
    out.push(h2("Servicii incluse"));
    const rows: Row[] = [];
    for (const n of oneTime) {
      const a = lineAmounts(n.line, cfg.lines);
      const disc = a.discount > 0 ? `<br>${mut(`reducere acordată: ${m(a.discount)}`)}` : "";
      rows.push({
        cls: n.line.isPackage ? "grp" : undefined,
        cells: [
          nm(n.line) + (n.line.isPackage ? `<br>${mut("pachet")}` : ""),
          esc(g(n.line.description)),
          `${nw(esc(m(a.total)))}${disc}`,
        ],
      });
      for (const c of n.comps) {
        rows.push({ cls: "sub", cells: [esc(c.name), esc(g(c.description)), mut("inclus în pachet")] });
      }
    }
    out.push(table([{ h: "Serviciu" }, { h: "Descriere detaliată" }, { h: "Valoare", cls: "r" }], rows));
  }

  /* servicii recurente */
  const recurring = nodes(cfg.lines, (l) => l.status === "accepted" && isRecurring(l));
  if (recurring.length) {
    out.push(h2("Servicii lunare / recurente"));
    const rows: Row[] = [];
    for (const n of recurring) {
      const a = lineAmounts(n.line, cfg.lines);
      rows.push({
        cls: n.line.isPackage ? "grp" : undefined,
        cells: [
          nm(n.line) + (n.line.isPackage ? `<br>${mut("pachet")}` : ""),
          esc(g(n.line.description)),
          esc(BILLING_LABELS[n.line.billing]),
          esc(m(a.net)),
          `${a.periods}`,
          esc(m(a.total)),
        ],
      });
      for (const c of n.comps) {
        rows.push({
          cls: "sub",
          cells: [esc(c.name), esc(g(c.description)), { h: mut("inclus în pachet"), span: 4 }],
        });
      }
    }
    out.push(
      table(
        [{ h: "Serviciu" }, { h: "Descriere detaliată" }, { h: "Frecvență", cls: "nb" }, { h: "Pe perioadă", cls: "r" }, { h: "Perioade", cls: "c" }, { h: "Total", cls: "r" }],
        rows,
      ),
    );
  }

  /* opționale */
  const optional = nodes(cfg.lines, (l) => l.status === "optional");
  if (optional.length) {
    out.push(h2("Servicii opționale, cu tarif separat"));
    out.push(
      para(
        "Serviciile de mai jos sunt propuse separat și nu sunt incluse în valoarea ofertei. Ele se contractează numai dacă beneficiarul le acceptă expres.",
      ),
    );
    const rows: Row[] = [];
    for (const n of optional) {
      const a = lineAmounts(n.line, cfg.lines);
      rows.push({
        cls: n.line.isPackage ? "grp" : undefined,
        cells: [
          nm(n.line),
          esc(g(n.line.description)),
          a.gross === 0 ? "—" : esc(isRecurring(n.line) ? `${periodicText(n.line, a, m)} = ${m(a.total)}` : m(a.total)),
        ],
      });
      for (const c of n.comps) rows.push({ cls: "sub", cells: [esc(c.name), esc(g(c.description)), mut("inclus în pachet")] });
    }
    out.push(table([{ h: "Serviciu" }, { h: "Descriere" }, { h: "Tarif", cls: "r" }], rows));
  }

  /* costuri directe */
  const direct = nodes(cfg.lines, (l) => l.status === "client_direct");
  if (direct.length) {
    out.push(h2("Costuri achitate direct de beneficiar"));
    out.push(
      para(
        "Sumele de mai jos se achită de beneficiar direct către platformele și furnizorii respectivi. Ele sunt distincte de prețul serviciilor prestate și nu fac parte din valoarea ofertei.",
      ),
    );
    const rows: Row[] = direct.map((n) => {
      const a = lineAmounts(n.line, cfg.lines);
      return {
        cells: [
          nm(n.line),
          esc(g(n.line.description)),
          a.gross === 0 ? "—" : esc(isRecurring(n.line) ? periodicText(n.line, a, m) : m(a.total)),
        ],
      };
    });
    out.push(table([{ h: "Cost" }, { h: "Descriere" }, { h: "Sumă", cls: "r" }], rows));
  }

  /* note de categorie */
  const notes = categoryNotes(cfg.lines);
  if (notes.length) {
    out.push(h2("Precizări privind serviciile"));
    out.push(ul(notes.map((n) => esc(n))));
  }

  /* condiții comerciale */
  const terms: Row[] = [];
  if (cfg.validityDays) terms.push({ cells: ["Valabilitatea ofertei", esc(`${cfg.validityDays} zile de la data emiterii`)] });
  if (g(cfg.timeline)) terms.push({ cells: ["Termen de realizare", esc(g(cfg.timeline))] });
  if (g(cfg.paymentTerms)) terms.push({ cells: ["Condiții de plată", esc(g(cfg.paymentTerms))] });
  terms.push({ cells: ["TVA", cfg.vatRate > 0 ? esc(`TVA ${fmtPct(cfg.vatRate)}, adăugat la valoarea netă`) : "Prețurile nu includ TVA"] });
  out.push(h2("Condiții comerciale"));
  out.push(table([{ h: "Condiție" }, { h: "Detalii" }], terms, "kv"));

  out.push(h2("Aprobare și predare"));
  out.push(
    para(
      "Beneficiarul furnizează textele, imaginile aprobate și accesurile necesare. Stabilim calendarul, responsabilul pentru feedback și condițiile de facturare înainte de începerea lucrărilor. Verificăm versiunea de test pe telefon, tabletă și calculator. Publicarea are loc după aprobarea versiunii finale, iar la predare beneficiarul primește accesele și explicațiile necesare utilizării livrabilelor.",
    ),
  );
  out.push(para("Oferta devine angajament pentru părți numai după acceptarea ei scrisă de beneficiar și încheierea documentelor contractuale."));

  if (g(cfg.notes)) {
    out.push(h2("Observații"));
    out.push(para(esc(g(cfg.notes))));
  }
  return out.join("\n");
}

/* ------------------------------------------------------------------ 2. anexa de servicii și deviz */

function discountText(l: OfferLine, a: LineAmounts, m: (n: number) => string): string {
  if (a.discount <= 0) return "–";
  const pct = l.discountType === "percent" ? ` ${nw(`(${esc(fmtPct(l.discountValue))})`)}` : "";
  return `${nw(esc(m(a.discount)))}${pct}`;
}

export function buildServicesAnnex(input: DossierInput): string {
  const { s, cfg, t, m } = ctxOf(input.snapshot);
  const no = annexNo(input, ANNEX_NUMBERS.services);
  const contracted = contractedLines(cfg.lines);
  const top = nodes(contracted, () => true);

  const rows: Row[] = [];
  top.forEach((n, i) => {
    const l = n.line;
    const a = lineAmounts(l, cfg.lines);
    const rec = isRecurring(l) ? `<br>${mut(`${periodicText(l, a, m)}`)}` : "";
    rows.push({
      cls: l.isPackage ? "grp" : undefined,
      cells: [
        { h: `${i + 1}`, cls: "nr" },
        esc(g(l.code) || "–"),
        `${nm(l)}${l.isPackage ? ` ${mut("(pachet)")}` : ""}${g(l.description) ? `<br>${esc(g(l.description))}` : ""}`,
        { h: esc(fmtQty(l.quantity)), cls: "r" },
        esc(g(l.unit) || "–"),
        { h: nw(esc(m(l.unitPrice))), cls: "r" },
        { h: discountText(l, a, m), cls: "r" },
        { h: `${nw(esc(m(a.total)))}${rec}`, cls: "r" },
      ],
    });
    n.comps.forEach((c, k) => {
      rows.push({
        cls: "sub",
        cells: [
          { h: `${i + 1}.${k + 1}`, cls: "nr" },
          esc(g(c.code) || "–"),
          `${esc(c.name)}${g(c.description) ? `<br>${esc(g(c.description))}` : ""}`,
          { h: esc(fmtQty(c.quantity)), cls: "r" },
          esc(g(c.unit) || "–"),
          { h: mut("inclus în pachet"), span: 3, cls: "r" },
        ],
      });
    });
  });

  const out: string[] = [annexHead(no, "Servicii și deviz", input)];
  out.push(
    para(
      "Prezenta anexă descrie serviciile contractate și valoarea lor. Comanda face parte integrantă din Contract (art. 3.2), iar serviciile care nu sunt menționate aici sunt în afara obiectului ei.",
    ),
  );
  if (!rows.length) out.push(para("<strong>Nu există servicii contractate în această configurație.</strong>", "warn"));
  out.push(h2("Servicii contractate"));
  out.push(
    table(
      [
        { h: "Nr. crt.", cls: "nr" },
        { h: "Cod", cls: "nw" },
        { h: "Serviciu și descriere" },
        { h: "Cant.", cls: "r" },
        { h: "UM", cls: "nw" },
        { h: "Preț unitar", cls: "r" },
        { h: "Reducere", cls: "r" },
        { h: "Valoare", cls: "r" },
      ],
      rows,
    ),
  );

  /* livrabile și criterii de recepție */
  const dl = contracted.filter((l) => g(l.deliverables) || g(l.acceptance));
  if (dl.length) {
    out.push(h2("Livrabile și criterii de recepție"));
    out.push(
      para("Recepția livrabilelor se face conform art. 6 din Contract, pe baza criteriilor de mai jos."),
    );
    out.push(
      table(
        [{ h: "Serviciu" }, { h: "Livrabil" }, { h: "Criteriu de recepție" }],
        dl.map((l) => ({
          cls: l.isPackage ? "grp" : undefined,
          cells: [esc(l.name), esc(g(l.deliverables) || "—"), esc(g(l.acceptance) || "—")],
        })),
      ),
    );
  }

  /* totaluri */
  out.push(h2("Valoarea contractuală"));
  const tr: Row[] = [{ cells: ["Servicii cu plată unică (net)", { h: esc(m(t.oneTime)), cls: "r" }] }];
  if (t.monthly > 0) tr.push({ cells: ["Servicii recurente – pe lună (net)", { h: esc(m(t.monthly)), cls: "r" }] });
  if (t.yearly > 0) tr.push({ cells: ["Servicii recurente – pe an (net)", { h: esc(m(t.yearly)), cls: "r" }] });
  if (t.recurring > 0) tr.push({ cells: ["Servicii recurente – pe perioada contractată (net)", { h: esc(m(t.recurring)), cls: "r" }] });
  if (t.discount > 0) tr.push({ cells: ["Reduceri acordate (incluse în valorile de mai sus)", { h: esc(m(t.discount)), cls: "r" }] });
  tr.push({ cls: "tot", cells: ["Valoare netă", { h: esc(m(t.net)), cls: "r" }] });
  tr.push({
    cells: [cfg.vatRate > 0 ? `TVA ${esc(fmtPct(cfg.vatRate))}` : "TVA", { h: cfg.vatRate > 0 ? esc(m(t.vat)) : "Prețurile nu includ TVA", cls: "r" }],
  });
  tr.push({ cls: "tot", cells: ["Total de plată", { h: esc(m(t.gross)), cls: "r" }] });
  out.push(table([{ h: "Element" }, { h: "Valoare", cls: "r" }], tr));
  out.push(
    para(
      "Serviciile opționale și costurile achitate direct de Beneficiar nu fac parte din prezenta anexă și din valoarea contractuală. Orice modificare a serviciilor sau a scopului se face conform art. 7 din Contract (modificări de scop) și, dacă schimbă Contractul, prin act adițional (art. 23.2).",
    ),
  );
  out.push(signatures(s));
  return `<section class="annex">${out.join("\n")}</section>`;
}

/* ------------------------------------------------------------------ 3. graficul de implementare și plată */

export interface InstallmentPlan {
  rows: { label: string; percent: number; amount: number; due: string }[];
  percentSum: number;
  /** Procentele dau exact 100. */
  exact: boolean;
  /** Suma tranșelor calculate. */
  sum: number;
}

/**
 * Tranșele de plată pentru valoarea unică. Fiecare sumă = round(unic × procent / 100); dacă
 * procentele dau 100, diferența de rotunjire merge pe ultima tranșă, ca suma să fie exactă.
 */
export function installmentPlan(oneTime: number, installments: PaymentInstallment[]): InstallmentPlan {
  const percentSum = installments.reduce((acc, i) => acc + (Number(i.percent) || 0), 0);
  const exact = installments.length > 0 && Math.abs(percentSum - 100) < 1e-6;
  const rows = installments.map((i) => ({
    label: i.label,
    percent: Number(i.percent) || 0,
    amount: Math.round(Number(((oneTime * (Number(i.percent) || 0)) / 100).toFixed(6))),
    due: i.due,
  }));
  if (exact && rows.length) {
    const before = rows.slice(0, -1).reduce((acc, r) => acc + r.amount, 0);
    rows[rows.length - 1].amount = oneTime - before;
  }
  return { rows, percentSum, exact, sum: rows.reduce((acc, r) => acc + r.amount, 0) };
}

function paymentTable(oneTime: number, installments: PaymentInstallment[], m: (n: number) => string): string {
  const plan = installmentPlan(oneTime, installments);
  const rows: Row[] = plan.rows.map((r) => ({
    cells: [esc(r.label), { h: esc(fmtPct(r.percent)), cls: "r" }, { h: esc(m(r.amount)), cls: "r" }, esc(fmtDay(r.due) || "–")],
  }));
  rows.push({ cls: "tot", cells: ["Total", { h: esc(fmtPct(plan.percentSum)), cls: "r" }, { h: esc(m(plan.sum)), cls: "r" }, ""] });
  let html = table([{ h: "Tranșă" }, { h: "Procent", cls: "r" }, { h: "Sumă (net)", cls: "r" }, { h: "Scadență" }], rows);
  if (!plan.exact) {
    html += para(
      `ATENȚIE: suma procentelor este ${esc(fmtPct(plan.percentSum))}, nu 100%. Graficul de plată trebuie corectat înainte de semnare.`,
      "warn",
    );
  }
  return html;
}

export function buildScheduleAnnex(input: DossierInput): string {
  const { s, cfg, t, m } = ctxOf(input.snapshot);
  const no = annexNo(input, ANNEX_NUMBERS.schedule);
  const out: string[] = [annexHead(no, "Graficul de implementare și plată", input)];

  out.push(h2("Etapele de implementare"));
  if (cfg.stages.length) {
    out.push(
      table(
        [{ h: "Nr.", cls: "nr" }, { h: "Etapă" }, { h: "Livrabile" }, { h: "Termen", cls: "nb" }, { h: "Tip termen", cls: "nb" }],
        cfg.stages.map((st, i) => ({
          cells: [
            { h: `${i + 1}`, cls: "nr" },
            esc(st.name),
            esc(g(st.deliverables) || "—"),
            esc(fmtDay(st.term) || "–"),
            st.firm ? "ferm" : "estimativ",
          ],
        })),
      ),
    );
  } else {
    out.push(para("Etapele de implementare nu sunt definite; ele se completează de Părți înainte de semnare."));
  }
  out.push(
    para(
      "Termenele sunt estimative, cu excepția celor marcate „ferm” (art. 6.1 din Contract). Ele încep să curgă de la cea mai târzie dintre încasarea avansului, primirea materialelor Beneficiarului și aprobarea etapei anterioare (art. 6.2) și se pot prelungi în cazurile din art. 6.3.",
    ),
  );

  out.push(h2("Plata valorii unice"));
  out.push(para(`Valoarea netă a serviciilor cu plată unică este <strong>${esc(m(t.oneTime))}</strong>.`));
  if (cfg.installments.length) {
    out.push(paymentTable(t.oneTime, cfg.installments, m));
  } else {
    out.push(para("Tranșele de plată nu sunt definite; ele se completează de Părți înainte de semnare."));
  }
  out.push(
    para(
      "Avansul se plătește pe baza facturii emise la semnarea Comenzii, iar lucrul începe după încasarea lui (art. 5.2). Facturile se plătesc în termenul prevăzut la art. 5.8 din Contract.",
    ),
  );

  const rec = nodes(cfg.lines, (l) => l.status === "accepted" && isRecurring(l));
  if (rec.length) {
    out.push(h2("Servicii recurente"));
    out.push(
      para(
        "Serviciile recurente se facturează lunar sau anual, în avans, la începutul fiecărei perioade (art. 5.4 din Contract). Perioadele începute nu se rambursează.",
      ),
    );
    out.push(
      ul(
        rec.map((n) => {
          const a = lineAmounts(n.line, cfg.lines);
          return `${nm(n.line)}: ${esc(periodicText(n.line, a, m))} = ${esc(m(a.total))}`;
        }),
      ),
    );
    out.push(para(`Total recurent pe perioada contractată: <strong>${esc(m(t.recurring))}</strong>.`));
  }
  out.push(signatures(s));
  return `<section class="annex">${out.join("\n")}</section>`;
}

/* ------------------------------------------------------------------ 4. PV de predare-primire */

export function buildHandoverPv(input: DossierInput): string {
  const { s, cfg } = ctxOf(input.snapshot);
  const data = input.doc.data;
  const results = (data.results && typeof data.results === "object" ? data.results : {}) as Record<string, unknown>;
  const delivery = (data.delivery && typeof data.delivery === "object" ? data.delivery : {}) as Record<string, unknown>;
  const text = (k: string): string => (typeof data[k] === "string" && g(data[k] as string) ? esc(g(data[k] as string)) : BLANK);

  const contracted = contractedLines(cfg.lines);
  const top = nodes(contracted, (l) => !isRecurring(l) || !!g(l.deliverables));
  const rowOf = (l: OfferLine, cls?: string): Row => {
    const r = results[l.id];
    const res = typeof r === "string" && Object.hasOwn(PV_RESULTS, r) ? PV_RESULTS[r] : null;
    const d = delivery[l.id];
    return {
      cls,
      cells: [
        esc(l.name),
        esc(g(l.deliverables) || "—"),
        esc(g(l.acceptance) || "—"),
        typeof d === "string" && g(d) ? esc(g(d)) : BLANK,
        res ? `<strong>${esc(res)}</strong>` : BLANK,
      ],
    };
  };
  const rows: Row[] = [];
  for (const n of top) {
    rows.push(rowOf(n.line, n.line.isPackage ? "grp" : undefined));
    for (const c of n.comps) rows.push(rowOf(c, "sub"));
  }

  const nr = g(input.doc.number);
  const out: string[] = [];
  out.push(h1(`Proces-verbal de predare-primire și recepție nr. ${nr || BLANK} din ${fmtDay(input.doc.date) || BLANK}`));
  out.push(para(`Încheiat între:`));
  out.push(partiesHtml(s));
  out.push(
    para(
      `Procesul-verbal se încheie în baza ${contractRef(input)}, pentru livrabilele de mai jos, conform art. 6 din Contract.`,
    ),
  );
  out.push(h2("Livrabile predate"));
  out.push(
    para("La predare, în coloana „Rezultat” se înscrie, pentru fiecare livrabil, una dintre variantele: acceptat, acceptat cu defecte minore, respins sau nepredat."),
  );
  out.push(
    table(
      [{ h: "Serviciu" }, { h: "Livrabil" }, { h: "Criteriu de recepție" }, { h: "Mod de predare", cls: "nb" }, { h: "Rezultat", cls: "nb" }],
      rows.length ? rows : [{ cells: [{ h: "Nu există livrabile contractate.", span: 5 }] }],
    ),
  );
  out.push(para(`<strong>Defecte minore, de remediat în garanție:</strong> ${text("minorDefects")}`));
  out.push(para(`<strong>Defecte care împiedică recepția</strong> (cu pașii de reproducere): ${text("blockingDefects")}`));
  out.push(
    para(
      "Recepția se face potrivit art. 6.5–6.8 din Contract: Beneficiarul testează Livrabilele în 5 zile lucrătoare de la predare și semnează procesul-verbal sau transmite lista Defectelor; defectele minore nu împiedică Recepția și se remediază în garanție (art. 6.7); după remediere, Beneficiarul retestează numai Defectele notificate (art. 6.8).",
    ),
  );
  out.push(
    para(
      "Prin semnarea procesului-verbal sunt recepționate numai Livrabilele pentru care în coloana „Rezultat” este înscris „acceptat” sau „acceptat cu defecte minore”. Livrabilele respinse, nepredate sau necompletate nu se consideră recepționate. Data procesului-verbal marchează începutul perioadei de garanție (art. 13) și exigibilitatea facturii aferente, numai pentru Livrabilele recepționate.",
    ),
  );
  out.push(signatures(s));
  return out.join("\n");
}

/* ------------------------------------------------------------------ 5. act adițional */

const FIELD_LABELS: Partial<Record<keyof OfferLine, string>> = {
  name: "denumire",
  description: "descriere",
  deliverables: "livrabile",
  acceptance: "criterii de recepție",
  unit: "unitate de măsură",
  quantity: "cantitate",
  unitPrice: "preț unitar",
  discountType: "reducere",
  discountValue: "reducere",
  billing: "frecvență de facturare",
  periods: "număr de perioade",
  status: "stare",
  isPackage: "tip (pachet)",
  packageLineId: "apartenență la pachet",
  duration: "durată",
  conditions: "condiții",
};

function changedFields(c: LineChange): string {
  const labels = new Set(c.fields.map((f) => FIELD_LABELS[f] ?? String(f)));
  return [...labels].join(", ");
}

/** Valoarea totală și detaliul de calcul al unei linii, pentru coloanele înainte / după. */
function lineValue(l: OfferLine | null, lines: OfferLine[], m: (n: number) => string): string {
  if (!l) return "—";
  if (l.status === "included") return mut("inclus în pachet");
  const a = lineAmounts(l, lines);
  const detail = `${fmtQty(l.quantity)} ${g(l.unit)} × ${m(l.unitPrice)}${isRecurring(l) ? `, ${perUnit(l.billing)} × ${a.periods}` : ""}${a.discount > 0 ? `, reducere ${m(a.discount)}` : ""}`;
  return `<strong>${esc(m(a.total))}</strong><br>${mut(detail.trim())}`;
}

export function buildAmendment(input: AmendmentInput): string {
  if (!input.before) throw new Error("Actul adițional necesită configurația anterioară (before).");
  const { s, cfg, t, m } = ctxOf(input.snapshot);
  const tb = computeTotals(input.before.config);
  const changes = diffLines(input.before.config.lines, cfg.lines);
  const nr = g(input.doc.number);
  const c = input.contract;

  const out: string[] = [];
  out.push(h1(`Act adițional nr. ${nr || BLANK} la Contractul nr. ${(c && g(c.number)) || BLANK} din ${(c && fmtDay(c.date)) || BLANK}`));
  out.push(para(`Încheiat astăzi, ${esc(fmtDay(input.doc.date) || BLANK)}, între:`));
  out.push(partiesHtml(s));
  out.push(
    para(
      `Având în vedere ${contractRef(input)}, și în temeiul art. 23.2 din Contract (Contractul se modifică numai prin act adițional semnat de ambele Părți) și al art. 1270 din Codul civil (contractul valabil încheiat are putere de lege între părți și se poate modifica prin acordul lor), Părțile convin următoarele:`,
    ),
  );

  out.push(h2("Art. 1. Obiectul modificării"));
  out.push(para("Părțile convin modificarea serviciilor contractate, după cum urmează (+ adăugat, − eliminat, ~ modificat):"));
  if (changes.length) {
    const rows: Row[] = changes.map((ch) => {
      const l = (ch.after ?? ch.before) as OfferLine;
      const tip = ch.kind === "added" ? "+ adăugat" : ch.kind === "removed" ? `${MINUS} eliminat` : "~ modificat";
      return {
        cls: ch.kind === "added" ? "add" : ch.kind === "removed" ? "rem" : "chg",
        cells: [
          { h: esc(tip), cls: "tip" },
          `${esc(l.name)}${g(l.code) ? ` ${mut(`(${l.code})`)}` : ""}`,
          lineValue(ch.before, input.before.config.lines, m),
          lineValue(ch.after, cfg.lines, m),
          ch.kind === "changed" ? esc(changedFields(ch)) : "–",
        ],
      };
    });
    out.push(
      table(
        [{ h: "Tip", cls: "tip" }, { h: "Serviciu" }, { h: "Înainte" }, { h: "După" }, { h: "Câmpuri modificate" }],
        rows,
      ),
    );
  } else {
    out.push(para("<strong>Nu există diferențe între serviciile contractate anterior și cele din prezentul act adițional.</strong>", "warn"));
  }

  out.push(h2("Art. 2. Noua valoare contractuală"));
  const mk = (label: string, b: number, a: number, cls?: string): Row => ({
    cls,
    cells: [label, { h: esc(m(b)), cls: "r" }, { h: esc(m(a)), cls: "r" }, { h: esc(signed(a - b, m)), cls: "r" }],
  });
  const vt = (rate: number) => (rate > 0 ? `TVA ${fmtPct(rate)}` : "TVA");
  out.push(
    table(
      [{ h: "Element" }, { h: "Înainte", cls: "r" }, { h: "După", cls: "r" }, { h: "Diferență", cls: "r" }],
      [
        mk("Servicii cu plată unică (net)", tb.oneTime, t.oneTime),
        mk("Servicii recurente, pe perioada contractată (net)", tb.recurring, t.recurring),
        mk("Valoare netă", tb.net, t.net, "tot"),
        mk(vt(cfg.vatRate), tb.vat, t.vat),
        mk("Total de plată", tb.gross, t.gross, "tot"),
      ],
    ),
  );
  out.push(para(`Începând cu data intrării în vigoare a prezentului act adițional, valoarea contractuală netă este de <strong>${esc(m(t.net))}</strong> (anterior ${esc(m(tb.net))}).`));

  out.push(h2("Art. 3. Graficul de plată"));
  const schedChanged =
    JSON.stringify(input.before.config.stages) !== JSON.stringify(cfg.stages) ||
    JSON.stringify(input.before.config.installments) !== JSON.stringify(cfg.installments) ||
    tb.oneTime !== t.oneTime;
  if (schedChanged && cfg.installments.length) {
    out.push(para("Plata valorii cu plată unică se face după noul grafic:"));
    out.push(paymentTable(t.oneTime, cfg.installments, m));
  } else if (schedChanged) {
    out.push(para("Graficul de implementare și plată se modifică și se completează de Părți printr-o anexă separată."));
  } else {
    out.push(para("Graficul de implementare și plată rămâne neschimbat."));
  }

  out.push(h2("Art. 4. Celelalte prevederi"));
  out.push(para("Celelalte prevederi ale Contractului și ale Comenzii rămân neschimbate și se aplică în mod corespunzător."));
  out.push(h2("Art. 5. Intrarea în vigoare"));
  out.push(
    para(
      "Prezentul act adițional intră în vigoare la data semnării de către ambele Părți și face parte integrantă din Contract. Se încheie în 2 exemplare originale, câte unul pentru fiecare Parte, sau într-un singur exemplar electronic semnat de ambele Părți (art. 23.7 și 23.9 din Contract).",
    ),
  );
  out.push(signatures(s));
  return out.join("\n");
}

/* ------------------------------------------------------------------ 6. anexa de mentenanță */

export function buildMaintenanceAnnex(input: DossierInput): string {
  const { s, cfg, m } = ctxOf(input.snapshot);
  const no = annexNo(input, ANNEX_NUMBERS.maintenance);
  const rec = nodes(contractedLines(cfg.lines), (l) => isRecurring(l));
  if (!rec.length) {
    throw new Error("Nu există servicii recurente contractate: anexa de mentenanță nu se poate genera.");
  }

  const rows: Row[] = [];
  let monthly = 0;
  let yearly = 0;
  let total = 0;
  for (const n of rec) {
    const l = n.line;
    const a = lineAmounts(l, cfg.lines);
    if (l.billing === "monthly") monthly += a.net;
    else yearly += a.net;
    total += a.total;
    rows.push({
      cls: l.isPackage ? "grp" : undefined,
      cells: [
        `${nm(l)}${l.isPackage ? ` ${mut("(pachet)")}` : ""}${g(l.description) ? `<br>${esc(g(l.description))}` : ""}`,
        esc(BILLING_LABELS[l.billing]),
        { h: esc(m(a.net)), cls: "r" },
        { h: `${a.periods}`, cls: "c" },
        { h: esc(m(a.total)), cls: "r" },
      ],
    });
    for (const c of n.comps) {
      rows.push({
        cls: "sub",
        cells: [`${esc(c.name)}${g(c.description) ? `<br>${esc(g(c.description))}` : ""}`, { h: mut("inclus în pachet"), span: 4, cls: "r" }],
      });
    }
  }
  rows.push({ cls: "tot", cells: [{ h: "Total servicii recurente (net)", span: 4 }, { h: esc(m(total)), cls: "r" }] });

  const out: string[] = [annexHead(no, "Mentenanță și servicii recurente", input)];
  out.push(
    para(
      "Prezenta anexă cuprinde serviciile recurente contractate prin Comandă. Ea nu include serviciile opționale neacceptate și costurile achitate direct de Beneficiar.",
    ),
  );
  out.push(h2("Servicii recurente contractate"));
  out.push(
    table(
      [{ h: "Serviciu și descriere" }, { h: "Frecvență", cls: "nb" }, { h: "Sumă pe perioadă", cls: "r" }, { h: "Nr. perioade", cls: "c" }, { h: "Total", cls: "r" }],
      rows,
    ),
  );
  const per: string[] = [];
  if (monthly > 0) per.push(`${m(monthly)}/lună`);
  if (yearly > 0) per.push(`${m(yearly)}/an`);
  out.push(para(`Suma pe perioadă de facturare: <strong>${esc(per.join(" + "))}</strong>.`));

  out.push(h2("Condiții aplicabile"));
  out.push(
    ul([
      "<strong>Mentenanța (art. 13.5).</strong> Se prestează în limitele serviciilor contractate mai sus. Orele neconsumate nu se reportează. Timpii de răspuns sunt obiective de diligență, nu termene garantate, dacă Comanda nu prevede altfel. Prestatorul poate suspenda mentenanța pentru facturi neplătite.",
      "<strong>Facturarea (art. 5.4).</strong> Serviciile recurente se facturează lunar sau anual, în avans, la începutul fiecărei perioade. Perioadele începute nu se rambursează.",
      "<strong>Denunțarea (art. 19.5).</strong> Serviciile recurente pot fi denunțate de oricare Parte cu o notificare de 30 de zile, cu efect la sfârșitul perioadei de facturare în curs. Sumele plătite în avans nu se rambursează.",
      "<strong>Copiile de siguranță (art. 13.6).</strong> Prestatorul face copii de siguranță numai dacă acestea sunt incluse expres în serviciile de mai sus; altfel ele revin Beneficiarului.",
    ]),
  );
  out.push(signatures(s));
  return `<section class="annex">${out.join("\n")}</section>`;
}

/* ------------------------------------------------------------------ 7. centralizatorul */

export function buildSummary(input: DossierInput): string {
  const { cfg, t, m } = ctxOf(input.snapshot);
  const s = input.snapshot;
  const cols: Col[] = [
    { h: "Cod", cls: "nw" },
    { h: "Serviciu" },
    { h: "Frecvență", cls: "nb" },
    { h: "Cant.", cls: "r" },
    { h: "Pe perioadă", cls: "r" },
    { h: "Perioade", cls: "c" },
    { h: "Total", cls: "r" },
  ];
  const rows: Row[] = [];
  const lineRow = (l: OfferLine, sub: boolean, pkgName?: string): Row => {
    const a = lineAmounts(l, cfg.lines);
    const name = `${nm(l)}${pkgName ? `<br>${mut(`în pachetul: ${pkgName}`)}` : ""}`;
    if (l.status === "included") {
      return {
        cls: sub ? "sub" : undefined,
        cells: [esc(g(l.code) || "–"), name, esc(BILLING_LABELS[l.billing]), { h: esc(fmtQty(l.quantity)), cls: "r" }, { h: mut("inclus în pachet"), span: 3, cls: "r" }],
      };
    }
    return {
      cls: sub ? "sub" : l.isPackage ? "grp" : undefined,
      cells: [
        esc(g(l.code) || "–"),
        name + (l.isPackage ? ` ${mut("(pachet)")}` : ""),
        esc(BILLING_LABELS[l.billing]),
        { h: esc(fmtQty(l.quantity)), cls: "r" },
        { h: esc(m(a.net)), cls: "r" },
        { h: l.billing === "one_time" ? "–" : `${a.periods}`, cls: "c" },
        { h: esc(m(a.total)), cls: "r" },
      ],
    };
  };
  const group = (title: string, list: LineNode[], subtotal: number | null, subLabel: string, withComps = false): void => {
    if (!list.length) return;
    rows.push({ cls: "grp", cells: [{ h: esc(title), span: 7 }] });
    for (const n of list) {
      rows.push(lineRow(n.line, false));
      if (withComps) for (const c of n.comps) rows.push(lineRow(c, true));
    }
    rows.push({
      cls: "tot",
      cells: [{ h: esc(subLabel), span: 6 }, { h: subtotal === null ? "–" : esc(m(subtotal)), cls: "r" }],
    });
  };

  const oneTime = nodes(cfg.lines, (l) => l.status === "accepted" && !isRecurring(l));
  const recurring = nodes(cfg.lines, (l) => l.status === "accepted" && isRecurring(l));
  group("Servicii contractate – plată unică", oneTime, t.oneTime, "Subtotal plată unică (net)");
  group("Servicii contractate – recurente", recurring, t.recurring, "Subtotal recurent, pe perioada contractată (net)");

  const included = contractedLines(cfg.lines).filter((l) => l.status === "included");
  if (included.length) {
    rows.push({ cls: "grp", cells: [{ h: "Servicii incluse în pachete (fără cost separat)", span: 7 }] });
    for (const l of included) {
      const pkg = cfg.lines.find((p) => p.id === l.packageLineId);
      rows.push(lineRow(l, false, pkg ? esc(pkg.name) : undefined));
    }
    rows.push({ cls: "tot", cells: [{ h: "Subtotal incluse în pachete", span: 6 }, { h: esc(m(0)), cls: "r" }] });
  }
  group("Servicii opționale, neacceptate (informativ)", nodes(cfg.lines, (l) => l.status === "optional"), t.optional, "Subtotal opționale (nu intră în contract)", true);
  group("Costuri achitate direct de client (informativ)", nodes(cfg.lines, (l) => l.status === "client_direct"), t.clientDirect, "Subtotal costuri directe (nu intră în contract)");

  const out: string[] = [];
  out.push(para("CENTRALIZATOR", "kicker"));
  out.push(h1("Centralizator de servicii și costuri"));
  out.push(
    para(
      `<strong>${esc(g(s.client.clNume) || g(s.offer.title) || "client")}</strong> · Oferta nr. ${esc(g(s.offer.number) || BLANK)} · ${esc(fmtDay(input.doc.date) || BLANK)}`,
    ),
  );
  out.push(h2("Servicii și costuri pe stare"));
  out.push(table(cols, rows.length ? rows : [{ cells: [{ h: "Nu există servicii în configurație.", span: 7 }] }]));

  out.push(h2("Recapitulare"));
  out.push(
    table(
      [{ h: "Element" }, { h: "Valoare", cls: "r" }],
      [
        { cls: "tot", cells: ["Valoare contractuală netă", { h: esc(m(t.net)), cls: "r" }] },
        { cells: [cfg.vatRate > 0 ? `TVA ${esc(fmtPct(cfg.vatRate))}` : "TVA", { h: cfg.vatRate > 0 ? esc(m(t.vat)) : "Prețurile nu includ TVA", cls: "r" }] },
        { cls: "tot", cells: ["Total contract", { h: esc(m(t.gross)), cls: "r" }] },
        { cells: ["Servicii opționale (informativ)", { h: esc(m(t.optional)), cls: "r" }] },
        { cells: ["Costuri achitate direct de client (informativ)", { h: esc(m(t.clientDirect)), cls: "r" }] },
      ],
    ),
  );
  out.push(
    para(
      "Serviciile opționale neacceptate și costurile achitate direct de client sunt prezentate informativ și nu fac parte din valoarea contractuală.",
    ),
  );
  return out.join("\n");
}

/* ------------------------------------------------------------------ dispecer */

/** Corpul HTML al unui document din dosar (fără contract; acela folosește șablonul lui). */
export function buildDossierBody(type: DossierRenderType, input: DossierInput | AmendmentInput): string {
  switch (type) {
    case "offer":
      return buildOffer(input);
    case "services_annex":
      return buildServicesAnnex(input);
    case "schedule_annex":
      return buildScheduleAnnex(input);
    case "handover_pv":
      return buildHandoverPv(input);
    case "amendment":
      return buildAmendment(input as AmendmentInput);
    case "maintenance_annex":
      return buildMaintenanceAnnex(input);
    case "summary":
      return buildSummary(input);
  }
}
