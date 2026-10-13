import {useRef, useState} from 'react';
import type {Collections, Field, FieldError, Item, Schema} from './api';

// ---------------------------------------------------------------------------
// Helpers shared with Admin.tsx
// ---------------------------------------------------------------------------
// null = the collection has no id field; records are matched by position
export const idFieldOf = (schema: Schema): string | null =>
  (schema.fields.find((f) => f.unique) ?? schema.fields.find((f) => f.type === 'slug'))?.key ?? null;

export const idOf = (schema: Schema, item: Item, index: number) => {
  const key = idFieldOf(schema);
  return key ? String(item[key] ?? '') : String(index);
};

export const slugify = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const stable = (v: unknown): string =>
  JSON.stringify(v, (_k, val) =>
    val && typeof val === 'object' && !Array.isArray(val)
      ? Object.fromEntries(Object.entries(val).sort(([a], [b]) => a.localeCompare(b)))
      : val,
  );
const bare = (item: Item) => {
  const {_id, ...rest} = item;
  return stable(rest);
};

export const emptyValue = (f: Field): unknown =>
  f.type === 'boolean' ? false : f.type === 'strings' || f.type === 'list' || f.type === 'refs' ? [] : '';

export function newItem(schema: Schema): Item {
  const out: Item = {};
  for (const f of schema.fields) out[f.key] = structuredClone(schema.defaults?.[f.key] ?? emptyValue(f));
  return out;
}

// {field} placeholders of a new item's defaults, filled when saving
export function fillDefaults(item: Item): Item {
  const out: Item = {};
  for (const [k, v] of Object.entries(item)) {
    out[k] = typeof v === 'string' ? v.replace(/\{(\w+)\}/g, (_m, key) => String(item[key] ?? '')) : v;
  }
  return out;
}

// `itemLabel` is a field name, or a template such as "{title} {subtitle}".
export const labelOf = (schema: Schema, item: Item) =>
  (schema.itemLabel.includes('{')
    ? schema.itemLabel.replace(/\{(\w+)\}/g, (_m, k) => String(item[k] ?? '')).replace(/\s+/g, ' ').trim()
    : String(item[schema.itemLabel] ?? '')) || 'Fără titlu';

export const publicUrl = (schema: Schema, item: Item) =>
  schema.route?.replace(/\{(\w+)\}/g, (_m, k) => String(item[k] ?? ''));

// Number of changes (added + removed + modified + reordered) between saved and draft items.
export function countChanges(schema: Schema, saved: Item[], draft: Item[]): number {
  const savedById = new Map(saved.map((s, i) => [idOf(schema, s, i), s]));
  let n = 0;
  const kept = new Set<string>();
  for (const d of draft) {
    const old = d._id !== undefined ? savedById.get(String(d._id)) : undefined;
    if (!old) n++;
    else {
      kept.add(String(d._id));
      if (bare(old) !== bare(d)) n++;
    }
  }
  n += saved.filter((s, i) => !kept.has(idOf(schema, s, i))).length;
  if (!n && stable(saved.map((s, i) => idOf(schema, s, i))) !== stable(draft.map((d) => String(d._id)))) n = 1;
  return n;
}

export type Ctx = {
  schemas: Record<string, Schema>;
  collections: Collections;
  upload: (file: File) => Promise<string | null>;
  /** next free position for a `rank` field (the order in which records appear in a site section) */
  nextRank?: (key: string) => number;
};

