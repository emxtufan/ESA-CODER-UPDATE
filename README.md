# ESA Coder Solutions — React (Vite) + server

Conversie 1:1 a site-ului visuvate.com în React 19 + Vite + GSAP 3.15 + Lenis, cu toate rutele din sitemap.

## Comenzi
- `npm install`
- `npm run dev` — server de dezvoltare (Vite cu HMR + API) pe http://localhost:5000
- `npm run build` — build de producție în `dist/`
- `npm start` — server de producție din `dist/` (rulează întâi `npm run build`)
- `npm run start:env` — server de producție cu variabile citite din `.env`
- `npm run preview` — build + server de producție
- `npm run lint` — verificare TypeScript

## Asistent AI
Chatbot RAG multi-provider, cu admin în `/admin` → AI Assistant. Detalii: AI_ASSISTANT.md. Teste: `npm run test:ai`, `npm run test:ai-eval`.

## Server (`server/`)
- Livrează toate rutele aplicației; URL-urile necunoscute primesc status 404 și pagina 404 a aplicației.
- `POST /api/contact` primește formularul de contact (multipart), validează aceleași reguli ca formularul,
  ignoră spam-ul (câmpul honeypot `company_website`), limitează la 5 mesaje / 10 minute per IP
  și salvează mesajele în `data/contacts.json` (scriere atomică).

Variabile de mediu: `PORT` (implicit 5000), `HOST` (implicit 0.0.0.0), `CONTACTS_FILE` (implicit `data/contacts.json`),
`NODE_ENV=production` (echivalent cu `--prod`).

## Texte (`source_data.json`)
Toate textele vizibile din site (meniuri, secțiuni, pagini, butoane, mesaje de eroare, `alt`/`aria-label`,
titlurile din tab, articolele de blog, lista de țări) sunt în `source_data.json`, grupate pe scope:
- `"/contact"`, `"/works/tubwell"`, … — paginile (URL-ul rutei); `"404"` — pagina inexistentă
- `"components/layout/Header"`, … — componentele comune (calea din `src/`)

Modifici valoarea, iar site-ul se actualizează fără rebuild (în producție prin `/content.js`).
Nu redenumi cheile — codul le citește cu `$t('cheie')`. Valorile articolelor de blog conțin HTML.

## Admin pe secțiuni (`/admin`)
Meniul urmează secțiunile vizibile ale site-ului: **Setări globale** (Header, Footer) și **Homepage** (Hero, Tools & Platforms, Intro, Works, Services, Marquee, Pricing, Approach, Testimonials, FAQs). Fiecare secțiune arată strict câmpurile ei.
- Lista câmpurilor editabile e în `server/sections.json` (singura „listă albă”: nu se editează clase CSS, id-uri, ARIA sau animații). Cheile secțiunilor sunt stabile.
- Salvare pe secțiune (`PUT /api/admin/sections/<cheie>`), cu verificare de conflict (`rev`) și validare; o secțiune nu suprascrie alta.
- Emailul de contact e o singură valoare (`global/Site`), folosită în Header și Footer. Butonul „Let's connect” are un singur link (`cta-link`).
- Colecții noi: `tools`, `services`, `marquee`, `plans`; `projects`, `testimonials`, `faqs` au câmpul `published` (ascunde fără a șterge).
- Editorul vechi complet rămâne la `/admin/advanced` (pentru texte rare).
- Migrarea datelor: `node scripts/migrate-sections.mjs [--dry]` (idempotentă, backup în `data/`).
- Teste în browser: `npm i` apoi `ADMIN_PASSWORD=… npm run test:e2e` (cu serverul pornit).

## Admin (`/admin`)
Editor pentru texte și imagini, pe secțiuni: alegi secțiunea din stânga, înlocuiești imaginile (click pe imagine)
și modifici textele, apoi **Salvează** (sau ⌘S / Ctrl+S).
- Parola: variabila `ADMIN_PASSWORD`; dacă lipsește, se generează una la prima pornire, se afișează în consolă
  și se păstrează în `data/admin-password.txt`.
- Admin-ul arată doar textele vizibile pe site și imaginile. Textele din ilustrațiile decorative, cele pentru
  cititoare de ecran și interfața editorului din Hero rămân în `source_data.json`, dar nu apar în admin
  (lista e generată automat de `scripts/admin-index.mjs` în `server/admin-visible.json`, la `npm run dev` / `npm run build`).
- Textele se scriu în `source_data.json`. În producție site-ul le citește din `/content.js`, deci modificările
  apar imediat, fără rebuild. Imaginile se înlocuiesc la aceeași cale (în `public/` și în `dist/`), cu același format.

## Colecții (adăugare de conținut din admin)
În admin, grupul **Colecții** permite adăugarea, editarea, reordonarea și ștergerea de:
proiecte (`/works/<adresă>`), articole și categorii de blog (`/blog/<adresă>`, `/blog/category/<cheie>`),
template-uri, recenzii, întrebări frecvente și **pagini noi** (`/<adresă>`, cu titlu și conținut HTML).
- Datele stau în `source_data.json` → `_collections`; formularele din admin sunt descrise în `server/schema/*.json`.
- Paginile de proiect și de articol folosesc un singur template (`src/templates/`); listele (grila /works, hero și
  caruselul de pe prima pagină, „More projects”, „Recent work” din servicii, /blog, categorii, template-uri, recenzii,
  FAQ și datele structurate SEO) se construiesc din colecții.
