/**
 * Export Word (DOCX) din HTML-ul documentelor. Parserul HTML e propriu și acoperă doar
 * subsetul folosit de contract și de builder-e (h1, h2, p, ul, ol, table, strong, em, span,
 * br, section), ca să meargă identic în browser și în teste (fără DOM). Arhiva se scrie cu `fflate`.
 *
 * Clasele de evidențiere (`.f`, galben) nu apar în Word.
 */
import { strToU8, zipSync } from "fflate";
import type { ProviderValues } from "@shared/offers";
import { fill, subRows, type Values } from "../contract/engine";

export interface DocxOptions {
  /** Titlul documentului: apare în antet (dreapta) și în proprietățile fișierului. */
  title: string;
  provider: ProviderValues;
  /** Logo-ul ESA (PNG) pentru antet. */
  logoPng: Uint8Array;
}

export const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

/* ------------------------------------------------------------------ parser HTML minimal */

interface HNode {
  tag: string; // "#text" pentru text
  cls: string;
  attrs: Record<string, string>;
  children: HNode[];
  text: string;
}

const VOID = new Set(["br", "img", "hr", "meta", "link", "input"]);

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };

function decode(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e: string) => {
    if (e[0] === "#") {
      const cp = e[1].toLowerCase() === "x" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(cp) && cp > 0 && cp <= 0x10ffff ? String.fromCodePoint(cp) : m;
    }
    return ENTITIES[e.toLowerCase()] ?? m;
  });
}

export function parseHtml(html: string): HNode {
  const root: HNode = { tag: "#root", cls: "", attrs: {}, children: [], text: "" };
  const stack: HNode[] = [root];
  const re = /<!--[\s\S]*?-->|<\/([a-zA-Z][a-zA-Z0-9]*)\s*>|<([a-zA-Z][a-zA-Z0-9]*)((?:\s+[^\s=>/]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?)*)\s*(\/?)>|[^<]+|</g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const top = stack[stack.length - 1];
    if (m[0].startsWith("<!--")) continue;
    if (m[1]) {
      const tag = m[1].toLowerCase();
      for (let i = stack.length - 1; i > 0; i--) {
        if (stack[i].tag === tag) {
          stack.length = i;
          break;
        }
      }
    } else if (m[2]) {
      const tag = m[2].toLowerCase();
      const attrs: Record<string, string> = {};
      const ar = /([^\s=>/]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
      let a: RegExpExecArray | null;
      while ((a = ar.exec(m[3] || ""))) attrs[a[1].toLowerCase()] = decode(a[2] ?? a[3] ?? a[4] ?? "");
      const node: HNode = { tag, cls: attrs.class ?? "", attrs, children: [], text: "" };
      top.children.push(node);
      if (!VOID.has(tag) && !m[4]) stack.push(node);
    } else {
      top.children.push({ tag: "#text", cls: "", attrs: {}, children: [], text: decode(m[0]) });
    }
  }
  return root;
}

const hasCls = (n: HNode, c: string): boolean => n.cls.split(/\s+/).includes(c);

/* ------------------------------------------------------------------ XML */

const PROLOG = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
const NS_W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
const NS_R = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
const NS_PKG = "http://schemas.openxmlformats.org/package/2006/relationships";
const NS_WP = "http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing";
const NS_A = "http://schemas.openxmlformats.org/drawingml/2006/main";
const NS_PIC = "http://schemas.openxmlformats.org/drawingml/2006/picture";

