import {useEffect, useState, type FormEvent} from 'react';
import {api, type CloudflareSettings} from './api';

type Notify = (text: string, error?: boolean) => void;
type Result = {ok: boolean; error?: string; status: number; settings: CloudflareSettings};

const when = (iso?: string | null) => (iso ? new Date(iso).toLocaleString('ro-RO') : 'încă nu, de la ultima pornire a serverului');

// Cloudflare cache: token, on/off, manual purge. The server empties the cache by itself after every save in the admin.
export default function Cloudflare({onLogout, notify}: {onLogout: () => void; notify: Notify}) {
  const [s, setS] = useState<CloudflareSettings | null>(null);
  const [busy, setBusy] = useState(false);
  const [loadError, setLoadError] = useState('');
  useEffect(() => {
    api.cloudflare().then((r) => {
      if (r.status === 401) return onLogout();
      if (r.ok) setS({...r.settings, token: '', zone: r.settings.zone || location.hostname.replace(/^www\./, '')});
      else setLoadError(r.status === 404 ? 'Serverul rulează o versiune veche — repornește-l ca să apară aceste setări.' : r.error || 'Nu am putut încărca setările.');
    });
  }, [onLogout]);

  const run = async (call: () => Promise<Result>, done: string) => {
    setBusy(true);
    const r = await call();
    setBusy(false);
    if (r.status === 401) return onLogout();
    if (r.ok) {
      setS((cur) => ({...r.settings, token: '', zone: r.settings.zone || cur?.zone || ''}));
      notify(done);
    } else notify(r.error || 'Nu a reușit.', true);
  };

  if (!s)
    return (
      <main className="a-main a-analytics">
        <div className="a-content">
          {loadError ? (
            <section className="a-card a-panel">
              <p className="a-error">{loadError}</p>
            </section>
          ) : (
            <span className="a-spinner" />
          )}
        </div>
      </main>
    );

  const set = (patch: Partial<CloudflareSettings>) => setS({...s, ...patch});
  const save = (e: FormEvent) => {
    e.preventDefault();
    run(() => api.saveCloudflare(s), s.enabled ? 'Cache-ul Cloudflare e activ, iar cache-ul vechi a fost golit.' : 'Setările Cloudflare au fost salvate.');
  };
  const proxy =
    s.proxied === true
      ? 'Da, traficul trece prin Cloudflare (norul portocaliu).'
      : s.proxied === false
        ? 'Nu. Norul e gri în Cloudflare → DNS, deci vizitatorii ajung direct la server și cache-ul nu se folosește. Pornește proxy-ul (norul portocaliu) pentru domeniu și www.'
        : s.dnsError
          ? `Nu pot verifica: ${s.dnsError}`
          : 'Nu am găsit înregistrări DNS pentru domeniu.';

  return (
    <main className="a-main a-analytics">
      <header className="a-bar">
        <div className="a-bar-title">
          <span className="a-crumb">Performanță</span>
          <h1>Cache Cloudflare</h1>
        </div>
      </header>
      <div className="a-content">
        <section className="a-card a-panel">
          <h2>Cache prin Cloudflare</h2>
          <p className="a-muted a-note">
            Cu cache-ul activ, paginile și imaginile se servesc din serverele Cloudflare, nu de pe serverul site-ului. După fiecare salvare din admin (texte, imagini, liste) și la fiecare repornire a
            serverului, cache-ul se golește automat, ca vizitatorii să vadă imediat modificările. Formularele, analytics și adminul nu trec niciodată prin cache.
          </p>
          <form onSubmit={save}>
            <label className="a-field is-inline">
              <span className="a-field-label">Cache activ</span>
              <button type="button" role="switch" aria-checked={s.enabled} className={`a-switch${s.enabled ? ' is-on' : ''}`} onClick={() => set({enabled: !s.enabled})} />
            </label>
            <label className="a-field">
              <span className="a-field-label">Domeniu</span>
              <input className="a-input is-mono" placeholder="exemplu.ro" value={s.zone} onChange={(e) => set({zone: e.target.value})} />
            </label>
            <label className="a-field">
              <span className="a-field-label">Token API Cloudflare</span>
              <input
                className="a-input is-mono"
                type="password"
                autoComplete="new-password"
                placeholder={s.hasToken ? 'Salvat — lasă gol ca să îl păstrezi' : ''}
                value={s.token ?? ''}
                onChange={(e) => set({token: e.target.value})}
              />
            </label>
            <div className="a-bar-actions" style={{padding: '10px 16px'}}>
              <button className="a-btn a-btn-primary" disabled={busy}>
                Salvează
              </button>
              <button type="button" className="a-btn a-btn-ghost" disabled={busy || !s.enabled || !s.hasToken} onClick={() => run(api.purgeCloudflare, 'Cache-ul Cloudflare a fost golit.')}>
                Golește cache-ul acum
              </button>
            </div>
          </form>
        </section>

        {s.hasToken && (
          <section className="a-card a-panel">
            <h2>Stare</h2>
            <p className="a-note">
              <strong>Proxy Cloudflare:</strong> {proxy}
            </p>
            <p className="a-note">
              <strong>Ultima golire a cache-ului:</strong> {when(s.lastPurge)}
            </p>
            {s.lastError && <p className="a-error">Ultima eroare: {s.lastError}</p>}
          </section>
        )}

        <section className="a-card a-panel">
          <h2>Cum creezi tokenul</h2>
          <ol className="a-note">
            <li>Cloudflare → My Profile → API Tokens → Create Token → Create Custom Token.</li>
            <li>Permissions: Zone → Zone → Read; Zone → Cache Purge → Purge; Zone → Cache Rules → Edit; Zone → DNS → Read.</li>
            <li>Zone Resources: Include → Specific zone → domeniul site-ului.</li>
            <li>Continue to summary → Create Token, apoi copiezi tokenul aici. Cloudflare îl arată o singură dată.</li>
          </ol>
        </section>
      </div>
    </main>
  );
}
