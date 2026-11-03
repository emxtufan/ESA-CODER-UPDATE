/**
 * Șablon HTML pentru emailurile tranzacționale: tabele și stiluri inline, fără resurse
 * externe, ca să treacă de Gmail și Outlook. Cardul are 600px pe desktop și se strânge
 * la 100% pe mobil, iar toate textele primite din afară sunt escapate.
 */

export interface EmailBrand {
  name: string;
  legal?: string;
  address?: string;
  email?: string;
  phone?: string;
  web?: string;
}

export interface EmailLayoutInput {
  preheader: string;
  heading: string;
  /** HTML deja escapat. */
  body: string;
  button?: { label: string; url: string };
  note?: string;
  brand: EmailBrand;
}

const FONT = "-apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
const BG = "#f4f4f5";
const INK = "#111111";
const TEXT = "#3f3f46";
const MUTED = "#71717a";
const BORDER = "#e4e4e7";
const FOOTER_MUTED = "#a1a1aa";

/** Escapează textul pentru conținut HTML și pentru valori de atribut. */
export function escHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Tabel cheie/valoare, folosit pentru sumarul unei comenzi sau al unui cont. */
export function emailDetails(rows: [string, string][]): string {
  const body = rows
    .map(([key, value], index) => {
      const separator = index === rows.length - 1 ? "" : `border-bottom:1px solid ${BORDER};`;
      return (
        `<tr>` +
        `<td style="padding:10px 0;${separator}font-family:${FONT};font-size:13px;line-height:1.5;color:${MUTED};text-align:left;vertical-align:top;">${escHtml(key)}</td>` +
        `<td style="padding:10px 0;${separator}font-family:${FONT};font-size:14px;line-height:1.5;color:${INK};text-align:right;vertical-align:top;">${escHtml(value)}</td>` +
        `</tr>`
      );
    })
    .join("");

  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;border-collapse:collapse;margin:0 0 20px;">${body}</table>`;
}

/** Listă cu bullet, fără resurse externe (bullet-ul e text, nu imagine). */
export function emailList(items: string[]): string {
  const list = items
    .map(
      (item) =>
        `<tr>` +
        `<td style="padding:0 8px 8px 0;font-family:${FONT};font-size:15px;line-height:1.6;color:${TEXT};vertical-align:top;">•</td>` +
        `<td style="padding:0 0 8px;font-family:${FONT};font-size:15px;line-height:1.6;color:${TEXT};vertical-align:top;">${escHtml(item)}</td>` +
        `</tr>`,
    )
    .join("");

  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;border-collapse:collapse;margin:0 0 20px;">${list}</table>`;
}

/** Cod scurt (OTP) afișat mare, monospace, ca să fie citit ușor de pe telefon. */
export function emailCode(code: string): string {
  return (
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;border-collapse:separate;margin:0 0 20px;">` +
    `<tr><td align="center" bgcolor="${BG}" style="padding:20px 16px;background:${BG};border:1px solid ${BORDER};border-radius:10px;font-family:Consolas, Monaco, 'Courier New', monospace;font-size:32px;font-weight:700;letter-spacing:8px;line-height:1.2;color:${INK};text-align:center;">${escHtml(code)}</td></tr>` +
    `</table>`
  );
}

