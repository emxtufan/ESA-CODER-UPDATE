// Section registry of the admin (server/sections.json): pure helpers, no I/O besides loading the file.
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';

export const loadRegistry = (file) => JSON.parse(readFileSync(file, 'utf8'));

// Validation of a text value by field type; returns an error message or null.
const URL_RE = /^(https?:\/\/|\/|#|mailto:|tel:)\S*$/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[0-9 ()\-.]{5,}$/;
// `pattern` (a regex source from sections.json) guards codes such as tracking IDs, which end up in script URLs.
export function checkText(type, value, optional, pattern) {
  if (typeof value !== 'string') return 'Valoare invalidă.';
  if (value.length > 20000) return 'Textul este prea lung.';
  if (!optional && !value.trim()) return 'Câmp obligatoriu.';
  if (!value) return null;
  if (type !== 'textarea' && /[\r\n]/.test(value)) return 'Textul trebuie să fie pe un singur rând.';
  if (type === 'link' && !URL_RE.test(value)) return 'Adresă invalidă (https://… sau /cale).';
  if (type === 'email' && !EMAIL_RE.test(value)) return 'Adresă de e-mail invalidă.';
  if (type === 'phone' && !PHONE_RE.test(value)) return 'Număr de telefon invalid.';
  if (pattern && !new RegExp(pattern).test(value)) return 'Format invalid.';
  return null;
}

/** Every text a section may edit: [{scope, key, type, optional}] (pair/rich/stat expand to their keys). */
export function textRefs(section) {
  const out = [];
  for (const block of section.blocks) {
    for (const f of block.fields ?? []) {
      if (block.collection) continue;
      switch (f.type) {
        case 'pair':
          out.push({scope: f.scope, key: f.text, type: 'text'}, {scope: f.scope, key: f.link, type: 'link'});
          break;
        case 'rich':
          for (const p of f.parts) out.push({scope: f.scope, key: p.key, type: 'text', optional: true});
          break;
        case 'stat':
          out.push({scope: f.scope, key: f.value, type: 'text'}, {scope: f.scope, key: f.suffix, type: 'text', optional: true}, {scope: f.scope, key: f.label, type: 'text'});
          break;
        default:
          out.push({scope: f.scope, key: f.key, type: f.type, optional: f.optional, pattern: f.pattern});
      }
    }
  }
  return out;
}
export const refId = (r) => `${r.scope}::${r.key}`;

/** Fields of a collection block: the schema's field definitions, in the order and with the labels of the registry. */
export function blockFields(block, schema) {
  return block.fields.map((f) => {
    const spec = typeof f === 'string' ? {key: f} : f;
    const base = schema.fields.find((x) => x.key === spec.key);
    if (!base) throw new Error(`field "${spec.key}" is not in the "${block.collection}" schema`);
    const {as, ...rest} = spec;
    return {...base, ...rest, ...(as ? {type: as} : {})};
  });
}

/** Stable id of a record: its unique/slug field, else its position. */
export const idKeyOf = (schema) => (schema.fields.find((f) => f.unique) || schema.fields.find((f) => f.type === 'slug'))?.key ?? null;
export const recordId = (schema, record, index) => {
  const key = idKeyOf(schema);
  return key ? String(record?.[key] ?? '') : String(index);
};

/** The block's view of the records: only the visible fields, plus `_id`. */
export function projectItems(block, schema, records) {
  const fields = blockFields(block, schema);
  return records.map((record, i) => {
    const out = {_id: recordId(schema, record, i)};
    for (const f of fields) {
      const v = record?.[f.key];
      if (v !== undefined) out[f.key] = v;
      else if (f.key === 'published') out[f.key] = true; // a record without the flag is public
    }
    return out;
  });
}

export const hash = (value) => createHash('sha1').update(JSON.stringify(value)).digest('hex').slice(0, 16);

/** Problems in the registry itself (unknown keys, a text owned by two sections, …); [] = fine. */
export function checkRegistry(registry, data, schemas, imageScopes = null) {
  const problems = [];
  const owner = new Map();
  const seenKeys = new Set();
  for (const section of registry.sections) {
    if (seenKeys.has(section.key)) problems.push(`duplicate section key "${section.key}"`);
    seenKeys.add(section.key);
    if (!registry.groups.some((g) => g.key === section.group)) problems.push(`${section.key}: unknown group "${section.group}"`);
    const collections = new Set();
    for (const ref of textRefs(section)) {
      const id = refId(ref);
      if (typeof data[ref.scope]?.[ref.key] !== 'string') problems.push(`${section.key}: text ${id} does not exist in source_data.json`);
      if (owner.has(id) && owner.get(id) !== section.key) problems.push(`text ${id} is edited by two sections (${owner.get(id)}, ${section.key})`);
      owner.set(id, section.key);
    }
    for (const block of section.blocks) {
      if (block.images?.scope && imageScopes && !(block.images.scope in imageScopes)) problems.push(`${section.key}: no images found for scope ${block.images.scope}`);
      for (const f of block.images?.files ?? []) if (imageScopes && !Object.values(imageScopes).some((l) => l.includes(f))) problems.push(`${section.key}: unknown image ${f}`);
      if (!block.collection) continue;
      if (collections.has(block.collection)) problems.push(`${section.key}: collection "${block.collection}" used by two blocks`);
      collections.add(block.collection);
      const schema = schemas[block.collection];
      if (!schema) {
        problems.push(`${section.key}: no schema for collection "${block.collection}"`);
        continue;
      }
      try {
        const fields = blockFields(block, schema);
        const idKey = idKeyOf(schema);
        if (idKey && !fields.some((f) => f.key === idKey)) problems.push(`${section.key}: block "${block.collection}" must include the id field "${idKey}"`);
        if (block.position && !fields.some((f) => f.key === block.position)) problems.push(`${section.key}: position field "${block.position}" missing`);
        if (block.ranked && !fields.some((f) => f.key === block.ranked)) problems.push(`${section.key}: ranked field "${block.ranked}" missing`);
      } catch (err) {
        problems.push(`${section.key}: ${err.message}`);
      }
    }
  }
  return problems;
}
