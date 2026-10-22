# Asistent AI (chatbot RAG)

Modul disponibil în **`/admin` → AI Assistant**, cu panouri pentru furnizori, modele, bază de cunoștințe, sincronizare, conversații, analytics și setări. Widget-ul public răspunde exclusiv din conținutul site-ului indexat, cu citate și refuz atunci când sursele nu acoperă întrebarea. Este o implementare tehnică, nu o garanție de acuratețe a unui model extern.

## Pornire pentru administrator

1. Setează `AI_SECRET_KEY` (64 caractere hex) înainte de a salva vreun furnizor: cheile sunt criptate AES-256-GCM, cu `AAD` pe înregistrare (`.env.example:27-30`, `server/ai/security.mjs:15-27`).
2. Autentifică-te în `/admin` și deschide **AI Assistant** din navigația laterală (`src/admin/Sections.tsx:22`, `:157-163`).
3. În **Providers** adaugi furnizorul, îl testezi și îi ceri lista de modele; în **Models** alegi modelul activ de chat și, separat, modelul de embeddings (`server/ai/routes.mjs:292`, `:304`, `:319`, `:327`).
4. În **Settings** activezi asistentul (`enabled` este `false` implicit) și limita de buget; în **Limits** setezi plafoanele per IP, per sesiune și global (`server/ai/store.mjs:11-25`, `:27-31`, `server/ai/routes.mjs:330`, `:333`).
5. În **Synchronization** rulezi sincronizarea din `source_data.json` sau reindexarea completă; în **Knowledge Base** verifici sursele aprobate, adaugi URL-uri sau fișiere și cauți în index (`server/ai/routes.mjs:337-380`).
6. Verifică răspunsurile în **Conversations** și în widgetul public; feedback-ul vizitatorilor ajunge în același jurnal (`server/ai/routes.mjs:245-254`, `:386`).

## Fluxul unei întrebări

```
vizitator → ChatWidget (src/components/chat/ChatWidget.tsx:84)
   │  POST /api/ai/chat, SSE, antet x-ai: 1   → server/ai/routes.mjs:189
   ▼
chat.answer  → server/ai/chat.mjs:321
   ├─ limită IP/minut, sesiune/zi, buget global   → chat.mjs:340
   ├─ small talk („salut”, „mulțumesc”) → text fix   → chat.mjs:346
   ├─ întrebare < 6 cuvinte → se caută împreună cu întrebarea anterioară → chat.mjs:352
   ├─ knowledge.search: lexical (BM25) + semantic, dacă există embeddings → chat.mjs:360
   ├─ < 2 termeni utili → status clarify (too_vague), dar numai după căutare și numai dacă niciun fragment găsit nu conține un termen rar (df ≤ 5% din fragmente) → chat.mjs:357, :361
   ├─ 0 rezultate → status refused (no_sources) → chat.mjs:361
   ├─ prompt de sistem + sursele S1..Sn → chat.mjs:365-371
   ├─ furnizor activ; un singur fallback la eroare tranzitorie → chat.mjs:377-400
   ▼
validate(JSON-ul modelului) → answer | clarify | refused | insufficient | conflict → chat.mjs:152
   ▼
persistare conversație (conversations.json) → server/ai/store.mjs:267
   ▼
SSE: meta → delta → sources → done → routes.mjs:225-236
```

## Funcții reale