/** Escape XML + eliminarea caracterelor invalide. */
function x(s: string): string {
  let out = "";
  for (const ch of s) {
    const n = ch.codePointAt(0) as number;
    if (n === 9 || n === 10 || n === 13 || (n >= 32 && n <= 0xd7ff) || (n >= 0xe000 && n <= 0xfffd) || n >= 0x10000) out += ch;
  }
  return out.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** Lățimea utilă: A4 (11906) minus 2 × 22 mm (1247). */
const PAGE_W = 11906;
const MARGIN_X = 1247;
const TEXT_W = PAGE_W - 2 * MARGIN_X;

/* ------------------------------------------------------------------ conversie HTML → WordprocessingML */

interface Fmt {
  b?: boolean;
  i?: boolean;
  sz?: number;
  color?: string;
  strike?: boolean;
}

type Item = { t: "text"; text: string; fmt: Fmt } | { t: "br" };

interface State {
  /** Definițiile `w:num` pentru listele numerotate. */
  nums: string[];
  nextNum: number;
  /** Următorul bloc începe pe pagină nouă (h2.brk, începutul unei anexe). */
  pendingBreak: boolean;
  emitted: number;
}

const INLINE = new Set(["strong", "b", "em", "i", "s", "del", "span", "a", "small", "u", "br", "img", "code", "sup", "sub", "font", "#text"]);

function collect(nodes: HNode[], fmt: Fmt, out: Item[]): void {
  for (const n of nodes) {
    if (n.tag === "#text") {
      out.push({ t: "text", text: n.text.replace(/[\s ]+/g, (w) => (w.includes(" ") ? " " : " ")), fmt });
    } else if (n.tag === "br") {
      out.push({ t: "br" });
    } else if (n.tag === "img") {
      continue;
    } else {
      const f: Fmt = { ...fmt };
      if (n.tag === "strong" || n.tag === "b") f.b = true;
      if (n.tag === "em" || n.tag === "i") f.i = true;
      if (n.tag === "s" || n.tag === "del") {
        f.strike = true;
        f.color = "C62828";
      }
      if (n.tag === "small" || hasCls(n, "mut")) {
        f.sz = 17;
        f.color = "555555";
      }
      collect(n.children, f, out);
    }
  }
}

function runXml(text: string, fmt: Fmt): string {
  const pr = (fmt.b ? "<w:b/><w:bCs/>" : "") + (fmt.i ? "<w:i/><w:iCs/>" : "") + (fmt.strike ? "<w:strike/>" : "") + (fmt.color ? `<w:color w:val="${fmt.color}"/>` : "") + (fmt.sz ? `<w:sz w:val="${fmt.sz}"/><w:szCs w:val="${fmt.sz}"/>` : "");
  return `<w:r>${pr ? `<w:rPr>${pr}</w:rPr>` : ""}<w:t xml:space="preserve">${x(text)}</w:t></w:r>`;
}

/** Rulourile unui paragraf din nodurile inline, cu spațiile normalizate. */
function runsOf(nodes: HNode[], fmt: Fmt = {}): string {
  const items: Item[] = [];
  collect(nodes, fmt, items);
  // normalizare: fără spații duble, fără spații la capete și în jurul <br>
  let prevSpace = true;
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    if (it.t === "br") {
      prevSpace = true;
      continue;
    }
    let tx = it.text;
    if (prevSpace) tx = tx.replace(/^ +/, "");
    prevSpace = tx.endsWith(" ") || tx === "";
    it.text = tx;
  }
  for (let i = items.length - 1; i >= 0; i--) {
    const it = items[i];
    if (it.t === "br") continue;
    it.text = it.text.replace(/ +$/, "");
    if (it.text) break;
  }
  // spațiul de dinaintea unui <br>
  for (let i = 0; i < items.length - 1; i++) {
    const it = items[i];
    if (it.t === "text" && items[i + 1].t === "br") it.text = it.text.replace(/ +$/, "");
  }
  return items.map((it) => (it.t === "br" ? "<w:r><w:br/></w:r>" : it.text ? runXml(it.text, it.fmt) : "")).join("");
}

const hasContent = (runs: string): boolean => runs.replace(/<w:r><w:br\/><\/w:r>/g, "").length > 0;

interface ParaOpts {
  style?: string;
  jc?: "left" | "center" | "right" | "both";
  ppr?: string;
  fmt?: Fmt;
  num?: { id: number; lvl: number };
  /** Păstrează paragraful chiar dacă e gol (celule de tabel). */
  keepEmpty?: boolean;
}

function paraXml(st: State, nodes: HNode[], o: ParaOpts = {}): string {
  const runs = runsOf(nodes, o.fmt ?? {});
  if (!hasContent(runs) && !o.keepEmpty) return "";
  let ppr = "";
  if (o.style) ppr += `<w:pStyle w:val="${o.style}"/>`;
  if (st.pendingBreak && st.emitted > 0 && !o.keepEmpty) ppr += "<w:pageBreakBefore/>";
  if (!o.keepEmpty) st.pendingBreak = false;
  if (o.num) ppr += `<w:numPr><w:ilvl w:val="${o.num.lvl}"/><w:numId w:val="${o.num.id}"/></w:numPr>`;
  if (o.ppr) ppr += o.ppr;
  if (o.jc) ppr += `<w:jc w:val="${o.jc}"/>`;
  if (!o.keepEmpty) st.emitted++;
  return `<w:p>${ppr ? `<w:pPr>${ppr}</w:pPr>` : ""}${runs}</w:p>`;
}

