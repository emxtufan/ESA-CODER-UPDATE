import express from 'express';
import {randomUUID, createCipheriv, createDecipheriv, randomBytes, createHash} from 'node:crypto';
import {readFile, writeFile, mkdir, unlink} from 'node:fs/promises';
import path from 'node:path';
import {signedStore, clean, required, problem} from './gdpr-storage.mjs';
import {gdprAuth} from './gdpr-auth.mjs';
import {createRateLimiter} from './contacts.mjs';
import {auditCSV, auditHTML, auditPDF} from './gdpr-report.mjs';

const DAY = 86400000;
const SOURCES = ['contacts', 'visits', 'analytics_days', 'requests', 'audit', 'consents', 'deletion_evidence'];
const RIGHTS = ['access', 'rectification', 'erasure', 'restriction', 'portability', 'objection', 'withdrawal'];
const STEPS = {RECEIVED: ['IDENTITY_VERIFICATION'], IDENTITY_VERIFICATION: ['IN_REVIEW', 'REJECTED'], IN_REVIEW: ['APPROVED', 'REJECTED'], APPROVED: ['EXECUTED'], REJECTED: ['CLOSED'], EXECUTED: ['CLOSED'], CLOSED: []};
export function monthDeadline(iso, months = 1) {
  const date = new Date(iso);
  if (!Number.isFinite(+date)) throw problem('Dată invalidă.');
  const day = date.getUTCDate();
  date.setUTCDate(1); date.setUTCMonth(date.getUTCMonth() + months);
  date.setUTCDate(Math.min(day, new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate()));
  return date.toISOString();
}
const sourceLabel = {contacts: 'Cereri de contact și ofertă', visits: 'Vizite detaliate', analytics_days: 'Agregări de trafic', requests: 'Cereri GDPR închise', audit: 'Jurnal de audit'};
const seed = {
  version: 1, users: [], policies: [], requests: [], holds: [], operations: [], audit: [], auditAnchor: '',
  registry: {}, vendors: [], incidents: [], backups: [], alerts: [], job: {}, consents: [],
  backupSettings: {provider: '', location: '', frequency: '', retention: '', encryption: '', access: '', procedure: '', evidence: ''},
};
const publicUser = ({password, totp, ...user}) => ({...user, mfa: !!totp});
const isoNow = () => new Date().toISOString();
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const assertSource = source => { if (!SOURCES.includes(source)) throw problem('Sursă necunoscută.'); };

