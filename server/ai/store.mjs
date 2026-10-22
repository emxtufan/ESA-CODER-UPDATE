// AI store: the only place where the assistant keeps state on disk (providers,
// settings, limits, conversations, usage). Every write goes through one promise
// queue and lands atomically, so two admin requests can never interleave.
import {randomUUID} from 'node:crypto';
import {mkdir} from 'node:fs/promises';
import path from 'node:path';
import {atomic, problem, readJSON} from '../gdpr-storage.mjs';
import {decryptSecret, encryptSecret, maskSecret} from './security.mjs';
import {TYPES} from './providers.mjs';

export const DEFAULT_SETTINGS = {
  enabled: false,
  language: 'ro',
  tone: 'prietenos și profesionist',
  welcome: 'Salut! Te pot ajuta cu informații despre serviciile ESA Coder Solutions.',
  noInfo: 'Momentan nu am această informație confirmată. Te pot direcționa către echipa noastră pentru mai multe detalii.',
  contactUrl: '/contact',
  maxAnswerChars: 1200,
  style: '',
  citations: 'always',
  suggestions: ['Ce servicii oferiți?', 'Cum vă pot contacta?'],
  topK: 6,
  minScore: 0.3,
  retentionDays: 30,
  leadAfter: 2,
  leadRequired: true,
  leadPrompt: 'Ca să putem continua și să te contactăm dacă e nevoie, lasă-ne adresa ta de email.',
  ratingPrompt: 'Cum a fost conversația?',
  teaserDelay: 5,
};

export const DEFAULT_LIMITS = {
  maxMessageChars: 800,
  perSessionPerDay: 40,
  perIpPerMinute: 6,
  perIpPerDay: 120,
  globalPerDay: 2000,
  monthlyBudget: 20,
};

const SETTINGS_RULES = {
  enabled: {kind: 'bool'},
  language: {kind: 'string'},
  tone: {kind: 'string'},
  welcome: {kind: 'string'},
  noInfo: {kind: 'string'},
  contactUrl: {kind: 'string'},
  style: {kind: 'string'},
  citations: {kind: 'string'},
  suggestions: {kind: 'suggestions'},
  maxAnswerChars: {kind: 'number', min: 200, max: 4000},
  topK: {kind: 'number', min: 1, max: 12},
  minScore: {kind: 'number', min: 0, max: 1},
  retentionDays: {kind: 'number', min: 1, max: 365},
  leadAfter: {kind: 'int', min: 0, max: 20},
  leadRequired: {kind: 'bool'},
  leadPrompt: {kind: 'string'},
  ratingPrompt: {kind: 'string'},
  teaserDelay: {kind: 'int', min: 0, max: 120},
};

const INT_LIMITS = new Set(['maxMessageChars', 'perSessionPerDay', 'perIpPerMinute', 'perIpPerDay', 'globalPerDay']);

const ROLES = new Set(['chat', 'embedding']);
const MESSAGE_STATUSES = new Set(['answered', 'refused', 'error', 'limited']);
const FEEDBACK = new Set(['up', 'down']);
const RATING_VALUES = new Set(['good', 'ok', 'bad']);
// A lead is only an address: one @, a dotted domain, no whitespace, at most 254 characters.
const LEAD_EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/;
const EMAIL_MAX = 254;
const ACTIVE_KEYS = ['activeChat', 'fallbackChat', 'activeEmbedding'];
// Auth and routing headers are set by providers.mjs, never by the operator.
const FORBIDDEN_HEADERS = new Set(['authorization', 'x-api-key', 'x-goog-api-key', 'cookie', 'host']);
const HEADER_NAME = /^[a-z0-9-]{1,40}$/i;
const MAX_HEADERS = 10;
const MAX_MESSAGES = 200;
const MAX_CONVERSATIONS = 5000;
const DEFAULT_TIMEOUT_MS = 30_000;
// Reasoning models spend part of the budget before the JSON; a cut-off JSON is refused.
const DEFAULT_MAX_TOKENS = 3000;
const TEXT_MAX = 2000;
const SUGGESTIONS_MAX = 6;
const SUGGESTION_MAX = 120;
const DAY_MS = 86_400_000;