function listXml(st: State, list: HNode, lvl: number): string {
  const ordered = list.tag === "ol";
  let numId = 1;
  if (ordered) {
    numId = st.nextNum++;
    const kind = (list.attrs.type ?? "1") === "a" ? 3 : 2;
    const start = parseInt(list.attrs.start ?? "1", 10) || 1;
    st.nums.push(`<w:num w:numId="${numId}"><w:abstractNumId w:val="${kind}"/><w:lvlOverride w:ilvl="0"><w:startOverride w:val="${start}"/></w:lvlOverride></w:num>`);
  }
  let out = "";
  for (const li of list.children.filter((c) => c.tag === "li")) {
    const inline: HNode[] = [];
    const nested: HNode[] = [];
    for (const c of li.children) (c.tag === "ul" || c.tag === "ol" ? nested : inline).push(c);
    out += paraXml(st, inline, { style: "ListParagraph", num: { id: numId, lvl: Math.min(lvl, 2) }, jc: "both" });
    for (const nl of nested) out += listXml(st, nl, lvl + 1);
  }
  return out;
}

function textLen(n: HNode): number {
  return n.tag === "#text" ? n.text.trim().length : n.children.reduce((a, c) => a + textLen(c), 0);
}

function tableXml(st: State, tbl: HNode): string {
  const rowsN: HNode[] = [];
  const headRows = new Set<HNode>();
  const walk = (n: HNode, inHead: boolean): void => {
    for (const c of n.children) {
      if (c.tag === "tr") {
        rowsN.push(c);
        if (inHead) headRows.add(c);
      } else if (c.tag === "thead" || c.tag === "tbody" || c.tag === "tfoot") walk(c, c.tag === "thead");
    }
  };
  walk(tbl, false);
  if (!rowsN.length) return "";

  const cellsOf = (tr: HNode): HNode[] => tr.children.filter((c) => c.tag === "td" || c.tag === "th");
  const span = (c: HNode): number => Math.max(1, parseInt(c.attrs.colspan ?? "1", 10) || 1);
  const cols = Math.max(1, ...rowsN.map((r) => cellsOf(r).reduce((a, c) => a + span(c), 0)));

  // lățimile coloanelor: proporționale cu lungimea medie a textului (limitată)
  const sums = new Array<number>(cols).fill(0);
  const cnt = new Array<number>(cols).fill(0);
  for (const r of rowsN) {
    let ci = 0;
    for (const c of cellsOf(r)) {
      if (span(c) === 1) {
        sums[ci] += Math.min(60, textLen(c));
        cnt[ci]++;
      }
      ci += span(c);
    }
  }
  const weights = sums.map((s, i) => Math.max(8, Math.min(40, cnt[i] ? s / cnt[i] : 12)));
  const wsum = weights.reduce((a, b) => a + b, 0);
  const minW = 560;
  let widths = weights.map((w) => Math.max(minW, Math.floor((w / wsum) * TEXT_W)));
  const over = widths.reduce((a, b) => a + b, 0) - TEXT_W;
  if (over !== 0) {
    const bi = widths.indexOf(Math.max(...widths));
    widths[bi] -= over;
  }
  widths = widths.map((w) => Math.max(minW, w));

  const border = ["top", "left", "bottom", "right", "insideH", "insideV"].map((k) => `<w:${k} w:val="single" w:sz="4" w:space="0" w:color="999999"/>`).join("");
  const isSig = hasCls(tbl, "sig");
  let out = `<w:tbl><w:tblPr><w:tblW w:w="${TEXT_W}" w:type="dxa"/><w:tblBorders>${border}</w:tblBorders><w:tblLayout w:type="fixed"/><w:tblCellMar><w:top w:w="40" w:type="dxa"/><w:left w:w="110" w:type="dxa"/><w:bottom w:w="40" w:type="dxa"/><w:right w:w="110" w:type="dxa"/></w:tblCellMar></w:tblPr><w:tblGrid>${widths.map((w) => `<w:gridCol w:w="${w}"/>`).join("")}</w:tblGrid>`;

  for (const tr of rowsN) {
    const head = headRows.has(tr);
    const bold = head || hasCls(tr, "grp") || hasCls(tr, "tot");
    const shade = head || hasCls(tr, "grp") || hasCls(tr, "tot");
    const italic = hasCls(tr, "rem");
    let row = `<w:tr><w:trPr><w:cantSplit/>${isSig ? '<w:trHeight w:val="1500" w:hRule="atLeast"/>' : ""}${head ? "<w:tblHeader/>" : ""}</w:trPr>`;
    let ci = 0;
    for (const c of cellsOf(tr)) {
      const sp = span(c);
      const w = widths.slice(ci, ci + sp).reduce((a, b) => a + b, 0);
      const isTh = c.tag === "th";
      const jc = hasCls(c, "r") ? "right" : hasCls(c, "c") ? "center" : "left";
      const fmt: Fmt = { b: bold || isTh || hasCls(c, "tip") || undefined, i: italic || undefined };
      const indent = hasCls(tr, "sub") && ci === 0 ? '<w:ind w:left="220"/>' : "";
      const pOpts: ParaOpts = { style: "TableText", jc, fmt, ppr: indent, keepEmpty: true };
      const inner = cellFlow(st, c.children, pOpts);
      row += `<w:tc><w:tcPr><w:tcW w:w="${w}" w:type="dxa"/>${sp > 1 ? `<w:gridSpan w:val="${sp}"/>` : ""}${shade || isTh ? '<w:shd w:val="clear" w:color="auto" w:fill="F3F3F3"/>' : ""}</w:tcPr>${inner || `<w:p><w:pPr><w:pStyle w:val="TableText"/></w:pPr></w:p>`}</w:tc>`;
      ci += sp;
    }
    row += "</w:tr>";
    out += row;
  }
  out += "</w:tbl>";
  st.emitted++;
  // Word cere un paragraf după tabel; unul mic evită lipirea tabelelor consecutive.
  return out + '<w:p><w:pPr><w:pStyle w:val="TableText"/><w:spacing w:before="0" w:after="60"/></w:pPr></w:p>';
}

