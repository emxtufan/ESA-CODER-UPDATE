import {Fragment, useCallback, useEffect, useMemo, useState, type FormEvent} from 'react';
import {api, type ContactRequest, type ContactStatus, type RecaptchaSettings, type SmtpSettings} from './api';

type Notify = (t: string, e?: boolean) => void;

export const STATUS: {key: ContactStatus; label: string}[] = [
  {key: 'new', label: 'Nouă'},
  {key: 'in_progress', label: 'În lucru'},
  {key: 'replied', label: 'Răspuns trimis'},
  {key: 'done', label: 'Finalizată'},
  {key: 'rejected', label: 'Respinsă'},
];
const statusOf = (c: ContactRequest): ContactStatus => c.status ?? 'new';
const labelOf = (k: ContactStatus) => STATUS.find((s) => s.key === k)!.label;

const when = (iso: string) => new Date(iso).toLocaleString('ro-RO', {day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'});
function ago(iso: string) {
  const min = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 1) return 'acum';
  if (min < 60) return `acum ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `acum ${h} h`;
  const d = Math.round(h / 24);
  return d < 30 ? `acum ${d} ${d === 1 ? 'zi' : 'zile'}` : new Date(iso).toLocaleDateString('ro-RO', {day: 'numeric', month: 'short', year: 'numeric'});
}

// Contact form submissions (data/contacts.json), newest first, each with a status and an internal note.
export default function Requests({onLogout, notify}: {onLogout: () => void; notify: Notify}) {
  const [items, setItems] = useState<ContactRequest[] | null>(null);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<ContactStatus | 'all'>('all');
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState<string | null>(null);

  const load = useCallback(async () => {
    const r = await api.contacts();
    if (r.status === 401) return onLogout();
    if (r.ok) {
      setItems(r.items);
      setError('');
    } else setError(r.error || 'Nu am putut încărca cererile.');
  }, [onLogout]);
  useEffect(() => {
    load();
    const t = window.setInterval(load, 60000);
    return () => window.clearInterval(t);
  }, [load]);

  const patch = async (id: string, change: {status?: ContactStatus; note?: string}) => {
    const r = await api.updateContact(id, change);
    if (r.status === 401) return onLogout();
    if (!r.ok) return notify(r.error || 'Nu am putut salva.', true);
    setItems((all) => all && all.map((c) => (c.id === id ? r.item : c)));
    if (change.status) notify(`Status: ${labelOf(change.status)}.`);
    else notify('Notița a fost salvată.');
  };
  const remove = async (c: ContactRequest) => {
    if (!window.confirm(`Ștergi definitiv cererea de la ${c.name}?`)) return;
    const r = await api.deleteContact(c.id);
    if (r.status === 401) return onLogout();
    if (!r.ok) return notify(r.error || 'Nu am putut șterge.', true);
    setItems((all) => all && all.filter((x) => x.id !== c.id));
    setOpen(null);
    notify('Cererea a fost ștearsă.');
  };

  const counts = useMemo(() => {
    const m: Record<string, number> = {all: items?.length ?? 0};
    for (const c of items ?? []) m[statusOf(c)] = (m[statusOf(c)] ?? 0) + 1;
    return m;
  }, [items]);
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (items ?? []).filter(
      (c) =>
        (filter === 'all' || statusOf(c) === filter) &&
        (!q || [c.name, c.email, c.phone, c.message, c.projectType, c.note].some((v) => v?.toLowerCase().includes(q))),
    );
  }, [items, filter, query]);

  return (
    <main className="a-main a-analytics">
      <header className="a-bar">
        <div className="a-bar-title">
          <span className="a-crumb">Formular de contact</span>
          <h1>Cereri</h1>
        </div>
        <div className="a-bar-actions">
          <button className="a-btn a-btn-ghost" onClick={load}>Reîmprospătează</button>
        </div>
      </header>
      <div className="a-content">
        {error && <p className="a-error">{error}</p>}

        <div className="rq-stats">
          {STATUS.map((s) => (
            <button key={s.key} className={`rq-stat${filter === s.key ? ' is-active' : ''}`} onClick={() => setFilter(filter === s.key ? 'all' : s.key)}>
              <span className={`rq-dot rq-${s.key}`} />
              <span className="rq-stat-label">{s.label}</span>
              <b>{counts[s.key] ?? 0}</b>
            </button>
          ))}
        </div>

        <section className="a-card rq-card">
          <div className="rq-toolbar">
            <div className="rq-tabs" role="tablist">
              <button role="tab" aria-selected={filter === 'all'} className={filter === 'all' ? 'is-active' : ''} onClick={() => setFilter('all')}>
                Toate <span>{counts.all}</span>
              </button>
              {STATUS.map((s) => (
                <button key={s.key} role="tab" aria-selected={filter === s.key} className={filter === s.key ? 'is-active' : ''} onClick={() => setFilter(s.key)}>
                  {s.label} <span>{counts[s.key] ?? 0}</span>
                </button>
              ))}
            </div>
            <input className="a-input rq-search" type="search" placeholder="Caută după nume, email, mesaj…" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>

          {!items ? (
            <div className="a-center"><span className="a-spinner" /></div>
          ) : !shown.length ? (
            <p className="a-empty">{items.length ? 'Nicio cerere nu se potrivește filtrului.' : 'Nicio cerere încă.'}</p>
          ) : (
            <div className="a-table-wrap">
              <table className="rq-table">
                <thead>
                  <tr><th>Client</th><th>Proiect</th><th>Primită</th><th>Status</th><th aria-label="Detalii" /></tr>
                </thead>
                <tbody>
                  {shown.map((c) => {
                    const st = statusOf(c);
                    const isOpen = open === c.id;
                    return (
                      <Fragment key={c.id}>
                        <tr className={`rq-row${isOpen ? ' is-open' : ''}${st === 'new' ? ' is-new' : ''}`} onClick={() => setOpen(isOpen ? null : c.id)}>
                          <td>
                            <div className="rq-client">
                              <span className="rq-avatar" aria-hidden>{(c.name || '?').trim().charAt(0).toUpperCase()}</span>
                              <div>
                                <div className="rq-name">{c.name}</div>
                                <div className="a-muted">{c.email}</div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div>{c.projectType || '—'}</div>
                            <div className="a-muted">{[c.pages && `${c.pages} pagini`, c.budget].filter(Boolean).join(' · ')}</div>
                          </td>
                          <td title={when(c.createdAt)} className="rq-nowrap">{ago(c.createdAt)}</td>
                          <td onClick={(e) => e.stopPropagation()}>
                            <select className={`rq-status rq-${st}`} value={st} onChange={(e) => patch(c.id, {status: e.target.value as ContactStatus})} aria-label="Status">
                              {STATUS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                            </select>
                          </td>
                          <td className="rq-chevron" aria-hidden>{isOpen ? '▴' : '▾'}</td>
                        </tr>
                        {isOpen && (
                          <tr className="rq-detail">
                            <td colSpan={5}>
                              <Detail c={c} onNote={(note) => patch(c.id, {note})} onReplied={() => st !== 'replied' && patch(c.id, {status: 'replied'})} onDelete={() => remove(c)} />
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function Detail({c, onNote, onReplied, onDelete}: {c: ContactRequest; onNote: (n: string) => void; onReplied: () => void; onDelete: () => void}) {
  const [note, setNote] = useState(c.note ?? '');
  const subject = encodeURIComponent(`Re: cererea ta către ESA Coder Solutions`);
  const facts: [string, React.ReactNode][] = [
    ['Email', <a href={`mailto:${c.email}`}>{c.email}</a>],
    ['Telefon', c.phone ? <a href={`tel:${c.phone}`}>{c.phone}</a> : null],
    ['Țară', c.country],
    ['Răspuns preferat', c.preferred_response_method],
    ['Tip proiect', c.projectType],
    ['Pagini', c.pages],
    ['Buget', c.budget],
    ['Primită', when(c.createdAt)],
  ];
  return (
    <div className="rq-detail-grid">
      <div>
        <div className="rq-label">Mesaj</div>
        <p className="rq-message">{c.message || <span className="a-muted">Fără mesaj.</span>}</p>
        <div className="rq-label">Notiță internă</div>
        <textarea
          className="a-input rq-note"
          rows={3}
          placeholder="Doar pentru tine: ce ați discutat, ofertă, următorul pas…"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onBlur={() => note !== (c.note ?? '') && onNote(note)}
        />
      </div>
      <div>
        <dl className="rq-facts">
          {facts.filter(([, v]) => v).map(([k, v]) => (
            <Fragment key={k}><dt>{k}</dt><dd>{v}</dd></Fragment>
          ))}
        </dl>
        <div className="rq-actions">
          <a className="a-btn a-btn-primary" href={`mailto:${c.email}?subject=${subject}`} onClick={onReplied}>Răspunde pe email</a>
          {c.phone && c.preferred_response_method === 'WhatsApp' && (
            <a className="a-btn a-btn-ghost" href={`https://wa.me/${c.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer">WhatsApp</a>
          )}
          <button className="a-btn a-btn-ghost is-danger" onClick={onDelete}>Șterge</button>
        </div>
      </div>
    </div>
  );
}

