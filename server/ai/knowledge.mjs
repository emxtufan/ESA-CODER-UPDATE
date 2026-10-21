// Knowledge base: every document the assistant may answer from, cut into chunks and
// (optionally) embedded. The whole index lives in one kb.json, written atomically through
// a single promise queue, so a sync, an import and a manual edit can never interleave.
import {randomUUID} from 'node:crypto';
import {mkdir} from 'node:fs/promises';
import path from 'node:path';
import {atomic, problem, readJSON} from '../gdpr-storage.mjs';
import {chunkText, hashOf, htmlToText, siteDocuments, titleOf, tokenize} from './extract.mjs';
import {provider} from './providers.mjs';
import {fetchPublic} from './security.mjs';

const STATUSES = new Set(['approved', 'draft']);
const TITLE_MAX = 200;
const TEXT_MAX = 200_000;
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const EMBED_BATCH = 32;
const MAX_ERRORS = 50;
const MAX_PER_SOURCE = 2;
const K1 = 1.2;
const B = 0.75;

const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const isoNow = () => new Date().toISOString();
const count = (value) => (Array.isArray(value) ? value.length : 0);

// Cosine of two vectors; a missing, empty or mismatched pair scores 0, never NaN.
function cosine(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || !a.length || a.length !== b.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let index = 0; index < a.length; index++) {
    const x = Number(a[index]) || 0;
    const y = Number(b[index]) || 0;
    dot += x * y;
    normA += x * x;
    normB += y * y;
  }
  if (!normA || !normB) return 0;
  return dot / Math.sqrt(normA * normB);
}

