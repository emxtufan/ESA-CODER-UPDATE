// ---------------------------------------------------------------------------
// AI Assistant — configuration panes (overview, providers, models, settings).
// Providers is still a placeholder; it comes in its own step.
// ---------------------------------------------------------------------------
import {useCallback, useEffect, useState, type FormEvent} from 'react';
import {api} from './api';

type ModelInfo = {name: string; model: string};
type KbStats = {
  lastSync: string | null; sources: number; approved: number; drafts: number;
  chunks: number; blocked: number; embedded: number; failed: number; needsReindex: boolean;
};
type AiSettings = {
  enabled: boolean; language: string; tone: string; welcome: string; noInfo: string; contactUrl: string;
  maxAnswerChars: number; style: string; citations: 'always' | 'when-available'; suggestions: string[];
  topK: number; minScore: number; retentionDays: number;
};
type AiLimits = {
  maxMessageChars: number; perSessionPerDay: number; perIpPerMinute: number; perIpPerDay: number;
  globalPerDay: number; monthlyBudget: number;
};
type AiOverview = {
  settings: AiSettings; limits: AiLimits; kb: KbStats;
  usage: {totals: {requests: number; input: number; output: number; costReported: number; costEstimated: number}};
  monthCost: number;
  active: {chat: ModelInfo | null; fallback: ModelInfo | null; embedding: ModelInfo | null};
};
type AiProvider = {id: string; name: string; type: string; role: string; model: string; enabled: boolean; jsonMode: boolean; hasKey: boolean};
type AiProviders = {
  providers: AiProvider[]; activeChat: string | null; fallbackChat: string | null; activeEmbedding: string | null;
  types: Record<string, {label: string}>;
};
type ChatTest = {status: number | string; text: string; sources: {title: string; url: string}[]};