// Email notifications and anti-spam, in their own admin section.
export function EmailSettings({onLogout, notify}: {onLogout: () => void; notify: Notify}) {
  return (
    <main className="a-main a-analytics">
      <header className="a-bar">
        <div className="a-bar-title">
          <span className="a-crumb">Formular de contact</span>
          <h1>Email și anti-spam</h1>
        </div>
      </header>
      <div className="a-content">
        <Smtp onLogout={onLogout} notify={notify} />
        <Recaptcha onLogout={onLogout} notify={notify} />
      </div>
    </main>
  );
}

function Smtp({onLogout, notify}: {onLogout: () => void; notify: (t: string, e?: boolean) => void}) {
  const [s, setS] = useState<SmtpSettings | null>(null);
  const [busy, setBusy] = useState(false);
  const [loadError, setLoadError] = useState('');
  useEffect(() => {
    api.smtp().then((r) => {
      if (r.status === 401) return onLogout();
      if (r.ok) setS({...r.settings, pass: ''});
      else setLoadError(r.status === 404 ? 'Serverul rulează o versiune veche — repornește-l ca să apară aceste setări.' : r.error || 'Nu am putut încărca setările.');
    });
  }, [onLogout]);
  if (!s)
    return loadError ? (
      <section className="a-card a-panel">
        <h2>Notificare pe email</h2>
        <p className="a-error">{loadError}</p>
      </section>
    ) : null;
  const set = (patch: Partial<SmtpSettings>) => setS({...s, ...patch});

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const r = await api.saveSmtp(s);
    setBusy(false);
    if (r.status === 401) return onLogout();
    if (r.ok) {
      setS({...r.settings, pass: ''});
      notify('Setările de email au fost salvate.');
    } else notify(r.error || 'Nu am putut salva.', true);
  };
  const test = async () => {
    setBusy(true);
    const r = await api.testSmtp();
    setBusy(false);
    notify(r.ok ? `Email de test trimis la ${s.to}.` : `Trimiterea a eșuat: ${r.error}`, !r.ok);
  };

  const text = (key: 'host' | 'user' | 'from' | 'to', label: string, placeholder = '', type = 'text') => (
    <label className="a-field">
      <span className="a-field-label">{label}</span>
      <input className="a-input" type={type} placeholder={placeholder} value={s[key]} onChange={(e) => set({[key]: e.target.value})} />
    </label>
  );

  return (
    <section className="a-card a-panel">
      <h2>Notificare pe email</h2>
      <p className="a-muted a-note">Fiecare cerere nouă se trimite și pe email, prin serverul SMTP de mai jos (ex. Gmail: smtp.gmail.com, port 465, SSL, cu o parolă de aplicație). La „Primește cererile la” poți pune mai multe adrese, separate prin virgulă.</p>
      <form onSubmit={save}>
        <label className="a-field is-inline">
          <span className="a-field-label">Trimite cererile pe email</span>
          <button type="button" role="switch" aria-checked={s.enabled} className={`a-switch${s.enabled ? ' is-on' : ''}`} onClick={() => set({enabled: !s.enabled})} />
        </label>
        {text('to', 'Primește cererile la', 'tu@exemplu.ro', 'email')}
        {text('host', 'Server SMTP', 'smtp.gmail.com')}
        <label className="a-field">
          <span className="a-field-label">Port</span>
          <input className="a-input" type="number" value={s.port} onChange={(e) => set({port: Number(e.target.value)})} />
        </label>
        <label className="a-field is-inline">
          <span className="a-field-label">Conexiune SSL/TLS directă (de obicei pentru portul 465)</span>
          <button type="button" role="switch" aria-checked={s.secure} className={`a-switch${s.secure ? ' is-on' : ''}`} onClick={() => set({secure: !s.secure})} />
        </label>
        {text('user', 'Utilizator', 'tu@exemplu.ro')}
        <label className="a-field">
          <span className="a-field-label">Parolă</span>
          <input className="a-input" type="password" autoComplete="new-password" placeholder={s.hasPass ? 'Salvată — lasă gol ca să o păstrezi' : ''} value={s.pass ?? ''} onChange={(e) => set({pass: e.target.value})} />
        </label>
        {text('from', 'Expeditor (opțional, implicit utilizatorul)', 'Site <noreply@exemplu.ro>')}
        <label className="a-field is-inline">
          <span className="a-field-label">Trimite clientului o confirmare automată</span>
          <button type="button" role="switch" aria-checked={s.autoReply} className={`a-switch${s.autoReply ? ' is-on' : ''}`} onClick={() => set({autoReply: !s.autoReply})} />
        </label>
        {s.autoReply && (
          <>
            <label className="a-field">
              <span className="a-field-label">Subiect confirmare</span>
              <input className="a-input" value={s.replySubject} onChange={(e) => set({replySubject: e.target.value})} />
            </label>
            <label className="a-field">
              <span className="a-field-label">Mesaj confirmare ({'{name}'} = numele clientului)</span>
              <textarea className="a-input" rows={7} value={s.replyText} onChange={(e) => set({replyText: e.target.value})} />
            </label>
          </>
        )}
        <div className="a-bar-actions" style={{padding: '10px 16px'}}>
          <button className="a-btn a-btn-primary" disabled={busy}>Salvează</button>
          <button type="button" className="a-btn a-btn-ghost" disabled={busy || !s.host || !s.to} onClick={test}>Trimite un email de test</button>
        </div>
      </form>
    </section>
  );
}

