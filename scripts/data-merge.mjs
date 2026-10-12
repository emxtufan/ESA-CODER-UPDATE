// Merge a patch into source_data.json safely (lock + atomic write).
// usage: node scripts/data-merge.mjs <patch.json>
// Patch format (all parts optional):
//   {
//     "scopes":      { "<scope>": { "<key>": "value" | null } },  // set keys; null deletes a key
//     "dropScopes":  ["<scope>", ...],                            // delete whole scopes
//     "collections": { "<name>": [ ...items ] | null }            // replace a collection; null deletes it
//   }
import {mkdirSync, readFileSync, renameSync, rmdirSync, writeFileSync} from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const file = path.join(root, 'source_data.json');
const lock = path.join(root, 'data', '.source_data.lock');
const patch = JSON.parse(readFileSync(process.argv[2], 'utf8'));

mkdirSync(path.dirname(lock), {recursive: true});
const started = Date.now();
for (;;) {
  try {
    mkdirSync(lock);
    break;
  } catch {
    if (Date.now() - started > 30000) throw new Error('source_data.json is locked (data/.source_data.lock)');
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 100);
  }
}
try {
  const data = JSON.parse(readFileSync(file, 'utf8'));
  for (const [scope, entries] of Object.entries(patch.scopes ?? {})) {
    const target = (data[scope] ??= {});
    for (const [key, value] of Object.entries(entries)) {
      if (value === null) delete target[key];
      else target[key] = value;
    }
    if (!Object.keys(target).length) delete data[scope];
  }
  for (const scope of patch.dropScopes ?? []) delete data[scope];
  if (patch.collections) {
    data._collections ??= {};
    for (const [name, items] of Object.entries(patch.collections)) {
      if (items === null) delete data._collections[name];
      else data._collections[name] = items;
    }
  }
  // keep "_about" and "_collections" first
  const ordered = {_about: data._about, _collections: data._collections ?? {}};
  for (const [k, v] of Object.entries(data)) if (!(k in ordered)) ordered[k] = v;
  const tmp = `${file}.${process.pid}.tmp`;
  writeFileSync(tmp, JSON.stringify(ordered, null, 2) + '\n');
  renameSync(tmp, file);
  console.log('source_data.json updated');
} finally {
  rmdirSync(lock);
}
