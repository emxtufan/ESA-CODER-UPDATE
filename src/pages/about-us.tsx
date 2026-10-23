import BadgeImage from '@/components/BadgeImage';
import PageTitle from '@/components/PageTitle';
import Reveal from '@/components/motion/Reveal';

import {text} from '@/lib/text';

const $t = text("/about-us");

// Converted 1:1 from the RSC payload of /about-us.
export default function Page_about_us() {
  return (
    <>
      <main className="relative isolate">
        <PageTitle lead={$t("about")} trail={$t("us")} />
        <div className="relative mt-0 pt-[40px] lg:-mt-[73px]" style={{ background: "color-mix(in srgb, var(--vv-bg) 80%, transparent)" }}>
          <span aria-hidden className="pointer-events-none absolute top-0 left-1/2 h-px w-[600px] max-w-full -translate-x-1/2" style={{ background: "linear-gradient(90deg, transparent 0%, var(--vv-card-line) 50%, transparent 100%)" }} />
          <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[420px]" style={{ background: "radial-gradient(34% 40% at 50% 0%, var(--vv-card-lift) 0%, var(--vv-card-lift-mid) 45%, transparent 76%)" }} />
          <div className="relative flex justify-center">
            <img src="/about/mark.webp" alt="" width={178} height={74} className="vv-about-mark h-[74px] w-[178px] object-contain" />
          </div>
          <section className="relative mx-auto mt-[6px] max-w-[725px] px-6 text-center text-[18px] leading-[1.8] text-fg-muted md:px-8">
            <Reveal>
              <p data-reveal>
                <span className="text-fg">
                  {$t("visuvate")}
                </span>
                {$t("is-a-design-studio-that-builds")}
                {" "}
                <span className="text-fg">
                  {$t("premium-digital-experiences")}
                </span>
                {$t("with-clarity-and-purpose-we-create")}
              </p>
              <p data-reveal className="mt-[32px]">
                {$t("every-project-begins-with-understanding-and")}
                <span className="text-fg">
                  {$t("brands-grow")}
                </span>
                {$t("and")}
                <span className="text-fg">
                  {$t("perform-better-online")}
                </span>
              </p>
            </Reveal>
          </section>
          <Reveal className="mx-auto relative mt-[79px] grid max-w-[560px] grid-cols-4 items-center justify-items-center gap-x-4 gap-y-6 px-6 lg:max-w-[600px] lg:gap-x-6">
            <BadgeImage data-reveal src="/about/badge-wix-studio.webp" alt={$t("wix-studio-certified-web-designer-2020")} className="object-contain transition-opacity duration-500 ease-brand" style={{ height: "clamp(75px, 11vw, 95px)", width: "auto" }} loading="lazy" decoding="async" />
            <BadgeImage data-reveal src="/about/badge-orpetron.webp" alt={$t("orpetron-web-design-appreciation")} className="object-contain transition-opacity duration-500 ease-brand vv-badge-invert" style={{ height: "clamp(75px, 11vw, 95px)", width: "auto" }} loading="lazy" decoding="async" />
            <BadgeImage data-reveal src="/about/badge-wix-legend.webp" alt={$t("wix-partner-legend")} className="object-contain transition-opacity duration-500 ease-brand" style={{ height: "clamp(75px, 11vw, 95px)", width: "auto" }} loading="lazy" decoding="async" />
            <BadgeImage data-reveal src="/about/badge-wop.webp" alt={$t("featured-on-wall-of-portfolios-2025")} className="object-contain transition-opacity duration-500 ease-brand" style={{ height: "clamp(75px, 11vw, 95px)", width: "auto" }} loading="lazy" decoding="async" />
          </Reveal>
          <section className="relative mx-auto mt-[80px] max-w-[725px] px-6 text-center text-[18px] leading-[1.8] text-fg-muted md:px-8">
            <Reveal>
              <h2 data-reveal className="font-display text-[28px] leading-[1.2] font-medium tracking-[-0.02em] text-fg">
                {$t("our-philosophy")}
              </h2>
              <p data-reveal className="mt-[19px]">
                {$t("we-believe-good-design-should-feel")}
              </p>
              <p data-reveal className="mt-[120px]">
                {$t("founded-by")}
                {" "}
                <span className="text-fg">
                  {$t("devansh")}
                </span>
                {$t("visuvate-was-created-from-a-passion")}
              </p>
            </Reveal>
          </section>
          <section className="relative mx-auto mt-[119px] max-w-[1425px] px-6 pb-[clamp(80px,10vw,140px)] md:px-8">
            <Reveal>
              <h2 data-reveal className="text-center font-display text-[28px] leading-[1.2] font-medium tracking-[-0.02em]">
                {$t("our-values")}
              </h2>
            </Reveal>
            <div className="relative mt-0 pt-[32px]">
              <span aria-hidden className="pointer-events-none absolute top-0 bottom-0 left-1/2 w-px -translate-x-1/2" style={{ background: "linear-gradient(180deg, transparent 0%, color-mix(in srgb, var(--vv-text-primary) 60%, transparent) 12%, color-mix(in srgb, var(--vv-text-primary) 60%, transparent) 82%, transparent 100%)" }} />
              <ul className="flex flex-col">
                <li className="grid grid-cols-[1fr_1fr] gap-x-8 lg:gap-x-40" style={{ marginTop: 47 }}>
                  <Reveal className="relative col-start-1 ml-auto text-right lg:w-[310px] lg:pr-0">
                    <span aria-hidden className="pointer-events-none absolute top-[11px] h-px w-[10px] lg:top-[17px] lg:w-[50px] -right-[16px] lg:-right-[80px]" style={{ background: "color-mix(in srgb, var(--vv-text-primary) 60%, transparent)" }} />
                    <h3 data-reveal className="font-display text-[20px] leading-[1.2] font-medium tracking-[-0.02em] text-fg lg:text-[28px]">
                      {$t("clarity")}
                    </h3>
                    <p data-reveal className="mt-[12px] text-[13px] leading-[1.7] text-fg-muted lg:mt-[20px] lg:text-[16px] lg:leading-[1.8]">
                      {$t("design-should-simplify-every-decision-we")}
                    </p>
                  </Reveal>
                </li>
                <li className="grid grid-cols-[1fr_1fr] gap-x-8 lg:gap-x-40">
                  <Reveal className="relative col-start-2 mr-auto lg:w-[310px] lg:pl-0">
                    <span aria-hidden className="pointer-events-none absolute top-[11px] h-px w-[10px] lg:top-[17px] lg:w-[50px] -left-[16px] lg:-left-[80px]" style={{ background: "color-mix(in srgb, var(--vv-text-primary) 60%, transparent)" }} />
                    <h3 data-reveal className="font-display text-[20px] leading-[1.2] font-medium tracking-[-0.02em] text-fg lg:text-[28px]">
                      {$t("precision")}
                    </h3>
                    <p data-reveal className="mt-[12px] text-[13px] leading-[1.7] text-fg-muted lg:mt-[20px] lg:text-[16px] lg:leading-[1.8]">
                      {$t("every-detail-matters-from-layout-to")}
                    </p>
                  </Reveal>
                </li>
                <li className="grid grid-cols-[1fr_1fr] gap-x-8 lg:gap-x-40">
                  <Reveal className="relative col-start-1 ml-auto text-right lg:w-[310px] lg:pr-0">
                    <span aria-hidden className="pointer-events-none absolute top-[11px] h-px w-[10px] lg:top-[17px] lg:w-[50px] -right-[16px] lg:-right-[80px]" style={{ background: "color-mix(in srgb, var(--vv-text-primary) 60%, transparent)" }} />
                    <h3 data-reveal className="font-display text-[20px] leading-[1.2] font-medium tracking-[-0.02em] text-fg lg:text-[28px]">
                      {$t("purpose")}
                    </h3>
                    <p data-reveal className="mt-[12px] text-[13px] leading-[1.7] text-fg-muted lg:mt-[20px] lg:text-[16px] lg:leading-[1.8]">
                      {$t("each-project-begins-with-understanding-we")}
                    </p>
                  </Reveal>
                </li>
                <li className="grid grid-cols-[1fr_1fr] gap-x-8 lg:gap-x-40">
                  <Reveal className="relative col-start-2 mr-auto lg:w-[310px] lg:pl-0">
                    <span aria-hidden className="pointer-events-none absolute top-[11px] h-px w-[10px] lg:top-[17px] lg:w-[50px] -left-[16px] lg:-left-[80px]" style={{ background: "color-mix(in srgb, var(--vv-text-primary) 60%, transparent)" }} />
                    <h3 data-reveal className="font-display text-[20px] leading-[1.2] font-medium tracking-[-0.02em] text-fg lg:text-[28px]">
                      {$t("consistency")}
                    </h3>
                    <p data-reveal className="mt-[12px] text-[13px] leading-[1.7] text-fg-muted lg:mt-[20px] lg:text-[16px] lg:leading-[1.8]">
                      {$t("design-should-feel-seamless-across-every")}
                    </p>
                  </Reveal>
                </li>
                <li className="grid grid-cols-[1fr_1fr] gap-x-8 lg:gap-x-40">
                  <Reveal className="relative col-start-1 ml-auto text-right lg:w-[310px] lg:pr-0">
                    <span aria-hidden className="pointer-events-none absolute top-[11px] h-px w-[10px] lg:top-[17px] lg:w-[50px] -right-[16px] lg:-right-[80px]" style={{ background: "color-mix(in srgb, var(--vv-text-primary) 60%, transparent)" }} />
                    <h3 data-reveal className="font-display text-[20px] leading-[1.2] font-medium tracking-[-0.02em] text-fg lg:text-[28px]">
                      {$t("performance")}
                    </h3>
                    <p data-reveal className="mt-[12px] text-[13px] leading-[1.7] text-fg-muted lg:mt-[20px] lg:text-[16px] lg:leading-[1.8]">
                      {$t("a-design-is-complete-only-when")}
                    </p>
                  </Reveal>
                </li>
              </ul>
              <span aria-hidden className="pointer-events-none sticky bottom-0 z-10 block h-[220px] w-full" style={{ background: "linear-gradient(to top, var(--vv-bg) 18%, transparent 100%)" }} />
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