const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const text = (value, max = 500) => (typeof value === 'string' ? value.trim().slice(0, max) : '');
const isoNow = () => new Date().toISOString();
const dayKey = (date = new Date()) => date.toISOString().slice(0, 10);
const nonNegative = (value) => (typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : 0);
// Admin forms post numbers as strings; anything else must already be a number.
const toNumber = (value) => (typeof value === 'string' && value.trim() !== '' ? Number(value) : value);

function cleanBaseUrl(value, label) {
  const raw = typeof value === 'string' ? value.trim() : '';
  if (!raw) return '';
  if (raw.length > 300) throw problem(`${label}: adresa este prea lungă (maxim 300 de caractere).`);
  let url;
  try { url = new URL(raw); }
  catch { throw problem(`${label}: adresa nu este un URL valid.`); }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') throw problem(`${label}: adresa trebuie să fie http sau https.`);
  return raw;
}

function cleanHeaders(value, label) {
  if (value === undefined || value === null) return {};
  if (!isObject(value)) throw problem(`${label}: headerele trebuie să fie un obiect.`);
  const entries = Object.entries(value);
  if (entries.length > MAX_HEADERS) throw problem(`${label}: maximum ${MAX_HEADERS} headere.`);
  const out = {};
  for (const [name, raw] of entries) {
    if (!HEADER_NAME.test(name)) throw problem(`${label}: nume de header invalid.`);
    if (FORBIDDEN_HEADERS.has(name.toLowerCase())) throw problem(`${label}: headerul ${name} este setat automat și nu poate fi suprascris.`);
    if (typeof raw !== 'string' || raw.length > 300) throw problem(`${label}: valoarea headerului ${name} este invalidă.`);
    out[name] = raw;
  }
  return out;
}

function cleanCost(value, label) {
  if (value === undefined || value === null || value === '') return null;
  if (!isObject(value)) throw problem(`${label}: costul trebuie să fie un obiect sau null.`);
  const input = toNumber(value.inputPer1M);
  const output = toNumber(value.outputPer1M);
  if (typeof input !== 'number' || !Number.isFinite(input) || input < 0) throw problem(`${label}: costul de input trebuie să fie un număr ≥0.`);
  if (typeof output !== 'number' || !Number.isFinite(output) || output < 0) throw problem(`${label}: costul de output trebuie să fie un număr ≥0.`);
  return {inputPer1M: input, outputPer1M: output};
}

function integerIn(value, min, max, label, fallback) {
  const raw = toNumber(value);
  if (raw === undefined || raw === null || raw === '') return fallback;
  if (typeof raw !== 'number' || !Number.isInteger(raw) || raw < min || raw > max) {
    throw problem(`${label} trebuie să fie un întreg între ${min} și ${max}.`);
  }
  return raw;
}

