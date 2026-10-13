import {useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type FormEvent} from 'react';
import {api, type Collections, type Content, type FieldError, type Item, type PageIndex, type Schema, type SectionView, type Value} from './api';
import {CollectionList, ItemEditor, countChanges, fillDefaults, idOf, labelOf, newItem, publicUrl, type Ctx} from './Collections';

// ---------------------------------------------------------------------------
// Structure: pages → their sections (in page order) → texts, links, images, lists
// ---------------------------------------------------------------------------
const IMAGES_PREVIEW = 8;
const GROUPS = ['Pagini', 'Pagini de servicii', 'Șabloane', 'Altele', 'Secțiuni'] as const;
// Static pages, in sidebar order (an array: "404" as an object key would sort first).
const PAGE_LABELS: [string, string][] = Object.entries({
  '/': 'Acasă', '/about-us': 'Despre noi', '/works': 'Proiecte', '/services': 'Servicii', '/automation': 'Automatizare', '/blog': 'Blog',
  '/templates': 'Template-uri', '/contact': 'Contact', '/contact/thank-you': 'Contact · mulțumire',
  '/terms-and-conditions': 'Termeni și condiții', '/privacy-policy': 'Confidențialitate',
}).concat([['404', 'Pagina 404']]);
// Pages generated from a collection: one template, many URLs.
const TEMPLATE_LABELS: Record<string, string> = {
  'templates/project': 'Pagină proiect', 'templates/post': 'Articol blog',
  'templates/PostCategoryPage': 'Categorie blog', 'templates/CustomPage': 'Pagină personalizată',
};
const PART_LABELS: Record<string, string> = {
  Hero: 'Hero', TechStack: 'Tehnologii', Introduction: 'Introducere', Works: 'Proiecte', Services: 'Servicii',
  Marquee: 'Bandă text', Pricing: 'Prețuri', Approach: 'Abordare', Automation: 'Automatizare', Testimonials: 'Testimoniale',
  Faqs: 'Întrebări frecvente', ContactForm: 'Formular de contact', CategoryNav: 'Articole', TemplatesGrid: 'Template-uri',
  WorksGrid: 'Grila de proiecte', RecentWork: 'Proiecte recente', ArticleCodeBlocks: 'Blocuri de cod',
  ArticleLightbox: 'Galerie imagini', BadgeImage: 'Insigne', AuroraImage: 'Fundal', IconCloud: 'Iconuri',
  ServicesBackdrop: 'Fundal', WorkShots: 'Capturi proiect', PageTitle: 'Titlu pagină',
};
// Lists a page passes down to a section (the section itself doesn't read them).
const PART_COLLECTIONS: Record<string, string[]> = {
  Hero: ['projects'], Works: ['projects'], Testimonials: ['testimonials'], WorksGrid: ['projects'], TemplatesGrid: ['templates'],
};
const COLLECTION_NOTES: Record<string, string> = {
  'Hero:projects': 'În Hero apar proiectele care au completat „Hero position”.',
  'Works:projects': 'Aici apar proiectele care au completat „Home position”.',
  'RecentWork:projects': 'Apar primele trei proiecte din listă.',
};

type Part = {id: string; label: string; scopes: string[]; files: string[]; collections: string[]; notes: string[]};
type Page = {id: string; group: (typeof GROUPS)[number]; label: string; href?: string; full?: boolean; parts: Part[]};

const words = (s: string) => {
  const w = s.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[-_]/g, ' ').trim();
  return w.charAt(0).toUpperCase() + w.slice(1);
};
const pageTitle = (data: Content, scope: string) =>
  String(data[scope]?.['meta-title'] ?? scope).split(/\s[—|~]\s|\s\|\s/)[0].trim();

