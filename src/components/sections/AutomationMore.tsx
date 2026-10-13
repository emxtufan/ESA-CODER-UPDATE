// "Dacă faci același lucru în fiecare zi…": general automation, right under the SAGA WEB row (Automation.tsx).
// Layout after Qronos' "Durable autonomy" block: a two-tone heading with a side text, then one bordered panel split
// in four cells, each with a small app mock-up (decorative, so its labels live here and not in the admin) above two
// of the eight examples. Then a closing call to action.
// Texts are edited in the admin (Homepage › Automatizare — ce mai putem automatiza).
import {useEffect, useRef} from 'react';
import HeadingReveal from '@/components/motion/HeadingReveal';
import Link from '@/components/Link';
import RevealBatch from '@/components/motion/RevealBatch';
import RollText from '@/components/RollText';
import '@/styles/automation-more.css';

import {text} from '@/lib/text';

const $t = text("components/sections/AutomationMore");

/** Adds `is-in` once the panel is on screen: the mock-ups only animate (bars, dots, inbox) after that. */
function useInView<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => el.classList.toggle('is-live', e.isIntersecting), {threshold: 0.15});
    io.observe(el);
    const once = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        el.classList.add('is-in');
        once.disconnect();
      }
    }, {threshold: 0.2});
    once.observe(el);
    return () => {
      io.disconnect();
      once.disconnect();
    };
  }, []);
  return ref;
}

const Icon = ({d}: {d: string}) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d={d} />
  </svg>
);