// ---------------------------------------------------------------------------
// Collection list
// ---------------------------------------------------------------------------
export function CollectionList({
  name, schema, items, saved, onOpen, onAdd, onMove, onDelete, onTogglePublished, itemName, title,
}: {
  name: string; schema: Schema; items: Item[]; saved: Item[];
  onOpen: (i: number) => void; onAdd: () => void; onMove: (i: number, dir: -1 | 1) => void; onDelete: (i: number) => void;
  onTogglePublished?: (i: number) => void; itemName?: string; title?: string;
}) {
  const [query, setQuery] = useState('');
  const idKey = idFieldOf(schema);
  const savedById = new Map(saved.map((s, i) => [idOf(schema, s, i), s]));
  const q = query.trim().toLowerCase();
  const rows = items
    .map((item, i) => ({item, i}))
    .filter(({item}) => !q || labelOf(schema, item).toLowerCase().includes(q) || String(idKey ? item[idKey] ?? '' : '').toLowerCase().includes(q));
  return (
    <section className="a-block" data-collection={name}>
      <div className="a-block-head">
        <h2>{title ?? schema.label} <span>{items.length}</span></h2>
        <div className="a-row-actions">
          {items.length > 8 && (
            <div className="a-search a-search-sm">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
              <input placeholder="Caută" value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
          )}
          <button className="a-btn a-btn-primary" onClick={onAdd}>+ Adaugă{itemName ? ` ${itemName}` : ''}</button>
        </div>
      </div>
      <div className="a-card a-list">
        {rows.map(({item, i}) => {
          const old = item._id !== undefined ? savedById.get(String(item._id)) : undefined;
          const status = !old ? 'nou' : bare(old) !== bare(item) ? 'modificat' : '';
          const thumb = schema.itemImage ? item[schema.itemImage] : '';
          return (
            <div className="a-row" key={i}>
              <button className="a-row-main" onClick={() => onOpen(i)}>
                <span className="a-thumb">{thumb ? <img src={thumb} alt="" loading="lazy" /> : null}</span>
                <span className="a-row-text">
                  <strong>{labelOf(schema, item)}</strong>
                  {idKey && <small>{String(item[idKey] ?? '')}</small>}
                </span>
                {item.published === false && <em className="a-badge is-muted">ascuns</em>}
                {status && <em className="a-badge">{status}</em>}
              </button>
              <div className="a-row-ctl">
                {onTogglePublished && (
                  <button
                    className={`a-icon a-eye${item.published === false ? ' is-off' : ''}`}
                    title={item.published === false ? 'Ascuns — click pentru a publica' : 'Publicat — click pentru a ascunde'}
                    aria-pressed={item.published !== false}
                    onClick={() => onTogglePublished(i)}
                  >
                    {item.published === false ? '◌' : '●'}
                  </button>
                )}
                <button className="a-icon" title="Mai sus" disabled={!!q || i === 0} onClick={() => onMove(i, -1)}>↑</button>
                <button className="a-icon" title="Mai jos" disabled={!!q || i === items.length - 1} onClick={() => onMove(i, 1)}>↓</button>
                <button
                  className="a-icon is-danger"
                  title="Șterge"
                  onClick={() => {
                    if (window.confirm(`Ștergi „${labelOf(schema, item)}”? Ștergerea se aplică la Salvare.`)) onDelete(i);
                  }}
                >
                  ✕
                </button>
              </div>
            </div>
          );
        })}
        {!rows.length && <p className="a-empty">{items.length ? 'Niciun rezultat.' : 'Niciun element încă.'}</p>}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Item editor
// ---------------------------------------------------------------------------
export function ItemEditor({
  schema, item, errors, ctx, onChange,
}: {
  schema: Schema; item: Item; errors: FieldError[]; ctx: Ctx; onChange: (item: Item) => void;
}) {
  const isNew = item._id === undefined;
  const slugTouched = useRef<Set<string>>(new Set(
    schema.fields
      .filter((f) => f.type === 'slug' && f.from && item[f.key] && item[f.key] !== slugify(String(item[f.from] ?? '')))
      .map((f) => f.key),
  ));
  const errorMap = Object.fromEntries(errors.map((e) => [e.field, e.message]));
  const main = schema.fields.filter((f) => f.type !== 'hidden' && !f.advanced);
  const advanced = schema.fields.filter((f) => f.type !== 'hidden' && f.advanced);

  const set = (key: string, value: unknown) => {
    const next: Item = {...item, [key]: value};
    if (isNew) {
      for (const f of schema.fields) {
        if (f.type === 'slug' && f.from === key && !slugTouched.current.has(f.key)) next[f.key] = slugify(String(value));
      }
    }
    if (schema.fields.find((f) => f.key === key)?.type === 'slug') slugTouched.current.add(key);
    onChange(next);
  };

  return (
    <div className="a-editor">
      <div className="a-card a-fields">
        {main.map((f) => (
          <FieldInput key={f.key} field={f} value={item[f.key]} path={f.key} errors={errorMap} ctx={ctx} onChange={(v) => set(f.key, v)} />
        ))}
      </div>
      {advanced.length > 0 && (
        <details className="a-card a-advanced" open={advanced.some((f) => errorMap[f.key])}>
          <summary>Avansat</summary>
          <div className="a-fields">
            {advanced.map((f) => (
              <FieldInput key={f.key} field={f} value={item[f.key]} path={f.key} errors={errorMap} ctx={ctx} onChange={(v) => set(f.key, v)} />
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

export function FieldInput({
  field, value, path, errors, ctx, onChange,
}: {
  field: Field; value: unknown; path: string; errors: Record<string, string>; ctx: Ctx; onChange: (v: unknown) => void;
}) {
  const error = errors[path];
  const label = field.label ?? field.key;
  const wide = field.type === 'list';
  const head = (
    <span className="a-field-label">
      {label}
      {field.required && <i className="a-req">*</i>}
      {field.type === 'html' && <b>HTML</b>}
      {field.type === 'strings' && <b>un rând per element</b>}
    </span>
  );
  let input: React.ReactNode;
  switch (field.type) {
    case 'textarea':
    case 'html':
      input = (
        <textarea
          className={`a-input a-textarea${field.type === 'html' ? ' is-mono' : ''}`}
          rows={field.type === 'html' ? 8 : 3}
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
        />
      );
      break;
    case 'rank':
      input = (
        <button
          type="button"
          role="switch"
          aria-checked={Number(value) > 0}
          className={`a-switch${Number(value) > 0 ? ' is-on' : ''}`}
          onClick={() => onChange(Number(value) > 0 ? '' : ctx.nextRank?.(field.key) ?? 1)}
        >
          <i />
        </button>
      );
      break;
    case 'boolean':
      input = (
        <button type="button" role="switch" aria-checked={!!value} className={`a-switch${value ? ' is-on' : ''}`} onClick={() => onChange(!value)}>
          <i />
        </button>
      );
      break;
    case 'number':
      input = <input className="a-input" type="number" value={value === undefined || value === null ? '' : String(value)} onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))} />;
      break;
    case 'strings':
      input = (
        <textarea
          className="a-input a-textarea"
          rows={3}
          value={Array.isArray(value) ? value.join('\n') : ''}
          onChange={(e) => onChange(e.target.value.split('\n'))}
        />
      );
      break;
    case 'select': {
      const target = field.collection ? ctx.schemas[field.collection] : undefined;
      const idKey = target ? idFieldOf(target) : null;
      const choices: {value: string; label: string}[] =
        target && idKey
          ? (ctx.collections[field.collection!] ?? []).filter((o) => o[idKey]).map((o) => ({value: String(o[idKey]), label: labelOf(target, o)}))
          : (field.options ?? []).map((o) => ({value: o, label: o}));
      const current = String(value ?? '');
      if (current && !choices.some((c) => c.value === current)) choices.push({value: current, label: current});
      input = (
        <select className="a-input" value={current} onChange={(e) => onChange(e.target.value)}>
          <option value="">—</option>
          {choices.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      );
      break;
    }
    case 'image':
      input = <ImageInput value={String(value ?? '')} ctx={ctx} onChange={onChange} />;
      break;
    case 'refs':
      input = <RefsInput field={field} value={Array.isArray(value) ? (value as string[]) : []} ctx={ctx} onChange={onChange} />;
      break;
    case 'list':
      input = <ListInput field={field} value={Array.isArray(value) ? (value as Item[]) : []} path={path} errors={errors} ctx={ctx} onChange={onChange} />;
      break;
    default:
      input = (
        <input
          className={`a-input${field.type === 'slug' ? ' is-mono' : ''}`}
          type="text"
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
        />
      );
  }
  const Tag = wide || field.type === 'refs' || field.type === 'image' || field.type === 'boolean' || field.type === 'rank' ? 'div' : 'label';
  return (
    <Tag className={`a-field${error ? ' has-error' : ''}${field.type === 'boolean' || field.type === 'rank' ? ' is-inline' : ''}`}>
      {head}
      {input}
      {error && <p className="a-error">{error}</p>}
    </Tag>
  );
}

function ImageInput({value, ctx, onChange}: {value: string; ctx: Ctx; onChange: (v: string) => void}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  return (
    <div className="a-imgfield">
      <span className="a-thumb a-thumb-lg">{value ? <img src={value} alt="" /> : null}</span>
      <div className="a-imgfield-body">
        <input className="a-input" placeholder="/cale/imagine.webp" value={value} onChange={(e) => onChange(e.target.value)} />
        <div className="a-row-actions">
          <button type="button" className="a-btn a-btn-ghost a-btn-sm" disabled={busy} onClick={() => input.current?.click()}>
            {busy ? 'Se încarcă…' : 'Încarcă'}
          </button>
          {value && <button type="button" className="a-link" onClick={() => onChange('')}>Elimină</button>}
        </div>
        <input
          ref={input}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif,image/gif,image/svg+xml"
          hidden
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = '';
            if (!file) return;
            setBusy(true);
            const path = await ctx.upload(file);
            setBusy(false);
            if (path) onChange(path);
          }}
        />
      </div>
    </div>
  );
}

function RefsInput({field, value, ctx, onChange}: {field: Field; value: string[]; ctx: Ctx; onChange: (v: string[]) => void}) {
  const target = field.collection ? ctx.schemas[field.collection] : undefined;
  const [query, setQuery] = useState('');
  if (!target || !field.collection) return <p className="a-error">Colecție necunoscută.</p>;
  const idKey = idFieldOf(target);
  if (!idKey) return <p className="a-error">Colecția nu poate fi referențiată.</p>;
  const options = (ctx.collections[field.collection] ?? []).filter((o) => o[idKey]);
  const q = query.toLowerCase();
  const shown = options.filter((o) => !q || labelOf(target, o).toLowerCase().includes(q) || value.includes(String(o[idKey])));
  return (
    <div className="a-refs">
      {options.length > 8 && <input className="a-input" placeholder="Caută" value={query} onChange={(e) => setQuery(e.target.value)} />}
      <div className="a-chips">
        {shown.map((o) => {
          const id = String(o[idKey]);
          const on = value.includes(id);
          return (
            <button type="button" key={id} className={`a-chip${on ? ' is-on' : ''}`} onClick={() => onChange(on ? value.filter((v) => v !== id) : [...value, id])}>
              {labelOf(target, o)}
            </button>
          );
        })}
        {!options.length && <span className="a-muted">Nimic de ales încă.</span>}
      </div>
      {value.filter((v) => !options.some((o) => o[idKey] === v)).map((v) => (
        <button type="button" key={v} className="a-chip is-on" title="Referință inexistentă" onClick={() => onChange(value.filter((x) => x !== v))}>{v} ✕</button>
      ))}
    </div>
  );
}

function ListInput({
  field, value, path, errors, ctx, onChange,
}: {
  field: Field; value: Item[]; path: string; errors: Record<string, string>; ctx: Ctx; onChange: (v: Item[]) => void;
}) {
  const sub = (field.fields ?? []).filter((f) => f.type !== 'hidden');
  const move = (i: number, dir: -1 | 1) => {
    const next = [...value];
    [next[i], next[i + dir]] = [next[i + dir], next[i]];
    onChange(next);
  };
  const preview = (row: Item) => {
    const textKey = sub.find((f) => f.type === 'text' || f.type === 'textarea');
    return textKey ? String(row[textKey.key] ?? '') : '';
  };
  return (
    <div className="a-sublist">
      {value.map((row, i) => (
        <div className="a-subcard" key={i}>
          <div className="a-subcard-head">
            <span>{i + 1}{preview(row) ? ` · ${preview(row).slice(0, 40)}` : ''}</span>
            <div className="a-row-ctl">
              <button type="button" className="a-icon" disabled={i === 0} onClick={() => move(i, -1)}>↑</button>
              <button type="button" className="a-icon" disabled={i === value.length - 1} onClick={() => move(i, 1)}>↓</button>
              <button type="button" className="a-icon is-danger" onClick={() => onChange(value.filter((_, j) => j !== i))}>✕</button>
            </div>
          </div>
          {sub.map((f) => (
            <FieldInput
              key={f.key}
              field={f}
              value={row[f.key]}
              path={`${path}[${i}].${f.key}`}
              errors={errors}
              ctx={ctx}
              onChange={(v) => onChange(value.map((r, j) => (j === i ? {...r, [f.key]: v} : r)))}
            />
          ))}
        </div>
      ))}
      <button
        type="button"
        className="a-btn a-btn-ghost a-btn-sm"
        onClick={() => onChange([...value, Object.fromEntries((field.fields ?? []).map((f) => [f.key, emptyValue(f)]))])}
      >
        + Adaugă
      </button>
    </div>
  );
}
