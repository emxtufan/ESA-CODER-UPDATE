# Backup și restaurare

## Ce face aplicația și ce nu face

Aplicația **nu** rulează backup-uri singură: nu există niciun job de backup în scheduler (`server/index.ts:56`).

Evenimentul „Backup Failed” există doar ca valoare în lista de evenimente de notificare (`shared/enums.ts:172`) și
apare în teste (`tests/ops.test.ts:183`, `tests/ops.test.ts:186`); **nu are încă niciun declanșator** — niciun cod
nu îl emite. Așadar nu vă bazați pe o alertă: backup-ul se face din exterior (cron/systemd timer).

## Ce trebuie salvat

1. **Baza de date** — `pg_dump` pe `DATABASE_URL`.
2. **Fișierele** — dacă folosiți storage local: tot directorul `<DATA_DIR>/files` (`server/lib/storage.ts:15`); dacă
   folosiți S3: bucketul configurat în `S3_BUCKET` (via `S3_ENDPOINT`, `server/lib/storage.ts:11`).
3. **Cheile, separat de backup-ul bazei**: `VAULT_MASTER_KEY` și `FILE_SIGNING_KEY` (`server/env.ts:28`,
   `server/env.ts:29`). **Fără `VAULT_MASTER_KEY` seiful nu mai poate fi citit** — datele criptate din bază devin
   irecuperabile. Păstrați cheile într-un seif de parole/secret manager, nu în același loc cu dump-ul.

## Exemplu de cron cu pg_dump

```bash
#!/bin/sh
# /etc/cron.daily/esa-backup
set -eu
STAMP=$(date +%F)
OUT=/var/backups/esa
mkdir -p "$OUT"
pg_dump --format=custom --no-owner --file="$OUT/esa-$STAMP.dump" "$DATABASE_URL"
tar czf "$OUT/files-$STAMP.tar.gz" -C "$DATA_DIR" files
```

Linie de crontab, zilnic la 03:30:

```cron
30 3 * * * /etc/cron.daily/esa-backup >> /var/log/esa-backup.log 2>&1
```

Păstrați ultimele N zile (ex. `find /var/backups/esa -mtime +30 -delete`) și copiați arhivele în afara serverului.

## Restaurare

```bash
# bază nouă, apoi:
pg_restore --no-owner --dbname="$DATABASE_URL" /var/backups/esa/esa-2025-01-31.dump
```

Alternativ, pentru dump în format plain (`pg_dump` fără `--format=custom`):

```bash
psql "$DATABASE_URL" < /var/backups/esa/esa-2025-01-31.sql
```

Fișierele:

```bash
tar xzf /var/backups/esa/files-2025-01-31.tar.gz -C "$DATA_DIR"
```

După restaurare, porniți aplicația cu **aceleași** `VAULT_MASTER_KEY` și `FILE_SIGNING_KEY` ca la data backup-ului,
altfel seiful nu poate fi decriptat, iar linkurile semnate existente devin invalide. Migrațiile se aplică automat la
pornire (`server/db/client.ts:49`).

## Recomandare

Faceți un **test de restaurare periodic** (ex. lunar) într-un mediu separat: restaurați dump-ul, porniți aplicația cu
cheile din seif și verificați că un secret din Vault și un fișier încărcat se pot deschide. Un backup netestat nu este
un backup.
