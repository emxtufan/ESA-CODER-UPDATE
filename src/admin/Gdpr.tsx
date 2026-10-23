import {useCallback, useEffect, useState, type FormEvent, type ReactNode} from 'react';
import './gdpr.css';

type Row = Record<string, unknown>;
type Actor = {id: string; name: string; role: string; mfa: boolean};
type Result = {ok: boolean; error?: string; bootstrap?: boolean; canBootstrap?: boolean; actor?: Actor | null; preview?: Row; items?: Row[]} & Record<string, unknown>;
type Data = {registry: Row[]; policies: Row[]; requests: Row[]; holds: Row[]; operations: Row[]; audit: Row[]; users: Row[]; vendors: Row[]; vendorRecords: Row[]; incidents: Row[]; backups: Row[]; alerts: Row[]; checks: Row[]; backupSettings: Row; operator: Row; checkpoint: Row; job: Row; backupKeyConfigured: boolean};
type Values = Record<string, string | boolean>;
type Field = {key: string; label: string; type?: string; options?: string[]; optional?: boolean; hint?: string};
const str = (value: unknown): string => value == null ? '—' : typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value);
const textField = (key: string, label: string, type = 'text', optional = false): Field => ({key, label, type, optional});
const choice = (key: string, label: string, options: string[]): Field => ({key, label, options});
const sources = ['contacts', 'visits', 'analytics_days', 'requests', 'audit', 'consents', 'deletion_evidence'];
const tabs = ['Dashboard GDPR', 'Registrul datelor', 'Politici de retenție', 'Cereri GDPR', 'Ștergeri și anonimizări', 'Jurnal de audit', 'Backup și restaurare', 'Furnizori și procesatori', 'Incidente de securitate', 'Rapoarte pentru audit', 'Acces GDPR'];
const nextStates: Record<string, string[]> = {RECEIVED: ['IDENTITY_VERIFICATION'], IDENTITY_VERIFICATION: ['IN_REVIEW', 'REJECTED'], IN_REVIEW: ['APPROVED', 'REJECTED'], APPROVED: [], REJECTED: ['CLOSED'], EXECUTED: ['CLOSED'], CLOSED: []};
const safeInitial = (row?: Row): Values => Object.fromEntries(Object.entries(row || {}).filter(([, v]) => ['string', 'number', 'boolean'].includes(typeof v)).map(([k, v]) => [k, typeof v === 'boolean' ? v : String(v)]));

async function request(endpoint: string, method = 'GET', body?: Values | Row): Promise<Result> {
  const response = await fetch(`/api/admin/gdpr${endpoint}`, {method, credentials: 'same-origin', headers: {'x-admin': '1', ...(body ? {'Content-Type': 'application/json'} : {})}, ...(body ? {body: JSON.stringify(body)} : {})});
  const result: Result = await response.json();
  if (!response.ok || !result.ok) throw new Error(result.error || 'Operațiunea nu a reușit.');
  return result;
}

function Form({title, fields, initial, submit, label = 'Salvează', children}: {title: string; fields: Field[]; initial?: Values; submit: (values: Values) => Promise<void>; label?: string; children?: ReactNode}) {
  const [values, setValues] = useState<Values>(initial || {}), [busy, setBusy] = useState(false), [error, setError] = useState('');
  async function send(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError('');
    try { await submit(values); } catch (e) { setError(e instanceof Error ? e.message : 'Eroare de comunicare.'); }
    finally { setBusy(false); }
  }
  return <form className="a-card gdpr-form" onSubmit={send} aria-label={title}>
    <h2>{title}</h2>{children}<div className="gdpr-fields">
      {fields.map(f => <label className="a-field" key={f.key}>
        <span className="a-field-label">{f.label}{f.optional ? '' : ' *'}</span>
        {f.type === 'checkbox' ? <input type="checkbox" checked={values[f.key] === true} onChange={e => setValues({...values, [f.key]: e.target.checked})} /> : f.options ? <select className="a-input" required={!f.optional} value={String(values[f.key] || '')} onChange={e => setValues({...values, [f.key]: e.target.value})}><option value="">Selectează</option>{f.options.map(v => <option key={v}>{v}</option>)}</select> : f.type === 'textarea' ? <textarea className="a-input" rows={3} required={!f.optional} maxLength={2000} value={String(values[f.key] || '')} onChange={e => setValues({...values, [f.key]: e.target.value})} /> : <input className="a-input" type={f.type || 'text'} required={!f.optional} maxLength={f.type === 'password' ? 256 : 1500} autoComplete={f.type === 'password' ? 'new-password' : 'off'} value={String(values[f.key] || '')} onChange={e => setValues({...values, [f.key]: e.target.value})} />}
        {f.hint && <small>{f.hint}</small>}
      </label>)}
    </div>{error && <p className="a-error" role="alert">{error}</p>}<button className="a-btn a-btn-primary" disabled={busy}>{busy ? 'Se procesează…' : label}</button>
  </form>;
}

