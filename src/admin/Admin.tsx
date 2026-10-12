import {useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type FormEvent} from 'react';
import {api, type Collections, type Content, type FieldError, type Item, type Schema, type Value} from './api';
import {CollectionList, ItemEditor, countChanges, fillDefaults, idFieldOf, idOf, labelOf, newItem, publicUrl, type Ctx} from './Collections';

// ---------------------------------------------------------------------------
// Sections: friendly names + groups for the sidebar
// ---------------------------------------------------------------------------
const IMAGES_PREVIEW = 8;
const GROUPS = ['Global', 'Acasă', 'Pagini', 'Proiecte', 'Servicii', 'Blog', 'Componente'] as const;
const HERO_PARTS: Record<string, string> = {data: 'date', icons: 'unelte', Studio: 'editor', PropertyPanel: 'panou'};

const words = (s: string) => s.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[-_]/g, ' ');
const pageTitle = (data: Content, scope: string) =>
  String(data[scope]?.['meta-title'] ?? scope).split(/\s[—|~]\s|\s\|\s/)[0].trim();

type Section = {scope: string; group: (typeof GROUPS)[number]; label: string; href?: string};

function describe(scope: string, data: Content): Section {
  if (scope === '/') return {scope, group: 'Acasă', label: 'Pagina principală', href: '/'};
  if (scope === '404') return {scope, group: 'Pagini', label: 'Pagina 404'};
  if (scope.startsWith('/')) {
    const href = scope;
    if (scope === '/works') return {scope, group: 'Proiecte', label: 'Toate proiectele', href};
    if (scope.startsWith('/works/')) return {scope, group: 'Proiecte', label: pageTitle(data, scope), href};
    if (scope === '/services') return {scope, group: 'Servicii', label: 'Toate serviciile', href};
    if (scope.startsWith('/services/')) return {scope, group: 'Servicii', label: pageTitle(data, scope), href};
    if (scope === '/blog') return {scope, group: 'Blog', label: 'Toate articolele', href};
    if (scope.startsWith('/blog/category/')) return {scope, group: 'Blog', label: `Categorie · ${pageTitle(data, scope).split(' ')[0]}`, href};
    if (scope.startsWith('/blog/')) return {scope, group: 'Blog', label: pageTitle(data, scope), href};
    return {scope, group: 'Pagini', label: pageTitle(data, scope), href};
  }
  const parts = scope.split('/');
  const name = parts[parts.length - 1];
  const dir = parts[parts.length - 2];
  if (dir === 'layout' || scope === 'components/Logo') return {scope, group: 'Global', label: words(name)};
  if (dir === 'hero') return {scope, group: 'Acasă', label: `Hero · ${HERO_PARTS[name] ?? words(name)}`};
  if (dir === 'sections' || dir === 'approach') return {scope, group: 'Acasă', label: words(name)};
  if (scope === 'components/services/servicesData') return {scope, group: 'Acasă', label: 'Services · listă'};
  return {scope, group: 'Componente', label: `${words(dir)} · ${words(name)}`.replace(/^components · /, '')};
}

