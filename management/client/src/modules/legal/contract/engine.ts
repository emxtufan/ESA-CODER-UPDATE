/**
 * Motorul contractului-cadru ESA, portat 1:1 din „Generator contract ESA.html”:
 * valorile calculate, completarea șablonului, antet/footer și paginarea pe pagini A4.
 * Logica e neschimbată; diferența e că valorile `V` și documentul în care se lucrează
 * (iframe-ul de previzualizare) vin ca parametri, nu din globale.
 */

/** Valorile formularului: cheie → text (checkbox-urile sunt `"1"` sau `""`). */
export type Values = Record<string, string>;

/** Imaginile din antet și footer (URL-uri sau data URL-uri). */
export interface ImageSet {
  logo: string;
  mail: string;
  phone: string;
  web: string;
}

type Computed = Record<string, { t: string; filled: boolean; raw?: boolean }>;

/* ---------- calcule ---------- */
const U = ["zero","una","două","trei","patru","cinci","șase","șapte","opt","nouă","zece","unsprezece","douăsprezece","treisprezece","paisprezece","cincisprezece","șaisprezece","șaptesprezece","optsprezece","nouăsprezece"];
const T: Record<number, string> = {2:"douăzeci",3:"treizeci",4:"patruzeci",5:"cincizeci",6:"șaizeci",7:"șaptezeci",8:"optzeci",9:"nouăzeci"};

export function words(n: number): string {
  n = Math.floor(n);
  if (n < 0 || n > 99 || isNaN(n)) return "";
  if (n < 20) return U[n];
  const t = Math.floor(n / 10), u = n % 10;
  return T[t] + (u ? " și " + U[u] : "");
}

const num = (v: unknown): number | null => {
  const n = parseFloat(String(v).replace(",", "."));
  return isNaN(n) ? null : n;
};

export const fmtDate = (s: string): string => {
  if (!s) return "";
  const p = s.split("-");
  return p.length === 3 ? p[2] + "." + p[1] + "." + p[0] : s;
};

export const fmtNum = (n: number): string => n.toLocaleString("ro-RO", { maximumFractionDigits: 2 });

export const zile = (n: number): string => (n === 1 ? "1 zi" : n >= 20 ? n + " de zile" : n + " zile");

export function compute(V: Values): Computed {
  const C: Computed = {};
  const set = (k: string, t: string, filled = true, raw = false) => { C[k] = raw ? { t, filled, raw } : { t, filled }; };
  const g = (k: string) => (V[k] || "").trim();
  ["nr","clNume","clSediu","clRc","clCui","clIban","clBanca","clEmail","clTel","clRep","clFunctie","esaNume","esaCui","esaRc","esaAdresa","esaIban","esaBanca","esaEmail","esaTel","esaSite","esaRep","esaFunctie","cmdNr","proiect","livrabile","tehnologii","plati","derog","a3Date","a3Pers","spec","etape","accesib","regim","cod","terti","mentenanta","confidential","datePers","tip"].forEach((k) => { if (g(k)) set(k, g(k)); });
  /* livrabile: fiecare linie nevidă devine un rând numerotat în tabelul din Anexa 1 */
  const liv = (V.livrabile || "").split("\n").map((s) => s.trim()).filter(Boolean);
  set("livrabile_rows", (liv.length ? liv : ["—"]).map((l, i) => "<tr><td>" + (i + 1) + '</td><td><span class="f">' + esc(l) + "</span></td></tr>").join(""), true, true);
  set("data", fmtDate(g("data")), !!g("data"));
  if (!g("data")) delete C.data;
  if (g("cmdData")) set("cmdData", fmtDate(g("cmdData")));
  const a = num(V.avans); set("avans", a === null ? "50" : fmtNum(a));
  const c = num(V.comision); set("comision", c === null ? "10" : fmtNum(c));
  const p = num(V.penalitate); set("penalitate", p === null ? "0,1" : String(V.penalitate).trim().replace(".", ","));
  const comp = num(V.compensatie); set("compensatie", comp === null ? "30" : fmtNum(comp));
  const tp = Math.round(num(V.termenPlata) || 5); set("termenPlata", tp + " (" + words(tp) + ")");
  const rv = Math.round(num(V.revizii) || 2); set("revizii", rv + " (" + words(rv) + ")"); set("reviziiN", String(rv));
  const gv = num(V.garantie);
  const gr = Math.round(gv === null ? 30 : gv); set("garantieTxt", zile(gr));
  const ns = num(V.nesol); set("nesol", ns === null ? "10.000" : fmtNum(ns));
  const to = num(V.tarifOrar); set("tarif55", to ? "de " + fmtNum(to) + " lei/oră + TVA" : "comunicat în scris Beneficiarului");
  if (to) set("tarifTbl", fmtNum(to) + " lei/oră + TVA");
  const pr = num(V.pret); if (pr) set("pretTxt", fmtNum(pr) + " " + (V.moneda || "euro"));
  if (g("esaRep") || g("clRep")) {
    const bits: string[] = [];
    bits.push("Prestator: " + (g("esaRep") || "……………………") + (g("esaTel") ? ", " + g("esaTel") : ""));
    bits.push("Beneficiar: " + (g("clRep") || "……………………") + (g("clTel") ? ", " + g("clTel") : ""));
    if (g("clRep")) set("contacte", bits.join("; "));
  }
  return C;
}

