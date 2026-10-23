import HeadingReveal from '@/components/motion/HeadingReveal';
import Link from '@/components/Link';
import ParallaxDrift from '@/components/motion/ParallaxDrift';
import RevealBatch from '@/components/motion/RevealBatch';
import RollText from '@/components/RollText';
import {PreviewVideo} from '@/components/sections/Automation';
import {ICONS} from '@/components/sections/Software';
import {BriefCard, Stat} from '@/templates/ProjectPage';

import {text} from '@/lib/text';

const $t = text("/automation");

// The financial-accounting automation service, laid out like a project page (src/templates/ProjectPage.tsx).
const FEATURES = [
  {icon: ICONS.bank, n: 1},
  {icon: ICONS.invoice, n: 2},
  {icon: ICONS.plane, n: 3},
  {icon: ICONS.check, n: 4},
  {icon: ICONS.scan, n: 5},
  {icon: ICONS.chart, n: 6},
];
const STEPS = [1, 2, 3, 4];
const STATS = [
  {n: 1, icon: ICONS.users},
  {n: 2, icon: ICONS.calc},
  {n: 3, icon: ICONS.clock},
  {n: 4, icon: ICONS.flow},
];

const h2 = 'font-display text-[20px] leading-[1.1] font-medium tracking-h3 lg:text-[24px] lg:leading-[1.2]';
const primary = 'inline-flex items-center rounded-full border border-transparent bg-fg px-[15px] py-[9px] text-[14px] leading-none font-medium text-bg transition-colors hover:bg-fg-strong';
const secondary = 'inline-flex items-center rounded-full border border-transparent bg-fg/15 px-[15px] py-[9px] text-[14px] leading-none font-medium transition-colors hover:bg-fg/25';

export default function Page_automation() {
  return (
    <main className="relative isolate">
      <header className="relative z-0 mx-auto max-w-[1425px] px-6 pt-[153px] md:px-8">
        <ParallaxDrift>
          <HeadingReveal>
            <h1 className="au-h1 text-center font-display leading-[1] font-medium tracking-[-0.05em] will-change-transform">
              {$t("title")}
            </h1>
          </HeadingReveal>
        </ParallaxDrift>
      </header>

      <div className="relative z-10 mx-auto max-w-[1425px] px-0 md:px-8">
        <div className="relative rounded-[12px]" style={{ background: "color-mix(in srgb, var(--vv-bg) 80%, transparent)" }}>
          <span aria-hidden className="pointer-events-none absolute top-0 left-1/2 h-px w-[600px] max-w-full -translate-x-1/2" style={{ background: "linear-gradient(90deg, transparent 0%, var(--vv-card-line) 50%, transparent 100%)" }} />
          <span aria-hidden className="pointer-events-none absolute inset-0 rounded-[12px]" style={{ background: "radial-gradient(58% 46% at 50% 0%, var(--vv-card-lift) 0%, var(--vv-card-lift-mid) 45%, transparent 78%)" }} />
          <div className="relative flex flex-col gap-6 pt-[50px] pb-6 lg:gap-10">
            <section className="grid gap-8 px-4 lg:grid-cols-[1fr_0.5fr] lg:px-8">
              <div>
                <p className="au-eyebrow">{$t("eyebrow")}</p>
                <h2 className={`mt-3 ${h2}`}>{$t("overview-title")}</h2>
                <p className="mt-3 text-[14px] leading-[1.6] text-fg-muted lg:mt-5 lg:text-lead lg:leading-[1.7]">{$t("overview")}</p>
              </div>
              <div className="flex flex-wrap items-end justify-start gap-3 lg:justify-end">
                <Link href={$t("works-link")} className={secondary}>
                  <RollText text={$t("works")} />
                </Link>
                <Link href={$t("cta-link")} className={primary}>
                  <RollText text={$t("cta")} />
                </Link>
              </div>
            </section>
            <dl className="mx-8 grid grid-cols-2 gap-8 border-t pt-6 sm:grid-cols-4 lg:pt-8" style={{ borderColor: "var(--vv-card-rule)" }}>
              {STATS.map(({n, icon}) => (
                <Stat key={n} label={$t(`stat-${n}-label`)} value={$t(`stat-${n}`)} icon={<span className="au-stat-icon">{icon}</span>} />
              ))}
            </dl>
            <div className="px-4 lg:px-8">
              <div className="overflow-hidden rounded-[10px] border border-fg/12">
                <PreviewVideo />
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="mx-auto max-w-[1425px] px-4 pt-[36px] md:px-8 md:pt-[96px]">
        <RevealBatch selector="[data-act]" distance={22} stagger={0.09} className="grid gap-4 lg:grid-cols-3 lg:gap-5">
          <BriefCard title={$t("problem-title")} body={$t("problem")} />
          <BriefCard title={$t("approach-title")} body={$t("approach")} />
          <BriefCard title={$t("outcome-title")} body={$t("outcome")} />
        </RevealBatch>
      </section>

      <section className="au-block mx-auto max-w-[1425px] px-4 md:px-8">
        <RevealBatch selector="h2, li" distance={22} stagger={0.06}>
          <h2 className={h2}>{$t("features-title")}</h2>
          <ul className="au-cards">
            {FEATURES.map(({icon, n}) => (
              <li key={n} className="au-card">
                <span aria-hidden className="au-icon">
                  {icon}
                </span>
                <h3 className="mt-5 font-display text-[18px] leading-[1.2] font-medium tracking-h3 lg:text-[20px]">{$t(`feature-${n}-title`)}</h3>
                <p className="mt-2 text-[14px] leading-[1.6] text-fg-muted lg:text-[15px]">{$t(`feature-${n}`)}</p>
              </li>
            ))}
          </ul>
        </RevealBatch>
      </section>

      <section className="au-block mx-auto max-w-[1425px] px-4 md:px-8">
        <RevealBatch selector="h2, li" distance={22} stagger={0.07}>
          <h2 className={h2}>{$t("steps-title")}</h2>
          <ol className="au-steps">
            {STEPS.map((n) => (
              <li key={n}>
                <span className="font-display text-[14px] text-fg-subtle">0{n}</span>
                <h3 className="mt-2 text-[16px] leading-[1.3] font-medium text-fg lg:text-[20px]">{$t(`step-${n}-title`)}</h3>
                <p className="mt-2 text-[14px] leading-[1.6] text-fg-muted">{$t(`step-${n}`)}</p>
              </li>
            ))}
          </ol>
        </RevealBatch>
      </section>

      <section className="au-final mx-auto max-w-[1425px] px-4 pb-[130px] text-center md:px-8">
        <HeadingReveal scroll>
          <h2 className="font-display text-[clamp(38px,4.6vw,64px)] leading-[1.05] font-medium tracking-h1">
            {$t("final-title")}<br /><span className="vv-accent">{$t("final-accent")}</span>
          </h2>
        </HeadingReveal>
        <p className="mx-auto mt-5 max-w-[560px] text-[15px] leading-[1.6] text-fg-muted lg:text-lead">{$t("final-text")}</p>
        <Link href={$t("cta-link")} className={`mt-8 ${primary}`}>
          <RollText text={$t("cta")} />
        </Link>
      </section>
    </main>
  );
}
