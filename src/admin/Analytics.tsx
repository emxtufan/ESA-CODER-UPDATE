import {useCallback, useEffect, useRef, useState} from 'react';
import {api, type AnalyticsSummary, type Visit} from './api';

const PERIODS = [7, 30, 90, 365];
const periodLabel = (d: number) => (d === 365 ? '1 an' : `${d} zile`);
const TABS = [
  {key: 'overview', label: 'Prezentare'},
  {key: 'sources', label: 'Surse și campanii'},
  {key: 'audience', label: 'Public'},
  {key: 'pages', label: 'Pagini'},
  {key: 'visitors', label: 'Vizitatori'},
] as const;
const regions = (() => {
  try {
    return new Intl.DisplayNames(['ro'], {type: 'region'});
  } catch {
    return null;
  }
})();
const country = (code: string) => (code ? `${regions?.of(code) ?? code}` : '—');
const SOURCE_LABELS: Record<string, string> = {direct: 'Direct (fără sursă)', search: 'Căutare (Google, Bing…)'};
const when = (iso: string) => {
  const s = (Date.now() - Date.parse(iso)) / 1000;
  if (s < 60) return 'acum';
  if (s < 3600) return `acum ${Math.floor(s / 60)} min`;
  if (s < 86400) return `acum ${Math.floor(s / 3600)} h`;
  return new Date(iso).toLocaleString('ro-RO', {day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'});
};
const fmt = (n: number) => n.toLocaleString('ro-RO');

const duration = (s: number) => (s < 60 ? `${Math.round(s)} s` : `${Math.floor(s / 60)} min ${Math.round(s % 60)} s`);
const WEEKDAY_LABELS = ['Lun', 'Mar', 'Mie', 'Joi', 'Vin', 'Sâm', 'Dum'];
const DEVICE_LABELS: Record<string, string> = {mobile: 'Telefon', tablet: 'Tabletă', desktop: 'Desktop'};

// Who visits the site, from where and through which campaign (server/analytics.mjs; cookieless).
// Rendered in the right-hand pane of the section editor, like any section.
export default function Analytics({onLogout}: {onLogout: () => void}) {
  const [days, setDays] = useState(30);
  const [tab, setTab] = useState<(typeof TABS)[number]['key']>('overview');
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const loadId = useRef(0);

  const load = useCallback(async () => {
    const id = ++loadId.current;
    try {
      const r = await api.analytics(days);
      if (id !== loadId.current) return;
      if (r.status === 401) return onLogout();
      if (r.ok) {
        setData(r);
        setError('');
      } else setError(r.error || 'Nu am putut încărca datele.');
    } catch {
      if (id === loadId.current) setError('Nu am putut încărca datele. Verifică conexiunea și reîncearcă.');
    }
  }, [days, onLogout]);
  useEffect(() => {
    load();
    const t = window.setInterval(load, 60000);
    return () => window.clearInterval(t);
  }, [load]);

  const remove = async (sid: string) => {
    if (busy || !window.confirm('Ștergi definitiv detaliile acestei vizite, inclusiv IP-ul și paginile vizitate? Statisticile agregate rămân.')) return;
    setBusy(true);
    setError('');
    setMessage('');
    ++loadId.current;
    try {
      const r = await api.deleteVisit(sid);
      if (r.status === 401) return onLogout();
      if (!r.ok) return setError(r.error || 'Nu am putut șterge datele.');
      setMessage('Detaliile vizitei au fost șterse.');
      await load();
    } catch {
      setError('Nu am putut confirma ștergerea. Verifică conexiunea și reîmprospătează datele.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="a-main a-analytics">
      <header className="a-bar">
        <div className="a-bar-title">
          <span className="a-crumb">Analiză</span>
          <h1>Trafic</h1>
        </div>
        <div className="a-bar-actions">
          <div className="a-seg" role="group" aria-label="Perioadă">
            {PERIODS.map((d) => (
              <button key={d} className={d === days ? 'is-active' : ''} disabled={busy} onClick={() => setDays(d)}>{periodLabel(d)}</button>
            ))}
          </div>
          <button className="a-btn a-btn-ghost" disabled={busy} onClick={load}>Reîmprospătează</button>
          <a className="a-btn a-btn-ghost" href="/admin/gdpr">Retenție și curățare GDPR</a>
        </div>
      </header>
      <div className="a-content">
        {error && <p className="a-error" role="alert">{error}</p>}
        {message && <p className="a-muted" role="status">{message}</p>}
        {!data ? (
          <div className="a-center"><span className="a-spinner" /></div>
        ) : (
          <>
            <div className="an-strip a-card">
              <Stat label="Online acum" value={fmt(data.online)} note="ultimele 5 min" live={data.online > 0} />
              <Stat label="Azi" value={fmt(data.totals.today)} />
              <Stat label={`Vizite · ${periodLabel(days)}`} value={fmt(data.totals.range)} note={`${fmt(data.totals.allTime)} de la început`} />
              <Stat label="Pagini văzute" value={fmt(data.totals.views)} note={`${data.engagement.pagesPerVisit.toFixed(1)} / vizită`} />
              <Stat label="Timp mediu" value={duration(data.engagement.avgDuration)} />
              <Stat label="Respingere" value={`${Math.round(data.engagement.bounceRate * 100)}%`} note="pleacă după o pagină" />
              <Stat label="Revin" value={fmt(data.engagement.returning)} note={`${fmt(data.ips.length)} IP-uri distincte`} />
            </div>

            <div className="rq-tabs an-tabs" role="tablist">
              {TABS.map((t) => (
                <button key={t.key} role="tab" aria-selected={tab === t.key} className={tab === t.key ? 'is-active' : ''} onClick={() => setTab(t.key)}>
                  {t.label}
                </button>
              ))}
            </div>

            {tab === 'overview' && (
              <>
                <section className="a-card a-panel">
                  <h2>Vizite pe zi</h2>
                  <Bars
                    label="Vizite pe zi"
                    height={150}
                    bars={data.daily.map((d, i) => ({
                      key: d.date,
                      value: d.visits,
                      title: `${dayLabel(d.date)} · ${fmt(d.visits)} vizite · ${fmt(d.views)} pagini`,
                      tick: i === 0 || i === data.daily.length - 1 ? dayLabel(d.date) : '',
                    }))}
                  />
                </section>
                <div className="a-tops">
                  <Top title="Surse" rows={data.sources} label={(k) => SOURCE_LABELS[k] ?? k} total={data.totals.range} />
                  <Top title="Pagini văzute" rows={data.pages} total={data.totals.views} />
                  <Top title="Țări" rows={data.countries} label={country} total={data.totals.range} />
                </div>
                <div className="a-tops a-tops-2">
                  <section className="a-card a-panel">
                    <h2>Ora vizitei <small className="a-muted">ora locală a vizitatorului</small></h2>
                    <Bars label="Vizite pe oră" height={90} bars={data.hours.map((n, h) => ({key: String(h), value: n, title: `${h}:00–${h}:59 · ${fmt(n)} vizite`, tick: h % 6 === 0 ? `${h}:00` : ''}))} />
                  </section>
                  <section className="a-card a-panel">
                    <h2>Ziua săptămânii</h2>
                    <Bars label="Vizite pe zi a săptămânii" height={90} bars={data.weekdays.map((n, i) => ({key: WEEKDAY_LABELS[i], value: n, title: `${WEEKDAY_LABELS[i]} · ${fmt(n)} vizite`, tick: WEEKDAY_LABELS[i]}))} />
                  </section>
                </div>
              </>
            )}

            {tab === 'sources' && (
              <>
                <div className="a-tops">
                  <Top title="Surse" rows={data.sources} label={(k) => SOURCE_LABELS[k] ?? k} total={data.totals.range} />
                  <Top title="Site-uri care trimit vizitatori" rows={data.referrers} total={data.totals.range} />
                  <Top title="Campanii (utm_campaign)" rows={data.campaigns} total={data.totals.range} />
                  {data.mediums.length > 0 && <Top title="Mediu (utm_medium)" rows={data.mediums} total={data.totals.range} />}
                  {data.contents.length > 0 && <Top title="Reclamă / variantă (utm_content)" rows={data.contents} total={data.totals.range} />}
                  {data.terms.length > 0 && <Top title="Cuvinte cheie (utm_term)" rows={data.terms} total={data.totals.range} />}
                </div>
                <section className="a-card a-panel">
                  <h2>Campanii în detaliu <small className="a-muted">sursă · mediu · campanie, din linkurile cu utm_*</small></h2>
                  {data.campaignDetails.length ? (
                    <table className="a-table">
                      <thead><tr><th>Sursă · mediu · campanie</th><th>Vizite</th><th>Pagini</th></tr></thead>
                      <tbody>
                        {data.campaignDetails.map((c) => (
                          <tr key={c.key}><td>{c.key}</td><td>{fmt(c.visits)}</td><td>{fmt(c.views)}</td></tr>
                        ))}
                      </tbody>
                    </table>
                  ) : <p className="a-empty">Încă nicio vizită dintr-un link cu UTM. Folosește generatorul de mai jos.</p>}
                </section>
                <UtmBuilder />
              </>
            )}

            {tab === 'audience' && (
              <>
                <div className="an-map-row">
                  <section className="a-card a-panel">
                    <h2>Hartă vizitatori · {periodLabel(days)}</h2>
                    <CountryMap rows={data.countries} />
                  </section>
                  <div className="an-stack">
                    <Top title="Țări (estimat)" rows={data.countries} label={country} total={data.totals.range} />
                    {data.cities.length > 0 && <Top title="Orașe" rows={data.cities} total={data.totals.range} />}
                  </div>
                </div>
                <div className="a-tops">
                  <Top title="Dispozitive" rows={data.devices} label={(k) => DEVICE_LABELS[k] ?? k} total={data.totals.range} />
                  <Top title="Browsere" rows={data.browsers} total={data.totals.range} />
                  <Top title="Sisteme de operare" rows={data.os} total={data.totals.range} />
                  <Top title="Rezoluții de ecran" rows={data.screens} label={(k) => k.replace('x', ' × ')} total={data.totals.range} />
                  <Top title="Limba browserului" rows={data.langs} total={data.totals.range} />
                </div>
              </>
            )}

            {tab === 'pages' && (
              <div className="a-tops">
                <Top title="Pagini văzute" rows={data.pages} total={data.totals.views} limit={15} />
                <Top title="Pagini de intrare" rows={data.landings} total={data.totals.range} limit={15} />
                <Top title="Pagini de ieșire" rows={data.exits} total={data.engagement.sample} limit={15} />
              </div>
            )}

            {tab === 'visitors' && (
              <>
                <section className="a-card a-panel">
                  <h2>Adrese IP <small className="a-muted">mai multe persoane din aceeași rețea pot avea același IP</small></h2>
                  {data.ips.length ? (
                    <div className="a-table-wrap">
                      <table className="a-table">
                        <thead><tr><th>IP</th><th>De unde</th><th>Dispozitiv</th><th>Vizite</th><th>Pagini</th><th>Prima vizită</th><th>Ultima vizită</th></tr></thead>
                        <tbody>
                          {data.ips.map((e) => (
                            <tr key={e.ip}>
                              <td><code>{e.ip}</code></td>
                              <td>{[e.city, country(e.country)].filter(Boolean).join(', ')}</td>
                              <td>{DEVICE_LABELS[e.device] ?? e.device}<div className="a-muted">{e.browser} · {e.os}</div></td>
                              <td>{fmt(e.visits)}</td>
                              <td>{fmt(e.views)}</td>
                              <td>{when(e.first)}</td>
                              <td>{when(e.last)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : <p className="a-empty">Nicio adresă IP în perioada aleasă.</p>}
                </section>
                <section className="a-card a-panel">
                  <h2>Ultimele vizite</h2>
                  <p className="a-muted a-note">Ștergerea unei vizite elimină detaliile ei, inclusiv IP-ul și traseul prin site, și necesită acces GDPR nominal. Statisticile agregate rămân; pentru curățare în masă folosește „Retenție și curățare GDPR”.</p>
                  <Recent visits={data.recent} onDelete={remove} busy={busy} />
                </section>
              </>
            )}

            {data.engagement.sample < data.totals.range && (
              <p className="a-muted a-note">Timpul, respingerea, IP-urile și paginile de ieșire se calculează din ultimele {fmt(data.engagement.sample)} vizite păstrate în detaliu.</p>
            )}
          </>
        )}
      </div>
    </main>
  );
}

function Stat({label, value, note, live}: {label: string; value: string; note?: string; live?: boolean}) {
  return (
    <div className="an-stat">
      <span className="an-stat-label">{live && <i className="an-live" />}{label}</span>
      <strong>{value}</strong>
      {note && <small>{note}</small>}
    </div>
  );
}

const dayLabel = (date: string) => new Date(date + 'T12:00:00Z').toLocaleDateString('ro-RO', {day: 'numeric', month: 'short'});

// One series as bars in the accent color: a tooltip per bar, the highest one labelled, optional ticks below.
type Bar = {key: string; value: number; title: string; tick?: string};
function Bars({bars, label, height = 180}: {bars: Bar[]; label: string; height?: number}) {
  const max = Math.max(1, ...bars.map((b) => b.value));
  const peak = bars.reduce((a, b) => (b.value > a.value ? b : a), bars[0]);
  return (
    <div className="a-bars">
      <div className="a-bars-plot" style={{height}} role="img" aria-label={`${label}, maxim ${peak.value} (${peak.title.split(' · ')[0]})`}>
        {bars.map((b) => (
          <div key={b.key} className="a-bars-col" title={b.title}>
            {b === peak && b.value > 0 && <span className="a-bars-peak">{fmt(b.value)}</span>}
            <i style={{height: `${(b.value / max) * 100}%`}} />
          </div>
        ))}
      </div>
      <div className="a-bars-ticks a-muted">
        {bars.map((b) => <span key={b.key}>{b.tick}</span>)}
      </div>
    </div>
  );
}

function Top({title, rows, total, label = (k) => k, limit = 6}: {title: string; rows: {key: string; count: number}[]; total: number; label?: (k: string) => string; limit?: number}) {
  const [all, setAll] = useState(false);
  const max = Math.max(1, ...rows.map((r) => r.count));
  const shown = all ? rows : rows.slice(0, limit);
  return (
    <section className="a-card a-panel">
      <h2>{title}</h2>
      {rows.length ? (
        <>
          <ul className="a-toplist">
            {shown.map((r) => (
              <li key={r.key} title={`${fmt(r.count)} · ${total ? Math.round((r.count / total) * 100) : 0}%`}>
                <i style={{width: `${(r.count / max) * 100}%`}} />
                <span>{label(r.key)}</span>
                <b>{fmt(r.count)}</b>
              </li>
            ))}
          </ul>
          {rows.length > limit && (
            <button className="an-more" onClick={() => setAll(!all)}>{all ? 'Arată mai puține' : `Arată toate (${rows.length})`}</button>
          )}
        </>
      ) : <p className="a-empty">Nicio dată în perioada aleasă.</p>}
    </section>
  );
}

// Visits per country on a world map: one hue, light → dark in 5 steps; countries without visits stay neutral.
// The shapes (Natural Earth 1:110m, ~110 KB, scripts/build-world-map.mjs) load only here, never on the site.
type WorldMap = {viewBox: string; locations: {id: string; path: string}[]};
const STEPS = [30, 48, 66, 84, 100];
function CountryMap({rows}: {rows: {key: string; count: number}[]}) {
  const [map, setMap] = useState<WorldMap | null>(null);
  const [hover, setHover] = useState<{id: string; x: number; y: number} | null>(null);
  useEffect(() => {
    import('./world-map.json').then((m) => setMap(m.default as WorldMap));
  }, []);
  const counts = Object.fromEntries(rows.map((r) => [r.key.toLowerCase(), r.count]));
  const max = Math.max(1, ...rows.map((r) => r.count));
  const step = (n: number) => STEPS[Math.max(0, Math.ceil((Math.log(n + 1) / Math.log(max + 1)) * STEPS.length) - 1)];
  const fill = (n?: number) => (n ? `color-mix(in oklab, var(--accent) ${step(n)}%, var(--panel))` : 'var(--hover)');
  if (!map) return <div className="a-map is-loading" />;
  return (
    <div className="a-map" onMouseLeave={() => setHover(null)}>
      <svg
        viewBox={map.viewBox}
        role="img"
        aria-label={`Vizite pe țări: ${rows.map((r) => `${country(r.key)} ${r.count}`).join(', ') || 'nicio vizită'}`}
        onMouseMove={(e) => {
          const id = (e.target as Element).getAttribute('data-id');
          const box = e.currentTarget.getBoundingClientRect();
          setHover(id ? {id, x: e.clientX - box.left, y: e.clientY - box.top} : null);
        }}
      >
        {map.locations.map((l) => (
          <path key={l.id} data-id={l.id} d={l.path} fill={fill(counts[l.id])} className={hover?.id === l.id ? 'is-hover' : undefined} />
        ))}
      </svg>
      {hover && (
        <div className="a-map-tip" style={{left: hover.x, top: hover.y}}>
          <b>{country(hover.id.toUpperCase())}</b> · {fmt(counts[hover.id] ?? 0)} vizite
        </div>
      )}
      <div className="a-map-legend a-muted">
        <span>1</span>
        {STEPS.map((s) => <i key={s} style={{background: `color-mix(in oklab, var(--accent) ${s}%, var(--panel))`}} />)}
        <span>{fmt(max)}</span>
      </div>
    </div>
  );
}

function Recent({visits, onDelete, busy}: {visits: Visit[]; onDelete: (sid: string) => void; busy: boolean}) {
  const [open, setOpen] = useState<string | null>(null);
  if (!visits.length) return <p className="a-empty">Încă nicio vizită.</p>;
  return (
    <div className="a-table-wrap">
      <table className="a-table">
        <thead>
          <tr><th>Când</th><th>Sursă / campanie</th><th>De unde</th><th>Dispozitiv</th><th>Intrare</th><th>Pagini</th><th>Ultima vizualizare</th><th>Acțiuni</th></tr>
        </thead>
        <tbody>
          {visits.map((v) => (
            <tr key={v.sid} onClick={() => setOpen(open === v.sid ? null : v.sid)} className="is-clickable">
              <td>{when(v.at)}</td>
              <td>
                <b>{SOURCE_LABELS[v.source] ?? v.source}</b>
                {(v.medium || v.campaign) && <div className="a-muted">{[v.medium, v.campaign, v.content].filter(Boolean).join(' · ')}</div>}
                {v.referrer && <div className="a-muted">via {v.referrer}</div>}
              </td>
              <td>{[v.city, country(v.country)].filter(Boolean).join(', ')}<div className="a-muted">{v.ip && <code>{v.ip}</code>} {v.tz}</div></td>
              <td>{DEVICE_LABELS[v.device] ?? v.device}<div className="a-muted">{v.browser} · {v.os}</div></td>
              <td>{v.landing}</td>
              <td>
                {v.views.length}
                {open === v.sid && (
                  <ol className="a-path">
                    {v.views.map((p) => <li key={p.at + p.path}>{p.path} <span className="a-muted">{new Date(p.at).toLocaleTimeString('ro-RO', {hour: '2-digit', minute: '2-digit'})}</span></li>)}
                  </ol>
                )}
              </td>
              <td>{when(v.last)}<div className="a-muted">{v.views.at(-1)?.path}</div></td>
              <td><button className="a-btn a-btn-ghost a-btn-sm is-danger" disabled={busy} aria-label={`Șterge vizita din ${when(v.at)} pe ${v.landing}`} onClick={(event) => {event.stopPropagation(); onDelete(v.sid);}}>Șterge</button></td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="a-muted a-note">Click pe un rând pentru drumul complet prin site.</p>
    </div>
  );
}

// How identification works: a link carries utm_* tags; the first page of the visit reads them.
function UtmBuilder() {
  const [f, setF] = useState({url: location.origin + '/', source: 'facebook', medium: 'paid_social', campaign: '', content: '', term: ''});
  const [copied, setCopied] = useState(false);
  let link = '';
  try {
    const u = new URL(f.url);
    for (const k of ['source', 'medium', 'campaign', 'content', 'term'] as const) if (f[k].trim()) u.searchParams.set(`utm_${k}`, f[k].trim().toLowerCase().replace(/\s+/g, '-'));
    link = u.href;
  } catch {}
  const field = (k: keyof typeof f, label: string, hint: string) => (
    <label>
      <span className="a-field-label">{label}</span>
      <input className="a-input" value={f[k]} placeholder={hint} onChange={(e) => setF({...f, [k]: e.target.value})} />
    </label>
  );
  return (
    <section className="a-card a-panel">
      <h2>Generator de linkuri cu UTM</h2>
      <p className="a-muted a-note">
        Identificarea se face din link: pune linkul generat în reclamă, postare sau e-mail. La prima pagină a vizitei site-ul citește
        <code> utm_source</code>, <code>utm_medium</code>, <code>utm_campaign</code>, <code>utm_content</code>, <code>utm_term</code>. Fără UTM, sursa se
        deduce din site-ul de unde vine vizitatorul (Google → Căutare, facebook.com → Facebook), iar linkurile din Google Ads / Meta Ads
        sunt recunoscute și după <code>gclid</code> / <code>fbclid</code>.
      </p>
      <div className="a-utm">
        {field('url', 'Pagina', 'https://…')}
        {field('source', 'Sursă (utm_source)', 'facebook, google, newsletter')}
        {field('medium', 'Mediu (utm_medium)', 'cpc, paid_social, email')}
        {field('campaign', 'Campanie (utm_campaign)', 'oferta-octombrie')}
        {field('content', 'Reclamă / variantă (utm_content)', 'video-1, banner-a')}
        {field('term', 'Cuvânt cheie (utm_term)', 'web design')}
      </div>
      <div className="a-utm-out">
        <code>{link || 'Adresă invalidă'}</code>
        <button
          className="a-btn a-btn-primary"
          disabled={!link}
          onClick={async () => {
            await navigator.clipboard.writeText(link);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1500);
          }}
        >
          {copied ? 'Copiat' : 'Copiază'}
        </button>
      </div>
    </section>
  );
}