export const esc = (s: unknown): string =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>");

const DOT = (n: number): string => "…".repeat(n);
const LEN: Record<string, number> = { clNume: 22, clSediu: 30, clRc: 12, clCui: 10, clIban: 14, clBanca: 12, clEmail: 14, clTel: 12, clRep: 14, clFunctie: 12, esaIban: 14, esaBanca: 12 };

/**
 * Înlocuiește `{{cheie}}` / `{{cheie~text}}` din șablon cu valorile completate.
 * Cheile marcate `raw` (ex. `livrabile_rows`) se inserează ca HTML, nu ca text escapat.
 */
export function fill(html: string, V: Values): string {
  const C = compute(V);
  return html.replace(/\{\{(\w+)(?:~([^}]*))?\}\}/g, (_m, k: string, fb: string | undefined) => {
    if (C[k] && C[k].filled !== false) return C[k].raw ? C[k].t : '<span class="f">' + esc(C[k].t) + "</span>";
    if (fb !== undefined) return fb;
    return '<span class="b">' + DOT(LEN[k] || 10) + "</span>";
  });
}

/** Rândurile tabelului de subîmputerniciți (Anexa 3). */
export function subRows(V: Values): string {
  const lines = (V.a3Sub || "").split("\n").map((s) => s.trim()).filter(Boolean);
  const row = (a: string, b: string, c: string, f?: boolean) =>
    "<tr><td>" + (f ? '<span class="f">' + esc(a) + "</span>" : a) + "</td><td>" + (f ? '<span class="f">' + esc(b) + "</span>" : b) + "</td><td>" + (f ? '<span class="f">' + esc(c) + "</span>" : c) + "</td></tr>";
  if (!lines.length) return row(DOT(12), DOT(12), DOT(12)) + row(DOT(12), DOT(12), DOT(12));
  return lines.map((l) => { const p = l.split("|").map((s) => s.trim()); return row(p[0] || "", p[1] || "", p[2] || "", true); }).join("");
}

/** Titlul implicit din antet: cel al contractului-cadru. */
export const CONTRACT_HEADER_TITLE = "Contract-cadru de prestări servicii web design și dezvoltare software";

export function hdrHTML(img: ImageSet, title: string = CONTRACT_HEADER_TITLE): string {
  return '<div class="hdr"><img src="' + img.logo + '" alt="ESA Coder Solutions"><span>' + esc(title) + "</span></div>";
}