/** Conținutul unei celule: paragrafe pentru inline-uri sau blocuri. */
function cellFlow(st: State, nodes: HNode[], base: ParaOpts): string {
  const savedBreak = st.pendingBreak;
  st.pendingBreak = false;
  let out = "";
  let buf: HNode[] = [];
  const flush = (): void => {
    if (buf.length) out += paraXml(st, buf, { ...base, keepEmpty: false });
    buf = [];
  };
  for (const n of nodes) {
    if (INLINE.has(n.tag)) buf.push(n);
    else if (n.tag === "p" || n.tag === "div") {
      flush();
      out += paraXml(st, n.children, { ...base, keepEmpty: false });
    } else if (n.tag === "ul" || n.tag === "ol") {
      flush();
      out += listXml(st, n, 0);
    } else buf.push(n);
  }
  flush();
  st.pendingBreak = savedBreak;
  return out;
}

/** Fluxul de blocuri al corpului. */
function flow(st: State, nodes: HNode[]): string {
  let out = "";
  let buf: HNode[] = [];
  let prevTag = "";
  const flush = (): void => {
    if (buf.length) out += paraXml(st, buf);
    buf = [];
  };
  for (const n of nodes) {
    if (n.tag === "#text" && !n.text.trim()) continue;
    if (INLINE.has(n.tag)) {
      buf.push(n);
      continue;
    }
    flush();
    switch (n.tag) {
      case "h1":
        out += paraXml(st, n.children, { style: "Title", jc: "center" });
        break;
      case "h2":
      case "h3":
      case "h4":
        if (hasCls(n, "brk")) st.pendingBreak = true;
        out += paraXml(st, n.children, { style: "Heading2" });
        break;
      case "p": {
        const o: ParaOpts = {};
        if (hasCls(n, "kicker")) {
          o.style = "Kicker";
          o.jc = "center";
        } else if (hasCls(n, "big")) {
          o.style = "Big";
        } else if (hasCls(n, "warn")) {
          o.ppr = '<w:pBdr><w:top w:val="single" w:sz="12" w:space="3" w:color="111111"/><w:left w:val="single" w:sz="12" w:space="4" w:color="111111"/><w:bottom w:val="single" w:sz="12" w:space="3" w:color="111111"/><w:right w:val="single" w:sz="12" w:space="4" w:color="111111"/></w:pBdr>';
          o.fmt = { b: true };
          o.jc = "left";
        } else if (hasCls(n, "ctr") || prevTag === "h1" || hasCls(n, "mut")) {
          o.jc = hasCls(n, "mut") ? undefined : "center";
          if (hasCls(n, "mut")) o.fmt = { sz: 17, color: "555555" };
        }
        out += paraXml(st, n.children, o);
        break;
      }
      case "ul":
      case "ol":
        out += listXml(st, n, 0);
        break;
      case "table":
        out += tableXml(st, n);
        break;
      case "section":
        if (hasCls(n, "annex")) st.pendingBreak = true;
        out += flow(st, n.children);
        break;
      case "hr":
        break;
      default:
        out += flow(st, n.children);
    }
    prevTag = n.tag;
  }
  flush();
  return out;
}