export async function createKnowledge({dir, store}) {
  const root = path.resolve(dir);
  await mkdir(root, {recursive: true, mode: 0o700});
  const kbFile = path.join(root, 'kb.json');

  // One queue for every write: reads always see a complete file, writes never race.
  let queue = Promise.resolve();
  const serial = (change) => {
    const run = queue.then(change);
    queue = run.catch(() => {});
    return run;
  };

  const emptyKb = () => ({sources: [], chunks: [], embedKey: null, lastSync: null, errors: []});

  async function loadKb() {
    const saved = await readJSON(kbFile, null);
    if (!isObject(saved)) return emptyKb();
    return {
      sources: Array.isArray(saved.sources) ? saved.sources.filter(isObject) : [],
      chunks: Array.isArray(saved.chunks) ? saved.chunks.filter(isObject) : [],
      embedKey: typeof saved.embedKey === 'string' && saved.embedKey ? saved.embedKey : null,
      lastSync: typeof saved.lastSync === 'string' && saved.lastSync ? saved.lastSync : null,
      errors: Array.isArray(saved.errors) ? saved.errors.filter(isObject).slice(-MAX_ERRORS) : [],
    };
  }

  // A source record: the hash covers what a reader sees, so a CMS edit is detected
  // without comparing the whole text on every sync.
  function buildSource({id, origin, kind, title, url, text, status, version}) {
    return {
      id,
      origin,
      kind,
      title,
      url,
      text,
      hash: hashOf(title, url, text),
      status,
      version,
      updatedAt: isoNow(),
      error: null,
    };
  }

  // What the admin list shows: no text, no chunks, just what the row needs.
  function summaryOf(source, kb) {
    return {
      id: source.id,
      origin: source.origin,
      kind: source.kind,
      title: source.title,
      url: source.url,
      status: source.status,
      version: source.version,
      updatedAt: source.updatedAt,
      error: source.error ?? null,
      chars: String(source.text ?? '').length,
      chunks: kb.chunks.filter((chunk) => chunk.sourceId === source.id).length,
    };
  }

  // The active embedding provider, or null when none is configured: the base then works
  // lexically and every later embedding change is caught by status().needsReindex.
  async function resolveEmbedder() {
    const {activeEmbedding} = await store.config();
    if (!activeEmbedding) return null;
    const found = await store.providerWithKey(activeEmbedding);
    if (!found) return null;
    const {cfg, key} = found;
    return {
      key: `${cfg.type}|${cfg.baseUrl}|${cfg.model}`,
      embed: (texts, signal) => provider(cfg, key).embed(texts, signal),
    };
  }

  // Re-chunks one source and embeds it when the stored key matches the active embedder.
  // A failed embedding never loses the chunks: they stay lexical and the error is logged.
  async function indexSource(kb, source, embedder) {
    kb.chunks = kb.chunks.filter((chunk) => chunk.sourceId !== source.id);
    const chunks = chunkText(source.text).map((text, index) => ({
      id: `${source.id}#${index}`,
      sourceId: source.id,
      text,
      tokens: tokenize(`${source.title} ${text}`),
      vector: null,
    }));
    kb.chunks.push(...chunks);
    source.error = null;
    if (!embedder || !chunks.length) return {chunks: chunks.length, ok: true};
    if (kb.embedKey === null) kb.embedKey = embedder.key;
    if (kb.embedKey !== embedder.key) return {chunks: chunks.length, ok: true};
    try {
      for (let start = 0; start < chunks.length; start += EMBED_BATCH) {
        const batch = chunks.slice(start, start + EMBED_BATCH);
        const vectors = await embedder.embed(batch.map((chunk) => `${source.title}\n${chunk.text}`));
        if (!Array.isArray(vectors) || vectors.length !== batch.length) {
          throw new Error('Răspuns incomplet de la providerul de embeddings');
        }
        batch.forEach((chunk, index) => {
          const vector = vectors[index];
          chunk.vector = Array.isArray(vector) ? vector.map((value) => Number(value) || 0) : null;
        });
      }
    } catch (error) {
      for (const chunk of chunks) chunk.vector = null;
      const message = String(error?.message ?? 'Eroare la embeddings').slice(0, 300);
      source.error = message;
      kb.errors.push({at: isoNow(), sourceId: source.id, message});
      if (kb.errors.length > MAX_ERRORS) kb.errors = kb.errors.slice(-MAX_ERRORS);
      return {chunks: chunks.length, ok: false};
    }
    return {chunks: chunks.length, ok: true};
  }

  // An imported document lands as a draft: the operator reads it and approves it.
  function addSource({origin, kind, title, url, text}) {
    return serial(async () => {
      const body = String(text ?? '').trim();
      if (!body) throw problem('Documentul nu conține text util.');
      const kb = await loadKb();
      const source = buildSource({
        id: randomUUID(),
        origin,
        kind,
        title: String(title ?? '').trim().slice(0, TITLE_MAX),
        url,
        text: body,
        status: 'draft',
        version: 1,
      });
      kb.sources.push(source);
      await indexSource(kb, source, await resolveEmbedder());
      await atomic(kbFile, kb);
      return summaryOf(source, kb);
    });
  }

  // A public page or text document, fetched through the SSRF-safe client of security.mjs.
  async function fetchUrlSource(rawUrl) {
    const target = typeof rawUrl === 'string' ? rawUrl.trim() : '';
    if (!target) throw problem('Completează adresa URL.');
    const res = await fetchPublic(target);
    const contentType = String(res.contentType ?? '').toLowerCase();
    const body = res.body.toString('utf8');
    if (contentType.includes('text/html') || contentType.includes('application/xhtml')) {
      return {kind: 'page', title: titleOf(body) || res.url, text: htmlToText(body), url: res.url};
    }
    if (contentType.includes('text/plain') || contentType.includes('markdown')) {
      return {kind: contentType.includes('markdown') ? 'markdown' : 'text', title: res.url, text: body, url: res.url};
    }
    throw problem('Conținutul adresei nu este HTML, text sau Markdown.', 415);
  }

  // An uploaded file: plain text is read as utf8, PDF is extracted by unpdf.
  async function readFileSource(name, buffer) {
    const fileName = typeof name === 'string' ? path.basename(name.trim()) : '';
    if (!fileName) throw problem('Fișierul nu are nume.');
    const ext = path.extname(fileName).toLowerCase();
    if (ext !== '.pdf' && ext !== '.txt' && ext !== '.md') {
      throw problem('Format neacceptat (doar PDF, TXT, MD).', 415);
    }
    const data = Buffer.isBuffer(buffer) ? buffer : buffer instanceof Uint8Array ? Buffer.from(buffer) : null;
    if (!data) throw problem('Fișierul nu a putut fi citit.');
    if (data.length > MAX_FILE_BYTES) throw problem('Fișierul depășește 10 MB.', 413);
    if (ext === '.pdf') {
      const {getDocumentProxy, extractText} = await import('unpdf');
      const text = (await extractText(await getDocumentProxy(new Uint8Array(data)), {mergePages: true})).text;
      return {kind: 'pdf', title: fileName, text, url: ''};
    }
    return {kind: ext === '.md' ? 'markdown' : 'text', title: fileName, text: data.toString('utf8'), url: ''};
  }

  return {
    // -------------------------------------------------------------- sync from the site
    syncSite(data) {
      return serial(async () => {
        const kb = await loadKb();
        const embedder = await resolveEmbedder();
        const result = {added: 0, updated: 0, removed: 0, unchanged: 0, failed: 0};
        const seen = new Set();
        for (const doc of siteDocuments(data)) {
          seen.add(doc.id);
          const prev = kb.sources.find((item) => item.id === doc.id) ?? null;
          if (prev && prev.hash === hashOf(doc.title, doc.url, doc.text)) {
            result.unchanged++;
            continue;
          }
          const source = buildSource({
            id: doc.id,
            origin: 'site',
            kind: doc.kind,
            title: doc.title,
            url: doc.url,
            text: doc.text,
            status: 'approved',
            version: (prev?.version ?? 0) + 1,
          });
          if (prev) {
            kb.sources[kb.sources.indexOf(prev)] = source;
            result.updated++;
          } else {
            kb.sources.push(source);
            result.added++;
          }
          const indexed = await indexSource(kb, source, embedder);
          if (!indexed.ok) result.failed++;
        }
        // A page deleted from the CMS takes its source and its chunks with it.
        const gone = kb.sources.filter((source) => source.origin === 'site' && !seen.has(source.id));
        if (gone.length) {
          const ids = new Set(gone.map((source) => source.id));
          kb.sources = kb.sources.filter((source) => !ids.has(source.id));
          kb.chunks = kb.chunks.filter((chunk) => !ids.has(chunk.sourceId));
          result.removed = gone.length;
        }
        kb.lastSync = isoNow();
        await atomic(kbFile, kb);
        return result;
      });
    },

    // ----------------------------------------------------------------- manual sources
    saveSource(input) {
      const data = isObject(input) ? input : {};
      return serial(async () => {
        const kb = await loadKb();
        const id = typeof data.id === 'string' ? data.id.trim() : '';
        const prev = id ? kb.sources.find((item) => item.id === id) ?? null : null;
        if (id && !prev) throw problem('Sursa nu există.', 404);
        if (prev && prev.origin === 'site') throw problem('Sursa vine din site; editeaz-o din CMS', 409);
        const title = typeof data.title === 'string' ? data.title.trim() : '';
        if (!title || title.length > TITLE_MAX) throw problem(`Titlul trebuie să aibă între 1 și ${TITLE_MAX} de caractere.`);
        const text = typeof data.text === 'string' ? data.text.trim() : '';
        if (!text || text.length > TEXT_MAX) throw problem(`Textul trebuie să aibă între 1 și ${TEXT_MAX} de caractere.`);
        const url = typeof data.url === 'string' ? data.url.trim() : '';
        if (url && !url.startsWith('/') && !url.startsWith('https://')) {
          throw problem('Adresa trebuie să fie o cale internă (începe cu „/”) sau un URL https.');
        }
        const status = typeof data.status === 'string' && data.status ? data.status : 'draft';
        if (!STATUSES.has(status)) throw problem('Statusul trebuie să fie approved sau draft.');
        const kind = (typeof data.kind === 'string' ? data.kind.trim().slice(0, 40) : '') || prev?.kind || 'text';
        const source = buildSource({
          id: prev?.id ?? randomUUID(),
          origin: prev?.origin ?? 'manual',
          kind,
          title,
          url,
          text,
          status,
          version: (prev?.version ?? 0) + 1,
        });
        if (prev) kb.sources[kb.sources.indexOf(prev)] = source;
        else kb.sources.push(source);
        await indexSource(kb, source, await resolveEmbedder());
        await atomic(kbFile, kb);
        return summaryOf(source, kb);
      });
    },

    // ------------------------------------------------------------------------ imports
    importUrl(url) {
      return (async () => {
        // The network call happens before the queue: a slow page blocks nothing but itself.
        const doc = await fetchUrlSource(url);
        return addSource({origin: 'url', ...doc});
      })();
    },

    importFile(name, buffer) {
      return (async () => {
        const doc = await readFileSource(name, buffer);
        return addSource({origin: 'file', ...doc});
      })();
    },

    // ------------------------------------------------------------------- admin actions
    setStatus(id, status) {
      return serial(async () => {
        if (!STATUSES.has(status)) throw problem('Statusul trebuie să fie approved sau draft.');
        const kb = await loadKb();
        const source = kb.sources.find((item) => item.id === id);
        if (!source) throw problem('Sursa nu există.', 404);
        source.status = status;
        source.updatedAt = isoNow();
        await atomic(kbFile, kb);
        return summaryOf(source, kb);
      });
    },

    deleteSource(id) {
      return serial(async () => {
        const kb = await loadKb();
        const index = kb.sources.findIndex((item) => item.id === id);
        if (index < 0) return false;
        kb.sources.splice(index, 1);
        kb.chunks = kb.chunks.filter((chunk) => chunk.sourceId !== id);
        await atomic(kbFile, kb);
        return true;
      });
    },

    async listSources() {
      const kb = await loadKb();
      const perSource = new Map();
      for (const chunk of kb.chunks) perSource.set(chunk.sourceId, (perSource.get(chunk.sourceId) ?? 0) + 1);
      return kb.sources.map((source) => ({
        id: source.id,
        origin: source.origin,
        kind: source.kind,
        title: source.title,
        url: source.url,
        status: source.status,
        version: source.version,
        updatedAt: source.updatedAt,
        error: source.error ?? null,
        chars: String(source.text ?? '').length,
        chunks: perSource.get(source.id) ?? 0,
      }));
    },

    async getSource(id) {
      const kb = await loadKb();
      const source = kb.sources.find((item) => item.id === id);
      if (!source) return null;
      return {
        ...structuredClone(source),
        chars: String(source.text ?? '').length,
        chunks: kb.chunks.filter((chunk) => chunk.sourceId === source.id).length,
      };
    },

    // ---------------------------------------------------------------- index and state
    embedder() {
      return resolveEmbedder();
    },

    reindex() {
      return serial(async () => {
        const kb = await loadKb();
        const embedder = await resolveEmbedder();
        kb.embedKey = embedder?.key ?? null;
        kb.chunks = [];
        let chunks = 0;
        let failed = 0;
        for (const source of kb.sources) {
          const indexed = await indexSource(kb, source, embedder);
          chunks += indexed.chunks;
          if (!indexed.ok) failed++;
        }
        await atomic(kbFile, kb);
        return {chunks, failed};
      });
    },

    async status() {
      const kb = await loadKb();
      const embedder = await resolveEmbedder();
      const current = !!embedder && kb.embedKey === embedder.key;
      return {
        lastSync: kb.lastSync,
        sources: kb.sources.length,
        approved: kb.sources.filter((source) => source.status === 'approved').length,
        drafts: kb.sources.filter((source) => source.status === 'draft').length,
        chunks: kb.chunks.length,
        embedded: current ? kb.chunks.filter((chunk) => Array.isArray(chunk.vector) && chunk.vector.length > 0).length : 0,
        failed: kb.sources.filter((source) => !!source.error).length,
        needsReindex: !!embedder && kb.embedKey !== embedder.key,
        embedKey: kb.embedKey,
        errors: kb.errors.slice(-10),
      };
    },

    // ------------------------------------------------------------------------- search
    async search(query, options) {
      const settings = isObject(options) ? options : {};
      const topKRaw = Number(settings.topK);
      const topK = Number.isInteger(topKRaw) && topKRaw > 0 ? Math.min(topKRaw, 50) : 6;
      const minScoreRaw = settings.minScore === undefined || settings.minScore === null ? 0.2 : Number(settings.minScore);
      const minScore = Number.isFinite(minScoreRaw) ? minScoreRaw : 0.2;
      const signal = settings.signal;
      const kb = await loadKb();
      // Candidates are recomputed on every call: a source deleted or re-drafted since the
      // last index must not answer anymore.
      const sources = new Map(kb.sources.map((source) => [source.id, source]));
      const candidates = kb.chunks.filter((chunk) => sources.get(chunk.sourceId)?.status === 'approved');
      const terms = new Set(tokenize(query));

      // BM25 over the candidate chunks.
      const lengths = candidates.map((chunk) => count(chunk.tokens));
      const average = lengths.length ? lengths.reduce((sum, value) => sum + value, 0) / lengths.length : 0;
      const frequencies = candidates.map((chunk) => {
        const counts = new Map();
        for (const term of Array.isArray(chunk.tokens) ? chunk.tokens : []) {
          if (terms.has(term)) counts.set(term, (counts.get(term) ?? 0) + 1);
        }
        return counts;
      });
      const df = new Map();
      for (const counts of frequencies) for (const term of counts.keys()) df.set(term, (df.get(term) ?? 0) + 1);
      const total = candidates.length;
      const lexical = frequencies.map((counts, index) => {
        if (!average) return 0;
        let score = 0;
        for (const [term, tf] of counts) {
          const frequency = df.get(term) ?? 0;
          const idf = Math.log(1 + (total - frequency + 0.5) / (frequency + 0.5));
          score += (idf * (tf * (K1 + 1))) / (tf + K1 * (1 - B + (B * lengths[index]) / average));
        }
        return score;
      });
      const maxLexical = lexical.reduce((max, value) => (value > max ? value : max), 0);
      const bm25n = lexical.map((value) => (maxLexical > 0 ? value / maxLexical : 0));

      // Semantic part: only with the same embedder the chunks were indexed with.
      const embedder = await resolveEmbedder();
      const semantic = candidates.map(() => 0);
      let hybrid = false;
      if (embedder && kb.embedKey === embedder.key && candidates.some((chunk) => Array.isArray(chunk.vector))) {
        let queryVector = null;
        try {
          const [vector] = await embedder.embed([String(query ?? '')], signal);
          if (Array.isArray(vector)) queryVector = vector;
        } catch {
          queryVector = null; // a dead provider degrades the search to lexical, it never fails it
        }
        if (queryVector) {
          hybrid = true;
          candidates.forEach((chunk, index) => {
            semantic[index] = cosine(queryVector, chunk.vector);
          });
        }
      }

      const ranked = candidates
        .map((chunk, index) => {
          const source = sources.get(chunk.sourceId) ?? {};
          const cos = hybrid ? semantic[index] : null;
          return {
            chunkId: chunk.id,
            sourceId: chunk.sourceId,
            title: source.title ?? '',
            url: source.url ?? '',
            kind: source.kind ?? '',
            text: chunk.text,
            score: hybrid ? 0.6 * (cos ?? 0) + 0.4 * bm25n[index] : bm25n[index],
            lexical: bm25n[index],
            semantic: cos,
            updatedAt: source.updatedAt ?? null,
          };
        })
        .sort((a, b) => b.score - a.score);

      const hits = [];
      const used = new Map();
      for (const hit of ranked) {
        if (hit.score < minScore) continue;
        if (!(hit.lexical > 0 || (hit.semantic ?? 0) >= 0.5)) continue;
        const taken = used.get(hit.sourceId) ?? 0;
        if (taken >= MAX_PER_SOURCE) continue;
        used.set(hit.sourceId, taken + 1);
        hits.push(hit);
        if (hits.length >= topK) break;
      }
      return {mode: hybrid ? 'hybrid' : 'lexical', hits};
    },
  };
}
