import HeadingReveal from '@/components/motion/HeadingReveal';
import Link from '@/components/Link';
import RevealBatch from '@/components/motion/RevealBatch';
import RollText from '@/components/RollText';
import ServicesBackdrop from '@/components/services/ServicesBackdrop';

import {text, textList} from '@/lib/text';
import {ManagedCare, PlanCards, Terms, plans} from '@/components/sections/Pricing';
import '@/styles/pricing.css';
import RecentWork from '@/components/works/RecentWork';

const SCOPE = "/services/crafted-websites";
const $t = text(SCOPE);
const list = (key: string) => textList(SCOPE, key);

// How we work, B–G of the brief: one card each, the details as short chips
const TOPICS = ['discovery', 'design', 'development', 'seo', 'privacy', 'performance'];
const STEPS = ['1', '2', '3', '4', '5', '6', '7'];

// Converted 1:1 from the RSC payload of /services/crafted-websites.
export default function Page_services__crafted_websites() {
  return (
    <>
      <main className="relative isolate">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: "{\"@context\":\"https://schema.org\",\"@type\":\"Service\",\"name\":\"Crafted\\nWebsites\",\"description\":\"Custom-built websites designed from the ground up for clarity, structure, and intent. Every site blends tailored design, responsive performance, and seamless functionality. Most business websites are a theme with the client’s logo dropped into it. That is why so many of them feel interchangeable: th\",\"url\":\"https://visuvate.com/services/crafted-websites\",\"serviceType\":\"Crafted\\nWebsites\",\"provider\":{\"@id\":\"https://visuvate.com/#organization\"},\"areaServed\":[{\"@type\":\"Country\",\"name\":\"United States\"},{\"@type\":\"Country\",\"name\":\"United Kingdom\"},{\"@type\":\"Country\",\"name\":\"Canada\"},{\"@type\":\"Country\",\"name\":\"Australia\"},{\"@type\":\"Country\",\"name\":\"Ireland\"},{\"@type\":\"Country\",\"name\":\"New Zealand\"},{\"@type\":\"Country\",\"name\":\"Germany\"},{\"@type\":\"Country\",\"name\":\"Netherlands\"},{\"@type\":\"Country\",\"name\":\"Switzerland\"},{\"@type\":\"Country\",\"name\":\"Sweden\"},{\"@type\":\"Country\",\"name\":\"United Arab Emirates\"},{\"@type\":\"Country\",\"name\":\"Singapore\"},{\"@type\":\"Country\",\"name\":\"India\"}]}" }} />
        <ServicesBackdrop tone="mono" className="fixed inset-0 -z-10" />
        <span aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-[280px]" style={{ background: "linear-gradient(180deg, transparent 0%, var(--vv-bg) 92%)" }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: "{\"@context\":\"https://schema.org\",\"@type\":\"BreadcrumbList\",\"itemListElement\":[{\"@type\":\"ListItem\",\"position\":1,\"name\":\"Home\",\"item\":\"https://visuvate.com/\"},{\"@type\":\"ListItem\",\"position\":2,\"name\":\"Services\",\"item\":\"https://visuvate.com/services\"},{\"@type\":\"ListItem\",\"position\":3,\"name\":\"Crafted\\nWebsites\",\"item\":\"https://visuvate.com/services/crafted-websites\"}]}" }} />
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
              {$t("crafted-websites")}
            </h1>
          </HeadingReveal>
        </header>
        <section className="mx-auto max-w-[1425px] px-6 pb-[clamp(56px,7vw,96px)] md:px-8">
          <div className="grid gap-x-16 gap-y-12 lg:grid-cols-[1fr_0.78fr]">
            <div className="max-w-[660px]">
              <p className="text-[clamp(20px,2vw,26px)] leading-[1.5] font-medium text-fg">
                {$t("custom-built-websites-designed-from-the")}
              </p>
              <p className="mt-5 text-lead leading-[1.75] text-fg-muted">
                {$t("most-business-websites-are-a-theme")}
              </p>
              <p className="mt-5 text-lead leading-[1.75] text-fg-muted">
                {$t("this-is-the-right-choice-when")}
              </p>
              <p className="mt-5 text-lead leading-[1.75] text-fg-muted">
                {$t("every-build-runs-on-wix-studio")}
              </p>
              <p className="mt-5 text-lead leading-[1.75] text-fg-muted">
                {$t("responsive-is-not-a-checkbox-at")}
              </p>
              <p className="mt-5 text-lead leading-[1.75] text-fg-muted">
                {$t("you-share-your-content-your-preferences")}
              </p>
              <p className="mt-5 text-lead leading-[1.75] text-fg-muted">
                {$t("you-finish-with-a-site-you")}
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
                  {$t("5-core-pages-home-about-services")}
                </li>
                <li className="flex gap-3 text-[15px] leading-[1.5] text-fg-strong">
                  <svg viewBox="0 0 24 24" className="mt-[3px] size-[15px] shrink-0 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="m5 13 4 4L19 7" />
                  </svg>
                  {$t("fully-responsive-layout-across-devices")}
                </li>
                <li className="flex gap-3 text-[15px] leading-[1.5] text-fg-strong">
                  <svg viewBox="0 0 24 24" className="mt-[3px] size-[15px] shrink-0 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="m5 13 4 4L19 7" />
                  </svg>
                  {$t("cms-setup-for-dynamic-content")}
                </li>
                <li className="flex gap-3 text-[15px] leading-[1.5] text-fg-strong">
                  <svg viewBox="0 0 24 24" className="mt-[3px] size-[15px] shrink-0 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="m5 13 4 4L19 7" />
                  </svg>
                  {$t("animation-and-micro-interactions")}
                </li>
                <li className="flex gap-3 text-[15px] leading-[1.5] text-fg-strong">
                  <svg viewBox="0 0 24 24" className="mt-[3px] size-[15px] shrink-0 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="m5 13 4 4L19 7" />
                  </svg>
                  {$t("basic-seo-setup")}
                </li>
              </ul>
              <p className="mt-6 border-t pt-5 text-body-s text-fg-muted" style={{ borderColor: "var(--vv-card-rule)" }}>
                {$t("from-price").replace('{price}', `${plans()[0]?.price} ${plans()[0]?.currency}`)}{' '}
                <a href="#pachete" className="text-fg underline decoration-fg/30 underline-offset-4 hover:decoration-fg">{$t("see-packages")}</a>
              </p>
              <Link href="/contact" className="mt-7 flex h-11 items-center justify-center rounded-full bg-fg text-[14px] font-medium text-bg transition-opacity hover:opacity-90">
                <RollText text={$t("start-a-project")} />
              </Link>
            </div>
          </div>
        </section>
        <RevealBatch className="mx-auto max-w-[1425px] px-6 pb-[clamp(56px,7vw,96px)] md:px-8">
          <h2 className="mb-8 font-display text-[clamp(28px,3.4vw,44px)] leading-[1] font-medium tracking-h2">
            {$t("how-we-work")}
          </h2>
          <div className="cw-grid cw-grid-3">
            {TOPICS.map((topic, i) => (
              <article key={topic} data-reveal className="cw-card">
                <span className="cw-num">{String(i + 1).padStart(2, '0')}</span>
                <h3>{$t(`${topic}-title`)}</h3>
                <p>{$t(`${topic}-text`)}</p>
                <ul className="cw-chips">
                  {list(`${topic}-items`).map((item) => <li key={item}>{item}</li>)}
                </ul>
                {list(`${topic}-notes`).map((note, n) => <p key={n} className="cw-note" dangerouslySetInnerHTML={{ __html: note }} />)}
              </article>
            ))}
          </div>
        </RevealBatch>
        <RevealBatch className="mx-auto max-w-[1425px] px-6 pb-[clamp(56px,7vw,96px)] md:px-8">
          <div className="cw-grid">
            <article data-reveal className="cw-card">
              <span className="cw-num">07</span>
              <h3>{$t("hosting-title")}</h3>
              <p>{$t("hosting-text")}</p>
              <p>{$t("hosting-subtext")}</p>
              <ul className="cw-chips">
                {list("hosting-items").map((item) => <li key={item}>{item}</li>)}
              </ul>
            </article>
            <article data-reveal className="cw-card">
              <h3 className="cw-flush">{$t("infra-title")}</h3>
              <div className="cw-table-wrap">
                <table className="cw-table">
                  <thead>
                    <tr>
                      <th scope="col">{$t("infra-col-plan")}</th>
                      <th scope="col">{$t("infra-col-domain")}</th>
                      <th scope="col">{$t("infra-col-hosting")}</th>
                      <th scope="col">{$t("infra-col-total")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {plans().map((plan) => (
                      <tr key={plan.id}>
                        <td>{plan.name}</td>
                        <td>{plan.domainPrice} {plan.infraCurrency}</td>
                        <td>{plan.infraPrice - plan.domainPrice} {plan.infraCurrency}</td>
                        <td>{plan.infraPrice} {plan.infraCurrency}{$t("per-month")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {list("infra-notes").map((note, n) => <p key={n} className="cw-note">{note}</p>)}
            </article>
          </div>
        </RevealBatch>
        <RevealBatch className="mx-auto max-w-[1425px] px-6 pb-[clamp(56px,7vw,96px)] md:px-8">
          <h2 id="pachete" className="mb-8 font-display text-[clamp(28px,3.4vw,44px)] leading-[1] font-medium tracking-h2">
            {$t("packages-title")}
          </h2>
          <p data-reveal className="cw-lead max-w-[660px] text-body-s leading-[1.7] text-fg-muted">{$t("packages-text")}</p>
          <PlanCards detailed />
        </RevealBatch>
        <RevealBatch className="mx-auto max-w-[1425px] px-6 pb-[clamp(56px,7vw,96px)] md:px-8">
          <h2 className="mb-8 font-display text-[clamp(28px,3.4vw,44px)] leading-[1] font-medium tracking-h2">
            {$t("after-launch-title")}
          </h2>
          <p data-reveal className="cw-lead max-w-[660px] text-body-s leading-[1.7] text-fg-muted">{$t("after-launch-text")}</p>
          <ManagedCare detailed />
        </RevealBatch>
        <RevealBatch className="mx-auto max-w-[1425px] px-6 pb-[clamp(56px,7vw,96px)] md:px-8">
          <h2 className="mb-8 font-display text-[clamp(28px,3.4vw,44px)] leading-[1] font-medium tracking-h2">
            {$t("delivery-title")}
          </h2>
          <ol className="cw-steps">
            {STEPS.map((n) => (
              <li key={n} data-reveal>
                <strong>{$t(`step-${n}-title`)}</strong>
                <span>{$t(`step-${n}-text`)}</span>
              </li>
            ))}
          </ol>
          <div className="mt-5">
            <Terms detailed />
          </div>
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
              <Link href="/services/website-redesign" className="inline-flex items-center rounded-full border border-line-strong px-[15px] py-[9px] text-[14px] leading-none font-medium transition-colors hover:border-fg-subtle hover:bg-surface">
                <RollText text={$t("next-website-redesign")} />
              </Link>
            </div>
          </div>
          <ul className="mt-6 flex flex-wrap gap-2">
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
            <li>
              <Link href="/services/cms-and-dynamic-websites" className="inline-flex rounded-full border border-line px-4 py-2 text-body-s text-fg-muted transition-colors hover:border-line-strong hover:text-fg">
                {$t("cms-dynamic-websites")}
              </Link>
            </li>
          </ul>
        </section>
      </main>
    </>
  );
}