- Furnizori reali, fără chei în cod: OpenAI, Anthropic Claude, Google Gemini, DeepSeek, OpenRouter, Ollama local și orice gateway OpenAI-compatible, cu un contract unic `generate`/`embed` (`server/ai/providers.mjs:7-13`, `:243-248`).
- Chei API criptate AES-256-GCM și mascate în API; `AI_SECRET_KEY` invalid oprește modulul cu 503 (`server/ai/security.mjs:1-27`).
- Import de surse cu protecție SSRF: rezolvare DNS, blocare a intervalelor private și a redirecționărilor către rețeaua internă (`server/ai/security.mjs:1-2`).
- Bază de cunoștințe construită determinist din `source_data.json`, tăiată în bucăți, tokenizată și — opțional — vectorizată; un singur `kb.json`, scris atomic (`server/ai/extract.mjs:1-3`, `server/ai/knowledge.mjs:1-2`).
- Căutare hibridă: lexical BM25 plus cosinus pe embeddings, cu degradare la lexical dacă furnizorul de embeddings nu răspunde; un fragment trece filtrul lexical dacă acoperă ≥ 50% din termenii întrebării **sau** conține un termen rar (df ≤ 5% din fragmente, ex. „SAGA”) (`server/ai/knowledge.mjs:486-506`, `:500-548`).
- Respingerea textelor care conțin instrucțiuni pentru model (prompt injection) la indexare, nu la afișare (`server/ai/extract.mjs:17-24`).
- Răspunsuri validate: citate obligatorii, citate verificate în surse, valori numerice susținute de text, prag de suport; stări explicite `answer`/`clarify`/`refused`/`insufficient`/`conflict` (`server/ai/chat.mjs:45-48`, `:152-223`).
- Streaming SSE pentru vizitator, cu text tăiat în fragmente scurte și oprire când clientul pleacă (`server/ai/routes.mjs:16-17`, `:212-242`).
- Widget public ascuns fără consimțământul pentru statistici, cu antet `x-ai` cerut de server pentru orice scriere (`src/components/chat/ChatWidget.tsx:7`, `:341-342`, `:472`, `server/ai/routes.mjs:174`).
- Persistență atomară în `AI_DIR`: `config.json`, `conversations.json`, `usage.json`, cu scrieri serializate (`server/ai/store.mjs:266-268`, `:1-3`).
- Retenție configurabilă a conversațiilor (implicit 30 zile) prin `purgeData` la citire, la salvare și prin `purge()` (`server/ai/store.mjs:24`, `:343-344`, `:381`, `:606-610`).
- Reindexare automată la schimbarea tokenizer-ului sau a modelului de embeddings (`server/ai/knowledge.mjs:22`, `:73-78`, `:436`).
- Adminul CMS notifică asistentul la fiecare salvare de conținut, fără ca un eșec de indexare să strice salvarea (`server/admin.mjs:283`, `server/index.mjs:109-113`).

## API

- Public: `GET /api/ai/config`, `POST /api/ai/chat` (JSON sau SSE), `POST /api/ai/feedback` (`server/ai/routes.mjs:178`, `:189`, `:245`).
- Public, filtrare: aceeași origine verificată prin `Host`, plus antetul `x-ai: 1` pentru orice metodă care nu e `GET` (`server/ai/routes.mjs:170-175`).
- Admin: `/api/admin/ai` cu sesiunea CMS refolosită și antetul `x-admin: 1` pentru scrieri (`server/ai/routes.mjs:262-266`, `server/index.mjs:115`).
- Admin, resurse: `overview`, `providers` (+`/test`, `/:id/models`), `active`, `settings`, `limits`, `kb/status|sync|reindex|sources|import-url|upload|search`, `test-chat`, `conversations`, `analytics` (`server/ai/routes.mjs:269-401`).

## Configurare

- `AI_SECRET_KEY` — 64 caractere hex; obligatoriu pentru criptarea cheilor (`.env.example:27-30`).
- `AI_DIR` — directorul de stare, implicit `data/ai`, în afara rădăcinii web (`.env.example:31-32`, `server/index.mjs:113`).
- `AI_PRIVATE_HOSTS` — `host:port` permis explicit pentru un Ollama local (`.env.example:33-34`).
- Setări funcționale: `enabled`, `language`, `tone`, `welcome`, `noInfo`, `contactUrl`, `maxAnswerChars`, `citations`, `suggestions`, `topK`, `minScore`, `retentionDays` (`server/ai/store.mjs:11-25`).
- Limite: `maxMessageChars`, `perSessionPerDay`, `perIpPerMinute` și bugetul lunar (`server/ai/store.mjs:27-31`).
- Furnizor: `maxTokens` — bugetul de tokeni al răspunsului, implicit 1500, reglabil între 16 și 8000 (`server/ai/store.mjs:66`, `:140`).

