# API

## Convenții (din `docs/WORKER.md`)
- Listare `GET /res` → `{items,total,page,pageSize}` (`total` = total filtrat); `POST`/`PATCH` → `{item}`; `DELETE` → 204.
- Erori → `{error:{code,message,fields?}}`; validare Zod → 422 `validation_error`; permisiune lipsă → 403 `forbidden`.
- Paginare: `page=1`, `pageSize=25` (max 100), plus `q`, `sort`, `dir`; id invalid → 422, inexistent/în afara scope → 404, FK/unic → 409.
- CSRF (`csrfGuard`, metode nesigure): header `x-requested-with: esa` **și** `Origin` pe hostul aplicației — `docs/WORKER.md:66`; clientul trimite header-ul automat (`docs/WORKER.md:52`).
- Autentificare prin sesiune (cookie) încărcată de `loadSession`; rute publice doar auth-ul și webhook-ul.

## Prefixele montate (`server/app.ts`)
| Prefix | Permisiune | Sub-rute speciale |
|---|---|---|
| `/api/auth` | public / `requireAuth` | `POST /login`, `/2fa/verify`, `/logout`, `/forgot-password`, `/reset-password`, `/change-password`; `POST /2fa/setup`, `/2fa/enable`, `/2fa/disable`; `GET /me`, `/sessions`; `DELETE /sessions/:id` |
| `/api/clients` | `clients` | `GET /:id/summary` |
| `/api/contacts` | `clients` | — |
| `/api/projects` | `projects` | `GET /favorites/mine`, `GET /:id/overview`, `POST /:id/favorite`, `DELETE /:id/favorite` |
| `/api/tasks` | `tasks` | `GET /calendar`, `GET` și `POST /:id/dependencies`, `DELETE /:id/dependencies/:depId` |
| `/api/observations` | `observations` | `POST /:id/convert` |
| `/api/updates` | `projects` | — |
| `/api/comments` | `tasks` | — |
| `/api/activities` | `projects` | `GET /`, `POST /` |
| `/api/audit` | `audit.view` | `GET /` |
| `/api/search` | `requireAuth` | `GET /` |
| `/api/servers`, `/api/services`, `/api/domains`, `/api/dns-records`, `/api/ssl`, `/api/hosting` | `infrastructure` | `GET /:id/projects`, `PUT /:id/projects` (pe servere) |
| `/api/vault` | `vault.view` / `vault.manage` / `vault.reveal` | `POST /:id/rotate`, `POST /:id/revoke`, `POST /:id/reveal` |
| `/api/github` | `github` | `GET /status`, `POST /repositories/:id/sync` |
| `/api/deployments` | `deployments` | — |
| `/api/invoices` | `finance` | `POST /:id/issue`, `POST /:id/cancel` |
| `/api/payments`, `/api/expenses`, `/api/exchange-rates` | `finance` | — |
| `/api/finance` | `finance` | `GET /summary` (`finance.view`), `GET /by-project` (`finance.profitability`) |
| `/api/dashboard` | `requireAuth` | `GET /` |
| `/api/reports` | `reports.view` | `GET /:type?format=json` sau `format=csv`, `format=xlsx` |
| `/api/monitoring` | `monitoring` | `POST /checks/:id/run`, `GET /servers` |
| `/api/maintenance/plans`, `/api/maintenance/logs` | `maintenance` | — |
| `/api/contracts` | `documents` | — |
| `/api/documents` | `documents` | `POST /` (upload, `documents.update`), `GET /:id/versions`, `GET /:id/download`, `POST /:id/link` |
| `/api/files` | link semnat, fără permisiune | `GET /:versionId` |
| `/api/notifications` | `notifications` / `requireAuth` | `GET /status`, `/unread-count`, `POST /read-all`, `POST /test`, `POST /:id/read` |
| `/api/notification-rules`, `/api/email-templates`, `/api/notification-logs` | `notifications` | — |
| `/api/webhooks/github` | fără sesiune, semnătură HMAC pe raw body | `POST /` |
| `/api/health` | public | `GET /` |

Orice rută `/api` nemontată → 404 JSON (`server/app.ts:142`).

## Rapoarte
- `GET /api/reports/:type` cu `format` ∈ `json` (implicit) | `csv` | `xlsx` — `server/modules/reports/routes.ts:28,225`.
- Exporturile csv/xlsx se trimit ca attachment și se auditează (`report_export`) — `server/modules/reports/routes.ts:230`.

## Webhook
- `POST /api/webhooks/github`, montat înainte de `loadSession`, cu `express.raw` pe body — `server/app.ts:93`, `server/modules/github/webhook.ts:144`.
