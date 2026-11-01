# ESA Management

Aplicație internă pentru un singur proprietar: clienți, proiecte, taskuri, infrastructură, seif de credențiale, GitHub, deployments, financiar, mentenanță, documente, notificări, monitorizare și rapoarte. Clienții sunt doar date și nu au acces. Site-ul public din rădăcina depozitului e separat.

## Pornire rapidă

```bash
npm install
cp .env.example .env
npm run dev
npm run user:admin -- <email> <nume>
```

Aplicația pornește pe http://127.0.0.1:5100. Fără `DATABASE_URL`, datele merg în PGlite, în `DATA_DIR`.

## Comenzi

| Comandă | Rol |
|---|---|
| `npm run dev` | server cu Vite, în dezvoltare |
| `npm run build` | build frontend |
| `npm run start` | pornire |
| `npm test` | teste Vitest |
| `npm run test:e2e` | E2E Playwright (`E2E_BASE`, `E2E_EMAIL`, `E2E_PASSWORD`, `E2E_OUT`) |
| `npm run db:generate` | generează o migrare; migrările se aplică la pornire |
| `npm run user:admin -- <email> <nume>` | creează un cont; parola se afișează o singură dată |

## Documentație

- [Stadiul proiectului](PROJECT_STATUS.md)
- [Arhitectură](docs/architecture.md)
- [Bază de date](docs/database.md)
- [API](docs/api.md)
- [Variabile de mediu](docs/env.md)
- [Instalare](docs/install.md)
- [Deploy](docs/deploy.md)
- [Backup](docs/backup.md)
- [GitHub](docs/github.md)
- [Email](docs/email.md)
- [Securitate](docs/security.md)