function Table({rows, columns, action}: {rows: Row[]; columns: [string, string][]; action?: (row: Row) => ReactNode}) {
  const [query, setQuery] = useState(''), [status, setStatus] = useState(''), [page, setPage] = useState(0);
  const statuses = [...new Set(rows.map(r => typeof r.status === 'string' ? r.status : '').filter(Boolean))];
  const filtered = rows.filter(row => (!status || row.status === status) && JSON.stringify(row).toLocaleLowerCase('ro').includes(query.toLocaleLowerCase('ro')));
  const pageIndex = Math.min(page, Math.max(0, Math.ceil(filtered.length / 25) - 1));
  return <div className="a-card gdpr-table">
    <div className="gdpr-tools"><label>Caută <input className="a-input" type="search" value={query} onChange={e => {setQuery(e.target.value); setPage(0);}} /></label>{statuses.length > 0 && <label>Status <select className="a-input" value={status} onChange={e => {setStatus(e.target.value); setPage(0);}}><option value="">Toate</option>{statuses.map(s => <option key={s}>{s}</option>)}</select></label>}<span className="a-muted">{filtered.length} înregistrări</span></div>
    <div className="a-table-wrap"><table><thead><tr>{columns.map(([key, label]) => <th key={key} scope="col">{label}</th>)}{action && <th scope="col">Acțiuni</th>}</tr></thead><tbody>{filtered.slice(pageIndex * 25, pageIndex * 25 + 25).map((row, i) => <tr key={String(row.id || i)}>{columns.map(([key]) => <td key={key}>{str(row[key])}</td>)}{action && <td><div className="gdpr-actions">{action(row)}</div></td>}</tr>)}</tbody></table></div>
    {!filtered.length && <p>Nu există înregistrări pentru selecția curentă.</p>}
    {filtered.length > 25 && <div className="gdpr-tools"><button className="a-btn a-btn-ghost" disabled={pageIndex === 0} onClick={() => setPage(pageIndex - 1)}>Înapoi</button><span>{pageIndex + 1} / {Math.ceil(filtered.length / 25)}</span><button className="a-btn a-btn-ghost" disabled={(pageIndex + 1) * 25 >= filtered.length} onClick={() => setPage(pageIndex + 1)}>Înainte</button></div>}
  </div>;
}