// What the section editor already covers: Advanced hides it from pages, and lists every one of it on the
// section's own page (opened with "Editare avansată"), where nothing is hidden.
type Owned = {files: Set<string>; collections: Set<string>};
function ownedBy(sections: SectionView[]): Owned {
  const blocks = sections.flatMap((s) => s.blocks);
  return {
    files: new Set(blocks.flatMap((b) => b.files ?? [])),
    collections: new Set(blocks.flatMap((b) => (b.collection ? [b.collection] : []))),
  };
}
const scopesOf = (section: SectionView) =>
  [...new Set(section.blocks.flatMap((b) => (b.collection ? [] : (b.fields ?? []) as {scope?: string}[]).map((f) => f.scope!).filter(Boolean)))];

function buildPages(data: Content, images: Record<string, string[]>, index: PageIndex, managed: Set<string>, sections: SectionView[]): Page[] {
  const owned = ownedBy(sections);
  const free = (s: string) => (images[s] ?? []).filter((f) => !owned.files.has(f));
  // texts of managed scopes and images shown in a section are edited in the section editor, so they do not count here
  const has = (s: string) => (!managed.has(s) && Object.keys(data[s] ?? {}).length > 0) || free(s).length > 0;
  const placed = new Set<string>();
  const part = (id: string, label: string, scopes: string[], collections: string[] = [], notes: string[] = []): Part | null => {
    const s = scopes.filter(has);
    s.forEach((x) => placed.add(x));
    const c = collections.filter((x) => !owned.collections.has(x));
    return s.length || c.length ? {id, label, scopes: s, files: s.flatMap(free), collections: c, notes} : null;
  };
  const pageOf = (id: string, group: Page['group'], label: string, href?: string): Page => {
    const entry = index[id] ?? {collections: [], parts: []};
    const given = new Set<string>();
    const parts: Part[] = [];
    for (const p of entry.parts) {
      if (p.scopes.some((x) => managed.has(x))) continue; // a section of the section editor: it has its own page below
      const collections = [...new Set([...p.collections, ...(PART_COLLECTIONS[p.name] ?? [])])];
      collections.forEach((c) => given.add(c));
      const notes = collections.map((c) => COLLECTION_NOTES[`${p.name}:${c}`]).filter(Boolean);
      const made = part(`${id}#${p.name}`, PART_LABELS[p.name] ?? words(p.name), p.scopes, collections, notes);
      if (made) parts.push(made);
    }
    parts.forEach((s, i) => (s.label = `${i + 1}. ${s.label}`));
    const rest = entry.collections.filter((c) => !given.has(c));
    const settings = part(`${id}#page`, label === 'Acasă' ? 'Setări pagină' : 'Conținutul paginii', [id], rest);
    return {id, group, label, href, parts: [settings, ...parts].filter((p): p is Part => !!p)};
  };

  const pages: Page[] = [];
  for (const [id, label] of PAGE_LABELS) if (has(id) || index[id]) pages.push(pageOf(id, 'Pagini', label, id === '404' ? undefined : id));
  for (const id of Object.keys(index).filter((s) => s.startsWith('/services/')).sort())
    pages.push(pageOf(id, 'Pagini de servicii', pageTitle(data, id), id));
  for (const [id, label] of Object.entries(TEMPLATE_LABELS)) if (index[id]) pages.push(pageOf(id, 'Șabloane', label));
  // one page per section of the section editor, with everything it is made of (texts the editor leaves out too)
  for (const section of sections) {
    const own = scopesOf(section);
    const scopes = new Set(own);
    const collections = new Set(section.blocks.flatMap((b) => (b.collection ? [b.collection] : [])));
    for (const entry of Object.values(index))
      for (const p of entry.parts)
        if (p.scopes.some((s) => own.includes(s))) {
          p.scopes.forEach((s) => scopes.add(s));
          [...p.collections, ...(PART_COLLECTIONS[p.name] ?? [])].forEach((c) => collections.add(c));
        }
    scopes.forEach((x) => placed.add(x));
    const list = [...scopes].filter((s) => Object.keys(data[s] ?? {}).length > 0 || images[s]?.length);
    const files = [...new Set([...list.flatMap((s) => images[s] ?? []), ...section.blocks.flatMap((b) => b.files ?? [])])];
    const id = 'section:' + section.key;
    pages.push({id, group: 'Secțiuni', label: section.label, href: section.view, full: true, parts: [{id: id + '#all', label: section.label, scopes: list, files, collections: [...collections], notes: []}]});
  }
  // anything not placed on a page, so nothing is out of reach
  const all = [...Object.keys(data), ...Object.keys(images)];
  for (const s of [...new Set(all)].filter((s) => !placed.has(s) && !managed.has(s) && has(s))) {
    const label = words(s.split('/').pop()!);
    const p = part(s, label, [s]);
    if (p) pages.push({id: s, group: 'Altele', label, parts: [p]});
  }

  return pages.filter((p) => p.parts.length);
}

