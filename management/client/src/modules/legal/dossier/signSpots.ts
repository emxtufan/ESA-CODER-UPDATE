/**
 * Marchează locurile de semnare (Semnătura / Data) din celula BENEFICIAR a tabelelor de semnături,
 * ca să poată fi completate ulterior (canvas de semnătură peste `<span data-sign="client">`).
 */

type Rule = { re: RegExp; attr: string; value: string };

const RULES: Rule[] = [
  { re: /(Semnătura:\s*)([.…_\s]*)/, attr: "data-sign", value: "client" },
  { re: /(Data:\s*)([.…_\s]*)/, attr: "data-sign-date", value: "client" },
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

/** Desparte nodul text în jurul potrivirii și pune marcajul într-un `<span>`; întoarce textul de după marcaj. */
function splitTextNode(doc: Document, node: Text, rule: Rule, m: RegExpExecArray): Text | null {
  const text = node.data;
  const before = text.slice(0, m.index);
  const after = text.slice(m.index + m[0].length);

  const span = doc.createElement("span");
  span.setAttribute(rule.attr, rule.value);
  span.textContent = m[2] || " ";

  const frag = doc.createDocumentFragment();
  if (before) frag.appendChild(doc.createTextNode(before));
  frag.appendChild(doc.createTextNode(m[1]));
  frag.appendChild(span);
  const afterNode = after ? doc.createTextNode(after) : null;
  if (afterNode) frag.appendChild(afterNode);

  node.replaceWith(frag);
  return afterNode;
}

function markTextNode(doc: Document, node: Text): void {
  let rest: Text | null = node;
  while (rest) {
    const text = rest.data;
    let best: { index: number; rule: Rule; match: RegExpExecArray } | null = null;
    for (const rule of RULES) {
      const m = rule.re.exec(text);
      if (m && (!best || m.index < best.index)) best = { index: m.index, rule, match: m };
    }
    if (!best) return;
    rest = splitTextNode(doc, rest, best.rule, best.match);
  }
}

function markCell(doc: Document, cell: HTMLTableCellElement): void {
  if (cell.querySelector("span[data-sign]")) return;
  for (const node of textNodesIn(cell)) markTextNode(doc, node);
}

export function markSignSpots(doc: Document): void {
  for (const table of Array.from(doc.querySelectorAll("table"))) {
    const headerRow = table.rows[0];
    if (!headerRow) continue;

    const col = Array.from(headerRow.cells).findIndex((c) =>
      (c.textContent ?? "").toUpperCase().includes("BENEFICIAR"),
    );
    if (col < 0) continue;

    for (const row of Array.from(table.rows)) {
      if (row === headerRow) continue;
      const cell = row.cells[col];
      if (!cell) continue;
      markCell(doc, cell);
    }
  }
}
