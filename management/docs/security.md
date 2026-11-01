# Securitate

Documentul descrie modelul de securitate al ESA Management. Fiecare afirmație trimite la fișierul și linia din
cod care o susține.

## Model de acces

- **Un singur proprietar.** Notificările și acțiunile sensibile se adresează utilizatorilor cu rolul
  `super_admin` activi (`server/modules/notifications/service.ts:43`). `super_admin` are toate permisiunile;
  ceilalți roluri au doar permisiunile enumerate în rol (`server/security/guards.ts:31`).
- Garduri de rută: sesiune validă cu al doilea factor confirmat (`requireAuth`), sesiune validă cu
  `mfaPending` permis doar pentru pasul TOTP (`allowMfaPending`), permisiuni granulare (`requirePermission`)
  (`server/security/guards.ts:19`, `:25`, `:39`).

## Parole și al doilea factor

Parolele se stochează cu **scrypt** la costul N=2^15, r=8, p=1, cu cheie derivată de 64 bytes și sare de 16
bytes (`server/security/password.ts:8`); formatul stocat este `scrypt$N$r$p$saltHex$hashHex`
(`server/security/password.ts:32`). Al doilea factor este **TOTP** (RFC 6238): secret base32, HOTP SHA1, 6 cifre,
pas de 30 s, verificare în fereastra de ±1 pas (`server/security/totp.ts:2`, `:75`). Starea `mfaPending` blochează
rutele protejate până la confirmarea codului (`server/security/guards.ts:14`).

## Sesiuni

Token opac în cookie HttpOnly; în baza de date se păstrează doar hash-ul SHA-256 al tokenului
(`server/security/session.ts:2`, `:50`). Numele cookie-ului: `esa_mgmt`, respectiv `__Host-esa_mgmt` în
producție — prefixul impune `Secure`, `Path=/` și fără `Domain`, deci nu poate fi suprascris de un subdomeniu
(`server/security/session.ts:25`). Atribute: `HttpOnly`, `SameSite=Strict`, `Secure` în producție
(`server/security/session.ts:30`); durata de viață 12 ore, prelungită la activitate
(`server/security/session.ts:15`).

## CSRF

Metodele fără efecte secundare (`GET`, `HEAD`, `OPTIONS`) sunt scutite. Pentru restul:
antetul `x-requested-with: esa` **și** potrivirea `Origin` cu hostul aplicației (`APP_URL`, altfel hostul
cererii) — cerere cross-site → `403 csrf_failed` (`server/security/guards.ts:56`, `:73`). Webhook-urile
integrărilor sunt scutite de CSRF: au semnătura proprie (`server/security/guards.ts:58`).

## CSP în producție

Content-Security-Policy se aplică doar în producție: `helmet` este montat cu `contentSecurityPolicy` activat
condiționat de `env.NODE_ENV === "production"` — în dezvoltare CSP-ul e dezactivat ca să nu blocheze HMR-ul Vite
(`server/app.ts:62`, `:65`, `:66`). În producție directiva pornește de la `default-src 'self'`
(`server/app.ts:69`). Fișierele servite au CSP-ul lor, `sandbox; default-src 'none'`
(`server/modules/documents/files.ts:37`).

## Seif (Vault)

Secretele se criptează cu **AES-256-GCM cu AAD**, algoritmul fiind `aes-256-gcm` (`server/security/crypto.ts:8`)
cu AAD setat la criptare și la decriptare (`server/security/crypto.ts:24`, `:47`); cheia master stă doar în
variabilele de mediu. Rutele există cu permisiuni separate: listare/vedere (`vault.view`),
creare/modificare/ștergere (`vault.manage`),
rotire (`POST /:id/rotate`), revocare (`POST /:id/revoke`), dezvăluire (`POST /:id/reveal`, permisiune
`vault.reveal`) (`server/modules/vault/routes.ts:159`, `:203`, `:227`, `:263`). Reguli:

- dezvăluirea valorii se face **numai** prin ruta dedicată, după autorizare, și se înregistrează în audit cu
  acțiunea `credential_revealed` (`server/modules/vault/routes.ts:317`); refuzurile se auditează ca
  `credential_reveal_denied` (`server/modules/vault/routes.ts:276`, `:295`);
- secretele nu apar niciodată în API-urile obișnuite, în loguri sau în notificări;
- rotirea schimbă valoarea, revocarea o face inutilizabilă (nu se șterge istoricul).

## Webhook-uri

Autentificare prin HMAC-SHA256 pe **raw body**, comparație în timp constant, plus dedupe pe
`X-GitHub-Delivery` în aceeași tranzacție cu procesarea (`server/modules/github/webhook.ts:13`, `:160`).

## Monitorizare (protecție SSRF)

Verificările de monitorizare au voie să atingă **doar adrese publice**. Rețelele private, loopback, link-local,
multicast și rezervate sunt blocate printr-un `BlockList` (IPv4 și IPv6), iar adresa se rezolvă la conectare
(`server/modules/monitoring/check.ts:1`, `:16`). Redirecturile nu sunt urmate: verificarea HTTP folosește GET
fără urmărirea redirecturilor, pentru ca un redirect să nu poată ținti rețeaua internă
(`server/modules/monitoring/check.ts:84`).
Timeout-ul unei verificări este 10 s (`server/modules/monitoring/check.ts:12`).

## Fișiere

Fișierele încărcate trec printr-o **whitelist** care exclude HTML/SVG — lista `ALLOWED` acoperă doar PDF, PNG,
JPEG, WebP, ZIP, DOCX și XLSX (`server/modules/documents/files.ts:5`), conținutul este verificat pe
**magic bytes** față de primii bytes declarați pentru fiecare tip (`server/modules/documents/files.ts:22`), iar
accesul se face prin **linkuri semnate**, servite de `signedFilesRouter` (`server/modules/documents/routes.ts:168`).

## Export

La export (CSV), valorile sunt neutralizate împotriva injecției de formule (`=`, `+`, `-`, `@`)
(`server/modules/reports/export.ts:13`), iar exportul este înregistrat în audit cu acțiunea `report_export`
(`server/modules/reports/routes.ts:230`).

## Ce nu face sistemul

- **Fără execuție SSH din browser.** Nu există terminal remote; comenzile nu se execută din interfața web.
- **Rollback nesimulat.** Starea `inactive` primită de la GitHub nu produce un rollback: statusul deployment-ului
  rămâne cel înregistrat (`server/modules/github/webhook.ts:101`).

## Limite cunoscute

- Metricile de **server** (CPU, RAM, disc) cer un **agent** instalat pe mașina monitorizată. Agentul nu există
  în acest moment, deci aceste metrici nu sunt disponibile; monitorizarea se limitează la verificări HTTP/TLS
  (`server/modules/monitoring/check.ts:12`).
- Restul garanțiilor sunt documentate mai sus, fiecare cu trimiterea la cod: costul parolei
  (`server/security/password.ts:8`), CSP (`server/app.ts:65`), criptarea (`server/security/crypto.ts:8`),
  linkurile semnate (`server/modules/documents/routes.ts:168`), auditul (`server/security/audit.ts`, importat în
  `server/modules/vault/routes.ts:19`).
