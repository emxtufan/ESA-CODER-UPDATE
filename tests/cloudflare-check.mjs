// node tests/cloudflare-check.mjs - server/cloudflare.mjs against a fake Cloudflare API:
// zone lookup, our cache rules added next to the other rules of the zone (kept), purge, turning off removes only ours.
import assert from 'node:assert/strict';
import {mkdtemp, readFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createCloudflare} from '../server/cloudflare.mjs';

const dir = await mkdtemp(path.join(tmpdir(), 'cf-check-'));
const calls = [];
let ruleset = {rules: [{id: 'x', version: '3', description: 'regula mea', expression: 'true', action: 'set_cache_settings', action_parameters: {cache: false}}]};
globalThis.fetch = async (url, init) => {
  const u = new URL(url);
  const body = init.body ? JSON.parse(init.body) : undefined;
  calls.push({method: init.method, path: u.pathname, body});
  const ok = (result) => new Response(JSON.stringify({success: true, result}), {status: 200});
  if (u.pathname.endsWith('/zones')) return ok(u.searchParams.get('name') === 'exemplu.ro' ? [{id: 'z1', name: 'exemplu.ro'}] : []);
  if (u.pathname.endsWith('/entrypoint')) {
    if (init.method === 'PUT') ruleset = body;
    return ok(ruleset);
  }
  if (u.pathname.endsWith('/purge_cache')) return ok({id: 'p'});
  if (u.pathname.endsWith('/dns_records')) return ok([{name: 'exemplu.ro', type: 'A', proxied: true}, {name: 'mail.exemplu.ro', type: 'A', proxied: false}]);
  return new Response('{}', {status: 404});
};

try {
  const file = path.join(dir, 'cloudflare.json');
  const cf = createCloudflare(file);
  assert.match((await cf.save({enabled: true, zone: 'altul.ro', token: 't'})).error, /altul\.ro/);
  assert.match((await cf.save({enabled: true, zone: '', token: ''})).error, /Completează/);

  const on = await cf.save({enabled: true, zone: 'https://www.exemplu.ro/', token: 't'});
  assert.equal(on.error, undefined);
  assert.equal(on.settings.zone, 'exemplu.ro');
  assert.equal(on.settings.hasToken, true);
  assert.equal(on.settings.token, undefined, 'tokenul nu pleacă spre browser');
  assert.equal(on.settings.proxied, true);
  assert.ok(on.settings.lastPurge);
  assert.deepEqual(ruleset.rules.map((r) => r.description.slice(0, 11)), ['[ESA admin]', '[ESA admin]', 'regula mea']);
  assert.equal(ruleset.rules[2].version, undefined);
  assert.match(ruleset.rules[0].expression, /^http\.host in \{"exemplu\.ro" "www\.exemplu\.ro"\}/);
  assert.ok(calls.some((c) => c.path.endsWith('/purge_cache') && c.body.purge_everything === true));

  // empty token keeps the saved one; turning off removes only our rules
  assert.equal((await cf.save({enabled: false, zone: 'exemplu.ro', token: ''})).error, undefined);
  assert.deepEqual(ruleset.rules.map((r) => r.description), ['regula mea']);
  assert.equal(JSON.parse(await readFile(file, 'utf8')).token, 't');
  assert.equal(await cf.purge(), false, 'oprit: nu golește nimic');
  console.log('cloudflare-check: ok');
} finally {
  await rm(dir, {recursive: true, force: true});
}