/** Șablonul complet: antet cu wordmark, conținut, buton opțional și subsol. */
export function emailLayout(input: EmailLayoutInput): string {
  const { brand } = input;

  const button = input.button
    ? [
        `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;margin:0 0 16px;">`,
        `<tr><td align="center" bgcolor="${INK}" style="border-radius:8px;background:${INK};">`,
        `<a href="${escHtml(input.button.url)}" target="_blank" rel="noopener" style="display:inline-block;padding:14px 28px;border-radius:8px;font-family:${FONT};font-size:15px;font-weight:600;line-height:1;color:#ffffff;text-decoration:none;">${escHtml(input.button.label)}</a>`,
        `</td></tr></table>`,
        `<p style="margin:0 0 6px;font-family:${FONT};font-size:13px;line-height:1.5;color:${MUTED};">Dacă butonul nu funcționează, copiați linkul:</p>`,
        `<p style="margin:0 0 20px;font-family:${FONT};font-size:12px;line-height:1.5;color:${MUTED};word-break:break-all;">`,
        `<a href="${escHtml(input.button.url)}" target="_blank" rel="noopener" style="color:${MUTED};text-decoration:underline;word-break:break-all;">${escHtml(input.button.url)}</a>`,
        `</p>`,
      ].join("")
    : "";

  const note = input.note
    ? `<p style="margin:20px 0 0;font-family:${FONT};font-size:13px;line-height:1.5;color:${MUTED};">${escHtml(input.note)}</p>`
    : "";

  const contacts: string[] = [];
  if (brand.email) {
    contacts.push(
      `<a href="mailto:${escHtml(brand.email)}" style="color:${FOOTER_MUTED};text-decoration:underline;">${escHtml(brand.email)}</a>`,
    );
  }
  if (brand.phone) contacts.push(escHtml(brand.phone));
  if (brand.web) {
    const webHref = /^https?:\/\//i.test(brand.web) ? brand.web : `https://${brand.web}`;
    contacts.push(
      `<a href="${escHtml(webHref)}" style="color:${FOOTER_MUTED};text-decoration:underline;">${escHtml(brand.web)}</a>`,
    );
  }

  const footerLines = [
    `<div style="margin:0 0 4px;font-size:12px;line-height:1.6;color:${FOOTER_MUTED};">${escHtml(brand.legal ?? brand.name)}</div>`,
    brand.address
      ? `<div style="margin:0 0 4px;font-size:12px;line-height:1.6;color:${FOOTER_MUTED};">${escHtml(brand.address)}</div>`
      : "",
    contacts.length
      ? `<div style="margin:0 0 4px;font-size:12px;line-height:1.6;color:${FOOTER_MUTED};">${contacts.join(`<span style="color:${FOOTER_MUTED};"> · </span>`)}</div>`
      : "",
    `<div style="margin:8px 0 0;font-size:12px;line-height:1.6;color:${FOOTER_MUTED};">Acest mesaj a fost trimis automat.</div>`,
  ].join("");

  return [
    `<!doctype html>`,
    `<html lang="ro">`,
    `<head>`,
    `<meta charset="utf-8">`,
    `<meta name="viewport" content="width=device-width, initial-scale=1">`,
    `<meta name="color-scheme" content="light">`,
    `<meta name="supported-color-schemes" content="light">`,
    `<title>${escHtml(input.heading)}</title>`,
    `<style>`,
    `@media only screen and (max-width:600px){`,
    `.email-card{padding:24px !important}`,
    `.email-footer{padding:20px 8px 0 !important}`,
    `}`,
    `</style>`,
    `</head>`,
    `<body style="margin:0;padding:0;background:${BG};">`,
    `<div style="display:none;max-height:0;max-width:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:${BG};opacity:0;">${escHtml(input.preheader)}</div>`,
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;border-collapse:collapse;background:${BG};">`,
    `<tr><td align="center" style="padding:32px 12px;">`,
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="width:600px;max-width:100%;border-collapse:separate;background:#ffffff;border-radius:12px;">`,
    `<tr><td class="email-card" style="padding:40px;">`,
    `<div style="font-family:${FONT};font-size:26px;font-weight:800;letter-spacing:-1px;line-height:1.1;color:${INK};">ESA</div>`,
    `<div style="margin:2px 0 0;font-family:${FONT};font-size:10px;font-weight:700;letter-spacing:3px;line-height:1.4;color:${INK};">CODER SOLUTIONS</div>`,
    `<div style="margin:16px 0 24px;border-top:2px solid ${INK};font-size:0;line-height:0;">&nbsp;</div>`,
    `<h1 style="margin:0 0 16px;font-family:${FONT};font-size:22px;font-weight:700;line-height:1.3;color:${INK};">${escHtml(input.heading)}</h1>`,
    `<div style="font-family:${FONT};font-size:15px;line-height:1.6;color:${TEXT};">${input.body}</div>`,
    button,
    note,
    `</td></tr>`,
    `</table>`,
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="width:600px;max-width:100%;border-collapse:collapse;">`,
    `<tr><td class="email-footer" align="center" style="padding:24px 12px 0;font-family:${FONT};text-align:center;">`,
    footerLines,
    `</td></tr>`,
    `</table>`,
    `</td></tr>`,
    `</table>`,
    `</body>`,
    `</html>`,
  ].join("");
}