const isHtml = (v: string) => /<\/?[a-z][\s\S]*>/i.test(v);
const same = (a: Value, b: Value) => (Array.isArray(a) ? Array.isArray(b) && a.join('\n') === b.join('\n') : a === b);

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------
export default function Admin() {
  const [state, setState] = useState<'loading' | 'login' | 'ready'>('loading');
  useEffect(() => {
    api.session().then((r) => setState(r.ok ? 'ready' : 'login'));
  }, []);
  if (state === 'loading') return <div className="a-center"><span className="a-spinner" /></div>;
  if (state === 'login') return <Login onDone={() => setState('ready')} />;
  return <Editor onLogout={() => setState('login')} />;
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

function Editor({onLogout}: {onLogout: () => void}) {
  const [data, setData] = useState<Content | null>(null);
  const [images, setImages] = useState<Record<string, string[]>>({});
  const [active, setActive] = useState('/');
  const [drafts, setDrafts] = useState<Record<string, Record<string, Value>>>({});
  const [versions, setVersions] = useState<Record<string, number>>({});
  const [navQuery, setNavQuery] = useState('');
  const [fieldQuery, setFieldQuery] = useState('');
  const [showAllImages, setShowAllImages] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{text: string; error?: boolean} | null>(null);
  const [schemas, setSchemas] = useState<Record<string, Schema>>({});
  const [collections, setCollections] = useState<Collections>({});
  const [colDrafts, setColDrafts] = useState<Record<string, Item[]>>({});
  const [colErrors, setColErrors] = useState<Record<string, FieldError[]>>({});
  const [editing, setEditing] = useState<number | null>(null);
  const initialNew = useRef<string>('');

  useEffect(() => {
    api.content().then((r) => {
      if (r.status === 401) return onLogout();
      if (r.ok) {
        setData(r.data);
        setImages(r.images);
        setSchemas(r.schemas ?? {});
        setCollections(r.collections ?? {});
      }
    });
  }, [onLogout]);

  const notify = useCallback((text: string, error = false) => {
    setToast({text, error});
    window.setTimeout(() => setToast(null), 2600);
  }, []);

  // sections with editable texts and/or images
  const sections = useMemo(() => {
    if (!data) return [];
    const scopes = [...Object.keys(data), ...Object.keys(images).filter((s) => !(s in data))];
    return scopes.map((s) => describe(s, data));
  }, [data, images]);

  // number of changed fields per scope
  const changes = useMemo(() => {
    const out: Record<string, number> = {};
    if (!data) return out;
    for (const [scope, values] of Object.entries(drafts)) {
      const n = Object.entries(values).filter(([k, v]) => !same(v, data[scope][k])).length;
      if (n) out[scope] = n;
    }
    return out;
  }, [drafts, data]);
  const collectionList = useMemo(
    () => Object.entries(schemas).sort(([a, x], [b, y]) => (x.order ?? 999) - (y.order ?? 999) || a.localeCompare(b)),
    [schemas],
  );
  // number of changes per collection
  const colChanges = useMemo(() => {
    const out: Record<string, number> = {};
    for (const [name, draft] of Object.entries(colDrafts)) {
      if (!schemas[name]) continue;
      const n = countChanges(schemas[name], collections[name] ?? [], draft);
      if (n) out[name] = n;
    }
    return out;
  }, [colDrafts, collections, schemas]);
  const totalChanges =
    Object.values(changes).reduce((a, b) => a + b, 0) + Object.values(colChanges).reduce((a, b) => a + b, 0);

  const save = useCallback(async () => {
    if (!data || !totalChanges || saving) return;
    setSaving(true);
    const next = {...data};
    const nextCollections = {...collections};
    const nextDrafts = {...colDrafts};
    const nextErrors: Record<string, FieldError[]> = {};
    let failed: string | null = null;
    for (const name of Object.keys(colChanges)) {
      const items = colDrafts[name].map((it) => (it._id === undefined ? fillDefaults(it) : it));
      const r = await api.saveCollection(name, items);
      if (r.status === 401) {
        setSaving(false);
        return onLogout();
      }
      if (r.ok) {
        nextCollections[name] = r.items;
        delete nextDrafts[name];
      } else {
        const first = r.errors?.[0];
        failed = failed ?? (first ? `${r.error} (${labelOf(schemas[name], items[first.index ?? 0] ?? {})}: ${first.message})` : r.error ?? 'Salvarea a eșuat.');
        nextErrors[name] = r.errors ?? [];
        if (first?.index !== undefined) {
          setActive('col:' + name);
          setEditing(first.index);
        }
      }
    }
    setCollections(nextCollections);
    setColDrafts(nextDrafts);
    setColErrors(nextErrors);
    if (failed) {
      setSaving(false);
      return notify(failed, true);
    }
    for (const scope of Object.keys(changes)) {
      const values = Object.fromEntries(Object.entries(drafts[scope]).filter(([k, v]) => !same(v, data[scope][k])));
      const r = await api.saveTexts(scope, values);
      if (!r.ok) {
        setSaving(false);
        if (r.status === 401) return onLogout();
        return notify(r.error || 'Salvarea a eșuat.', true);
      }
      next[scope] = {...next[scope], ...values};
    }
    setData(next);
    setDrafts({});
    setSaving(false);
    notify(`Salvat · ${totalChanges} ${totalChanges === 1 ? 'modificare' : 'modificări'}`);
  }, [data, drafts, changes, totalChanges, saving, notify, onLogout, collections, colDrafts, colChanges, schemas]);

  // ⌘S / Ctrl+S, and a warning before leaving with unsaved edits
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        save();
      }
    };
    const onLeave = (e: BeforeUnloadEvent) => {
      if (totalChanges) e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('beforeunload', onLeave);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('beforeunload', onLeave);
    };
  }, [save, totalChanges]);

  if (!data) return <div className="a-center"><span className="a-spinner" /></div>;

  const colName = active.startsWith('col:') ? active.slice(4) : null;
  const schema = colName ? schemas[colName] : undefined;
  const section = sections.find((s) => s.scope === active) ?? sections[0];
  const texts = data[section.scope] ?? {};
  const entries = Object.entries(texts).filter(([key, value]) => {
    if (!fieldQuery) return true;
    const q = fieldQuery.toLowerCase();
    const current = drafts[section.scope]?.[key] ?? value;
    return key.includes(q) || String(Array.isArray(current) ? current.join(' ') : current).toLowerCase().includes(q);
  });
  const sectionImages = images[section.scope] ?? [];

  const setValue = (key: string, value: Value) =>
    setDrafts((d) => ({...d, [section.scope]: {...d[section.scope], [key]: value}}));

  const replaceImage = async (path: string, file: File) => {
    const r = await api.replaceImage(path, file);
    if (r.ok) {
      setVersions((v) => ({...v, [path]: r.version}));
      notify('Imagine înlocuită');
    } else {
      if (r.status === 401) return onLogout();
      notify(r.error || 'Încărcarea a eșuat.', true);
    }
  };

  const upload = async (file: File) => {
    const r = await api.upload(file);
    if (r.ok) return r.path;
    if (r.status === 401) onLogout();
    else notify(r.error || 'Încărcarea a eșuat.', true);
    return null;
  };
  const draftOf = (name: string): Item[] =>
    colDrafts[name] ?? (collections[name] ?? []).map((it, i) => ({...it, _id: idOf(schemas[name], it, i)}));
  const setDraft = (name: string, items: Item[]) => {
    setColDrafts((d) => ({...d, [name]: items}));
    setColErrors((e) => (e[name] ? {...e, [name]: []} : e));
  };
  const ctx: Ctx = {
    schemas,
    collections: Object.fromEntries(Object.keys(schemas).map((n) => [n, colDrafts[n] ?? collections[n] ?? []])),
    upload,
  };
  const openCollection = (name: string) => {
    setActive('col:' + name);
    setEditing(null);
  };
  const addItem = (name: string) => {
    const items = draftOf(name);
    const fresh = newItem(schemas[name]);
    initialNew.current = JSON.stringify(fresh);
    setDraft(name, [...items, fresh]);
    setEditing(items.length);
  };
  const closeItem = () => {
    if (colName && editing !== null) {
      const items = draftOf(colName);
      const it = items[editing];
      // an untouched new item is dropped instead of leaving an empty draft behind
      if (it && it._id === undefined && JSON.stringify(it) === initialNew.current) {
        const rest = items.filter((_, i) => i !== editing);
        setDraft(colName, rest);
      }
    }
    setEditing(null);
  };

  const q = navQuery.toLowerCase();
  return (
    <div className="a-shell">
      <aside className="a-side">
        <div className="a-brand">
          <Mark />
          <span>Admin</span>
        </div>
        <div className="a-search">
          <SearchIcon />
          <input placeholder="Caută secțiune" value={navQuery} onChange={(e) => setNavQuery(e.target.value)} />
        </div>
        <nav className="a-nav">
          {collectionList.length > 0 && (!q || collectionList.some(([, s]) => s.label.toLowerCase().includes(q))) && (
            <NavGroup title="Colecții" count={collectionList.length} defaultOpen>
              {collectionList
                .filter(([, s]) => !q || s.label.toLowerCase().includes(q))
                .map(([name, s]) => (
                  <button
                    key={name}
                    className={`a-nav-item${colName === name ? ' is-active' : ''}`}
                    onClick={() => openCollection(name)}
                  >
                    <span>{s.label}</span>
                    {colChanges[name] ? <i className="a-dot" /> : <em className="a-count">{(colDrafts[name] ?? collections[name] ?? []).length}</em>}
                  </button>
                ))}
            </NavGroup>
          )}
          {GROUPS.map((group) => {
            const items = sections.filter((s) => s.group === group && (!q || s.label.toLowerCase().includes(q) || s.scope.includes(q)));
            if (!items.length) return null;
            return (
              <NavGroup key={group} title={group} count={items.length} defaultOpen={['Global', 'Acasă', 'Pagini'].includes(group) || !!q}>
                {items.map((s) => (
                  <button
                    key={s.scope}
                    className={`a-nav-item${!colName && s.scope === section.scope ? ' is-active' : ''}`}
                    onClick={() => {
                      setActive(s.scope);
                      setEditing(null);
                      setFieldQuery('');
                      setShowAllImages(false);
                    }}
                  >
                    <span>{s.label}</span>
                    {changes[s.scope] ? <i className="a-dot" /> : null}
                  </button>
                ))}
              </NavGroup>
            );
          })}
        </nav>
        <button
          className="a-btn a-btn-ghost a-logout"
          onClick={async () => {
            await api.logout();
            onLogout();
          }}
        >
          Ieșire
        </button>
      </aside>

      <main className="a-main">
        <header className="a-bar">
          <div className="a-bar-title">
            <span className="a-crumb">
              {schema ? (
                editing !== null ? (
                  <button className="a-link" onClick={closeItem}>← {schema.label}</button>
                ) : 'Colecții'
              ) : section.group}
            </span>
            <h1>
              {schema
                ? editing !== null
                  ? labelOf(schema, draftOf(colName!)[editing] ?? {})
                  : schema.label
                : section.label}
            </h1>
          </div>
          <div className="a-bar-actions">
            {schema && editing !== null && (() => {
              const it = draftOf(colName!)[editing];
              const url = it && it._id !== undefined && schema.route ? publicUrl(schema, { ...it, ...(collections[colName!] ?? []).find((o, oi) => idOf(schema, o, oi) === it._id) }) : '';
              return url ? (
                <a className="a-btn a-btn-ghost" href={url} target="_blank" rel="noreferrer">Vezi pagina ↗</a>
              ) : null;
            })()}
            {!schema && section.href && (
              <a className="a-btn a-btn-ghost" href={section.href} target="_blank" rel="noreferrer">
                Vezi pagina ↗
              </a>
            )}
            <button className="a-btn a-btn-primary" onClick={save} disabled={!totalChanges || saving}>
              {saving ? 'Se salvează…' : totalChanges ? `Salvează (${totalChanges})` : 'Salvat'}
            </button>
          </div>
        </header>

        <div className="a-content">
          {schema && colName && editing === null && (
            <CollectionList
              name={colName}
              schema={schema}
              items={draftOf(colName)}
              saved={collections[colName] ?? []}
              onOpen={setEditing}
              onAdd={() => addItem(colName)}
              onMove={(i, dir) => {
                const items = [...draftOf(colName)];
                [items[i], items[i + dir]] = [items[i + dir], items[i]];
                setDraft(colName, items);
              }}
              onDelete={(i) => setDraft(colName, draftOf(colName).filter((_, j) => j !== i))}
            />
          )}
          {schema && colName && editing !== null && draftOf(colName)[editing] && (
            <ItemEditor
              key={colName + editing}
              schema={schema}
              item={draftOf(colName)[editing]}
              errors={(colErrors[colName] ?? []).filter((e) => e.index === editing)}
              ctx={ctx}
              onChange={(item) => setDraft(colName, draftOf(colName).map((it, i) => (i === editing ? item : it)))}
            />
          )}
          {!schema && sectionImages.length > 0 && (
            <section className="a-block">
              <div className="a-block-head">
                <h2>Imagini <span>{sectionImages.length}</span></h2>
                {sectionImages.length > IMAGES_PREVIEW && (
                  <button className="a-link" onClick={() => setShowAllImages((v) => !v)}>
                    {showAllImages ? 'Mai puține' : `Toate (${sectionImages.length})`}
                  </button>
                )}
              </div>
              <div className="a-images">
                {(showAllImages ? sectionImages : sectionImages.slice(0, IMAGES_PREVIEW)).map((path) => (
                  <ImageTile key={path} path={path} version={versions[path]} onReplace={(f) => replaceImage(path, f)} />
                ))}
              </div>
            </section>
          )}

          {!schema && Object.keys(texts).length > 0 && (
          <section className="a-block">
            <div className="a-block-head">
              <h2>Texte <span>{Object.keys(texts).length}</span></h2>
              <div className="a-search a-search-sm">
                <SearchIcon />
                <input placeholder="Filtrează" value={fieldQuery} onChange={(e) => setFieldQuery(e.target.value)} />
              </div>
            </div>
            <div className="a-card a-fields">
              {entries.map(([key, original]) => {
                const value = drafts[section.scope]?.[key] ?? original;
                return (
                  <Field
                    key={section.scope + key}
                    name={key}
                    value={value}
                    changed={!same(value, original)}
                    onChange={(v) => setValue(key, v)}
                    onReset={() => setValue(key, original)}
                  />
                );
              })}
              {!entries.length && <p className="a-empty">Niciun text găsit.</p>}
            </div>
          </section>
          )}
        </div>
      </main>

      {toast && <div className={`a-toast${toast.error ? ' is-error' : ''}`}>{toast.text}</div>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Pieces
// ---------------------------------------------------------------------------
function NavGroup({title, count, defaultOpen, children}: {title: string; count: number; defaultOpen: boolean; children: React.ReactNode}) {
  const [open, setOpen] = useState(defaultOpen);
  useEffect(() => setOpen(defaultOpen), [defaultOpen]);
  return (
    <div className="a-group">
      <button className="a-group-head" onClick={() => setOpen((o) => !o)}>
        <Chevron open={open} />
        <span>{title}</span>
        <em>{count}</em>
      </button>
      {open && <div className="a-group-items">{children}</div>}
    </div>
  );
}

function Field({name, value, changed, onChange, onReset}: {name: string; value: Value; changed: boolean; onChange: (v: Value) => void; onReset: () => void}) {
  const list = Array.isArray(value);
  const str = list ? value.join('\n') : value;
  const html = !list && isHtml(str);
  const multiline = list || html || str.length > 70 || str.includes('\n');
  const label = name === 'meta-title' ? 'Titlu în browser' : words(name);
  return (
    <label className={`a-field${changed ? ' is-changed' : ''}`}>
      <span className="a-field-label">
        {label}
        {html && <b>HTML</b>}
        {list && <b>listă · un rând per element</b>}
        {changed && (
          <button type="button" className="a-reset" onClick={(e) => { e.preventDefault(); onReset(); }}>
            Anulează
          </button>
        )}
      </span>
      {multiline ? (
        <AutoTextarea
          className={`a-input a-textarea${html || list ? ' is-mono' : ''}`}
          value={str}
          onChange={(v) => onChange(list ? v.split('\n') : v)}
        />
      ) : (
        <input className="a-input" value={str} onChange={(e) => onChange(e.target.value)} />
      )}
    </label>
  );
}

function AutoTextarea({value, onChange, className}: {value: string; onChange: (v: string) => void; className: string}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight + 2, 420) + 'px';
  }, [value]);
  return <textarea ref={ref} rows={2} className={className} value={value} onChange={(e) => onChange(e.target.value)} />;
}