// Custom gateway/local model settings are validated from the admin form.
function cleanProvider(input, prev = null) {
  const data = isObject(input) ? input : {};
  const type = text(data.type, 40);
  if (!Object.hasOwn(TYPES, type)) throw problem('Tip de provider necunoscut.');
  const label = text(data.name, 80) || 'Provider';
  const name = typeof data.name === 'string' ? data.name.trim() : '';
  if (!name || name.length > 80) throw problem('Numele trebuie să aibă între 1 și 80 de caractere.');
  const role = text(data.role, 20);
  if (!ROLES.has(role)) throw problem('Rolul trebuie să fie chat sau embedding.');
  const model = typeof data.model === 'string' ? data.model.trim() : '';
  if (!model || model.length > 200 || /\s/.test(model)) throw problem('Modelul trebuie să aibă între 1 și 200 de caractere, fără spații.');
  const baseUrl = data.baseUrl === undefined ? (prev?.baseUrl ?? '') : cleanBaseUrl(data.baseUrl, label);
  const enabled = data.enabled === undefined ? (prev?.enabled ?? true) : data.enabled === true;
  const timeoutMs = integerIn(data.timeoutMs, 1000, 120_000, 'Timeout-ul', prev?.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  const maxTokens = integerIn(data.maxTokens, 16, 8000, 'Numărul maxim de tokeni', prev?.maxTokens ?? DEFAULT_MAX_TOKENS);
  let temperature = null;
  if (data.temperature !== undefined && data.temperature !== null && data.temperature !== '') {
    const value = toNumber(data.temperature);
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 2) {
      throw problem('Temperatura trebuie să fie între 0 și 2 sau null.');
    }
    temperature = value;
  }
  const jsonMode = data.jsonMode === undefined ? (prev?.jsonMode ?? true) : data.jsonMode === true;
  const tokenParam = data.tokenParam === undefined ? (prev?.tokenParam ?? '') : text(data.tokenParam, 40);
  let priority = prev?.priority ?? 0;
  if (data.priority !== undefined && data.priority !== null && data.priority !== '') {
    const value = toNumber(data.priority);
    if (typeof value !== 'number' || !Number.isInteger(value)) throw problem('Prioritatea trebuie să fie un număr întreg.');
    priority = value;
  }
  const cost = cleanCost(data.cost === undefined ? prev?.cost ?? null : data.cost, label);
  const allowPrivate = data.allowPrivate === true;
  if (allowPrivate && type !== 'ollama' && type !== 'openai-compatible') {
    throw problem('Accesul la adrese private este permis doar pentru Ollama sau un endpoint compatibil OpenAI.');
  }
  return {
    id: prev?.id ?? randomUUID(),
    name,
    type,
    role,
    baseUrl,
    model,
    enabled,
    timeoutMs,
    maxTokens,
    temperature,
    jsonMode,
    tokenParam,
    headers: data.headers === undefined ? (prev?.headers ?? {}) : cleanHeaders(data.headers, label),
    priority,
    cost,
    allowPrivate,
    keyBlob: prev?.keyBlob ?? '',
    keyMask: prev?.keyMask ?? '',
    updatedAt: isoNow(),
  };
}

function publicProvider(record) {
  const {keyBlob, ...rest} = record;
  return {...rest, keyMask: typeof rest.keyMask === 'string' ? rest.keyMask : '', hasKey: !!keyBlob};
}

function validateSetting(key, value) {
  const rule = SETTINGS_RULES[key];
  if (rule.kind === 'bool') {
    if (typeof value !== 'boolean') throw problem(`${key} trebuie să fie true sau false.`);
    return value;
  }
  if (rule.kind === 'string') {
    if (typeof value !== 'string' || value.length > TEXT_MAX) throw problem(`${key} trebuie să fie un text de maximum ${TEXT_MAX} caractere.`);
    return value.trim();
  }
  if (rule.kind === 'suggestions') {
    const ok = Array.isArray(value) && value.length <= SUGGESTIONS_MAX
      && value.every((item) => typeof item === 'string' && item.length <= SUGGESTION_MAX);
    if (!ok) throw problem(`suggestions acceptă maximum ${SUGGESTIONS_MAX} sugestii de maximum ${SUGGESTION_MAX} caractere.`);
    return value.map((item) => item.trim()).filter(Boolean);
  }
  const number = toNumber(value);
  if (rule.kind === 'int') {
    if (typeof number !== 'number' || !Number.isInteger(number) || number < rule.min || number > rule.max) {
      throw problem(`${key} trebuie să fie un întreg între ${rule.min} și ${rule.max}.`);
    }
    return number;
  }
  if (typeof number !== 'number' || !Number.isFinite(number) || number < rule.min || number > rule.max) {
    throw problem(`${key} trebuie să fie un număr între ${rule.min} și ${rule.max}.`);
  }
  return number;
}

function validateLimit(key, value) {
  const number = toNumber(value);
  if (typeof number !== 'number' || !Number.isFinite(number) || number < 0) throw problem(`${key} trebuie să fie un număr ≥0.`);
  if (INT_LIMITS.has(key) && !Number.isInteger(number)) throw problem(`${key} trebuie să fie un întreg.`);
  return number;
}

