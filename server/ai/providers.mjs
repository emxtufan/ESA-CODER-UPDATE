// LLM providers: one thin layer over the HTTP APIs of every supported vendor.
// The API key never leaves this module: it is only used for the auth header and
// is scrubbed out of every error message that can reach the admin UI.
import {checkUrl} from './security.mjs';

export const TYPES = {
  openai: {label: 'OpenAI', base: 'https://api.openai.com/v1', key: true},
  deepseek: {label: 'DeepSeek', base: 'https://api.deepseek.com', key: true},
  openrouter: {label: 'OpenRouter', base: 'https://openrouter.ai/api/v1', key: true},
  anthropic: {label: 'Anthropic Claude', base: 'https://api.anthropic.com/v1', key: true},
  gemini: {label: 'Google Gemini', base: 'https://generativelanguage.googleapis.com/v1beta', key: true},
  ollama: {label: 'Ollama (local)', base: 'http://127.0.0.1:11434/v1', key: false},
  'openai-compatible': {label: 'Custom OpenAI-compatible', base: '', key: true},
};

// kind: auth | rate | timeout | unavailable | bad_request | invalid_response | config
export class ProviderError extends Error {
  constructor(kind, message, status) {
    super(message);
    this.name = 'ProviderError';
    this.kind = kind;
    if (status !== undefined) this.status = status;
  }
}

export const RETRYABLE = new Set(['rate', 'timeout', 'unavailable']);

const AUTH_HEADERS = new Set(['authorization', 'x-api-key', 'x-goog-api-key']);
const ANTHROPIC_VERSION = '2023-06-01';
const DEFAULT_TIMEOUT_MS = 30_000;
const DETAIL_MAX = 160;

function labelOf(cfg) {
  return TYPES[cfg?.type]?.label ?? String(cfg?.type ?? 'Provider');
}

// Any appearance of the key inside an upstream message is masked, never echoed.
function scrub(text, key) {
  let out = String(text ?? '');
  if (key) out = out.split(key).join('••••');
  return out.slice(0, DETAIL_MAX);
}

function invalidResponse(label) {
  return new ProviderError('invalid_response', `${label}: răspuns gol sau fără text`);
}

function authHeaders(type, key) {
  if (!key) return {};
  if (type === 'anthropic') return {'x-api-key': key, 'anthropic-version': ANTHROPIC_VERSION};
  if (type === 'gemini') return {'x-goog-api-key': key};
  return {authorization: `Bearer ${key}`};
}

// Operator headers: strings only, and the auth headers cannot be overridden.
function extraHeaders(cfg) {
  const out = {};
  for (const [name, value] of Object.entries(cfg?.headers ?? {})) {
    if (typeof value !== 'string') continue;
    if (AUTH_HEADERS.has(name.toLowerCase())) continue;
    out[name] = value;
  }
  return out;
}

async function errorDetail(res, key) {
  let raw = '';
  try { raw = await res.text(); }
  catch { return ''; }
  let data;
  try { data = JSON.parse(raw); }
  catch { return ''; }
  const message = data?.error?.message;
  return typeof message === 'string' ? scrub(message, key) : '';
}

async function httpError(label, res, key) {
  const detail = await errorDetail(res, key);
  const kind = res.status === 401 || res.status === 403 ? 'auth'
    : res.status === 429 ? 'rate'
      : res.status >= 500 ? 'unavailable'
        : 'bad_request';
  const message = `${label}: HTTP ${res.status}` + (detail ? ` — ${detail}` : '');
  return new ProviderError(kind, message, res.status);
}

