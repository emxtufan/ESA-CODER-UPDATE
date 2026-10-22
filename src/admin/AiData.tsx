// ---------------------------------------------------------------------------
// AI Assistant — data panes (knowledge base, synchronization, conversations,
// analytics). Reads and writes go through api.aiGet/aiSend/aiUpload.
// ---------------------------------------------------------------------------
import {useCallback, useEffect, useState, type FormEvent} from 'react';
import {api} from './api';

type SourceOrigin = 'site' | 'manual' | 'url' | 'file';
type SourceStatus = 'approved' | 'draft';
type KbSource = {
  id: string; origin: SourceOrigin; kind: string; title: string; url: string; status: SourceStatus;
  version: number; updatedAt: string; error: string; warning: string; chars: number; chunks: number;
};
type KbSourceFull = KbSource & {text?: string};
type KbStats = {
  lastSync: string | null; sources: number; approved: number; drafts: number; chunks: number;
  embedded: number; failed: number; blocked: number; needsReindex: boolean; embedKey: string;
  errors: {at: string; sourceId: string; message: string}[];
};
type SearchHit = {title: string; url: string; kind: string; score: number; lexical: number; semantic: number; text: string};
type KbSearch = {mode: string; hits: SearchHit[]};
type SyncResult = {added: number; updated: number; removed: number; unchanged: number; failed: number};
type RatingValue = 'good' | 'ok' | 'bad';
type ConversationSummary = {
  id: string; startedAt: string; updatedAt: string; count: number; first: string;
  flags: {refused: boolean; down: boolean; error: boolean};
  email: string | null; rating: RatingValue | null;
};
type Message = {
  id: string; role: string; text: string; at: string; status: string; reason: string;
  provider: string; model: string; latencyMs: number; usage: {input: number; output: number};
  costReported: number; costEstimated: number; citations: {title: string; url: string}[]; feedback: string;
};
type Conversation = {
  id: string; startedAt: string; messages: Message[];
  lead: {email: string; at: string} | null; rating: {value: RatingValue; at: string} | null;
};
type AiStats = {
  conversations: number; messages: number; avgLatencyMs: number;
  byStatus: {answered: number; refused: number; error: number; limited: number};
  insufficient: number; apiErrors: number;
  tokens: {input: number; output: number};
  cost: {reported: number; estimated: number};
  byProvider: Record<string, {messages: number; input: number; output: number}>;
  byModel: Record<string, {messages: number; input: number; output: number}>;
  topQuestions: {q: string; count: number}[];
  negativeFeedback: number;
  leads: number;
  ratings: {good: number; ok: number; bad: number};
};

