// AI routes: the visitor widget (same-origin, streamed answers, feedback) and the operator
// panel (providers, knowledge base, conversations, analytics). No state lives here: the chat,
// the knowledge base and the store own it, this file only translates HTTP into their API.
import express from 'express';
import {problem} from '../gdpr-storage.mjs';
import {createChat} from './chat.mjs';
import {createKnowledge} from './knowledge.mjs';
import {ProviderError, TYPES, provider} from './providers.mjs';
import {createStore} from './store.mjs';

const BODY_LIMIT = '256kb';
const CHAT_LIMIT = '16kb';
const FEEDBACK_LIMIT = '2kb';
const UPLOAD_LIMIT = '10mb';
const SYNC_DEBOUNCE_MS = 2000;
const DELTA_WORDS = 3;
const DELTA_PAUSE_MS = 25;
const ANALYTICS_MAX = 2000;
const TOP_QUESTIONS = 10;
const MAX_DAYS = 365;
const DAY_MS = 86_400_000;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SESSION_RE = /^[a-zA-Z0-9-]{8,64}$/;
const RATING_VALUES = new Set(['good', 'ok', 'bad']);
const STREAM_ERROR = 'Am o problemă tehnică momentan.';
// Refusals that mean "the knowledge base could not support an answer", not "the model broke".
const INSUFFICIENT_REASONS = new Set(['no_sources', 'insufficient', 'conflict', 'low_support', 'unverified_quote', 'unsupported_value']);

const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const safeNumber = (value) => (typeof value === 'number' && Number.isFinite(value) ? value : 0);
const bodyOf = (req) => (isObject(req.body) ? req.body : {});
const forbidden = (res) => res.status(403).json({ok: false, error: 'Cerere respinsă.'});
const badRequest = (res, error) => res.status(400).json({ok: false, error});

// One response shape for every route: never a stack, never a provider key.
function send(res, run) {
  Promise.resolve()
    .then(run)
    .then((result) => res.json({ok: true, ...result}))
    .catch((error) => {
      const known = !!error?.status || error instanceof ProviderError;
      const status = error?.status >= 400 && error.status <= 599
        ? error.status
        : error instanceof ProviderError && error.kind === 'config' ? 400 : 500;
      res.status(status).json({ok: false, error: known ? error.message : 'Eroare internă.'});
    });
}

// The answer text, cut in small pieces so the widget can render it as it arrives.
function deltas(text) {
  const words = String(text ?? '').split(/\s+/).filter(Boolean);
  const out = [];
  for (let index = 0; index < words.length; index += DELTA_WORDS) {
    const piece = words.slice(index, index + DELTA_WORDS).join(' ');
    out.push(index + DELTA_WORDS < words.length ? `${piece} ` : piece);
  }
  return out;
}

// A pause that ends early when the client goes away.
function pause(ms, signal) {
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, ms);
    if (typeof timer.unref === 'function') timer.unref();
    signal?.addEventListener('abort', () => { clearTimeout(timer); resolve(); }, {once: true});
  });
}

