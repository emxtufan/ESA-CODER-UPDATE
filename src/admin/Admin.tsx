import {useEffect, useState, type FormEvent} from 'react';
import {api} from './api';
import Advanced from './Advanced';
import Sections from './Sections';
import {Mark} from './Advanced';

// /admin            → section editor (Header, Footer, homepage sections)
// /admin/<section>  → the same, opened on that section
// /admin/advanced   → pages that are not homepage sections + full lists
// /admin/analytics  → who visits the site (a pane of the section editor, like a section)
export default function Admin() {
  const [state, setState] = useState<'loading' | 'login' | 'ready'>('loading');
  useEffect(() => {
    api.session().then((r) => setState(r.ok ? 'ready' : 'login'));
  }, []);
  if (state === 'loading') return <div className="a-center"><span className="a-spinner" /></div>;
  if (state === 'login') return <Login onDone={() => setState('ready')} />;
  const logout = () => setState('login');
  const route = location.pathname.replace(/\/+$/, '');
  return route.startsWith('/admin/advanced') ? <Advanced onLogout={logout} /> : <Sections onLogout={logout} />;
}

function Login({onDone}: {onDone: () => void}) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const r = await api.login(password);
    setBusy(false);
    if (r.ok) onDone();
    else setError(r.error || 'Autentificare eșuată.');
  };
  return (
    <div className="a-center">
      <form className="a-card a-login" onSubmit={submit}>
        <Mark />
        <h1>Admin</h1>
        <p className="a-muted">Introdu parola pentru a edita site-ul.</p>
        <input className="a-input" type="password" autoFocus placeholder="Parolă" value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <p className="a-error">{error}</p>}
        <button className="a-btn a-btn-primary" disabled={busy || !password}>{busy ? 'Se verifică…' : 'Continuă'}</button>
      </form>
    </div>
  );
}