function ImageTile({path, version, onReplace}: {path: string; version?: number; onReplace: (f: File) => void}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const name = path.split('/').pop()!;
  const ext = name.split('.').pop()!.toLowerCase();
  const accept = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : `image/${ext === 'svg' ? 'svg+xml' : ext}`;
  return (
    <button className="a-image" title={`${path}\nClick pentru a înlocui`} onClick={() => input.current?.click()}>
      <img src={version ? `${path}?v=${version}` : path} alt="" loading="lazy" />
      <span className="a-image-overlay">{busy ? 'Se încarcă…' : 'Înlocuiește'}</span>
      <span className="a-image-name">{name}</span>
      <input
        ref={input}
        type="file"
        accept={accept}
        hidden
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (!file) return;
          setBusy(true);
          await onReplace(file);
          setBusy(false);
        }}
      />
    </button>
  );
}

const Mark = () => (
  <svg className="a-mark" viewBox="0 0 54 54" fill="currentColor" aria-hidden>
    <path d="M54 0 27 54 0 0h10.8L27 32.4 43.2 0z" />
  </svg>
);
const SearchIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
);
const Chevron = ({open}: {open: boolean}) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{transform: open ? 'rotate(90deg)' : 'none'}} aria-hidden>
    <path d="m9 6 6 6-6 6" />
  </svg>
);
