# Securitate

Documentul descrie modelul de securitate al ESA Management. Ce nu este confirmat de codul citat trimite la
`vezi docs/SPEC.md`.

## Model de acces

- **Un singur proprietar.** Notificările și acțiunile sensibile se adresează utilizatorilor cu rolul
  `super_admin` activi (`server/modules/notifications/service.ts:43`). `super_admin` are toate permisiunile;
  ceilalți roluri au doar permisiunile enumerate în rol (`server/security/guards.ts:31`).
- Garduri de rută: sesiune validă cu al doilea factor confirmat (`requireAuth`), sesiune validă cu
  `mfaPending` permis doar pentru pasul TOTP (`allowMfaPending`), permisiuni granulare (`requirePermission`)
  (`server/security/guards.ts:19`, `:25`, `:39`).

## Parole și al doilea factor

Parolele se stochează cu **scrypt**, iar al doilea factor este **TOTP**. Starea `mfaPending` blochează rutele
protejate până la confirmarea codului (`server/security/guards.ts:14`). Detalii de implementare:
`vezi docs/SPEC.md`.

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

Content-Security-Policy se aplică doar în producție. Detalii: `vezi docs/SPEC.md`.

## Seif (Vault)

Secretele se criptează cu **AES-256-GCM cu AAD**; cheia master stă doar în variabilele de mediu. Rutele
există cu permisiuni separate: listare/vedere (`vault.view`), creare/modificare/ștergere (`vault.manage`),
rotire (`POST /:id/rotate`), revocare (`POST /:id/revoke`), dezvăluire (`POST /:id/reveal`, permisiune
`vault.reveal`) (`server/modules/vault/routes.ts:159`, `:203`, `:227`, `:263`). Reguli:

- dezvăluirea valorii se face **numai** prin ruta dedicată, după autorizare, și se înregistrează în audit;
- secretele nu apar niciodată în API-urile obișnuite, în loguri sau în notificări;
- rotirea schimbă valoarea, revocarea o face inutilizabilă (nu se șterge istoricul).

Detalii de criptare, AAD și audit: `vezi docs/SPEC.md`.

## Webhook-uri

Autentificare prin HMAC-SHA256 pe **raw body**, comparație în timp constant, plus dedupe pe
`X-GitHub-Delivery` în aceeași tranzacție cu procesarea (`server/modules/github/webhook.ts:13`, `:160`).

## Monitorizare (protecție SSRF)

Verificările de monitorizare au voie să atingă **doar adrese publice**. Rețelele private, loopback, link-local,
multicast și rezervate sunt blocate printr-un `BlockList` (IPv4 și IPv6), iar adresa se rezolvă la conectare
(`server/modules/monitoring/check.ts:1`, `:16`). Redirecturile nu sunt urmate.
Timeout-ul unei verificări este 10 s (`server/modules/monitoring/check.ts:12`). Detalii: `vezi docs/SPEC.md`.

## Fișiere

Fișierele încărcate trec printr-o **whitelist** care exclude HTML/SVG, conținutul este verificat pe
**magic bytes**, iar accesul se face prin **linkuri semnate**. Detalii: `vezi docs/SPEC.md`.

## Export

La export (CSV), valorile sunt neutralizate împotriva injecției de formule (`=`, `+`, `-`, `@`), iar exportul
este înregistrat în audit. Detalii: `vezi docs/SPEC.md`.

## Ce nu face sistemul

- **Fără execuție SSH din browser.** Nu există terminal remote; comenzile nu se execută din interfața web.
- **Rollback nesimulat.** Starea `inactive` primită de la GitHub nu produce un rollback: statusul deployment-ului
  rămâne cel înregistrat (`server/modules/github/webhook.ts:101`).

## Limite cunoscute

- Metricile de **server** (CPU, RAM, disc) cer un **agent** instalat pe mașina monitorizată. Agentul nu există
  în acest moment, deci aceste metrici nu sunt disponibile; monitorizarea se limitează la verificări HTTP/TLS
  (`server/modules/monitoring/check.ts:12`).
- Restul garanțiilor (politici de parolă, CSP, criptare, linkuri semnate, audit) sunt descrise în
  `vezi docs/SPEC.md`.