export function ftrHTML(V: Values, img: ImageSet, i: number, n: number): string {
  const g = (k: string) => V[k] || "";
  const site = g("esaSite").replace(/^https?:\/\//, "").replace(/\/$/, "");
  const adr = g("esaAdresa").replace(/^București, Sector 6, /, "Bd. ").replace("Bulevardul ", "");
  return '<div class="ftr"><div><b class="n">' + esc(g("esaNume")) + "</b><br><b>CUI</b> " + esc(g("esaCui")) + " &nbsp;·&nbsp; <b>Reg. Com.</b> " + esc(g("esaRc")) + "<br>" + esc(adr) + "</div>"
    + '<div class="mid"><div><img src="' + img.mail + '" alt=""><span>' + esc(g("esaEmail")) + '</span></div><div><img src="' + img.phone + '" alt=""><span>' + esc(g("esaTel")) + '</span></div><div><img src="' + img.web + '" alt=""><span>' + esc(site) + "</span></div></div>"
    + '<div class="pn">PAGINA<b>' + i + " <i>/ " + n + "</i></b></div></div>";
}

/* ---- paginare: fiecare pagină A4 e construită explicit, ca antetul/footerul să fie identice la print ---- */

/** Elementul ascuns de măsurare (`.pc.meas`), creat o dată per document. */
function getMeas(doc: Document): HTMLElement {
  let meas = doc.querySelector<HTMLElement>(".pc.meas");
  if (!meas) {
    meas = doc.createElement("div");
    meas.className = "pc meas";
    doc.body.appendChild(meas);
  }
  return meas;
}

export function limitPx(doc: Document): number {
  const t = doc.createElement("div");
  t.style.cssText = "position:absolute;visibility:hidden;height:230mm;width:1px";
  doc.body.appendChild(t);
  const h = t.offsetHeight;
  t.remove();
  return h;
}

const endsLabel = (el: Element) => el.tagName === "P" && /:\s*$/.test((el.textContent || "").trim());

export function keepNext(el: Element): boolean {
  return /^H[1-3]$/.test(el.tagName) || endsLabel(el) || (el.tagName === "P" && !!el.nextElementSibling && el.nextElementSibling.tagName === "TABLE" && (el.textContent || "").length < 160);
}

/**
 * Sparge un `<tr>` prea înalt în două. Fiecare celulă e citită ca o listă de „linii” (copiii bloc
 * sau segmentele separate de `<br>` (și din interiorul wrapper-elor inline, fiecare segment cu
 * wrapper-ul lui clonat; textul simplu e o singură linie). `tr` primește câte linii
 * încap, măsurat cu `fits` — deci trebuie să fie deja atașat în `.pc.meas` —, iar restul liniilor
 * se mută într-un rând clonat, cu celulele epuizate goale și fără `rowspan`.
 * Întoarce `[tr, rest]`, cu `rest = null` când nu s-a putut sparge (rândul încape întreg sau nu
 * încape nici măcar prima linie).
 */
export function splitRow(tr: HTMLElement, fits: () => boolean): [HTMLElement, HTMLElement | null] {
  const doc = tr.ownerDocument;
  const block = /^(P|DIV|UL|OL|TABLE|H[1-6]|LI|BLOCKQUOTE|PRE|SECTION|ARTICLE|DL|HEADER|FOOTER|FIGURE)$/;
  const linesOf = (cell: HTMLElement): { lines: Node[][]; br: boolean } => {
    const els = [...cell.children] as HTMLElement[];
    if (els.length && els.every((e) => block.test(e.tagName))) return { lines: els.map((e) => [e]), br: false };
    /* Conținutul se împarte în segmente la fiecare `<br>`, inclusiv înăuntrul wrapper-elor inline
       (span.f etc.): fiecare segment primește o clonă goală a wrapper-ului din care provine. */
    const out: Node[][] = [[]];
    let br = false;
    let holder: HTMLElement | null = null;
    let holderChain: Node[] | null = null;
    const put = (n: Node, chain: Node[] | null) => {
      if (holder && holderChain === chain) {
        holder.appendChild(n);
        return;
      }
      const line = out[out.length - 1];
      if (!chain) {
        holder = null;
        holderChain = null;
        line.push(n);
        return;
      }
      const root = (chain[0] as Element).cloneNode(false) as HTMLElement;
      let inner = root;
      for (let i = 1; i < chain.length; i++) {
        const c = (chain[i] as Element).cloneNode(false) as HTMLElement;
        inner.appendChild(c);
        inner = c;
      }
      line.push(root);
      holder = inner;
      holderChain = chain;
      holder.appendChild(n);
    };
    function walk(parent: Node, chain: Node[] | null) {
      for (const n of [...parent.childNodes]) {
        const el = n.nodeType === 1 ? (n as Element) : null;
        if (el && el.tagName === "BR") {
          br = true;
          out.push([]);
          holder = null;
          holderChain = null;
          continue;
        }
        if (el && !block.test(el.tagName) && el.querySelector("br")) {
          walk(el, chain ? chain.concat([el]) : [el]);
          continue;
        }
        put(n, chain);
      }
    }
    walk(cell, null);
    while (out.length > 1 && !out[out.length - 1].length) out.pop();
    return { lines: out, br };
  };
  const move = (cell: HTMLElement, lines: Node[][], from: number, br: boolean) => {
    for (let k = from; k < lines.length; k++) {
      if (br && k > from) cell.appendChild(doc.createElement("br"));
      lines[k].forEach((n) => cell.appendChild(n));
    }
  };
  const cells = [...tr.children] as HTMLElement[];
  const info = cells.map(linesOf);
  const rest = tr.cloneNode(true) as HTMLElement;
  const restCells = [...rest.children] as HTMLElement[];
  restCells.forEach((c) => { c.removeAttribute("rowspan"); c.textContent = ""; });
  cells.forEach((c) => { c.textContent = ""; });
  const total = info.reduce((n, x) => Math.max(n, x.lines.length), 0);
  let cut: { cell: number; rest: Node[] } | null = null;
  /* Un segment de text care nu încape nici pe pagina goală se taie pe cuvinte: căutare binară pe numărul
     de cuvinte care încap (măsurat cu `fits`), iar restul pleacă în rândul de continuare, în același wrapper. */
  const cutWords = (): { cell: number; rest: Node[] } | null => {
    const hasBlock = (nodes: Node[]): boolean =>
      nodes.some((n) => {
        if (n.nodeType !== 1) return false;
        const el = n as Element;
        return block.test(el.tagName) || [...el.querySelectorAll("*")].some((c) => block.test(c.tagName));
      });
    const wordStarts = (t: string): number[] => {
      const re = /\S+/g;
      const starts: number[] = [];
      let m: RegExpExecArray | null = null;
      while ((m = re.exec(t))) starts.push(m.index);
      return starts;
    };
    /* Taie o clonă a conținutului la `off` caractere: întoarce [început, rest], ambele cu wrapper-ele intacte. */
    const cutAt = (src: Node[], off: number): [Node[], Node[]] => {
      const tmp = doc.createElement("div");
      src.forEach((n) => tmp.appendChild(n.cloneNode(true)));
      const texts: Text[] = [];
      const collect = (n: Node) => n.childNodes.forEach((c) => { if (c.nodeType === 3) texts.push(c as Text); else collect(c); });
      collect(tmp);
      let at: Text | null = null;
      let local = 0;
      let acc = 0;
      for (const t of texts) {
        const len = (t.data || "").length;
        if (off <= acc + len) { at = t; local = off - acc; break; }
        acc += len;
      }
      if (!at) return [[...tmp.childNodes], []];
      const r = doc.createRange();
      r.setStart(tmp, 0);
      r.setEnd(at, local);
      const head = [...r.cloneContents().childNodes];
      r.setStart(at, local);
      r.setEnd(tmp, tmp.childNodes.length);
      return [head, [...r.cloneContents().childNodes]];
    };
    let ci = -1;
    let text = "";
    info.forEach((x, i) => {
      const line = x.lines[0];
      if (!line.length || hasBlock(line)) return;
      const t = line.map((n) => n.textContent || "").join("");
      if (t.trim().length > text.trim().length) { ci = i; text = t; }
    });
    if (ci < 0) return null;
    const starts = wordStarts(text);
    if (starts.length < 2) {
      console.warn("paginate: cuvânt forțat peste limită", text.slice(0, 40));
      return null;
    }
    const src = [...cells[ci].childNodes];
    const place = (m: number): Node[] => {
      const [head, tail] = cutAt(src, starts[m]);
      cells[ci].textContent = "";
      head.forEach((n) => cells[ci].appendChild(n));
      return tail;
    };
    let lo = 1;
    let hi = starts.length - 1;
    let ok = 0;
    let tail: Node[] = [];
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      const restOf = place(mid);
      if (fits()) { ok = mid; tail = restOf; lo = mid + 1; } else hi = mid - 1;
    }
    if (!ok) {
      console.warn("paginate: text forțat peste limită", text.slice(0, 40));
      cells[ci].textContent = "";
      src.forEach((n) => cells[ci].appendChild(n));
      return null;
    }
    place(ok);
    return { cell: ci, rest: tail };
  };
  let placed = 0;
  for (let k = 0; k < total; k++) {
    const undo: [HTMLElement, Node[]][] = [];
    info.forEach((x, ci) => {
      if (k >= x.lines.length) return;
      const ns: Node[] = [];
      if (x.br && k > 0) ns.push(doc.createElement("br"));
      x.lines[k].forEach((n) => ns.push(n));
      ns.forEach((n) => cells[ci].appendChild(n));
      undo.push([cells[ci], ns]);
    });
    if (fits()) { placed = k + 1; continue; }
    if (k === 0) cut = cutWords();
    if (cut) break;
    undo.forEach(([c, ns]) => ns.forEach((n) => c.removeChild(n)));
    break;
  }
  if (!placed && !cut) {
    cells.forEach((c) => { c.textContent = ""; });
    info.forEach((x, ci) => move(cells[ci], x.lines, 0, x.br));
    return [tr, null];
  }
  if (cut) {
    const { cell: bi, rest: tail } = cut;
    info.forEach((x, ci) => {
      const target = restCells[ci];
      if (ci === bi) tail.forEach((n) => target.appendChild(n));
      for (let k = 1; k < x.lines.length; k++) {
        if (x.br) target.appendChild(doc.createElement("br"));
        x.lines[k].forEach((n) => target.appendChild(n));
      }
    });
    return [tr, rest];
  }
  if (placed === total) return [tr, null];
  info.forEach((x, ci) => move(restCells[ci], x.lines, placed, x.br));
  return [tr, rest];
}