// Everything the analytics page shows, from the full conversations of the interval.
function analyticsOf(conversations) {
  const byStatus = {answered: 0, refused: 0, error: 0, limited: 0};
  const byProvider = {};
  const byModel = {};
  const questions = new Map();
  let messages = 0;
  let latencyTotal = 0;
  let latencyCount = 0;
  let insufficient = 0;
  let negativeFeedback = 0;
  let leads = 0;
  const ratings = {good: 0, ok: 0, bad: 0};

  const tally = (map, key, message) => {
    const row = map[key] ?? {messages: 0, input: 0, output: 0};
    row.messages++;
    row.input += safeNumber(message?.usage?.input);
    row.output += safeNumber(message?.usage?.output);
    map[key] = row;
  };

  for (const conversation of conversations) {
    if (conversation?.lead?.email) leads++;
    const rated = conversation?.rating?.value;
    if (rated in ratings) ratings[rated]++;
    for (const message of Array.isArray(conversation?.messages) ? conversation.messages : []) {
      if (message?.feedback === 'down') negativeFeedback++;
      if (message?.role !== 'assistant') {
        // Questions are compared without case and cut to 100 characters.
        const question = String(message?.text ?? '').trim().toLowerCase().slice(0, 100);
        if (question) questions.set(question, (questions.get(question) ?? 0) + 1);
        continue;
      }
      messages++;
      if (Object.hasOwn(byStatus, message.status)) byStatus[message.status]++;
      if (message.status === 'refused' && INSUFFICIENT_REASONS.has(String(message.reason ?? ''))) insufficient++;
      const latency = safeNumber(message.latencyMs);
      if (latency > 0) { latencyTotal += latency; latencyCount++; }
      tally(byProvider, String(message.provider ?? '').trim() || 'unknown', message);
      tally(byModel, String(message.model ?? '').trim() || 'unknown', message);
    }
  }

  return {
    messages,
    avgLatencyMs: latencyCount ? Math.round(latencyTotal / latencyCount) : 0,
    byStatus,
    insufficient,
    apiErrors: byStatus.error,
    byProvider,
    byModel,
    topQuestions: [...questions]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, TOP_QUESTIONS)
      .map(([q, count]) => ({q, count})),
    negativeFeedback,
    leads,
    ratings,
  };
}