- Ordinea din admin = ordinea pe site. Proiectele apar în hero / pe prima pagină dacă au „Poziție în hero” / „Poziție pe prima pagină”.
- `scripts/data-merge.mjs` modifică `source_data.json` din scripturi în siguranță; `scripts/ssr-check.mjs` randează
  toate paginile pentru verificare (`--compare dirA dirB`).

Detalii despre conversie și harta modulelor: `PLAN.md`.

## Publicare pe hosting

Aplicația necesită Node.js 22.12 sau mai nou, proces persistent și disc inscriptibil. Un hosting exclusiv PHP/static și încărcarea doar a folderului `dist/` nu sunt suficiente: contactul, adminul și randarea paginilor folosesc serverul Node.

1. Păstrează proiectul complet, inclusiv `server/`, `src/` (folosit la indexarea adminului), `public/`, `source_data.json` și fișierele de configurare. Instalează dependențele pe sistemul de operare al serverului cu `npm ci`; nu copia `node_modules` din Windows.
2. Rulează `npm run lint`, `npm run test:seo` și `npm run build`.
3. Configurează variabilele din `.env.example`. Pentru un proxy local, folosește `HOST=127.0.0.1`. Într-un serviciu administrat care impune ascultarea externă, setează `HOST=0.0.0.0` și portul cerut de furnizor. `SITE_URL` este originea HTTPS publică, fără subdirector.
4. Pornește cu `npm start` dacă hostingul furnizează variabilele sau `npm run start:env` dacă folosești `.env`. Configurează repornirea automată la cădere/reboot în managerul de procese al hostingului. Rulează **o singură instanță**: stocarea JSON nu este proiectată pentru procese multiple.
5. Termină HTTPS la proxy și redirecționează HTTP spre HTTPS. Trimite cererile către Node; nu expune directorul proiectului printr-un server de fișiere. Proxy-ul local trebuie să rescrie `X-Forwarded-For` și `X-Forwarded-Proto`. Aplicația are încredere numai în proxy-uri loopback; pentru un proxy la distanță trebuie confirmate adresele furnizorului înainte de schimbarea acestei reguli.
6. Configurează SMTP în admin sau copiază în siguranță configurația existentă în `SMTP_FILE`. Verifică livrarea reală și răspunsul automat din admin înainte de deschiderea publică. Configurațiile din `data/` sunt excluse din Git și nu ajung automat pe hosting.

### Persistență, backup și actualizări

- Păstrează permanent fișierele indicate prin `CONTENT_FILE`, `CONTACTS_FILE`, `ANALYTICS_FILE`, `SMTP_FILE`, `RECAPTCHA_FILE`, precum și `data/admin-password.txt` dacă nu folosești `ADMIN_PASSWORD`. Pentru deploy-uri care înlocuiesc proiectul, aceste căi trebuie să indice un volum persistent. La prima instalare copiază conținutul actual în acel volum; la actualizări nu îl suprascrie cu versiunea din Git.
- Păstrează și `public/`, inclusiv imaginile înlocuite și `public/uploads/`, plus `data/image-originals/`. Build-ul copiază imaginile din `public/` în `dist/`; un checkout nou cu imaginile inițiale ar pierde modificările făcute în admin. `dist/` poate fi regenerat; cache-ul de imagini poate fi reconstruit.
- Înainte de actualizare fă o copie coerentă a conținutului, imaginilor și fișierelor de date, cu procesul oprit. Backup-urile cu cereri și parole trebuie să rămână private, cu acces limitat; nu le pune în `public/` sau `dist/`. Configurează backup-ul automat și testează restaurarea pe infrastructura aleasă.
- Confirmă durata de păstrare pentru cereri, vizite detaliate/IP, emailuri, loguri și backup-uri. Modulul `/admin/gdpr` permite simulare, aprobare și execuție a retenției; toate regulile noi sunt inactive. Păstrează `GDPR_DIR` și cheia lui pe volum privat persistent, separat de copiile vechi ale datelor. Vezi [procedura GDPR](GDPR_IMPLEMENTATION_REPORT.md) înainte de activare sau restaurare.
- Logurile noi ale cererilor conțin numai data și identificatorul cererii. Logurile și backup-urile vechi pot conține date personale; verifică separat accesul și retenția lor.

### Verificări înainte de lansare

- Testează accesul direct și navigarea între pagini, `/admin`, formularul și livrarea emailului, HTTPS, consentul pentru statistici, retragerea acestuia și restaurarea backup-ului.
- Pentru verificări automate într-un mediu izolat: `npm run test:launch` (pornește singur un server de test) și `npm run test:privacy` (necesită server de test la `http://127.0.0.1:5117`). Nu executa testele admin care modifică conținut pe producție.
- Cele 7 articole importate și testimonialul care menționează Visuvate sunt nepublicate, dar păstrate în admin. Conturile LinkedIn/X ale Visuvate au fost eliminate din footer. Publică numai conținut propriu sau pentru care ai drept de utilizare și verifică apartenența celorlalte proiecte și testimoniale.
- Politicile se editează integral în **Admin → Avansat → Pagini**. Validarea juridică, furnizorul de hosting, retenția și verificările pe domeniul live rămân necesare; trecerea testelor locale nu confirmă singură conformitatea GDPR.