## Fișiere

- Create pentru funcționalitate: `server/ai/chat.mjs`, `server/ai/extract.mjs`, `server/ai/knowledge.mjs`, `server/ai/providers.mjs`, `server/ai/routes.mjs`, `server/ai/security.mjs`, `server/ai/store.mjs`, `src/admin/Ai.tsx`, `src/admin/AiConfig.tsx`, `src/admin/AiData.tsx`, `src/components/chat/ChatWidget.tsx`, `src/styles/chat.css`.
- Modificate pentru integrare: `server/index.mjs`, `server/admin.mjs`, `src/admin/Sections.tsx`, `src/components/layout/SiteLayout.tsx`, `.env.example`, `README.md`, `package.json`.
- Teste: `tests/ai-check.mjs`, `tests/ai-eval.mjs`, `tests/ai-eval.json`.

## Teste

- `npm run test:ai` — suite cu HTTP real pe routere și furnizor `mock` înregistrat în locul vânzătorilor, fără rețea și fără datele reale din `data/` (`package.json:23`, `tests/ai-check.mjs:1-2`, `:36-54`).
- `npm run test:ai-eval` — evaluare de retrieval și validare pe conținutul real al site-ului, cu model mock (`package.json:23`, `tests/ai-eval.mjs:1`, `:22-27`).
- Raportul de evaluare numără separat întrebările `answerable`, `unanswerable` și `ambiguous` (`tests/ai-eval.mjs:39-47`).
- Ambiguous: cele 4 întrebări din `tests/ai-eval.json:22-25` trebuie să primească cerere de clarificare, nu un răspuns afirmativ — metrica `refusedOrClarify` = 4/4 (`tests/ai-eval.mjs:46`), conform regulii din prompt ca întrebarea ambiguă să primească o singură întrebare scurtă de clarificare (`server/ai/chat.mjs:48`, `:357-359`).
- După relaxarea filtrului lexical, cu modelul mock „ascultător” (răspunde mereu) refuzul la întrebările fără răspuns a scăzut la 13% (`tests/ai-eval.mjs:10-15`, `:45`), iar testul live cu DeepSeek a refuzat corect întrebarea despre „reduceri Black Friday”. Limitare: filtrul mai permisiv trimite mai multe întrebări la model (cost), iar refuzul depinde de statusul `insufficient` al modelului plus validare (`server/ai/chat.mjs:152-223`).

## Limitări

- Modelul nu este antrenat pe datele firmei: răspunsul depinde de retrieval, iar evaluarea automată folosește un model mock, deci măsoară retrieval + validare, nu calitatea unui LLM real (`tests/ai-eval.mjs:43`).
- Fără embeddings configurate, căutarea rămâne lexicală; schimbarea modelului de embeddings cere reindexare (`server/ai/knowledge.mjs:121`, `:436`).
- Calitatea depinde de conținutul publicat: textele din `source_data.json` trebuie să fie aprobate, iar sursele nepublicate nu hrănesc asistentul.
- Protecția anti-injection este euristică (regex pe text), nu o barieră completă (`server/ai/extract.mjs:17-24`).
- Costul și disponibilitatea țin de furnizorul ales; fallback-ul se face o singură dată și numai dacă bugetul permite (`server/ai/chat.mjs:393-400`).
- Starea este JSON cu o singură instanță: nu scalează pe mai multe procese concurente (`server/ai/store.mjs:1-3`).
- Retenția și bugetul sunt setări administrative; ștergerea din `conversations.json` nu acoperă copiile de backup ale hostului.
- Widget-ul nu este afișat cât timp lipsește consimțământul pentru statistici, deci asistentul nu e disponibil pentru vizitatorii care nu acceptă (`src/components/chat/ChatWidget.tsx:472`).
