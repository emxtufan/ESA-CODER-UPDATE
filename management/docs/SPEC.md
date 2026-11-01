# ESA Management — specificație (condensată)

**Un singur utilizator (proprietarul agenției). Clienții nu au cont și nu accesează aplicația; sunt doar date.**

Sistem intern agenție ESA Coder Solutions. Totul real: fără date statice, fără integrări simulate; neconfigurat = afișat explicit "neconectat". Fără date inventate. DEMO doar marcat is_demo și ștergibil.

## Stack (decis)

App separată `management/` (nu atinge site-ul public). Express 5 + TS (tsx), Zod, Drizzle + Postgres (`pg`) în prod; PGlite dacă lipsește DATABASE_URL (dev/test). React 19, Vite, TS, Tailwind 4, React Router, TanStack Query, React Hook Form, Zod, lucide-react. Vitest. Un singur proces, port 5100. Structură: shared/ (enums, permisiuni, zod), server/{db,security,modules/<mod>/{routes,service}.ts,integrations,jobs}, client/src/{app,components/ui,modules/<mod>}. docs/.

## Design

Dark. bg #101411, sidebar #171D19, card #1C241E, primary #64A045, secondary #3C5D2F, brand #1F3A27, text #F2F5F2, text2 #9AA59B, borduri contrast redus. Font Inter. Sidebar persistent responsive, header cu search global/notificări/profil, breadcrumbs. Fără gradient exagerat, glassmorphism, emoji, carduri inutile. Stări: loading, empty, error, success, disabled. Toate listele: CRUD, search, filtre, sort, paginare, confirmare la delete, toast, validare.

## Roluri

Un singur cont (super_admin), creat cu `npm run user:admin`. Fără invitații, fără UI de utilizatori/roluri; requirePermission rămâne ca apărare în backend.

## §4 Dashboard (calculat din DB)

KPI: proiecte total/active/în dezvoltare/mentenanță/suspendate, clienți, venituri total/lunare, facturi neachitate/restante, încasări, cheltuieli, profit estimat, taskuri active/urgente, deployment-uri recente, probleme infrastructură. Grafice: venituri lunare, cheltuieli lunare, evoluție proiecte, proiecte pe status, facturi plătite vs neachitate. Secțiuni: Recent Activity, Upcoming Deadlines, Pending Payments, Server Alerts, Domain Expiration, SSL Expiration, Recent Commits, Recent Deployments, Tasks Requiring Attention. Fiecare duce la entitate. Sumele nu se amestecă între monede.

## §5 Projects (central, pagină cu tab-uri)

name, slug, client, description, type[Custom Website, Landing Page, E-commerce, Shopify Development, Web Application, API Development, 3D Website, Redesign, Maintenance, Other], website_url, admin_url, status[Lead, Planned, In Development, Review, Awaiting Client, Completed, Active Maintenance, Suspended, Archived], priority, start_date, deadline, delivery_date, contract_value, currency, maintenance_status, internal_notes, tags. Favorite per user.

Overview: info, client, site, status, progres taskuri, ultima activitate/commit/deployment, facturi+plăți, costuri recurente, următoarea mentenanță, probleme active.

Timeline (activities, append-only): creare, status, modificări, commit, deploy, task creat/finalizat, observații, comentarii, email, factură, plată, infrastructură, reînnoire domeniu, mentenanță; manual+automat. Câmpuri: at, actor (user/integrare), type, description, entity_type, entity_id.

## §6 Clients

company_name, legal_name, cui, reg_com, vat_status, country, city, address, postal_code, website, industry; contact_person, position, phone, primary_email, billing_email; contacts suplimentare (tabel); payment_terms, preferred_currency, payment_method, status, internal_notes. Pagină: proiecte, facturi, plăți, contracte, documente, comunicare, activitate.

## §7 Infrastructure

Servers: name, provider[Hetzner, DigitalOcean, AWS, Contabo, VPS, Other], ip, os, type[Production, Development, Staging, Database, Storage, Other], ssh_port, ssh_username, ssh_key_ref, location, cpu, ram, disk, status, purchase_date, renewal_date, monthly_cost, currency, notes. M:N cu proiecte.

Services: name[Nginx, Apache, Node.js, PM2, MongoDB, PostgreSQL, Redis, Docker, Cloudflare, Other], version, port, status, config_path, project, notes.

Domains: domain, registrar, registration_date, expiration_date, auto_renewal, dns_provider, nameservers, project, renewal_cost, currency, status; dns_records (type,name,value,ttl).

SSL: domain, issuer, issue_date, expiration_date, auto_renewal, status, last_checked.

Hosting: provider, plan, monthly_cost, currency, billing_cycle, next_payment_date, project, payment_status.

Vault: name, type[SSH, Server Password, Database, FTP/SFTP, WordPress Admin, Shopify Admin, cPanel, Cloudflare, GitHub Token, API Key, SMTP, Other], project, server, username, secret, url, notes, revoked_at, rotated_at. AES-256-GCM cu VAULT_MASTER_KEY din env; secretul nu apare în API-uri obișnuite, loguri, erori; reveal = endpoint separat cu permisiune + re-confirmare parolă/2FA + audit; rotire și revocare.

## §8 GitHub (API + Webhooks reale)

Repositories: name, url, owner, default/dev/prod branch, visibility, last_sync, status, project. Commits: hash, message, author, author_email, date, branch, files_changed, additions, deletions, url. PRs: number, title, author, status, created, merged, head/base, url. Releases: version, tag, notes, date, repo. Webhooks push/pull_request/release/deployment: HMAC SHA-256 verificat pe raw body, dedupe pe X-GitHub-Delivery. Commit ≠ deployed.

