# GitHub

Integrarea aduce commits, pull requests, releases și deployment-uri din GitHub în ESA Management.
Sincronizarea este idempotentă: cheile unice din schemă (`(repositoryId, hash)`, `(repositoryId, number)`,
`(repositoryId, tag)`) fac ca o reluare să nu dubleze nimic (`server/modules/github/sync.ts:60`).

## Variabile de mediu

| Variabilă | Rol |
| --- | --- |
| `GITHUB_TOKEN` | token de acces la API-ul GitHub (`https://api.github.com`), folosit la sincronizare. Tokenul nu apare niciodată în erori sau loguri: mesajele conțin doar statusul (`server/modules/github/sync.ts:6`). |
| `GITHUB_WEBHOOK_SECRET` | secretul comun cu care GitHub semnează fiecare livrare (`server/modules/github/webhook.ts:145`). |

Permisiuni minime pentru token: **doar citire pe repository** (`Contents: read`, `Pull requests: read`,
`Releases: read`, `Deployments: read`). Nu se acordă drepturi de scriere — aplicația doar citește din GitHub.

Fără `GITHUB_WEBHOOK_SECRET`, webhook-ul răspunde `503 webhook_not_configured` („Webhook-ul GitHub nu este
configurat”) și integrarea apare **neconectat** (`server/modules/github/webhook.ts:146`). Fără `GITHUB_TOKEN`
sincronizarea nu poate fi făcută; starea afișată este tot **neconectat**.

## Webhook

- URL: `<APP_URL>/api/webhooks/github` (rută POST, montată la `/api/webhooks/`, singura intrare fără sesiune —
  `server/modules/github/webhook.ts:141`).
- Content type trimis de GitHub: `application/json`. Serverul citește corpul **brut** (`express.raw`, limită 5 MB),
  pentru că semnătura se calculează pe bytes, nu pe JSON-ul re-parsat (`server/modules/github/webhook.ts:144`).
- Semnătură: antetul `X-Hub-Signature-256` (`sha256=<hex>`), verificat cu HMAC-SHA256 pe raw body, comparație în
  timp constant (`server/modules/github/webhook.ts:13`, `:148`). Semnătură lipsă sau greșită → `401 invalid_signature`.
- Antete obligatorii: `X-GitHub-Delivery` și `X-GitHub-Event`; lipsa lor → `400 invalid_webhook`
  (`server/modules/github/webhook.ts:151`).
- Dedupe: fiecare `deliveryId` se înregistrează o singură dată în `webhookDeliveries` (`onConflictDoNothing`);
  o livrare repetată întoarce `{ duplicate: true }` și nu mai este procesată
  (`server/modules/github/webhook.ts:163`). Înregistrarea livrării și procesarea se fac în aceeași tranzacție:
  dacă procesarea pică, dedupe se anulează și reîncercarea GitHub este acceptată (`server/modules/github/webhook.ts:160`).
- Evenimente tratate: `push`, `pull_request`, `release` (doar `action: published`), `deployment`,
  `deployment_status` (`server/modules/github/webhook.ts:45`, `:66`, `:85`, `:95`). Restul sunt ignorate.

## Legarea de proiecte

Repo-urile **nu** se leagă automat de un proiect. Un webhook pentru un repository necunoscut este ignorat;
nu se creează rânduri noi (`server/modules/github/webhook.ts:36`). Deployment-urile cer un repository legat de un
proiect — fără `projectId` evenimentul nu se înregistrează (`server/modules/github/webhook.ts:97`).
Legarea se face explicit, din aplicație.

## Commit nu înseamnă „deployed”

Un `push` produce doar commit-uri sincronizate și o intrare de activitate de tip `commit`
(`server/modules/github/webhook.ts:48`). Starea de deployment vine exclusiv din evenimentele `deployment` /
`deployment_status`, mapate pe `Pending` / `Running` / `Successful` / `Failed`
(`server/modules/github/webhook.ts:20`). Starea `inactive` nu înseamnă rollback: statusul rămâne cel înregistrat
(`server/modules/github/webhook.ts:101`).

## Sincronizare manuală

`POST /api/github/repositories/:id/sync` — rulează sincronizarea pentru un repository existent și întoarce
numărul de commits / pull requests / releases aduse (`SyncResult`). Cererea trece prin gardurile obișnuite
(sesiune confirmată, permisiuni, CSRF), nu prin webhook: ruta e înregistrată cu
`requirePermission("github.update")` (`server/modules/github/routes.ts:123`) și apelează `syncRepository`
(`server/modules/github/routes.ts:127`), înregistrând în audit acțiunea `github_sync`
(`server/modules/github/routes.ts:128`).

## Notificări produse de integrare

`New Commit` (push cu cel puțin un commit) și `Failed Deployment` (deployment eșuat).
Notificările pleacă după commit-ul tranzacției webhook-ului (`server/modules/github/webhook.ts:119`).
