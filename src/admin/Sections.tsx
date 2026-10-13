import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {api, type Block, type Item, type SectionError, type SectionView, type TextField} from './api';
import {AutoTextarea, ImageTile, Mark} from './Advanced';
import Analytics from './Analytics';
import {CollectionList, ItemEditor, countChanges, labelOf, newItem, type Ctx} from './Collections';

// ---------------------------------------------------------------------------
// The admin follows the visible sections of the site (server/sections.json). One editor per section,
// showing only the content that belongs to it. Header and Footer are global: one editor each.
// ---------------------------------------------------------------------------
type Group = {key: string; label: string};
type Toast = {text: string; error?: boolean} | null;
type SaveFn = () => Promise<boolean>;
// Not a section of sections.json: the traffic analysis, shown in the same right-hand pane.
const ANALYTICS = 'analytics';

const idOf = (scope: string, key: string) => `${scope}::${key}`;
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

// "*highlight*" markup: the site highlights one fragment of some headings; the editor sees it as *text*.
type RichPart = {key: string; accent?: boolean; gapBefore?: string};
function richCompose(parts: RichPart[], scope: string, texts: Record<string, string>) {
  return parts.map((p) => (p.gapBefore ?? '') + (p.accent ? `*${texts[idOf(scope, p.key)] ?? ''}*` : texts[idOf(scope, p.key)] ?? '')).join('');
}
function richParse(parts: RichPart[], scope: string, raw: string): {values: Record<string, string>} | {error: string} {
  const accents = parts.filter((p) => p.accent).length;
  const segments = raw.split('*');
  if (segments.length !== accents * 2 + 1) {
    return {error: accents === 1 ? 'Pune textul evidențiat între două asteriscuri, exact o dată: *așa*.' : `Folosește exact ${accents} perechi de asteriscuri pentru textele evidențiate.`};
  }
  // slots alternate plain, accent, plain, …; an accent at the very start/end leaves an empty plain slot
  const slots: (number | null)[] = [];
  if (parts[0].accent) slots.push(null);
  parts.forEach((_p, i) => slots.push(i));
  if (parts[parts.length - 1].accent) slots.push(null);
  const values: Record<string, string> = {};
  let error = '';
  slots.forEach((slot, n) => {
    let seg = segments[n];
    if (slot === null) {
      if (seg !== '') error = 'Textul evidențiat trebuie să fie la începutul sau la sfârșitul rândului, fără alt text lângă el.';
      return;
    }
    const part = parts[slot];
    const next = parts[slot + 1];
    if (next?.gapBefore && seg.endsWith(next.gapBefore)) seg = seg.slice(0, -next.gapBefore.length);
    if (part.gapBefore && seg.startsWith(part.gapBefore)) seg = seg.slice(part.gapBefore.length);
    values[idOf(scope, part.key)] = seg;
  });
  return error ? {error} : {values};
}

