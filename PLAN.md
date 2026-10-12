# PLAN — conversie 1:1 visuvate.com → React (Vite)

## Obiectiv
Proiectul reproduce 1:1 pagina principală visuvate.com (captura din `ORG/`) ca aplicație React + Vite:
același DOM/clase, același CSS compilat, aceleași animații (GSAP 3.15 + SplitText + ScrollTrigger, Lenis 1.3.26, WebGL custom).

## Decizii
- Conținut: Visuvate 1:1 complet (texte, logo, imagini) — ales de utilizator.
- Munca ESA anterioară e salvată pe branch-ul `backup-esa`.
- Sursa adevărului: payload-ul RSC din HTML-ul live + chunk-urile JS compilate de pe visuvate.com
  (fără source maps). Componentele server sunt generate automat din RSC; componentele client sunt portate manual din codul compilat.
- CSS: fișierele originale `src/styles/fonts.css` + `src/styles/site.css` (Tailwind v4 deja compilat) — fără Tailwind la build.
- Asset-uri: descărcate de pe visuvate.com cu aceleași căi în `public/`.
- `next/link` → `src/components/Link.tsx` (<a>), `next/navigation` → `src/lib/navigation.ts`, `next/image` → `<img>` cu URL direct.
- Google Analytics/Ads (modulul 4438) NU e preluat (ID-urile sunt ale Visuvate).

