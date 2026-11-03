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

function markCell(cell: HTMLTableCellElement): void {
  for (const node of textNodesIn(cell)) markTextNode(node);
}

export function markSignSpots(doc: Document): void {
  for (const table of Array.from(doc.querySelectorAll("table"))) {
    const headerRow = table.rows[0];
    if (!headerRow) continue;

    const hasBeneficiary = Array.from(headerRow.cells).some((c) =>
      (c.textContent ?? "").toUpperCase().includes("BENEFICIAR"),
    );
    if (!hasBeneficiary) continue;

    for (const row of Array.from(table.rows)) {
      if (row === headerRow) continue;
      for (const cell of Array.from(row.cells)) markCell(cell);
    }
  }
}