/* ------------------------------------------------------------------ părțile pachetului */

function pngSize(b: Uint8Array): { w: number; h: number } {
  const sig = b.length > 24 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47;
  if (!sig) return { w: 4, h: 1 };
  const dv = new DataView(b.buffer, b.byteOffset, b.byteLength);
  return { w: dv.getUint32(16), h: dv.getUint32(20) || 1 };
}

function rels(items: [string, string, string][]): string {
  return `${PROLOG}<Relationships xmlns="${NS_PKG}">${items.map(([id, ty, to]) => `<Relationship Id="${id}" Type="${ty}" Target="${to}"/>`).join("")}</Relationships>`;
}

function stylesXml(): string {
  const font = '<w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:eastAsia="Calibri" w:cs="Calibri"/>';
  const style = (id: string, name: string, ppr: string, rpr: string, extra = ""): string =>
    `<w:style w:type="paragraph" w:styleId="${id}"${id === "Normal" ? ' w:default="1"' : ""}><w:name w:val="${name}"/>${id === "Normal" ? "" : '<w:basedOn w:val="Normal"/>'}${extra}<w:qFormat/><w:pPr>${ppr}</w:pPr><w:rPr>${rpr}</w:rPr></w:style>`;
  return (
    `${PROLOG}<w:styles xmlns:w="${NS_W}"><w:docDefaults><w:rPrDefault><w:rPr>${font}<w:sz w:val="21"/><w:szCs w:val="21"/><w:lang w:val="ro-RO" w:eastAsia="ro-RO" w:bidi="ar-SA"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="100" w:line="276" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>` +
    style("Normal", "Normal", '<w:spacing w:after="100" w:line="276" w:lineRule="auto"/><w:jc w:val="both"/>', `${font}<w:sz w:val="21"/><w:szCs w:val="21"/>`) +
    style("Title", "Title", '<w:keepNext/><w:spacing w:before="60" w:after="120"/><w:jc w:val="center"/><w:outlineLvl w:val="0"/>', '<w:b/><w:bCs/><w:sz w:val="32"/><w:szCs w:val="32"/>') +
    style("Heading1", "heading 1", '<w:keepNext/><w:spacing w:before="240" w:after="80"/><w:jc w:val="left"/><w:outlineLvl w:val="0"/>', '<w:b/><w:bCs/><w:sz w:val="28"/><w:szCs w:val="28"/>') +
    style("Heading2", "heading 2", '<w:keepNext/><w:spacing w:before="220" w:after="70"/><w:jc w:val="left"/><w:outlineLvl w:val="1"/>', '<w:b/><w:bCs/><w:sz w:val="25"/><w:szCs w:val="25"/>') +
    style("Kicker", "Kicker", '<w:spacing w:after="40"/><w:jc w:val="center"/>', '<w:color w:val="555555"/><w:spacing w:val="40"/><w:sz w:val="18"/><w:szCs w:val="18"/>') +
    style("Big", "Valoare mare", '<w:spacing w:before="20" w:after="40"/><w:jc w:val="left"/>', '<w:b/><w:bCs/><w:sz w:val="44"/><w:szCs w:val="44"/>') +
    style("ListParagraph", "List Paragraph", '<w:spacing w:after="50"/><w:ind w:left="720"/>', "") +
    style("TableText", "Text tabel", '<w:spacing w:before="0" w:after="0" w:line="252" w:lineRule="auto"/><w:jc w:val="left"/>', '<w:sz w:val="19"/><w:szCs w:val="19"/>') +
    style("HeaderText", "Antet", '<w:spacing w:after="0"/><w:jc w:val="left"/>', '<w:color w:val="555555"/><w:sz w:val="16"/><w:szCs w:val="16"/>') +
    style("FooterText", "Subsol", '<w:spacing w:after="0" w:line="240" w:lineRule="auto"/><w:jc w:val="left"/>', '<w:color w:val="555555"/><w:sz w:val="14"/><w:szCs w:val="14"/>') +
    "</w:styles>"
  );
}