## Hartă module (id compilat → fișier)
| id | fișier |
|---|---|
| 9082 | components/layout/SmoothScroll.tsx |
| 7302 | components/layout/SectionVisibility.tsx |
| 1790 | components/layout/CookieBanner.tsx |
| 1203 | components/layout/CookieSettingsButton.tsx |
| 513 | components/layout/Header.tsx |
| 5144 | components/layout/FooterMark.tsx |
| 9484 | components/layout/PageTransition.tsx |
| 1394 | components/RollText.tsx |
| 5783 | components/Logo.tsx |
| 9581 | components/ShineBorder.tsx |
| 7649 / 3722 | components/motion/Reveal.tsx / RevealBatch.tsx |
| 1946 | lib/scrollLock.ts |
| 9740 | lib/slugify.ts |
| 1659 | components/sections/Hero.tsx |
| 8447 | components/sections/TechStack.tsx |
| 5385 | components/sections/Introduction.tsx |
| 3572 (+1850) | components/sections/Works.tsx (+ components/ShaderCanvas.tsx) |
| 4766 | components/sections/Services.tsx |
| 5382 (+6635) | components/sections/Testimonials.tsx (+ lib/webgl.ts) |
| 5540 | components/sections/Faqs.tsx |
| 6057, 1357, 4398, 4956 | components/approach/* |
| server | pages/Home.tsx, layout/SiteLayout.tsx, layout/Footer.tsx, sections/Marquee.tsx, Pricing.tsx, Approach.tsx (generate) |

## Pași
- [x] Backup ESA pe `backup-esa`
- [x] Descărcat HTML live, CSS, chunk-uri JS, 131 asset-uri
- [x] Generator RSC → JSX; generat componentele server
- [x] Infrastructură: package.json, vite, tsconfig, index.html, module partajate
- [x] Portare componente client (agenți)
- [x] Build + typecheck (tsc 0 erori, vite build OK)
- [x] Comparație: SSR DOM vs live.html identic (diferențe doar din streaming Next/preload); capturi Edge headless identice cu visuvate.com
- [ ] Verificare manuală interacțiuni (meniu mobil, temă, cookie, hero studio, FAQ) în browser real

## Etapa 2 — toate rutele
- [x] Descărcate toate cele 68 de URL-uri din sitemap + /contact/thank-you + pagina 404 (`tools` în %TEMP%\vv)
- [x] Generat câte o pagină per URL în `src/pages/**` din payload-ul RSC; tabel de rute în `src/routes.ts` (lazy, code-split)
- [x] Router client propriu în `src/lib/navigation.ts` (API next/navigation: usePathname reactiv, router.push cu pushState);
      `Link` navighează client-side; `PageTransition` (original) interceptează click-urile; `RouteView` setează titlul și scroll la #hash;
      URL necunoscut → `src/pages/NotFound.tsx` (fără layout, ca în original)
- [x] Portate modulele client noi: ContactForm, WorksGrid, WorkShots, TemplatesGrid, filtre/carduri, CategorySelect,
      ArticleCodeBlocks, ArticleLightbox, HeadingReveal, ParallaxDrift, PageTitle, AuroraImage, BadgeImage, ServicesBackdrop, IconCloud
- [x] 408 asset-uri noi în `public/`
- [x] Verificare: SSR pe fiecare pagină vs. HTML original (98,6–99,5%, diferențe doar din harness), test CDP în Edge:
      15 rute încărcate direct + navigare prin click + history.back, fără erori JS

## Etapa 4 — texte centralizate
- [x] `source_data.json` (rădăcina proiectului): ~3000 de texte în 98 de scope-uri (pagini + componente), plus titlurile paginilor și lista de țări
- [x] Codemod pe AST TypeScript (`%TEMP%v	ools\extract_texts.mjs`): textele din JSX, atributele text, datele (title/name/quote…) și HTML-ul articolelor → `$t('cheie')`; accesor în `src/lib/text.ts`
- [x] Verificat: toate cele 3567 de chei există, nicio intrare nefolosită; HTML-ul randat al celor 70 de pagini e identic byte cu byte cu cel de dinainte; navigare + formular OK
- Rămase în cod (nu sunt texte afișate direct): harta fus orar → țară (`timeZoneCountries.ts`, folosită la preselectare), JSON-LD din pagini, meta-urile din `index.html`

## Etapa 5 — admin
- [x] `/admin` (shadcn/Apple): secțiune → imagini → texte; parolă (ADMIN_PASSWORD sau generată în data/), sesiune HMAC 7 zile
- [x] Producție: textele vin din `/content.js` (fișierul live), deci editările apar fără rebuild; imaginile se înlocuiesc pe loc
- [x] Admin arată doar textele vizibile (`scripts/admin-index.mjs` → `server/admin-visible.json`)

## Etapa 6 — colecții
- Decizie: conținutul repetabil devine colecții în `source_data.json` → `_collections`: projects, testimonials,
  posts, postCategories, templates, faqs, pages (pagini noi). Rute dinamice `/works/:slug`, `/blog/:slug`,
  `/blog/category/:key`, `/:slug` (`src/lib/dynamicRoutes.ts` + `server/routes.mjs`), template-uri în `src/templates/`.
- Schema pentru admin per colecție: `server/schema/<nume>.json`.
- `source_data.json` se modifică din scripturi doar prin `scripts/data-merge.mjs` (lock + scriere atomică).
- Verificare: `scripts/ssr-check.mjs` randează prin router; referința dinainte = %TEMP%vase2 (70 de pagini, deterministă).
- Backup înainte de etapă: %TEMP%vackup-before-collections.zip
- [x] proiecte (40) + recenzii (3) · [x] blog: 7 articole + 2 categorii · [x] template-uri (24), FAQ (6), pagini noi · [x] admin colecții
- [x] integrare: JSON-LD FAQ/recenzii din colecții, „Recent work” din servicii din colecție, câmpuri goale ascunse în template-ul de proiect
- [x] verificat: 70/70 pagini identice byte cu byte cu referința; tsc + build OK; test în browser: proiect nou adăugat din admin → pagină 200 + apare în /works; API: pagină nouă + articol nou → 200; adresă rezervată refuzată
- Nu sunt colecții (rămân editabile doar ca texte/imagini): cele 10 servicii (ilustrații unice), About, Contact, Privacy, Terms

## Probleme deschise
- Modulul 5347 (conversie Google Ads pe thank-you) și 4438 (GA) omise intenționat.
- Mesajele de contact se salvează doar local (fără notificare pe email).

## Etapa 3 — server
- [x] `server/index.mjs` (Express 5): dev = Vite middleware, prod = `dist/` + toate rutele (404 real pentru URL-uri necunoscute, din `dist/routes.json` generat la build)
- [x] `POST /api/contact` → validare, honeypot, rate limit 5/10 min/IP, salvare atomică în `data/contacts.json` (în .gitignore)
- [x] Testat: rute 200/404, cache imutabil pe /assets, validări 422, 429, trimitere reală din formular în Edge headless → /contact/thank-you + intrare în JSON
