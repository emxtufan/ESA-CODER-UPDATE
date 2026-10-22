# Asistent AI (chatbot RAG)

Modul disponibil în **`/admin` → AI Assistant**, cu panouri pentru furnizori, modele, bază de cunoștințe, sincronizare, conversații, analytics și setări. Widget-ul public răspunde exclusiv din conținutul site-ului indexat, cu surse și refuz atunci când sursele nu acoperă întrebarea. Este o implementare tehnică, nu o garanție de acuratețe a unui model extern.

## Pornire pentru administrator

1. Setează `AI_SECRET_KEY` (64 caractere hex) înainte de a salva vreun furnizor: cheile sunt criptate AES-256-GCM, cu `AAD` pe înregistrare (`.env.example:27-30`, `server/ai/security.mjs:15-27`).
2. Autentifică-te în `/admin` și deschide **AI Assistant** din navigația laterală (`src/admin/Sections.tsx:22`, `:157-163`).
3. În **Providers** adaugi furnizorul, îl testezi și îi ceri lista de modele; în **Models** alegi modelul activ de chat și, separat, modelul de embeddings (`server/ai/routes.mjs:292`, `:304`, `:319`, `:327`).
4. În **Settings** activezi asistentul (`enabled` este `false` implicit) și limita de buget; în **Limits** setezi plafoanele per IP, per sesiune și global (`server/ai/store.mjs:11-25`, `:27-31`, `server/ai/routes.mjs:330`, `:333`).
5. În **Synchronization** rulezi sincronizarea din `source_data.json` sau reindexarea completă; în **Knowledge Base** verifici sursele aprobate, adaugi URL-uri sau fișiere și cauți în index (`server/ai/routes.mjs:337-380`).
6. Verifică răspunsurile în **Conversations** și în widgetul public; feedback-ul vizitatorilor ajunge în același jurnal (`server/ai/routes.mjs:245-254`, `:386`).

## Fluxul unei întrebări
`chat.answer()` (server/ai/chat.mjs), în ordine:
1. Validare mesaj, asistent activ, **proprietarul conversației** (`store.ownsConversation`: un `conversationId` al altei sesiuni e ignorat și se deschide o conversație nouă).
2. Limite (IP/minut, IP/zi, sesiune/zi, global/zi, buget lunar) → ruta `limited`; poarta de email (`leadAfter`).
3. **Cache** (`cacheEnabled`): doar pentru primul mesaj (fără istoric și fără memorie). Cheia: tokenii mesajului + revizia KB + providerul activ + setările de stil. Max 300 intrări, 24 h. Orice modificare a bazei de cunoștințe schimbă revizia și invalidează cache-ul → ruta `cache`.
4. Small talk → `smalltalk`; cerere pură de contact → răspuns determinist din `site:contact:main` → `contact`.
5. Căutare: query = mesaj + (pentru mesaje scurte/cu referință: „dar”, „cel anterior”…) subiectul și planurile din memorie + întrebarea anterioară + sinonime (EXPANSIONS). Dacă acoperirea e < 0.75, rescriere LLM a query-ului și a doua căutare → `expanded`.
6. **Profilul firmei** (`knowledge.profileHits()`, max 16 000 caractere) intră mereu în surse, înaintea rezultatelor căutării: contact, toate planurile, listele de servicii/proiecte/articole, FAQ și surse manuale aprobate. Modelul poate astfel combina informațiile și recomanda planuri.
7. `clarify` doar când mesajul nu are niciun cuvânt util.
8. Apel model (un fallback pe erori tranzitorii), răspuns JSON: `status`, `answer`, `citations`, opțional `calcs` și `memory`. JSON invalid → o reîncercare cu „Răspunde DOAR cu JSON valid”.
9. Validare (grounding), apoi salvare, memorie, cache. Refuz → ruta `handoff` (mesajul standard + link de contact). Răspuns normal → `hybrid`.

## Memoria conversației
- Se trimit doar ultimele `memoryWindow` mesaje (implicit 6, 1–20) + un bloc `CONVERSATION MEMORY` cu memoria compactă: `summary` (≤800 caractere) și `state` {topic, plans, users, budget, preferences, comparisons, open} (liste ≤8, JSON ≤2000).
- Memoria o actualizează modelul în același apel (fără cost suplimentar) și se salvează per conversație, doar după răspunsuri valide. Se șterge odată cu conversația (retenție).
- Memoria nu e sursă de fapte despre firmă; rezolvă referințe („dar pentru 12?”, „cel anterior”).