const when = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleString('ro-RO', {day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'}) : 'niciodată';
const named = (m: ModelInfo | null | undefined, empty: string) => (m ? `${m.name} · ${m.model}` : empty);

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

// Assistant status, key figures and whatever needs attention (stale index, failed or blocked sources).
export function Overview() {
  const [data, setData] = useState<AiOverview | null>(null);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const r = await api.aiGet('/overview');
    if (r.ok) {
      setData(r);
      setError('');
    } else setError(r.error || 'Nu am putut încărca datele.');
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  const toggle = async () => {
    if (!data || busy) return;
    const enabled = !data.settings.enabled;
    setBusy(true);
    setSaved('');
    const r = await api.aiSend('PUT', '/settings', {enabled});
    setBusy(false);
    if (!r.ok) {
      setError(r.error || 'Nu am putut salva.');
      return;
    }
    setData({...data, settings: {...data.settings, ...(r.settings || {enabled})}});
    setError('');
    setSaved('Salvat.');
  };

  if (!data)
    return error ? (
      <section className="a-card a-panel">
        <h2>Overview</h2>
        <p className="a-error" role="alert">{error}</p>
      </section>
    ) : (
      <Loading />
    );

  const kb = data.kb || ({} as KbStats);
  const active: {chat?: ModelInfo | null; fallback?: ModelInfo | null; embedding?: ModelInfo | null} = data.active || {};
  const totals = data.usage?.totals;
  const warnings = [
    kb.needsReindex && 'Indexul nu mai corespunde surselor aprobate — fragmentele trebuie regenerate (Models → Reindexează acum).',
    kb.failed > 0 && `${kb.failed} ${kb.failed === 1 ? 'fragment a eșuat' : 'fragmente au eșuat'} la indexare și nu apar în răspunsuri.`,
    kb.blocked > 0 && `${kb.blocked} ${kb.blocked === 1 ? 'sursă este blocată' : 'surse sunt blocate'} și sunt excluse din căutare.`,
  ].filter(Boolean) as string[];

  return (
    <>
      {error && <p className="a-error" role="alert">{error}</p>}
      {saved && <p className="a-hint">{saved}</p>}
      <div className="a-kpis">
        <div className="a-card a-kpi">
          <span className="a-muted">Asistent</span>
          <strong>{data.settings?.enabled ? 'Activ' : 'Inactiv'}</strong>
          <button
            type="button"
            role="switch"
            aria-checked={!!data.settings?.enabled}
            aria-label="Asistent activ"
            disabled={busy}
            className={`a-switch${data.settings?.enabled ? ' is-on' : ''}`}
            onClick={toggle}
          >
            <i />
          </button>
        </div>
        <div className="a-card a-kpi">
          <span className="a-muted">Chat</span>
          <strong>{named(active.chat, 'neconfigurat')}</strong>
        </div>
        <div className="a-card a-kpi">
          <span className="a-muted">Fallback</span>
          <strong>{named(active.fallback, 'fără fallback')}</strong>
        </div>
        <div className="a-card a-kpi">
          <span className="a-muted">Embeddings</span>
          <strong>{named(active.embedding, 'căutare doar textuală')}</strong>
        </div>
        <div className="a-card a-kpi">
          <span className="a-muted">Surse</span>
          <strong>{kb.sources ?? 0}</strong>
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
          <span className="a-muted">Ultima sincronizare</span>
          <strong style={{fontSize: 15}}>{when(kb.lastSync)}</strong>
        </div>
        <div className="a-card a-kpi">
          <span className="a-muted">Cereri 30 zile</span>
          <strong>{totals?.requests ?? 0}</strong>
        </div>
        <div className="a-card a-kpi">
          <span className="a-muted">Cost lună</span>
          <strong style={{fontSize: 18}}>
            {(data.monthCost ?? 0).toFixed(4)} / {data.limits?.monthlyBudget ?? 0} USD (estimat)
          </strong>
        </div>
      </div>
      {warnings.length > 0 && (
        <section className="a-card a-panel">
          <h2>Necesită atenție</h2>
          <ul className="a-hint">
            {warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

export function Providers() {
  return <p className="a-muted">Se încarcă…</p>;
}

// Which provider serves each role, plus a reindex shortcut when the embedding index is stale.
export function Models() {
  const [ov, setOv] = useState<AiOverview | null>(null);
  const [pv, setPv] = useState<AiProviders | null>(null);
  const [chat, setChat] = useState('');
  const [fallback, setFallback] = useState('');
  const [embedding, setEmbedding] = useState('');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const [o, p] = await Promise.all([api.aiGet('/overview'), api.aiGet('/providers')]);
    if (!o.ok || !p.ok) {
      setError(o.error || p.error || 'Nu am putut încărca datele.');
      return;
    }
    setOv(o);
    setPv(p);
    setChat(p.activeChat || '');
    setFallback(p.fallbackChat || '');
    setEmbedding(p.activeEmbedding || '');
    setError('');
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  if (!ov || !pv)
    return error ? (
      <section className="a-card a-panel">
        <h2>Models</h2>
        <p className="a-error" role="alert">{error}</p>
      </section>
    ) : (
      <Loading />
    );

  const chatProviders = pv.providers.filter((p) => p.role === 'chat' && p.enabled);
  const fallbackProviders = chatProviders.filter((p) => p.id !== chat);
  const embeddingProviders = pv.providers.filter((p) => p.role === 'embedding' && p.enabled);

  // Type, model, JSON mode and key status of the provider picked in a select.
  const details = (id: string) => {
    const p = pv.providers.find((x) => x.id === id);
    if (!p) return null;
    return (
      <small className="a-hint">
        {pv.types?.[p.type]?.label || p.type} · {p.model} · JSON mode {p.jsonMode ? 'da' : 'nu'} · cheie {p.hasKey ? 'da' : 'nu'}
      </small>
    );
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setSaved('');
    const r = await api.aiSend('PUT', '/active', {
      activeChat: chat || null,
      fallbackChat: fallback || null,
      activeEmbedding: embedding || null,
    });
    setBusy(false);
    if (!r.ok) {
      setError(r.error || 'Nu am putut salva.');
      return;
    }
    if (r.active && 'activeChat' in r.active) {
      setChat(r.active.activeChat || '');
      setFallback(r.active.fallbackChat || '');
      setEmbedding(r.active.activeEmbedding || '');
    }
    setError('');
    setSaved('Salvat.');
  };

  const reindex = async () => {
    if (busy) return;
    setBusy(true);
    setSaved('');
    const r = await api.aiSend('POST', '/kb/reindex');
    setBusy(false);
    if (!r.ok) {
      setError(r.error || 'Reindexarea nu a putut fi pornită.');
      return;
    }
    setOv({...ov, kb: r.kb || ov.kb});
    setError('');
    setSaved('Salvat. Reindexarea a fost pornită.');
  };

  return (
    <section className="a-card a-panel">
      <h2>Modele</h2>
      <p className="a-hint">Schimbarea modelului de chat nu afectează istoricul sau indexul. Schimbarea modelului de embeddings cere reindexare.</p>
      <form onSubmit={save}>
        <label className="a-field">
          <span className="a-field-label">Chat activ</span>
          <select className="a-input" value={chat} onChange={(e) => setChat(e.target.value)}>
            <option value="">Fără</option>
            {chatProviders.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} · {p.model}
              </option>
            ))}
          </select>
          {details(chat)}
        </label>
        <label className="a-field">
          <span className="a-field-label">Fallback</span>
          <select className="a-input" value={fallback} onChange={(e) => setFallback(e.target.value)}>
            <option value="">Fără</option>
            {fallbackProviders.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} · {p.model}
              </option>
            ))}
          </select>
          {details(fallback)}
        </label>
        <label className="a-field">
          <span className="a-field-label">Embeddings</span>
          <select className="a-input" value={embedding} onChange={(e) => setEmbedding(e.target.value)}>
            <option value="">Fără (doar textual)</option>
            {embeddingProviders.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} · {p.model}
              </option>
            ))}
          </select>
          {details(embedding)}
        </label>
        <div className="a-bar-actions" style={{padding: '10px 0'}}>
          <button className="a-btn a-btn-primary" disabled={busy}>
            Salvează
          </button>
          {ov.kb?.needsReindex && (
            <button type="button" className="a-btn a-btn-ghost" disabled={busy} onClick={reindex}>
              Reindexează acum
            </button>
          )}
        </div>
      </form>
      {error && <p className="a-error" role="alert">{error}</p>}
      {saved && <p className="a-hint">{saved}</p>}
    </section>
  );
}