// Only the whitelisted fields land on disk: an IP or a user agent can never be stored.
function normalizeMessage(input) {
  const msg = isObject(input) ? input : {};
  const usage = isObject(msg.usage) ? msg.usage : {};
  const citations = Array.isArray(msg.citations)
    ? msg.citations.slice(0, 20).map((item) => ({
      sourceId: text(item?.sourceId, 200),
      title: text(item?.title, 300),
      url: text(item?.url, 500),
    }))
    : [];
  return {
    id: randomUUID(),
    role: msg.role === 'assistant' ? 'assistant' : 'user',
    text: typeof msg.text === 'string' ? msg.text : '',
    at: isoNow(),
    status: MESSAGE_STATUSES.has(msg.status) ? msg.status : 'answered',
    provider: text(msg.provider, 80),
    model: text(msg.model, 200),
    latencyMs: nonNegative(msg.latencyMs),
    usage: {input: nonNegative(usage.input), output: nonNegative(usage.output)},
    costReported: typeof msg.costReported === 'number' && Number.isFinite(msg.costReported) ? msg.costReported : null,
    costEstimated: typeof msg.costEstimated === 'number' && Number.isFinite(msg.costEstimated) ? msg.costEstimated : null,
    citations,
    feedback: null,
    reason: text(msg.reason, 300),
    rewritten: msg.rewritten === true,
  };
}

function addTally(map, key, {input, output, cost}) {
  const tally = map[key] ?? {};
  map[key] = {
    requests: nonNegative(tally.requests) + 1,
    input: nonNegative(tally.input) + input,
    output: nonNegative(tally.output) + output,
    cost: nonNegative(tally.cost) + cost,
  };
}

const dayCost = (bucket) => {
  const reported = nonNegative(bucket?.costReported);
  return reported > 0 ? reported : nonNegative(bucket?.costEstimated);
};

