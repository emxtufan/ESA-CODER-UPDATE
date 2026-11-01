# Arhitectură

## Scop
Aplicație internă pentru un singur proprietar, separată de site-ul public din rădăcina repo-ului.
Clienții sunt doar date în DB (nume, contacte, proiecte) — nu au cont și nu au acces la aplicație.

## Stack
Express 5, TypeScript rulat prin `tsx`, Zod 4, Drizzle ORM, Postgres în producție,
PGlite când lipsește `DATABASE_URL` (`server/index.ts:41`, `server/db/client.ts`), React 19,
Vite, Tailwind 4, TanStack Query.

## Structura folderelor
- `client/` — SPA React (`client/src/app`, `components`, `lib`, `modules`)
- `server/` — API Express (`db`, `jobs`, `lib`, `modules`, `security`, `scripts`, `integrations`)
- `shared/` — tipuri/enumerări/permisiuni comune (`shared/enums.ts`, `shared/permissions`)
- `tests/` — teste de integrare cu app reală + PGlite (`tests/helpers.ts`)
- `docs/` — documentație (SPEC, WORKER, architecture, database, api)

## Fluxul unui request
1. `helmet` (CSP restrâns only în producție) — `server/app.ts:62`
2. context pe request (`req.ctx = {db, env}`) — `server/app.ts:80`
3. `express.json` (1mb), **nu** pe `/api/webhooks/` (webhook-urile vor raw body) — `server/app.ts:86`
4. webhook GitHub montat **înainte** de sesiune — `server/app.ts:93`
5. `loadSession` — `server/app.ts:95`
6. `csrfGuard` pe `/api` — `server/app.ts:96`
7. rutele modulelor — `server/app.ts:99-135`
8. `/api` nemontat → 404 JSON — `server/app.ts:142`
9. frontend (static în producție / Vite middleware în dev) — `server/app.ts:146`, `server/index.ts:20,33`
10. `errorHandler` — `server/app.ts:148`

## Tipare
- `crudRouter(cfg)` (`server/lib/crud.ts`) — listare/GET/POST/PATCH/DELETE standardizate; sub-rutele proprii se montează înaintea lui.
- `ResourcePage` (`client/src/components/resource/ResourcePage.tsx`) — pagină CRUD generată din config.
- Erori: `HttpError` + `errorHandler`, corp `{error:{code,message,fields?}}`.

## Joburi
- `server/jobs/scheduler.ts` — `startScheduler`, `runDueChecks` (verificări due la interval)
- `server/jobs/daily.ts` — `runDailyChecks`, `periodKey` (task-uri restante, facturi overdue etc.)

## Module (o linie fiecare)
- `auth` — login, 2FA TOTP, sesiuni, parolă uitată/resetare.
- `clients` + `contacts` — clienți și persoane de contact.
- `projects` — entitatea centrală; favorite, overview, activitate.
- `tasks` — task-uri, calendar, dependențe.
- `observations` — observații convertibile în task-uri.
- `updates` — actualizări de proiect.
- `comments` — comentarii pe entități.
- `activities` / `audit` — jurnal de activitate și audit tehnic.
- `search` — căutare globală peste grupuri configurate.
- `infra` — servere, servicii, domenii, DNS, SSL, hosting.
- `vault` — credențiale criptate, rotire/revocare/reveal.
- `github` + `deployments` — repo-uri, commit-uri, PR-uri, release-uri, deploy-uri, webhook.
- `finance` — facturi, plăți, cheltuieli, cursuri, sumar, profitabilitate.
- `maintenance` — planuri, log-uri, contracte.
- `documents` + `files` — documente cu versiuni, upload/download, link semnat.
- `notifications` — notificări, reguli, șabloane email, log-uri.
- `monitoring` — checks, rezultate, incidente.
- `dashboard` — agregări pentru pagina principală.
- `reports` — rapoarte exportabile (json/csv/xlsx).