export default function Gdpr() {
  const [access, setAccess] = useState<{bootstrap: boolean; canBootstrap: boolean; actor: Actor | null} | null>(null), [data, setData] = useState<Data | null>(null);
  const [tab, setTab] = useState(0), [selected, setSelected] = useState<Row | null>(null), [preview, setPreview] = useState<Row | null>(null), [matches, setMatches] = useState<Row[]>([]);
  const [error, setError] = useState(''), [message, setMessage] = useState(''), [busy, setBusy] = useState(false), [period, setPeriod] = useState({from: '', to: ''});
  const [mfaSecret, setMfaSecret] = useState('');
  const load = useCallback(async () => {
    const a = await request('/access');
    setAccess({bootstrap: !!a.bootstrap, canBootstrap: !!a.canBootstrap, actor: a.actor || null});
    if (a.actor) setData(await request('') as unknown as Data); else setData(null);
  }, []);
  useEffect(() => { load().catch(e => setError(e.message)); }, [load]);
  const write = async (url: string, method: string, values?: Row) => {
    await request(url, method, values); await load(); setMessage('Operațiunea a fost înregistrată.');
  };
  const act = async (fn: () => Promise<void>) => {
    setBusy(true); setError(''); setMessage('');
    try { await fn(); } catch (e) { setError(e instanceof Error ? e.message : 'Eroare de comunicare.'); }
    finally { setBusy(false); }
  };
  const download = async (url: string) => {
    const response = await fetch(`/api/admin/gdpr${url}`, {credentials: 'same-origin'});
    if (!response.ok) { const r = await response.json(); throw new Error(r.error || 'Export indisponibil.'); }
    const blob = URL.createObjectURL(await response.blob()), a = document.createElement('a');
    a.href = blob; a.download = response.headers.get('content-disposition')?.match(/filename="?([^";]+)/)?.[1] || 'raport-gdpr'; a.click();
    setTimeout(() => URL.revokeObjectURL(blob), 30000);
  };
  const button = (label: string, fn: () => Promise<void>) => <button className="a-btn a-btn-ghost" disabled={busy} onClick={() => act(fn)}>{label}</button>;
  const admin = access?.actor?.role === 'gdpr_admin';
  const simulate = async (values: Row) => { const r = await request('/preview', 'POST', values); setPreview(r.preview || null); };
  const policyFields: Field[] = [choice('source', 'Sursa datelor', sources), textField('days', 'Retenție în zile (aprobată pentru scop)', 'number'), choice('action', 'Acțiune la expirare', ['delete', 'anonymize']), textField('statuses', 'Statusuri contact separate prin virgulă; gol = toate', 'text', true), textField('limit', 'Maximum înregistrări pe execuție (1–100)', 'number'), textField('owner', 'Responsabil intern'), textField('justification', 'Justificare juridică și operațională', 'textarea')];
  const previewBox = preview && <Form key={str(preview.token)} title="Rezultatul simulării" fields={[textField('confirmation', 'Scrie CONFIRM ȘTERGERE pentru executare')]} submit={async values => { const r = await request('/execute', 'POST', {...values, token: preview.token}); setPreview(null); await load(); setMessage(`Operațiune: ${str((r.operation as Row).id)} — ${str((r.operation as Row).status)}`); }} label="Execută selecția simulată">
    <p>{str(preview.count)} înregistrări în acest lot / {str(preview.matched)} eligibile. Blocate: {str(preview.excluded)}. Fără dată validă: {str(preview.undated)}. Acțiune: {str(preview.action)}. Simularea expiră la {str(preview.expiresAt)}.</p><p className="a-muted">Ștergerea este ireversibilă în aplicație. Copiile externe se verifică separat. O politică neaprobată poate fi simulată, dar nu executată.</p>
  </Form>;
  return <main className="a-main gdpr">
    <header className="a-bar"><div className="a-bar-title"><span className="a-crumb">Administrare responsabilă a datelor</span><h1>GDPR &amp; Compliance</h1></div><div className="a-bar-actions">{button('Reîncarcă', load)}{access?.actor && button('Ieșire GDPR', async () => { await request('/logout', 'POST'); await load(); })}</div></header>
    <div className="a-content">
      {error && <p className="a-error" role="alert">{error}</p>}{message && <p role="status">{message}</p>}
      {!access ? <p>Se verifică accesul…</p> : !access.actor ? <>
        <p>Accesul la date și operațiunile GDPR necesită un cont nominal, separat de parola comună a site-ului. Politicile nu șterg automat date până la aprobarea și activarea lor explicită.</p>
        {access.bootstrap && (access.canBootstrap ? <Form title="Configurează primul responsabil GDPR" fields={[textField('id', 'Identificator cont (litere mici, cifre, punct, cratimă)'), textField('name', 'Nume responsabil'), textField('password', 'Parolă nouă (minimum 14 caractere)', 'password')]} submit={values => write('/bootstrap', 'POST', values)} label="Creează accesul GDPR" /> : <p>Configurarea primului cont este disponibilă numai <a className="a-btn a-btn-ghost" href="/admin">administratorului website-ului</a>.</p>)}
        {!access.bootstrap && <Form title="Autentificare GDPR" fields={[textField('id', 'Identificator cont'), textField('password', 'Parolă', 'password'), textField('code', 'Cod MFA, dacă este activ', 'text', true)]} submit={values => write('/login', 'POST', values)} label="Intră în modulul GDPR" />}
      </> : data && <>
        <p className="a-muted">{access.actor.name} · {access.actor.role} · Sesiune de o oră. Verificările PASS sunt dovezi tehnice limitate, fără certificare juridică.</p>
        <nav className="gdpr-tabs" aria-label="GDPR și conformitate">{tabs.map((name, i) => <button className={`a-btn ${tab === i ? 'a-btn-primary' : 'a-btn-ghost'}`} aria-current={tab === i ? 'page' : undefined} key={name} onClick={() => {setTab(i); setSelected(null); setPreview(null); setMatches([]);}}>{name}</button>)}</nav>
        {tab === 0 && <>
          <div className="gdpr-metrics">{[['Cereri deschise', data.requests.filter(r => r.status !== 'CLOSED').length], ['Operațiuni verificate', data.operations.filter(o => o.status === 'VERIFIED').length], ['Politici aprobate', data.policies.filter(p => p.approvedAt).length], ['Alerte nerezolvate', data.alerts.filter(a => !a.resolved).length]].map(([label, value]) => <div className="a-card" key={label}><strong>{value}</strong><span>{label}</span></div>)}</div>
          <h2>Audit Readiness Check</h2><Table rows={data.checks} columns={[["id", "Verificare"], ["status", "Stare"], ["evidence", "Dovadă"], ["action", "Acțiune necesară"]]} />
          <h2>Alerte operaționale</h2><Table rows={data.alerts} columns={[["at", "Data"], ["code", "Problemă"], ["operationId", "Operațiune"], ["resolved", "Rezolvată"]]} />
        </>}
        {tab === 1 && <>
          <p>Numărul materialelor publice reprezintă testimonialele, nu numărul tuturor persoanelor din imagini. Valorile neconfirmate trebuie verificate de responsabil.</p>
          <Table rows={data.registry} columns={[["name", "Categorie"], ["count", "Înregistrări"], ["purpose", "Scop"], ["legalBasis", "Temei juridic"], ["storage", "Stocare"], ["recipients", "Destinatari"], ["retention", "Retenție documentată"], ["policies", "Politici efective"], ["owner", "Responsabil"], ["transfers", "Transferuri"]]} action={admin ? row => <button className="a-btn a-btn-ghost" onClick={() => setSelected(row)}>Documentează</button> : undefined} />
          {admin && selected && <Form key={str(selected.id)} title={`Documentează: ${str(selected.name)}`} initial={safeInitial(selected)} fields={['purpose', 'legalBasis', 'subjects', 'recipients', 'retention', 'action', 'owner', 'transfers'].map((k, i) => textField(k, ['Scop', 'Temei juridic', 'Persoane vizate', 'Destinatari', 'Retenție / justificare', 'Acțiune la expirare', 'Responsabil', 'Transferuri și garanții'][i], 'textarea'))} submit={v => write(`/registry/${selected.id}`, 'PUT', v)} />}
        </>}
        {tab === 2 && <>
          <p>O regulă nouă sau modificată este inactivă. Aprobarea și activarea jobului sunt pași separați de salvare. Simularea nu modifică înregistrările. Jobul automat verifică regulile la fiecare 15 minute.</p>
          <Table rows={data.policies} columns={[["id", "ID"], ["source", "Sursă"], ["days", "Zile"], ["action", "Acțiune"], ["approvedBy", "Aprobată de"], ["automatic", "Automată"], ["version", "Versiune"]]} action={admin ? row => <>{button('Simulează', () => simulate({policyId: row.id}))}<button className="a-btn a-btn-ghost" onClick={() => setSelected(row)}>Editează / aprobă</button></> : undefined} />
          {admin && <>{selected && <button className="a-btn a-btn-ghost" onClick={() => setSelected(null)}>Politică nouă</button>}<Form key={str(selected?.id || 'new-policy')} title={selected ? 'Modifică politica (aprobarea se revocă)' : 'Politică nouă, inactivă'} fields={policyFields} initial={{limit: '25', ...safeInitial(selected || undefined), statuses: Array.isArray(selected?.statuses) ? selected.statuses.join(',') : ''}} submit={v => write('/policies', 'POST', {...v, id: selected?.id})} />
            {selected && <Form title="Aprobă politica salvată" fields={[textField('confirmation', 'Scrie APROB POLITICA'), textField('automatic', 'Activează execuția automată pentru această politică', 'checkbox', true)]} submit={v => write(`/policies/${selected.id}/approve`, 'POST', v)} label="Înregistrează aprobarea" />}
            {previewBox}{button('Rulează verificarea jobului', () => write('/scan', 'POST'))}<p className="a-muted">Acest buton execută regulile deja aprobate și marcate automate; pentru restul folosește Simulează.</p>
          </>}
        </>}
        {tab === 3 && <>
          <p>Termenul inițial este o lună calendaristică, fără suspendare automată pentru verificarea identității. Responsabilul verifică regulile aplicabile zilelor nelucrătoare și comunică răspunsul. Nu încărca copii de acte de identitate aici.</p>
          <Table rows={data.requests} columns={[["id", "Cerere"], ["email", "Solicitant"], ["type", "Drept"], ["status", "Stare"], ["receivedAt", "Primire"], ["dueAt", "Termen"], ["history", "Istoric"]]} action={admin ? row => <button className="a-btn a-btn-ghost" onClick={() => {setSelected(row); setMatches([]);}}>Gestionează</button> : undefined} />
          {admin && <Form title="Înregistrează cererea primită" fields={[textField('email', 'Email solicitant', 'email'), choice('type', 'Drept solicitat', ['access', 'rectification', 'erasure', 'restriction', 'portability', 'objection', 'withdrawal']), textField('receivedAt', 'Data reală a primirii; gol = acum', 'datetime-local', true), textField('note', 'Context minimizat, fără documente de identitate', 'textarea', true)]} submit={v => write('/requests', 'POST', v)} label="Înregistrează cererea" />}
          {admin && selected && (() => { const current = data.requests.find(r => r.id === selected.id) || selected; const next = nextStates[str(current.status)] || []; return <section className="gdpr-detail"><h2>{str(current.id)} · {str(current.status)}</h2>
            {next.length > 0 && <Form key={str(current.status)} title="Următorul pas" fields={[choice('status', 'Stare nouă', next), textField('evidence', 'Metoda verificării / motivarea juridică / referința răspunsului', 'textarea')]} submit={v => write(`/requests/${current.id}/transition`, 'POST', v)} />}
            {!!current.identityVerifiedAt && button('Identifică datele asociate', async () => { const r = await request(`/requests/${current.id}/matches`); setMatches(r.items || []); })}
            {matches.length > 0 && <Table rows={matches} columns={[["id", "ID înregistrare"], ["name", "Nume"], ["email", "Email"], ["createdAt", "Dată"], ["message", "Mesaj"]]} />}
            {current.status === 'APPROVED' && <>
              {['access', 'portability'].includes(str(current.type)) && button('Export date pentru verificare și transmitere', () => download(`/requests/${current.id}/export`))}
              <Form title="Execută cererea aprobată" fields={[textField('evidence', 'Dovada acțiunilor și verificării emailurilor, copiilor și datelor externe', 'textarea'), ...(current.type === 'erasure' ? [textField('confirmation', 'Scrie CONFIRM ȘTERGERE')] : []), ...(current.type === 'rectification' ? [textField('fields', 'Câmpuri corectate în JSON, de exemplu {"name":"Numele corect"}', 'textarea')] : [])]} submit={async v => { await write(`/requests/${current.id}/execute`, 'POST', {...v, ...(v.fields ? {fields: JSON.parse(String(v.fields))} : {})}); }} label="Execută și verifică">
                <p className="a-muted">Restricționarea, opoziția și retragerea blochează înregistrările asociate în aplicație. Comunicarea cu furnizorii și actualizarea preferințelor în browser necesită acțiuni documentate separat.</p>
              </Form>
            </>}
            {current.status !== 'CLOSED' && <Form title="Prelungire motivată, comunicată în prima lună" fields={[choice('months', 'Luni suplimentare', ['1', '2']), textField('reason', 'Motivul complexității / numărului cererilor', 'textarea'), textField('evidence', 'Referința informării deja trimise solicitantului', 'textarea')]} submit={v => write(`/requests/${current.id}/extend`, 'POST', v)} />}
          </section>; })()}
        </>}
        {tab === 4 && <>
          <Table rows={data.operations} columns={[["id", "Operațiune"], ["at", "Data"], ["source", "Sursă"], ["action", "Acțiune"], ["reason", "Motiv"], ["status", "Stare"], ["affected", "Verificate"], ["verification", "Verificare pe disc"], ["backupHandling", "Copii externe"], ["error", "Eroare"]]} action={admin ? row => <>{row.status !== 'VERIFIED' && button('Reia verificarea', () => write(`/operations/${row.id}/retry`, 'POST'))}<button className="a-btn a-btn-ghost" onClick={() => setSelected({...row, kind: 'operation'})}>Documentează copiile</button></> : undefined} />
          {admin && selected?.kind === 'operation' && <Form key={str(selected.id)} title={`Copii externe: ${str(selected.id)}`} fields={[textField('evidence', 'Dovezi privind emailurile, exporturile și expirarea copiilor externe', 'textarea'), textField('handled', 'Confirm că verificarea tuturor copiilor externe este documentată', 'checkbox', true)]} submit={v => write(`/operations/${selected.id}/copies`, 'POST', v)}><p>Este o declarație documentată a responsabilului, nu o verificare tehnică a infrastructurii externe. Poate permite expirarea dovezii numai dacă există și o politică aprobată, iar copiile locale anterioare au expirat.</p></Form>}
          {admin && <><Form title="Simulare ștergere / anonimizare individuală" fields={[choice('source', 'Sursă', sources.slice(0, 3)), textField('ids', 'Identificatori, separați prin virgulă'), choice('action', 'Acțiune', ['delete', 'anonymize']), textField('reason', 'Motiv justificat', 'textarea')]} submit={v => simulate({...v, ids: String(v.ids).split(',').map(s => s.trim()).filter(Boolean)})} label="Simulează fără modificarea datelor" />{previewBox}
            <Form title="Blocare juridică / restricționarea prelucrării" fields={[choice('source', 'Sursă', sources), textField('recordId', 'ID înregistrare'), textField('reason', 'Motiv și referință justificativă', 'textarea')]} submit={v => write('/holds', 'POST', v)} label="Aplică blocarea" />
          </>}
          <Table rows={data.holds} columns={[["id", "Blocare"], ["source", "Sursă"], ["reason", "Motiv"], ["active", "Activă"]]} action={admin ? row => row.active === true && <button className="a-btn a-btn-ghost" onClick={() => setSelected(row)}>Revizuiește blocarea</button> : undefined} />
          {admin && selected && selected.kind !== 'operation' && <Form title="Ridică blocarea selectată" fields={[textField('reason', 'Justificarea încetării obligației / restricției', 'textarea')]} submit={v => write(`/holds/${selected.id}/release`, 'POST', v)} />}
        </>}
        {tab === 5 && <><p>Jurnal semnat HMAC, fără endpoint de editare. Nu conține copia înregistrărilor șterse. Exportă periodic checkpoint-ul separat de server.</p><Table rows={[data.checkpoint]} columns={[["head", "Semnătura capului"], ["count", "Evenimente"], ["anchor", "Checkpoint anterior retenției"]]} /><Table rows={[...data.audit].reverse()} columns={[["id", "Eveniment"], ["at", "Data"], ["actor", "Actor"], ["type", "Acțiune"], ["operationId", "Operațiune asociată"], ["hash", "Semnătură"]]} />{admin && button('Consultă dovezile preferințelor cookie', async () => {const r = await request('/consents'); setMatches(r.items || []);})}{matches.length > 0 && <Table rows={matches} columns={[["id", "Dovadă"], ["at", "Data server"], ["statistics", "Statistici"], ["marketing", "Marketing"], ["superseded", "Înlocuită"], ["services", "Versiune servicii"], ["noticeVersion", "Versiune informare"]]} />}</>}
        {tab === 6 && <>
          <p>Copiile create aici sunt criptate AES-256-GCM și includ numai cererile de contact și analytics. Registrul GDPR și cheia lui se păstrează separat. Nicio restaurare nu suprascrie automat producția.</p>
          <p className="a-muted">Cheie backup: {data.backupKeyConfigured ? 'configurată' : 'neconfigurată — setează GDPR_BACKUP_KEY în mediul serverului'}. Repetiția de restaurare decriptează în memorie, reaplică ștergerile și verifică rezultatul.</p>
          {admin && data.backupKeyConfigured && button('Creează copie criptată', () => write('/backups', 'POST'))}
          <Table rows={data.backups} columns={[["id", "Copie"], ["at", "Creată"], ["status", "Stare"], ["rehearsedAt", "Restaurare testată"], ["replayed", "Ștergeri reaplicate"], ["digest", "SHA-256"]]} action={admin ? row => row.status !== 'EXPIRED' && <>{button('Testează restaurarea izolată', () => write(`/backups/${row.id}/rehearse`, 'POST'))}{button('Export recuperare cu ștergeri reaplicate', () => download(`/backups/${row.id}/recovery`))}<button className="a-btn a-btn-ghost" onClick={() => setSelected(row)}>Expiră copia</button></> : undefined} />
          {admin && selected && <Form title={`Expiră copia ${str(selected.id)}`} fields={[textField('confirmation', 'Scrie CONFIRM ȘTERGERE')]} submit={v => write(`/backups/${selected.id}`, 'DELETE', v)} label="Șterge definitiv această copie" />}
          {admin && <Form title="Documentează infrastructura de backup externă" initial={safeInitial(data.backupSettings)} fields={['provider', 'location', 'frequency', 'retention', 'encryption', 'access', 'procedure', 'evidence'].map((k, i) => textField(k, ['Furnizor', 'Locație / țară', 'Frecvență', 'Retenție aprobată', 'Criptare și chei', 'Persoane autorizate', 'Procedură de restaurare și izolare', 'Referințe dovezi'][i], 'textarea', true))} submit={v => write('/backups/settings', 'PUT', v)} />}
        </>}
        {tab === 7 && <><Table rows={data.vendors} columns={[["id", "ID"], ["service", "Serviciu detectat"], ["evidence", "Dovadă din aplicație"]]} /><Table rows={data.vendorRecords} columns={[["id", "ID"], ["name", "Entitate juridică"], ["service", "Prelucrare"], ["location", "Țară"], ["contract", "Contract"], ["transfers", "Transferuri"], ["retention", "Retenție"], ["owner", "Responsabil"]]} action={admin ? row => <button className="a-btn a-btn-ghost" onClick={() => setSelected(row)}>Editează</button> : undefined} />{admin && <Form key={str(selected?.id || 'vendor')} title="Fișă furnizor / procesator" initial={safeInitial(selected || undefined)} fields={['id', 'name', 'service', 'location', 'contract', 'transfers', 'retention', 'owner'].map((k, i) => textField(k, ['ID din lista serviciilor sau ID furnizor nou', 'Denumirea juridică reală', 'Serviciu și date primite', 'Locație de prelucrare', 'Referința contractului / acordului art. 28', 'Transferuri în afara SEE și garanții', 'Retenție / procedura de ștergere', 'Responsabil'][i]))} submit={v => write(`/vendors/${encodeURIComponent(String(v.id))}`, 'PUT', v)} />}</>}
        {tab === 8 && <>
          <p>Termenul orientativ de 72 ore pornește de la luarea la cunoștință. Necesitatea notificării ANSPDCP și a persoanelor se evaluează separat potrivit art. 33–34; modulul nu trimite notificări autorității.</p>
          <Table rows={data.incidents} columns={[["id", "Incident"], ["detectedAt", "Constatare"], ["assessmentDueAt", "72 ore"], ["summary", "Descriere"], ["assessment", "Evaluare"], ["measures", "Măsuri"], ["status", "Stare"]]} action={admin ? row => <button className="a-btn a-btn-ghost" onClick={() => setSelected(row)}>Actualizează</button> : undefined} />
          {admin && <Form title="Înregistrează un incident real" fields={[textField('detectedAt', 'Data luării la cunoștință', 'datetime-local'), textField('summary', 'Descriere fără date personale inutile', 'textarea'), textField('assessment', 'Evaluare risc și necesitate notificare', 'textarea'), textField('measures', 'Măsuri și responsabil', 'textarea')]} submit={v => write('/incidents', 'POST', v)} />}
          {admin && selected && <Form key={str(selected.id)} title="Actualizează incidentul" initial={safeInitial(selected)} fields={[choice('status', 'Stare', ['OPEN', 'CONTAINED', 'CLOSED']), textField('assessment', 'Evaluare / justificarea deciziei', 'textarea'), textField('evidence', 'Dovada notificării sau motivul neefectuării', 'textarea'), textField('authorityNotifiedAt', 'Data notificării autorității, dacă există', 'datetime-local', true)]} submit={v => write(`/incidents/${selected.id}`, 'PATCH', v)} />}
        </>}
        {tab === 9 && <>
          <h2>Generate GDPR Audit Report</h2><Table rows={[data.operator]} columns={Object.keys(data.operator).map(k => [k, k])} />
          <div className="gdpr-tools"><label>De la <input className="a-input" type="date" value={period.from} onChange={e => setPeriod({...period, from: e.target.value})} /></label><label>Până la <input className="a-input" type="date" value={period.to} onChange={e => setPeriod({...period, to: e.target.value})} /></label></div>
          <p>Raportul include inventarul, regulile, dovezile operațiunilor, statusurile cererilor, backupurile, accesul, furnizorii, incidentele și problemele nerezolvate. Emailurile solicitanților și secretele sunt excluse.</p>
          <div className="gdpr-tools">{['pdf', 'csv', 'html', 'json'].map(format => <button key={format} className="a-btn a-btn-primary" disabled={busy} onClick={() => act(() => download(`/report/${format}?${new URLSearchParams(period)}`))}>Export {format.toUpperCase()}</button>)}</div>
        </>}
        {tab === 10 && <>
          <Table rows={data.users} columns={[["id", "Cont"], ["name", "Responsabil"], ["role", "Rol"], ["enabled", "Activ"], ["mfa", "MFA"], ["lastLogin", "Ultimul acces"]]} action={admin ? row => button(row.enabled ? 'Dezactivează și revocă sesiunile' : 'Reactivează', () => write(`/users/${row.id}`, 'PATCH', {enabled: !row.enabled})) : undefined} />
          {admin && <Form title="Creează cont GDPR nominal" fields={[textField('id', 'Identificator unic'), textField('name', 'Nume responsabil'), choice('role', 'Rol', ['gdpr_admin', 'auditor']), textField('password', 'Parolă nouă, minimum 14 caractere', 'password')]} submit={v => write('/users', 'POST', v)} />}
          <button className="a-btn a-btn-ghost" onClick={() => setMfaSecret(Array.from(crypto.getRandomValues(new Uint8Array(32)), n => 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'[n & 31]).join(''))}>Generează secret MFA pentru configurare manuală</button>
          <Form key={mfaSecret} title="Activează MFA pentru contul curent" initial={{secret: mfaSecret}} fields={[textField('secret', 'Secret Base32: introdu-l manual în aplicația de autentificare'), textField('code', 'Cod de 6 cifre generat cu secretul nou'), textField('currentCode', 'Cod MFA curent, dacă înlocuiești un secret activ', 'text', true)]} submit={v => write('/mfa', 'POST', v)} label="Verifică și activează MFA"><p>Folosește TOTP SHA-1, 6 cifre, interval 30 secunde. Păstrează secretul într-un manager de parole autorizat. Activarea revocă sesiunile curente.</p></Form>
        </>}
      </>}
    </div>
  </main>;
}
