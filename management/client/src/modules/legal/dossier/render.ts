/**
 * Randarea documentelor din dosar în iframe-ul de previzualizare, exportul HTML static
 * (pentru serverul de PDF) și numele fișierelor.
 */
import { DOSSIER_DOC_LABELS, type DossierDocType } from "@shared/offers";
import { renderPages, type ImageSet } from "../contract/engine";
import pageCss from "../contract/page.css?raw";
import { buildDossierBody } from "./builders";
import dossierCss from "./dossier.css?raw";
import type { AmendmentInput, DossierInput, DossierRenderType } from "./types";

/** Scheletul documentului din iframe (`srcdoc`): `page.css` urmat de `dossier.css`. */
export const DOSSIER_SKELETON =
  '<!doctype html><html lang="ro"><head><meta charset="utf-8"><title>Document ESA</title><style>' +
  pageCss +
  dossierCss +
  '</style></head><body><div id="pages"></div></body></html>';

/** Titlul din antetul paginilor, per tip de document. */
export const HEADER_TITLES: Record<DossierDocType, string> = DOSSIER_DOC_LABELS;

/** Randează documentul `type` în `#pages` din `doc`, cu paginare, antet și footer ca ale contractului. */
export function renderDossierDoc(
  type: DossierRenderType,
  input: DossierInput | AmendmentInput,
  doc: Document,
  img: ImageSet,
): void {
  const body = buildDossierBody(type, input);
  const title = HEADER_TITLES[type];
  renderPages(doc, body, input.snapshot.provider, img, title);
  doc.title = fileName(type, input);
}

async function toDataUrl(src: string): Promise<string> {
  const blob = await (await fetch(src)).blob();
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

/**
 * HTML-ul static și complet paginat al documentului din iframe, cu imaginile ca data URL.
 * Se trimite la serverul de PDF (`POST /api/legal/pdf {html, filename}`), unde JS e dezactivat.
 */
export async function exportHtml(doc: Document): Promise<string> {
  const root = doc.documentElement.cloneNode(true) as HTMLElement;
  // Zoom-ul de încadrare în previzualizare nu trebuie să ajungă în PDF.
  const pages = root.querySelector<HTMLElement>("#pages");
  if (pages) pages.style.setProperty("--z", "1");
  for (const img of Array.from(root.querySelectorAll("img"))) {
    const src = img.getAttribute("src") ?? "";
    if (src && !src.startsWith("data:")) {
      try {
        img.setAttribute("src", await toDataUrl(new URL(src, doc.baseURI).href));
      } catch {
        // imaginea rămâne cu URL-ul inițial
      }
    }
  }
  return "<!doctype html>" + root.outerHTML;
}

const FILE_PREFIX: Record<DossierDocType, string> = {
  offer: "Oferta",
  contract: "Contract",
  services_annex: "Anexa_Servicii_Deviz",
  schedule_annex: "Anexa_Grafic",
  handover_pv: "PV_Predare_Primire",
  amendment: "Act_Aditional",
  maintenance_annex: "Anexa_Mentenanta",
  summary: "Centralizator",
};

/** Text fără diacritice și caractere speciale, cuvinte separate prin „_”. */
function slug(v: string, keep: RegExp = /[^A-Za-z0-9]+/g, sep = "_"): string {
  return v
    .normalize("NFD")
    .replace(/\p{M}+/gu, "")
    .replace(keep, sep)
    .replace(new RegExp(`${sep}+`, "g"), sep)
    .replace(new RegExp(`^${sep}|${sep}$`, "g"), "");
}

/** Numele fișierului fără extensie, ex. `Oferta_OF-2026-001_Gradinita_Georgi`. */
export function fileName(type: DossierDocType, input: DossierInput): string {
  const s = input.snapshot;
  const number =
    type === "offer"
      ? s.offer.number
      : (input.doc.number ?? "") || (input.contract?.number ?? "") || s.offer.number;
  const parts = [
    FILE_PREFIX[type],
    slug(number, /[^A-Za-z0-9-]+/g, "-"),
    slug(s.client.clNume || s.offer.title || "client"),
  ].filter(Boolean);
  return parts.join("_").slice(0, 120);
}
