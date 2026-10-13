import HeadingReveal from '@/components/motion/HeadingReveal';
import Link from '@/components/Link';
import RevealBatch from '@/components/motion/RevealBatch';
import RollText from '@/components/RollText';

import {text, textList} from '@/lib/text';
import {collection} from '@/lib/collections';
import '@/styles/pricing.css';

const SCOPE = "components/sections/Pricing";
const $t = text(SCOPE);
const list = (key: string) => textList(SCOPE, key);

/** One website package (admin → Pricing → Pachete). Every price on the site is read from here. */
export type Plan = {
  id: string;
  name: string;
  description: string;
  price: string;          // one-time development fee, e.g. "4.990"
  currency: string;       // "lei"
  priceType: string;      // "one-time"
  infraPrice: number;     // optional managed domain + hosting, per month
  domainPrice: number;    // the .ro domain's share of infraPrice (yearly fee / 12)
  infraCurrency: string;  // "€"
  infraFrequency: string; // "monthly"
  features: string[];
  notIncluded?: string[];
  recommended?: boolean;
  ctaLabel?: string;
  ctaLink: string;
  detailsLink: string;
};

export const plans = () => collection<Plan>('plans');

const HOME_FEATURES = 6; // the home page shows the first few, the service page shows them all

const Check = () => (
  <svg viewBox="0 0 24 24" className="mt-[3px] size-[15px] shrink-0 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="m5 13 4 4L19 7" />
  </svg>
);
const Arrow = () => (
  <svg viewBox="0 0 24 24" className="size-3.5 shrink-0 transition-transform duration-300 ease-brand group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

/** The glass card of the pricing section (border, top line, glow and the travelling shine). */
function Card({children, className = ''}: {children: React.ReactNode; className?: string}) {
  return (
    <div data-reveal className={`group relative flex flex-col overflow-hidden rounded-[12px] border backdrop-blur-[12px] ${className}`} style={{ background: "color-mix(in srgb, var(--vv-bg) 42%, transparent)", borderColor: "var(--vv-card-border)" }}>
      <span aria-hidden className="pointer-events-none absolute top-0 left-1/2 h-px w-[240px] max-w-[80%] -translate-x-1/2" style={{ background: "linear-gradient(90deg, transparent 0%, var(--vv-card-line) 50%, transparent 100%)" }} />
      <span aria-hidden className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(58% 46% at 50% 0%, color-mix(in srgb, var(--vv-card-lift) 62%, transparent) 0%, color-mix(in srgb, var(--vv-card-lift-mid) 62%, transparent) 45%, transparent 78%)" }} />
      <span aria-hidden className="vv-shine vv-shine-lyr-a pointer-events-none absolute inset-0 rounded-[inherit] pointer-coarse:hidden" style={{ padding: 1, animationDuration: "2.8s", backgroundImage: "conic-gradient(from calc(var(--vv-shine-a) - var(--vv-shine-w, 24deg)), transparent 0deg, #0099FF calc(var(--vv-shine-w, 24deg) / 2), #7ACAFF var(--vv-shine-w, 24deg), transparent calc(var(--vv-shine-w, 24deg) * 2), transparent 360deg)", mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", maskComposite: "exclude", WebkitMaskComposite: "xor" }} />
      <span aria-hidden className="vv-shine vv-shine-lyr-b pointer-events-none absolute inset-0 rounded-[inherit] pointer-coarse:hidden" style={{ padding: 1, animationDuration: "2.8s", backgroundImage: "conic-gradient(from calc(var(--vv-shine-b) - var(--vv-shine-w, 24deg)), transparent 0deg, #0099FF calc(var(--vv-shine-w, 24deg) / 2), #7ACAFF var(--vv-shine-w, 24deg), transparent calc(var(--vv-shine-w, 24deg) * 2), transparent 360deg)", mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", maskComposite: "exclude", WebkitMaskComposite: "xor" }} />
      {children}
    </div>
  );
}

/** The three website packages. `detailed` (service page) lists every feature and what is not included. */
export function PlanCards({detailed = false}: {detailed?: boolean}) {
  return (
    <div className="grid gap-5 md:grid-cols-3">
      {plans().map((plan) => {
        const features = detailed ? plan.features : plan.features.slice(0, HOME_FEATURES);
        const more = plan.features.length - features.length;
        return (
          <Card key={plan.id} className={plan.recommended ? 'pr-recommended' : ''}>
            <div className="relative flex flex-1 flex-col p-8 md:p-10">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[12px] leading-none font-medium tracking-[0.14em] text-fg-subtle uppercase">
                  {plan.name}
                </p>
                {plan.recommended && <span className="pr-badge">{$t("recommended")}</span>}
              </div>
              <p className="mt-7 font-display text-[clamp(44px,4.6vw,60px)] leading-[0.9] font-medium tracking-[-0.045em]">
                {plan.price} <span className="pr-currency">{plan.currency}</span>
              </p>
              <p className="mt-3 text-body-s text-fg-muted">{$t("one-time-fee")}</p>
              <p className="mt-5 text-body-s leading-[1.65] text-fg-muted">
                {plan.description}
              </p>
              <p className="pr-infra mt-6">
                <strong>+ {plan.infraPrice} {plan.infraCurrency}{$t("per-month")}</strong>
                <span>{$t("optional-infra")}</span>
              </p>
              <ul className="mt-6 divide-y border-t" style={{ borderColor: "var(--vv-card-rule)" }}>
                {features.map((feature, i) => (
                  <li key={i} className="flex gap-3 py-3 text-[13.5px] leading-[1.5] text-fg-strong" style={{ borderColor: "var(--vv-card-rule)" }}>
                    <Check />
                    {feature}
                  </li>
                ))}
              </ul>
              {more > 0 && (
                <Link href={plan.detailsLink} className="mt-3 text-[13px] text-fg-subtle underline decoration-fg/30 underline-offset-4 transition-colors hover:text-fg">
                  {$t("more-included").replace('{n}', String(more))}
                </Link>
              )}
              {detailed && !!plan.notIncluded?.length && (
                <div className="mt-6">
                  <p className="text-[12px] leading-none font-medium tracking-[0.14em] text-fg-subtle uppercase">{$t("not-included")}</p>
                  <ul className="pr-excluded mt-3">
                    {plan.notIncluded.map((item, i) => <li key={i}>{item}</li>)}
                  </ul>
                </div>
              )}
              <div className="mt-auto flex flex-wrap items-center justify-between gap-x-4 gap-y-3 pt-9">
                <Link href={plan.ctaLink} className="inline-flex items-center rounded-full border border-transparent bg-fg px-[15px] py-[9px] text-[14px] leading-none font-medium text-bg transition-colors hover:bg-fg-strong">
                  <RollText text={plan.ctaLabel || $t("start-a-project")} />
                </Link>
                {!detailed && (
                  <Link href={plan.detailsLink} className="group flex items-center gap-2 py-1 text-[13px] leading-none font-medium text-fg-subtle transition-colors hover:text-fg">
                    {$t("details")}
                    <Arrow />
                  </Link>
                )}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

const CARE_GROUPS = ['hosting', 'backup', 'security', 'maintenance', 'seo'];

/** ESA Managed Care, the 100 €/month plan that already includes the domain and hosting. */
/** `more = false` hides the details link (on the page it points to). */
export function ManagedCare({detailed = false, more = true}: {detailed?: boolean; more?: boolean}) {
  return (
    <Card>
      <div id={detailed ? 'managed-care' : undefined} className="pr-care relative grid gap-8 p-8 md:p-10">
        <div className="max-w-[640px]">
          <HeadingReveal scroll>
            <h3 className="font-display text-[clamp(38px,4.6vw,64px)] leading-[1] font-medium tracking-h1">
              {$t("care-title")}<span className="vv-accent">{$t("care-title-accent")}</span>
            </h3>
          </HeadingReveal>
          <p className="mt-4 text-body-s leading-[1.7] text-fg-muted">{$t("care-text")}</p>
          {!detailed && (
            <ul className="cw-chips">{CARE_GROUPS.map((g) => <li key={g}>{$t(`care-${g}`)}</li>)}</ul>
          )}
          {detailed && (
            <>
              <div className="pr-groups mt-7">
                {CARE_GROUPS.map((g) => (
                  <details key={g} className="pr-details">
                    <summary>{$t(`care-${g}`)}</summary>
                    <ul>{list(`care-${g}-items`).map((item, i) => <li key={i}>{item}</li>)}</ul>
                  </details>
                ))}
                <details className="pr-details">
                  <summary>{$t("care-excluded")}</summary>
                  <ul className="pr-excluded">{list("care-excluded-items").map((item, i) => <li key={i}>{item}</li>)}</ul>
                </details>
              </div>
              <p className="mt-5 text-[13px] leading-[1.6] text-fg-subtle">{$t("care-limits")}</p>
            </>
          )}
        </div>
        <div className="pr-care-price">
          <p className="font-display text-[clamp(44px,4.6vw,60px)] leading-[0.9] font-medium tracking-[-0.045em]">
            {$t("care-price")} <span className="pr-currency">{$t("care-currency")}{$t("per-month")}</span>
          </p>
          <p className="mt-3 text-body-s leading-[1.6] text-fg-muted">{$t("care-includes")}</p>
          <p className="mt-2 text-[13px] leading-[1.6] text-fg-subtle">{$t("care-instead")}</p>
          <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-3">
            <Link href={$t("care-cta-link")} className="inline-flex items-center rounded-full border border-transparent bg-fg px-[15px] py-[9px] text-[14px] leading-none font-medium text-bg transition-colors hover:bg-fg-strong">
              <RollText text={$t("care-cta")} />
            </Link>
            {more && (
              <Link href={detailed ? $t("care-more-link-service") : $t("care-more-link")} className="group flex items-center gap-2 py-1 text-[13px] leading-none font-medium text-fg-subtle transition-colors hover:text-fg">
                {$t("care-more")}
                <Arrow />
              </Link>
            )}
          </div>
          <p className="mt-6 text-[13px] leading-[1.6] text-fg-subtle">{$t("care-note")}</p>
        </div>
      </div>
    </Card>
  );
}

const TERMS_GROUPS = ['dev', 'care', 'data'];

/** "Clear terms": every project and maintenance plan runs on a contract signed before work starts. */
export function Terms({detailed = false}: {detailed?: boolean}) {
  return (
    <div data-reveal className="pr-terms">
      <HeadingReveal scroll>
        <h3 className="font-display text-[clamp(38px,4.6vw,64px)] leading-[1] font-medium tracking-h1">
          {$t("terms-title")}<span className="vv-accent">{$t("terms-title-accent")}</span>
        </h3>
      </HeadingReveal>
      <p className="mt-3 max-w-[620px] text-body-s leading-[1.7] text-fg-muted">{$t("terms-text")}</p>
      {detailed && (
        <div className="pr-groups pr-groups-3 mt-7">
          {TERMS_GROUPS.map((g) => (
            <details key={g} className="pr-details">
              <summary>{$t(`terms-${g}`)}</summary>
              <ul>{list(`terms-${g}-items`).map((item, i) => <li key={i}>{item}</li>)}</ul>
            </details>
          ))}
        </div>
      )}
      <p className="mt-6 text-[13px] leading-[1.6] text-fg-subtle">{$t("terms-signed")} {$t("estimate-note")}</p>
    </div>
  );
}

export default function Pricing() {
  return (
    <section id="pricing" aria-labelledby="pricing-heading" className="relative isolate z-10 bg-bg py-[clamp(80px,9vw,120px)]">
      <div className="mx-auto max-w-[1380px] px-6 md:px-8">
        <h2 id="pricing-heading" className="text-center font-display text-[clamp(46px,9vw,132px)] leading-[1] font-medium tracking-[-0.05em]">
          {$t("pricing")}
        </h2>
        <p className="mx-auto mt-5 max-w-[620px] text-center text-body-s leading-[1.7] text-fg-muted">
          {$t("pricing-intro")}
        </p>
        <RevealBatch className="relative mt-10 flex flex-col gap-5">
          <PlanCards />
          <ManagedCare />
          <Terms />
        </RevealBatch>
      </div>
    </section>
  );
}