export function splitUnits(box: Element): HTMLElement[] {
  const u: HTMLElement[] = [];
  ([...box.children] as HTMLElement[]).forEach((c) => {
    if (c.classList.contains("annex")) {
      ([...c.children] as HTMLElement[]).forEach((g, i) => { if (i === 0) g.dataset.force = "1"; u.push(g); });
    } else {
      if (c.classList.contains("brk")) c.dataset.force = "1";
      u.push(c);
    }
  });
  return u;
}

export function paginate(box: Element, doc: Document): HTMLElement[][] {
  const meas = getMeas(doc);
  const LIM = limitPx(doc);
  const pagesEl = doc.getElementById("pages");
  const oldZ = pagesEl ? pagesEl.style.getPropertyValue("--z") : "";
  if (pagesEl) pagesEl.style.setProperty("--z", "1");
  const pages: HTMLElement[][] = [];
  let nodes: HTMLElement[] = [];
  meas.innerHTML = "";
  const fits = () => meas.offsetHeight <= LIM;
  function flush(carry: boolean) {
    const moved: HTMLElement[] = [];
    if (carry) while (nodes.length > 1 && keepNext(nodes[nodes.length - 1])) { moved.unshift(nodes.pop() as HTMLElement); }
    pages.push(nodes); nodes = []; meas.innerHTML = "";
    moved.forEach((n) => { meas.appendChild(n); nodes.push(n); });
  }
  function put(n: HTMLElement): boolean {
    meas.appendChild(n);
    if (fits()) { nodes.push(n); return true; }
    meas.removeChild(n);
    return false;
  }
  function putSplit(u: HTMLElement, kind: "table" | "list") {
    let items: HTMLElement[];
    let mk: () => [HTMLElement, HTMLElement];
    if (kind === "table") {
      const tb = u.querySelector("tbody") as HTMLElement;
      items = [...tb.children] as HTMLElement[];
      mk = () => {
        const t = u.cloneNode(false) as HTMLElement;
        const th = u.querySelector("thead");
        if (th) t.appendChild(th.cloneNode(true));
        const b = doc.createElement("tbody");
        t.appendChild(b);
        return [t, b];
      };
    } else {
      items = [...u.children] as HTMLElement[];
      const idx = 0;
      mk = () => {
        const t = u.cloneNode(false) as HTMLElement;
        if (u.tagName === "OL") (t as HTMLOListElement).start = parseInt(u.getAttribute("start") || "1", 10) + idx;
        return [t, t];
      };
    }
    let [shell, body] = mk();
    let placed = 0;
    const attach = () => { meas.appendChild(shell); };
    attach();
    let i = 0;
    while (i < items.length) {
      body.appendChild(items[i]);
      if (fits()) { placed++; i++; continue; }
      body.removeChild(items[i]);
      if (placed === 0) {
        if (nodes.length) { meas.removeChild(shell); flush(true); [shell, body] = mk(); attach(); continue; }
        const row = items[i];
        if (row.tagName === "TR") {
          body.appendChild(row);
          const [, tail] = splitRow(row, fits);
          if (tail) { nodes.push(shell); flush(false); items[i] = tail; [shell, body] = mk(); attach(); continue; }
          if (fits()) { placed++; i++; continue; }
        } else {
          attach(); body.appendChild(row);
        }
        console.warn("paginate: bloc forțat peste limită", row.tagName, meas.offsetHeight);
        placed++; i++;
        continue;
      }
      nodes.push(shell); flush(false);
      if (kind !== "table" && u.tagName === "OL") {
        shell = u.cloneNode(false) as HTMLElement;
        (shell as HTMLOListElement).start = parseInt(u.getAttribute("start") || "1", 10) + i;
        body = shell;
      } else { [shell, body] = mk(); }
      placed = 0; attach();
    }
    if (placed) nodes.push(shell); else meas.removeChild(shell);
  }
  splitUnits(box).forEach((u) => {
    if (u.dataset && u.dataset.force && nodes.length) flush(false);
    if (put(u)) return;
    const tag = u.tagName;
    if (tag === "TABLE" && u.querySelectorAll("tbody>tr").length > 0) { putSplit(u, "table"); return; }
    if ((tag === "UL" || tag === "OL") && u.children.length > 1) { putSplit(u, "list"); return; }
    if (nodes.length) { flush(true); if (put(u)) return; }
    meas.appendChild(u); nodes.push(u);
    console.warn("paginate: bloc forțat peste limită", u.tagName, meas.offsetHeight);
  });
  if (nodes.length) pages.push(nodes);
  meas.innerHTML = "";
  if (pagesEl) {
    if (oldZ) pagesEl.style.setProperty("--z", oldZ);
    else pagesEl.style.removeProperty("--z");
  }
  return pages;
}