function numberingXml(extra: string[]): string {
  const lvl = (i: number, fmt: string, text: string, left: number): string =>
    `<w:lvl w:ilvl="${i}"><w:start w:val="1"/><w:numFmt w:val="${fmt}"/><w:lvlText w:val="${text}"/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="${left}" w:hanging="360"/></w:pPr></w:lvl>`;
  const abs = (id: number, fmt: string, texts: string[]): string =>
    `<w:abstractNum w:abstractNumId="${id}"><w:multiLevelType w:val="hybridMultilevel"/>${texts.map((t, i) => lvl(i, fmt, t, 720 + i * 360)).join("")}</w:abstractNum>`;
  return (
    `${PROLOG}<w:numbering xmlns:w="${NS_W}">` +
    abs(1, "bullet", ["•", "–", "•"]) +
    abs(2, "decimal", ["%1.", "%2.", "%3."]) +
    abs(3, "lowerLetter", ["%1)", "%2)", "%3)"]) +
    '<w:num w:numId="1"><w:abstractNumId w:val="1"/></w:num>' +
    extra.join("") +
    "</w:numbering>"
  );
}

function headerXml(title: string, logo: Uint8Array): string {
  const { w, h } = pngSize(logo);
  const cy = 414000; // 1,15 cm
  const cx = Math.round((cy * w) / h);
  const drawing =
    `<w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${cx}" cy="${cy}"/><wp:docPr id="1" name="Logo ESA" descr="ESA Coder Solutions"/>` +
    `<a:graphic xmlns:a="${NS_A}"><a:graphicData uri="${NS_PIC}"><pic:pic xmlns:pic="${NS_PIC}"><pic:nvPicPr><pic:cNvPr id="0" name="logo.png"/><pic:cNvPicPr/></pic:nvPicPr>` +
    `<pic:blipFill><a:blip r:embed="rIdLogo"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing>`;
  return (
    `${PROLOG}<w:hdr xmlns:w="${NS_W}" xmlns:r="${NS_R}" xmlns:wp="${NS_WP}"><w:p><w:pPr><w:pStyle w:val="HeaderText"/><w:pBdr><w:bottom w:val="single" w:sz="8" w:space="4" w:color="111111"/></w:pBdr><w:tabs><w:tab w:val="right" w:pos="${TEXT_W}"/></w:tabs></w:pPr>` +
    `<w:r>${drawing}</w:r><w:r><w:tab/></w:r>${runXml(title, {})}</w:p></w:hdr>`
  );
}

