import HeadingReveal from '@/components/motion/HeadingReveal';
import Link from '@/components/Link';
import RevealBatch from '@/components/motion/RevealBatch';
import RollText from '@/components/RollText';
import ServicesBackdrop from '@/components/services/ServicesBackdrop';

import {text} from '@/lib/text';
import {ManagedCare} from '@/components/sections/Pricing';
import RecentWork from '@/components/works/RecentWork';

const $t = text("/services/maintenance-and-ongoing-support");

// Converted 1:1 from the RSC payload of /services/maintenance-and-ongoing-support.
export default function Page_services__maintenance_and_ongoing_support() {
  return (
    <>
      <main className="relative isolate">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: "{\"@context\":\"https://schema.org\",\"@type\":\"Service\",\"name\":\"Maintenance &\\nOngoing Support\",\"description\":\"Keep your website updated, secure, and performing at its best. We handle ongoing adjustments so you can focus on your business. Websites decay quietly. Content goes out of date, links break as other sites reorganise, browsers update and change how something renders, images accumulate until pages slo\",\"url\":\"https://visuvate.com/services/maintenance-and-ongoing-support\",\"serviceType\":\"Maintenance &\\nOngoing Support\",\"provider\":{\"@id\":\"https://visuvate.com/#organization\"},\"areaServed\":[{\"@type\":\"Country\",\"name\":\"United States\"},{\"@type\":\"Country\",\"name\":\"United Kingdom\"},{\"@type\":\"Country\",\"name\":\"Canada\"},{\"@type\":\"Country\",\"name\":\"Australia\"},{\"@type\":\"Country\",\"name\":\"Ireland\"},{\"@type\":\"Country\",\"name\":\"New Zealand\"},{\"@type\":\"Country\",\"name\":\"Germany\"},{\"@type\":\"Country\",\"name\":\"Netherlands\"},{\"@type\":\"Country\",\"name\":\"Switzerland\"},{\"@type\":\"Country\",\"name\":\"Sweden\"},{\"@type\":\"Country\",\"name\":\"United Arab Emirates\"},{\"@type\":\"Country\",\"name\":\"Singapore\"},{\"@type\":\"Country\",\"name\":\"India\"}]}" }} />
        <ServicesBackdrop tone="mono" className="fixed inset-0 -z-10" />
        <span aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-[280px]" style={{ background: "linear-gradient(180deg, transparent 0%, var(--vv-bg) 92%)" }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: "{\"@context\":\"https://schema.org\",\"@type\":\"BreadcrumbList\",\"itemListElement\":[{\"@type\":\"ListItem\",\"position\":1,\"name\":\"Home\",\"item\":\"https://visuvate.com/\"},{\"@type\":\"ListItem\",\"position\":2,\"name\":\"Services\",\"item\":\"https://visuvate.com/services\"},{\"@type\":\"ListItem\",\"position\":3,\"name\":\"Maintenance &\\nOngoing Support\",\"item\":\"https://visuvate.com/services/maintenance-and-ongoing-support\"}]}" }} />
        <header className="mx-auto max-w-[1425px] px-6 pt-[clamp(80px,9vw,130px)] pb-[clamp(40px,5vw,64px)] md:px-8">
          <Link href="/services" className="group inline-flex h-[42px] items-center gap-[10px] rounded-full border border-line-strong pr-[22px] pl-[7px] text-sm font-medium tracking-[-0.01em] transition-colors duration-300 hover:border-fg hover:bg-fg hover:text-bg">
            <span className="relative grid size-7 shrink-0 place-items-center overflow-hidden rounded-full bg-fg/10 transition-colors duration-300 group-hover:bg-bg/20">
              <svg viewBox="0 0 24 24" className="absolute top-1/2 left-1/2 -mt-[7px] -ml-[7px] size-3.5 transition-transform duration-[420ms] ease-brand -translate-x-0 group-hover:-translate-x-[220%]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M19 12H5" />
                <path d="m12 19-7-7 7-7" />
              </svg>
              <svg viewBox="0 0 24 24" className="absolute top-1/2 left-1/2 -mt-[7px] -ml-[7px] size-3.5 transition-transform duration-[420ms] ease-brand translate-x-[220%] group-hover:translate-x-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M19 12H5" />
                <path d="m12 19-7-7 7-7" />
              </svg>
            </span>
            <RollText text={$t("all-services")} />
          </Link>
          <HeadingReveal className="mt-10">
            <h1 className="font-display text-[clamp(40px,7vw,104px)] leading-[1] font-medium tracking-[-0.05em]">
              {$t("maintenance-ongoing-support")}
            </h1>
          </HeadingReveal>
        </header>
        <section className="mx-auto max-w-[1425px] px-6 pb-[clamp(56px,7vw,96px)] md:px-8">
          <div className="grid gap-x-16 gap-y-12 lg:grid-cols-[1fr_0.78fr]">
            <div className="max-w-[660px]">
              <p className="text-[clamp(20px,2vw,26px)] leading-[1.5] font-medium text-fg">
                {$t("keep-your-website-updated-secure-and")}
              </p>
              <p className="mt-5 text-lead leading-[1.75] text-fg-muted">
                {$t("websites-decay-quietly-content-goes-out")}
              </p>
              <p className="mt-5 text-lead leading-[1.75] text-fg-muted">
                {$t("regular-checks-catch-that-before-it")}
              </p>
              <p className="mt-5 text-lead leading-[1.75] text-fg-muted">
                {$t("content-and-design-updates-are-handled")}
              </p>
              <p className="mt-5 text-lead leading-[1.75] text-fg-muted">
                {$t("backups-and-security-monitoring-run-in")}
              </p>
              <p className="mt-5 text-lead leading-[1.75] text-fg-muted">
                {$t("priority-support-means-a-direct-line")}
              </p>
              <p className="mt-5 text-lead leading-[1.75] text-fg-muted">
                {$t("it-suits-businesses-whose-site-is")}
              </p>
            </div>
            <div className="relative h-fit rounded-[16px] border border-fg/12 bg-bg/30 p-7 backdrop-blur-[14px] lg:sticky lg:top-[104px]">
              <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px" style={{ background: "linear-gradient(90deg, transparent 0%, color-mix(in srgb, var(--vv-text-primary) 40%, transparent) 50%, transparent 100%)" }} />
              <h2 className="text-[12px] leading-none font-medium tracking-[0.14em] text-fg-subtle uppercase">
                {$t("what-s-included")}
              </h2>
              <ul className="mt-6 flex flex-col gap-4">
                <li className="flex gap-3 text-[15px] leading-[1.5] text-fg-strong">
                  <svg viewBox="0 0 24 24" className="mt-[3px] size-[15px] shrink-0 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="m5 13 4 4L19 7" />
                  </svg>
                  {$t("regular-site-checkups")}
                </li>
                <li className="flex gap-3 text-[15px] leading-[1.5] text-fg-strong">
                  <svg viewBox="0 0 24 24" className="mt-[3px] size-[15px] shrink-0 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="m5 13 4 4L19 7" />
                  </svg>
                  {$t("content-and-design-updates")}
                </li>
                <li className="flex gap-3 text-[15px] leading-[1.5] text-fg-strong">
                  <svg viewBox="0 0 24 24" className="mt-[3px] size-[15px] shrink-0 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="m5 13 4 4L19 7" />
                  </svg>
                  {$t("backup-and-security-monitoring")}
                </li>
                <li className="flex gap-3 text-[15px] leading-[1.5] text-fg-strong">
                  <svg viewBox="0 0 24 24" className="mt-[3px] size-[15px] shrink-0 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="m5 13 4 4L19 7" />
                  </svg>
                  {$t("performance-review-and-optimization")}
                </li>
                <li className="flex gap-3 text-[15px] leading-[1.5] text-fg-strong">
                  <svg viewBox="0 0 24 24" className="mt-[3px] size-[15px] shrink-0 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="m5 13 4 4L19 7" />
                  </svg>
                  {$t("priority-technical-support")}
                </li>
                <li className="flex gap-3 text-[15px] leading-[1.5] text-fg-strong">
                  <svg viewBox="0 0 24 24" className="mt-[3px] size-[15px] shrink-0 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="m5 13 4 4L19 7" />
                  </svg>
                  {$t("forms-tested-end-to-end-so")}
                </li>
              </ul>
              <Link href="/contact" className="mt-7 flex h-11 items-center justify-center rounded-full bg-fg text-[14px] font-medium text-bg transition-opacity hover:opacity-90">
                <RollText text={$t("start-a-project")} />
              </Link>
            </div>
          </div>
        </section>
        <RevealBatch className="mx-auto max-w-[1425px] px-6 pb-[clamp(56px,7vw,96px)] md:px-8">
          <ManagedCare detailed more={false} />
        </RevealBatch>
        <RevealBatch className="mx-auto max-w-[1425px] px-6 pb-[clamp(56px,7vw,96px)] md:px-8">
          <h2 className="mb-8 font-display text-[clamp(28px,3.4vw,44px)] leading-[1] font-medium tracking-h2">
            {$t("recent-work")}
          </h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <RecentWork />
          </div>
        </RevealBatch>
        <section className="mx-auto max-w-[1425px] px-6 pb-[clamp(80px,10vw,140px)] md:px-8">
          <div className="flex flex-col items-start gap-6 rounded-[12px] border border-fg/12 bg-bg/30 p-8 backdrop-blur-[14px] md:flex-row md:items-center md:justify-between md:p-10">
            <div>
              <h2 className="font-display text-[clamp(24px,2.6vw,34px)] leading-[1.15] font-medium tracking-h3">
                {$t("need-this-for-your-project")}
              </h2>
              <p className="mt-2 text-body-s text-fg-muted">
                {$t("tell-us-where-you-are-and")}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/contact" className="inline-flex items-center rounded-full border border-transparent bg-fg px-[15px] py-[9px] text-[14px] leading-none font-medium text-bg transition-colors hover:bg-fg-strong">
                <RollText text={$t("get-in-touch")} />
              </Link>
              <Link href="/services/crafted-websites" className="inline-flex items-center rounded-full border border-line-strong px-[15px] py-[9px] text-[14px] leading-none font-medium transition-colors hover:border-fg-subtle hover:bg-surface">
                <RollText text={$t("next-crafted-websites")} />
              </Link>
            </div>
          </div>
          <ul className="mt-6 flex flex-wrap gap-2">
            <li>
              <Link href="/services/crafted-websites" className="inline-flex rounded-full border border-line px-4 py-2 text-body-s text-fg-muted transition-colors hover:border-line-strong hover:text-fg">
                {$t("crafted-websites")}
              </Link>
            </li>
            <li>
              <Link href="/services/website-redesign" className="inline-flex rounded-full border border-line px-4 py-2 text-body-s text-fg-muted transition-colors hover:border-line-strong hover:text-fg">
                {$t("website-redesign")}
              </Link>
            </li>
            <li>
              <Link href="/services/ecommerce-website-design" className="inline-flex rounded-full border border-line px-4 py-2 text-body-s text-fg-muted transition-colors hover:border-line-strong hover:text-fg">
                {$t("ecommerce-website-design")}
              </Link>
            </li>
          </ul>
        </section>
      </main>
    </>
  );
}