export async function createStore(dir) {
  const root = path.resolve(dir);
  await mkdir(root, {recursive: true, mode: 0o700});
  const configFile = path.join(root, 'config.json');
  const conversationsFile = path.join(root, 'conversations.json');
  const usageFile = path.join(root, 'usage.json');

  // One queue for every write: reads always see a complete file, writes never race.
  let queue = Promise.resolve();
  const serial = (change) => {
    const run = queue.then(change);
    queue = run.catch(() => {});
    return run;
  };

  const emptyConfig = () => ({
    providers: [],
    activeChat: null,
    fallbackChat: null,
    activeEmbedding: null,
    settings: structuredClone(DEFAULT_SETTINGS),
    limits: {...DEFAULT_LIMITS},
  });

  const settingsOf = (value) => {
    const settings = structuredClone(DEFAULT_SETTINGS);
    if (!isObject(value)) return settings;
    for (const key of Object.keys(DEFAULT_SETTINGS)) {
      const item = value[key];
      if (Array.isArray(settings[key])) {
        if (Array.isArray(item)) settings[key] = item.filter((entry) => typeof entry === 'string').slice(0, SUGGESTIONS_MAX);
      } else if (typeof item === typeof settings[key]) {
        settings[key] = item;
      }
    }
    return settings;
  };

  const limitsOf = (value) => {
    const limits = {...DEFAULT_LIMITS};
    if (!isObject(value)) return limits;
    for (const key of Object.keys(DEFAULT_LIMITS)) {
      const item = value[key];
      if (typeof item === 'number' && Number.isFinite(item) && item >= 0) limits[key] = item;
    }
    return limits;
  };

  const idOrNull = (value) => (typeof value === 'string' && value ? value : null);

  async function loadConfig() {
    const saved = await readJSON(configFile, null);
    if (!isObject(saved)) return emptyConfig();
    return {
      providers: Array.isArray(saved.providers) ? saved.providers.filter(isObject) : [],
      activeChat: idOrNull(saved.activeChat),
      fallbackChat: idOrNull(saved.fallbackChat),
      activeEmbedding: idOrNull(saved.activeEmbedding),
      settings: settingsOf(saved.settings),
      limits: limitsOf(saved.limits),
    };
  }

  const publicConfig = (data) => ({
    providers: data.providers.map(publicProvider),
    activeChat: data.activeChat,
    fallbackChat: data.fallbackChat,
    activeEmbedding: data.activeEmbedding,
    settings: structuredClone(data.settings),
    limits: {...data.limits},
  });

  // ---------------------------------------------------------------- conversations

  async function loadConversations() {
    const saved = await readJSON(conversationsFile, null);
    return {conversations: Array.isArray(saved?.conversations) ? saved.conversations.filter(isObject) : []};
  }

  // Retention is applied on every write and once at startup.
  function purgeData(data, settings) {
    const days = Number.isInteger(settings?.retentionDays) ? settings.retentionDays : DEFAULT_SETTINGS.retentionDays;
    const cutoff = Date.now() - days * DAY_MS;
    const before = data.conversations.length;
    data.conversations = data.conversations.filter((conversation) => {
      const time = Date.parse(conversation.updatedAt ?? conversation.startedAt ?? '');
      return !Number.isFinite(time) || time >= cutoff;
    });
    return before - data.conversations.length;
  }

  function trimConversations(data) {
    if (data.conversations.length <= MAX_CONVERSATIONS) return;
    data.conversations.sort((a, b) => String(a.updatedAt ?? '').localeCompare(String(b.updatedAt ?? '')));
    data.conversations = data.conversations.slice(-MAX_CONVERSATIONS);
  }

  function dateBound(value, end) {
    if (value === undefined || value === null || value === '') return null;
    const raw = String(value).trim();
    const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(raw);
    const time = Date.parse(dateOnly ? `${raw}T00:00:00.000Z` : raw);
    if (!Number.isFinite(time)) return null;
    return end && dateOnly ? time + DAY_MS - 1 : time;
  }

  // ------------------------------------------------------------------------ usage

  async function loadUsage() {
    const saved = await readJSON(usageFile, null);
    return {days: isObject(saved?.days) ? saved.days : {}};
  }

  // --------------------------------------------------------------------- startup

  await serial(async () => {
    const data = await loadConversations();
    const {settings} = await loadConfig();
    if (purgeData(data, settings)) await atomic(conversationsFile, data);
  });

  return {
    // ------------------------------------------------------------------ providers
    config() {
      return loadConfig().then((data) => structuredClone(data));
    },

    async publicConfig() {
      return publicConfig(await loadConfig());
    },

    saveProvider(input, id) {
      return serial(async () => {
        const data = await loadConfig();
        const prev = id ? data.providers.find((item) => item.id === id) ?? null : null;
        if (id && !prev) throw problem('Providerul nu există.', 404);
        const record = cleanProvider(input, prev);
        const apiKey = isObject(input) ? input.apiKey : undefined;
        if (typeof apiKey === 'string' && apiKey.trim()) {
          const key = apiKey.trim();
          record.keyBlob = encryptSecret(key, 'provider:' + record.id);
          record.keyMask = maskSecret(key);
        } else if (apiKey === null) {
          record.keyBlob = '';
          record.keyMask = '';
        }
        if (prev) data.providers[data.providers.indexOf(prev)] = record;
        else data.providers.push(record);
        await atomic(configFile, data);
        return publicProvider(record);
      });
    },

    deleteProvider(id) {
      return serial(async () => {
        const data = await loadConfig();
        const index = data.providers.findIndex((item) => item.id === id);
        if (index < 0) return false;
        data.providers.splice(index, 1);
        for (const key of ACTIVE_KEYS) if (data[key] === id) data[key] = null;
        await atomic(configFile, data);
        return true;
      });
    },

    setActive(patch) {
      return serial(async () => {
        const data = await loadConfig();
        const input = isObject(patch) ? patch : {};
        const pick = (key) => (key in input ? (input[key] === null || input[key] === '' ? null : input[key]) : data[key]);
        const find = (id, role) => {
          const found = data.providers.find((item) => item.id === id);
          if (!found) throw problem('Providerul selectat nu există.');
          if (found.role !== role) throw problem(role === 'chat' ? 'Providerul selectat nu este pentru chat.' : 'Providerul selectat nu este pentru embeddings.');
          return id;
        };
        const activeChat = pick('activeChat');
        const fallbackChat = pick('fallbackChat');
        const activeEmbedding = pick('activeEmbedding');
        if (activeChat) find(activeChat, 'chat');
        if (fallbackChat) find(fallbackChat, 'chat');
        if (activeEmbedding) find(activeEmbedding, 'embedding');
        if (activeChat && fallbackChat === activeChat) throw problem('Providerul de rezervă trebuie să fie diferit de cel activ.');
        data.activeChat = activeChat;
        data.fallbackChat = fallbackChat;
        data.activeEmbedding = activeEmbedding;
        await atomic(configFile, data);
        return {activeChat, fallbackChat, activeEmbedding};
      });
    },

    async providerWithKey(id) {
      const data = await loadConfig();
      const cfg = data.providers.find((item) => item.id === id);
      if (!cfg || !cfg.enabled) return null;
      const key = cfg.keyBlob ? decryptSecret(cfg.keyBlob, 'provider:' + cfg.id) : '';
      return {cfg: structuredClone(cfg), key};
    },

    // ------------------------------------------------------------------- settings
    saveSettings(partial) {
      return serial(async () => {
        const data = await loadConfig();
        const next = settingsOf(data.settings);
        for (const [key, value] of Object.entries(isObject(partial) ? partial : {})) {
          if (!(key in SETTINGS_RULES)) continue;
          next[key] = validateSetting(key, value);
        }
        data.settings = next;
        await atomic(configFile, data);
        return structuredClone(next);
      });
    },

    saveLimits(partial) {
      return serial(async () => {
        const data = await loadConfig();
        const next = limitsOf(data.limits);
        for (const [key, value] of Object.entries(isObject(partial) ? partial : {})) {
          if (!(key in DEFAULT_LIMITS)) continue;
          next[key] = validateLimit(key, value);
        }
        data.limits = next;
        await atomic(configFile, data);
        return {...next};
      });
    },

    // -------------------------------------------------------------- conversations
    addMessages(conversationId, msgs) {
      return serial(async () => {
        const data = await loadConversations();
        const {settings} = await loadConfig();
        purgeData(data, settings);
        const incoming = (Array.isArray(msgs) ? msgs : []).map(normalizeMessage);
        const wanted = idOrNull(conversationId);
        if (!incoming.length) return {conversationId: wanted, messageIds: []};
        const now = isoNow();
        let conversation = wanted ? data.conversations.find((item) => item.id === wanted) : null;
        if (!conversation) {
          conversation = {id: wanted ?? randomUUID(), startedAt: now, updatedAt: now, messages: []};
          data.conversations.push(conversation);
        }
        if (!Array.isArray(conversation.messages)) conversation.messages = [];
        conversation.messages.push(...incoming);
        if (conversation.messages.length > MAX_MESSAGES) conversation.messages = conversation.messages.slice(-MAX_MESSAGES);
        conversation.updatedAt = now;
        trimConversations(data);
        await atomic(conversationsFile, data);
        // The ids of the messages just written, in order: the caller needs the last one.
        return {conversationId: conversation.id, messageIds: incoming.map((message) => message.id)};
      });
    },

    setFeedback(conversationId, messageId, value) {
      const next = value === undefined ? null : value;
      if (next !== null && !FEEDBACK.has(next)) return Promise.resolve(false);
      return serial(async () => {
        const data = await loadConversations();
        const conversation = data.conversations.find((item) => item.id === conversationId);
        const message = Array.isArray(conversation?.messages)
          ? conversation.messages.find((item) => item.id === messageId)
          : null;
        if (!message) return false;
        message.feedback = next;
        await atomic(conversationsFile, data);
        return true;
      });
    },

    setRating(conversationId, value) {
      const next = value === undefined ? null : value;
      if (next !== null && !RATING_VALUES.has(next)) return Promise.resolve(false);
      return serial(async () => {
        const data = await loadConversations();
        const conversation = data.conversations.find((item) => item.id === conversationId);
        if (!conversation) return false;
        if (next === null) delete conversation.rating;
        else conversation.rating = {value: next, at: isoNow()};
        await atomic(conversationsFile, data);
        return true;
      });
    },

    // The lead is an address captured with consent: checked, lowercased, stored once.
    setLead(conversationId, email) {
      const value = typeof email === 'string' ? email.trim().toLowerCase() : '';
      if (value.length > EMAIL_MAX || !LEAD_EMAIL_RE.test(value)) throw problem('Adresa de email nu este validă.', 422);
      return serial(async () => {
        const data = await loadConversations();
        const conversation = data.conversations.find((item) => item.id === conversationId);
        if (!conversation) throw problem('Conversația nu există.', 404);
        conversation.lead = {email: value, at: isoNow()};
        await atomic(conversationsFile, data);
        return true;
      });
    },

    // What the chat needs to decide: the stored address and the number of user turns.
    async leadOf(conversationId) {
      const data = await loadConversations();
      const conversation = data.conversations.find((item) => item.id === conversationId);
      const email = conversation?.lead?.email;
      return typeof email === 'string' && email ? email : null;
    },

    async userCount(conversationId) {
      const data = await loadConversations();
      const conversation = data.conversations.find((item) => item.id === conversationId);
      const messages = Array.isArray(conversation?.messages) ? conversation.messages : [];
      return messages.filter((message) => message.role === 'user').length;
    },

    async listConversations(query) {
      const params = isObject(query) ? query : {};
      const data = await loadConversations();
      const from = dateBound(params.from, false);
      const to = dateBound(params.to, true);
      const q = text(params.q, 200).toLowerCase();
      const status = text(params.status, 20);
      const limitRaw = toNumber(params.limit);
      const offsetRaw = toNumber(params.offset);
      const limit = Math.min(Math.max(Number.isInteger(limitRaw) ? limitRaw : 50, 1), 200);
      const offset = Math.max(Number.isInteger(offsetRaw) ? offsetRaw : 0, 0);
      const items = [];
      for (const conversation of data.conversations) {
        const messages = Array.isArray(conversation.messages) ? conversation.messages : [];
        const started = Date.parse(conversation.startedAt ?? conversation.updatedAt ?? '');
        if (from !== null && !(started >= from)) continue;
        if (to !== null && !(started <= to)) continue;
        if (q && !String(conversation.id ?? '').toLowerCase().includes(q)
          && !String(conversation.lead?.email ?? '').toLowerCase().includes(q)
          && !messages.some((message) => String(message.text ?? '').toLowerCase().includes(q))) continue;
        if (status && !messages.some((message) => message.status === status)) continue;
        const first = messages.find((message) => message.role === 'user');
        items.push({
          id: conversation.id,
          startedAt: conversation.startedAt ?? null,
          updatedAt: conversation.updatedAt ?? null,
          count: messages.length,
          first: String(first?.text ?? '').slice(0, 120),
          email: conversation.lead?.email ?? null,
          rating: conversation.rating?.value ?? null,
          flags: {
            refused: messages.some((message) => message.status === 'refused'),
            down: messages.some((message) => message.feedback === 'down'),
            error: messages.some((message) => message.status === 'error'),
          },
        });
      }
      items.sort((a, b) => String(b.updatedAt ?? '').localeCompare(String(a.updatedAt ?? '')));
      return {total: items.length, items: items.slice(offset, offset + limit)};
    },

    async getConversation(id) {
      const data = await loadConversations();
      const conversation = data.conversations.find((item) => item.id === id);
      if (!conversation) return null;
      const copy = structuredClone(conversation);
      return {...copy, lead: copy.lead ?? null, rating: copy.rating ?? null};
    },

    // Whole conversations (not the list projection) inside a date range, newest first:
    // reporting needs the messages, and the range is filtered on startedAt like listConversations.
    async conversationsBetween(from, to, limit = 2000) {
      const data = await loadConversations();
      const start = dateBound(from, false);
      const end = dateBound(to, true);
      const raw = toNumber(limit);
      const max = Math.min(Number.isInteger(raw) && raw >= 0 ? raw : 2000, 2000);
      const items = data.conversations.filter((conversation) => {
        const started = Date.parse(conversation.startedAt ?? conversation.updatedAt ?? '');
        if (start !== null && !(started >= start)) return false;
        if (end !== null && !(started <= end)) return false;
        return true;
      });
      items.sort((a, b) => String(b.updatedAt ?? '').localeCompare(String(a.updatedAt ?? '')));
      return structuredClone(items.slice(0, max));
    },

    deleteConversation(id) {
      return serial(async () => {
        const data = await loadConversations();
        const index = data.conversations.findIndex((item) => item.id === id);
        if (index < 0) return false;
        data.conversations.splice(index, 1);
        await atomic(conversationsFile, data);
        return true;
      });
    },

    purge() {
      return serial(async () => {
        const data = await loadConversations();
        const {settings} = await loadConfig();
        const removed = purgeData(data, settings);
        if (removed) await atomic(conversationsFile, data);
        return removed;
      });
    },

    // ---------------------------------------------------------------------- usage
    record(entry) {
      const source = isObject(entry) ? entry : {};
      return serial(async () => {
        const data = await loadUsage();
        const day = dayKey();
        const saved = isObject(data.days[day]) ? data.days[day] : {};
        const usage = isObject(source.usage) ? source.usage : {};
        const input = nonNegative(usage.input);
        const output = nonNegative(usage.output);
        const costReported = nonNegative(source.costReported);
        const costEstimated = nonNegative(source.costEstimated);
        const cost = typeof source.costReported === 'number' && Number.isFinite(source.costReported) ? costReported : costEstimated;
        const bucket = {
          requests: nonNegative(saved.requests) + 1,
          input: nonNegative(saved.input) + input,
          output: nonNegative(saved.output) + output,
          costReported: nonNegative(saved.costReported) + costReported,
          costEstimated: nonNegative(saved.costEstimated) + costEstimated,
          byProvider: isObject(saved.byProvider) ? {...saved.byProvider} : {},
          byModel: isObject(saved.byModel) ? {...saved.byModel} : {},
        };
        addTally(bucket.byProvider, text(source.provider, 80) || 'unknown', {input, output, cost});
        addTally(bucket.byModel, text(source.model, 200) || 'unknown', {input, output, cost});
        data.days[day] = bucket;
        await atomic(usageFile, data);
        return structuredClone(bucket);
      });
    },

    async monthCost(date = new Date()) {
      const data = await loadUsage();
      const prefix = dayKey(date).slice(0, 7);
      let total = 0;
      for (const [day, bucket] of Object.entries(data.days)) {
        if (!day.startsWith(prefix)) continue;
        total += dayCost(bucket);
      }
      return total;
    },

    async dayRequests() {
      const data = await loadUsage();
      return nonNegative(data.days[dayKey()]?.requests);
    },

    async usageSummary(days = 30) {
      const raw = toNumber(days);
      const count = Math.min(Math.max(Number.isInteger(raw) ? raw : 30, 1), 365);
      const data = await loadUsage();
      const today = Date.parse(dayKey() + 'T00:00:00.000Z');
      const out = [];
      const totals = {requests: 0, input: 0, output: 0, costReported: 0, costEstimated: 0, cost: 0};
      for (let index = count - 1; index >= 0; index--) {
        const key = dayKey(new Date(today - index * DAY_MS));
        const bucket = data.days[key];
        const row = {
          date: key,
          requests: nonNegative(bucket?.requests),
          input: nonNegative(bucket?.input),
          output: nonNegative(bucket?.output),
          costReported: nonNegative(bucket?.costReported),
          costEstimated: nonNegative(bucket?.costEstimated),
          cost: dayCost(bucket),
        };
        totals.requests += row.requests;
        totals.input += row.input;
        totals.output += row.output;
        totals.costReported += row.costReported;
        totals.costEstimated += row.costEstimated;
        totals.cost += row.cost;
        out.push(row);
      }
      return {days: out, totals};
    },
  };
}