export async function createAi({dir, admin, getContent}) {
  const store = await createStore(dir);
  const knowledge = await createKnowledge({dir, store});
  const chat = createChat({store, knowledge});

  // The site content as knowledge documents. A missing or unreadable file must never be
  // taken for an empty site: that would delete every site source on the next sync.
  async function currentContent() {
    const data = await getContent();
    if (!isObject(data)) throw problem('Conținutul site-ului nu este disponibil.', 503);
    return data;
  }

  // Embedding failures are already recorded inside the knowledge base; here we only say that
  // the sync did not finish, without echoing provider or filesystem details.
  async function syncKnowledge() {
    try {
      await knowledge.syncSite(await currentContent());
    } catch (error) {
      console.warn('[ai] knowledge sync failed:', error instanceof ProviderError ? error.kind : String(error?.message ?? '').slice(0, 120));
    }
  }

  let syncTimer = null;
  // Called by the CMS after a save: one sync per quiet period, never one per keystroke.
  function onContentChange() {
    if (syncTimer) clearTimeout(syncTimer);
    syncTimer = setTimeout(() => {
      syncTimer = null;
      syncKnowledge();
    }, SYNC_DEBOUNCE_MS);
    if (typeof syncTimer.unref === 'function') syncTimer.unref();
  }

  // First fill of the knowledge base, once, without blocking the server start.
  syncKnowledge();

  // ---------------------------------------------------------------- public widget

  const publicRouter = express.Router();

  // Same origin only, never cached, and a header no cross-site form can set.
  publicRouter.use((req, res, next) => {
    res.set('cache-control', 'no-store');
    const origin = req.get('origin');
    if (origin) {
      let host = '';
      try { host = new URL(origin).host; }
      catch { host = ''; }
      if (!host || host !== req.get('host')) return forbidden(res);
    }
    if (req.method !== 'GET' && req.get('x-ai') !== '1') return forbidden(res);
    next();
  });

  publicRouter.get('/config', (_req, res) => send(res, async () => {
    const {settings, limits} = await store.config();
    return {
      enabled: settings.enabled === true,
      welcome: settings.welcome,
      suggestions: settings.suggestions,
      contactUrl: settings.contactUrl,
      maxMessageChars: limits.maxMessageChars,
      leadAfter: settings.leadAfter,
      leadRequired: settings.leadRequired === true,
      leadPrompt: settings.leadPrompt,
      ratingPrompt: settings.ratingPrompt,
      teaserDelay: settings.teaserDelay,
    };
  }));

  publicRouter.post('/chat', express.json({limit: CHAT_LIMIT}), async (req, res) => {
    const body = bodyOf(req);
    const rawId = body.conversationId;
    const conversationId = rawId === undefined || rawId === null || rawId === '' ? null : String(rawId);
    if (conversationId !== null && !UUID_RE.test(conversationId)) {
      return badRequest(res, 'Identificator de conversație invalid.');
    }
    const sessionId = typeof body.sessionId === 'string' ? body.sessionId : '';
    if (!SESSION_RE.test(sessionId)) return badRequest(res, 'Identificator de sesiune invalid.');

    const controller = new AbortController();
    res.on('close', () => {
      if (!res.writableEnded) controller.abort();
    });
    const input = {
      message: body.message,
      history: body.history,
      conversationId,
      sessionId,
      ip: req.ip,
      signal: controller.signal,
    };

    if (!String(req.get('accept') ?? '').includes('text/event-stream')) {
      return send(res, () => chat.answer(input));
    }

    res.set({
      'content-type': 'text/event-stream; charset=utf-8',
      'cache-control': 'no-store',
      'x-accel-buffering': 'no',
    });
    res.flushHeaders();
    const write = (event, data) => {
      if (!res.writableEnded) res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };
    try {
      const result = await chat.answer(input);
      write('meta', {
        conversationId: result.conversationId,
        messageId: result.messageId,
        status: result.status,
        askLead: !!result.askLead,
        askRating: !!result.askRating,
      });
      for (const piece of deltas(result.text)) {
        if (controller.signal.aborted) break;
        write('delta', {text: piece});
        await pause(DELTA_PAUSE_MS, controller.signal);
      }
      if (!controller.signal.aborted) {
        write('sources', {sources: Array.isArray(result.sources) ? result.sources : []});
        write('done', {});
      }
    } catch {
      // The detail stays in the logs of the store; the visitor only sees this line.
      write('error', {error: STREAM_ERROR});
    } finally {
      if (!res.writableEnded) res.end();
    }
  });

  publicRouter.post('/feedback', express.json({limit: FEEDBACK_LIMIT}), (req, res) => send(res, async () => {
    const body = bodyOf(req);
    const value = body.value === 'up' || body.value === 'down' ? body.value : null;
    const saved = await chat.feedback(
      typeof body.conversationId === 'string' ? body.conversationId : '',
      typeof body.messageId === 'string' ? body.messageId : '',
      value,
    );
    return {saved: saved === true};
  }));

  // The address is personal data: it is stored only with an explicit consent.
  publicRouter.post('/lead', express.json({limit: FEEDBACK_LIMIT}), (req, res) => {
    const body = bodyOf(req);
    const conversationId = typeof body.conversationId === 'string' ? body.conversationId : '';
    if (!UUID_RE.test(conversationId)) return badRequest(res, 'Identificator de conversație invalid.');
    if (body.consent !== true) {
      return res.status(422).json({ok: false, error: 'Este necesar acordul pentru prelucrarea adresei de email.'});
    }
    return send(res, async () => ({saved: await store.setLead(conversationId, body.email)}));
  });

  // How the conversation went, at most once per conversation.
  publicRouter.post('/rating', express.json({limit: FEEDBACK_LIMIT}), (req, res) => {
    const body = bodyOf(req);
    const conversationId = typeof body.conversationId === 'string' ? body.conversationId : '';
    if (!UUID_RE.test(conversationId)) return badRequest(res, 'Identificator de conversație invalid.');
    const value = body.value === undefined ? null : body.value;
    if (value !== null && !RATING_VALUES.has(value)) return badRequest(res, 'Valoare de evaluare invalidă.');
    return send(res, async () => ({saved: await store.setRating(conversationId, value)}));
  });

  // ------------------------------------------------------------------- admin panel

  const adminRouter = express.Router();

  // The panel itself authenticates; here the CMS session is reused, and the custom header
  // blocks every write a cross-site form could post with that cookie.
  adminRouter.use((req, res, next) => {
    res.set('cache-control', 'no-store');
    if (!admin?.hasSession?.(req)) return res.status(401).json({ok: false, error: 'Autentificare necesară.'});
    if (req.method !== 'GET' && req.get('x-admin') !== '1') return forbidden(res);
    next();
  });

  adminRouter.get('/overview', (_req, res) => send(res, async () => {
    const config = await store.publicConfig();
    const activeOf = (id) => {
      const found = config.providers.find((item) => item.id === id);
      return found ? {name: found.name, model: found.model} : null;
    };
    return {
      settings: config.settings,
      limits: config.limits,
      kb: await knowledge.status(),
      usage: await store.usageSummary(30),
      monthCost: await store.monthCost(),
      active: {
        chat: activeOf(config.activeChat),
        fallback: activeOf(config.fallbackChat),
        embedding: activeOf(config.activeEmbedding),
      },
    };
  }));

  // ------------------------------------------------------------------- providers
  adminRouter.get('/providers', (_req, res) => send(res, async () => ({...await store.publicConfig(), types: TYPES})));

  adminRouter.post('/providers', express.json({limit: BODY_LIMIT}), (req, res) =>
    send(res, async () => ({provider: await store.saveProvider(bodyOf(req))})));

  adminRouter.put('/providers/:id', express.json({limit: BODY_LIMIT}), (req, res) =>
    send(res, async () => ({provider: await store.saveProvider(bodyOf(req), req.params.id)})));

  adminRouter.delete('/providers/:id', (req, res) => send(res, async () => {
    const removed = await store.deleteProvider(req.params.id);
    if (!removed) throw problem('Providerul nu există.', 404);
    return {removed: true};
  }));

  adminRouter.post('/providers/:id/test', (req, res) => send(res, async () => {
    const found = await store.providerWithKey(req.params.id);
    if (!found) throw problem('Providerul nu există sau este dezactivat.', 404);
    const instance = provider(found.cfg, found.key);
    if (found.cfg.role !== 'embedding') return instance.testConnection();
    // An embedding provider has no text answer to test with: one short vector is the test.
    const started = Date.now();
    try {
      const vectors = await instance.embed(['test']);
      return {ok: true, latencyMs: Date.now() - started, dims: Array.isArray(vectors?.[0]) ? vectors[0].length : 0};
    } catch (error) {
      return {ok: false, error: error instanceof ProviderError ? error.message : 'Eroare internă.'};
    }
  }));

  adminRouter.get('/providers/:id/models', (req, res) => send(res, async () => {
    const found = await store.providerWithKey(req.params.id);
    if (!found) throw problem('Providerul nu există sau este dezactivat.', 404);
    const instance = provider(found.cfg, found.key);
    if (!instance.capabilities.models) return {models: [], manual: true};
    return {models: await instance.listModels()};
  }));

  adminRouter.put('/active', express.json({limit: BODY_LIMIT}), (req, res) =>
    send(res, async () => ({active: await store.setActive(bodyOf(req))})));

  adminRouter.put('/settings', express.json({limit: BODY_LIMIT}), (req, res) =>
    send(res, async () => ({settings: await store.saveSettings(bodyOf(req))})));

  adminRouter.put('/limits', express.json({limit: BODY_LIMIT}), (req, res) =>
    send(res, async () => ({limits: await store.saveLimits(bodyOf(req))})));

  // -------------------------------------------------------------- knowledge base
  adminRouter.get('/kb/status', (_req, res) => send(res, async () => ({kb: await knowledge.status()})));

  adminRouter.post('/kb/sync', (_req, res) => send(res, async () => ({kb: await knowledge.syncSite(await currentContent())})));

  adminRouter.post('/kb/reindex', (_req, res) => send(res, async () => ({kb: await knowledge.reindex()})));

  adminRouter.get('/kb/sources', (_req, res) => send(res, async () => ({sources: await knowledge.listSources()})));

  adminRouter.get('/kb/sources/:id', (req, res) => send(res, async () => {
    const source = await knowledge.getSource(req.params.id);
    if (!source) throw problem('Sursa nu există.', 404);
    return {source};
  }));

  adminRouter.post('/kb/sources', express.json({limit: BODY_LIMIT}), (req, res) =>
    send(res, async () => ({source: await knowledge.saveSource(bodyOf(req))})));

  adminRouter.put('/kb/sources/:id', express.json({limit: BODY_LIMIT}), (req, res) =>
    send(res, async () => ({source: await knowledge.saveSource({...bodyOf(req), id: req.params.id})})));

  adminRouter.put('/kb/sources/:id/status', express.json({limit: BODY_LIMIT}), (req, res) =>
    send(res, async () => ({source: await knowledge.setStatus(req.params.id, bodyOf(req).status)})));

  adminRouter.delete('/kb/sources/:id', (req, res) => send(res, async () => {
    const removed = await knowledge.deleteSource(req.params.id);
    if (!removed) throw problem('Sursa nu există.', 404);
    return {removed: true};
  }));

  adminRouter.post('/kb/import-url', express.json({limit: BODY_LIMIT}), (req, res) =>
    send(res, async () => ({source: await knowledge.importUrl(bodyOf(req).url)})));

  adminRouter.post('/kb/upload', express.raw({type: '*/*', limit: UPLOAD_LIMIT}), (req, res) => send(res, async () => {
    const name = typeof req.query.name === 'string' ? req.query.name.trim() : '';
    if (!name) throw problem('Lipsește numele fișierului.', 400);
    if (!Buffer.isBuffer(req.body) || !req.body.length) throw problem('Fișierul este gol.', 400);
    return {source: await knowledge.importFile(name, req.body)};
  }));

  // Retrieval test: the same search the chat does, with the current settings.
  adminRouter.post('/kb/search', express.json({limit: BODY_LIMIT}), (req, res) => send(res, async () => {
    const {settings} = await store.config();
    return knowledge.search(bodyOf(req).q, {topK: settings.topK, minScore: settings.minScore});
  }));

  adminRouter.post('/test-chat', express.json({limit: BODY_LIMIT}), (req, res) =>
    send(res, async () => ({reply: await chat.answer({message: bodyOf(req).message, sessionId: 'admin-test', ip: 'admin'})})));

  // ----------------------------------------------------------------- conversations
  adminRouter.get('/conversations', (req, res) => send(res, async () => store.listConversations(req.query)));

  adminRouter.get('/conversations/:id', (req, res) => send(res, async () => {
    const conversation = await store.getConversation(req.params.id);
    if (!conversation) throw problem('Conversația nu există.', 404);
    return {conversation};
  }));

  adminRouter.delete('/conversations/:id', (req, res) => send(res, async () => {
    const removed = await store.deleteConversation(req.params.id);
    if (!removed) throw problem('Conversația nu există.', 404);
    return {removed: true};
  }));

  // -------------------------------------------------------------------- analytics
  adminRouter.get('/analytics', (req, res) => send(res, async () => {
    const daysRaw = Number.parseInt(String(req.query.days ?? ''), 10);
    const days = Number.isInteger(daysRaw) ? Math.min(Math.max(daysRaw, 1), MAX_DAYS) : 30;
    const now = Date.now();
    const from = new Date(now - days * DAY_MS).toISOString();
    const to = new Date(now).toISOString();
    // The total comes from the paged query; the messages from the conversations themselves,
    // capped so one huge history cannot make the page hang.
    const [{total}, conversations, usage] = await Promise.all([
      store.listConversations({from, to, limit: 1}),
      store.conversationsBetween(from, to, ANALYTICS_MAX),
      store.usageSummary(days),
    ]);
    const stats = analyticsOf(conversations);
    const totals = usage?.totals ?? {};
    return {
      days,
      conversations: total,
      messages: stats.messages,
      avgLatencyMs: stats.avgLatencyMs,
      byStatus: stats.byStatus,
      insufficient: stats.insufficient,
      apiErrors: stats.apiErrors,
      tokens: {input: safeNumber(totals.input), output: safeNumber(totals.output)},
      // What the provider reported and what we estimated stay apart: one is a bill, one is a guess.
      cost: {reported: safeNumber(totals.costReported), estimated: safeNumber(totals.costEstimated)},
      byProvider: stats.byProvider,
      byModel: stats.byModel,
      topQuestions: stats.topQuestions,
      negativeFeedback: stats.negativeFeedback,
      leads: stats.leads,
      ratings: stats.ratings,
    };
  }));

  return {publicRouter, adminRouter, onContentChange, store, knowledge, chat};
}