// ---------------------------------------------------------------------------
// Shell: sidebar + the editor of the active section. Mounted once; sections are fetched once and
// refreshed from the response of every save (no reload, no refetch).
// ---------------------------------------------------------------------------
export default function Sections({onLogout}: {onLogout: () => void}) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [sections, setSections] = useState<SectionView[]>([]);
  const [active, setActive] = useState(() => location.pathname.replace(/^\/admin\/?/, '').split('/')[0]);
  const [toast, setToast] = useState<Toast>(null);
  const [leave, setLeave] = useState<null | (() => void)>(null);
  const [dirty, setDirty] = useState(0);
  const [saving, setSaving] = useState(false);
  const saveRef = useRef<SaveFn | null>(null);
  const dirtyRef = useRef(0);
  dirtyRef.current = dirty;

  const notify = useCallback((text: string, error = false) => {
    setToast({text, error});
    window.setTimeout(() => setToast(null), 3200);
  }, []);

  const load = useCallback(async () => {
    const r = await api.sections();
    if (r.status === 401) return onLogout();
    if (r.ok) {
      setGroups(r.groups);
      setSections(r.sections);
      setActive((a) => (a === ANALYTICS || r.sections.some((s) => s.key === a) ? a : r.sections[0]?.key ?? ''));
    }
  }, [onLogout]);
  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const onLeave = (e: BeforeUnloadEvent) => {
      if (dirtyRef.current) e.preventDefault();
    };
    const onPop = () => setActive(location.pathname.replace(/^\/admin\/?/, '').split('/')[0] || sections[0]?.key || '');
    window.addEventListener('beforeunload', onLeave);
    window.addEventListener('popstate', onPop);
    return () => {
      window.removeEventListener('beforeunload', onLeave);
      window.removeEventListener('popstate', onPop);
    };
  }, [sections]);

  // Run `action` now, or after the person decided what to do with unsaved changes.
  const guard = (action: () => void) => (dirtyRef.current ? setLeave(() => action) : action());
  const go = (key: string) => {
    if (key === active) return;
    guard(() => {
      history.pushState(null, '', `/admin/${key}`);
      setActive(key);
      setDirty(0);
    });
  };

  const section = sections.find((s) => s.key === active);
  if (!section && active !== ANALYTICS) return <div className="a-center"><span className="a-spinner" /></div>;
  const group = groups.find((g) => g.key === section?.group);

  return (
    <div className="a-shell">
      <aside className="a-side">
        <div className="a-brand">
          <Mark />
          <span>Admin</span>
        </div>
        <nav className="a-nav" aria-label="Secțiuni">
          <div className="a-group">
            <div className="a-group-title">Analiză</div>
            <div className="a-group-items">
              <button
                className={`a-nav-item a-nav-flat${active === ANALYTICS ? ' is-active' : ''}`}
                aria-current={active === ANALYTICS ? 'page' : undefined}
                onClick={() => go(ANALYTICS)}
              >
                <span>Trafic</span>
              </button>
            </div>
          </div>
          {groups.map((g) => (
            <div className="a-group" key={g.key}>
              <div className="a-group-title">{g.label}</div>
              <div className="a-group-items">
                {sections.filter((s) => s.group === g.key).map((s, n) => (
                  <button
                    key={s.key}
                    data-section={s.key}
                    className={`a-nav-item a-nav-flat${s.key === active ? ' is-active' : ''}`}
                    aria-current={s.key === active ? 'page' : undefined}
                    onClick={() => go(s.key)}
                  >
                    {g.key === 'home' && <em className="a-num">{n + 1}</em>}
                    <span>{s.label}</span>
                    {s.key === active && dirty > 0 ? <i className="a-dot" title="Modificări nesalvate" /> : null}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <div className="a-group">
            <div className="a-group-title">Avansat</div>
            <div className="a-group-items">
              <button className="a-nav-item a-nav-flat" onClick={() => guard(() => (location.href = '/admin/advanced'))}>
                <span>Alte pagini și liste complete</span>
              </button>
            </div>
          </div>
        </nav>
        <button
          className="a-btn a-btn-ghost a-logout"
          onClick={() =>
            guard(async () => {
              await api.logout();
              onLogout();
            })
          }
        >
          Ieșire
        </button>
      </aside>

      {section ? (
        <SectionEditor
          key={`${section.key}:${section.rev}`}
          section={section}
          groupLabel={group?.label ?? ''}
          notify={notify}
          saving={saving}
          setSaving={setSaving}
          saveRef={saveRef}
          onDirty={setDirty}
          onUnauthorized={onLogout}
          onSaved={(all) => setSections(all)}
          onStale={load}
        />
      ) : (
        <Analytics onLogout={onLogout} />
      )}

      {leave && (
        <div className="a-modal" role="dialog" aria-modal="true" aria-label="Modificări nesalvate">
          <div className="a-card a-modal-body">
            <h2>Ai modificări nesalvate</h2>
            <p className="a-muted">Dacă pleci acum, modificările din „{section?.label}” se pierd.</p>
            <div className="a-modal-actions">
              <button className="a-btn a-btn-ghost" onClick={() => setLeave(null)}>Rămâi aici</button>
              <button
                className="a-btn a-btn-ghost is-danger"
                onClick={() => {
                  const action = leave;
                  dirtyRef.current = 0;
                  setLeave(null);
                  action();
                }}
              >
                Renunță la modificări
              </button>
              <button
                className="a-btn a-btn-primary"
                onClick={async () => {
                  const action = leave;
                  if (await saveRef.current?.()) {
                    dirtyRef.current = 0;
                    setLeave(null);
                    action();
                  } else setLeave(null);
                }}
              >
                Salvează și continuă
              </button>
            </div>
          </div>
        </div>
      )}
      {toast && <div className={`a-toast${toast.error ? ' is-error' : ''}`} role="status">{toast.text}</div>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Editor of one section
// ---------------------------------------------------------------------------
function SectionEditor({
  section, groupLabel, notify, saving, setSaving, saveRef, onDirty, onUnauthorized, onSaved, onStale,
}: {
  section: SectionView; groupLabel: string; notify: (t: string, e?: boolean) => void; saving: boolean; setSaving: (v: boolean) => void;
  saveRef: React.MutableRefObject<SaveFn | null>; onDirty: (n: number) => void; onUnauthorized: () => void;
  onSaved: (all: SectionView[]) => void; onStale: () => void;
}) {
  const collectionBlocks = section.blocks.filter((b) => b.collection);
  const [texts, setTexts] = useState<Record<string, string>>(section.texts);
  const [lists, setLists] = useState<Record<string, Item[]>>(() => Object.fromEntries(collectionBlocks.map((b) => [b.collection!, b.items ?? []])));
  const [rich, setRich] = useState<Record<string, {raw: string; error: string}>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [itemErrors, setItemErrors] = useState<SectionError[]>([]);
  const [editing, setEditing] = useState<{name: string; index: number} | null>(null);
  const [versions, setVersions] = useState<Record<string, number>>({});
  const initialNew = useRef('');

  const changedTexts = Object.keys(texts).filter((id) => texts[id] !== section.texts[id]);
  const changedLists = collectionBlocks.filter((b) => countChanges(b.schema!, b.items ?? [], lists[b.collection!]) > 0);
  const listChanges = changedLists.reduce((n, b) => n + countChanges(b.schema!, b.items ?? [], lists[b.collection!]), 0);
  // a heading with broken *highlight* markup is an unsaved change too: it must not be lost silently
  const total = changedTexts.length + listChanges + Object.keys(rich).length;
  useEffect(() => onDirty(total), [total, onDirty]);

  const setText = (id: string, value: string) => {
    setTexts((t) => ({...t, [id]: value}));
    setErrors((e) => (e[id] ? {...e, [id]: ''} : e));
  };
  const setList = (name: string, items: Item[]) => {
    setLists((l) => ({...l, [name]: items}));
    setItemErrors((e) => e.filter((x) => x.collection !== name));
  };

  const save: SaveFn = async () => {
    if (!total || saving) return true;
    if (Object.values(rich).some((r) => r.error)) {
      notify('Corectează câmpurile marcate înainte de salvare.', true);
      return false;
    }
    setSaving(true);
    const r = await api.saveSection(section.key, {
      rev: section.rev,
      texts: Object.fromEntries(changedTexts.map((id) => [id, texts[id]])),
      collections: Object.fromEntries(changedLists.map((b) => [b.collection!, lists[b.collection!]])),
    });
    setSaving(false);
    if (r.status === 401) {
      onUnauthorized();
      return false;
    }
    if (r.status === 409) {
      notify(r.error ?? 'Conținutul s-a schimbat în altă parte.', true);
      onStale();
      return false;
    }
    if (!r.ok) {
      const list = r.errors ?? [];
      setErrors(Object.fromEntries(list.filter((e) => !e.collection).map((e) => [e.field, e.message])));
      setItemErrors(list.filter((e) => e.collection));
      const firstItem = list.find((e) => e.collection && e.index !== undefined);
      if (firstItem) setEditing({name: firstItem.collection!, index: firstItem.index!});
      notify(r.error ?? 'Salvarea a eșuat.', true);
      return false;
    }
    onSaved(r.sections);
    notify(`Salvat · ${plural(total, 'modificare', 'modificări')}`);
    return true;
  };
  saveRef.current = save;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        saveRef.current?.();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [saveRef]);

  const ctxFor = (block: Block): Ctx => ({
    schemas: {},
    collections: {},
    upload: async (file) => {
      const r = await api.upload(file);
      if (r.ok) return r.path;
      if (r.status === 401) onUnauthorized();
      else notify(r.error || 'Încărcarea a eșuat.', true);
      return null;
    },
    nextRank: (key) => Math.max(0, ...(lists[block.collection!] ?? []).map((it) => Number(it[key]) || 0)) + 1,
  });

  const replaceImage = async (path: string, file: File) => {
    const r = await api.replaceImage(path, file);
    if (r.ok) {
      setVersions((v) => ({...v, [path]: r.version}));
      notify('Imagine înlocuită');
    } else if (r.status === 401) onUnauthorized();
    else notify(r.error || 'Încărcarea a eșuat.', true);
  };
  const restoreImage = async (path: string) => {
    const r = await api.restoreImage(path);
    if (r.ok) {
      setVersions((v) => ({...v, [path]: r.version}));
      notify('Imaginea originală a fost restaurată');
    } else if (r.status === 401) onUnauthorized();
    else notify(r.error || 'Restaurarea a eșuat.', true);
  };

  // --- one record of a list, opened for editing ---
  const editingBlock = editing ? collectionBlocks.find((b) => b.collection === editing.name) : undefined;
  const editingItem = editing && editingBlock ? lists[editing.name]?.[editing.index] : undefined;
  const closeItem = () => {
    if (editing && editingItem && editingItem._id === undefined && JSON.stringify(editingItem) === initialNew.current) {
      setList(editing.name, lists[editing.name].filter((_, i) => i !== editing.index));
    }
    setEditing(null);
  };
  const addItem = (block: Block) => {
    const name = block.collection!;
    const fresh = newItem(block.schema!);
    if (block.ranked) fresh[block.ranked] = Math.max(0, ...lists[name].map((it) => Number(it[block.ranked!]) || 0)) + 1;
    initialNew.current = JSON.stringify(fresh);
    setLists((l) => ({...l, [name]: [...l[name], fresh]}));
    setEditing({name, index: lists[name].length});
  };

  const bar = (
    <header className="a-bar">
      <div className="a-bar-title">
        <span className="a-crumb">
          {editingBlock ? (
            <button className="a-link" onClick={closeItem}>← {section.label}</button>
          ) : (
            groupLabel
          )}
        </span>
        <h1>{editingBlock && editingItem ? labelOf(editingBlock.schema!, editingItem) : section.label}</h1>
      </div>
      <div className="a-bar-actions">
        {section.view && !editingBlock && (
          <a className="a-btn a-btn-ghost" href={section.view} target="_blank" rel="noreferrer">Vezi pe site ↗</a>
        )}
        {!editingBlock && (
          <a className="a-btn a-btn-ghost" href={`/admin/advanced?section=${encodeURIComponent(section.key)}`} title="Toate textele, imaginile și listele complete ale secțiunii">
            Editare avansată
          </a>
        )}
        <button className="a-btn a-btn-primary" data-save onClick={() => save()} disabled={!total || saving}>
          {saving ? 'Se salvează…' : total ? `Salvează (${total})` : 'Salvat'}
        </button>
      </div>
    </header>
  );

  if (editingBlock && editingItem) {
    return (
      <main className="a-main">
        {bar}
        <div className="a-content">
          <ItemEditor
            key={editing!.name + editing!.index}
            schema={editingBlock.schema!}
            item={editingItem}
            errors={itemErrors.filter((e) => e.collection === editing!.name && e.index === editing!.index).map((e) => ({field: e.field, message: e.message}))}
            ctx={ctxFor(editingBlock)}
            onChange={(item) => setLists((l) => ({...l, [editing!.name]: l[editing!.name].map((it, i) => (i === editing!.index ? item : it))}))}
          />
        </div>
      </main>
    );
  }

  return (
    <main className="a-main">
      {bar}
      <div className="a-content">
        {section.description && <p className="a-muted a-lead">{section.description}</p>}
        {section.blocks.map((block, bi) => {
          const imageGrid = block.images && (
            <div className="a-images">
              {(block.files ?? []).map((path) => (
                <ImageTile key={path} path={path} version={versions[path]} onReplace={(f) => replaceImage(path, f)} onRestore={() => restoreImage(path)} />
              ))}
              {!block.files?.length && <p className="a-empty">Nu există imagini de editat aici.</p>}
            </div>
          );
          if (block.images && !block.fields) {
            return (
              <section className="a-block" key={bi}>
                <div className="a-block-head"><h2>{block.title}</h2></div>
                {block.note && <p className="a-muted a-note">{block.note}</p>}
                {imageGrid}
              </section>
            );
          }
          if (block.collection) {
            const name = block.collection;
            const items = lists[name];
            const schema = block.schema!;
            const set = (next: Item[]) => setList(name, next);
            return (
              <div key={bi} className="a-stack">
                {block.note && <p className="a-muted a-note">{block.note}</p>}
                {block.ranked && (
                  <RankedPanel
                    title="Ordinea în această secțiune"
                    items={items}
                    schema={schema}
                    field={block.ranked}
                    onChange={set}
                  />
                )}
                {block.mode === 'ranked' ? (
                  <RankedPanel title={block.title ?? schema.label} items={items} schema={schema} field={block.position!} onChange={set} />
                ) : (
                  <CollectionList
                    name={name}
                    schema={schema}
                    title={block.title}
                    itemName={block.itemName}
                    items={items}
                    saved={block.items ?? []}
                    onOpen={(i) => setEditing({name, index: i})}
                    onAdd={() => addItem(block)}
                    onMove={(i, dir) => {
                      const next = [...items];
                      [next[i], next[i + dir]] = [next[i + dir], next[i]];
                      set(next);
                    }}
                    onDelete={(i) => set(items.filter((_, j) => j !== i))}
                    onTogglePublished={schema.fields.some((f) => f.key === 'published') ? (i) => set(items.map((it, j) => (j === i ? {...it, published: it.published === false} : it))) : undefined}
                  />
                )}
              </div>
            );
          }
          return (
            <section className="a-block" key={bi}>
              <div className="a-block-head"><h2>{block.title}</h2></div>
              {block.note && <p className="a-muted a-note">{block.note}</p>}
              <div className="a-card a-fields">
                {(block.fields as TextField[]).map((f, fi) => (
                  <TextFieldInput
                    key={fi}
                    field={f}
                    texts={texts}
                    saved={section.texts}
                    errors={errors}
                    rich={rich}
                    setText={setText}
                    setTexts={(values) => setTexts((t) => ({...t, ...values}))}
                    setRich={(id, v) =>
                      setRich((r) => {
                        const next = {...r};
                        if (v) next[id] = v;
                        else delete next[id];
                        return next;
                      })
                    }
                  />
                ))}
              </div>
              {imageGrid}
            </section>
          );
        })}
        {section.footnote && <p className="a-muted a-note">{section.footnote}</p>}
      </div>
    </main>
  );
}

// ---------------------------------------------------------------------------
// Ordered subset of a list: which records appear in a section, and in what order
// ---------------------------------------------------------------------------
function RankedPanel({
  title, items, schema, field, onChange,
}: {
  title: string; items: Item[]; schema: import('./api').Schema; field: string; onChange: (items: Item[]) => void;
}) {
  const rank = (it: Item) => Number(it[field]) || 0;
  const shown = items.map((it, i) => ({it, i})).filter(({it}) => rank(it) > 0).sort((a, b) => rank(a.it) - rank(b.it));
  const rest = items.map((it, i) => ({it, i})).filter(({it}) => rank(it) <= 0);
  const next = Math.max(0, ...items.map(rank)) + 1;
  const setRank = (i: number, value: number | '') => onChange(items.map((it, j) => (j === i ? {...it, [field]: value} : it)));
  const swap = (a: number, b: number) => onChange(items.map((it, j) => (j === a ? {...it, [field]: rank(items[b])} : j === b ? {...it, [field]: rank(items[a])} : it)));
  return (
    <section className="a-block" data-ranked={field}>
      <div className="a-block-head">
        <h2>{title} <span>{shown.length}</span></h2>
        {rest.length > 0 && (
          <select
            className="a-input a-select-sm"
            aria-label="Adaugă în secțiune"
            value=""
            onChange={(e) => e.target.value !== '' && setRank(Number(e.target.value), next)}
          >
            <option value="">+ Adaugă din listă…</option>
            {rest.map(({it, i}) => <option key={i} value={i}>{labelOf(schema, it)}</option>)}
          </select>
        )}
      </div>
      <div className="a-card a-list">
        {shown.map(({it, i}, n) => {
          const thumb = schema.itemImage ? it[schema.itemImage] : '';
          return (
            <div className="a-row" key={i}>
              <div className="a-row-main">
                <em className="a-num">{n + 1}</em>
                <span className="a-thumb">{thumb ? <img src={thumb} alt="" loading="lazy" /> : null}</span>
                <span className="a-row-text"><strong>{labelOf(schema, it)}</strong></span>
                {it.published === false && <em className="a-badge is-muted">ascuns</em>}
              </div>
              <div className="a-row-ctl">
                <button className="a-icon" title="Mai sus" disabled={n === 0} onClick={() => swap(i, shown[n - 1].i)}>↑</button>
                <button className="a-icon" title="Mai jos" disabled={n === shown.length - 1} onClick={() => swap(i, shown[n + 1].i)}>↓</button>
                <button className="a-icon is-danger" title="Scoate din secțiune" onClick={() => setRank(i, '')}>✕</button>
              </div>
            </div>
          );
        })}
        {!shown.length && <p className="a-empty">Niciun element în această secțiune.</p>}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Text fields
// ---------------------------------------------------------------------------
function Label({text, changed, onReset}: {text: string; changed: boolean; onReset: () => void}) {
  return (
    <span className="a-field-label">
      {text}
      {changed && (
        <button type="button" className="a-reset" onClick={(e) => { e.preventDefault(); onReset(); }}>Anulează</button>
      )}
    </span>
  );
}

function TextFieldInput({
  field, texts, saved, errors, rich, setText, setTexts, setRich,
}: {
  field: TextField; texts: Record<string, string>; saved: Record<string, string>; errors: Record<string, string>;
  rich: Record<string, {raw: string; error: string}>; setText: (id: string, v: string) => void;
  setTexts: (values: Record<string, string>) => void; setRich: (id: string, v: {raw: string; error: string} | null) => void;
}) {
  const one = (id: string, opts: {label: string; kind: 'text' | 'textarea' | 'link' | 'email' | 'phone' | 'code'; hint?: string; placeholder?: string}) => {
    const value = texts[id] ?? '';
    const changed = value !== saved[id];
    const error = errors[id];
    const mono = opts.kind === 'link' || opts.kind === 'email' || opts.kind === 'phone' || opts.kind === 'code';
    return (
      <label className={`a-field${changed ? ' is-changed' : ''}${error ? ' has-error' : ''}`} key={id}>
        <Label text={opts.label} changed={changed} onReset={() => setText(id, saved[id])} />
        {opts.kind === 'textarea' || (opts.kind === 'text' && value.length > 90) ? (
          <AutoTextarea className="a-input a-textarea" value={value} onChange={(v) => setText(id, v)} />
        ) : (
          <input className={`a-input${mono ? ' is-mono' : ''}`} type={opts.kind === 'email' ? 'email' : 'text'} placeholder={opts.placeholder} spellCheck={opts.kind === 'code' ? false : undefined} value={value} onChange={(e) => setText(id, opts.kind === 'code' ? e.target.value.trim() : e.target.value)} />
        )}
        {opts.kind === 'link' && /^(\/|https?:)/.test(value) && <a className="a-link a-field-open" href={value} target="_blank" rel="noreferrer">Deschide ↗</a>}
        {opts.hint && <span className="a-hint">{opts.hint}</span>}
        {error && <p className="a-error">{error}</p>}
      </label>
    );
  };

  switch (field.type) {
    case 'pair': {
      const t = idOf(field.scope, field.text);
      const l = idOf(field.scope, field.link);
      const changed = texts[t] !== saved[t] || texts[l] !== saved[l];
      return (
        <div className={`a-field a-pair${changed ? ' is-changed' : ''}`} role="group" aria-label={field.title}>
          <Label text={field.title} changed={changed} onReset={() => setTexts({[t]: saved[t], [l]: saved[l]})} />
          <div className="a-pair-row">
            <label>
              <small>Text</small>
              <input className="a-input" value={texts[t] ?? ''} onChange={(e) => setText(t, e.target.value)} />
              {errors[t] && <p className="a-error">{errors[t]}</p>}
            </label>
            <label>
              <small>Link</small>
              <input className="a-input is-mono" value={texts[l] ?? ''} onChange={(e) => setText(l, e.target.value)} />
              {errors[l] && <p className="a-error">{errors[l]}</p>}
            </label>
          </div>
        </div>
      );
    }
    case 'stat': {
      const ids = [field.value, field.suffix, field.label].map((k) => idOf(field.scope, k));
      const changed = ids.some((id) => texts[id] !== saved[id]);
      return (
        <div className={`a-field a-pair${changed ? ' is-changed' : ''}`} role="group" aria-label={field.title}>
          <Label text={field.title} changed={changed} onReset={() => setTexts(Object.fromEntries(ids.map((id) => [id, saved[id]])))} />
          <div className="a-pair-row a-stat-row">
            {['Valoare', 'Sufix', 'Etichetă'].map((name, n) => (
              <label key={name}>
                <small>{name}</small>
                <input className="a-input" value={texts[ids[n]] ?? ''} onChange={(e) => setText(ids[n], e.target.value)} />
                {errors[ids[n]] && <p className="a-error">{errors[ids[n]]}</p>}
              </label>
            ))}
          </div>
        </div>
      );
    }
    case 'rich': {
      const fid = idOf(field.scope, field.parts.map((p) => p.key).join('+'));
      const ids = field.parts.map((p) => idOf(field.scope, p.key));
      const composed = richCompose(field.parts, field.scope, texts);
      const draft = rich[fid];
      const value = draft ? draft.raw : composed;
      const changed = ids.some((id) => texts[id] !== saved[id]) || !!draft?.error;
      const error = draft?.error || ids.map((id) => errors[id]).find(Boolean) || '';
      const accentCount = field.parts.filter((p) => p.accent).length;
      const preview = value.split('*');
      const update = (raw: string) => {
        const parsed = richParse(field.parts, field.scope, raw);
        if ('error' in parsed) setRich(fid, {raw, error: parsed.error});
        else {
          setRich(fid, null);
          setTexts(parsed.values);
        }
      };
      return (
        <label className={`a-field${changed ? ' is-changed' : ''}${error ? ' has-error' : ''}`}>
          <Label
            text={field.title}
            changed={changed}
            onReset={() => {
              setTexts(Object.fromEntries(ids.map((id) => [id, saved[id]])));
              setRich(fid, null);
            }}
          />
          {value.length > 90 ? (
            <AutoTextarea className="a-input a-textarea" value={value} onChange={(v) => update(v)} />
          ) : (
            <input className="a-input" value={value} onChange={(e) => update(e.target.value)} />
          )}
          <span className="a-hint">
            Textul dintre <b>*asteriscuri*</b> este evidențiat pe site ({accentCount === 1 ? 'o singură dată' : `${accentCount} fragmente`}).
            {preview.length === accentCount * 2 + 1 && (
              <span className="a-rich-preview"> Previzualizare: {preview.map((seg, n) => (n % 2 ? <mark key={n}>{seg}</mark> : <span key={n}>{seg}</span>))}</span>
            )}
          </span>
          {error && <p className="a-error">{error}</p>}
        </label>
      );
    }
    default:
      return one(idOf(field.scope, field.key), {label: field.label, kind: field.type, hint: field.hint, placeholder: field.placeholder});
  }
}
