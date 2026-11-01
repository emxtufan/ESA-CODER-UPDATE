# Instalare (mediu local)

## Cerințe

- Node.js `>=22.12` (`package.json:6`).
- npm (proiectul folosește `npm`; scripturile sunt în `package.json:9`).
- `openssl` pentru generarea cheilor (`openssl rand -hex 32`).
- Opțional: un server PostgreSQL, dacă nu folosiți PGlite.

## Pași

```bash
cd management
npm install
cp .env.example .env
```

Completați `.env` conform `docs/env.md`. În dezvoltare puteți lăsa goale `DATABASE_URL`, `VAULT_MASTER_KEY` și
`FILE_SIGNING_KEY`.

```bash
npm run dev
```

Serverul ascultă implicit pe `http://127.0.0.1:5100` (`HOST`/`PORT` au implicit `127.0.0.1`/`5100` —
`server/env.ts:18`, `server/env.ts:19`). Dev-ul pornește Vite în middleware mode (`server/index.ts:33`).

## Fără DATABASE_URL

Dacă `DATABASE_URL` este gol, datele merg în PGlite, în directorul `<DATA_DIR>/pg` (`server/env.ts:23`), implicit
`data/pg`. La pornire serverul loghează explicit „PGlite (dev)” (`server/index.ts:53`). Migrațiile se aplică automat
la pornire (`server/db/client.ts:58`).

## Primul cont (super_admin)

```bash
npm run user:admin -- <email> <nume>
```

Exact două argumente poziționale, în ordinea `email`, `nume` (`server/scripts/create-admin.ts:19`); dacă lipsesc,
scriptul afișează `Utilizare: npm run user:admin -- <email> <nume>` și iese cu cod 1
(`server/scripts/create-admin.ts:22`). Parola este generată aleator (18 bytes, base64url —
`server/scripts/create-admin.ts:16`, `server/scripts/create-admin.ts:50`) și afișată o singură dată în consolă
(`server/scripts/create-admin.ts:60`); în baza de date rămâne doar hash-ul (`server/scripts/create-admin.ts:56`).

## Teste

```bash
npm test
```

Rulează `vitest run` (`package.json:13`).

```bash
npm run test:e2e
```

Rulează `node tests/e2e/smoke.mjs` (`package.json:14`) și are nevoie de variabilele:

| Variabilă | Obligatorie | Implicit | Rol |
| --- | --- | --- | --- |
| `E2E_BASE` | nu | `http://127.0.0.1:5199` | URL-ul aplicației testate (`tests/e2e/smoke.mjs:15`). |
| `E2E_EMAIL` | **da** | — | Emailul contului de test (`tests/e2e/smoke.mjs:16`). |
| `E2E_PASSWORD` | **da** | — | Parola contului de test; nu este logată (`tests/e2e/smoke.mjs:17`). |
| `E2E_OUT` | nu | `os.tmpdir()` | Directorul pentru screenshots (`tests/e2e/smoke.mjs:18`). |

Fără `E2E_EMAIL` / `E2E_PASSWORD` testul se oprește cu mesaj explicit (`tests/e2e/smoke.mjs:22`).