## Grounding (zero valori inventate)
- Orice număr din răspuns trebuie să existe ca valoare întreagă în surse („10” nu e găsit în „100”; „2.490” = „2490”), într-un calcul verificat sau în mesajele vizitatorului.
- Sumele de bani (lei, RON, €, EUR, $) doar din surse sau calcule — nu din ce a scris vizitatorul.
- Email, URL, telefon: doar din surse.
- `calcs`: `{expr, result}`; serverul evaluează expresia (doar cifre și + − × ÷ ()), operanzii trebuie să vină din surse/mesajele vizitatorului, rezultatul trebuie să coincidă (±0.01).
- Citările sunt opționale (decid doar linkurile afișate). Încălcare → refuz `unsupported_value`.

## Securitate conversații
Conversația păstrează `ownerHash` = sha256(sessionId). `/api/ai/feedback`, `/lead`, `/rating` cer `sessionId` și răspund 404 dacă sesiunea nu deține conversația.

## Admin
- Settings: „Mesaje păstrate în context” (`memoryWindow`), „Cache răspunsuri publice” (`cacheEnabled`).
- „Testează asistentul” (Settings): conversație pe mai multe mesaje; sub fiecare răspuns status · rută · model · tokeni in/out · ms · surse · motiv; secțiunea „Memorie” arată JSON-ul memoriei. Buton „Conversație nouă”.
- Analytics: rute, cache hit, căutare extinsă (fallback), predat echipei (handoff), retrieval mediu, valori respinse.

## Limitări
- Stocare în fișiere JSON (`data/ai`), nu Postgres/pgvector.
- Cache-ul și revizia KB sunt în memorie: se golesc la restart.
- Embeddings opționale: necesită un provider cu embeddings (DeepSeek nu are); fără ele căutarea e lexicală (BM25 + sinonime + rescriere), completată de profilul firmei; schimbarea modelului de embeddings cere reindexare (`server/ai/knowledge.mjs:121`, `:436`).
- Modelul nu este antrenat pe datele firmei: răspunsul depinde de retrieval, iar evaluarea automată folosește un model mock, deci măsoară retrieval + validare, nu calitatea unui LLM real (`tests/ai-eval.mjs:43`).
- Calitatea depinde de conținutul publicat: textele din `source_data.json` trebuie să fie aprobate, iar sursele nepublicate nu hrănesc asistentul.
- Protecția anti-injection este euristică (regex pe text), nu o barieră completă (`server/ai/extract.mjs:17-24`).
- Costul și disponibilitatea țin de furnizorul ales; fallback-ul se face o singură dată și numai dacă bugetul permite (`server/ai/chat.mjs:393-400`).
- Starea este JSON cu o singură instanță: nu scalează pe mai multe procese concurente (`server/ai/store.mjs:1-3`).
- Retenția și bugetul sunt setări administrative; ștergerea din `conversations.json` nu acoperă copiile de backup ale hostului.
- Widget-ul nu este afișat cât timp lipsește consimțământul pentru statistici, deci asistentul nu e disponibil pentru vizitatorii care nu acceptă (`src/components/chat/ChatWidget.tsx:472`).

## Funcții reale

- Furnizori reali, fără chei în cod: OpenAI, Anthropic Claude, Google Gemini, DeepSeek, OpenRouter, Ollama local și orice gateway OpenAI-compatible, cu un contract unic `generate`/`embed` (`server/ai/providers.mjs:7-13`, `:243-248`).
- Chei API criptate AES-256-GCM și mascate în API; `AI_SECRET_KEY` invalid oprește modulul cu 503 (`server/ai/security.mjs:1-27`).
- Import de surse cu protecție SSRF: rezolvare DNS, blocare a intervalelor private și a redirecționărilor către rețeaua internă (`server/ai/security.mjs:1-2`).
- Bază de cunoștințe construită determinist din `source_data.json`, tăiată în bucăți, tokenizată și — opțional — vectorizată; un singur `kb.json`, scris atomic (`server/ai/extract.mjs:1-3`, `server/ai/knowledge.mjs:1-2`).
- Căutare hibridă: lexical BM25 plus cosinus pe embeddings, cu degradare la lexical dacă furnizorul de embeddings nu răspunde (`server/ai/knowledge.mjs:486-506`, `:500-548`).
- Respingerea textelor care conțin instrucțiuni pentru model (prompt injection) la indexare, nu la afișare (`server/ai/extract.mjs:17-24`).
- Răspunsuri validate: valori (numere, bani, email, URL, telefon) susținute de surse sau de calcule verificate; stări explicite `answer`/`clarify`/`refused`/`insufficient`/`conflict` (`server/ai/chat.mjs:45-48`, `:152-223`).
- Streaming SSE pentru vizitator, cu text tăiat în fragmente scurte și oprire când clientul pleacă (`server/ai/routes.mjs:16-17`, `:212-242`).
- Widget public ascuns fără consimțământul pentru statistici, cu antet `x-ai` cerut de server pentru orice scriere (`src/components/chat/ChatWidget.tsx:7`, `:341-342`, `:472`, `server/ai/routes.mjs:174`).
- Persistență atomară în `AI_DIR`: `config.json`, `conversations.json`, `usage.json`, cu scrieri serializate (`server/ai/store.mjs:266-268`, `:1-3`).
- Retenție configurabilă a conversațiilor (implicit 30 zile) prin `purgeData` la citire, la salvare și prin `purge()` (`server/ai/store.mjs:24`, `:343-344`, `:381`, `:606-610`).
- Reindexare automată la schimbarea tokenizer-ului sau a modelului de embeddings (`server/ai/knowledge.mjs:22`, `:73-78`, `:436`).
- Adminul CMS notifică asistentul la fiecare salvare de conținut, fără ca un eșec de indexare să strice salvarea (`server/admin.mjs:283`, `server/index.mjs:109-113`).

