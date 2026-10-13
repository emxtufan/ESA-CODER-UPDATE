// Custom software for companies (ERP for companies, workflow automation, invoices, accounting, fleet, sites, equipment): one row
// laid out like Approach's first one, a coded dashboard mock-up (scaled down, cropped by its card) next to the options.
// The texts are edited in the admin (Homepage › Custom software); the dashboard's figures are an illustration
// (aria-hidden), not data.
import {useEffect, useRef, useState, type ReactNode} from 'react';
import gsap from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
import {useGSAP} from '@gsap/react';
import Grainient from '@/components/Grainient';
import Link from '@/components/Link';
import HeadingReveal from '@/components/motion/HeadingReveal';
import Reveal from '@/components/motion/Reveal';
import RollText from '@/components/RollText';
import '@/styles/software.css';

import {text} from '@/lib/text';

const $t = text("components/sections/Software");

gsap.registerPlugin(ScrollTrigger, useGSAP);

/** The option lists (here and in Automation): `is-in` once on screen (items come in one after another), `is-live` while
 * on screen (a highlight walks down the icons). The timing is in software.css, per item from `--i`. */
export function useOptionsInView() {
  const ref = useRef<HTMLUListElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      el.classList.toggle('is-live', e.isIntersecting);
      if (e.isIntersecting) el.classList.add('is-in');
    }, {threshold: 0.25});
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return ref;
}

function useLightTheme() {
  const read = () => typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'light';
  const [light, setLight] = useState(read);
  useEffect(() => {
    const observer = new MutationObserver(() => setLight(read()));
    observer.observe(document.documentElement, {attributes: true, attributeFilter: ['data-theme']});
    return () => observer.disconnect();
  }, []);
  return light;
}