// One JSON request to the provider. Throws ProviderError for every failure mode.
async function request(cfg, key, path, body = null, {method = body === null ? 'GET' : 'POST', headers = {}, signal} = {}) {
  const label = labelOf(cfg);
  const base = String(cfg.baseUrl || TYPES[cfg.type]?.base || '').replace(/\/+$/, '');
  const url = base + path;
  try {
    await checkUrl(url, {allowPrivate: cfg.type === 'ollama' || cfg.allowPrivate === true});
  } catch (error) {
    throw new ProviderError('config', `${label}: ${scrub(error?.message ?? 'URL invalid', key)}`);
  }
  const timeoutMs = cfg.timeoutMs || DEFAULT_TIMEOUT_MS;
  const timeout = AbortSignal.timeout(timeoutMs);
  let res;
  try {
    res = await fetch(url, {
      method,
      headers: {'content-type': 'application/json', ...extraHeaders(cfg), ...headers, ...authHeaders(cfg.type, key)},
      body: body === null ? undefined : JSON.stringify(body),
      redirect: 'error',
      signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
    });
  } catch (error) {
    if (signal?.aborted) throw error;
    if (error?.name === 'AbortError' || error?.name === 'TimeoutError') {
      throw new ProviderError('timeout', `${label}: fără răspuns în ${timeoutMs} ms`);
    }
    throw new ProviderError('unavailable', `${label}: ${scrub(error?.message ?? 'eroare de rețea', key)}`);
  }
  if (!res.ok) throw await httpError(label, res, key);
  const raw = await res.text();
  try { return raw ? JSON.parse(raw) : {}; }
  catch { throw new ProviderError('invalid_response', `${label}: răspuns JSON invalid`, res.status); }
}

function usageOf(input, output) {
  return {input: typeof input === 'number' ? input : 0, output: typeof output === 'number' ? output : 0};
}

// openai, deepseek, openrouter, ollama and any custom OpenAI-compatible gateway.
function openaiLike(type) {
  return {
    async models(cfg, key) {
      const data = await request(cfg, key, '/models');
      return (data?.data ?? []).map((item) => item?.id).filter((id) => typeof id === 'string');
    },
    async generate(cfg, key, req) {
      const label = labelOf(cfg);
      const tokenParam = cfg.tokenParam || (type === 'openai' ? 'max_completion_tokens' : 'max_tokens');
      const body = {
        model: cfg.model,
        messages: [...(req.system ? [{role: 'system', content: req.system}] : []), ...(req.messages ?? [])],
        [tokenParam]: req.maxTokens,
      };
      if (cfg.temperature != null) body.temperature = cfg.temperature;
      if (req.json && cfg.jsonMode !== false) body.response_format = {type: 'json_object'};
      if (type === 'openrouter') body.usage = {include: true};
      const data = await request(cfg, key, '/chat/completions', body, {signal: req.signal});
      const text = data?.choices?.[0]?.message?.content;
      if (typeof text !== 'string' || !text) throw invalidResponse(label);
      const usage = data?.usage ?? {};
      return {
        text,
        usage: usageOf(usage.prompt_tokens, usage.completion_tokens),
        costReported: typeof usage.cost === 'number' ? usage.cost : null,
        truncated: data?.choices?.[0]?.finish_reason === 'length',
        model: typeof data?.model === 'string' && data.model ? data.model : cfg.model,
      };
    },
    async embed(cfg, key, texts, signal) {
      const data = await request(cfg, key, '/embeddings', {model: cfg.model, input: texts}, {signal});
      const rows = [...(data?.data ?? [])].sort((a, b) => (a?.index ?? 0) - (b?.index ?? 0));
      const vectors = rows.map((row) => row?.embedding);
      if (vectors.length !== texts.length || vectors.some((vector) => !Array.isArray(vector))) {
        throw invalidResponse(labelOf(cfg));
      }
      return vectors;
    },
  };
}

const anthropic = {
  async models(cfg, key) {
    const data = await request(cfg, key, '/models');
    return (data?.data ?? []).map((item) => item?.id).filter((id) => typeof id === 'string');
  },
  async generate(cfg, key, req) {
    const body = {
      model: cfg.model,
      system: req.system,
      messages: req.messages ?? [],
      max_tokens: req.maxTokens,
    };
    if (cfg.temperature != null) body.temperature = cfg.temperature;
    const data = await request(cfg, key, '/messages', body, {signal: req.signal});
    const text = (data?.content ?? [])
      .filter((part) => part?.type === 'text')
      .map((part) => String(part?.text ?? ''))
      .join('');
    if (!text) throw invalidResponse(labelOf(cfg));
    const usage = data?.usage ?? {};
    return {
      text,
      usage: usageOf(usage.input_tokens, usage.output_tokens),
      costReported: null,
      truncated: data?.stop_reason === 'max_tokens',
      model: typeof data?.model === 'string' && data.model ? data.model : cfg.model,
    };
  },
};

