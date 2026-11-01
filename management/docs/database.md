# Baza de date

## Motor
- Postgres în producție (`driver: node-postgres`), PGlite (WASM, in-process) când lipsește `DATABASE_URL` — `server/db/client.ts`, `server/index.ts:41`.
- Ambele variante rulează aceleași fișiere SQL din `server/db/migrations` — `server/db/client.ts:7`.

## Migrări
- Generare: `npm run db:generate` (`drizzle-kit generate`), ieșire în `./server/db/migrations` — `package.json:16`, `drizzle.config.ts:6`.
- Aplicare: automat la pornire, în `createDb`, prin migratorul Drizzle (`migrateNodePg` / `migratePglite`) — `server/db/client.ts:49`, `server/db/client.ts:58`; nu există pas manual de `migrate` în `server/index.ts`.
- Fișiere existente: `0000_init.sql`, `0001_equal_xavin.sql`, `0002_smooth_doomsday.sql` (+ `meta/`).

## Convenții
- Bani în unități minore (int): `moneyInt` în Zod (`server/lib/crud.ts`), `formatMoney(minor)` în UI — `docs/WORKER.md:5`.
- Ștergere logică unde există `deletedAt` (`softDelete()`): users, clients, projects, tasks, observations, servers, domains, credentials, invoices, payments, expenses, contracts — `server/db/schema/core.ts:64`, `server/db/schema/infra.ts:59`, `server/db/schema/finance.ts:53`, `server/db/schema/ops.ts:140`.
- Monedele nu se amestecă: sumele rămân în moneda documentului, conversia se face explicit prin `convertMinor` — `server/modules/finance/calc.ts`.

## Tabele pe domenii
### Auth
- `roles`, `users`, `sessions`, `loginHistory`, `passwordTokens`, `auditLogs`.

### Core (proiecte și client)
- `clients` — clienți (status Prospect/Active/Inactive), soft delete.
- `contacts` — persoane de contact ale clientului.
- `projects` — proiecte, legate de client, cu status/tip/prioritate.
- `projectFavorites` — proiecte favorite per utilizator.
- `tasks` — task-uri de proiect (status, prioritate, termene).
- `taskDependencies` — dependențe între task-uri.
- `comments` — comentarii pe entități.
- `attachments` — fișiere atașate.
- `observations` — observații, pot fi convertite în task-uri.
- `projectUpdates` — actualizări de proiect.
- `activities` — jurnal de activitate vizibil în UI.

### Infra
- `servers` — servere (provider, tip), soft delete.
- `projectServers` — legătura proiect ↔ server.
- `serverServices` — servicii pe server.
- `domains` — domenii, soft delete.
- `dnsRecords` — înregistrări DNS.
- `sslCertificates` — certificate SSL și expirări.
- `hostingServices` — servicii de hosting.
- `credentials` — credențiale criptate (vault), soft delete.

### GitHub / deploy
- `repositories` — repo-uri urmărite.
- `commits`, `pullRequests`, `releases` — date sincronizate din GitHub.
- `webhookDeliveries` — livrări de webhook primite.
- `deployments` — deploy-uri.

### Finance
- `invoices` — facturi (status, monedă), soft delete.
- `invoiceItems` — linii de factură.
- `payments` — plăți, soft delete.
- `expenses` — cheltuieli pe categorii, soft delete.
- `exchangeRates` — cursuri valutare.

### Ops (operațional)
- `maintenancePlans` / `maintenanceLogs` — planuri și intervenții de mentenanță.
- `contracts` — contracte, soft delete.
- `documents` / `documentVersions` — documente și versiunile lor.
- `emailTemplates` — șabloane de email.
- `notificationRules` / `notificationLogs` / `notifications` — reguli, log-uri și notificări.
- `monitoringChecks` / `monitoringResults` / `incidents` — monitorizare și incidente.
