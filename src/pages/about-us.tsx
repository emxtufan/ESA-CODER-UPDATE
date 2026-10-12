import BadgeImage from '@/components/BadgeImage';
import PageTitle from '@/components/PageTitle';
import Reveal from '@/components/motion/Reveal';

// Converted 1:1 from the RSC payload of /about-us.
export default function Page_about_us() {
  return (
    <>
      <main className="relative isolate">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: "{\"@context\":\"https://schema.org\",\"@type\":\"BreadcrumbList\",\"itemListElement\":[{\"@type\":\"ListItem\",\"position\":1,\"name\":\"Home\",\"item\":\"https://visuvate.com/\"},{\"@type\":\"ListItem\",\"position\":2,\"name\":\"About Us\",\"item\":\"https://visuvate.com/about-us\"}]}" }} />
        <PageTitle lead="About " trail="Us" />
        <div className="relative mt-0 pt-[40px] backdrop-blur-[10px] lg:-mt-[73px]" style={{ background: "color-mix(in srgb, var(--vv-bg) 80%, transparent)" }}>
          <span aria-hidden className="pointer-events-none absolute top-0 left-1/2 h-px w-[600px] max-w-full -translate-x-1/2" style={{ background: "linear-gradient(90deg, transparent 0%, var(--vv-card-line) 50%, transparent 100%)" }} />
          <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[420px]" style={{ background: "radial-gradient(34% 40% at 50% 0%, var(--vv-card-lift) 0%, var(--vv-card-lift-mid) 45%, transparent 76%)" }} />
          <div className="relative flex justify-center">
            <img src="/about/mark.webp" alt="" width={178} height={74} className="vv-about-mark h-[74px] w-[178px] object-contain" />
          </div>
          <section className="relative mx-auto mt-[6px] max-w-[725px] px-6 text-center text-[18px] leading-[1.8] text-fg-muted md:px-8">
            <Reveal>
              <p data-reveal>
                <span className="text-fg">
                  Visuvate
                </span>
                {" is a design studio that builds"}
                {" "}
                <span className="text-fg">
                  premium digital experiences
                </span>
                {" with clarity and purpose. We create websites that are visually refined, technically sound, and meaningful to the people who use them."}
              </p>
              <p data-reveal className="mt-[32px]">
                {"Every project begins with understanding and ends with precision. Our goal is to design experiences that feel effortless and intentional while delivering measurable results that help "}
                <span className="text-fg">
                  brands grow
                </span>
                {" and "}
                <span className="text-fg">
                  perform better online.
                </span>
              </p>
            </Reveal>
          </section>
          <Reveal className="mx-auto relative mt-[79px] grid max-w-[560px] grid-cols-4 items-center justify-items-center gap-x-4 gap-y-6 px-6 lg:max-w-[600px] lg:gap-x-6">
            <BadgeImage data-reveal src="/about/badge-wix-studio.webp" alt="Wix Studio Certified Web Designer, 2020–2025" className="object-contain transition-opacity duration-500 ease-brand" style={{ height: "clamp(75px, 11vw, 95px)", width: "auto" }} loading="lazy" decoding="async" />
            <BadgeImage data-reveal src="/about/badge-orpetron.webp" alt="Orpetron Web Design Appreciation" className="object-contain transition-opacity duration-500 ease-brand vv-badge-invert" style={{ height: "clamp(75px, 11vw, 95px)", width: "auto" }} loading="lazy" decoding="async" />
            <BadgeImage data-reveal src="/about/badge-wix-legend.webp" alt="Wix Partner Legend" className="object-contain transition-opacity duration-500 ease-brand" style={{ height: "clamp(75px, 11vw, 95px)", width: "auto" }} loading="lazy" decoding="async" />
            <BadgeImage data-reveal src="/about/badge-wop.webp" alt="Featured on Wall of Portfolios, 2025" className="object-contain transition-opacity duration-500 ease-brand" style={{ height: "clamp(75px, 11vw, 95px)", width: "auto" }} loading="lazy" decoding="async" />
          </Reveal>
          <section className="relative mx-auto mt-[80px] max-w-[725px] px-6 text-center text-[18px] leading-[1.8] text-fg-muted md:px-8">
            <Reveal>
              <h2 data-reveal className="font-display text-[28px] leading-[1.2] font-medium tracking-[-0.02em] text-fg">
                Our Philosophy
              </h2>
              <p data-reveal className="mt-[19px]">
                We believe good design should feel effortless and grounded in purpose. Every detail matters, from the way a page moves to how it makes someone feel. At Visuvate, design is not just about how things look but how clearly they communicate and how seamlessly they perform.
              </p>
              <p data-reveal className="mt-[120px]">
                Founded by
                {" "}
                <span className="inline-flex translate-y-[9px] items-center gap-2">
                  <img src="/about/devansh.ef311e02.avif" alt="" className="size-8 rounded-full object-cover" loading="lazy" decoding="async" />
                  <a href="https://www.devanshprakash.com/" target="_blank" rel="noreferrer noopener" className="text-fg">
                    Devansh
                  </a>
                </span>
                {", Visuvate was created from a passion for visual innovation and a belief in designing with detail. Every project reflects a commitment to clarity, purpose, and precision, values that define both the work and the process behind it."}
              </p>
            </Reveal>
          </section>
          <section className="relative mx-auto mt-[119px] max-w-[1425px] px-6 pb-[clamp(80px,10vw,140px)] md:px-8">
            <Reveal>
              <h2 data-reveal className="text-center font-display text-[28px] leading-[1.2] font-medium tracking-[-0.02em]">
                Our Values
              </h2>
            </Reveal>
            <div className="relative mt-0 pt-[32px]">
              <span aria-hidden className="pointer-events-none absolute top-0 bottom-0 left-1/2 w-px -translate-x-1/2" style={{ background: "linear-gradient(180deg, transparent 0%, color-mix(in srgb, var(--vv-text-primary) 60%, transparent) 12%, color-mix(in srgb, var(--vv-text-primary) 60%, transparent) 82%, transparent 100%)" }} />
              <ul className="flex flex-col">
                <li className="grid grid-cols-[1fr_1fr] gap-x-8 lg:gap-x-40" style={{ marginTop: 47 }}>
                  <Reveal className="relative col-start-1 ml-auto text-right lg:w-[310px] lg:pr-0">
                    <span aria-hidden className="pointer-events-none absolute top-[11px] h-px w-[10px] lg:top-[17px] lg:w-[50px] -right-[16px] lg:-right-[80px]" style={{ background: "color-mix(in srgb, var(--vv-text-primary) 60%, transparent)" }} />
                    <h3 data-reveal className="font-display text-[20px] leading-[1.2] font-medium tracking-[-0.02em] text-fg lg:text-[28px]">
                      Clarity
                    </h3>
                    <p data-reveal className="mt-[12px] text-[13px] leading-[1.7] text-fg-muted lg:mt-[20px] lg:text-[16px] lg:leading-[1.8]">
                      Design should simplify. Every decision we make is meant to bring focus and understanding.
                    </p>
                  </Reveal>
                </li>
                <li className="grid grid-cols-[1fr_1fr] gap-x-8 lg:gap-x-40">
                  <Reveal className="relative col-start-2 mr-auto lg:w-[310px] lg:pl-0">
                    <span aria-hidden className="pointer-events-none absolute top-[11px] h-px w-[10px] lg:top-[17px] lg:w-[50px] -left-[16px] lg:-left-[80px]" style={{ background: "color-mix(in srgb, var(--vv-text-primary) 60%, transparent)" }} />
                    <h3 data-reveal className="font-display text-[20px] leading-[1.2] font-medium tracking-[-0.02em] text-fg lg:text-[28px]">
                      Precision
                    </h3>
                    <p data-reveal className="mt-[12px] text-[13px] leading-[1.7] text-fg-muted lg:mt-[20px] lg:text-[16px] lg:leading-[1.8]">
                      Every detail matters. From layout to motion, precision defines how we work.
                    </p>
                  </Reveal>
                </li>
                <li className="grid grid-cols-[1fr_1fr] gap-x-8 lg:gap-x-40">
                  <Reveal className="relative col-start-1 ml-auto text-right lg:w-[310px] lg:pr-0">
                    <span aria-hidden className="pointer-events-none absolute top-[11px] h-px w-[10px] lg:top-[17px] lg:w-[50px] -right-[16px] lg:-right-[80px]" style={{ background: "color-mix(in srgb, var(--vv-text-primary) 60%, transparent)" }} />
                    <h3 data-reveal className="font-display text-[20px] leading-[1.2] font-medium tracking-[-0.02em] text-fg lg:text-[28px]">
                      Purpose
                    </h3>
                    <p data-reveal className="mt-[12px] text-[13px] leading-[1.7] text-fg-muted lg:mt-[20px] lg:text-[16px] lg:leading-[1.8]">
                      Each project begins with understanding. We design with intent so every choice supports a goal.
                    </p>
                  </Reveal>
                </li>
                <li className="grid grid-cols-[1fr_1fr] gap-x-8 lg:gap-x-40">
                  <Reveal className="relative col-start-2 mr-auto lg:w-[310px] lg:pl-0">
                    <span aria-hidden className="pointer-events-none absolute top-[11px] h-px w-[10px] lg:top-[17px] lg:w-[50px] -left-[16px] lg:-left-[80px]" style={{ background: "color-mix(in srgb, var(--vv-text-primary) 60%, transparent)" }} />
                    <h3 data-reveal className="font-display text-[20px] leading-[1.2] font-medium tracking-[-0.02em] text-fg lg:text-[28px]">
                      Consistency
                    </h3>
                    <p data-reveal className="mt-[12px] text-[13px] leading-[1.7] text-fg-muted lg:mt-[20px] lg:text-[16px] lg:leading-[1.8]">
                      Design should feel seamless across every touchpoint. We create systems that stay cohesive and dependable.
                    </p>
                  </Reveal>
                </li>
                <li className="grid grid-cols-[1fr_1fr] gap-x-8 lg:gap-x-40">
                  <Reveal className="relative col-start-1 ml-auto text-right lg:w-[310px] lg:pr-0">
                    <span aria-hidden className="pointer-events-none absolute top-[11px] h-px w-[10px] lg:top-[17px] lg:w-[50px] -right-[16px] lg:-right-[80px]" style={{ background: "color-mix(in srgb, var(--vv-text-primary) 60%, transparent)" }} />
                    <h3 data-reveal className="font-display text-[20px] leading-[1.2] font-medium tracking-[-0.02em] text-fg lg:text-[28px]">
                      Performance
                    </h3>
                    <p data-reveal className="mt-[12px] text-[13px] leading-[1.7] text-fg-muted lg:mt-[20px] lg:text-[16px] lg:leading-[1.8]">
                      A design is complete only when it works as beautifully as it looks. We build websites that are fast, fluid, and reliable.
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