const gemini = {
  async models(cfg, key) {
    const data = await request(cfg, key, '/models?pageSize=1000');
    return (data?.models ?? [])
      .map((item) => String(item?.name ?? '').replace(/^models\//, ''))
      .filter(Boolean);
  },
  async generate(cfg, key, req) {
    const generationConfig = {maxOutputTokens: req.maxTokens};
    if (cfg.temperature != null) generationConfig.temperature = cfg.temperature;
    if (req.json) generationConfig.responseMimeType = 'application/json';
    const body = {
      contents: (req.messages ?? []).map((message) => ({
        role: message?.role === 'assistant' ? 'model' : 'user',
        parts: [{text: message?.content}],
      })),
      generationConfig,
    };
    if (req.system) body.systemInstruction = {parts: [{text: req.system}]};
    const path = `/models/${encodeURIComponent(cfg.model)}:generateContent`;
    const data = await request(cfg, key, path, body, {signal: req.signal});
    const text = (data?.candidates?.[0]?.content?.parts ?? [])
      .map((part) => String(part?.text ?? ''))
      .join('');
    if (!text) throw invalidResponse(labelOf(cfg));
    const usage = data?.usageMetadata ?? {};
    return {
      text,
      usage: usageOf(usage.promptTokenCount, usage.candidatesTokenCount),
      costReported: null,
      truncated: data?.candidates?.[0]?.finishReason === 'MAX_TOKENS',
      model: cfg.model,
    };
  },
  async embed(cfg, key, texts, signal) {
    const path = `/models/${encodeURIComponent(cfg.model)}:batchEmbedContents`;
    const body = {
      requests: texts.map((text) => ({model: 'models/' + cfg.model, content: {parts: [{text}]}})),
    };
    const data = await request(cfg, key, path, body, {signal});
    const vectors = (data?.embeddings ?? []).map((item) => item?.values);
    if (vectors.length !== texts.length || vectors.some((vector) => !Array.isArray(vector))) {
      throw invalidResponse(labelOf(cfg));
    }
    return vectors;
  },
};

export const ADAPTERS = {
  openai: openaiLike('openai'),
  deepseek: openaiLike('deepseek'),
  openrouter: openaiLike('openrouter'),
  ollama: openaiLike('ollama'),
  'openai-compatible': openaiLike('openai-compatible'),
  anthropic,
  gemini,
};

// Extension point (also how tests plug a mock in).
export function registerAdapter(type, adapter) {
  ADAPTERS[type] = adapter;
  if (!TYPES[type]) TYPES[type] = {label: type, base: '', key: false};
  return adapter;
}

export function provider(cfg, key) {
  const type = cfg?.type;
  const adapter = type ? ADAPTERS[type] : undefined;
  if (!adapter) throw new ProviderError('config', `Tip de provider necunoscut: ${type || '(lipsă)'}`);
  const apiKey = key ?? '';
  const capabilities = {
    models: typeof adapter.models === 'function',
    embeddings: typeof adapter.embed === 'function',
    json: cfg.jsonMode !== false,
  };

  return {
    async testConnection() {
      const started = Date.now();
      try {
        const result = await adapter.generate(cfg, apiKey, {
          messages: [{role: 'user', content: 'ping'}],
          // reasoning models spend the first tokens thinking; 8 returns empty text
          maxTokens: 256,
        });
        return {ok: true, latencyMs: Date.now() - started, model: result?.model || cfg.model};
      } catch (error) {
        if (!(error instanceof ProviderError)) throw error;
        return {ok: false, latencyMs: Date.now() - started, model: cfg.model, error: error.message};
      }
    },

    async listModels() {
      if (typeof adapter.models !== 'function') return [];
      const list = await adapter.models(cfg, apiKey);
      return [...new Set((list ?? []).filter((id) => typeof id === 'string' && id))].sort();
    },

    generate(req) {
      return adapter.generate(cfg, apiKey, req ?? {});
    },

    async embed(texts, signal) {
      if (typeof adapter.embed !== 'function') {
        throw new ProviderError('config', 'Providerul nu suportă embeddings');
      }
      return adapter.embed(cfg, apiKey, texts, signal);
    },

    capabilities,
  };
}

export function estimateCost(cfg, usage) {
  const cost = cfg?.cost;
  if (typeof cost?.inputPer1M !== 'number' || typeof cost?.outputPer1M !== 'number') return null;
  const input = typeof usage?.input === 'number' ? usage.input : 0;
  const output = typeof usage?.output === 'number' ? usage.output : 0;
  return (input * cost.inputPer1M + output * cost.outputPer1M) / 1e6;
}
