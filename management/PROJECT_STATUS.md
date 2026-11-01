# Stadiul proiectului

Actualizat: 2026-11-01. Branch: `esa-management`.

## Verificat

- `tsc --noEmit`: fără erori.
- Vitest: 130 din 130 de teste trec, pe PGlite.
- E2E Playwright: trece pe serverul de dezvoltare și pe build-ul de producție, cu CSP activ, fără erori în consolă.
- `npm audit --omit=dev`: 0 vulnerabilități.

## Gata

- Autentificare cu parolă, 2FA TOTP, sesiuni, CSRF, audit.
- Clienți, contacte, proiecte, taskuri, observații, update-uri, comentarii, timeline, căutare globală.
- Infrastructură: servere, servicii, domenii, DNS, SSL, hosting.
- Seif: AES-256-GCM, dezvăluire cu audit, rotire, revocare.
- GitHub: repo-uri, sincronizare, webhook HMAC cu dedupe. Deployments.
- Financiar: facturi, plăți, cheltuieli, cursuri datate, profit pe proiect și pe monedă.
- Mentenanță, contracte, documente cu versiuni și linkuri semnate.
- Notificări în aplicație și email, reguli, șabloane, jurnal, reîncercări.
- Monitorizare: verificări HTTP, SSL, DNS, protecție SSRF, incidente automate.
- Joburi zilnice: termene, domenii, SSL, facturi, mentenanță, taskuri recurente, retenție 30 de zile.
- Dashboard cu grafice și rapoarte cu export CSV și Excel.

## Decizii

- Aplicația e doar pentru proprietar. Nu există portal de clienți, rol de client, solicitări, echipă, asignare de taskuri, invitații sau UI de utilizatori. `requirePermission` rămâne în backend ca apărare.
- Fără regulă explicită, New Project, New Task, New Commit, Invoice Issued și Payment Received rămân doar în aplicație.
- Sumele nu se adună între monede.

## Neverificat cu servicii reale

Nu au fost folosite credențiale reale. Fără configurare, integrările apar „neconectat”.

- Trimiterea prin Resend.
- API-ul și webhook-ul GitHub cu un depozit real.
- Stocarea S3.
- Instalarea cu Postgres, nginx și HTTPS: testele și E2E au rulat pe PGlite, peste HTTP local.

## Limitări cunoscute

- Metricile de server (CPU, RAM, disc, servicii) cer un agent care nu există. Se afișează „Neconectat”.
- Aplicația nu face backup-uri, iar „Backup Failed” nu are declanșator. Vezi [docs/backup.md](docs/backup.md).
- Raportul de profitabilitate conține doar facturile și cheltuielile legate de un proiect. Profitul din dashboard le include pe toate, deci cele două pot diferi.
- Filtrele din Rapoarte se aplică doar unde au sens: de exemplu, moneda nu schimbă raportul de taskuri.
- „Verifică acum” și „Istoric” există doar în pagina Monitorizare, nu și în tabul Operațiuni al proiectului.
- E2E adaugă o verificare, dar nu apasă „Verifică acum”. Logica verificării e acoperită de `tests/phase7.test.ts`.
- Rapoartele sunt plafonate la 10.000 de rânduri, iar interfața afișează un avertisment când plafonul e atins.
- Limita de 60 de emailuri pe oră și joburile rulează în proces, deci aplicația presupune o singură instanță.