/** Zoom-ul de încadrare a paginilor în lățimea documentului (`--z` pe `#pages`). */
export function fit(doc: Document): void {
  const pagesEl = doc.getElementById("pages");
  if (!pagesEl) return;
  const cs = doc.defaultView ? doc.defaultView.getComputedStyle(doc.body) : null;
  const pad = cs ? parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight) : 0;
  const w = doc.documentElement.clientWidth - 8 - (isNaN(pad) ? 0 : pad);
  const pw = 210 * 96 / 25.4;
  pagesEl.style.setProperty("--z", String(Math.min(1, w / pw)));
}

/** Paginează conținutul din `box` și scrie paginile A4 (antet, conținut, footer) în `#pages`. */
function buildPages(doc: Document, box: HTMLElement, V: Values, img: ImageSet, headerTitle?: string): void {
  const pagesEl = doc.getElementById("pages");
  if (!pagesEl) return;
  const pages = paginate(box, doc);
  const N = pages.length;
  pagesEl.innerHTML = "";
  pages.forEach((nodes, i) => {
    const pg = doc.createElement("section");
    pg.className = "pg";
    pg.innerHTML = hdrHTML(img, headerTitle);
    const pc = doc.createElement("div");
    pc.className = "pc";
    nodes.forEach((n) => pc.appendChild(n));
    pg.appendChild(pc);
    pg.insertAdjacentHTML("beforeend", ftrHTML(V, img, i + 1, N));
    pagesEl.appendChild(pg);
  });
}

