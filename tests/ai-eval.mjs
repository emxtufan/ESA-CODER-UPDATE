// node tests/ai-eval.mjs — retrieval + validation evaluation on the real site content (mock model, no network).
import fs from 'node:fs/promises'; import os from 'node:os'; import path from 'node:path';
process.env.AI_SECRET_KEY = 'ab'.repeat(32);
const {registerAdapter} = await import('../server/ai/providers.mjs');
const {createStore} = await import('../server/ai/store.mjs');
const {createKnowledge} = await import('../server/ai/knowledge.mjs');
const {createChat} = await import('../server/ai/chat.mjs');
const SOURCES_RE = /<<<SOURCES\n([\s\S]*?)\nSOURCES>>>/;
registerAdapter('oracle', {models: async () => ['oracle'], generate: async (cfg, key, req) => {
  const last = [...req.messages].reverse().find((m) => m.role === 'user');
  const sources = JSON.parse(SOURCES_RE.exec(last.content)[1]);
  const sentence = (sources[0].text.split(/(?<=[.!?])\s+|\n+/).find((s) => s.trim().length >= 12) || sources[0].text).trim().slice(0, 200);
  return {text: JSON.stringify({status: 'answer', answer: sentence, citations: ['S1'], claims: [{source: 'S1', quote: sentence}]}), usage: {input: 0, output: 0}, costReported: null, model: cfg.model};
}});
const CITATION = new Set(['bad_citation', 'unverified_quote', 'unsupported_value', 'low_support']);
const root = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'esa-ai-eval-'));
try {
  const {questions} = JSON.parse(await fs.readFile(path.join(root, 'ai-eval.json'), 'utf8'));
  const data = JSON.parse(await fs.readFile(path.join(root, '..', 'source_data.json'), 'utf8'));
  const store = await createStore(dir); const knowledge = await createKnowledge({dir, store}); const chat = createChat({store, knowledge});
  await knowledge.syncSite(data);
  const p = await store.saveProvider({name: 'oracle', type: 'oracle', role: 'chat', model: 'oracle'});
  await store.setActive({activeChat: p.id});
  await store.saveSettings({enabled: true});
  await store.saveLimits({perIpPerMinute: 0, perIpPerDay: 0, perSessionPerDay: 0, globalPerDay: 0, monthlyBudget: 1000});
  const {topK, minScore} = store.config().settings;
  const rows = [];
  for (const [i, item] of questions.entries()) {
    const {hits} = await knowledge.search(item.q, {topK, minScore});
    const r = await chat.answer({message: item.q, sessionId: 'eval-' + i, ip: 'eval'});
    const conv = r.conversationId ? await store.getConversation(r.conversationId) : null;
    const reason = conv?.messages?.at(-1)?.reason || '';
    const match = (h) => item.expect && h.kind === item.expect.kind && h.title.toLowerCase().includes(item.expect.title.toLowerCase());
    rows.push({...item, status: r.status, reason, hit: hits.findIndex(match), top: hits[0] ? `${hits[0].kind}:${hits[0].title.slice(0, 40)} (${hits[0].score.toFixed(2)})` : '-'});
  }
  const pct = (n, d) => (d ? Math.round((n / d) * 100) : 0) + '%';
  const a = rows.filter((r) => r.type === 'answerable'), u = rows.filter((r) => r.type === 'unanswerable'), m = rows.filter((r) => r.type === 'ambiguous');
  const refusedLike = (r) => r.status !== 'answer';
  console.table(rows.map(({q, type, status, reason, hit, top}) => ({q: q.slice(0, 45), type, status, reason, hit, top})));
  const report = {
    note: 'Modelul e mock: metricile măsoară retrieval + validare, nu calitatea unui LLM real.',
    answerable: {count: a.length, retrievalRecall: pct(a.filter((r) => r.hit >= 0).length, a.length), top1: pct(a.filter((r) => r.hit === 0).length, a.length), answered: pct(a.filter((r) => r.status === 'answer').length, a.length), citationErrors: a.filter((r) => CITATION.has(r.reason)).length},
    unanswerable: {count: u.length, refusalRate: pct(u.filter(refusedLike).length, u.length), falseAnswers: u.filter((r) => !refusedLike(r)).map((r) => `${r.q} → ${r.top}`)},
    ambiguous: {count: m.length, refusedOrClarify: pct(m.filter(refusedLike).length, m.length)},
  };
  console.log(JSON.stringify(report, null, 2));
} finally {
  if (path.basename(dir).startsWith('esa-ai-eval-')) await fs.rm(dir, {recursive: true, force: true});
}