## Răspunsuri deterministe

- Date de contact (telefon, email, adresă) servite direct din documentul `site:contact:main`, fără model, când întrebarea e scurtă și despre contact (`server/ai/chat.mjs`, `CONTACT_ANY_RE`).
- Sinonime deterministe pe teme (timp, hosting, portofoliu, servicii, tehnologii) adăugate la căutare (`EXPANSIONS`), abrevieri în `tokenize` (tel, nr, mail) și formule de politețe (ms, cf bn, ok, gata).
- Documente de ansamblu generate din CMS: contact, servicii, proiecte, blog (`server/ai/extract.mjs`).
- Rescrierea întrebării în cuvinte-cheie de către model când căutarea e slabă (un apel scurt în plus).

## Captare email și rating

- După `leadAfter` întrebări (implicit 2) widgetul cere emailul, cu consimțământ obligatoriu și link la politica de confidențialitate; cu `leadRequired` serverul refuză întrebările următoare până la primirea emailului (`status: lead_required`, fără apel la model).
- Emailul se salvează pe conversație (vizibil în Conversations, căutabil) și se șterge odată cu conversația la expirarea retenției.
- La încheierea conversației (mersi, ok, pa…) se cere un rating: Bună / Ok / Slabă (`/api/ai/rating`), afișat în Conversations și Analytics.
- Balon de întâmpinare lângă buton după `teaserDelay` secunde și bulină de notificare până la prima deschidere.

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
- Furnizor: `maxTokens` — bugetul de tokeni al răspunsului, implicit 6000, reglabil în admin între 16 și 16000 (`server/ai/store.mjs:80`, `:154`, `src/admin/AiConfig.tsx:433`). Modelele de tip reasoning consumă din buget înainte de a scrie JSON-ul, așa că un buget prea mic taie răspunsul; un răspuns tăiat nu e tratat ca JSON invalid, ci refuzat cu motivul `truncated` (`server/ai/chat.mjs:655-659`, `server/ai/providers.mjs:151`, `:191`, `:227`).

## Fișiere

- Create pentru funcționalitate: `server/ai/chat.mjs`, `server/ai/extract.mjs`, `server/ai/knowledge.mjs`, `server/ai/providers.mjs`, `server/ai/routes.mjs`, `server/ai/security.mjs`, `server/ai/store.mjs`, `src/admin/Ai.tsx`, `src/admin/AiConfig.tsx`, `src/admin/AiData.tsx`, `src/components/chat/ChatWidget.tsx`, `src/styles/chat.css`.
- Modificate pentru integrare: `server/index.mjs`, `server/admin.mjs`, `src/admin/Sections.tsx`, `src/components/layout/SiteLayout.tsx`, `.env.example`, `README.md`, `package.json`.
- Teste: `tests/ai-check.mjs`, `tests/ai-eval.mjs`, `tests/ai-eval.json`.

## Teste
- `npm run test:ai` — 24 scenarii cu provider mock (fără apeluri facturabile): schimbare provider, consultanță, întrebare necunoscută, prețuri lipsă, surse contradictorii, prompt injection (vizitator și document), cheie invalidă, provider căzut, conținut șters, citări lipsă, număr inventat, retry JSON, limite de cost, secretul cheilor, SSRF, CSRF, rescriere query, email și rating, calcul anual, numere ale vizitatorului, cache + actualizare preț, izolarea sesiunilor, conversație de 50 de mesaje + buget de tokeni.
- `npm run test:ai-eval` — setul de evaluare de retrieval.
- `npm run test:ai-live` — conversații reale din `tests/ai-live.json` pe providerul configurat (consumă tokeni), pe o copie temporară a `data/ai`. `AI_DEBUG=1` afișează valoarea respinsă sau răspunsul brut la JSON invalid.