export async function createGdpr({dir, contacts, analytics, content, mailer, recaptcha, isProd = false, clock = () => Date.now(), adminAccess = () => false}) {
  const disk = await signedStore(dir, seed);
  let queue = Promise.resolve();
  const serial = fn => { const run = queue.then(fn); queue = run.catch(() => {}); return run; };
  const transaction = (actor, change, type = 'CONFIGURATION') => serial(async () => {
    const data = await disk.load();
    const result = await change(data);
    disk.event(data, actor, type);
    await disk.save(data);
    return result;
  });
  const auth = gdprAuth({transaction, view: disk.load, isProd, adminAccess});
  const fp = disk.fingerprint;
  const held = (data, source, id) => data.holds.some(h => h.active && h.source === source && h.target === fp(source, id));
  const pending = data => data.operations.some(op => ['PREPARED', 'FAILED'].includes(op.status));
  const snapshot = async (source, data) => {
    if (source === 'contacts') return (await contacts.readAll()).filter(v => !v.anonymized).map(v => ({id: v.id, at: v.createdAt, status: v.status, value: v}));
    if (source === 'visits') return (await analytics.privacyRead()).recent.map(v => ({id: v.sid, at: v.at, value: v}));
    if (source === 'analytics_days') return Object.entries((await analytics.privacyRead()).days).map(([id, value]) => ({id, at: `${id}T23:59:59.999Z`, value}));
    if (source === 'requests') return data.requests.filter(v => v.status === 'CLOSED').map(v => ({id: v.id, at: v.closedAt, value: v}));
    if (source === 'audit') return data.audit.map(v => ({id: v.id, at: v.at, value: v}));
    if (source === 'consents') return data.consents.map(v => ({id: v.id, at: v.at, value: v}));
    if (source === 'deletion_evidence') return data.operations.map(v => ({id: v.id, at: v.verifiedAt, value: v}));
    throw problem('Sursă necunoscută.');
  };
  function policyInput(input) {
    assertSource(input.source);
    const days = Number(input.days), limit = Number(input.limit);
    if (!Number.isInteger(days) || days < 1 || days > 36500 || !Number.isInteger(limit) || limit < 1 || limit > 100) throw problem('Retenție: 1–36500 zile; maximum 1–100 înregistrări pe execuție.');
    if (!['delete', 'anonymize'].includes(input.action) || (input.action === 'anonymize' && input.source !== 'contacts')) throw problem('Anonimizarea este disponibilă pentru cererile de contact.');
    const statuses = input.source === 'contacts' ? String(input.statuses || '').split(',').map(s => s.trim()).filter(Boolean) : [];
    if (statuses.some(s => !['new', 'in_progress', 'replied', 'done', 'rejected'].includes(s))) throw problem('Status de contact invalid.');
    return {source: input.source, days, limit, action: input.action, statuses, justification: required(input.justification, 'justificarea retenției'), owner: required(input.owner, 'responsabilul intern', 100), automatic: false};
  }
  async function candidates(data, policy) {
    const all = await snapshot(policy.source, data);
    const expired = all.filter(v => Number.isFinite(Date.parse(v.at)) && Date.parse(v.at) + policy.days * DAY <= clock() && (!policy.statuses.length || policy.statuses.includes(v.status)));
    let eligible = expired.filter(v => !held(data, policy.source, v.id));
    if (policy.source === 'deletion_evidence') eligible = eligible.filter(v => v.value.status === 'VERIFIED' && v.value.backupHandling === 'EXTERNAL ACTIONS DOCUMENTED' && !data.backups.some(b => b.status !== 'EXPIRED' && b.at <= v.value.at));
    if (policy.source === 'audit') {
      const eligibleIds = new Set(eligible.map(v => v.id));
      const stop = all.findIndex(v => !eligibleIds.has(v.id));
      eligible = all.slice(0, stop < 0 ? all.length : stop);
    }
    return {eligible, held: expired.filter(v => held(data, policy.source, v.id)).length, undated: all.filter(v => !Number.isFinite(Date.parse(v.at))).length};
  }
  const previews = new Map();
  async function preview(actor, input) {
    const data = await disk.load();
    let source, action, records, policy, excluded = 0, undated = 0;
    if (input.policyId) {
      policy = data.policies.find(p => p.id === input.policyId);
      if (!policy) throw problem('Politică inexistentă.', 404);
      ({source, action} = policy);
      const result = await candidates(data, policy);
      records = result.eligible; excluded = result.held; undated = result.undated;
    } else {
      source = input.source; assertSource(source);
      action = input.action;
      if (!['delete', 'anonymize'].includes(action) || (action === 'anonymize' && source !== 'contacts') || ['audit', 'requests', 'consents', 'deletion_evidence'].includes(source)) throw problem('Folosește o politică aprobată pentru această operațiune.');
      const ids = Array.isArray(input.ids) ? input.ids : [];
      if (!ids.length || ids.length > 100 || ids.some(id => typeof id !== 'string')) throw problem('Selectează 1–100 identificatori.');
      const all = await snapshot(source, data);
      records = all.filter(v => ids.includes(v.id) && !held(data, source, v.id));
      excluded = all.filter(v => ids.includes(v.id) && held(data, source, v.id)).length;
    }
    const limit = policy?.limit || 100;
    const token = randomUUID();
    for (const [key, value] of previews) if (value.expires < clock()) previews.delete(key);
    previews.set(token, {actor, expires: clock() + 600000, source, action, policyId: policy?.id || '', policyVersion: policy?.version, reason: policy ? 'Expirarea retenției aprobate' : required(input.reason, 'motivul operațiunii'), records: records.slice(0, limit).map(v => ({id: v.id, digest: hash(v.value)}))});
    return {token, source, action, matched: records.length, count: Math.min(records.length, limit), excluded, undated, limited: records.length > limit, approved: !!policy?.approvedAt, expiresAt: new Date(clock() + 600000).toISOString()};
  }
  async function apply(source, id, action, data) {
    if (source === 'contacts') await contacts.privacyApply(id, action);
    else if (source === 'visits') await analytics.remove(id);
    else if (source === 'analytics_days') await analytics.removeDay(id);
    else if (source === 'requests') data.requests = data.requests.filter(v => v.id !== id);
    else if (source === 'consents') data.consents = data.consents.filter(v => v.id !== id);
    else if (source === 'deletion_evidence') data.operations = data.operations.filter(v => v.id !== id);
    else if (source === 'audit') {
      // Only a contiguous prefix is removed; the previous signature stays as a checkpoint.
      const first = data.audit[0];
      if (first?.id === id) { data.auditAnchor = first.hash; data.audit.shift(); }
    }
  }
  async function perform(data, op, records) {
    let removed = 0;
    try {
      for (const record of records) {
        if (held(data, op.source, record.id)) throw problem('O blocare activă împiedică operațiunea.', 409);
        await apply(op.source, record.id, op.action, data);
        removed++;
      }
      await disk.save(data);
      const after = await snapshot(op.source, await disk.load());
      if (after.some(v => op.targets.includes(fp(op.source, v.id)))) throw new Error('Verification failed');
      op.status = 'VERIFIED'; op.verification = 'PASSED'; op.verifiedAt = isoNow(); op.error = '';
      // Count targets proven absent, including a retry after a crash between data and evidence writes.
      op.affected = op.targets.length; op.lastAttemptAffected = removed;
      disk.event(data, op.actor, 'DELETION_VERIFIED', {operationId: op.id, source: op.source, count: op.affected});
    } catch (error) {
      op.status = 'FAILED'; op.verification = 'NOT VERIFIED'; op.error = error.status === 409 ? 'LEGAL_HOLD' : 'STORAGE_OR_VERIFICATION_FAILED';
      op.lastAttemptAffected = removed;
      data.alerts.push({id: randomUUID(), at: isoNow(), operationId: op.id, code: op.error, resolved: false});
      disk.event(data, op.actor, 'DELETION_FAILED', {operationId: op.id, code: op.error});
    }
    await disk.save(data);
    return op;
  }
  const execute = (actor, token, confirmation) => serial(async () => {
    if (confirmation !== 'CONFIRM ȘTERGERE') throw problem('Confirmarea explicită lipsește.');
    const draft = previews.get(token);
    if (!draft || draft.actor !== actor || draft.expires < clock()) throw problem('Simularea a expirat. Rulează din nou.', 409);
    const data = await disk.load();
    const policy = data.policies.find(p => p.id === draft.policyId);
    if (draft.policyId && (!policy?.approvedAt || policy.version !== draft.policyVersion)) throw problem('Politica nu este aprobată sau s-a modificat.', 409);
    const all = await snapshot(draft.source, data);
    const selected = [];
    for (const target of draft.records) {
      if (data.operations.some(op => op.source === draft.source && op.status !== 'VERIFIED' && op.targets.includes(fp(draft.source, target.id)))) throw problem('O operațiune anterioară pentru această înregistrare necesită reluare.', 409);
      const record = all.find(v => v.id === target.id);
      if (!record || hash(record.value) !== target.digest || held(data, draft.source, target.id)) throw problem('Datele sau blocările s-au schimbat. Repetă simularea.', 409);
      selected.push(record);
    }
    if (!selected.length) throw problem('Nu există înregistrări eligibile.');
    const op = {id: `DEL-${new Date(clock()).getUTCFullYear()}-${randomUUID()}`, at: isoNow(), source: draft.source, action: draft.action, reason: draft.reason, policyId: draft.policyId, policyVersion: draft.policyVersion || null, policy: policy ? {days: policy.days, justification: policy.justification, approvedAt: policy.approvedAt, approvedBy: policy.approvedBy} : null, actor, targets: selected.map(v => fp(draft.source, v.id)), status: 'PREPARED', affected: 0, verification: 'NOT VERIFIED', backupHandling: 'PENDING EXTERNAL REVIEW', error: ''};
    data.operations.push(op);
    disk.event(data, actor, 'DELETION_PREPARED', {operationId: op.id, source: op.source, count: selected.length});
    await disk.save(data); // Durable intent before any irreversible change; needed for crash recovery.
    previews.delete(token);
    return perform(data, op, selected);
  });
  const retry = (actor, id) => serial(async () => {
    const data = await disk.load(), op = data.operations.find(v => v.id === id);
    if (!op) throw problem('Operațiune inexistentă.', 404);
    if (op.status === 'VERIFIED') return op;
    const records = (await snapshot(op.source, data)).filter(v => op.targets.includes(fp(op.source, v.id)));
    disk.event(data, actor, 'RETRY', {operationId: id});
    const result = await perform(data, op, records);
    if (result.status === 'VERIFIED') {
      data.alerts.filter(a => a.operationId === id).forEach(a => { a.resolved = true; });
      await disk.save(data);
    }
    return result;
  });
  async function manualDelete(actor, source, ids) {
    const draft = await preview(actor, {source, ids, action: 'delete', reason: 'Ștergere manuală confirmată în admin'});
    if (draft.excluded) throw problem('Există o blocare juridică sau o restricție activă.', 409);
    if (!draft.count) return false;
    const op = await execute(actor, draft.token, 'CONFIRM ȘTERGERE');
    if (op.status !== 'VERIFIED') throw problem('Ștergerea necesită verificare. Consultă alertele GDPR.', 503);
    return true;
  }
  async function assertWritable(source, id) {
    if (held(await disk.load(), source, id)) throw problem('Prelucrare restricționată. Revizuiește blocarea în modulul GDPR.', 409);
  }
  const updateContact = (id, fields) => serial(async () => {
    await assertWritable('contacts', id);
    return contacts.update(id, fields);
  });
  async function visibleContacts() {
    const data = await disk.load();
    return (await contacts.readAll()).map(v => held(data, 'contacts', v.id) ? {id: v.id, createdAt: v.createdAt, status: v.status, name: 'Prelucrare restricționată', email: '', note: 'Consultă responsabilul GDPR. Datele sunt accesibile numai în workflow-ul de exercitare a drepturilor.'} : v);
  }

  async function inventory(data) {
    const smtp = await mailer.publicSettings(), captcha = await recaptcha.adminSettings();
    const items = [
      {id: 'contacts', name: sourceLabel.contacts, fields: 'nume, email, telefon, țară, mesaj, buget, proiect, IP, user-agent, referer, note', purpose: 'Răspuns la solicitări și pregătirea ofertei', legalBasis: 'Art. 6(1)(b) pentru demersuri precontractuale; art. 6(1)(f) pentru alte corespondențe, de validat', source: 'Formular /api/contact', storage: 'CONTACTS_FILE / data/contacts.json; căsuțe email dacă SMTP activ', subjects: 'Potențiali clienți și persoane de contact', recipients: smtp.enabled ? `Administratori; SMTP ${smtp.host} (furnizor juridic neconfirmat)` : 'Administratori', count: (await contacts.readAll()).filter(v => !v.anonymized).length},
      {id: 'visits', name: sourceLabel.visits, fields: 'identificator, IP, pagini, localizare aproximativă, dispozitiv, campanii', purpose: 'Statistici de utilizare', legalBasis: 'Art. 6(1)(a), opțiunea statistici din browser', source: 'Beacon /api/visits', storage: 'ANALYTICS_FILE / data/analytics.json; vv-visit în sessionStorage', subjects: 'Vizitatori care acceptă statistici', recipients: 'Administratori', count: (await analytics.privacyRead()).recent.length},
      {id: 'analytics_days', name: sourceLabel.analytics_days, fields: 'contoare pe zile, chei de pagini/campanii/localizare; pot conține date personale', purpose: 'Analiză statistică agregată', legalBasis: 'Art. 6(1)(a); anonimatul cheilor nu este garantat', source: '/api/visits', storage: 'ANALYTICS_FILE / data/analytics.json', subjects: 'Vizitatori', recipients: 'Administratori', count: Object.keys((await analytics.privacyRead()).days).length},
      {id: 'public_content', name: 'Testimoniale, proiecte și imagini publicate', fields: 'nume, rol, citat, fotografii și eventuale date în capturi', purpose: 'Prezentarea activității și portofoliului', legalBasis: 'De documentat pentru fiecare material', source: 'Editor de conținut / încărcări admin', storage: 'source_data.json; public/; data/image-originals', subjects: 'Persoane prezentate în materiale', recipients: 'Publicul site-ului; CDN-uri de imagini conform conținutului', count: content()._collections?.testimonials?.length || 0},
      {id: 'preferences', name: 'Preferințe și consimțământ în browser', fields: 'alegeri, versiune, servicii și dată; temă vizuală', purpose: 'Memorarea opțiunilor și blocarea serviciilor opționale', legalBasis: 'Necesitatea memorării preferințelor; art. 6(1)(a) pentru tracking opțional', source: 'Banner și selector de temă', storage: 'localStorage vv-consent / vv-theme', subjects: 'Vizitatori', recipients: 'Browserul persoanei', count: null},
      {id: 'consents', name: 'Dovezi ale preferințelor de consimțământ', fields: 'ID aleator, opțiuni, dată server, versiune informare, servicii; fără IP/email', purpose: 'Demonstrarea alegerii și verificarea statisticilor interne', legalBasis: 'Art. 6(1)(c), art. 7(1); cookie tehnic pentru memorarea alegerii', source: '/api/consent; banner cookie', storage: 'GDPR_DIR/register.json; cookie tehnic de sesiune esa_consent', subjects: 'Vizitatori care aleg opțiunile', recipients: 'Responsabili GDPR; numai contoare pentru auditori', count: data.consents.length},
      {id: 'admin_accounts', name: 'Acces administrativ', fields: 'identificator, nume, hash parolă GDPR, secret MFA opțional, sesiuni', purpose: 'Controlul accesului și responsabilizare', legalBasis: 'Art. 6(1)(f), securitatea aplicației; evaluare de documentat', source: 'Administrator', storage: 'Registru GDPR privat; sesiuni în memorie; ADMIN_PASSWORD / admin-password.txt', subjects: 'Administratori și auditori', recipients: 'Responsabili autorizați', count: data.users.length},
      {id: 'requests', name: sourceLabel.requests, fields: 'contact solicitant, drept solicitat, verificare identitate, decizie, istoric', purpose: 'Soluționarea drepturilor persoanelor vizate', legalBasis: 'Art. 6(1)(c), art. 12–22 GDPR', source: 'Solicitare primită și înregistrată de responsabil', storage: 'GDPR_DIR/register.json', subjects: 'Solicitanți', recipients: 'Responsabili GDPR', count: data.requests.length},
      {id: 'audit', name: sourceLabel.audit, fields: 'actor nominal, eveniment, dată, identificatori de operațiuni; fără copia datelor șterse', purpose: 'Dovezi tehnice și responsabilizare', legalBasis: 'Art. 6(1)(c), art. 5(2), 24 și 32; întindere de validat', source: 'Operațiuni privilegiate', storage: 'Registru GDPR semnat; exporturi controlate', subjects: 'Personal autorizat; ținte pseudonimizate separat', recipients: 'Responsabili și auditori', count: data.audit.length},
      {id: 'deletion_evidence', name: 'Dovezi de ștergere și protecția restaurării', fields: 'operațiune, actor, dată, rezultat, amprente HMAC ale ID-urilor; fără conținut șters', purpose: 'Verificarea ștergerilor și reaplicarea lor după restaurare', legalBasis: 'Art. 6(1)(c), art. 5(2), 17 și 24; retenție justificată separat', source: 'Operațiuni de ștergere / anonimizare', storage: 'Registru GDPR privat, separat de copiile datelor', subjects: 'Personal autorizat și ținte pseudonimizate', recipients: 'Responsabili și auditori', count: data.operations.length},
      {id: 'incidents', name: 'Incidente și dovezi operaționale', fields: 'descriere minimizată, risc, măsuri, notificări, responsabili', purpose: 'Gestionarea incidentelor de securitate', legalBasis: 'Art. 6(1)(c), art. 32–34 GDPR', source: 'Responsabil GDPR', storage: 'Registru GDPR privat', subjects: 'Persoane afectate și personal', recipients: 'Responsabili; autorități când este cazul', count: data.incidents.length},
    ];
    if (captcha.enabled && captcha.siteKey && captcha.hasSecret) items.push({id: 'recaptcha', name: 'Google reCAPTCHA activ', fields: 'IP, token și date tehnice browser', purpose: 'Combaterea abuzului', legalBasis: 'Evaluare necesitate și consimțământ de documentat', source: 'Formular de contact', storage: 'Google / procesare tranzitorie server', subjects: 'Vizitatori ai formularului', recipients: 'Google', count: null});
    return items.map(item => ({...item, retention: 'Neaprobată', action: 'Revizuire manuală', owner: '', transfers: 'NOT VERIFIED', ...data.registry[item.id], policies: data.policies.filter(p => p.source === item.id)}));
  }
  async function detectedVendors() {
    const smtp = await mailer.publicSettings(), captcha = await recaptcha.adminSettings(), tracking = content()['settings/tracking'] || {};
    const values = [
      {id: 'hosting', service: 'Hosting aplicație și fișiere', evidence: 'Server Node.js și stocare locală; furnizor neidentificat'},
      {id: 'simpleicons', service: 'cdn.simpleicons.org', evidence: 'Iconuri externe în src/pages/services.tsx'},
    ];
    if (smtp.enabled) values.push({id: 'smtp', service: smtp.host, evidence: 'SMTP activ în configurație; contractantul și locația nu sunt confirmate'});
    if (captcha.enabled && captcha.siteKey && captcha.hasSecret) values.push({id: 'recaptcha', service: 'Google reCAPTCHA', evidence: 'Configurat și activ'});
    if (tracking['google-analytics-id'] || tracking['google-ads-id']) values.push({id: 'google', service: 'Google Analytics / Ads', evidence: 'Identificator configurat; activare condiționată de consimțământ'});
    if (tracking['meta-pixel-id']) values.push({id: 'meta', service: 'Meta Pixel', evidence: 'Identificator configurat; activare condiționată de consimțământ'});
    if (/wix:image:|wix:vector:|static\.wixstatic\.com/.test(JSON.stringify(content()))) values.push({id: 'wix', service: 'Wix CDN', evidence: 'Referințe externe în conținut; verificare solicitări și contract necesară'});
    return values;
  }
  async function readiness(data) {
    const inv = await inventory(data), vendors = await detectedVendors(), now = clock();
    const checks = [];
    const add = (id, status, evidence, action) => checks.push({id, status, evidence, action});
    add('Inventar', 'PASS', `${inv.length} categorii identificate din cod/configurație și registrul curent.`, 'Revizuiește activitățile din afara aplicației.');
    add('Retenție', SOURCES.every(s => data.policies.some(p => p.source === s && p.approvedAt)) ? 'PASS' : 'WARNING', `${data.policies.filter(p => p.approvedAt).length} politici aprobate.`, 'Stabilește termenele, justificarea și aprobă separat fiecare politică.');
    const traffic = await analytics.privacyRead();
    add('Capacitate statistici', traffic.recent.length >= 1000 || Object.keys(traffic.days).length >= 800 ? 'WARNING' : 'PASS', `${traffic.recent.length}/1000 vizite detaliate; ${Object.keys(traffic.days).length}/800 zile.`, 'La limita tehnică, colectarea nouă se oprește în locul ștergerilor fără dovezi. Configurează și aprobă retenția.');
    add('Job retenție', !data.job.lastRun ? 'NOT VERIFIED' : data.job.error ? 'FAIL' : now - Date.parse(data.job.lastRun) > 1800000 ? 'WARNING' : 'PASS', JSON.stringify(data.job), 'Jobul rulează la 15 minute numai cât procesul Node este pornit; verifică monitorizarea hostului.');
    add('Integritate jurnal', 'PASS', `Semnătura HMAC și lanțul a ${data.audit.length} evenimente au fost verificate la citire.`, 'Păstrează checkpoint-uri exportate într-un sistem independent.');
    add('Ștergeri', pending(data) ? 'FAIL' : data.operations.length ? 'PASS' : 'NOT VERIFIED', `${data.operations.filter(v => v.status === 'VERIFIED').length} operațiuni verificate; ${data.operations.filter(v => v.status !== 'VERIFIED').length} necesită verificare.`, 'Verificarea privește sursele aplicației, nu copiile externe. Reia erorile individual.');
    add('Alerte', data.alerts.some(a => !a.resolved) ? 'FAIL' : 'PASS', `${data.alerts.filter(a => !a.resolved).length} alerte nerezolvate.`, 'Remediază cauza și reia operațiunea; notificările sunt vizibile în dashboard.');
    const overdue = data.requests.filter(r => r.status !== 'CLOSED' && Date.parse(r.dueAt) < now);
    add('Cereri GDPR', overdue.length ? 'FAIL' : 'PASS', `${overdue.length} cereri depășite; ${data.requests.filter(r => r.status !== 'CLOSED').length} deschise.`, 'Confirmă livrarea răspunsului; termenul nu este suspendat automat la verificarea identității.');
    add('Acces nominal', data.users.length ? 'PASS' : 'WARNING', `${data.users.filter(u => u.enabled).length} conturi GDPR active; drepturi server gdpr_admin/auditor.`, 'Accesul general al site-ului folosește încă o parolă comună.');
    add('MFA', data.users.length && data.users.filter(u => u.enabled).every(u => u.totp) ? 'PASS' : 'WARNING', `${data.users.filter(u => u.enabled && u.totp).length} conturi active cu MFA.`, 'Activează MFA pentru fiecare cont GDPR. Securizează și accesul comun/hostul.');
    add('Backup', data.backups.some(b => b.rehearsedAt) ? 'PASS' : 'NOT VERIFIED', `${data.backups.length} copii înregistrate; ${data.backups.filter(b => b.rehearsedAt).length} repetiții de restaurare locală.`, 'PASS privește numai copiile criptate create și testate de modul. Verifică separat backupurile hostului și emailului.');
    add('Backup extern', 'NOT VERIFIED', data.backupSettings.evidence || 'Nu există verificare tehnică a infrastructurii externe.', 'Confirmă contractul, criptarea, accesul, frecvența, expirarea și restaurarea.');
    add('Furnizori', vendors.every(v => data.vendors.some(x => x.id === v.id && x.contract && x.location && x.transfers)) ? 'WARNING' : 'NOT VERIFIED', `${vendors.length} servicii detectate; ${data.vendors.length} fișe documentate.`, 'Declarațiile administratorului nu verifică contractele art. 28 sau transferurile în afara SEE.');
    add('Consimțământ', data.consents.length ? 'PASS' : 'NOT VERIFIED', `${data.consents.length} alegeri înregistrate cu dată server și versiune; /api/visits verifică opțiunea server.`, 'Dovada privește alegeri primite de la browser, nu identitatea sau validitatea juridică a tuturor consimțămintelor istorice.');
    add('Copii externe și materiale publicate', 'NOT VERIFIED', 'Emailurile, imaginile originale, exporturile descărcate și logurile hostului nu sunt șterse de motor.', 'Execută și documentează procedurile externe; nu declara ștergere globală.');
    return checks;
  }
  async function view() {
    const data = await disk.load();
    const seo = content()['settings/seo'] || {};
    return {operator: {source: 'Configurația site-ului; neverificată în registrul oficial', ...Object.fromEntries(Object.entries(seo).filter(([k]) => /legal|company|email|address|phone|cui|tax/.test(k))), 'company-email': seo['company-email'] || content()['/contact']?.['contact-visuvate-com'] || ''}, registry: await inventory(data), policies: data.policies, requests: data.requests, holds: data.holds, operations: data.operations.map(({targets, ...op}) => op), audit: data.audit, checkpoint: {head: disk.verify(data), count: data.audit.length, anchor: data.auditAnchor, generatedAt: isoNow()}, users: data.users.map(publicUser), vendors: await detectedVendors(), vendorRecords: data.vendors, incidents: data.incidents, backups: data.backups, backupSettings: data.backupSettings, backupKeyConfigured: !!backupKey(), alerts: data.alerts, job: data.job, consentCount: data.consents.length, checks: await readiness(data)};
  }

  function serviceVersion() {
    return hash({tracking: content()['settings/tracking'] || {}, policy: content()['/politica-de-cookies'] || {}});
  }
  const consentCookie = req => (req.headers.cookie || '').split(/;\s*/).find(v => v.startsWith('esa_consent='))?.slice(12);
  function receipt(data, token) {
    const [id, signature] = String(token || '').split('.');
    if (!id || signature !== fp('consent-cookie', id)) return null;
    return data.consents.find(c => c.id === id && !c.superseded && c.services === serviceVersion());
  }
  const consentRouter = express.Router();
  const consentLimit = createRateLimiter({limit: 60, windowMs: 10 * 60000});
  const sameChoice = (previous, choice) => !!previous && previous.statistics === choice.statistics && previous.marketing === choice.marketing;
  consentRouter.post('/', express.json({limit: '2kb'}), async (req, res) => {
    res.set('Cache-Control', 'no-store');
    if (req.get('origin') && req.get('origin') !== `${req.protocol}://${req.get('host')}`) return res.status(403).json({ok: false});
    if (typeof req.body?.statistics !== 'boolean' || typeof req.body?.marketing !== 'boolean') return res.status(422).json({ok: false});
    if (sameChoice(receipt(await disk.load(), consentCookie(req)), req.body)) return res.json({ok: true});
    if (!consentLimit(req.ip)) return res.status(429).json({ok: false});
    const token = await serial(async () => {
      const data = await disk.load(), previous = receipt(data, consentCookie(req));
      if (sameChoice(previous, req.body)) return `${previous.id}.${fp('consent-cookie', previous.id)}`;
      const entry = {id: randomUUID(), at: isoNow(), statistics: req.body.statistics, marketing: req.body.marketing, services: serviceVersion(), noticeVersion: 'gdpr-module-1'};
      if (previous) previous.superseded = true;
      data.consents.push(entry);
      disk.event(data, 'visitor', 'CONSENT_RECORDED', {statistics: entry.statistics, marketing: entry.marketing, noticeVersion: entry.noticeVersion});
      await disk.save(data);
      return `${entry.id}.${fp('consent-cookie', entry.id)}`;
    });
    res.cookie('esa_consent', token, {httpOnly: true, sameSite: 'lax', secure: isProd, path: '/'}).json({ok: true});
  });
  consentRouter.use((_error, _req, res, _next) => res.status(503).json({ok: false}));
  const consentAllowsStatistics = async req => !!receipt(await disk.load(), consentCookie(req))?.statistics;

  // Retention never invents durations; edited policies lose approval and automatic activation.
  async function runJob() {
    try {
      const data = await disk.load();
      for (const policy of data.policies.filter(p => p.approvedAt && p.automatic)) {
        for (const op of data.operations.filter(o => o.policyId === policy.id && o.status !== 'VERIFIED')) {
          if ((await retry('system', op.id)).status !== 'VERIFIED') throw new Error('Pending deletion failed');
        }
        const draft = await preview('system', {policyId: policy.id});
        if (draft.count) {
          const op = await execute('system', draft.token, 'CONFIRM ȘTERGERE');
          if (op.status !== 'VERIFIED') throw new Error('Retention verification failed');
        }
      }
      await transaction('system', data => { data.job = {lastRun: isoNow(), error: '', intervalMinutes: 15}; }, 'RETENTION_SCAN');
    } catch {
      await transaction('system', data => {
        data.job = {lastRun: isoNow(), error: 'RETENTION_SCAN_FAILED', intervalMinutes: 15};
        data.alerts.push({id: randomUUID(), at: isoNow(), code: 'RETENTION_SCAN_FAILED', resolved: false});
      }, 'RETENTION_SCAN_FAILED');
    }
  }

  function backupKey() {
    const value = process.env.GDPR_BACKUP_KEY || '';
    return /^[a-f0-9]{64}$/i.test(value) ? Buffer.from(value, 'hex') : null;
  }
  function encrypt(value) {
    const key = backupKey(); if (!key) throw problem('Configurează GDPR_BACKUP_KEY: cheie aleatoare de 32 bytes, hexazecimal, păstrată separat.');
    const iv = randomBytes(12), cipher = createCipheriv('aes-256-gcm', key, iv);
    const body = Buffer.concat([cipher.update(JSON.stringify(value)), cipher.final()]);
    return Buffer.concat([Buffer.from('ESAGDPR1'), iv, cipher.getAuthTag(), body]);
  }
  function decrypt(value) {
    const key = backupKey(); if (!key || value.subarray(0, 8).toString() !== 'ESAGDPR1') throw problem('Cheie sau copie criptată invalidă.');
    const decipher = createDecipheriv('aes-256-gcm', key, value.subarray(8, 20));
    decipher.setAuthTag(value.subarray(20, 36));
    return JSON.parse(Buffer.concat([decipher.update(value.subarray(36)), decipher.final()]).toString());
  }
  function sanitizeBackup(copy, data) {
    let affected = 0;
    for (const op of data.operations) {
      if (!['VERIFIED', 'PREPARED', 'FAILED'].includes(op.status)) continue;
      if (op.source === 'contacts') copy.contacts = copy.contacts.flatMap(v => {
        if (!op.targets.includes(fp('contacts', v.id))) return [v];
        affected++;
        return op.action === 'anonymize' ? [{id: randomUUID(), anonymized: true, status: 'done'}] : [];
      });
      if (op.source === 'visits') copy.analytics.recent = copy.analytics.recent.filter(v => {
        const remove = op.targets.includes(fp('visits', v.sid)); if (remove) affected++; return !remove;
      });
      if (op.source === 'analytics_days') for (const id of Object.keys(copy.analytics.days)) if (op.targets.includes(fp('analytics_days', id))) {
        copy.analytics.totals.visits = Math.max(0, copy.analytics.totals.visits - (copy.analytics.days[id].visits || 0));
        copy.analytics.totals.views = Math.max(0, copy.analytics.totals.views - (copy.analytics.days[id].views || 0));
        delete copy.analytics.days[id]; affected++;
      }
    }
    return affected;
  }

  const router = express.Router();
  router.use((req, res, next) => {
    if (req.method !== 'GET' && req.get('x-admin') !== '1') return res.status(403).json({ok: false, error: 'Cerere respinsă.'});
    next();
  });
  router.use(express.json({limit: '128kb'}));
  router.use((_req, res, next) => { res.set({'Cache-Control': 'no-store', 'Pragma': 'no-cache', 'X-Robots-Tag': 'noindex'}); next(); });
  auth.mount(router, createRateLimiter({limit: 10, windowMs: 15 * 60000}));
  router.use(auth.guard());
  router.get('/', async (req, res) => {
    const result = await view();
    // Auditors inspect evidence, never raw subject identifiers or operational notes.
    if (req.gdprActor.role === 'auditor') {
      result.requests = result.requests.map(({id, type, receivedAt, dueAt, status, closedAt}) => ({id, type, receivedAt, dueAt, status, closedAt}));
      result.holds = result.holds.map(({reason, target, ...h}) => h);
      result.incidents = result.incidents.map(({id, detectedAt, status, assessmentDueAt}) => ({id, detectedAt, status, assessmentDueAt}));
    }
    res.json({ok: true, ...result});
  });
  router.get('/consents', auth.guard(true), async (_req, res) => res.json({ok: true, items: (await disk.load()).consents}));
  router.get('/report/:format', async (req, res) => {
    const from = req.query.from ? new Date(String(req.query.from)) : new Date('1970-01-01');
    const to = req.query.to ? new Date(`${req.query.to}T23:59:59.999Z`) : new Date();
    if (!Number.isFinite(+from) || !Number.isFinite(+to) || from > to) throw problem('Interval de raport invalid.');
    if (!['csv', 'html', 'pdf', 'json'].includes(req.params.format)) throw problem('Format necunoscut.');
    const report = await view();
    report.generatedAt = isoNow(); report.reportId = `AUD-${randomUUID()}`; report.period = {from: from.toISOString(), to: to.toISOString()};
    for (const key of ['operations', 'audit', 'incidents']) report[key] = report[key].filter(v => new Date(v.at || v.detectedAt) >= from && new Date(v.at || v.detectedAt) <= to);
    report.requests = report.requests.filter(v => new Date(v.receivedAt) >= from && new Date(v.receivedAt) <= to).map(({id, type, receivedAt, dueAt, status, closedAt}) => ({id, type, receivedAt, dueAt, status, closedAt}));
    report.holds = report.holds.map(({id, source, active, at}) => ({id, source, active, at}));
    report.incidents = report.incidents.map(({id, detectedAt, status, authorityNotifiedAt, assessment}) => ({id, detectedAt, status, authorityNotifiedAt, assessment}));
    await transaction(req.gdprActor.id, () => {}, 'AUDIT_REPORT_EXPORTED');
    const format = req.params.format;
    res.attachment(`${report.reportId}.${format}`);
    if (format === 'csv') res.type('text/csv').send(auditCSV(report));
    else if (format === 'html') res.type('html').send(auditHTML(report));
    else if (format === 'pdf') res.type('application/pdf').send(await auditPDF(report));
    else res.json(report);
  });
  router.use(auth.guard(true));
  router.put('/registry/:id', async (req, res) => {
    await transaction(req.gdprActor.id, async data => {
      if (!(await inventory(data)).some(v => v.id === req.params.id)) throw problem('Categorie necunoscută.');
      data.registry[req.params.id] = Object.fromEntries(['purpose', 'legalBasis', 'subjects', 'recipients', 'retention', 'action', 'owner', 'transfers'].map(k => [k, required(req.body[k], k, 1000)]));
    }, 'REGISTRY_UPDATED'); res.json({ok: true});
  });
  router.post('/policies', async (req, res) => {
    const id = await transaction(req.gdprActor.id, data => {
      const rule = policyInput(req.body), existing = data.policies.find(p => p.id === req.body.id);
      if (existing) Object.assign(existing, rule, {version: existing.version + 1, approvedAt: '', approvedBy: ''});
      else data.policies.push({...rule, id: randomUUID(), version: 1, approvedAt: '', approvedBy: ''});
      return existing?.id || data.policies.at(-1).id;
    }, 'POLICY_DRAFT'); res.json({ok: true, id});
  });
  router.post('/policies/:id/approve', async (req, res) => {
    if (req.body.confirmation !== 'APROB POLITICA') throw problem('Confirmă aprobarea politicii.');
    await transaction(req.gdprActor.id, data => {
      const p = data.policies.find(p => p.id === req.params.id); if (!p) throw problem('Politică inexistentă.', 404);
      p.approvedAt = isoNow(); p.approvedBy = req.gdprActor.id; p.automatic = req.body.automatic === true;
    }, 'POLICY_APPROVED'); res.json({ok: true});
  });
  router.post('/preview', async (req, res) => res.json({ok: true, preview: await preview(req.gdprActor.id, req.body)}));
  router.post('/execute', async (req, res) => res.json({ok: true, operation: await execute(req.gdprActor.id, req.body.token, req.body.confirmation)}));
  router.post('/operations/:id/retry', async (req, res) => res.json({ok: true, operation: await retry(req.gdprActor.id, req.params.id)}));
  router.post('/operations/:id/copies', async (req, res) => {
    await transaction(req.gdprActor.id, data => {
      const op = data.operations.find(o => o.id === req.params.id); if (!op) throw problem('Operațiune inexistentă.', 404);
      op.externalEvidence = required(req.body.evidence, 'referința verificării emailurilor, exporturilor și expirării tuturor copiilor externe', 1500);
      op.backupHandling = req.body.handled === true ? 'EXTERNAL ACTIONS DOCUMENTED' : 'PENDING EXTERNAL REVIEW';
      op.externalDocumentedBy = req.gdprActor.id; op.externalDocumentedAt = isoNow();
    }, 'EXTERNAL_COPIES_DOCUMENTED'); res.json({ok: true});
  });
  router.post('/scan', async (_req, res) => { await runJob(); res.json({ok: true}); });
  router.post('/holds', async (req, res) => {
    await transaction(req.gdprActor.id, async data => {
      assertSource(req.body.source);
      const id = required(req.body.recordId, 'identificatorul înregistrării', 100);
      if (!(await snapshot(req.body.source, data)).some(v => v.id === id)) throw problem('Înregistrare inexistentă.', 404);
      data.holds.push({id: randomUUID(), at: isoNow(), source: req.body.source, target: fp(req.body.source, id), reason: required(req.body.reason, 'motivul blocării'), actor: req.gdprActor.id, active: true});
    }, 'HOLD_CREATED'); res.json({ok: true});
  });
  router.post('/holds/:id/release', async (req, res) => {
    await transaction(req.gdprActor.id, data => { const h = data.holds.find(h => h.id === req.params.id); if (!h) throw problem('Blocare inexistentă.', 404); h.active = false; h.releaseReason = required(req.body.reason, 'motivul ridicării'); h.releasedAt = isoNow(); }, 'HOLD_RELEASED');
    res.json({ok: true});
  });
  router.post('/requests', async (req, res) => {
    const id = await transaction(req.gdprActor.id, data => {
      if (!RIGHTS.includes(req.body.type)) throw problem('Drept necunoscut.');
      const email = required(req.body.email, 'adresa solicitantului', 254).toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw problem('Email invalid.');
      const receivedAt = req.body.receivedAt ? new Date(req.body.receivedAt).toISOString() : isoNow();
      if (Date.parse(receivedAt) > clock()) throw problem('Data primirii nu poate fi în viitor.');
      const r = {id: `DSR-${randomUUID()}`, email, type: req.body.type, receivedAt, dueAt: monthDeadline(receivedAt), originalDueAt: monthDeadline(receivedAt), status: 'RECEIVED', note: clean(req.body.note, 2000), history: [{at: isoNow(), actor: req.gdprActor.id, status: 'RECEIVED'}]};
      data.requests.push(r); return r.id;
    }, 'REQUEST_CREATED'); res.json({ok: true, id});
  });
  router.post('/requests/:id/transition', async (req, res) => {
    await transaction(req.gdprActor.id, data => {
      const r = data.requests.find(r => r.id === req.params.id); if (!r) throw problem('Cerere inexistentă.', 404);
      const next = req.body.status;
      if (!STEPS[r.status].includes(next)) throw problem('Tranziție nepermisă.');
      if (next === 'IN_REVIEW') { r.identityEvidence = required(req.body.evidence, 'metoda și referința verificării identității'); r.identityVerifiedAt = isoNow(); }
      if (['APPROVED', 'REJECTED'].includes(next)) r.decision = required(req.body.evidence, 'motivarea juridică a deciziei');
      if (next === 'EXECUTED') throw problem('Folosește acțiunea de executare, care verifică rezultatul.');
      if (next === 'CLOSED') { r.responseEvidence = required(req.body.evidence, 'referința răspunsului comunicat solicitantului'); r.closedAt = isoNow(); }
      r.status = next; r.history.push({at: isoNow(), actor: req.gdprActor.id, status: next});
    }, 'REQUEST_TRANSITION'); res.json({ok: true});
  });
  router.post('/requests/:id/extend', async (req, res) => {
    await transaction(req.gdprActor.id, data => {
      const r = data.requests.find(r => r.id === req.params.id); if (!r) throw problem('Cerere inexistentă.', 404);
      if (r.extension || r.status === 'CLOSED' || clock() > Date.parse(r.originalDueAt)) throw problem('Prelungirea trebuie justificată și comunicată în prima lună.');
      const months = Number(req.body.months); if (![1, 2].includes(months)) throw problem('Prelungire: una sau două luni.');
      r.extension = {months, reason: required(req.body.reason, 'motivul complexității'), notification: required(req.body.evidence, 'dovada informării solicitantului'), at: isoNow()};
      r.dueAt = monthDeadline(r.receivedAt, 1 + months);
      r.history.push({at: isoNow(), actor: req.gdprActor.id, status: 'EXTENDED'});
    }, 'REQUEST_EXTENDED'); res.json({ok: true});
  });
  router.get('/requests/:id/matches', async (req, res) => {
    const data = await disk.load(), r = data.requests.find(r => r.id === req.params.id);
    if (!r?.identityVerifiedAt) throw problem('Verifică identitatea înainte de a accesa datele asociate.', 403);
    const items = (await contacts.readAll()).filter(v => v.email?.toLowerCase() === r.email);
    await transaction(req.gdprActor.id, () => {}, 'SUBJECT_DATA_ACCESSED');
    res.json({ok: true, items, scope: 'Potrivire exactă email în cereri; emailurile, materialele publice și vizitele neasociate se verifică separat.'});
  });
  router.get('/requests/:id/export', async (req, res) => {
    const data = await disk.load(), r = data.requests.find(r => r.id === req.params.id);
    if (!r?.identityVerifiedAt || !['APPROVED', 'EXECUTED'].includes(r.status) || !['access', 'portability'].includes(r.type)) throw problem('Exportul necesită verificarea identității și aprobarea dreptului de acces/portabilitate.', 403);
    const items = (await contacts.readAll()).filter(v => v.email?.toLowerCase() === r.email).map(({note, ...v}) => r.type === 'portability' ? Object.fromEntries(Object.entries(v).filter(([k]) => ['name', 'email', 'phone', 'country', 'projectType', 'pages', 'budget', 'message', 'preferred_response_method'].includes(k))) : v);
    await transaction(req.gdprActor.id, data => { data.requests.find(x => x.id === r.id).exportedAt = isoNow(); }, 'SUBJECT_EXPORT');
    res.attachment(`${r.id}.json`).json({requestId: r.id, generatedAt: isoNow(), scope: 'Date din formular. Verifică drepturile terților înainte de transmitere; copiile externe se tratează separat.', items});
  });
  router.post('/requests/:id/execute', async (req, res) => {
    const data = await disk.load(), r = data.requests.find(r => r.id === req.params.id);
    if (!r || r.status !== 'APPROVED' || !r.identityVerifiedAt) throw problem('Cererea trebuie verificată și aprobată.');
    const evidence = required(req.body.evidence, 'dovada verificării copiilor externe și a acțiunilor efectuate', 2000);
    const matches = (await contacts.readAll()).filter(v => v.email?.toLowerCase() === r.email);
    if (r.type === 'erasure') {
      if (req.body.confirmation !== 'CONFIRM ȘTERGERE') throw problem('Confirmarea explicită lipsește.');
      if (matches.length) {
        const previewResult = await preview(req.gdprActor.id, {source: 'contacts', ids: matches.map(v => v.id), action: 'delete', reason: `Cerere ${r.id}`});
        if (previewResult.excluded || previewResult.limited) throw problem('Blocare juridică sau prea multe rezultate; rezolvă individual înainte de executare.');
        const op = await execute(req.gdprActor.id, previewResult.token, req.body.confirmation);
        if (op.status !== 'VERIFIED') throw problem('Ștergere neverificată. Reia operațiunea din jurnal.', 503);
      }
    }
    await transaction(req.gdprActor.id, async current => {
      const request = current.requests.find(x => x.id === r.id);
      if (request.status !== 'APPROVED') throw problem('Starea s-a schimbat.', 409);
      if (r.type === 'erasure' && (await contacts.readAll()).some(v => v.email?.toLowerCase() === r.email)) throw problem('Au apărut date noi. Repetă verificarea.', 409);
      if (['access', 'portability'].includes(r.type) && !request.exportedAt) throw problem('Generează și verifică exportul înainte de executare.');
      if (r.type === 'rectification') {
        if (!req.body.fields || typeof req.body.fields !== 'object' || !Object.keys(req.body.fields).length) throw problem('Completează câmpurile de rectificat.');
        for (const v of matches) { if (held(current, 'contacts', v.id)) throw problem('Date blocate.', 409); await contacts.privacyApply(v.id, 'rectify', req.body.fields); }
        const after = await contacts.readAll();
        if (matches.some(v => Object.entries(req.body.fields).some(([k, value]) => after.find(a => a.id === v.id)?.[k] !== value))) throw problem('Rectificarea nu a fost verificată.', 503);
      }
      if (['restriction', 'objection', 'withdrawal'].includes(r.type)) for (const v of matches) if (!held(current, 'contacts', v.id)) current.holds.push({id: randomUUID(), at: isoNow(), source: 'contacts', target: fp('contacts', v.id), reason: `Restricție ${r.id}: verifică temeiul înainte de utilizare`, active: true, actor: req.gdprActor.id});
      request.externalEvidence = evidence; request.status = 'EXECUTED'; request.executedAt = isoNow();
      request.history.push({at: isoNow(), actor: req.gdprActor.id, status: 'EXECUTED'});
    }, 'REQUEST_EXECUTED'); res.json({ok: true});
  });
  router.put('/vendors/:id', async (req, res) => {
    await transaction(req.gdprActor.id, data => {
      const id = required(req.params.id, 'identificator', 80);
      const v = {id, updatedAt: isoNow(), ...Object.fromEntries(['name', 'service', 'location', 'contract', 'transfers', 'retention', 'owner'].map(k => [k, required(req.body[k], k, 1000)]))};
      data.vendors = [...data.vendors.filter(x => x.id !== id), v];
    }, 'VENDOR_DOCUMENTED'); res.json({ok: true});
  });
  router.post('/incidents', async (req, res) => {
    await transaction(req.gdprActor.id, data => {
      const detectedAt = new Date(req.body.detectedAt || clock()).toISOString();
      if (Date.parse(detectedAt) > clock()) throw problem('Data constatării nu poate fi în viitor.');
      data.incidents.push({id: `INC-${randomUUID()}`, detectedAt, at: isoNow(), assessmentDueAt: new Date(Date.parse(detectedAt) + 72 * 3600000).toISOString(), summary: required(req.body.summary, 'descrierea minimizată'), assessment: required(req.body.assessment, 'evaluarea riscului și necesității notificării'), measures: required(req.body.measures, 'măsurile luate'), status: 'OPEN', actor: req.gdprActor.id});
    }, 'INCIDENT_RECORDED'); res.json({ok: true});
  });
  router.patch('/incidents/:id', async (req, res) => {
    await transaction(req.gdprActor.id, data => {
      const incident = data.incidents.find(v => v.id === req.params.id); if (!incident) throw problem('Incident inexistent.', 404);
      if (!['OPEN', 'CONTAINED', 'CLOSED'].includes(req.body.status)) throw problem('Status invalid.');
      incident.status = req.body.status; incident.assessment = required(req.body.assessment, 'decizia și justificarea notificării');
      incident.notificationEvidence = required(req.body.evidence, 'referința notificării sau motivul neefectuării');
      if (req.body.authorityNotifiedAt) incident.authorityNotifiedAt = new Date(req.body.authorityNotifiedAt).toISOString();
    }, 'INCIDENT_UPDATED'); res.json({ok: true});
  });
  router.put('/backups/settings', async (req, res) => {
    await transaction(req.gdprActor.id, data => { data.backupSettings = Object.fromEntries(Object.keys(seed.backupSettings).map(k => [k, clean(req.body[k], 1500)])); }, 'BACKUP_DOCUMENTED'); res.json({ok: true});
  });
  router.post('/backups', async (req, res) => {
    await transaction(req.gdprActor.id, async data => {
      const id = `BKP-${randomUUID()}`, at = isoNow();
      const bytes = encrypt({version: 1, at, contacts: await contacts.readAll(), analytics: await analytics.privacyRead()});
      await mkdir(path.join(dir, 'backups'), {recursive: true});
      await writeFile(path.join(dir, 'backups', `${id}.enc`), bytes, {flag: 'wx', mode: 0o600});
      data.backups.push({id, at, scope: 'contacts + analytics; fără email, conținut public, chei sau registru GDPR', bytes: bytes.length, digest: createHash('sha256').update(bytes).digest('hex'), encryption: 'AES-256-GCM', status: 'CREATED'});
    }, 'BACKUP_CREATED'); res.json({ok: true});
  });
  router.post('/backups/:id/rehearse', async (req, res) => {
    await transaction(req.gdprActor.id, async data => {
      const b = data.backups.find(v => v.id === req.params.id); if (!b || b.status === 'EXPIRED') throw problem('Copie indisponibilă.', 404);
      const bytes = await readFile(path.join(dir, 'backups', `${b.id}.enc`));
      if (createHash('sha256').update(bytes).digest('hex') !== b.digest) throw problem('Integritatea copiei nu corespunde.', 503);
      const copy = decrypt(bytes); b.replayed = sanitizeBackup(copy, data);
      if (sanitizeBackup(structuredClone(copy), data) !== 0) throw problem('Verificarea reaplicării a eșuat.', 503);
      b.rehearsedAt = isoNow(); b.status = 'REHEARSED'; b.checkpoint = disk.verify(data);
    }, 'RESTORE_REHEARSED'); res.json({ok: true});
  });
  router.get('/backups/:id/recovery', async (req, res) => {
    const data = await disk.load(), b = data.backups.find(v => v.id === req.params.id);
    if (!b || b.status === 'EXPIRED') throw problem('Copie indisponibilă.', 404);
    const bytes = await readFile(path.join(dir, 'backups', `${b.id}.enc`));
    if (createHash('sha256').update(bytes).digest('hex') !== b.digest) throw problem('Copie alterată.', 503);
    const copy = decrypt(bytes), replayed = sanitizeBackup(copy, data);
    if (sanitizeBackup(structuredClone(copy), data)) throw problem('Reaplicarea nu a fost verificată.', 503);
    copy.recovery = {backupId: b.id, at: isoNow(), replayed, checkpoint: disk.verify(data), warning: 'Import exclusiv în mediu izolat. Revalidează cu registrul actual înainte de redeschiderea producției.'};
    await transaction(req.gdprActor.id, () => {}, 'RECOVERY_EXPORTED');
    res.attachment(`${b.id}-recovery.enc`).type('application/octet-stream').send(encrypt(copy));
  });
  router.delete('/backups/:id', async (req, res) => {
    if (req.body.confirmation !== 'CONFIRM ȘTERGERE') throw problem('Confirmă expirarea copiei.');
    await transaction(req.gdprActor.id, async data => {
      const b = data.backups.find(v => v.id === req.params.id); if (!b) throw problem('Copie inexistentă.', 404);
      if (b.status === 'EXPIRED') return;
      const file = path.join(dir, 'backups', `${b.id}.enc`);
      try { await unlink(file); } catch (error) { if (error.code !== 'ENOENT') throw error; }
      try { await readFile(file); throw problem('Copie încă prezentă.', 503); } catch (error) { if (error.code !== 'ENOENT') throw error; }
      b.status = 'EXPIRED'; b.expiredAt = isoNow();
    }, 'BACKUP_EXPIRED'); res.json({ok: true});
  });
  router.use((error, _req, res, _next) => res.status(error.status || 500).json({ok: false, error: error.status ? error.message : 'Operațiunea GDPR nu a reușit. Datele nu au fost declarate verificate; consultă registrul și logul tehnic.'}));
  return {router, consentRouter, consentAllowsStatistics, auth, view, transaction, preview, execute, retry, runJob, manualDelete, assertWritable, updateContact, visibleContacts, sanitizeBackup, decrypt, dir};
}
