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
```

Alternativ, setați `PDF_CHROMIUM_PATH` în `.env` la un Chromium/Chrome deja instalat (ex. `/usr/bin/chromium`). Ordinea: `PDF_CHROMIUM_PATH`, apoi Chromium-ul instalat de Playwright, apoi Chrome-ul sistemului (`channel: "chrome"`). Dacă nu se găsește niciunul, ruta răspunde 503 și clientul folosește print-ul din browser. Browserul este unul singur, pornit la prima cerere și închis la `SIGTERM`; cererile se procesează pe rând.
