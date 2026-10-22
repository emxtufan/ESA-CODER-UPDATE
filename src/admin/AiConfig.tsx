// ---------------------------------------------------------------------------
// AI Assistant — configuration panes (overview, providers, models, settings).
// Providers owns the whole provider list: add/edit/delete and a live connection test.
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
  leadAfter: number; leadRequired: boolean; leadPrompt: string; ratingPrompt: string; teaserDelay: number;
  memoryWindow: number; cacheEnabled: boolean;
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
type AiProviderCost = {inputPer1M: number; outputPer1M: number};
type AiProvider = {
  id: string; name: string; type: string; role: string; baseUrl: string; model: string; enabled: boolean;
  timeoutMs: number; maxTokens: number; temperature: number | null; jsonMode: boolean; tokenParam: string;
  headers: Record<string, string>; priority: number; cost: AiProviderCost | null; allowPrivate: boolean;
  keyMask: string; hasKey: boolean;
};
type AiProviders = {
  providers: AiProvider[]; activeChat: string | null; fallbackChat: string | null; activeEmbedding: string | null;
  types: Record<string, {label: string; base: string; key: boolean}>;
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

type ProviderDraft = {
  id: string | null;
  name: string; type: string; role: 'chat' | 'embedding'; apiKey: string; revokeKey: boolean;
  baseUrl: string; model: string; enabled: boolean; timeoutMs: string; maxTokens: string; temperature: string;
  jsonMode: boolean; tokenParam: string; headers: string; priority: string; costInput: string; costOutput: string;
  allowPrivate: boolean;
};

// The form starts from the saved provider, or from the server defaults for a new one.
function draftOf(types: AiProviders['types'], p: AiProvider | null): ProviderDraft {
  return {
    id: p?.id ?? null,
    name: p?.name ?? '',
    type: p?.type ?? (Object.keys(types)[0] || 'openai'),
    role: p?.role === 'embedding' ? 'embedding' : 'chat',
    apiKey: '',
    revokeKey: false,
    baseUrl: p?.baseUrl ?? '',
    model: p?.model ?? '',
    enabled: p?.enabled ?? true,
    timeoutMs: String(p?.timeoutMs ?? 30000),
    maxTokens: String(p?.maxTokens ?? 700),
    temperature: typeof p?.temperature === 'number' ? String(p.temperature) : '',
    jsonMode: p?.jsonMode ?? true,
    tokenParam: p?.tokenParam ?? '',
    headers: p?.headers && Object.keys(p.headers).length ? JSON.stringify(p.headers, null, 2) : '{}',
    priority: String(p?.priority ?? 0),
    costInput: p?.cost ? String(p.cost.inputPer1M) : '',
    costOutput: p?.cost ? String(p.cost.outputPer1M) : '',
    allowPrivate: p?.allowPrivate ?? false,
  };
}

// One form for both add and edit: the fields the server validates, plus the model list when the
// provider can list it (only once saved, because the request needs an id).
function ProviderForm({types, provider, onSaved, onCancel}: {
  types: AiProviders['types'];
  provider: AiProvider | null;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<ProviderDraft>(() => draftOf(types, provider));
  const [models, setModels] = useState<string[]>([]);
  const [listed, setListed] = useState(false);
  const [manual, setManual] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (patch: Partial<ProviderDraft>) => setDraft((prev) => ({...prev, ...patch}));
  const info = types[draft.type];
  const privateAllowed = draft.type === 'ollama' || draft.type === 'openai-compatible';

  const loadModels = async () => {
    if (!provider || busy) return;
    setBusy(true);
    const r = await api.aiGet(`/providers/${encodeURIComponent(provider.id)}/models`);
    setBusy(false);
    if (!r.ok) {
      setError(r.error || 'Lista de modele nu a putut fi încărcată.');
      return;
    }
    setModels(Array.isArray(r.models) ? r.models : []);
    setManual(r.manual === true);
    setListed(true);
    setError('');
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const name = draft.name.trim();
    const model = draft.model.trim();
    if (!name) {
      setError('Numele providerului este obligatoriu.');
      return;
    }
    if (!model) {
      setError('Modelul este obligatoriu.');
      return;
    }
    const rawHeaders = draft.headers.trim();
    let headers: Record<string, string> = {};
    if (rawHeaders) {
      let parsed: unknown;
      try {
        parsed = JSON.parse(rawHeaders);
      } catch {
        setError('Headers: JSON invalid.');
        return;
      }
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        setError('Headers: trebuie să fie un obiect JSON cu valori text.');
        return;
      }
      const entries = Object.entries(parsed as Record<string, unknown>);
      const bad = entries.find(([, value]) => typeof value !== 'string');
      if (bad) {
        setError(`Headers: valoarea pentru „${bad[0]}” trebuie să fie text.`);
        return;
      }
      headers = Object.fromEntries(entries as [string, string][]);
    }
    const costIn = draft.costInput.trim();
    const costOut = draft.costOutput.trim();
    if ((costIn === '') !== (costOut === '')) {
      setError('Costul cere ambele valori (input și output) sau niciuna.');
      return;
    }
    const cost = costIn === '' ? null : {inputPer1M: Number(costIn), outputPer1M: Number(costOut)};
    if (cost && (!Number.isFinite(cost.inputPer1M) || !Number.isFinite(cost.outputPer1M))) {
      setError('Costul trebuie să fie numeric.');
      return;
    }
    const temperature = draft.temperature.trim() === '' ? null : Number(draft.temperature);
    if (temperature !== null && !Number.isFinite(temperature)) {
      setError('Temperatura trebuie să fie un număr sau gol.');
      return;
    }
    const body: Record<string, unknown> = {
      name,
      type: draft.type,
      role: draft.role,
      baseUrl: draft.baseUrl.trim(),
      model,
      enabled: draft.enabled,
      timeoutMs: Number(draft.timeoutMs),
      maxTokens: Number(draft.maxTokens),
      temperature,
      jsonMode: draft.jsonMode,
      tokenParam: draft.tokenParam,
      headers,
      priority: Number(draft.priority),
      cost,
      allowPrivate: privateAllowed && draft.allowPrivate,
    };
    if (draft.revokeKey) body.apiKey = null;
    else if (draft.apiKey.trim()) body.apiKey = draft.apiKey.trim();
    setBusy(true);
    const r = provider
      ? await api.aiSend('PUT', `/providers/${encodeURIComponent(provider.id)}`, body)
      : await api.aiSend('POST', '/providers', body);
    setBusy(false);
    if (!r.ok) {
      setError(r.error || 'Nu am putut salva providerul.');
      return;
    }
    setError('');
    onSaved();
  };

  return (
    <section className="a-card a-panel">
      <h2>{provider ? 'Editează providerul' : 'Provider nou'}</h2>
      <form onSubmit={submit}>
        <label className="a-field">
          <span className="a-field-label">Nume</span>
          <input className="a-input" value={draft.name} onChange={(e) => set({name: e.target.value})} placeholder="Ex.: OpenAI principal" />
        </label>
        <label className="a-field">
          <span className="a-field-label">Tip</span>
          <select className="a-input" value={draft.type} onChange={(e) => set({type: e.target.value})}>
            {Object.entries(types).map(([key, type]) => (
              <option key={key} value={key}>
                {type.label}
              </option>
            ))}
          </select>
        </label>
        <label className="a-field">
          <span className="a-field-label">Rol</span>
          <select className="a-input" value={draft.role} onChange={(e) => set({role: e.target.value as ProviderDraft['role']})}>
            <option value="chat">chat</option>
            <option value="embedding">embedding</option>
          </select>
        </label>
        <div className="a-field">
          <span className="a-field-label">Cheie API</span>
          <input
            className="a-input"
            type="password"
            autoComplete="off"
            value={draft.apiKey}
            disabled={draft.revokeKey}
            placeholder={provider?.hasKey ? '••• păstrează cheia existentă (lasă gol)' : ''}
            onChange={(e) => set({apiKey: e.target.value})}
          />
          {info?.key === false && <span className="a-hint">Cheia e opțională</span>}
          {provider?.hasKey && (
            <div className="a-bar-actions" style={{padding: '8px 0 0'}}>
              <button type="button" className="a-btn a-btn-ghost a-btn-sm" disabled={busy} onClick={() => set({revokeKey: !draft.revokeKey, apiKey: ''})}>
                {draft.revokeKey ? 'Anulează revocarea' : 'Revocă cheia'}
              </button>
            </div>
          )}
          {draft.revokeKey && <span className="a-hint">Cheia salvată va fi ștearsă.</span>}
        </div>
        <label className="a-field">
          <span className="a-field-label">Base URL</span>
          <input className="a-input" value={draft.baseUrl} placeholder={info?.base || ''} onChange={(e) => set({baseUrl: e.target.value})} />
        </label>
        <div className="a-field">
          <span className="a-field-label">Model</span>
          <div className="a-bar-actions">
            <input
              className="a-input"
              style={{flex: 1, minWidth: 0}}
              list="ai-provider-models"
              value={draft.model}
              aria-label="Model"
              placeholder="Ex.: gpt-4o-mini"
              onChange={(e) => set({model: e.target.value})}
            />
            {provider && (
              <button type="button" className="a-btn a-btn-ghost" style={{flex: 'none'}} disabled={busy} onClick={loadModels}>
                {busy ? 'Se încarcă…' : 'Încarcă modele'}
              </button>
            )}
          </div>
          <datalist id="ai-provider-models">
            {models.map((m) => (
              <option key={m} value={m} />
            ))}
          </datalist>
          {!provider && <span className="a-hint">Salvează providerul ca să poți încărca lista de modele.</span>}
          {listed && (manual || models.length === 0) && (
            <span className="a-hint">Providerul nu permite listarea; introdu Model ID manual.</span>
          )}
        </div>
        <div className="a-field">
          <span className="a-field-label">
            Activ
            <button
              type="button"
              role="switch"
              aria-checked={draft.enabled}
              aria-label="Provider activ"
              className={`a-switch${draft.enabled ? ' is-on' : ''}`}
              style={{marginLeft: 'auto'}}
              onClick={() => set({enabled: !draft.enabled})}
            >
              <i />
            </button>
          </span>
        </div>
        <label className="a-field">
          <span className="a-field-label">Timeout (ms)</span>
          <input className="a-input" type="number" min={1000} max={120000} step={1000} value={draft.timeoutMs} onChange={(e) => set({timeoutMs: e.target.value})} />
        </label>
        <label className="a-field">
          <span className="a-field-label">Tokeni maximi</span>
          <input className="a-input" type="number" min={16} max={16000} value={draft.maxTokens} onChange={(e) => set({maxTokens: e.target.value})} />
        </label>
        <label className="a-field">
          <span className="a-field-label">Temperatura</span>
          <input className="a-input" type="number" min={0} max={2} step={0.1} value={draft.temperature} onChange={(e) => set({temperature: e.target.value})} />
          <span className="a-hint">Lasă gol dacă modelul nu acceptă.</span>
        </label>
        <div className="a-field">
          <span className="a-field-label">
            JSON mode
            <button
              type="button"
              role="switch"
              aria-checked={draft.jsonMode}
              aria-label="JSON mode"
              className={`a-switch${draft.jsonMode ? ' is-on' : ''}`}
              style={{marginLeft: 'auto'}}
              onClick={() => set({jsonMode: !draft.jsonMode})}
            >
              <i />
            </button>
          </span>
          <span className="a-hint">răspuns JSON structurat; dezactivează dacă providerul nu suportă response_format</span>
        </div>
        <label className="a-field">
          <span className="a-field-label">Parametru pentru limita de tokeni</span>
          <select className="a-input" value={draft.tokenParam} onChange={(e) => set({tokenParam: e.target.value})}>
            <option value="">automat</option>
            <option value="max_tokens">max_tokens</option>
            <option value="max_completion_tokens">max_completion_tokens</option>
          </select>
        </label>
        <label className="a-field">
          <span className="a-field-label">Headers suplimentare (JSON)</span>
          <textarea className="a-input is-mono" rows={3} value={draft.headers} onChange={(e) => set({headers: e.target.value})} />
          <span className="a-hint">Obiect JSON cu valori text, ex. {'{"HTTP-Referer": "https://exemplu.ro"}'}.</span>
        </label>
        <label className="a-field">
          <span className="a-field-label">Prioritate</span>
          <input className="a-input" type="number" step={1} value={draft.priority} onChange={(e) => set({priority: e.target.value})} />
        </label>
        <div className="a-field">
          <span className="a-field-label">Cost (USD per 1M tokeni)</span>
          <div className="a-bar-actions">
            <input
              className="a-input"
              style={{flex: 1, minWidth: 0}}
              type="number"
              min={0}
              step={0.01}
              aria-label="Cost input per 1M tokeni"
              placeholder="input"
              value={draft.costInput}
              onChange={(e) => set({costInput: e.target.value})}
            />
            <input
              className="a-input"
              style={{flex: 1, minWidth: 0}}
              type="number"
              min={0}
              step={0.01}
              aria-label="Cost output per 1M tokeni"
              placeholder="output"
              value={draft.costOutput}
              onChange={(e) => set({costOutput: e.target.value})}
            />
          </div>
          <span className="a-hint">USD per 1M tokeni. Lasă ambele goale dacă nu știi prețul.</span>
        </div>
        {privateAllowed && (
          <div className="a-field">
            <label className="a-field-label" style={{margin: 0}}>
              <input type="checkbox" checked={draft.allowPrivate} onChange={(e) => set({allowPrivate: e.target.checked})} />
              Permite adrese private
            </label>
            <span className="a-hint">doar adrese din AI_PRIVATE_HOSTS</span>
          </div>
        )}
        <div className="a-bar-actions" style={{padding: '10px 0'}}>
          <button className="a-btn a-btn-primary" disabled={busy}>
            Salvează
          </button>
          <button type="button" className="a-btn a-btn-ghost" disabled={busy} onClick={onCancel}>
            Renunță
          </button>
        </div>
      </form>
      {error && <p className="a-error" role="alert">{error}</p>}
    </section>
  );
}

// Every provider with its role, key status and the badges of the active roles.
export function Providers() {
  const [data, setData] = useState<AiProviders | null>(null);
  const [editing, setEditing] = useState<AiProvider | 'new' | null>(null);
  const [tests, setTests] = useState<Record<string, {ok: boolean; text: string}>>({});
  const [confirming, setConfirming] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');

  const load = useCallback(async () => {
    const r = await api.aiGet('/providers');
    if (!r.ok) {
      setError(r.error || 'Nu am putut încărca providerii.');
      return;
    }
    setData(r);
    setError('');
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  if (!data)
    return error ? (
      <section className="a-card a-panel">
        <h2>Provideri</h2>
        <p className="a-error" role="alert">{error}</p>
      </section>
    ) : (
      <Loading />
    );

  const test = async (id: string) => {
    if (busy) return;
    setBusy(`test:${id}`);
    const r = await api.aiSend('POST', `/providers/${encodeURIComponent(id)}/test`);
    setBusy('');
    if (!r.ok) {
      setTests((prev) => ({...prev, [id]: {ok: false, text: r.error || 'Testul a eșuat.'}}));
      return;
    }
    const parts = [
      typeof r.latencyMs === 'number' ? `${Math.round(r.latencyMs)} ms` : '',
      typeof r.dims === 'number' && r.dims > 0 ? `${r.dims} dim` : '',
      typeof r.model === 'string' ? r.model : '',
    ].filter(Boolean);
    setTests((prev) => ({
      ...prev,
      [id]: {ok: r.ok === true, text: r.ok === true ? ['OK', ...parts].join(' · ') : r.error || 'Testul a eșuat.'},
    }));
  };

  const remove = async (id: string) => {
    if (busy) return;
    setBusy(`delete:${id}`);
    const r = await api.aiSend('DELETE', `/providers/${encodeURIComponent(id)}`);
    setBusy('');
    setConfirming('');
    if (!r.ok) {
      setError(r.error || 'Nu am putut șterge providerul.');
      return;
    }
    if (editing !== 'new' && editing?.id === id) setEditing(null);
    setError('');
    await load();
  };

  const badges = (p: AiProvider) =>
    [
      p.id === data.activeChat && 'activ',
      p.id === data.fallbackChat && 'fallback',
      p.id === data.activeEmbedding && 'embeddings',
    ].filter(Boolean) as string[];

  const draftFor = editing === 'new' ? null : editing;

  return (
    <>
      {editing && (
        <ProviderForm
          key={draftFor?.id || 'new'}
          types={data.types}
          provider={draftFor}
          onCancel={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            void load();
          }}
        />
      )}
      <section className="a-card a-panel">
        <div className="a-block-head">
          <h2>Provideri</h2>
          <div className="a-bar-actions">
            <button type="button" className="a-btn a-btn-primary" disabled={!!editing} onClick={() => setEditing('new')}>
              Adaugă provider
            </button>
          </div>
        </div>
        {error && <p className="a-error" role="alert">{error}</p>}
        {data.providers.length === 0 ? (
          <p className="a-empty">Niciun provider configurat.</p>
        ) : (
          <div className="a-table-wrap">
            <table className="a-table">
              <thead>
                <tr>
                  <th>Nume</th>
                  <th>Tip</th>
                  <th>Rol</th>
                  <th>Model</th>
                  <th>Activ</th>
                  <th>Cheie</th>
                  <th>Acțiuni</th>
                </tr>
              </thead>
              <tbody>
                {data.providers.map((p) => {
                  const result = tests[p.id];
                  return (
                    <tr key={p.id}>
                      <td>
                        <strong>{p.name}</strong>
                        {badges(p).map((label) => (
                          <em key={label} className="a-badge" style={{marginLeft: 6}}>
                            {label}
                          </em>
                        ))}
                      </td>
                      <td>{data.types[p.type]?.label || p.type}</td>
                      <td>{p.role}</td>
                      <td>{p.model}</td>
                      <td>{p.enabled ? 'da' : 'nu'}</td>
                      <td>{p.hasKey ? p.keyMask || 'cheie salvată' : 'fără cheie'}</td>
                      <td>
                        {confirming === p.id ? (
                          <div className="a-row-actions">
                            <span className="a-hint">Sigur?</span>
                            <button type="button" className="a-btn a-btn-ghost a-btn-sm" disabled={busy === `delete:${p.id}`} onClick={() => void remove(p.id)}>
                              Da
                            </button>
                            <button type="button" className="a-btn a-btn-ghost a-btn-sm" onClick={() => setConfirming('')}>
                              Nu
                            </button>
                          </div>
                        ) : (
                          <div className="a-row-actions">
                            <button type="button" className="a-btn a-btn-ghost a-btn-sm" disabled={!!busy} onClick={() => void test(p.id)}>
                              {busy === `test:${p.id}` ? 'Se testează…' : 'Testează'}
                            </button>
                            <button type="button" className="a-btn a-btn-ghost a-btn-sm" disabled={!!busy} onClick={() => setEditing(p)}>
                              Editează
                            </button>
                            <button type="button" className="a-btn a-btn-ghost a-btn-sm" disabled={!!busy} onClick={() => setConfirming(p.id)}>
                              Șterge
                            </button>
                          </div>
                        )}
                        {result && <div className={result.ok ? 'a-hint' : 'a-error'}>{result.text}</div>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
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

  const area = (key: 'welcome' | 'noInfo' | 'style' | 'leadPrompt', label: string, rows: number) => (
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
    const answer: ChatTest = r.reply || {status: '', text: '', sources: []};
    setReply({status: answer.status, text: answer.text || '', sources: answer.sources || []});
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
          {row('memoryWindow', 'Mesaje păstrate în context', {type: 'number', min: 1, max: 20})}
          <label className="a-field is-inline">
            <span className="a-field-label">Cache răspunsuri publice</span>
            <button
              type="button"
              role="switch"
              aria-checked={settings.cacheEnabled}
              className={`a-switch${settings.cacheEnabled ? ' is-on' : ''}`}
              onClick={() => set({cacheEnabled: !settings.cacheEnabled})}
            >
              <i />
            </button>
          </label>
          <div className="a-group-title">Captare email și feedback</div>
          <label className="a-field">
            <span className="a-field-label">Cere emailul după (întrebări)</span>
            <input
              className="a-input"
              type="number"
              min={0}
              max={20}
              value={String(settings.leadAfter ?? 0)}
              onChange={(e) => set({leadAfter: Number(e.target.value)})}
            />
            <span className="a-hint">după câte întrebări cere emailul; 0 = niciodată</span>
          </label>
          <label className="a-field is-inline">
            <span className="a-field-label">Email obligatoriu</span>
            <button
              type="button"
              role="switch"
              aria-checked={settings.leadRequired}
              className={`a-switch${settings.leadRequired ? ' is-on' : ''}`}
              onClick={() => set({leadRequired: !settings.leadRequired})}
            >
              <i />
            </button>
          </label>
          <p className="a-hint" style={{padding: '0 16px 6px'}}>vizitatorul nu poate continua fără email</p>
          {area('leadPrompt', 'Mesaj pentru cererea emailului', 3)}
          {row('ratingPrompt', 'Mesajul de rating', {placeholder: 'Cum a fost conversația?'})}
          <label className="a-field">
            <span className="a-field-label">Întârziere balon (secunde)</span>
            <input
              className="a-input"
              type="number"
              min={0}
              max={120}
              value={String(settings.teaserDelay ?? 0)}
              onChange={(e) => set({teaserDelay: Number(e.target.value)})}
            />
            <span className="a-hint">secunde până apare balonul cu mesaj lângă buton; 0 = fără balon</span>
          </label>
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
