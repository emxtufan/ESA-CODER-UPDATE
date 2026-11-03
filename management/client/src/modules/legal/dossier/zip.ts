/**
 * Pachetul ZIP al dosarului: `PDF/…`, `Word/…` și `configuratie-oferta.json`.
 * Numele din `files` includ folderul (ex. `PDF/Oferta_OF-2026-001_Client.pdf`).
 */
import { strToU8, zipSync, type Zippable } from "fflate";

export const ZIP_MIME = "application/zip";
export const CONFIG_FILE_NAME = "configuratie-oferta.json";

export function buildDossierZip(files: { name: string; data: Uint8Array }[], config: object): Uint8Array {
  const entries: Zippable = {};
  for (const f of files) {
    const name = f.name.replace(/\\/g, "/").replace(/^\/+/, "");
    if (!name || name.split("/").some((p) => p === ".." || p === "")) {
      throw new Error(`Nume de fișier invalid în arhivă: „${f.name}”.`);
    }
    if (name === CONFIG_FILE_NAME) throw new Error(`Numele „${CONFIG_FILE_NAME}” este rezervat configurației.`);
    if (name in entries) throw new Error(`Fișier duplicat în arhivă: „${name}”.`);
    // PDF și DOCX sunt deja comprimate.
    entries[name] = [f.data, { level: /\.(pdf|docx)$/i.test(name) ? 0 : 6 }];
  }
  entries[CONFIG_FILE_NAME] = strToU8(JSON.stringify(config, null, 2));
  return zipSync(entries);
}