// 01 + 02: repetitive work and scheduled jobs
function ScheduleMock() {
  const runs = [
    {name: 'Pontaj angajați', when: 'Zilnic · 18:00', from: 6, to: 52, tone: 'cyan'},
    {name: 'Scanare facturi primite', when: 'La fiecare email nou', from: 30, to: 58, tone: 'green'},
    {name: 'Copiere imagini produse', when: 'Când apare un fișier nou', from: 56, to: 86, tone: 'violet'},
  ];
  return (
    <div className="ax-mock" aria-hidden>
      <div className="ax-mock-head">
        <b>Rulări programate</b>
      </div>
      <div className="ax-runs">
        <i className="ax-playhead" />
        {runs.map((r, i) => (
          <div key={r.name} className="ax-run">
            <p><b>{r.name}</b><span className="ax-mono">{r.when}</span></p>
            <div className="ax-track"><i className={`ax-bar ax-${r.tone}`} style={{left: `${r.from}%`, width: `${r.to - r.from}%`, transitionDelay: `${0.2 + i * 0.15}s`}} /></div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 03 + 04: files and connected apps. While on screen it loops: the file is picked up, a dot runs to the script,
// the script works, a dot runs on and the three outputs get their check one after another.
export function PipelineMock() {
  return (
    <div className="ax-mock" aria-hidden>
      <div className="ax-mock-head"><b>Flux de date</b></div>
      <div className="ax-flow">
        <div className="ax-node ax-src"><small>Sursă</small><b>Excel / CSV</b></div>
        <span className="ax-link ax-link-1" />
        <div className="ax-node is-main"><small>Procesare</small><b>Script Python</b></div>
        <span className="ax-link ax-link-2" />
        <div className="ax-outs">
          <span>ERP <i /></span>
          <span>Raport PDF <i /></span>
          <span>Email <i /></span>
        </div>
      </div>
    </div>
  );
}

// 05 + 06: checks on data and documents. While on screen a scan runs down the list and each check gets its result.
function RulesMock() {
  const rules = [
    {name: 'Valori lipsă', result: 'Semnalat', tone: 'amber'},
    {name: 'Înregistrări duplicate', result: 'Eliminate', tone: 'green'},
    {name: 'Date care nu se potrivesc', result: 'Verificare umană', tone: 'blue'},
    {name: 'Format greșit', result: 'Corectat', tone: 'green'},
    {name: 'Fișiere lipsă', result: 'Semnalat', tone: 'amber'},
  ];
  return (
    <div className="ax-mock" aria-hidden>
      <div className="ax-mock-head"><b>Verificări</b></div>
      <ul className="ax-rules">
        {rules.map((r, i) => (
          <li key={r.name} style={{animationDelay: `${i * 0.7}s`}}>
            <b>{r.name}</b>
            <span className={`ax-result ax-${r.tone}`} style={{animationDelay: `${i * 0.7 + 0.45}s`}}>{r.result}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// 07 + 08: alerts and requests. While on screen the notifications come in one by one, then the list starts over.
function InboxMock() {
  const items = [
    {title: 'Raport generat', tone: 'green', d: 'M7 3h7l5 5v13H7zM14 3v5h5M10 13h6M10 17h6'},
    {title: 'Comandă nouă procesată', tone: 'blue', d: 'M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6M10 21h.01M17 21h.01'},
    {title: 'Document de verificat', tone: 'amber', d: 'M12 9v4M12 17h.01M10.3 3.9 2 18a2 2 0 0 0 1.7 3h16.6a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z'},
    {title: 'Termen în 5 zile', tone: 'red', d: 'M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.9 1.9 0 0 0 3.4 0'},
  ];
  return (
    <div className="ax-mock" aria-hidden>
      <div className="ax-mock-head"><b>Notificări</b></div>
      <ul className="ax-inbox">
        {items.map((it, i) => (
          <li key={it.title} style={{animationDelay: `${i * 0.6}s`}}>
            <span className={`ax-ico ax-${it.tone}`}><Icon d={it.d} /></span>
            <b>{it.title}</b>
          </li>
        ))}
      </ul>
    </div>
  );
}

const CELLS = [
  {mock: <ScheduleMock />, items: [1, 2]},
  {mock: <PipelineMock />, items: [3, 4]},
  {mock: <RulesMock />, items: [5, 6]},
  {mock: <InboxMock />, items: [7, 8]},
];
const pad = (n: number) => String(n).padStart(2, '0');

export default function AutomationMore() {
  const panel = useInView<HTMLDivElement>();
  return (
    <section id="automation-more" aria-labelledby="automation-more-heading" className="ax-section bg-bg">
      <div className="mx-auto max-w-[1380px] px-6 md:px-8">
        <div className="ax-divider" aria-hidden />

        <div className="ax-intro">
          <HeadingReveal scroll>
            <h2 id="automation-more-heading" className="font-display text-[clamp(38px,4.6vw,64px)] leading-[1] font-medium tracking-h1">
              {$t("title")}<span className="vv-accent">{$t("title-muted")}</span>
            </h2>
          </HeadingReveal>
          <div className="ax-intro-text">
            <p className="text-lead leading-[1.65] text-fg-muted">{$t("subtitle")}</p>
            <p className="mt-4 text-body-s leading-[1.7] text-fg-subtle">{$t("approach")}</p>
          </div>
        </div>

        <RevealBatch>
          <div ref={panel} className="ax-panel">
            {CELLS.map((cell, i) => (
              <div key={i} data-reveal className="ax-cell">
                <div className="ax-stage">{cell.mock}</div>
                <div className="ax-items">
                  {cell.items.map((n) => (
                    <div key={n}>
                      <span className="ax-num">{pad(n)}</span>
                      <h3 className="font-display">{$t(`item-${n}`)}</h3>
                      <p>{$t(`item-${n}-text`)}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div data-reveal className="ax-cta">
            <div className="vv-art-cms absolute inset-0 -z-10" aria-hidden />
            <HeadingReveal scroll>
              <h3 className="font-display text-[clamp(38px,4.6vw,64px)] leading-[1] font-medium tracking-h1">
                {$t("cta-title")}<span className="vv-accent">{$t("cta-title-muted")}</span>
              </h3>
            </HeadingReveal>
            <p>{$t("cta-text")}</p>
            <div className="mt-8 flex flex-wrap gap-2.5">
              <Link href={$t("cta-link")} className="ax-primary inline-flex items-center rounded-full border border-transparent px-[15px] py-[9px] text-[14px] leading-none font-medium">
                <RollText text={$t("cta")} />
              </Link>
              <Link href={$t("offer-link")} className="ax-ghost inline-flex items-center rounded-full px-[15px] py-[9px] text-[14px] leading-none font-medium">
                <RollText text={$t("offer")} />
              </Link>
            </div>
          </div>
        </RevealBatch>
      </div>
    </section>
  );
}
