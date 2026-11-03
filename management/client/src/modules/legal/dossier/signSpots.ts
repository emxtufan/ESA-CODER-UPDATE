/**
 * Completează locurile de semnare (Semnătura / Data) din tabelele de semnături, adică tabelele
 * al căror antet (primul rând) conține BENEFICIAR: în toate coloanele lor, punctele de completat
 * devin textul semnării electronice (`Semnătura: electronică, art. 23.11`, `Data: conform certificatului`).
 */

type Rule = { re: RegExp; replace: string };

const RULES: Rule[] = [
  { re: /(Semnătura:\s*)[.…_\s]*[.…_]/g, replace: "$1electronică, art. 23.11" },
  { re: /(Data:\s*)[.…_\s]*[.…_]/g, replace: "$1conform certificatului" },
];

function textNodesIn(root: Node): Text[] {
  const out: Text[] = [];
  const walk = (node: Node) => {
    for (const child of Array.from(node.childNodes)) {
      if (child.nodeType === 3) out.push(child as Text);
      else if (child.nodeType === 1) walk(child);
    }
  };
  walk(root);
  return out;
}

/** Înlocuiește punctele de completat din nodul text; fără puncte nu se schimbă nimic (idempotent). */
function markTextNode(node: Text): void {
  for (const rule of RULES) node.data = node.data.replace(rule.re, rule.replace);
}

/** Marcajul de semnătură al beneficiarului: `<span data-sign-name="client">`. */
const SIGN_NAME = "client";

/** Un loc gol de completat: doar puncte, ellipsis sau underscore. */
const BLANK_SPOT = /^[.…_\s]+$/;

/** Punctele lipite de „Prin:” din același nod text devin `<span data-sign-name="client">`. */
function markTextSpot(node: Text): boolean {
  const doc = node.ownerDocument;
  const match = /Prin:(\s*)([.…_]+)/.exec(node.data);
  if (!doc || !match) return false;

  const dotEnd = match.index + match[0].length;
  node.splitText(dotEnd);
  const dots = node.splitText(dotEnd - match[2].length);

  const span = doc.createElement("span");
  span.setAttribute("data-sign-name", SIGN_NAME);
  span.textContent = dots.data;
  dots.parentNode?.replaceChild(span, dots);
  return true;
}

/** `<span class="b">…</span>` imediat următor lui „Prin:” devine `<span data-sign-name="client">` (înlocuit, nu imbricat). */
function markElementSpot(node: Text): boolean {
  const doc = node.ownerDocument;
  const next = node.nextSibling;
  if (!doc || !/Prin:\s*$/.test(node.data) || !next || next.nodeType !== 1) return false;

  const spot = next as Element;
  if (spot.tagName.toLowerCase() !== "span" || !spot.classList.contains("b")) return false;
  const dots = spot.textContent ?? "";
  if (!BLANK_SPOT.test(dots)) return false;

  const span = doc.createElement("span");
  span.setAttribute("data-sign-name", SIGN_NAME);
  span.textContent = dots;
  spot.parentNode?.replaceChild(span, spot);
  return true;
}

/** Doar coloana BENEFICIAR: locul gol de după „Prin:” primește marcajul de semnătură. */
function markBeneficiaryCell(cell: HTMLTableCellElement): void {
  if (cell.querySelector("[data-sign-name]")) return; // deja marcat

  for (const node of textNodesIn(cell)) {
    if (markTextSpot(node) || markElementSpot(node)) return;
  }
}

function markCell(cell: HTMLTableCellElement): void {
  for (const node of textNodesIn(cell)) markTextNode(node);
}

export function markSignSpots(doc: Document): void {
  for (const table of Array.from(doc.querySelectorAll("table"))) {
    const headerRow = table.rows[0];
    if (!headerRow) continue;

    const beneficiaryAt = Array.from(headerRow.cells).findIndex((c) =>
      (c.textContent ?? "").toUpperCase().includes("BENEFICIAR"),
    );
    if (beneficiaryAt < 0) continue;

    for (const row of Array.from(table.rows)) {
      if (row === headerRow) continue;
      for (const cell of Array.from(row.cells)) markCell(cell);

      const beneficiaryCell = row.cells.item(beneficiaryAt);
      if (beneficiaryCell) markBeneficiaryCell(beneficiaryCell);
    }
  }
}
