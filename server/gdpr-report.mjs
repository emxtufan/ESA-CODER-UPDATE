import {problem} from './gdpr-storage.mjs';

const sections = [
  ['operator', 'Operator configurat'], ['registry', 'Inventarul datelor'], ['policies', 'Politici de retenție'],
  ['operations', 'Ștergeri și verificări'], ['requests', 'Cereri GDPR'], ['backupSettings', 'Backup extern declarat'],
  ['backups', 'Copii locale și restaurare'], ['users', 'Controale de acces GDPR'], ['incidents', 'Incidente'],
  ['vendors', 'Servicii detectate'], ['vendorRecords', 'Furnizori documentați'], ['checks', 'Audit Readiness Check'],
  ['alerts', 'Alerte'], ['checkpoint', 'Checkpoint de integritate'], ['audit', 'Evenimente corelabile'],
];
const printable = v => typeof v === 'string' ? v : JSON.stringify(v ?? null, null, 2);
const escape = v => printable(v).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
export function auditCSV(report) {
  // Neutralize spreadsheet formula execution even for administrator-entered notes.
  const cell = v => '"' + printable(v).replace(/^[\s]*[=+@-]/, match => "'" + match).replaceAll('"', '""') + '"';
  const rows = [['Raport', report.reportId, report.generatedAt], ['Perioadă', report.period.from, report.period.to], ['Secțiune', 'Identificator', 'Date']];
  for (const [key, label] of sections) {
    const values = Array.isArray(report[key]) ? report[key] : [report[key]];
    if (!values.length) rows.push([label, '', 'Nu există înregistrări în intervalul selectat.']);
    values.forEach(value => rows.push([label, value?.id || '', value]));
  }
  return '\ufeff' + rows.map(row => row.map(cell).join(',')).join('\r\n');
}
export function auditHTML(report) {
  return `<!doctype html><html lang="ro"><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'"><title>Raport GDPR ${escape(report.reportId)}</title>
  <style>@page{size:A4;margin:18mm 16mm 20mm}body{font:11px/1.5 Arial,sans-serif;color:#172333}h1{font-size:25px}h2{font-size:17px;margin-top:28px;break-after:avoid}h3{font-size:12px;break-after:avoid}p{max-width:100%}.notice{background:#eef3fa;padding:14px;border-left:3px solid #4476c2}table{width:100%;border-collapse:collapse;table-layout:fixed;margin:8px 0 14px}td{vertical-align:top;border:1px solid #d7dfe9;padding:6px;white-space:pre-wrap;overflow-wrap:anywhere}td:first-child{width:25%;font-weight:bold}tr{break-inside:avoid}thead{display:table-header-group}.muted{color:#566477}footer{margin-top:24px;border-top:1px solid #ccd6e3;padding-top:10px}</style>
  <h1>Raport tehnic GDPR</h1><p>${escape(report.reportId)} · Generat: ${escape(report.generatedAt)}</p>
  <p>Perioada evenimentelor: ${escape(report.period.from)} – ${escape(report.period.to)}. Inventarul, politicile, accesul și verificările reflectă starea la generare.</p>
  <p class="notice">Raport documentar bazat pe registrul aplicației. PASS indică numai verificarea tehnică descrisă. Documentul nu este certificare GDPR. Declarațiile operaționale și juridice necesită documente și validare umană. Nu include datele personale ale solicitanților sau copia datelor șterse.</p>
  ${sections.map(([key, label]) => {
    const values = Array.isArray(report[key]) ? report[key] : [report[key]];
    return `<h2>${escape(label)}</h2>${values.length ? values.map(value => `<table><tbody>${Object.entries(value || {}).map(([k, v]) => `<tr><td>${escape(k)}</td><td>${escape(v)}</td></tr>`).join('')}</tbody></table>`).join('') : '<p class="muted">Nu există înregistrări pentru intervalul selectat. Lipsa înregistrărilor nu dovedește conformitatea.</p>'}`;
  }).join('')}
  <footer>GDPR: art. 5(2), 12–22, 24, 28, 30, 32–34. Păstrează raportul și checkpoint-ul într-un spațiu cu acces controlat, separat de server.</footer></html>`;
}
let rendering = false;
export async function auditPDF(report) {
  if (rendering) throw problem('Se generează deja un PDF. Reîncearcă în câteva momente.', 429);
  rendering = true;
  let browser;
  try {
    const {chromium} = await import('playwright');
    browser = await chromium.launch({headless: true, timeout: 15000});
    const page = await browser.newPage();
    await page.route('**/*', route => route.abort());
    await page.setContent(auditHTML(report), {waitUntil: 'domcontentloaded', timeout: 10000});
    return await page.pdf({format: 'A4', printBackground: true, timeout: 30000, displayHeaderFooter: true, headerTemplate: '<span></span>', footerTemplate: '<div style="font:9px Arial;width:100%;text-align:center;color:#555">ESA · Raport tehnic GDPR · <span class="pageNumber"></span> / <span class="totalPages"></span></div>'});
  } catch {
    throw problem('Generatorul PDF necesită Playwright și Chromium pe server. Exportul CSV/HTML rămâne disponibil; vezi GDPR_BACKUP_RECOVERY.md pentru instalarea mediului.', 503);
  } finally { if (browser) await browser.close(); rendering = false; }
}