const icon = (d: ReactNode) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    {d}
  </svg>
);
export const ICONS = {
  home: icon(<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />),
  users: icon(<><circle cx="9" cy="8" r="3.2" /><path d="M3 20c.6-3.2 3-5 6-5s5.4 1.8 6 5" /><path d="M16 4.6a3.2 3.2 0 0 1 0 6.3M18 15.3c1.7.6 2.7 2.2 3 4.7" /></>),
  flow: icon(<><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /><path d="M6.5 10v4a3 3 0 0 0 3 3H14M17.5 14v-4a3 3 0 0 0-3-3H10" /></>),
  invoice: icon(<><path d="M6 3h9l4 4v14l-2.5-1.5L14 21l-2.5-1.5L9 21l-2.5-1.5L4 21V5a2 2 0 0 1 2-2z" /><path d="M8 9h6M8 13h8M8 17h4" /></>),
  calc: icon(<><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 7h8M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15v3M8 18h4" /></>),
  truck: icon(<><path d="M2 6h11v10H2zM13 9h4.5L21 12.5V16h-8z" /><circle cx="6" cy="18" r="2" /><circle cx="17" cy="18" r="2" /></>),
  crane: icon(<><path d="M5 21V4h1.5L18 7.5M6.5 4 5 7.5M5 11h7" /><path d="M16 7v6M14 13h4v3h-4zM3 21h6" /></>),
  tool: icon(<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18v3h3l6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.4-.6-.6-2.4z" />),
  chart: icon(<path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />),
  search: icon(<><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>),
  bell: icon(<path d="M6 16V11a6 6 0 1 1 12 0v5l2 2H4zM10 21h4" />),
  check: icon(<path d="m5 12.5 4.5 4.5L19 7.5" />),
  scan: icon(<><path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3" /><path d="M7 12h10" /></>),
  clock: icon(<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>),
  bank: icon(<path d="M3 9.5 12 4l9 5.5M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20h18" />),
  plane: icon(<path d="M21 3 3 10.5l7 2.5 2.5 7zM10 13 21 3" />),
};

const FEATURES = [
  {icon: ICONS.users, title: 'feature-1-title', text: 'feature-1-text'},
  {icon: ICONS.flow, title: 'feature-2-title', text: 'feature-2-text'},
  {icon: ICONS.invoice, title: 'feature-3-title', text: 'feature-3-text'},
  {icon: ICONS.calc, title: 'feature-4-title', text: 'feature-4-text'},
  {icon: ICONS.truck, title: 'feature-5-title', text: 'feature-5-text'},
  {icon: ICONS.crane, title: 'feature-6-title', text: 'feature-6-text'},
];

export default function Software() {
  const light = useLightTheme();
  const options = useOptionsInView();
  return (
    <section id="software" className="sw-section bg-bg">
      <div className="mx-auto max-w-[1380px] px-6 md:px-8">
        <HeadingReveal scroll>
          <h2 className="font-display text-[clamp(38px,4.6vw,64px)] leading-[1] font-medium tracking-h1">
            {$t("title")}<span className="vv-accent">{$t("title-accent")}</span>
          </h2>
        </HeadingReveal>
        <Reveal refreshOnComplete>
          {/* same row as Approach's first one: 775 / 540, 593px tall on large screens */}
          <div className="mt-10 grid gap-5 min-[751px]:grid-cols-[775fr_540fr] lg:h-[593px]">
            <article data-reveal className="relative isolate overflow-hidden rounded-[12px] border border-fg/20 bg-card lg:min-h-0 min-h-[391px]">
              <div className="absolute inset-0 -z-10" aria-hidden>
                <Grainient
                  colors={['#000000', '#00111f', '#003d66', '#0099ff', '#7acaff']}
                  angle={135}
                  flow={0.8}
                  silk={0.35}
                  grainAmount={0.08}
                  type="linear"
                  bands={1}
                  softness={1}
                  scale={1}
                  speed={1}
                  grainSize={1.2}
                  grainAnimated
                  contrast={1}
                  saturation={1}
                  variation={0}
                  interactive
                  stir={1}
                  clickSwirl
                  intro
                  lightMode={light}
                />
              </div>
              <div className="relative z-10 px-5 py-8 lg:px-9 lg:pt-[45px] lg:pb-0">
                <h3 className="font-display text-[clamp(24px,2.6vw,36px)] leading-[1.1] font-medium tracking-h2">{$t("app-title")}</h3>
                <p className="mt-2 text-[12px] leading-[1.6] text-fg-muted lg:mt-3 lg:text-lead">
                  <span>{$t("app-text-1")}</span>
                  <span className="text-fg">{$t("app-text-2")}</span>
                  <span>{$t("app-text-3")}</span>
                </p>
              </div>
              <div className="sw-stage" aria-hidden>
                <div className="sw-app">
                  <Dashboard />
                </div>
              </div>
            </article>
            <article data-reveal className="relative isolate flex flex-col overflow-hidden rounded-[12px] border border-fg/20 bg-card lg:min-h-0">
              <div className="sw-build relative z-10 flex h-full flex-col px-5 py-8 lg:px-9 lg:pt-[45px]">
                <h3 className="font-display text-[clamp(24px,2.6vw,36px)] leading-[1.1] font-medium tracking-h2">{$t("build-title")}</h3>
                <ul ref={options} className="sw-options" style={{'--n': FEATURES.length} as React.CSSProperties}>
                  {FEATURES.map((f, i) => (
                    <li key={f.title} style={{'--i': i} as React.CSSProperties}>
                      <span className="sw-option-icon">{f.icon}</span>
                      <span>
                        <b>{$t(f.title)}</b>
                        <small>{$t(f.text)}</small>
                      </span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={$t("cta-link")}
                  className="sw-cta mt-6 inline-flex w-fit items-center rounded-full border border-transparent bg-fg px-[15px] py-[9px] text-[14px] leading-none font-medium text-bg transition-colors hover:bg-fg-strong"
                >
                  <RollText text={$t("cta")} />
                </Link>
              </div>
            </article>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// The dashboard illustration: an operations app for a construction / services company. Every figure is made up.
// ---------------------------------------------------------------------------
const NAV: [keyof typeof ICONS, string, number?][] = [
  ['home', 'Prezentare'], ['users', 'Clienți'], ['flow', 'Automatizări', 3], ['invoice', 'Facturi și chitanțe'],
  ['calc', 'Contabilitate'], ['truck', 'Flotă'], ['crane', 'Șantiere'], ['tool', 'Scule și echipamente'], ['chart', 'Rapoarte'],
];
// the tabs with a screen of their own: nav index → title, subtitle
const VIEWS: Record<number, [string, string]> = {
  0: ['Prezentare', 'Bună dimineața, Andrei. Azi ai 3 lucruri de rezolvat.'],
  1: ['Clienți', '38 de clienți activi · 6 oferte așteaptă răspuns'],
  3: ['Facturi și chitanțe', 'Octombrie · 42 emise, 2 restante'],
  5: ['Flotă', '24 de vehicule · următorul ITP în 5 zile'],
  6: ['Șantiere', '12 șantiere active · 148 de oameni pe șantier azi'],
};
const COSTS = [62, 58, 71, 66, 79, 74, 88]; // monthly costs, k€
const QUERY = 'B-77-ESA'; // what the fake cursor types in the search box; the Fleet row it opens

const BLUE = 'var(--sw-blue)';
const GREEN = 'var(--sw-green)';
const AMBER = 'var(--sw-amber)';
const RED = 'var(--sw-red)';
const GREY = 'var(--vv-text-subtle)';
const tint = (c: string) => ({color: c, background: `color-mix(in srgb, ${c} 14%, transparent)`});
const Tag = ({c, children}: {c: string; children: ReactNode}) => <span className="sw-tag" style={tint(c)}>{children}</span>;

const SITES: [string, string, number, number, string][] = [
  ['Bloc rezidențial', 'Floreasca', 72, 14, 'dec.'],
  ['Hală logistică A1', 'Ploiești', 45, 9, 'mar.'],
  ['Amenajare birouri', 'Pipera', 88, 6, 'nov.'],
  ['Parc comercial, etapa 2', 'Militari', 31, 22, 'mai'],
  ['Renovare hotel', 'Brașov', 57, 11, 'feb.'],
  ['Acoperiș depozit', 'Chiajna', 94, 5, 'oct.'],
];
const CLIENTS: [string, string, string, string, number][] = [
  ['Carpați Logistic', 'Mihai Pop', 'Câștigat', GREEN, 126500],
  ['Vitra Residence', 'Elena Stan', 'Negociere', AMBER, 82000],
  ['Delta Retail Park', 'Radu Ene', 'Câștigat', GREEN, 64800],
  ['Nordic Build', 'Ioana Radu', 'Ofertă trimisă', BLUE, 48200],
  ['Urban Office Pipera', 'Dan Ilie', 'Ofertă trimisă', BLUE, 37900],
  ['Alpin Hotels', 'Ana Matei', 'Potențial', GREY, 19500],
];
const INVOICES: [string, string, string, number, string, string][] = [
  ['#INV-0418', 'Carpați Logistic', '28 oct.', 18400, 'Trimisă', BLUE],
  ['#INV-0417', 'Vitra Residence', '21 oct.', 9750, 'Plătită', GREEN],
  ['#INV-0416', 'Nordic Build', '09 oct.', 2360, 'Restantă', RED],
  ['#INV-0415', 'Delta Retail Park', '30 oct.', 12900, 'Trimisă', BLUE],
  ['#INV-0414', 'Urban Office Pipera', '05 oct.', 1740, 'Restantă', RED],
  ['#INV-0413', 'Alpin Hotels', '02 oct.', 6200, 'Plătită', GREEN],
];
const VEHICLES: [string, string, string, string, string, string][] = [
  ['B-123-ESA', 'Ford Transit', 'Andrei M.', 'Pe drum', BLUE, '12 dec.'],
  [QUERY, 'Mercedes Sprinter', 'Mihai P.', 'ITP scadent', AMBER, 'în 5 zile'],
  ['B-204-ESA', 'Dacia Duster', 'Ioana R.', 'Pe drum', BLUE, '03 ian.'],
  ['B-45-ESA', 'Iveco Daily', 'Radu E.', 'În service', RED, 'azi'],
  ['B-310-ESA', 'VW Crafter', 'Elena S.', 'Parcat', GREY, '18 feb.'],
  ['B-18-ESA', 'Ford Ranger', 'Dan I.', 'Pe drum', BLUE, '30 nov.'],
];
const DELIVERIES: [string, string, string, string, string][] = [
  ['08:30', 'Beton C25/30 · 18 m³', 'Bloc rezidențial, Floreasca', 'Livrat', GREEN],
  ['11:00', 'Oțel beton Ø12 · 4,2 t', 'Hală logistică A1, Ploiești', 'Pe drum', BLUE],
  ['13:30', 'Plăci gips-carton · 220 buc.', 'Amenajare birouri, Pipera', 'Pe drum', BLUE],
  ['15:00', 'Panouri acoperiș · 96 buc.', 'Acoperiș depozit, Chiajna', 'Întârziat 1 h', AMBER],
];

const fmt =(v: number, dec: number) => v.toLocaleString('ro-RO', {minimumFractionDigits: dec, maximumFractionDigits: dec});
// A number that counts up (from 0) when its screen comes in; renders the final value, so it reads right without motion.
const N = ({to, dec = 0, pre = '', suf = ''}: {to: number; dec?: number; pre?: string; suf?: string}) => (
  <span data-to={to} data-dec={dec} data-pre={pre} data-suf={suf}>{pre + fmt(to, dec) + suf}</span>
);

// Intro (once, on scroll-in): the Overview's figures count up, the chart draws, bars and donut fill. Then a fake
// cursor loops: it opens a few tabs (each screen animates in), searches a plate, opens the result in Fleet and goes
// back to the Overview. The loop pauses while the dashboard is off-screen.
function useDashboardMotion(cursorRef: React.RefObject<HTMLDivElement | null>) {
  useGSAP(() => {
    const cursor = cursorRef.current;
    const app = cursor?.parentElement;
    if (!cursor || !app) return;
    const q = gsap.utils.selector(app);
    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const show = (el: HTMLElement, v: number) => {
        const {dec = '0', pre = '', suf = ''} = el.dataset;
        el.textContent = pre + fmt(v, +dec) + suf;
      };
      const navs = q('.sw-nav') as HTMLElement[];
      const views = q('.sw-view') as HTMLElement[];
      const [title, subtitle] = [q('.sw-top h4')[0], q('.sw-top p')[0]] as HTMLElement[];
      const search = q('.sw-search')[0] as HTMLElement;
      const query = q('.sw-search-q')[0] as HTMLElement;
      const results = q('.sw-results')[0] as HTMLElement;
      const firstResult = q('.sw-result')[0] as HTMLElement;
      const placeholder = query.textContent ?? '';
      const view = (i: number) => views.find((v) => v.dataset.view === String(i))!;

      // a screen coming in: its figures count up from 0, charts draw, bars fill, rows slide in
      let current: gsap.core.Timeline | null = null;
      const enter = (el: HTMLElement, d: number) => {
        current?.progress(1).kill();
        const s = gsap.utils.selector(el);
        const tl = gsap.timeline({paused: true, defaults: {ease: 'power2.out'}});
        tl.fromTo(el, {opacity: 0, y: 8}, {opacity: 1, y: 0, duration: 0.35});
        (s('[data-to]') as HTMLElement[]).forEach((n) => {
          const o = {v: 0};
          show(n, 0);
          tl.to(o, {v: +n.dataset.to!, duration: 1.6 * d, onUpdate: () => show(n, o.v)}, 0.1);
        });
        tl.fromTo(s('.sw-line'), {strokeDasharray: 1, strokeDashoffset: 1}, {strokeDashoffset: 0, duration: 1.4 * d, ease: 'power2.inOut'}, 0.2 * d)
          .from(s('.sw-area'), {opacity: 0, duration: 0.8 * d}, 0.9 * d)
          .from(s('.sw-dot'), {scale: 0, transformOrigin: '50% 50%', duration: 0.35, stagger: 0.12 * d, ease: 'back.out(3)'}, 0.3 * d)
          .from(s('.sw-seg'), {strokeDasharray: `0 ${2 * Math.PI * 46}`, duration: 0.9 * d, stagger: 0.25 * d}, 0.3 * d)
          .from(s('.sw-bar i'), {width: 0, duration: 1.2 * d, stagger: 0.1 * d}, 0.3 * d)
          .from(s('.sw-event, .sw-tr:not(.sw-th)'), {opacity: 0, x: -12, duration: 0.5, stagger: 0.07}, 0.25 * d);
        return (current = tl);
      };
      const select = (i: number) => {
        navs.forEach((n, j) => n.classList.toggle('is-active', j === i));
        [title.textContent, subtitle.textContent] = VIEWS[i];
        views.forEach((v) => v.classList.toggle('is-on', v === view(i)));
        q('.is-hit').forEach((r) => r.classList.remove('is-hit'));
        enter(view(i), 0.8).play();
      };

      const loop = gsap.timeline({repeat: -1, paused: true, defaults: {ease: 'power2.inOut'}});
      const intro = enter(view(0), 1).eventCallback('onComplete', () => void loop.play());
      ScrollTrigger.create({trigger: app, start: 'top 85%', once: true, onEnter: () => void intro.play()});

      // the cursor loop; positions are in the dashboard's own (unscaled) pixels
      const at = (el: HTMLElement, fx = 0.3) => {
        const pos = () => {
          let [x, y, n] = [el.offsetWidth * fx, el.offsetHeight * 0.5, el as HTMLElement | null];
          for (; n && n !== app; n = n.offsetParent as HTMLElement | null) [x, y] = [x + n.offsetLeft, y + n.offsetTop];
          return {x, y};
        };
        return {x: () => pos().x, y: () => pos().y};
      };
      const click = (fn: () => void) =>
        loop.to(cursor, {scale: 0.82, duration: 0.1, ease: 'power1.in'}).call(fn).to(cursor, {scale: 1, duration: 0.18, ease: 'power1.out'});

      gsap.set(cursor, {x: 640, y: 430, transformOrigin: '17% 8%'});
      loop.to(cursor, {autoAlpha: 1, duration: 0.3});
      for (const i of [1, 3, 6]) {
        loop.to(cursor, {...at(navs[i]), duration: 0.9}, '+=1.1');
        click(() => select(i));
      }
      // search a plate, then open the vehicle from the results
      const typed = {n: 0};
      loop.to(cursor, {...at(search, 0.35), duration: 1}, '+=1.6');
      click(() => search.classList.add('is-typing'));
      loop
        .to(typed, {n: QUERY.length, duration: 0.8, ease: 'none', onUpdate: () => void (query.textContent = QUERY.slice(0, Math.round(typed.n)) || placeholder)})
        .fromTo(results, {autoAlpha: 0, y: -6}, {autoAlpha: 1, y: 0, duration: 0.25, ease: 'power2.out'}, '+=0.15')
        .to(cursor, {...at(firstResult, 0.4), duration: 0.7}, '+=0.5')
        .call(() => firstResult.classList.add('is-hover'));
      click(() => {
        firstResult.classList.remove('is-hover');
        search.classList.remove('is-typing');
        query.textContent = placeholder;
        gsap.to(results, {autoAlpha: 0, duration: 0.15});
        select(5);
        (q('.sw-view[data-view="5"] .sw-tr') as HTMLElement[]).find((r) => r.textContent?.includes(QUERY))?.classList.add('is-hit');
      });
      loop.to(cursor, {...at(navs[0]), duration: 1}, '+=2.2');
      click(() => select(0));
      loop.to(cursor, {x: 640, y: 430, duration: 1}, '+=0.6').to(cursor, {autoAlpha: 0, duration: 0.3}, '+=1.6');

      ScrollTrigger.create({
        trigger: app,
        onToggle: (self) => void (intro.progress() === 1 && loop.paused(!self.isActive)),
      });
      return () => {
        current?.kill();
        (q('[data-to]') as HTMLElement[]).forEach((n) => show(n, +n.dataset.to!));
        navs.forEach((n, j) => n.classList.toggle('is-active', j === 0));
        views.forEach((v) => v.classList.toggle('is-on', v === view(0)));
        [title.textContent, subtitle.textContent] = VIEWS[0];
        q('.is-hit, .is-hover, .is-typing').forEach((r) => r.classList.remove('is-hit', 'is-hover', 'is-typing'));
        query.textContent = placeholder;
      };
    });
    return () => mm.revert();
  });
}

function Dashboard() {
  const cursorRef = useRef<HTMLDivElement>(null);
  useDashboardMotion(cursorRef);
  // area chart geometry
  const W = 520;
  const H = 190;
  const pad = {l: 30, r: 10, t: 12, b: 24};
  const max = 100;
  const x = (i: number) => pad.l + (i * (W - pad.l - pad.r)) / (COSTS.length - 1);
  const y = (v: number) => pad.t + (1 - v / max) * (H - pad.t - pad.b);
  const line = COSTS.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join('');
  const area = `${line}L${x(COSTS.length - 1)},${H - pad.b}L${x(0)},${H - pad.b}Z`;
  // donut: fleet status
  const fleet = [
    {label: 'Pe drum', value: 18, color: BLUE},
    {label: 'În service', value: 3, color: AMBER},
    {label: 'Parcat', value: 3, color: GREY},
  ];
  const total = fleet.reduce((t, f) => t + f.value, 0);
  const R = 46;
  const C = 2 * Math.PI * R;
  let offset = 0;

  return (
    <>
      <aside className="sw-side">
        <div className="sw-brand"><i>E</i>ESA Ops</div>
        {NAV.map(([key, label, badge], i) => (
          <div key={label} className={`sw-nav${i === 0 ? ' is-active' : ''}`}>
            {ICONS[key]}
            {label}
            {badge ? <b>{badge}</b> : null}
          </div>
        ))}
        <div className="sw-user">
          <span className="sw-avatar">AM</span>
          <span>
            Andrei M.
            <small>Manager operațiuni</small>
          </span>
        </div>
      </aside>

      <div className="sw-main">
        <div className="sw-top">
          <div>
            <h4>{VIEWS[0][0]}</h4>
            <p>{VIEWS[0][1]}</p>
          </div>
          <span className="sw-search">{ICONS.search}<span className="sw-search-q">Caută clienți, facturi, numere…</span></span>
          <span className="sw-bell">{ICONS.bell}</span>
          <div className="sw-results">
            <small>2 results for “{QUERY}”</small>
            <div className="sw-result">
              <span className="sw-event-icon" style={tint(AMBER)}>{ICONS.truck}</span>
              <span>
                <b><mark>{QUERY}</mark> · Mercedes Sprinter</b>
                <small>Flotă · Mihai P. · ITP în 5 zile</small>
              </span>
            </div>
            <div className="sw-result">
              <span className="sw-event-icon" style={tint(BLUE)}>{ICONS.invoice}</span>
              <span>
                <b>Anvelope și service · 640,00 €</b>
                <small>Contabilitate · atașat la <mark>{QUERY}</mark> · 02 oct.</small>
              </span>
            </div>
          </div>
        </div>

        <div className="sw-views">
          <View i={0}>
            <div className="sw-kpis">
              <Kpi label="Șantiere active" value={<N to={12} />} note="+2 luna asta" up icon={ICONS.crane} tint={BLUE} />
              <Kpi label="Vehicule pe drum" value={<N to={18} suf="/24" />} note="3 în service" icon={ICONS.truck} tint={AMBER} />
              <Kpi label="Facturi neîncasate" value={<N to={24.6} dec={1} pre="€" suf="K" />} note="7 facturi · 2 restante" down icon={ICONS.invoice} tint={RED} />
              <Kpi label="Scule împrumutate" value={<N to={143} />} note="98% returnate la timp" up icon={ICONS.tool} tint={GREEN} />
            </div>

            <div className="sw-row">
              <div className="sw-card">
                <h5>Costuri lunare <span className="sw-pill">Ultimele 7 luni</span></h5>
                <svg className="sw-chart" viewBox={`0 0 ${W} ${H}`}>
                  <defs>
                    <linearGradient id="sw-area" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0" stopColor={BLUE} stopOpacity="0.28" />
                      <stop offset="1" stopColor={BLUE} stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <g className="sw-grid">
                    {[0, 25, 50, 75, 100].map((v) => (
                      <g key={v}>
                        <line x1={pad.l} x2={W - pad.r} y1={y(v)} y2={y(v)} />
                        <text x={pad.l - 8} y={y(v) + 3} textAnchor="end">{v}k</text>
                      </g>
                    ))}
                  </g>
                  <path className="sw-area" d={area} fill="url(#sw-area)" />
                  <path className="sw-line" pathLength={1} d={line} fill="none" stroke={BLUE} strokeWidth="2" strokeLinejoin="round" />
                  {COSTS.map((v, i) => (
                    <g key={i}>
                      <circle className="sw-dot" cx={x(i)} cy={y(v)} r="3.5" fill="var(--vv-bg)" stroke={BLUE} strokeWidth="2" />
                      <text x={x(i)} y={H - 6} textAnchor="middle">{['apr.', 'mai', 'iun.', 'iul.', 'aug.', 'sep.', 'oct.'][i]}</text>
                    </g>
                  ))}
                </svg>
              </div>
              <div className="sw-card">
                <h5>Starea flotei <small>24 de vehicule</small></h5>
                <div className="sw-donut">
                  <svg viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r={R} fill="none" stroke="var(--vv-tint-weak)" strokeWidth="14" />
                    {fleet.map((f) => {
                      const len = (f.value / total) * C;
                      const seg = (
                        <circle
                          key={f.label}
                          className="sw-seg"
                          cx="60"
                          cy="60"
                          r={R}
                          fill="none"
                          stroke={f.color}
                          strokeWidth="14"
                          strokeDasharray={`${Math.max(0, len - 2)} ${C}`}
                          strokeDashoffset={-offset}
                          transform="rotate(-90 60 60)"
                        />
                      );
                      offset += len;
                      return seg;
                    })}
                    <text x="60" y="58" textAnchor="middle" data-to={75} data-suf="%" style={{fontSize: 20, fontWeight: 500, fill: 'var(--vv-text-primary)'}}>75%</text>
                    <text x="60" y="74" textAnchor="middle" style={{fontSize: 9, fill: 'var(--vv-text-subtle)'}}>pe drum</text>
                  </svg>
                  <div className="sw-legend">
                    {fleet.map((f) => (
                      <span key={f.label}><i style={{background: f.color}} />{f.label}<b><N to={f.value} /></b></span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="sw-row">
              <div className="sw-card">
                <h5>Șantiere în lucru <small>Vezi toate</small></h5>
                <div className="sw-list">
                  {SITES.slice(0, 3).map((s) => <Site key={s[0]} site={s} />)}
                </div>
              </div>
              <div className="sw-card">
                <h5>Automatizări <small>Azi</small></h5>
                <div className="sw-list">
                  <Event icon={ICONS.scan} tint={BLUE} title="Bon de combustibil scanat" tag="Contabilitate" note="OMV · 182,40 € · atașat la B-123-ESA" time="09:42" />
                  <Event icon={ICONS.check} tint={GREEN} title="Oferta #214 aprobată" tag="Factură trimisă" note="Client anunțat, plata în 15 zile" time="08:15" />
                  <Event icon={ICONS.clock} tint={AMBER} title="ITP în 5 zile" tag="Flotă" note={`Reminder sent to the driver of ${QUERY}`} time="07:00" />
                </div>
              </div>
            </div>
          </View>

          <View i={1}>
            <div className="sw-kpis">
              <Kpi label="Clienți potențiali noi" value={<N to={14} />} note="+5 săptămâna asta" up icon={ICONS.users} tint={BLUE} />
              <Kpi label="Oferte trimise" value={<N to={186.1} dec={1} pre="€" suf="K" />} note="6 oferte · 2 expiră curând" icon={ICONS.invoice} tint={AMBER} />
              <Kpi label="Câștigate luna asta" value={<N to={191.3} dec={1} pre="€" suf="K" />} note="+18% față de septembrie" up icon={ICONS.check} tint={GREEN} />
              <Kpi label="Rată de câștig" value={<N to={42} suf="%" />} note="ultimele 90 de zile" icon={ICONS.chart} tint={BLUE} />
            </div>
            <div className="sw-card">
              <h5>Oferte în lucru <small>După valoare</small></h5>
              <Table cols="1.6fr 1fr 1fr 0.8fr" head={['Client', 'Etapă', 'Contact', 'Valoare']}>
                {CLIENTS.map(([name, contact, stage, c, value]) => [
                  <span className="sw-who"><span className="sw-avatar">{name.split(' ').map((w) => w[0]).slice(0, 2).join('')}</span><b>{name}</b></span>,
                  <Tag c={c}>{stage}</Tag>,
                  contact,
                  <b className="sw-num"><N to={value} pre="€" /></b>,
                ])}
              </Table>
            </div>
          </View>

          <View i={3}>
            <div className="sw-kpis">
              <Kpi label="Emise în octombrie" value={<N to={86.2} dec={1} pre="€" suf="K" />} note="42 de facturi" icon={ICONS.invoice} tint={BLUE} />
              <Kpi label="Încasate" value={<N to={61.6} dec={1} pre="€" suf="K" />} note="71% încasat" up icon={ICONS.check} tint={GREEN} />
              <Kpi label="Restante" value={<N to={4.1} dec={1} pre="€" suf="K" />} note="2 facturi · remindere trimise" down icon={ICONS.clock} tint={RED} />
              <Kpi label="Bonuri scanate" value={<N to={128} />} note="atașate automat la proiecte" icon={ICONS.scan} tint={AMBER} />
            </div>
            <div className="sw-card">
              <h5>Ultimele facturi <span className="sw-pill">Octombrie</span></h5>
              <Table cols="0.9fr 1.5fr 0.8fr 1fr 0.8fr" head={['Factură', 'Client', 'Scadență', 'Sumă', 'Status']}>
                {INVOICES.map(([no, client, due, amount, status, c]) => [
                  <b>{no}</b>,
                  client,
                  due,
                  <b className="sw-num"><N to={amount} dec={2} pre="€" /></b>,
                  <Tag c={c}>{status}</Tag>,
                ])}
              </Table>
            </div>
          </View>

          <View i={5}>
            <div className="sw-kpis">
              <Kpi label="Pe drum" value={<N to={18} suf="/24" />} note="75% din flotă" up icon={ICONS.truck} tint={BLUE} />
              <Kpi label="Combustibil luna asta" value={<N to={7940} pre="€" />} note="−6% față de septembrie" up icon={ICONS.calc} tint={GREEN} />
              <Kpi label="Km parcurși" value={<N to={41250} />} note="luna asta" icon={ICONS.chart} tint={BLUE} />
              <Kpi label="Alerte service" value={<N to={3} />} note="1 ITP scadent" down icon={ICONS.bell} tint={AMBER} />
            </div>
            <div className="sw-card">
              <h5>Vehicule <small>24 în total</small></h5>
              <Table cols="0.9fr 1.3fr 1fr 1.1fr 0.8fr" head={['Număr', 'Vehicul', 'Șofer', 'Status', 'Următorul service']}>
                {VEHICLES.map(([plate, model, driver, status, c, next]) => [<b>{plate}</b>, model, driver, <Tag c={c}>{status}</Tag>, next])}
              </Table>
            </div>
          </View>

          <View i={6}>
            <div className="sw-kpis">
              <Kpi label="Șantiere active" value={<N to={12} />} note="+2 luna asta" up icon={ICONS.crane} tint={BLUE} />
              <Kpi label="Oameni pe șantier" value={<N to={148} />} note="pontați la 07:30" icon={ICONS.users} tint={GREEN} />
              <Kpi label="Buget consumat" value={<N to={63} suf="%" />} note="în grafic" up icon={ICONS.calc} tint={AMBER} />
              <Kpi label="Materiale comandate" value={<N to={212} pre="€" suf="K" />} note="luna asta" icon={ICONS.invoice} tint={BLUE} />
            </div>
            <div className="sw-sites">
              {SITES.map((s) => (
                <div key={s[0]} className="sw-card">
                  <Site site={s} />
                </div>
              ))}
            </div>
            <div className="sw-card">
              <h5>Livrări azi <small>4 programate</small></h5>
              <Table cols="0.5fr 1.6fr 1.4fr 0.8fr" head={['Ora', 'Material', 'Șantier', 'Status']}>
                {DELIVERIES.map(([time, what, site, status, c]) => [<b>{time}</b>, what, site, <Tag c={c}>{status}</Tag>])}
              </Table>
            </div>
          </View>
        </div>
      </div>
      <div ref={cursorRef} className="sw-cursor">
        <svg viewBox="0 0 24 24"><path d="M4 2v17l4.5-4.3 2.9 6.8 2.6-1.1-2.9-6.6H17z" /></svg>
      </div>
    </>
  );
}

const View = ({i, children}: {i: number; children: ReactNode}) => (
  <div className={`sw-view${i === 0 ? ' is-on' : ''}`} data-view={i}>{children}</div>
);

function Table({cols, head, children}: {cols: string; head: string[]; children: ReactNode[][]}) {
  return (
    <div className="sw-table" style={{'--cols': cols} as React.CSSProperties}>
      <div className="sw-tr sw-th">{head.map((h) => <span key={h}>{h}</span>)}</div>
      {children.map((row, i) => (
        <div key={i} className="sw-tr">{row.map((cell, j) => <span key={j}>{cell}</span>)}</div>
      ))}
    </div>
  );
}

function Site({site: [name, place, pct, crew, due]}: {site: (typeof SITES)[number]}) {
  return (
    <div className="sw-site">
      <span><b>{name}, {place}</b><br /><small>Echipă de {crew} · termen {due}</small></span>
      <small><N to={pct} suf="%" /></small>
      <span className="sw-bar"><i style={{width: `${pct}%`}} /></span>
    </div>
  );
}

function Kpi({label, value, note, up, down, icon, tint: c}: {label: string; value: ReactNode; note: string; up?: boolean; down?: boolean; icon: ReactNode; tint: string}) {
  return (
    <div className="sw-card sw-kpi">
      <span>{label}</span>
      <span className="sw-kpi-icon" style={tint(c)}>{icon}</span>
      <strong>{value}</strong>
      <em className={up ? 'sw-up' : down ? 'sw-down' : ''} style={up || down ? undefined : {color: GREY}}>{note}</em>
    </div>
  );
}

function Event({icon, tint: c, title, tag, note, time}: {icon: ReactNode; tint: string; title: string; tag: string; note: string; time: string}) {
  return (
    <div className="sw-event">
      <span className="sw-event-icon" style={tint(c)}>{icon}</span>
      <span>
        <b>{title}</b>
        <Tag c={c}>{tag}</Tag>
      </span>
      <small>{note} · {time}</small>
    </div>
  );
}
