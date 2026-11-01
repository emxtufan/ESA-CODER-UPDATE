# Email (Resend)

Trimiterea se face prin Resend. Integrarea este „conectată” doar când sunt setate ambele variabile:
`isConfigured` verifică `RESEND_API_KEY` **și** `EMAIL_FROM` (`server/integrations/resend.ts:22`).

## Variabile de mediu

| Variabilă | Rol |
| --- | --- |
| `RESEND_API_KEY` | cheia API, trimisă ca `Authorization: Bearer <key>` (`server/integrations/resend.ts:33`). Opțională în schemă (`server/env.ts:32`). |
| `EMAIL_FROM` | expeditorul, trimis ca `from` în cererea către Resend (`server/integrations/resend.ts:36`). Opțională în schemă (`server/env.ts:33`). |

**Verificarea domeniului:** domeniul din `EMAIL_FROM` trebuie verificat în contul Resend (înregistrări DNS
SPF/DKIM) înainte de a trimite. Fără domeniu verificat, Resend refuză expedierea.

Fără `RESEND_API_KEY` sau fără `EMAIL_FROM`, emailul apare **neconectat**: jurnalul marchează intrarea
`not_configured` (`server/modules/notifications/service.ts:74`), iar testul de trimitere întoarce
`503 email_not_configured` cu mesajul „setează RESEND_API_KEY și EMAIL_FROM”
(`server/modules/notifications/routes.ts:69`). Notificările din aplicație funcționează în continuare.

## Reguli

Fiecare eveniment poate avea o regulă în `notificationRules` (`server/modules/notifications/service.ts:84`):

- `enabled: false` → evenimentul este suprimat complet;
- `recipients` → lista de destinatari; dacă lipsește, se trimite către proprietari
  (`super_admin` activi — `server/modules/notifications/service.ts:43`, `:98`);
- `frequencyMinutes` → fereastră de calm: dacă există deja o notificare pentru eveniment în interval, nu se
  mai trimite nimic (`server/modules/notifications/service.ts:87`).

Fără regulă explicită, evenimentele `New Project`, `New Task`, `New Commit`, `Invoice Issued`,
`Payment Received` rămân **doar în aplicație** (fără email) — sunt evenimente produse chiar de proprietar sau
foarte dese (`server/modules/notifications/service.ts:20`, `:101`). Restul evenimentelor primesc email și fără regulă.

## Șabloane

Un șablon per eveniment (`emailTemplates`), cu `subject`, `html` și `enabled`; `enabled: false` marchează
intrarea ca `skipped` (`server/modules/notifications/service.ts:61`). Dacă nu există șablon, se folosesc
valorile implicite (`server/modules/notifications/service.ts:27`). Variabilele `{{title}}`, `{{body}}`,
`{{link}}` se înlocuiesc; în HTML valorile sunt escapate, ca datele să nu devină markup
(`server/modules/notifications/service.ts:35`).

## Jurnal, reîncercări, limită

- Jurnal: `notificationLogs`, cu `status` ∈ `pending`, `in_app`, `sent`, `failed`, `rate_limited`,
  `skipped`, `not_configured`, plus numărul de `attempts` și eroarea ultimei încercări
  (`server/modules/notifications/service.ts:73`).
- Reîncercări: `retryFailed` reia intrările eșuate și este apelat din scheduler
  (`server/modules/notifications/service.ts:127`, `server/jobs/scheduler.ts:44`).
- Limită: maximum **60 de emailuri pe oră**; peste limită, intrările se marchează `rate_limited` și nu se trimit
  (`server/modules/notifications/service.ts:29`, `:57`).
- Dedupe: aceeași `dedupeKey` nu se trimite de două ori aceluiași destinatar
  (`server/modules/notifications/service.ts:11`).
- O notificare nu aruncă niciodată: eșecul ei nu strică fluxul care a produs-o
  (`server/modules/notifications/service.ts:81`).

## Eveniment fără declanșator

`Backup Failed` există ca eveniment, dar **nu are declanșator** în cod: nu este produs de niciun modul.
