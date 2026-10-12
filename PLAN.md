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

## Probleme deschise
- Formularul de contact face POST la `/api/contact` (ca originalul) — nu există backend; trimiterea afișează eroarea.
- Modulul 5347 (conversie Google Ads pe thank-you) și 4438 (GA) omise intenționat.
- Pentru găzduire statică e nevoie de fallback SPA (toate rutele → index.html); `npm run preview` îl are.
