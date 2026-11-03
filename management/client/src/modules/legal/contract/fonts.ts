/**
 * Fontul documentelor: Carlito (aceleași dimensiuni ca Calibri), inclus în HTML ca data URL.
 *
 * Paginarea se măsoară în browserul utilizatorului, iar PDF-ul se randează pe server din HTML-ul
 * exportat (`exportHtml`). Cu fontul inclus în document, ambele folosesc exact același font, deci
 * rândurile se rup la fel și textul nu ajunge peste footer, oricare ar fi fonturile instalate.
 * Doar subseturile latin și latin-ext (diacriticele românești), regular și bold: ~225 KB.
 */
import latin400 from "@fontsource/carlito/files/carlito-latin-400-normal.woff2?inline";
import latin700 from "@fontsource/carlito/files/carlito-latin-700-normal.woff2?inline";
import latinExt400 from "@fontsource/carlito/files/carlito-latin-ext-400-normal.woff2?inline";
import latinExt700 from "@fontsource/carlito/files/carlito-latin-ext-700-normal.woff2?inline";

/** Numele familiei, primul în `font-family` din `page.css`. */
export const DOC_FONT = "Carlito";

/** Intervalele Unicode ale subseturilor, ca în `@fontsource/carlito`. */
const LATIN =
  "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD";
const LATIN_EXT =
  "U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF";

const face = (weight: number, src: string, range: string): string =>
  `@font-face{font-family:"${DOC_FONT}";font-style:normal;font-weight:${weight};font-display:block;src:url(${src}) format("woff2");unicode-range:${range}}`;

/** Regulile `@font-face`, puse în `<style>` înaintea `page.css`. */
export const FONT_CSS =
  face(400, latin400, LATIN) + face(700, latin700, LATIN) + face(400, latinExt400, LATIN_EXT) + face(700, latinExt700, LATIN_EXT) + "\n";

/** Text care atinge ambele subseturi, ca `fonts.load` să le încarce pe toate. */
const SAMPLE = "Aa ĂăÂâÎîȘșȚț";
const TIMEOUT_MS = 3000;

/**
 * Așteaptă fontul în documentul dat. Paginarea măsoară textul, deci trebuie să ruleze după ce
 * fontul e încărcat; altfel s-ar măsura cu fontul de rezervă. Nu blochează mai mult de 3 s.
 */
export async function docFontsReady(doc: Document): Promise<void> {
  const fonts = doc.fonts;
  if (!fonts) return;
  const load = Promise.all([
    fonts.load(`400 10.5pt "${DOC_FONT}"`, SAMPLE),
    fonts.load(`700 10.5pt "${DOC_FONT}"`, SAMPLE),
  ]).then(
    () => undefined,
    () => undefined,
  );
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<void>((resolve) => {
    timer = setTimeout(resolve, TIMEOUT_MS);
  });
  await Promise.race([load, timeout]);
  clearTimeout(timer);
}