// Assistant instructions, rate/budget limits and a live test box.
export function Settings() {
  const [settings, setSettings] = useState<AiSettings | null>(null);
  const [limits, setLimits] = useState<AiLimits | null>(null);
  const [suggestions, setSuggestions] = useState('');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState('');
  const [busy, setBusy] = useState<'' | 'settings' | 'limits' | 'test'>('');
  const [message, setMessage] = useState('');
  const [reply, setReply] = useState<ChatTest | null>(null);

  const load = useCallback(async () => {
    const r = await api.aiGet('/overview');
    if (!r.ok) {
      setError(r.error || 'Nu am putut încărca setările.');
      return;
    }
    const list: string[] = r.settings?.suggestions || [];
    setSettings({...r.settings, suggestions: list});
    setLimits(r.limits);
    setSuggestions(list.join('\n'));
    setError('');
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  if (!settings || !limits)
    return error ? (
      <section className="a-card a-panel">
        <h2>Setări</h2>
        <p className="a-error" role="alert">{error}</p>
      </section>
    ) : (
      <Loading />
    );

  const set = (patch: Partial<AiSettings>) => setSettings({...settings, ...patch});
  const setL = (patch: Partial<AiLimits>) => setLimits({...limits, ...patch});

  const row = (key: keyof AiSettings, label: string, opts: {placeholder?: string; type?: string; min?: number; max?: number; step?: number} = {}) => (
    <label className="a-field">
      <span className="a-field-label">{label}</span>
      <input
        className="a-input"
        type={opts.type || 'text'}
        placeholder={opts.placeholder}
        min={opts.min}
        max={opts.max}
        step={opts.step}
        value={String(settings[key] ?? '')}
        onChange={(e) => set({[key]: opts.type === 'number' ? Number(e.target.value) : e.target.value} as Partial<AiSettings>)}
      />
    </label>
  );

  const area = (key: 'welcome' | 'noInfo' | 'style', label: string, rows: number) => (
    <label className="a-field">
      <span className="a-field-label">{label}</span>
      <textarea className="a-input" rows={rows} value={String(settings[key] ?? '')} onChange={(e) => set({[key]: e.target.value} as Partial<AiSettings>)} />
    </label>
  );

  const num = (key: keyof AiLimits, label: string, hint?: string) => (
    <label className="a-field">
      <span className="a-field-label">{label}</span>
      <input className="a-input" type="number" min={0} value={String(limits[key] ?? 0)} onChange={(e) => setL({[key]: Number(e.target.value)} as Partial<AiLimits>)} />
      {hint && <span className="a-hint">{hint}</span>}
    </label>
  );

  const saveSettings = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy('settings');
    setSaved('');
    const list = suggestions
      .split('\n')
      .map((v) => v.trim())
      .filter(Boolean)
      .slice(0, 6);
    const r = await api.aiSend('PUT', '/settings', {...settings, suggestions: list});
    setBusy('');
    if (!r.ok) {
      setError(r.error || 'Nu am putut salva instrucțiunile.');
      return;
    }
    const next = r.settings && 'suggestions' in r.settings ? r.settings.suggestions || [] : list;
    setSettings({...settings, ...(r.settings || {}), suggestions: next});
    setSuggestions(next.join('\n'));
    setError('');
    setSaved('Salvat.');
  };

  const saveLimits = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy('limits');
    setSaved('');
    const r = await api.aiSend('PUT', '/limits', {...limits});
    setBusy('');
    if (!r.ok) {
      setError(r.error || 'Nu am putut salva limitele.');
      return;
    }
    if (r.limits) setLimits({...limits, ...r.limits});
    setError('');
    setSaved('Salvat.');
  };

  const test = async (e: FormEvent) => {
    e.preventDefault();
    const question = message.trim();
    if (!question || busy) return;
    setBusy('test');
    setReply(null);
    const r = await api.aiSend('POST', '/test-chat', {message: question});
    setBusy('');
    if (!r.ok) {
      setError(r.error || 'Testul nu a putut fi rulat.');
      return;
    }
    setReply({status: r.status, text: r.text || '', sources: r.sources || []});
    setError('');
  };

  return (
    <>
      {error && <p className="a-error" role="alert">{error}</p>}
      {saved && <p className="a-hint">{saved}</p>}
      <section className="a-card a-panel">
        <h2>Instrucțiuni</h2>
        <form onSubmit={saveSettings}>
          <label className="a-field is-inline">
            <span className="a-field-label">Asistent activ</span>
            <button
              type="button"
              role="switch"
              aria-checked={settings.enabled}
              className={`a-switch${settings.enabled ? ' is-on' : ''}`}
              onClick={() => set({enabled: !settings.enabled})}
            >
              <i />
            </button>
          </label>
          {row('language', 'Limba', {placeholder: 'ro'})}
          {row('tone', 'Tonul răspunsurilor', {placeholder: 'prietenos și concis'})}
          {area('welcome', 'Mesaj de întâmpinare', 3)}
          {area('noInfo', 'Mesaj când nu există informație', 3)}
          {row('contactUrl', 'Link de contact', {placeholder: '/contact'})}
          {row('maxAnswerChars', 'Lungime maximă răspuns (caractere)', {type: 'number', min: 200, max: 4000})}
          {area('style', 'Stil', 4)}
          <label className="a-field">
            <span className="a-field-label">Citări</span>
            <select className="a-input" value={settings.citations} onChange={(e) => set({citations: e.target.value as AiSettings['citations']})}>
              <option value="always">întotdeauna</option>
              <option value="when-available">doar când există surse</option>
            </select>
          </label>
          <label className="a-field">
            <span className="a-field-label">Sugestii (una pe rând, maximum 6)</span>
            <textarea className="a-input" rows={4} value={suggestions} onChange={(e) => setSuggestions(e.target.value)} />
            <span className="a-hint">Se păstrează primele 6 rânduri completate.</span>
          </label>
          {row('topK', 'Fragmente folosite (topK)', {type: 'number', min: 1, max: 12})}
          {row('minScore', 'Prag de relevanță (minScore)', {type: 'number', min: 0, max: 1, step: 0.05})}
          {row('retentionDays', 'Păstrarea conversațiilor (zile)', {type: 'number', min: 1, max: 365})}
          <div className="a-bar-actions" style={{padding: '10px 0'}}>
            <button className="a-btn a-btn-primary" disabled={!!busy}>
              Salvează instrucțiunile
            </button>
          </div>
        </form>
      </section>
      <section className="a-card a-panel">
        <h2>Limite</h2>
        <p className="a-hint">Regulile de grounding și securitate sunt fixe în backend și nu pot fi dezactivate din aceste setări.</p>
        <form onSubmit={saveLimits}>
          {num('maxMessageChars', 'Lungime maximă mesaj (caractere)')}
          {num('perSessionPerDay', 'Mesaje per sesiune pe zi')}
          {num('perIpPerMinute', 'Mesaje per IP pe minut')}
          {num('perIpPerDay', 'Mesaje per IP pe zi')}
          {num('globalPerDay', 'Mesaje pe zi, în total', '0 înseamnă nelimitat.')}
          {num('monthlyBudget', 'Buget lunar (USD)', '0 blochează complet asistentul.')}
          <div className="a-bar-actions" style={{padding: '10px 0'}}>
            <button className="a-btn a-btn-primary" disabled={!!busy}>
              Salvează limitele
            </button>
          </div>
        </form>
      </section>
      <section className="a-card a-panel">
        <h2>Testează asistentul</h2>
        <form onSubmit={test}>
          <div className="a-bar-actions" style={{padding: '10px 0'}}>
            <input
              className="a-input"
              style={{flex: 1, minWidth: 0}}
              placeholder="Scrie o întrebare…"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <button className="a-btn a-btn-primary" style={{flex: 'none'}} disabled={busy === 'test' || !message.trim()}>
              {busy === 'test' ? 'Se testează…' : 'Trimite'}
            </button>
          </div>
        </form>
        {reply && (
          <>
            <p className="a-hint">Status: {reply.status}</p>
            <p style={{whiteSpace: 'pre-wrap'}}>{reply.text}</p>
            {reply.sources.length > 0 && (
              <ul className="a-hint">
                {reply.sources.map((s, i) => (
                  <li key={`${s.url}-${i}`}>{s.url ? <a href={s.url} target="_blank" rel="noreferrer">{s.title || s.url}</a> : s.title}</li>
                ))}
              </ul>
            )}
          </>
        )}
      </section>
    </>
  );
}