## §9 Deployments

project, repo, commit_hash, branch, environment, server, date, triggered_by, status[Pending, Running, Successful, Failed, Cancelled, Rolled Back], logs, url. Înregistrare + GitHub deployment events. Fără execuție SSH din browser; rollback doar ca status înregistrat, nesimulat.

## §10 Tasks & Observations

Tasks: title, description, project, client, priority[Low, Medium, High, Critical], status[Backlog, To Do, In Progress, In Review, Blocked, Completed], due, completed_at, estimated/actual hours, attachments, comments, dependencies. Kanban, listă, calendar, filtre, search, sort. Observations: title, description, project, author, date, priority, attachments, status, conversie în task. Manual Update Log: text legat de commit/deployment/task.

## §11 Maintenance

Plan[Basic, Standard, Premium, Custom] pe proiect: monthly_price, currency, start, renewal, included_services, frequency, contract_status. Activități: Website Updates, Dependency Updates, Security Checks, Backup Verification, Performance Checks, SEO Checks, Form Testing, SSL Checks, Database Maintenance. Taskuri recurente, notificări, log intervenții.

## §12 Finance (evidență, nu contabilitate)

Invoices: number, client, project, issue_date, due_date, currency, subtotal, vat, total, status[Draft, Issued, Partially Paid, Paid, Overdue, Cancelled], file, external_id; items. Payments (N per factură): invoice, amount, currency, date, method, reference, notes; sold calculat. Expenses: name, category[Server Costs, Hosting, Domains, Licenses, Software, Third-party Services, Advertising, Other], supplier, project, amount, currency, date, recurring, attachment. Profit proiect = venit − costuri directe. Rapoarte pe proiect/client/perioadă, separate pe monedă; conversii doar cu cursuri datate. Bani în minor units (integer). Extensibil SAGA.

## §13 Documents

Tipuri: Contracts, Commercial Offers, Invoices, Payment Proofs, GDPR Documents, Technical Documentation, Project Specifications, Delivery Reports, Other. name, type, client, project, upload_date, expiration, version, file, notes. Upload, download, preview, version history, search, filtre, permisiuni, linkuri temporare semnate. Storage local sau S3-compatible.

## §14 Notifications

Resend pt. email. Destinatar implicit: emailul proprietarului. Evenimente: New Project, New Task, Task Deadline, Overdue Task, New Commit, Failed Deployment, Server Down, SSL Expiration, Domain Expiration, Invoice Issued, Invoice Due, Invoice Overdue, Payment Received, Maintenance Reminder, Backup Failed. Reguli: destinatari, template HTML, subject, variabile, enable, frecvență, retry, delivery logs. Notification Center în app. Deduplicare + rate limit.

## §15 Monitoring

Website: HTTP status, response time, SSL expiry, disponibilitate, DNS. Server: CPU/RAM/disk/uptime/servicii doar cu agent securizat, altfel "neconectat". Incidents: name, project, server, start, end, severity, status, description, resolution. SSRF protection la verificări.

## §17 Reports

Projects, Clients, Revenue, Expenses, Profitability, Maintenance, Tasks, Server Costs, Domain Renewals. Filtre: perioadă, client, proiect, status, monedă, categorie. Export CSV și Excel.

## §18 Global Search

Client, proiect, domeniu, IP, repo, commit hash, nr. factură, task, contract, document; grupat pe categorii; respectă permisiunile.

## §19 Security

Auth, sesiuni în DB, scrypt, RBAC, TOTP 2FA, login history, audit log, revocare sesiuni, reset parolă. Audit: create, update, delete, login, logout, credential access, financial changes, permission changes, document downloads. Soft delete unde e potrivit. Validare Zod, rate limit, CSRF, CORS restrictiv, helmet/CSP.

## §22 UX

Quick actions, keyboard nav, breadcrumbs, recent items, favorite, confirm dialogs, sidebar responsive.

## §23 Date inițiale

Proiecte reale de introdus ulterior de admin (fără date inventate): Team Stoica teamstoica.ro, XELLE xelle.ro, BeautyVilla beautyvilla.ro, IV Concept ivconcept.ro, Event Smart Assistant event-smart-assistant.com, Amber Cloud amber-cloud.vip. Fără conectări automate la servere/repo.

## §24 Teste

Auth, authz, CRUD, relații, webhook, calcule factură, plăți parțiale, monede, notificări, criptare, permisiuni documente, search, paginare, erori.

## §25 Faze

1 Fundație (arhitectură, DB, auth, RBAC, design system, layout, dashboard). 2 Clients, Projects, Overview, Tasks, Observations, Timeline. 3 Servers, Domains, SSL, Hosting, Vault. 4 GitHub, Deployments. 5 Finance. 6 Maintenance, Documents, Notifications, Email. 7 Monitoring, Reports, Automatizări. După fiecare: teste, fix, docs, PROJECT_STATUS.md.

## §26 Docs

docs/: architecture, database, api, env, install, deploy, github, email, security, backup. PROJECT_STATUS.md: module gata/în lucru/neimplementate, integrări configurate/care cer credentials, probleme cunoscute, pași următori. Interfață fără backend ≠ gata.

## Scoase intenționat

Client Portal, rol client, solicitări clienți, echipă/membri proiect, asignare taskuri, invitații, UI utilizatori/roluri. Se pot readăuga din istoricul git.