function Recaptcha({onLogout, notify}: {onLogout: () => void; notify: (t: string, e?: boolean) => void}) {
  const [s, setS] = useState<RecaptchaSettings | null>(null);
  const [busy, setBusy] = useState(false);
  const [loadError, setLoadError] = useState('');
  useEffect(() => {
    api.recaptcha().then((r) => {
      if (r.status === 401) return onLogout();
      if (r.ok) setS({...r.settings, secretKey: ''});
      else setLoadError(r.status === 404 ? 'Serverul rulează o versiune veche — repornește-l ca să apară aceste setări.' : r.error || 'Nu am putut încărca setările.');
    });
  }, [onLogout]);
  if (!s)
    return loadError ? (
      <section className="a-card a-panel">
        <h2>reCAPTCHA (anti-spam)</h2>
        <p className="a-error">{loadError}</p>
      </section>
    ) : null;
  const set = (patch: Partial<RecaptchaSettings>) => setS({...s, ...patch});

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const r = await api.saveRecaptcha(s);
    setBusy(false);
    if (r.status === 401) return onLogout();
    if (r.ok) {
      setS({...r.settings, secretKey: ''});
      notify('Setările reCAPTCHA au fost salvate.');
    } else notify(r.error || 'Nu am putut salva.', true);
  };

  return (
    <section className="a-card a-panel">
      <h2>reCAPTCHA (anti-spam)</h2>
      <p className="a-muted a-note">
        Google reCAPTCHA v3, invizibil pentru vizitatori. Creează cheile la google.com/recaptcha/admin, tip „Bazat pe scor (v3)”, și adaugă domeniul site-ului (și localhost, ca să poți testa local).
      </p>
      <form onSubmit={save}>
        <label className="a-field is-inline">
          <span className="a-field-label">Verifică formularul de contact cu reCAPTCHA</span>
          <button type="button" role="switch" aria-checked={s.enabled} className={`a-switch${s.enabled ? ' is-on' : ''}`} onClick={() => set({enabled: !s.enabled})} />
        </label>
        <label className="a-field">
          <span className="a-field-label">Cheia site-ului (site key)</span>
          <input className="a-input" value={s.siteKey} onChange={(e) => set({siteKey: e.target.value})} />
        </label>
        <label className="a-field">
          <span className="a-field-label">Cheia secretă (secret key)</span>
          <input className="a-input" type="password" autoComplete="new-password" placeholder={s.hasSecret ? 'Salvată — lasă gol ca să o păstrezi' : ''} value={s.secretKey ?? ''} onChange={(e) => set({secretKey: e.target.value})} />
        </label>
        <label className="a-field">
          <span className="a-field-label">Scor minim (0–1; 0.5 recomandat, mai mare = mai strict)</span>
          <input className="a-input" type="number" min={0} max={1} step={0.1} value={s.minScore} onChange={(e) => set({minScore: Number(e.target.value)})} />
        </label>
        <div className="a-bar-actions" style={{padding: '10px 16px'}}>
          <button className="a-btn a-btn-primary" disabled={busy}>Salvează</button>
        </div>
      </form>
    </section>
  );
}
