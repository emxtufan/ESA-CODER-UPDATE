import { strToU8, zipSync } from "fflate";

export interface ReportColumn {
  key: string;
  label: string;
}
export type ReportRow = Record<string, string | number | null>;
export interface Report {
  columns: ReportColumn[];
  rows: ReportRow[];
}

/** O celulă care începe cu un operator ar fi rulată ca formulă de Excel: se neutralizează. */
function csvCell(value: string | number | null): string {
  if (value === null) return "";
  if (typeof value === "number") return String(value);
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export function toCsv({ columns, rows }: Report): string {
  const lines = [columns.map((c) => csvCell(c.label)).join(",")];
  for (const row of rows) lines.push(columns.map((c) => csvCell(row[c.key] ?? null)).join(","));
  // BOM: Excel recunoaște astfel diacriticele.
  return `﻿${lines.join("\r\n")}\r\n`;
}

const xmlText = (value: string) =>
  value
    // eslint-disable-next-line no-control-regex
    .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

function columnName(index: number): string {
  let name = "";
  for (let i = index + 1; i > 0; i = Math.floor((i - 1) / 26)) name = String.fromCharCode(65 + ((i - 1) % 26)) + name;
  return name;
}

function xlsxCell(value: string | number | null, col: number, row: number): string {
  const ref = `${columnName(col)}${row}`;
  if (value === null) return "";
  if (typeof value === "number") return `<c r="${ref}"><v>${value}</v></c>`;
  return `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${xmlText(value)}</t></is></c>`;
}

/** XLSX minimal: o foaie cu șiruri inline, deci valorile nu pot deveni formule. */
export function toXlsx({ columns, rows }: Report): Uint8Array {
  const xmlHead = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
  const header = `<row r="1">${columns.map((c, i) => xlsxCell(c.label, i, 1)).join("")}</row>`;
  const body = rows
    .map((row, r) => `<row r="${r + 2}">${columns.map((c, i) => xlsxCell(row[c.key] ?? null, i, r + 2)).join("")}</row>`)
    .join("");
  return zipSync({
    "[Content_Types].xml": strToU8(
      `${xmlHead}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>`,
    ),
    "_rels/.rels": strToU8(
      `${xmlHead}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
    ),
    "xl/workbook.xml": strToU8(
      `${xmlHead}<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Raport" sheetId="1" r:id="rId1"/></sheets></workbook>`,
    ),
    "xl/_rels/workbook.xml.rels": strToU8(
      `${xmlHead}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>`,
    ),
    "xl/worksheets/sheet1.xml": strToU8(
      `${xmlHead}<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${header}${body}</sheetData></worksheet>`,
    ),
  });
}
