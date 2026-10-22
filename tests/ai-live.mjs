// node tests/ai-live.mjs — live answers from the real provider (keys from .env, real network, multi-turn).
import fs from 'node:fs/promises'; import os from 'node:os'; import path from 'node:path';
import {fileURLToPath} from 'node:url';
try { process.loadEnvFile('.env'); } catch { console.warn('[ai-live] .env lipsește: folosesc variabilele de mediu existente.'); }
const {createStore} = await import('../server/ai/store.mjs');
const {createKnowledge} = await import('../server/ai/knowledge.mjs');
const {createChat} = await import('../server/ai/chat.mjs');
const HISTORY_TURNS = 12;
const root = path.dirname(fileURLToPath(import.meta.url));
const project = path.join(root, '..');
const DATA_DIR = path.join(project, 'data', 'ai');
const tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'esa-ai-live-'));
const dir = path.join(tmpRoot, 'ai');
const lower = (value) => String(value ?? '').toLowerCase();
// Case-insensitive checks on the answer text; the status is compared exactly.
function verdict(expect, status, text) {
  const fails = [];
  if (!expect) return fails;
  if (expect.status && status !== expect.status) fails.push(`status ${status} ≠ ${expect.status}`);
  const body = lower(text);
  const any = Array.isArray(expect.includesAny) ? expect.includesAny : [];
  if (any.length && !any.some((needle) => body.includes(lower(needle)))) fails.push(`nu conține niciunul din: ${any.join(' | ')}`);
  for (const needle of Array.isArray(expect.excludes) ? expect.excludes : []) if (body.includes(lower(needle))) fails.push(`conține interzisul: ${needle}`);
  return fails;
}
let total = 0; let failed = 0; const times = [];
try {
  try {
    await fs.access(DATA_DIR);
  } catch {
    console.error(`[ai-live] Lipsă ${path.relative(project, DATA_DIR)}: testul are nevoie de configurația AI reală (provider + chei).`);
    await fs.rm(tmpRoot, {recursive: true, force: true});
    process.exit(1);
  }
  await fs.cp(DATA_DIR, dir, {recursive: true});
  const suites = JSON.parse(await fs.readFile(path.join(root, 'ai-live.json'), 'utf8'));
  const data = JSON.parse(await fs.readFile(path.join(project, 'source_data.json'), 'utf8'));
  const store = await createStore(dir); const knowledge = await createKnowledge({dir, store}); const chat = createChat({store, knowledge});
  await store.saveSettings({enabled: true, leadAfter: 0});
  await store.saveLimits({perIpPerMinute: 0, perIpPerDay: 0, perSessionPerDay: 0, globalPerDay: 0, monthlyBudget: 1000});
  await knowledge.syncSite(data);
  for (const suite of suites) {
    console.log(`\n# ${suite.name}`);
    let conversationId; let history = [];
    for (const turn of suite.turns) {
      const started = Date.now();
      const r = await chat.answer({message: turn.q, history, conversationId, ip: '127.0.0.1', sessionId: 'live'});
      const elapsed = Date.now() - started;
      times.push(elapsed);
      let reason = '';
      if (r.conversationId && r.messageId) {
        const conv = await store.getConversation(r.conversationId);
        reason = conv?.messages?.find((message) => message.id === r.messageId)?.reason || '';
      }
      const text = String(r.text ?? '').replace(/\s+/g, ' ').trim();
      const fails = verdict(turn.expect, r.status, text);
      total++;
      if (fails.length) failed++;
      console.log(`[${fails.length ? 'FAIL' : 'PASS'}] ${turn.q} → ${r.status} ${reason || '-'} ${elapsed}ms`);
      console.log(`    ${text || '(răspuns gol)'}`);
      if (fails.length) console.log(`    ! ${fails.join('; ')}`);
      conversationId = r.conversationId ?? conversationId;
      history.push({role: 'user', text: turn.q});
      if (text) history.push({role: 'assistant', text});
      history = history.slice(-HISTORY_TURNS);
    }
  }
  const {totals} = await store.usageSummary(1);
  const sum = times.reduce((acc, ms) => acc + ms, 0);
  const avg = times.length ? Math.round(sum / times.length) : 0;
  const min = times.length ? Math.min(...times) : 0; const max = times.length ? Math.max(...times) : 0;
  console.log(`\nTotal: ${total - failed}/${total} PASS, ${failed} FAIL`);
  console.log(`Timp mediu: ${avg} ms (min ${min} / max ${max})`);
  console.log(`Usage ultima zi: ${JSON.stringify(totals)}`);
  if (failed) process.exitCode = 1;
} finally {
  await fs.rm(tmpRoot, {recursive: true, force: true});
}
