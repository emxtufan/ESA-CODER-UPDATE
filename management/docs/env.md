# Variabile de mediu

Sursa de adevăr este schema Zod din `server/env.ts` (`baseEnvSchema`, `server/env.ts:15`). `.env` este încărcat de
scripturile npm cu `--env-file-if-exists=.env` (`package.json:10`, `package.json:12`). Variabilele goale sunt tratate
ca „neconfigurat”, nu ca valoare invalidă (`server/env.ts:12`).

Validarea se face la pornire prin `loadEnv` (`server/env.ts:67`); o configurare invalidă oprește procesul cu toate
problemele într-un singur mesaj (`server/env.ts:74`).

| Variabilă | Obligatorie în producție | Implicit | Rol |
| --- | --- | --- | --- |
| `NODE_ENV` | nu | `development` | Mediu: `development` / `test` / `production` (`server/env.ts:17`). `production` activează cerințele de mai jos și cookie-ul `__Host-`. |
| `HOST` | nu | `127.0.0.1` | Interfața pe care ascultă Express (`server/env.ts:18`). |
| `PORT` | nu | `5100` | Portul HTTP (`server/env.ts:19`). |
| `APP_URL` | **da** | — | URL public al aplicației, folosit la linkurile din emailuri și la cookie/CORS (`server/env.ts:20`, `server/env.ts:50`). |
| `DATABASE_URL` | nu (practic da) | gol = PGlite în `<DATA_DIR>/pg` | Connection string Postgres; gol înseamnă PGlite local, potrivit doar pentru dev/test (`server/env.ts:23`). |
| `DATA_DIR` | nu | `data` | Directorul pentru datele locale: PGlite, fișiere încărcate (`server/env.ts:25`, `server/lib/storage.ts:15`). |
| `VAULT_MASTER_KEY` | **da** | — | Cheie master AES-256-GCM pentru Vault; exact 64 caractere hex / 32 bytes (`server/env.ts:28`, `server/env.ts:9`). |
| `FILE_SIGNING_KEY` | **da** | — | Cheie HMAC pentru linkurile temporare semnate la documente; exact 64 caractere hex (`server/env.ts:29`). |
| `SMTP_HOST` | nu | — | Serverul SMTP pentru trimiterea emailurilor (`server/env.ts:32`). |
| `SMTP_PORT` | nu | `587` | Portul SMTP; `465` = TLS direct, orice alt port cere STARTTLS (`server/env.ts:33`). |
| `SMTP_USER` | nu | — | Contul SMTP (`server/env.ts:34`). |
| `SMTP_PASS` | nu | — | Parola contului SMTP (`server/env.ts:35`). |
| `EMAIL_FROM` | nu | — | Expeditorul din emailuri, ex. `"ESA Management <no-reply@domeniu.ro>"` (`server/env.ts:36`). |
| `GITHUB_TOKEN` | nu | — | Acces la API-ul GitHub (`server/env.ts:36`). |
| `GITHUB_WEBHOOK_SECRET` | nu | — | Secretul webhook-ului, folosit la verificarea HMAC SHA-256 pe raw body (`server/env.ts:37`). |
| `S3_ENDPOINT` | nu | — | Endpoint S3-compatible; fără toate cele patru variabile `S3_*` se folosește storage local în `DATA_DIR/files` (`server/env.ts:40`, `server/lib/storage.ts:9`). |
| `S3_BUCKET` | nu | — | Bucketul S3 (`server/env.ts:41`). |
| `S3_ACCESS_KEY` | nu | — | Access key S3 (`server/env.ts:42`). |
| `S3_SECRET_KEY` | nu | — | Secret key S3 (`server/env.ts:43`). |

## Generarea cheilor

```bash
openssl rand -hex 32
```

Rezultatul are exact 64 caractere hex, adică formatul cerut de `hex64()` (`server/env.ts:9`). Rulați comanda o dată
pentru `VAULT_MASTER_KEY` și o dată pentru `FILE_SIGNING_KEY` — sunt chei distincte, cu roluri distincte.

## Reguli

- Cheile se citesc doar în procesul serverului (`loadEnv`, `server/env.ts:67`); nu se scriu în baza de date și nu se
  trimit către frontend.
- `.env` nu se commitează; în repo există doar `.env.example` cu valori goale.
- O cheie pierdută (`VAULT_MASTER_KEY`) nu poate fi recuperată din bază — vezi `docs/backup.md`.
