# Visuvate — React (Vite) + server

Conversie 1:1 a site-ului visuvate.com în React 19 + Vite + GSAP 3.15 + Lenis, cu toate rutele din sitemap.

## Comenzi
- `npm install`
- `npm run dev` — server de dezvoltare (Vite cu HMR + API) pe http://localhost:3000
- `npm run build` — build de producție în `dist/`
- `npm start` — server de producție din `dist/` (rulează întâi `npm run build`)
- `npm run preview` — build + server de producție
- `npm run lint` — verificare TypeScript

## Server (`server/`)
- Livrează toate rutele aplicației; URL-urile necunoscute primesc status 404 și pagina 404 a aplicației.
- `POST /api/contact` primește formularul de contact (multipart), validează aceleași reguli ca formularul,
  ignoră spam-ul (câmpul honeypot `company_website`), limitează la 5 mesaje / 10 minute per IP
  și salvează mesajele în `data/contacts.json` (scriere atomică).

Variabile de mediu: `PORT` (implicit 3000), `HOST` (implicit 0.0.0.0), `CONTACTS_FILE` (implicit `data/contacts.json`),
`NODE_ENV=production` (echivalent cu `--prod`).

## Texte (`source_data.json`)
Toate textele vizibile din site (meniuri, secțiuni, pagini, butoane, mesaje de eroare, `alt`/`aria-label`,
titlurile din tab, articolele de blog, lista de țări) sunt în `source_data.json`, grupate pe scope:
- `"/contact"`, `"/works/tubwell"`, … — paginile (URL-ul rutei); `"404"` — pagina inexistentă
- `"components/layout/Header"`, … — componentele comune (calea din `src/`)

Modifici valoarea, iar site-ul se actualizează (în `npm run dev` imediat, în producție după `npm run build`).
Nu redenumi cheile — codul le citește cu `$t('cheie')`. Valorile articolelor de blog conțin HTML.

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