/**
 * Randează un document generic (HTML deja completat, fără `{{}}`) în `#pages`, cu aceeași
 * paginare, același antet și același footer ca ale contractului. Footer-ul folosește
 * valorile `esa*` ale prestatorului.
 */
export function renderPages(doc: Document, bodyHtml: string, provider: Values | object, img: ImageSet, headerTitle: string): void {
  const pagesEl = doc.getElementById("pages");
  if (!pagesEl) return;
  const box = doc.createElement("div");
  box.innerHTML = bodyHtml;
  buildPages(doc, box, { ...(provider as Values) }, img, headerTitle);
  fit(doc);
}

/** Opțiuni de randare: titlul din antet (implicit cel al contractului). */
export interface RenderOptions {
  headerTitle?: string;
}

/** Construiește paginile contractului în `#pages` din `doc`. */
export function render(V: Values, doc: Document, tpl: string, img: ImageSet, opts?: RenderOptions): void {
  const pagesEl = doc.getElementById("pages");
  if (!pagesEl) return;
  const box = doc.createElement("div");
  box.innerHTML = fill(tpl, V);
  [1, 2, 3].forEach((n) => {
    if (!V["inc" + n]) { const s = box.querySelector('.annex[data-annex="' + n + '"]'); if (s) s.remove(); }
  });
  box.querySelectorAll("table").forEach((t) => {
    const th = t.querySelector("th");
    if (th && (th.textContent || "").trim() === "Subîmputernicit") { const tb = t.querySelector("tbody"); if (tb) tb.innerHTML = subRows(V); }
  });
  box.querySelectorAll("tr").forEach((r) => { if ((r.textContent || "").trim() === "SUB") r.remove(); });
  buildPages(doc, box, V, img, opts && opts.headerTitle);
  doc.title = "Contract ESA - " + (V.clNume || "client") + (V.nr ? " - " + V.nr.replace(/[\/\\]/g, "-") : "");
  fit(doc);
}
