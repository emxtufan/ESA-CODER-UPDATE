// Restore preparation only: creates a NEW isolated directory, never overwrites live stores.
import {readFile, writeFile, mkdir, stat} from 'node:fs/promises';
import path from 'node:path';
import {createGdpr} from '../server/gdpr.mjs';

const args = process.argv.slice(2);
const value = name => args[args.indexOf(name) + 1];
if (!['--file', '--registry', '--output'].every(name => args.includes(name) && value(name) && !value(name).startsWith('--'))) {
  throw new Error('Usage: node scripts/gdpr-recover.mjs --file backup.enc --registry latest-private-gdpr-dir --output new-isolated-dir');
}
const registry = path.resolve(value('--registry')), output = path.resolve(value('--output'));
await stat(path.join(registry, 'register.json'));
await stat(path.join(registry, 'integrity.key'));
// No service or data store is opened by these helpers; only signed evidence and the encrypted copy.
const gdpr = await createGdpr({dir: registry});
const copy = gdpr.decrypt(await readFile(path.resolve(value('--file'))));
if (copy.version !== 1 || !Array.isArray(copy.contacts) || !Array.isArray(copy.analytics?.recent) || !copy.analytics?.days) throw new Error('Invalid backup structure');
const {signedStore} = await import('../server/gdpr-storage.mjs');
const evidence = await signedStore(registry);
const latest = await evidence.load();
const replayed = gdpr.sanitizeBackup(copy, latest);
if (gdpr.sanitizeBackup(structuredClone(copy), latest)) throw new Error('Erasure replay verification failed');
// mkdir without recursive/exist-ok is an intentional guard against overwriting a destination.
await mkdir(output, {mode: 0o700});
await writeFile(path.join(output, 'contacts.json'), JSON.stringify(copy.contacts), {flag: 'wx', mode: 0o600});
await writeFile(path.join(output, 'analytics.json'), JSON.stringify(copy.analytics), {flag: 'wx', mode: 0o600});
await writeFile(path.join(output, 'recovery-manifest.json'), JSON.stringify({at: new Date().toISOString(), replayed, checkpoint: evidence.verify(latest), status: 'VERIFIED_ISOLATED_COPY', warning: 'Keep production closed. Recheck against latest GDPR register immediately before import; preserve the latest register and key. No production data has been changed.'}, null, 2), {flag: 'wx', mode: 0o600});
console.log(`Isolated recovery verified: ${replayed} records handled. Output: ${output}`);
