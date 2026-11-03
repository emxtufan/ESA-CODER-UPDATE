# Deploy în producție

## Build și pornire

```bash
npm ci
npm run build
NODE_ENV=production npm run start
```

- `npm run build` rulează `vite build` și scrie clientul în `<repo>/dist` (`package.json:11`, `server/index.ts:17`).
- `npm run start` rulează `node --env-file-if-exists=.env --import tsx server/index.ts` (`package.json:12`).
- În producție serverul servește fișierele statice din `dist` cu fallback pe `index.html` pentru rutele SPA
  (`server/index.ts:20`, `server/index.ts:48`).

## Ascultare și HTTPS

Aplicația ascultă pe `HOST`/`PORT`, implicit `127.0.0.1:5100` (`server/env.ts:18`, `server/env.ts:19`); nu o expuneți
direct, ci prin nginx cu TLS.

HTTPS este obligatoriu: în producție numele cookie-ului de sesiune are prefixul `__Host-` (`__Host-esa_mgmt`,
`server/security/session.ts:26`), iar acest prefix impune `Secure` (`server/security/session.ts:22`). Fără TLS
browserul nu trimite cookie-ul și loginul nu funcționează.

`APP_URL`, `VAULT_MASTER_KEY` și `FILE_SIGNING_KEY` sunt obligatorii când `NODE_ENV=production`; fără ele procesul
nu pornește (`server/env.ts:50`).

## Exemplu de bloc nginx

```nginx
server {
    listen 80;
    server_name management.exemplu.ro;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    http2 on;
    server_name management.exemplu.ro;

    ssl_certificate     /etc/letsencrypt/live/management.exemplu.ro/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/management.exemplu.ro/privkey.pem;

    client_max_body_size 25m;

    location / {
        proxy_pass         http://127.0.0.1:5100;
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s;
    }
}
```

## Exemplu de unit systemd

```ini
[Unit]
Description=ESA Management
After=network.target postgresql.service
Wants=network-online.target

[Service]
Type=simple
User=esa
WorkingDirectory=/opt/esa-management
Environment=NODE_ENV=production
ExecStart=/usr/bin/npm run start
Restart=on-failure
RestartSec=5
KillSignal=SIGTERM

[Install]
WantedBy=multi-user.target
```

La `SIGTERM` oprește scheduler-ul, închide serverul HTTP și conexiunea la bază (`server/index.ts:58`).

## Bază de date

În practică `DATABASE_URL` este obligatoriu în producție: setați un connection string Postgres
(`postgres://user:parola@host:5432/db`). PGlite (când `DATABASE_URL` este gol) scrie într-un director local
(`<DATA_DIR>/pg`, `server/env.ts:23`) și este marcat explicit în log ca mod de dezvoltare (`server/index.ts:53`); nu
este potrivit pentru producție — un singur proces, fără replicare și fără acces concurent.

## Migrații

Nu există pas manual de migrare în `server/index.ts`. Migrațiile SQL din `server/db/migrations` se aplică automat la
pornire, în `createDb`, prin migratorul Drizzle: `migrateNodePg` pentru Postgres (`server/db/client.ts:49`) și
`migratePglite` pentru PGlite (`server/db/client.ts:58`). Migrațiile noi se generează cu `npm run db:generate`
(`package.json:16`). Deci: la fiecare deploy, pornirea aplicației aplică migrațiile rămase.

## O singură instanță

Rulați o singură instanță a aplicației. Joburile periodice rulează în procesul aplicației, pornite de
`startScheduler(db, env)` (`server/index.ts:56`); două instanțe ar însemna joburi duplicate și un PGlite partajat
imposibil.

## PDF pe server (Chromium)

Ruta `POST /api/legal/pdf` generează PDF-urile documentelor din Legal cu Chromium headless (`playwright-core`, `server/lib/pdf.ts`). Pe server trebuie instalat Chromium, o singură dată, după `npm ci`:

```bash
npx playwright install --with-deps chromium
sudo apt-get install -y fonts-crosextra-carlito
```

Paginarea documentelor se face în browserul utilizatorului, iar serverul primește pagini deja tăiate. Ca rândurile să se rupă identic în ambele locuri, documentele includ fontul Carlito ca data URL (`client/src/modules/legal/contract/fonts.ts`, pachetul `@fontsource/carlito`). De aceea CSP-ul permite `font-src data:` (`server/app.ts`).

Pachetul de sistem `fonts-crosextra-carlito` rămâne recomandat ca rezervă pentru HTML-ul salvat înainte de includerea fontului, de exemplu cererile de semnare deja trimise, pe care serverul le randează din nou la semnare. Fără el, Chromium folosește Liberation Sans, mai lat decât Calibri, iar textul ajunge peste footer. După instalarea fontului, reporniți aplicația, pentru că Chromium citește fonturile doar la pornire.

Chiar și cu același font, browserul utilizatorului (de exemplu Chrome pe Windows) poate rupe un rând altfel decât Chromium-ul de pe server. De aceea, înaintea fiecărui PDF și a imaginilor de previzualizare, serverul verifică fiecare pagină (`server/lib/page-layout.js`, rulat cu `page.evaluate`; scripturile documentului rămân dezactivate). Textul trebuie să se termine în zona de text: 230 mm de la începutul ei și cel puțin 10 mm deasupra liniei footerului. O pagină care o depășește e micșorată uniform cât să încapă, de obicei sub 2%, pe toată lățimea zonei. Paginile ajustate apar în log: `PDF: pagini micșorate ca textul să rămână deasupra footerului: …`.

La semnare, același script pune semnătura desenată în fiecare loc de semnare al Beneficiarului:

- coloana BENEFICIAR din tabelele PRESTATOR/BENEFICIAR, fără modelul gol de proces-verbal din Anexa 2 a contractului;
- acceptarea expresă a clauzelor (art. 24.1).

Tot atunci completează „Prin:” cu numele și funcția semnatarului și „Data:” (dacă era necompletată sau „conform certificatului”) cu data semnării. Pe fiecare pagină, între text și footer, adaugă semnătura, numele și data. Semnătura crește doar cât spațiu liber are pagina, deci nu împinge textul spre footer.

Alternativ, setați `PDF_CHROMIUM_PATH` în `.env` la un Chromium/Chrome deja instalat (ex. `/usr/bin/chromium`). Ordinea: `PDF_CHROMIUM_PATH`, apoi Chromium-ul instalat de Playwright, apoi Chrome-ul sistemului (`channel: "chrome"`). Dacă nu se găsește niciunul, ruta răspunde 503 și clientul folosește print-ul din browser. Browserul este unul singur, pornit la prima cerere și închis la `SIGTERM`; cererile se procesează pe rând.
