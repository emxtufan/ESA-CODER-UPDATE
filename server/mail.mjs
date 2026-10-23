// Email notification for contact submissions. SMTP settings are edited in the admin and
// kept in data/smtp.json (data/ is not in git); the password is never sent back to the browser.
import nodemailer from 'nodemailer';
import {mkdir, readFile, rename, writeFile} from 'node:fs/promises';
import path from 'node:path';

const LABELS = {
  name: 'Nume', email: 'Email', phone: 'Telefon', country: 'Țară', projectType: 'Tip proiect', pages: 'Pagini',
  budget: 'Buget', preferred_response_method: 'Răspuns preferat', message: 'Mesaj',
};
const DEFAULTS = {
  enabled: false, host: '', port: 587, secure: false, user: '', pass: '', from: '', to: '',
  // confirmation sent to the visitor; {name} is replaced with their name
  autoReply: true,
  replySubject: 'Am primit mesajul tău',
  replyText:
    'Bună, {name},\n\nÎți mulțumim că ne-ai scris! Am primit mesajul tău și revenim cu un răspuns în cel mai scurt timp.\n\nO zi frumoasă,\nEchipa ESA Coder Solutions',
};

export function createMailer(file) {
  async function load() {
    try {
      return {...DEFAULTS, ...JSON.parse(await readFile(file, 'utf8'))};
    } catch (err) {
      if (err.code === 'ENOENT') return {...DEFAULTS};
      throw err;
    }
  }

  // What the admin sees: everything except the password.
  async function publicSettings() {
    const {pass, ...rest} = await load();
    return {...rest, hasPass: !!pass};
  }

  // Empty password = keep the saved one.
  async function save(input) {
    const current = await load();
    const next = {
      enabled: !!input.enabled,
      host: String(input.host ?? '').trim(),
      port: Number(input.port) || 587,
      secure: !!input.secure,
      user: String(input.user ?? '').trim(),
      pass: input.pass ? String(input.pass) : current.pass,
      from: String(input.from ?? '').trim(),
      to: String(input.to ?? '').trim(),
      autoReply: !!input.autoReply,
      replySubject: String(input.replySubject ?? '').trim() || DEFAULTS.replySubject,
      replyText: String(input.replyText ?? '').trim() || DEFAULTS.replyText,
    };
    if (next.enabled && (!next.host || !next.to)) return {error: 'Completează serverul SMTP și adresa care primește cererile.'};
    await mkdir(path.dirname(file), {recursive: true});
    const tmp = `${file}.${process.pid}.tmp`;
    await writeFile(tmp, JSON.stringify(next, null, 2) + '\n', 'utf8');
    await rename(tmp, file);
    return {settings: await publicSettings()};
  }

  const transportFor = (s) =>
    nodemailer.createTransport({
      host: s.host, port: s.port, secure: s.secure,
      auth: s.user ? {user: s.user, pass: s.pass} : undefined,
    });

  async function sendReply(s, entry, to = entry.email) {
    await transportFor(s).sendMail({
      from: s.from || s.user,
      to,
      replyTo: s.to.split(',')[0].trim(),
      subject: s.replySubject,
      text: s.replyText.replaceAll('{name}', entry.name || ''),
    });
  }

  async function send(s, entry) {
    const transport = transportFor(s);
    const rows = Object.entries(LABELS).filter(([k]) => entry[k]).map(([k, label]) => `${label}: ${entry[k]}`);
    await transport.sendMail({
      from: s.from || s.user,
      to: s.to,
      replyTo: entry.email || undefined,
      subject: `Cerere nouă de la ${entry.name}`,
      text: rows.join('\n') + `\n\nPrimită: ${new Date(entry.createdAt).toLocaleString('ro-RO')}`,
    });
  }

  // Called after a submission is stored; failures are logged, never shown to the visitor.
  async function notify(entry) {
    const s = await load();
    if (!s.enabled || !s.host || !s.to) return;
    try {
      await send(s, entry);
    } catch (err) {
      console.error('[contact] email notification failed:', err.message);
    }
    if (!s.autoReply || !entry.email) return;
    try {
      await sendReply(s, entry);
    } catch (err) {
      console.error('[contact] auto-reply failed:', err.message);
    }
  }

  async function test() {
    const s = await load();
    if (!s.host || !s.to) throw new Error('Salvează mai întâi setările SMTP.');
    await send(s, {name: 'Test admin', email: '', message: 'Email de test din admin — setările SMTP funcționează.', createdAt: new Date().toISOString()});
    // also show what visitors receive, sent to the notification address
    if (s.autoReply) await sendReply(s, {name: 'Test admin'}, s.to);
  }

  return {publicSettings, save, notify, test};
}