function footerXml(p: ProviderValues): string {
  const val = (v: string | undefined): string => (v ?? "").trim();
  const site = val(p.esaSite).replace(/^https?:\/\//, "").replace(/\/$/, "");
  const idLine = [val(p.esaCui) && `CUI ${val(p.esaCui)}`, val(p.esaRc) && `Reg. Com. ${val(p.esaRc)}`].filter(Boolean).join("  ·  ");
  const contact = [val(p.esaEmail), val(p.esaTel), site].filter(Boolean).join("  ·  ");
  const line = (text: string, extra = ""): string =>
    text ? `<w:p><w:pPr><w:pStyle w:val="FooterText"/>${extra}</w:pPr>${runXml(text, {})}</w:p>` : "";
  const fld = (instr: string): string => `<w:fldSimple w:instr=" ${instr} ">${runXml("1", { b: true })}</w:fldSimple>`;
  const first =
    `<w:p><w:pPr><w:pStyle w:val="FooterText"/><w:pBdr><w:top w:val="single" w:sz="12" w:space="4" w:color="111111"/></w:pBdr><w:tabs><w:tab w:val="right" w:pos="${TEXT_W}"/></w:tabs></w:pPr>` +
    `${runXml(val(p.esaNume) || val(p.esaMarca), { b: true, color: "111111", sz: 16 })}<w:r><w:tab/></w:r>${runXml("Pagina ", { sz: 16 })}${fld("PAGE")}${runXml(" / ", { sz: 16 })}${fld("NUMPAGES")}</w:p>`;
  return `${PROLOG}<w:ftr xmlns:w="${NS_W}">${first}${line(idLine)}${line(val(p.esaAdresa))}${line(contact)}</w:ftr>`;
}

/**
 * Transformă corpul HTML al unui document într-un fișier DOCX valid: A4, Calibri 10,5 pt
 * justificat, antet cu logo, footer cu datele prestatorului și „Pagina X / Y”.
 */
export function htmlToDocx(bodyHtml: string, opts: DocxOptions): Uint8Array {
  const st: State = { nums: [], nextNum: 10, pendingBreak: false, emitted: 0 };
  const body = flow(st, parseHtml(bodyHtml).children);
  const sect =
    `<w:sectPr><w:headerReference w:type="default" r:id="rHeader"/><w:footerReference w:type="default" r:id="rFooter"/>` +
    `<w:pgSz w:w="${PAGE_W}" w:h="16838"/><w:pgMar w:top="1814" w:right="${MARGIN_X}" w:bottom="1700" w:left="${MARGIN_X}" w:header="540" w:footer="400" w:gutter="0"/></w:sectPr>`;
  const document = `${PROLOG}<w:document xmlns:w="${NS_W}" xmlns:r="${NS_R}"><w:body>${body}${sect}</w:body></w:document>`;
  const ct =
    `${PROLOG}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/>` +
    [
      ["document", "document.main"],
      ["styles", "styles"],
      ["numbering", "numbering"],
      ["header1", "header"],
      ["footer1", "footer"],
    ]
      .map(([part, ty]) => `<Override PartName="/word/${part}.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.${ty}+xml"/>`)
      .join("") +
    '<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/></Types>';
  const core =
    `${PROLOG}<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">` +
    `<dc:title>${x(opts.title)}</dc:title><dc:creator>${x(opts.provider.esaMarca || opts.provider.esaNume || "ESA")}</dc:creator><dcterms:created xsi:type="dcterms:W3CDTF">${new Date().toISOString()}</dcterms:created></cp:coreProperties>`;

  return zipSync({
    "[Content_Types].xml": strToU8(ct),
    "_rels/.rels": strToU8(
      rels([
        ["rDoc", `${NS_R}/officeDocument`, "word/document.xml"],
        ["rCore", `${NS_PKG}/metadata/core-properties`, "docProps/core.xml"],
      ]),
    ),
    "docProps/core.xml": strToU8(core),
    "word/document.xml": strToU8(document),
    "word/_rels/document.xml.rels": strToU8(
      rels([
        ["rStyles", `${NS_R}/styles`, "styles.xml"],
        ["rNum", `${NS_R}/numbering`, "numbering.xml"],
        ["rHeader", `${NS_R}/header`, "header1.xml"],
        ["rFooter", `${NS_R}/footer`, "footer1.xml"],
      ]),
    ),
    "word/styles.xml": strToU8(stylesXml()),
    "word/numbering.xml": strToU8(numberingXml(st.nums)),
    "word/header1.xml": strToU8(headerXml(opts.title, opts.logoPng)),
    "word/_rels/header1.xml.rels": strToU8(rels([["rIdLogo", `${NS_R}/image`, "media/logo.png"]])),
    "word/footer1.xml": strToU8(footerXml(opts.provider)),
    "word/media/logo.png": [opts.logoPng, { level: 0 }],
  });
}

/**
 * HTML-ul completat al contractului-cadru, pregătit pentru `htmlToDocx`: șablonul cu valorile
 * înlocuite (`fill`), fără anexele nebifate și cu tabelul subîmputerniciților completat,
 * ca în `render` din motor.
 */
export function contractBodyHtml(V: Values, template: string): string {
  let html = fill(template, V);
  for (const n of [1, 2, 3]) {
    if (!V["inc" + n]) html = html.replace(new RegExp(`<section class="annex" data-annex="${n}">[\\s\\S]*?</section>`), "");
  }
  return html.replace(
    /<tbody>\s*<tr class="odd">\s*<td>SUB<\/td>\s*<td>SUB<\/td>\s*<td>SUB<\/td>\s*<\/tr>\s*<\/tbody>/,
    () => `<tbody>${subRows(V)}</tbody>`,
  );
}