// A list whose section shows every field of it needs no second place to edit it.
const coveredBySection = (name: string, schema: Schema, sections: SectionView[]) =>
  sections.some((s) => s.blocks.some((b) => {
    if (b.collection !== name) return false;
    const keys = new Set((b.fields ?? []).map((f) => (typeof f === 'string' ? f : 'key' in f ? f.key : '')));
    return schema.fields.every((f) => f.type === 'hidden' || keys.has(f.key));
  }));
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
const isLink = (key: string, v: Value) => !Array.isArray(v) && (key.endsWith('-link') || /^(\/|https?:\/\/|mailto:|tel:)\S*$/.test(v));
const isHtml = (v: string) => /<\/?[a-z][\s\S]*>/i.test(v);
const same = (a: Value, b: Value) => (Array.isArray(a) ? Array.isArray(b) && a.join('\n') === b.join('\n') : a === b);

// ---------------------------------------------------------------------------
// Advanced editor: the pages that are not homepage sections (About, Contact, Blog, Templates, service pages, legal
// pages, 404) and the full lists. Header, Footer and the homepage sections live in the section editor.
// ---------------------------------------------------------------------------
export default function Advanced({onLogout}: {onLogout: () => void}) {
  const [data, setData] = useState<Content | null>(null);
  const [images, setImages] = useState<Record<string, string[]>>({});
  const [pageIndex, setPageIndex] = useState<PageIndex>({});
  const [managed, setManaged] = useState<Set<string>>(new Set());
  const [sections, setSections] = useState<SectionView[]>([]);
  // /admin/advanced?section=<key> opens that section with everything it is made of
  const [active, setActive] = useState(() => {
    const key = new URLSearchParams(location.search).get('section');
    return key ? 'section:' + key : '/';
  });
  const [openParts, setOpenParts] = useState<Set<string>>(new Set());
  const [returnTo, setReturnTo] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, Record<string, Value>>>({});
  const [versions, setVersions] = useState<Record<string, number>>({});
  const [navQuery, setNavQuery] = useState('');
  const [fieldQuery, setFieldQuery] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{text: string; error?: boolean} | null>(null);
  const [schemas, setSchemas] = useState<Record<string, Schema>>({});
  const [collections, setCollections] = useState<Collections>({});
  const [colDrafts, setColDrafts] = useState<Record<string, Item[]>>({});
  const [colErrors, setColErrors] = useState<Record<string, FieldError[]>>({});
  const [editing, setEditing] = useState<number | null>(null);
  const initialNew = useRef<string>('');

  useEffect(() => {
    Promise.all([api.content(), api.sections()]).then(([r, sec]) => {
      if (r.status === 401) return onLogout();
      if (sec.ok) setSections(sec.sections);
      if (r.ok) {
        setData(r.data);
        setImages(r.images);
        setPageIndex(r.pages ?? {});
        setManaged(new Set(r.managed ?? []));
        setSchemas(r.schemas ?? {});
        setCollections(r.collections ?? {});
      }
    });
  }, [onLogout]);

  const notify = useCallback((text: string, error = false) => {
    setToast({text, error});
    window.setTimeout(() => setToast(null), 2600);
  }, []);

  const pages = useMemo(() => (data ? buildPages(data, images, pageIndex, managed, sections) : []), [data, images, pageIndex, managed, sections]);

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
    () => Object.entries(schemas).filter(([name, schema]) => !coveredBySection(name, schema, sections)).sort(([a, x], [b, y]) => (x.order ?? 999) - (y.order ?? 999) || a.localeCompare(b)),
    [schemas, sections],
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
  const partChanged = (p: Part) => p.scopes.some((s) => changes[s]) || p.collections.some((c) => colChanges[c]);

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
  const page = pages.find((p) => p.id === active) ?? pages[0];

  const setValue = (scope: string, key: string, value: Value) =>
    setDrafts((d) => ({...d, [scope]: {...d[scope], [key]: value}}));

  const replaceImage = async (path: string, file: File) => {
    const r = await api.replaceImage(path, file);
    if (r.ok) {
      setVersions((v) => ({...v, [path]: r.version}));
      notify('Fișier înlocuit');
    } else {
      if (r.status === 401) return onLogout();
      notify(r.error || 'Încărcarea a eșuat.', true);
    }
  };
  const restoreImage = async (path: string) => {
    const r = await api.restoreImage(path);
    if (r.ok) {
      setVersions((v) => ({...v, [path]: r.version}));
      notify('Fișierul original a fost restaurat');
    } else {
      if (r.status === 401) return onLogout();
      notify(r.error || 'Restaurarea a eșuat.', true);
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
  const goPage = (id: string, partId?: string) => {
    setActive(id);
    setEditing(null);
    setReturnTo(null);
    setFieldQuery('');
    if (partId) {
      setOpenParts((o) => new Set(o).add(partId));
      requestAnimationFrame(() => document.getElementById(partId)?.scrollIntoView({behavior: 'smooth', block: 'start'}));
    } else document.querySelector('.a-content')?.scrollTo({top: 0});
  };
  const openCollection = (name: string) => {
    setActive('col:' + name);
    setEditing(null);
    setReturnTo(null);
  };
  // open one item of a list from inside a page; "back" returns to that page
  const editItem = (name: string, index: number) => {
    setReturnTo((r) => r ?? (colName ? null : page.id));
    setActive('col:' + name);
    setEditing(index);
  };
  const addItem = (name: string) => {
    const items = draftOf(name);
    const fresh = newItem(schemas[name]);
    initialNew.current = JSON.stringify(fresh);
    setDraft(name, [...items, fresh]);
    editItem(name, items.length);
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
    if (returnTo) {
      setActive(returnTo);
      setReturnTo(null);
    }
  };
  const listOf = (name: string) =>
    schemas[name] ? (
      <CollectionList
        name={name}
        schema={schemas[name]}
        items={draftOf(name)}
        saved={collections[name] ?? []}
        onOpen={(i) => editItem(name, i)}
        onAdd={() => addItem(name)}
        onMove={(i, dir) => {
          const items = [...draftOf(name)];
          [items[i], items[i + dir]] = [items[i + dir], items[i]];
          setDraft(name, items);
        }}
        onDelete={(i) => setDraft(name, draftOf(name).filter((_, j) => j !== i))}
      />
    ) : null;

  const fq = fieldQuery.toLowerCase();
  const matches = (scope: string, key: string, value: Value) => {
    if (!fq) return true;
    const current = drafts[scope]?.[key] ?? value;
    return key.includes(fq) || String(Array.isArray(current) ? current.join(' ') : current).toLowerCase().includes(fq);
  };
  const fieldsOf = (scope: string, links: boolean) =>
    (managed.has(scope) && !page.full ? [] : Object.entries(data[scope] ?? {}))
      .filter(([key, value]) => isLink(key, value) === links && matches(scope, key, value))
      .map(([key, original]) => {
        const value = drafts[scope]?.[key] ?? original;
        return (
          <Field
            key={scope + key}
            name={key}
            value={value}
            link={links}
            changed={!same(value, original)}
            onChange={(v) => setValue(scope, key, v)}
            onReset={() => setValue(scope, key, original)}
          />
        );
      });

  const q = navQuery.toLowerCase();
  const editingItem = schema && colName && editing !== null ? draftOf(colName)[editing] : undefined;
  return (
    <div className="a-shell">
      <aside className="a-side">
        <div className="a-brand">
          <Mark />
          <span>Avansat</span>
        </div>
        <a className="a-btn a-btn-ghost a-back" href={page?.full ? '/admin/' + page.id.slice(8) : '/admin'}>← Înapoi la secțiuni</a>
        <div className="a-search">
          <SearchIcon />
          <input placeholder="Caută pagină sau listă" value={navQuery} onChange={(e) => setNavQuery(e.target.value)} />
        </div>
        <nav className="a-nav">
          {GROUPS.map((group) => {
            const items = pages.filter((p) => p.group === group && (!q || p.label.toLowerCase().includes(q) || p.parts.some((x) => x.label.toLowerCase().includes(q))));
            if (!items.length) return null;
            return (
              <NavGroup key={group} title={group} count={items.length} defaultOpen={group === 'Pagini' || !!q || items.some((p) => p.id === active)}>
                {items.map((p) => {
                  const current = !colName && p.id === page.id;
                  return (
                    <div key={p.id}>
                      <button className={`a-nav-item${current ? ' is-active' : ''}`} onClick={() => goPage(p.id)}>
                        <span>{p.label}</span>
                        {p.parts.some(partChanged) ? <i className="a-dot" /> : null}
                      </button>
                      {current && p.parts.length > 1 && (
                        <div className="a-subnav">
                          {p.parts.map((x) => (
                            <button key={x.id} className="a-subnav-item" onClick={() => goPage(p.id, x.id)}>
                              <span>{x.label}</span>
                              {partChanged(x) ? <i className="a-dot" /> : null}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </NavGroup>
            );
          })}
          {collectionList.length > 0 && (!q || collectionList.some(([, s]) => s.label.toLowerCase().includes(q))) && (
            <NavGroup title="Liste (colecții)" count={collectionList.length} defaultOpen={false}>
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
                  <button className="a-link" onClick={closeItem}>
                    ← {returnTo ? pages.find((p) => p.id === returnTo)?.label ?? schema.label : schema.label}
                  </button>
                ) : 'Liste'
              ) : page.group}
            </span>
            <h1>{schema ? (editingItem ? labelOf(schema, editingItem) : schema.label) : page.label}</h1>
          </div>
          <div className="a-bar-actions">
            {!schema && page.parts.length > 1 && (
              <div className="a-search a-search-sm">
                <SearchIcon />
                <input placeholder="Caută în pagină" value={fieldQuery} onChange={(e) => setFieldQuery(e.target.value)} />
              </div>
            )}
            {!schema && page.parts.length > 1 && (
              <button
                className="a-btn a-btn-ghost"
                onClick={() => setOpenParts((o) => (page.parts.every((p) => o.has(p.id)) ? new Set() : new Set(page.parts.map((p) => p.id))))}
              >
                {page.parts.every((p) => openParts.has(p.id)) ? 'Strânge tot' : 'Deschide tot'}
              </button>
            )}
            {schema && editingItem && (() => {
              const url = editingItem._id !== undefined && schema.route ? publicUrl(schema, { ...editingItem, ...(collections[colName!] ?? []).find((o, oi) => idOf(schema, o, oi) === editingItem._id) }) : '';
              return url ? (
                <a className="a-btn a-btn-ghost" href={url} target="_blank" rel="noreferrer">Vezi pagina ↗</a>
              ) : null;
            })()}
            {!schema && page.href && (
              <a className="a-btn a-btn-ghost" href={page.href} target="_blank" rel="noreferrer">
                Vezi pagina ↗
              </a>
            )}
            <button className="a-btn a-btn-primary" onClick={save} disabled={!totalChanges || saving}>
              {saving ? 'Se salvează…' : totalChanges ? `Salvează (${totalChanges})` : 'Salvat'}
            </button>
          </div>
        </header>

        <div className="a-content">
          {schema && colName && editing === null && listOf(colName)}
          {schema && colName && editingItem && (
            <ItemEditor
              key={colName + editing}
              schema={schema}
              item={editingItem}
              errors={(colErrors[colName] ?? []).filter((e) => e.index === editing)}
              ctx={ctx}
              onChange={(item) => setDraft(colName, draftOf(colName).map((it, i) => (i === editing ? item : it)))}
            />
          )}
          {!schema &&
            page.parts.map((p) => {
              const single = page.parts.length === 1;
              const open = single || !!fq || openParts.has(p.id);
              const texts = p.scopes.flatMap((s) => fieldsOf(s, false));
              const links = p.scopes.flatMap((s) => fieldsOf(s, true));
              const files = p.files;
              if (fq && !texts.length && !links.length) return null;
              const counts = [
                texts.length && plural(texts.length, 'text', 'texte'),
                links.length && plural(links.length, 'link', 'linkuri'),
                files.length && plural(files.length, 'imagine', 'imagini'),
                ...p.collections.filter((c) => schemas[c]).map((c) => `${schemas[c].label} (${draftOf(c).length})`),
              ].filter(Boolean);
              return (
                <section key={p.id} id={p.id} className={`a-part${open ? ' is-open' : ''}`}>
                  {!single && (
                    <button
                      className="a-part-head"
                      onClick={() => setOpenParts((o) => {
                        const n = new Set(o);
                        if (n.has(p.id)) n.delete(p.id);
                        else n.add(p.id);
                        return n;
                      })}
                    >
                      <Chevron open={open} />
                      <h2>{p.label}</h2>
                      {partChanged(p) && <i className="a-dot" />}
                      <span className="a-part-meta">{counts.join(' · ')}</span>
                    </button>
                  )}
                  {open && (
                    <div className="a-part-body">
                      {texts.length > 0 && (
                        <div className="a-block">
                          <div className="a-block-head"><h3>Texte</h3></div>
                          <div className="a-card a-fields">{texts}</div>
                        </div>
                      )}
                      {links.length > 0 && (
                        <div className="a-block">
                          <div className="a-block-head"><h3>Linkuri și contact</h3></div>
                          <div className="a-card a-fields">{links}</div>
                        </div>
                      )}
                      {files.length > 0 && !fq && <Images files={files} versions={versions} onReplace={replaceImage} onRestore={restoreImage} />}
                      {!fq && p.collections.filter((c) => schemas[c]).map((c) => (
                        <div key={c} className="a-block">
                          {p.notes.map((n) => <p key={n} className="a-muted a-note">{n}</p>)}
                          {listOf(c)}
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              );
            })}
        </div>
      </main>

      {toast && <div className={`a-toast${toast.error ? ' is-error' : ''}`}>{toast.text}</div>}
    </div>
  );
}

function Images({files, versions, onReplace, onRestore}: {files: string[]; versions: Record<string, number>; onReplace: (path: string, f: File) => void; onRestore: (path: string) => void}) {
  const [all, setAll] = useState(false);
  return (
    <div className="a-block">
      <div className="a-block-head">
        <h3>Imagini și video <span>{files.length}</span></h3>
        {files.length > IMAGES_PREVIEW && (
          <button className="a-link" onClick={() => setAll((v) => !v)}>{all ? 'Mai puține' : `Toate (${files.length})`}</button>
        )}
      </div>
      <div className="a-images">
        {(all ? files : files.slice(0, IMAGES_PREVIEW)).map((path) => (
          <ImageTile key={path} path={path} version={versions[path]} onReplace={(f) => onReplace(path, f)} onRestore={() => onRestore(path)} />
        ))}
      </div>
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

function Field({name, value, link, changed, onChange, onReset}: {name: string; value: Value; link?: boolean; changed: boolean; onChange: (v: Value) => void; onReset: () => void}) {
  const list = Array.isArray(value);
  const str = list ? value.join('\n') : value;
  const html = !list && isHtml(str);
  const multiline = !link && (list || html || str.length > 70 || str.includes('\n'));
  const label = name === 'meta-title' ? 'Titlu în browser (tab)' : words(name.replace(/-link$/, '')) + (name.endsWith('-link') ? ' → link' : '');
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
        <input className={`a-input${link ? ' is-mono' : ''}`} value={str} onChange={(e) => onChange(e.target.value)} />
      )}
      {link && /^(\/|https?:)/.test(str) && (
        <a className="a-link a-field-open" href={str} target="_blank" rel="noreferrer">Deschide ↗</a>
      )}
    </label>
  );
}

export function AutoTextarea({value, onChange, className}: {value: string; onChange: (v: string) => void; className: string}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight + 2, 420) + 'px';
  }, [value]);
  return <textarea ref={ref} rows={2} className={className} value={value} onChange={(e) => onChange(e.target.value)} />;
}

export function ImageTile({path, version, onReplace, onRestore}: {path: string; version?: number; onReplace: (f: File) => Promise<void> | void; onRestore?: () => Promise<void> | void}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const [hasOriginal, setHasOriginal] = useState(false);
  const name = path.split('/').pop()!;
  const ext = name.split('.').pop()!.toLowerCase();
  const video = ext === 'mp4';
  const accept = video ? 'video/mp4' : ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : `image/${ext === 'svg' ? 'svg+xml' : ext}`;
  const src = version ? `${path}?v=${version}` : path;
  const media = () => (video ? <video src={src} muted loop autoPlay playsInline /> : <img src={src} alt="" loading="lazy" />);
  const run = async (action: () => Promise<void> | void) => {
    setBusy(true);
    await action();
    setBusy(false);
    if (onRestore) api.hasOriginal(path).then((r) => setHasOriginal(!!r.exists));
  };
  useEffect(() => {
    if (!open) return;
    if (onRestore) api.hasOriginal(path).then((r) => setHasOriginal(!!r.exists));
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, path, !!onRestore]);
  return (
    <>
      <button className="a-image" title={`${path}\nClick pentru previzualizare`} onClick={() => setOpen(true)}>
        {media()}
        <span className="a-image-overlay">{busy ? 'Se încarcă…' : 'Previzualizare'}</span>
        <span className="a-image-name">{name}</span>
      </button>
      <input
        ref={input}
        type="file"
        accept={accept}
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (file) run(() => onReplace(file));
        }}
      />
      {open && (
        <div className="a-modal" role="dialog" aria-modal="true" aria-label={name} onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
          <div className="a-card a-modal-body a-preview">
            <h2>{name}</h2>
            <div className="a-preview-media">{media()}</div>
            <p className="a-muted">{path} · se înlocuiește doar cu un fișier .{ext}</p>
            <div className="a-modal-actions">
              <button className="a-btn a-btn-ghost" onClick={() => setOpen(false)}>Închide</button>
              {onRestore && (
                <button className="a-btn a-btn-ghost" disabled={busy || !hasOriginal} title={hasOriginal ? '' : 'Imaginea nu a fost înlocuită'} onClick={() => run(onRestore)}>
                  Revino la original
                </button>
              )}
              <button className="a-btn a-btn-primary" disabled={busy} onClick={() => input.current?.click()}>
                {busy ? 'Se încarcă…' : 'Înlocuiește'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export const Mark = () => (
  <svg className="a-mark" viewBox="0 0 54 54" fill="currentColor" aria-hidden>
    <path d="M54 0 27 54 0 0h10.8L27 32.4 43.2 0z" />
  </svg>
);
export const SearchIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
);
export const Chevron = ({open}: {open: boolean}) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{transform: open ? 'rotate(90deg)' : 'none'}} aria-hidden>
    <path d="m9 6 6 6-6 6" />
  </svg>
);