const ORIGINS: Record<SourceOrigin, string> = {site: 'site', manual: 'manual', url: 'url', file: 'fișier'};
const RATINGS: Record<RatingValue, string> = {good: '👍 Bună', ok: '😐 Ok', bad: '👎 Slabă'};
const KINDS = ['text', 'faq', 'service', 'plan', 'policy'];
const when = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleString('ro-RO', {day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'}) : 'niciodată';
const cut = (text: string, max: number) => (text.length > max ? `${text.slice(0, max)}…` : text);
const money = (value?: number) => (typeof value === 'number' && Number.isFinite(value) ? value.toFixed(4) : '0.0000');
const qs = (params: Record<string, string | number | undefined>) => {
  const parts = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== '')
    .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`);
  return parts.length ? `?${parts.join('&')}` : '';
};

function Loading() {
  return (
    <section className="a-card a-panel">
      <p className="a-muted">
        <span className="a-spinner" style={{display: 'inline-block', verticalAlign: 'middle', marginRight: 8}} />
        Se încarcă…
      </p>
    </section>
  );
}

function Failed({title, error}: {title: string; error: string}) {
  return (
    <section className="a-card a-panel">
      <h2>{title}</h2>
      <p className="a-error" role="alert">{error}</p>
    </section>
  );
}

// --- knowledge base ------------------------------------------------------------------------
type SourceDraft = {id: string | null; title: string; url: string; kind: string; text: string; status: SourceStatus};
const emptyDraft = (): SourceDraft => ({id: null, title: '', url: '', kind: 'text', text: '', status: 'draft'});
type KbFilter = 'all' | 'approved' | 'draft' | 'site' | 'manual' | 'import';
const FILTERS: {key: KbFilter; label: string}[] = [
  {key: 'all', label: 'toate'},
  {key: 'approved', label: 'aprobate'},
  {key: 'draft', label: 'ciorne'},
  {key: 'site', label: 'site'},
  {key: 'manual', label: 'manual'},
  {key: 'import', label: 'import'},
];

export function KnowledgeBase() {
  const [sources, setSources] = useState<KbSource[] | null>(null);
  const [form, setForm] = useState<SourceDraft | null>(null);
  const [filter, setFilter] = useState<KbFilter>('all');
  const [needle, setNeedle] = useState('');
  const [confirming, setConfirming] = useState('');
  const [importUrl, setImportUrl] = useState('');
  const [search, setSearch] = useState('');
  const [result, setResult] = useState<KbSearch | null>(null);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState('');
  const [busy, setBusy] = useState('');

  const load = useCallback(async () => {
    const r = await api.aiGet('/kb/sources');
    if (!r.ok) {
      setError(r.error || 'Nu am putut încărca sursele.');
      return;
    }
    setSources(Array.isArray(r.sources) ? r.sources : []);
    setError('');
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  if (!sources) return error ? <Failed title="Knowledge Base" error={error} /> : <Loading />;

  const visible = sources.filter((s) => {
    const byFilter =
      filter === 'all' ? true
      : filter === 'approved' ? s.status === 'approved'
      : filter === 'draft' ? s.status === 'draft'
      : filter === 'site' ? s.origin === 'site'
      : filter === 'manual' ? s.origin === 'manual'
      : s.origin === 'url' || s.origin === 'file';
    return byFilter && (!needle.trim() || (s.title || '').toLocaleLowerCase('ro').includes(needle.trim().toLocaleLowerCase('ro')));
  });

  const submitForm = async (e: FormEvent) => {
    e.preventDefault();
    if (!form || busy) return;
    const title = form.title.trim();
    const body = {title, url: form.url.trim(), kind: form.kind, text: form.text.trim(), status: form.status};
    if (!title) {
      setError('Titlul este obligatoriu.');
      return;
    }
    if (!body.text) {
      setError('Textul este obligatoriu.');
      return;
    }
    setBusy('form');
    setSaved('');
    const r = form.id
      ? await api.aiSend('PUT', `/kb/sources/${encodeURIComponent(form.id)}`, body)
      : await api.aiSend('POST', '/kb/sources', body);
    setBusy('');
    if (!r.ok) {
      setError(r.error || 'Nu am putut salva sursa.');
      return;
    }
    setForm(null);
    setError('');
    setSaved('Salvat.');
    await load();
  };

  const edit = async (source: KbSource) => {
    if (busy) return;
    setBusy(`edit:${source.id}`);
    const r = await api.aiGet(`/kb/sources/${encodeURIComponent(source.id)}`);
    setBusy('');
    if (!r.ok || !r.source) {
      setError(r.error || 'Nu am putut încărca sursa.');
      return;
    }
    const s = r.source as KbSourceFull;
    setForm({
      id: s.id,
      title: s.title || '',
      url: s.url || '',
      kind: s.kind || 'text',
      text: s.text || '',
      status: s.status === 'approved' ? 'approved' : 'draft',
    });
    setError('');
  };

  const setStatus = async (source: KbSource, status: SourceStatus) => {
    if (busy) return;
    setBusy(`status:${source.id}`);
    setSaved('');
    const r = await api.aiSend('PUT', `/kb/sources/${encodeURIComponent(source.id)}/status`, {status});
    setBusy('');
    if (!r.ok) {
      setError(r.error || 'Nu am putut schimba statusul.');
      return;
    }
    setError('');
    setSaved('Salvat.');
    await load();
  };

  const remove = async (id: string) => {
    if (busy) return;
    setBusy(`delete:${id}`);
    setSaved('');
    const r = await api.aiSend('DELETE', `/kb/sources/${encodeURIComponent(id)}`);
    setBusy('');
    setConfirming('');
    if (!r.ok) {
      setError(r.error || 'Nu am putut șterge sursa.');
      return;
    }
    setError('');
    setSaved('Salvat.');
    await load();
  };

  const importFromUrl = async (e: FormEvent) => {
    e.preventDefault();
    const url = importUrl.trim();
    if (!url || busy) return;
    setBusy('import');
    setSaved('');
    const r = await api.aiSend('POST', '/kb/import-url', {url});
    setBusy('');
    if (!r.ok) {
      setError(r.error || 'Importul nu a reușit.');
      return;
    }
    setImportUrl('');
    setError('');
    setSaved('Salvat.');
    await load();
  };

  const upload = async (file: File) => {
    if (busy) return;
    setBusy('upload');
    setSaved('');
    const r = await api.aiUpload(file);
    setBusy('');
    if (!r.ok) {
      setError(r.error || 'Fișierul nu a putut fi încărcat.');
      return;
    }
    setError('');
    setSaved('Salvat.');
    await load();
  };

  const runSearch = async (e: FormEvent) => {
    e.preventDefault();
    const q = search.trim();
    if (!q || busy) return;
    setBusy('search');
    const r = await api.aiSend('POST', '/kb/search', {q});
    setBusy('');
    if (!r.ok) {
      setError(r.error || 'Căutarea nu a putut fi rulată.');
      return;
    }
    setResult({mode: r.mode || 'textual', hits: Array.isArray(r.hits) ? r.hits : []});
    setError('');
  };

  return (
    <>
      {error && <p className="a-error" role="alert">{error}</p>}
      {saved && <p className="a-hint">{saved}</p>}
      {form && (
        <section className="a-card a-panel">
          <h2>{form.id ? 'Editează sursa' : 'Text manual'}</h2>
          <form onSubmit={submitForm}>
            <label className="a-field">
              <span className="a-field-label">Titlu</span>
              <input className="a-input" value={form.title} onChange={(e) => setForm({...form, title: e.target.value})} />
            </label>
            <label className="a-field">
              <span className="a-field-label">URL (opțional)</span>
              <input className="a-input" value={form.url} placeholder="https://…" onChange={(e) => setForm({...form, url: e.target.value})} />
            </label>
            <label className="a-field">
              <span className="a-field-label">Tip</span>
              <select className="a-input" value={form.kind} onChange={(e) => setForm({...form, kind: e.target.value})}>
                {KINDS.map((kind) => (
                  <option key={kind} value={kind}>
                    {kind}
                  </option>
                ))}
              </select>
            </label>
            <label className="a-field">
              <span className="a-field-label">Text</span>
              <textarea className="a-input a-textarea" rows={12} value={form.text} onChange={(e) => setForm({...form, text: e.target.value})} />
            </label>
            <label className="a-field">
              <span className="a-field-label">Status</span>
              <select className="a-input" value={form.status} onChange={(e) => setForm({...form, status: e.target.value as SourceStatus})}>
                <option value="draft">ciornă</option>
                <option value="approved">aprobată</option>
              </select>
            </label>
            <div className="a-bar-actions" style={{padding: '10px 0'}}>
              <button className="a-btn a-btn-primary" disabled={busy === 'form'}>
                {busy === 'form' ? 'Se salvează…' : 'Salvează'}
              </button>
              <button type="button" className="a-btn a-btn-ghost" disabled={busy === 'form'} onClick={() => setForm(null)}>
                Renunță
              </button>
            </div>
          </form>
        </section>
      )}
      <section className="a-card a-panel">
        <h2>Import</h2>
        <form onSubmit={importFromUrl}>
          <div className="a-bar-actions" style={{padding: '10px 0'}}>
            <input
              className="a-input"
              style={{flex: 1, minWidth: 0}}
              placeholder="https://exemplu.ro/pagina"
              aria-label="URL de importat"
              value={importUrl}
              onChange={(e) => setImportUrl(e.target.value)}
            />
            <button className="a-btn a-btn-primary" style={{flex: 'none'}} disabled={busy === 'import' || !importUrl.trim()}>
              {busy === 'import' ? 'Se importă…' : 'Importă URL'}
            </button>
          </div>
        </form>
        <p className="a-hint">Sursele importate intră ca ciornă și trebuie aprobate.</p>
        <div className="a-bar-actions" style={{padding: '10px 0'}}>
          <input
            className="a-input"
            type="file"
            accept=".pdf,.txt,.md"
            aria-label="Fișier de încărcat"
            disabled={busy === 'upload'}
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = '';
              if (file) void upload(file);
            }}
          />
        </div>
        {busy === 'upload' && <p className="a-hint">Se încarcă fișierul…</p>}
      </section>
      <section className="a-card a-panel">
        <div className="a-block-head">
          <h2>Surse</h2>
          <div className="a-bar-actions">
            <button type="button" className="a-btn a-btn-primary" disabled={!!busy} onClick={() => setForm(emptyDraft())}>
              Text manual
            </button>
          </div>
        </div>
        <div className="a-bar-actions" style={{padding: '10px 0', flexWrap: 'wrap'}}>
          <select className="a-input a-select-sm" aria-label="Filtru surse" value={filter} onChange={(e) => setFilter(e.target.value as KbFilter)}>
            {FILTERS.map((f) => (
              <option key={f.key} value={f.key}>
                {f.label}
              </option>
            ))}
          </select>
          <input
            className="a-input"
            style={{flex: 1, minWidth: 0}}
            type="search"
            placeholder="Caută titlu…"
            aria-label="Caută titlu"
            value={needle}
            onChange={(e) => setNeedle(e.target.value)}
          />
        </div>
        {visible.length === 0 ? (
          <p className="a-empty">Nicio sursă pentru selecția curentă.</p>
        ) : (
          <div className="a-table-wrap">
            <table className="a-table">
              <thead>
                <tr>
                  <th>Titlu</th>
                  <th>Origine</th>
                  <th>Tip</th>
                  <th>Status</th>
                  <th>Fragmente</th>
                  <th>Actualizat</th>
                  <th>Probleme</th>
                  <th>Acțiuni</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((s) => (
                  <tr key={s.id}>
                    <td>
                      {s.url ? (
                        <a href={s.url} target="_blank" rel="noreferrer">
                          {s.title || s.url}
                        </a>
                      ) : (
                        <strong>{s.title}</strong>
                      )}
                    </td>
                    <td>{ORIGINS[s.origin] || s.origin}</td>
                    <td>{s.kind}</td>
                    <td>
                      <em className="a-badge" style={{marginLeft: 0}}>
                        {s.status === 'approved' ? 'aprobată' : 'ciornă'}
                      </em>
                    </td>
                    <td>{s.chunks ?? 0}</td>
                    <td>{when(s.updatedAt)}</td>
                    <td>
                      {s.error || s.warning ? (
                        <span style={{display: 'inline-flex', gap: 4}}>
                          {s.error && (
                            <em className="a-badge" style={{marginLeft: 0, color: 'var(--danger)'}} title={s.error}>
                              eroare
                            </em>
                          )}
                          {s.warning && (
                            <em className="a-badge is-muted" style={{marginLeft: 0}} title={s.warning}>
                              avertisment
                            </em>
                          )}
                        </span>
                      ) : (
                        <span className="a-muted">—</span>
                      )}
                    </td>
                    <td>
                      {s.origin === 'site' ? (
                        <span className="a-muted">din CMS</span>
                      ) : confirming === s.id ? (
                        <div className="a-row-actions">
                          <span className="a-hint">Sigur?</span>
                          <button type="button" className="a-btn a-btn-ghost a-btn-sm" disabled={busy === `delete:${s.id}`} onClick={() => void remove(s.id)}>
                            Da
                          </button>
                          <button type="button" className="a-btn a-btn-ghost a-btn-sm" onClick={() => setConfirming('')}>
                            Nu
                          </button>
                        </div>
                      ) : (
                        <div className="a-row-actions">
                          <button
                            type="button"
                            className="a-btn a-btn-ghost a-btn-sm"
                            disabled={!!busy}
                            onClick={() => void setStatus(s, s.status === 'approved' ? 'draft' : 'approved')}
                          >
                            {s.status === 'approved' ? 'Retrage' : 'Aprobă'}
                          </button>
                          <button type="button" className="a-btn a-btn-ghost a-btn-sm" disabled={!!busy} onClick={() => void edit(s)}>
                            {busy === `edit:${s.id}` ? 'Se încarcă…' : 'Editează'}
                          </button>
                          <button type="button" className="a-btn a-btn-ghost a-btn-sm" disabled={!!busy} onClick={() => setConfirming(s.id)}>
                            Șterge
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <section className="a-card a-panel">
        <h2>Testează căutarea</h2>
        <form onSubmit={runSearch}>
          <div className="a-bar-actions" style={{padding: '10px 0'}}>
            <input
              className="a-input"
              style={{flex: 1, minWidth: 0}}
              placeholder="Scrie o întrebare…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button className="a-btn a-btn-primary" style={{flex: 'none'}} disabled={busy === 'search' || !search.trim()}>
              {busy === 'search' ? 'Se caută…' : 'Caută'}
            </button>
          </div>
        </form>
        {result && (
          <>
            <p className="a-hint">Mod: {result.mode}</p>
            {result.hits.length === 0 ? (
              <p className="a-empty">Nicio potrivire.</p>
            ) : (
              <div className="a-table-wrap">
                <table className="a-table">
                  <thead>
                    <tr>
                      <th>Titlu</th>
                      <th>Tip</th>
                      <th>Scor</th>
                      <th>Text</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.hits.map((hit, index) => (
                      <tr key={`${hit.url}-${index}`}>
                        <td>
                          {hit.url ? (
                            <a href={hit.url} target="_blank" rel="noreferrer">
                              {hit.title || hit.url}
                            </a>
                          ) : (
                            hit.title
                          )}
                        </td>
                        <td>{hit.kind}</td>
                        <td>{typeof hit.score === 'number' ? hit.score.toFixed(2) : '—'}</td>
                        <td>{cut(hit.text || '', 200)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </section>
    </>
  );
}

// --- synchronization -----------------------------------------------------------------------
export function Sync() {
  const [kb, setKb] = useState<KbStats | null>(null);
  const [result, setResult] = useState<SyncResult | null>(null);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState('');
  const [busy, setBusy] = useState<'' | 'sync' | 'reindex'>('');

  const load = useCallback(async () => {
    const r = await api.aiGet('/kb/status');
    if (!r.ok || !r.kb) {
      setError(r.error || 'Nu am putut încărca starea indexului.');
      return;
    }
    setKb(r.kb);
    setError('');
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  if (!kb) return error ? <Failed title="Sincronizare" error={error} /> : <Loading />;

  const errors = kb.errors || [];

  const sync = async () => {
    if (busy) return;
    setBusy('sync');
    setSaved('');
    setResult(null);
    const r = await api.aiSend('POST', '/kb/sync');
    setBusy('');
    if (!r.ok) {
      setError(r.error || 'Sincronizarea a eșuat.');
      return;
    }
    setResult({
      added: Number(r.added) || 0,
      updated: Number(r.updated) || 0,
      removed: Number(r.removed) || 0,
      unchanged: Number(r.unchanged) || 0,
      failed: Number(r.failed) || 0,
    });
    setError('');
    setSaved('Salvat.');
    await load();
  };

  const reindex = async () => {
    if (busy) return;
    setBusy('reindex');
    setSaved('');
    const r = await api.aiSend('POST', '/kb/reindex');
    setBusy('');
    if (!r.ok) {
      setError(r.error || 'Reindexarea nu a putut fi pornită.');
      return;
    }
    if (r.kb) setKb(r.kb);
    setError('');
    setSaved('Salvat. Reindexarea a fost pornită.');
  };

  return (
    <>
      {error && <p className="a-error" role="alert">{error}</p>}
      {saved && <p className="a-hint">{saved}</p>}
      <div className="a-kpis">
        <div className="a-card a-kpi">
          <span className="a-muted">Ultima sincronizare</span>
          <strong style={{fontSize: 15}}>{when(kb.lastSync)}</strong>
        </div>
        <div className="a-card a-kpi">
          <span className="a-muted">Surse</span>
          <strong>{kb.sources ?? 0}</strong>
        </div>
        <div className="a-card a-kpi">
          <span className="a-muted">Aprobate</span>
          <strong>{kb.approved ?? 0}</strong>
        </div>
        <div className="a-card a-kpi">
          <span className="a-muted">Ciorne (Pending)</span>
          <strong>{kb.drafts ?? 0}</strong>
        </div>
        <div className="a-card a-kpi">
          <span className="a-muted">Fragmente</span>
          <strong>{kb.chunks ?? 0}</strong>
        </div>
        <div className="a-card a-kpi">
          <span className="a-muted">Cu embeddings</span>
          <strong>{kb.embedded ?? 0}</strong>
        </div>
        <div className="a-card a-kpi">
          <span className="a-muted">Eșuate</span>
          <strong>{kb.failed ?? 0}</strong>
        </div>
        <div className="a-card a-kpi">
          <span className="a-muted">Blocate</span>
          <strong>{kb.blocked ?? 0}</strong>
        </div>
        <div className="a-card a-kpi">
          <span className="a-muted">Necesită reindexare</span>
          <strong style={{fontSize: 18}}>{kb.needsReindex ? 'da' : 'nu'}</strong>
        </div>
      </div>
      <section className="a-card a-panel">
        <div className="a-block-head">
          <h2>Sincronizare</h2>
          <div className="a-bar-actions">
            <button type="button" className="a-btn a-btn-primary" disabled={!!busy} onClick={() => void sync()}>
              {busy === 'sync' ? 'Se sincronizează…' : 'Sincronizează acum'}
            </button>
            <button type="button" className="a-btn a-btn-ghost" disabled={!!busy} onClick={() => void reindex()}>
              {busy === 'reindex' ? 'Se reindexează…' : 'Reindexează tot'}
            </button>
          </div>
        </div>
        <p className="a-hint">Conținutul publicat în CMS se sincronizează automat la salvare.</p>
        {result && (
          <p className="a-hint">
            Adăugate {result.added} · Actualizate {result.updated} · Șterse {result.removed} · Neschimbate {result.unchanged} · Eșuate {result.failed}
          </p>
        )}
      </section>
      <section className="a-card a-panel">
        <h2>Ultimele erori</h2>
        {errors.length === 0 ? (
          <p className="a-empty">Nicio eroare înregistrată.</p>
        ) : (
          <div className="a-table-wrap">
            <table className="a-table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Sursa</th>
                  <th>Mesaj</th>
                </tr>
              </thead>
              <tbody>
                {errors.map((err, index) => (
                  <tr key={`${err.at}-${index}`}>
                    <td>{when(err.at)}</td>
                    <td>{err.sourceId || '—'}</td>
                    <td>{err.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}

// --- conversations -------------------------------------------------------------------------
type ConvFilters = {from: string; to: string; q: string; status: string};
const emptyConvFilters = (): ConvFilters => ({from: '', to: '', q: '', status: ''});
const PAGE = 50;

export function Conversations() {
  const [list, setList] = useState<{total: number; items: ConversationSummary[]} | null>(null);
  const [detail, setDetail] = useState<Conversation | null>(null);
  const [draft, setDraft] = useState<ConvFilters>(emptyConvFilters);
  const [filters, setFilters] = useState<ConvFilters>(emptyConvFilters);
  const [offset, setOffset] = useState(0);
  const [confirming, setConfirming] = useState('');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState('');
  const [busy, setBusy] = useState('');

  const load = useCallback(async () => {
    const r = await api.aiGet('/conversations' + qs({from: filters.from, to: filters.to, q: filters.q.trim(), status: filters.status, offset}));
    if (!r.ok) {
      setError(r.error || 'Nu am putut încărca conversațiile.');
      return;
    }
    setList({total: Number(r.total) || 0, items: Array.isArray(r.items) ? r.items : []});
    setError('');
  }, [filters, offset]);
  useEffect(() => {
    void load();
  }, [load]);

  if (!list) return error ? <Failed title="Conversations" error={error} /> : <Loading />;

  const apply = (e: FormEvent) => {
    e.preventDefault();
    setOffset(0);
    setFilters({...draft});
  };

  const open = async (id: string) => {
    if (busy) return;
    setBusy(id);
    const r = await api.aiGet(`/conversations/${encodeURIComponent(id)}`);
    setBusy('');
    if (!r.ok || !r.conversation) {
      setError(r.error || 'Nu am putut încărca conversația.');
      return;
    }
    setDetail(r.conversation as Conversation);
    setConfirming('');
    setError('');
  };

  const remove = async (id: string) => {
    if (busy) return;
    setBusy(`delete:${id}`);
    setSaved('');
    const r = await api.aiSend('DELETE', `/conversations/${encodeURIComponent(id)}`);
    setBusy('');
    setConfirming('');
    if (!r.ok) {
      setError(r.error || 'Nu am putut șterge conversația.');
      return;
    }
    if (detail?.id === id) setDetail(null);
    setError('');
    setSaved('Salvat.');
    await load();
  };

  const flags = (c: ConversationSummary) =>
    [c.flags?.refused && 'refuzat', c.flags?.down && 'provider indisponibil', c.flags?.error && 'eroare'].filter(Boolean) as string[];

  const retention = (
    <p className="a-hint">Conversațiile se șterg automat după perioada de retenție din Settings. Nu se salvează IP sau user-agent.</p>
  );

  if (detail) {
    return (
      <>
        {error && <p className="a-error" role="alert">{error}</p>}
        {saved && <p className="a-hint">{saved}</p>}
        <section className="a-card a-panel">
          <div className="a-block-head">
            <h2>Conversație din {when(detail.startedAt)}</h2>
            <div className="a-bar-actions">
              {confirming === detail.id ? (
                <>
                  <span className="a-hint">Sigur?</span>
                  <button type="button" className="a-btn a-btn-ghost a-btn-sm" disabled={busy === `delete:${detail.id}`} onClick={() => void remove(detail.id)}>
                    Da
                  </button>
                  <button type="button" className="a-btn a-btn-ghost a-btn-sm" onClick={() => setConfirming('')}>
                    Nu
                  </button>
                </>
              ) : (
                <button type="button" className="a-btn a-btn-ghost a-btn-sm" disabled={!!busy} onClick={() => setConfirming(detail.id)}>
                  Șterge conversația
                </button>
              )}
              <button type="button" className="a-btn a-btn-ghost a-btn-sm" disabled={!!busy} onClick={() => setDetail(null)}>
                Înapoi
              </button>
            </div>
          </div>
          {retention}
          {detail.messages.map((m, index) => (
            <div className="a-field" key={m.id || index}>
              <span className="a-field-label">
                {m.role}
                {m.status && <b>{m.status}</b>}
                <span className="a-muted" style={{marginLeft: 'auto'}}>
                  {when(m.at)}
                </span>
              </span>
              <p style={{whiteSpace: 'pre-wrap'}}>{m.text}</p>
              <span className="a-hint">
                {[
                  [m.provider, m.model].filter(Boolean).join(' · '),
                  typeof m.latencyMs === 'number' ? `${Math.round(m.latencyMs)} ms` : '',
                  m.usage ? `tokeni ${m.usage.input ?? 0} in / ${m.usage.output ?? 0} out` : '',
                  `cost ${money(m.costReported)} raportat / ${money(m.costEstimated)} estimat`,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </span>
              {m.reason && <span className="a-hint">Motiv: {m.reason}</span>}
              {m.feedback && <span className="a-hint">Feedback: {m.feedback}</span>}
              {m.citations && m.citations.length > 0 && (
                <ul className="a-hint">
                  {m.citations.map((c, i) => (
                    <li key={`${c.url}-${i}`}>{c.url ? <a href={c.url} target="_blank" rel="noreferrer">{c.title || c.url}</a> : c.title}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </section>
      </>
    );
  }

  const start = list.total === 0 ? 0 : offset + 1;
  const end = offset + list.items.length;

  return (
    <>
      {error && <p className="a-error" role="alert">{error}</p>}
      {saved && <p className="a-hint">{saved}</p>}
      <section className="a-card a-panel">
        <h2>Conversations</h2>
        <form onSubmit={apply}>
          <div className="a-bar-actions" style={{padding: '10px 0', flexWrap: 'wrap'}}>
            <input className="a-input" type="date" aria-label="De la" value={draft.from} onChange={(e) => setDraft({...draft, from: e.target.value})} />
            <input className="a-input" type="date" aria-label="Până la" value={draft.to} onChange={(e) => setDraft({...draft, to: e.target.value})} />
            <input
              className="a-input"
              style={{flex: 1, minWidth: 0}}
              type="search"
              placeholder="Caută…"
              aria-label="Caută în conversații"
              value={draft.q}
              onChange={(e) => setDraft({...draft, q: e.target.value})}
            />
            <select className="a-input a-select-sm" aria-label="Status" value={draft.status} onChange={(e) => setDraft({...draft, status: e.target.value})}>
              <option value="">toate statusurile</option>
              <option value="refused">refused</option>
              <option value="error">error</option>
              <option value="limited">limited</option>
            </select>
            <button className="a-btn a-btn-primary" style={{flex: 'none'}}>
              Filtrează
            </button>
          </div>
        </form>
        {retention}
        {list.items.length === 0 ? (
          <p className="a-empty">Nicio conversație pentru selecția curentă.</p>
        ) : (
          <div className="a-table-wrap">
            <table className="a-table">
              <thead>
                <tr>
                  <th>Început</th>
                  <th>Mesaje</th>
                  <th>Primul mesaj</th>
                  <th>Flag-uri</th>
                  <th>Acțiuni</th>
                </tr>
              </thead>
              <tbody>
                {list.items.map((c) => (
                  <tr key={c.id} className="is-clickable" onClick={() => void open(c.id)}>
                    <td>{when(c.startedAt)}</td>
                    <td>{c.count ?? 0}</td>
                    <td>{cut(c.first || '', 120)}</td>
                    <td>
                      {flags(c).length === 0 ? (
                        <span className="a-muted">—</span>
                      ) : (
                        <span style={{display: 'inline-flex', gap: 4}}>
                          {flags(c).map((flag) => (
                            <em key={flag} className="a-badge" style={{marginLeft: 0}}>
                              {flag}
                            </em>
                          ))}
                        </span>
                      )}
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      {confirming === c.id ? (
                        <div className="a-row-actions">
                          <span className="a-hint">Sigur?</span>
                          <button type="button" className="a-btn a-btn-ghost a-btn-sm" disabled={busy === `delete:${c.id}`} onClick={() => void remove(c.id)}>
                            Da
                          </button>
                          <button type="button" className="a-btn a-btn-ghost a-btn-sm" onClick={() => setConfirming('')}>
                            Nu
                          </button>
                        </div>
                      ) : (
                        <div className="a-row-actions">
                          <button type="button" className="a-btn a-btn-ghost a-btn-sm" disabled={!!busy} onClick={() => void open(c.id)}>
                            {busy === c.id ? 'Se încarcă…' : 'Deschide'}
                          </button>
                          <button type="button" className="a-btn a-btn-ghost a-btn-sm" disabled={!!busy} onClick={() => setConfirming(c.id)}>
                            Șterge
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="a-bar-actions" style={{padding: '10px 0'}}>
          <button type="button" className="a-btn a-btn-ghost" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - PAGE))}>
            Înapoi
          </button>
          <span className="a-hint">
            {start}–{end} din {list.total}
          </span>
          <button type="button" className="a-btn a-btn-ghost" disabled={end >= list.total} onClick={() => setOffset(offset + PAGE)}>
            Înainte
          </button>
        </div>
      </section>
    </>
  );
}

// --- analytics -----------------------------------------------------------------------------
function UsageTable({title, rows}: {title: string; rows: Record<string, {messages: number; input: number; output: number}> | undefined}) {
  const entries = Object.entries(rows || {});
  return (
    <section className="a-card a-panel">
      <h2>{title}</h2>
      {entries.length === 0 ? (
        <p className="a-empty">Fără date în perioada selectată.</p>
      ) : (
        <div className="a-table-wrap">
          <table className="a-table">
            <thead>
              <tr>
                <th>Nume</th>
                <th>Mesaje</th>
                <th>Tokeni in</th>
                <th>Tokeni out</th>
              </tr>
            </thead>
            <tbody>
              {entries.map(([name, row]) => (
                <tr key={name}>
                  <td>{name}</td>
                  <td>{row.messages ?? 0}</td>
                  <td>{row.input ?? 0}</td>
                  <td>{row.output ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export function AiAnalytics() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<AiStats | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const r = await api.aiGet(`/analytics?days=${days}`);
    if (!r.ok) {
      setError(r.error || 'Nu am putut încărca statisticile.');
      return;
    }
    setData(r as AiStats);
    setError('');
  }, [days]);
  useEffect(() => {
    void load();
  }, [load]);

  if (!data) return error ? <Failed title="Analytics" error={error} /> : <Loading />;

  return (
    <>
      {error && <p className="a-error" role="alert">{error}</p>}
      <section className="a-card a-panel">
        <div className="a-block-head">
          <h2>Analytics</h2>
          <select className="a-input a-select-sm" aria-label="Perioada" value={days} onChange={(e) => setDays(Number(e.target.value))}>
            <option value={7}>ultimele 7 zile</option>
            <option value={30}>ultimele 30 zile</option>
            <option value={90}>ultimele 90 zile</option>
          </select>
        </div>
      </section>
      <div className="a-kpis">
        <div className="a-card a-kpi">
          <span className="a-muted">Conversații</span>
          <strong>{data.conversations ?? 0}</strong>
        </div>
        <div className="a-card a-kpi">
          <span className="a-muted">Mesaje</span>
          <strong>{data.messages ?? 0}</strong>
        </div>
        <div className="a-card a-kpi">
          <span className="a-muted">Timp mediu răspuns</span>
          <strong style={{fontSize: 20}}>{Math.round(data.avgLatencyMs || 0)} ms</strong>
        </div>
        <div className="a-card a-kpi">
          <span className="a-muted">Răspunsuri reușite</span>
          <strong>{data.byStatus?.answered ?? 0}</strong>
        </div>
        <div className="a-card a-kpi">
          <span className="a-muted">Fără informații</span>
          <strong>{data.insufficient ?? 0}</strong>
        </div>
        <div className="a-card a-kpi">
          <span className="a-muted">Erori API</span>
          <strong>{data.apiErrors ?? 0}</strong>
        </div>
        <div className="a-card a-kpi">
          <span className="a-muted">Tokeni in</span>
          <strong>{data.tokens?.input ?? 0}</strong>
        </div>
        <div className="a-card a-kpi">
          <span className="a-muted">Tokeni out</span>
          <strong>{data.tokens?.output ?? 0}</strong>
        </div>
        <div className="a-card a-kpi">
          <span className="a-muted">Cost raportat de API</span>
          <strong style={{fontSize: 18}}>{money(data.cost?.reported)} USD</strong>
        </div>
        <div className="a-card a-kpi">
          <span className="a-muted">Cost estimat local</span>
          <strong style={{fontSize: 18}}>{money(data.cost?.estimated)} USD</strong>
          <span className="a-hint">estimările nu sunt facturi</span>
        </div>
        <div className="a-card a-kpi">
          <span className="a-muted">Feedback negativ</span>
          <strong>{data.negativeFeedback ?? 0}</strong>
        </div>
      </div>
      <UsageTable title="Pe provider" rows={data.byProvider} />
      <UsageTable title="Pe model" rows={data.byModel} />
      <section className="a-card a-panel">
        <h2>Întrebări frecvente</h2>
        {!data.topQuestions || data.topQuestions.length === 0 ? (
          <p className="a-empty">Fără date în perioada selectată.</p>
        ) : (
          <div className="a-table-wrap">
            <table className="a-table">
              <thead>
                <tr>
                  <th>Întrebare</th>
                  <th>Cereri</th>
                </tr>
              </thead>
              <tbody>
                {data.topQuestions.map((row, index) => (
                  <tr key={`${row.q}-${index}`}>
                    <td>{row.q}</td>
                    <td>{row.count ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
