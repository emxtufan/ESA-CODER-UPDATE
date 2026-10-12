import ApproachPanel from '@/components/approach/ApproachPanel';
import ApproachSitesMarquee from '@/components/approach/ApproachSitesMarquee';
import Laptop from '@/components/approach/Laptop';
import Reveal from '@/components/motion/Reveal';
import WatchDial from '@/components/approach/WatchDial';

// Server component, converted 1:1 from the RSC payload.
export default function Approach() {
  return (
    <section id="approach" className="bg-bg py-[clamp(80px,9vw,135px)]">
      <div className="mx-auto max-w-[1380px] px-6 md:px-8">
        <Reveal>
          <h2 data-reveal className="font-display text-[clamp(38px,4.6vw,64px)] leading-[1] font-medium tracking-h1">
            Our Approach
          </h2>
        </Reveal>
        <div className="mt-10 flex flex-col gap-5">
          <Reveal refreshOnComplete>
            <div className="grid gap-5 min-[751px]:grid-cols-[775fr_540fr] lg:h-[593px]">
              <article data-reveal className="relative isolate overflow-hidden rounded-[12px] border border-fg/20 bg-card lg:min-h-0 min-h-[353px]">
                <div className="relative z-10 px-5 py-8 lg:px-9 lg:pt-[45px] lg:pb-0">
                  <h3 className="font-display text-[clamp(24px,2.6vw,36px)] leading-[1.1] font-medium tracking-h2 ">
                    Discovery First
                  </h3>
                  <p className="mt-2 text-[12px] leading-[1.6] text-fg-muted lg:mt-3 lg:text-lead ">
                    <span>
                      {"We begin by "}
                    </span>
                    <span className="text-fg">
                      defining clear goals,
                    </span>
                    <span>
                      {" understanding your audience, and aligning with your brand voice to set a strong foundation."}
                    </span>
                  </p>
                </div>
                <ApproachSitesMarquee />
              </article>
              <article data-reveal className="relative isolate overflow-hidden rounded-[12px] border border-fg/20 bg-card lg:min-h-0 min-h-[391px]">
                <div className="vv-art-mobile absolute inset-0 -z-10" aria-hidden />
                <div className="relative z-10 px-5 py-8 lg:px-9 lg:pt-[45px] lg:pb-0">
                  <h3 className="font-display text-[clamp(24px,2.6vw,36px)] leading-[1.1] font-medium tracking-h2 text-white">
                    Mobile-First Design
                  </h3>
                  <p className="mt-2 text-[12px] leading-[1.6] text-fg-muted lg:mt-3 lg:text-lead text-white/70">
                    <span>
                      {"Every layout is designed for "}
                    </span>
                    <span className="text-white">
                      seamless mobile-first experiences,
                    </span>
                    <span>
                      {" ensuring performance across all devices."}
                    </span>
                  </p>
                </div>
                <img src="/approach/phone-a.webp" alt="" className="vv-breathe pointer-events-none absolute top-[131px] left-[45.3%] w-[50%] lg:top-[170px]" style={{ "--vv-breathe-distance": "10px", animationDuration: "5s" }} loading="lazy" decoding="async" />
                <img src="/approach/phone-b.webp" alt="" className="vv-breathe pointer-events-none absolute top-[142px] left-[5%] w-[52.6%] lg:top-[214px]" style={{ "--vv-breathe-distance": "15px", animationDuration: "6s" }} loading="lazy" decoding="async" />
              </article>
            </div>
          </Reveal>
          <Reveal refreshOnComplete>
            <div className="grid gap-5 min-[751px]:grid-cols-[540fr_775fr] lg:h-[650px]">
              <article data-reveal className="relative isolate overflow-hidden rounded-[12px] border border-fg/20 bg-card lg:min-h-0 min-h-[398px]">
                <div className="vv-art-conversion absolute inset-0 -z-10" aria-hidden />
                <div className="relative z-10 px-5 py-8 lg:px-9 lg:pt-[45px] lg:pb-0">
                  <h3 className="font-display text-[clamp(24px,2.6vw,36px)] leading-[1.1] font-medium tracking-h2 ">
                    Conversion-Driven
                  </h3>
                  <p className="mt-2 text-[12px] leading-[1.6] text-fg-muted lg:mt-3 lg:text-lead ">
                    <span>
                      {"Websites built with strategy, designed to engage audiences, and crafted to turn "}
                    </span>
                    <span className="text-fg">
                      visitors into customers.
                    </span>
                  </p>
                </div>
                <div className="absolute inset-0 origin-top-left translate-x-[24px] translate-y-[18px] scale-[0.584] lg:translate-x-0 lg:translate-y-0 lg:scale-100">
                  <Laptop />
                </div>
              </article>
              <article data-reveal className="relative isolate overflow-hidden rounded-[12px] border border-fg/20 bg-card lg:min-h-0 min-h-[399px]">
                <div className="vv-art-pixel absolute inset-0 -z-10" aria-hidden />
                <div className="relative z-10 px-5 py-8 lg:px-9 lg:pt-[45px] lg:pb-0">
                  <h3 className="font-display text-[clamp(24px,2.6vw,36px)] leading-[1.1] font-medium tracking-h2 ">
                    Pixel-Perfect Development
                  </h3>
                  <p className="mt-2 text-[12px] leading-[1.6] text-fg-muted lg:mt-3 lg:text-lead ">
                    <span>
                      {"Designed and developed with "}
                    </span>
                    <span className="text-fg">
                      pixel-perfect precision
                    </span>
                    <span>
                      {", delivering high performance and easy updates."}
                    </span>
                  </p>
                </div>
                <div className="absolute inset-0 origin-top-left -translate-x-[4px] scale-[0.68] lg:translate-x-0 lg:scale-100">
                  <ApproachPanel />
                </div>
              </article>
            </div>
          </Reveal>
          <Reveal refreshOnComplete>
            <div className="grid gap-5 min-[751px]:grid-cols-[775fr_540fr] lg:h-[560px]">
              <article data-reveal className="relative isolate overflow-hidden rounded-[12px] border border-fg/20 bg-card lg:min-h-0 min-h-[430px]">
                <div className="vv-art-cms absolute inset-0 -z-10" aria-hidden />
                <div className="relative z-10 px-5 py-8 lg:px-9 lg:pt-[45px] lg:pb-0">
                  <h3 className="font-display text-[clamp(24px,2.6vw,36px)] leading-[1.1] font-medium tracking-h2 text-white">
                    Seamless CMS Launch
                  </h3>
                  <p className="mt-2 text-[12px] leading-[1.6] text-fg-muted lg:mt-3 lg:text-lead text-white/70">
                    <span>
                      {"Launched seamlessly with a powerful CMS, allowing you to "}
                    </span>
                    <span className="text-white">
                      update and manage your website
                    </span>
                    <span>
                      {" content effortlessly after going live."}
                    </span>
                  </p>
                </div>
                <div aria-hidden className="absolute top-[156px] right-0 left-5 overflow-hidden rounded-tl-[12px] border-t border-l border-line bg-bg pt-4 pl-4 lg:top-[201px] lg:left-9">
                  <div className="grid grid-cols-[1fr_100px_46px] gap-3 px-4 py-[10px] text-[10px] leading-[1.4] text-fg-subtle lg:grid-cols-[1fr_150px_110px] lg:gap-4 lg:px-6 lg:py-4 lg:text-body-s">
                    <span>
                      Title
                    </span>
                    <span>
                      Date
                    </span>
                    <span>
                      Image
                    </span>
                  </div>
                  <div className="grid grid-cols-[1fr_100px_46px] items-center gap-3 border-t border-line px-4 py-[7px] text-[10px] leading-[1.4] text-fg-strong lg:grid-cols-[1fr_150px_110px] lg:gap-4 lg:px-6 lg:py-[15px] lg:text-body-s">
                    <span className="flex min-w-0 items-center gap-2.5">
                      <svg viewBox="0 0 24 24" className="size-4 shrink-0 text-fg-subtle" fill="currentColor">
                        <path d="M6.5 2h6.67a1 1 0 0 1 .7.29l5.34 5.32a1 1 0 0 1 .29.71V20a2 2 0 0 1-2 2h-11a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Zm7.25 2.42v2.9a.6.6 0 0 0 .6.6h2.9l-3.5-3.5Z" />
                      </svg>
                      <span className="truncate">
                        {"Smart Theme Switch ~ Framer Component"}
                      </span>
                    </span>
                    <span className="text-fg-muted whitespace-nowrap">
                      10 July 2026
                    </span>
                    <span>
                      <img src="/media/fa82d0ba7b07aeb6f52d002c58a4b803.png" alt="" className="h-[22px] w-[36px] rounded-[3px] object-cover lg:h-[35px] lg:w-[59px]" loading="lazy" decoding="async" />
                    </span>
                  </div>
                  <div className="grid grid-cols-[1fr_100px_46px] items-center gap-3 border-t border-line px-4 py-[7px] text-[10px] leading-[1.4] text-fg-strong lg:grid-cols-[1fr_150px_110px] lg:gap-4 lg:px-6 lg:py-[15px] lg:text-body-s">
                    <span className="flex min-w-0 items-center gap-2.5">
                      <svg viewBox="0 0 24 24" className="size-4 shrink-0 text-fg-subtle" fill="currentColor">
                        <path d="M6.5 2h6.67a1 1 0 0 1 .7.29l5.34 5.32a1 1 0 0 1 .29.71V20a2 2 0 0 1-2 2h-11a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Zm7.25 2.42v2.9a.6.6 0 0 0 .6.6h2.9l-3.5-3.5Z" />
                      </svg>
                      <span className="truncate">
                        {"StyleSync ~ Import Styles"}
                      </span>
                    </span>
                    <span className="text-fg-muted whitespace-nowrap">
                      27 June 2026
                    </span>
                    <span>
                      <img src="/media/24256474797948598af6e055ef03431e.jpg" alt="" className="h-[22px] w-[36px] rounded-[3px] object-cover lg:h-[35px] lg:w-[59px]" loading="lazy" decoding="async" />
                    </span>
                  </div>
                  <div className="grid grid-cols-[1fr_100px_46px] items-center gap-3 border-t border-line px-4 py-[7px] text-[10px] leading-[1.4] text-fg-strong lg:grid-cols-[1fr_150px_110px] lg:gap-4 lg:px-6 lg:py-[15px] lg:text-body-s">
                    <span className="flex min-w-0 items-center gap-2.5">
                      <svg viewBox="0 0 24 24" className="size-4 shrink-0 text-fg-subtle" fill="currentColor">
                        <path d="M6.5 2h6.67a1 1 0 0 1 .7.29l5.34 5.32a1 1 0 0 1 .29.71V20a2 2 0 0 1-2 2h-11a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Zm7.25 2.42v2.9a.6.6 0 0 0 .6.6h2.9l-3.5-3.5Z" />
                      </svg>
                      <span className="truncate">
                        Advanced CMS Slideshow for Framer
                      </span>
                    </span>
                    <span className="text-fg-muted whitespace-nowrap">
                      31 May 2026
                    </span>
                    <span>
                      <img src="/media/9eef896b4ea5097e3d83cc8d531e4056.jpg" alt="" className="h-[22px] w-[36px] rounded-[3px] object-cover lg:h-[35px] lg:w-[59px]" loading="lazy" decoding="async" />
                    </span>
                  </div>
                  <div className="grid grid-cols-[1fr_100px_46px] items-center gap-3 border-t border-line px-4 py-[7px] text-[10px] leading-[1.4] text-fg-strong lg:grid-cols-[1fr_150px_110px] lg:gap-4 lg:px-6 lg:py-[15px] lg:text-body-s">
                    <span className="flex min-w-0 items-center gap-2.5">
                      <svg viewBox="0 0 24 24" className="size-4 shrink-0 text-fg-subtle" fill="currentColor">
                        <path d="M6.5 2h6.67a1 1 0 0 1 .7.29l5.34 5.32a1 1 0 0 1 .29.71V20a2 2 0 0 1-2 2h-11a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Zm7.25 2.42v2.9a.6.6 0 0 0 .6.6h2.9l-3.5-3.5Z" />
                      </svg>
                      <span className="truncate">
                        Smart Animated Counters in Wix Studio
                      </span>
                    </span>
                    <span className="text-fg-muted whitespace-nowrap">
                      10 January 2026
                    </span>
                    <span>
                      <img src="/media/3990486d63ac121ae76e45c695fb18ca.jpg" alt="" className="h-[22px] w-[36px] rounded-[3px] object-cover lg:h-[35px] lg:w-[59px]" loading="lazy" decoding="async" />
                    </span>
                  </div>
                  <div className="grid grid-cols-[1fr_100px_46px] items-center gap-3 border-t border-line px-4 py-[7px] text-[10px] leading-[1.4] text-fg-strong lg:grid-cols-[1fr_150px_110px] lg:gap-4 lg:px-6 lg:py-[15px] lg:text-body-s">
                    <span className="flex min-w-0 items-center gap-2.5">
                      <svg viewBox="0 0 24 24" className="size-4 shrink-0 text-fg-subtle" fill="currentColor">
                        <path d="M6.5 2h6.67a1 1 0 0 1 .7.29l5.34 5.32a1 1 0 0 1 .29.71V20a2 2 0 0 1-2 2h-11a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Zm7.25 2.42v2.9a.6.6 0 0 0 .6.6h2.9l-3.5-3.5Z" />
                      </svg>
                      <span className="truncate">
                        How to Add Smooth Scroll in a Wix Website
                      </span>
                    </span>
                    <span className="text-fg-muted whitespace-nowrap">
                      1 February 2025
                    </span>
                    <span>
                      <img src="/media/78ab2a87ac838db6bd9c1b6d891a8b6e.jpg" alt="" className="h-[22px] w-[36px] rounded-[3px] object-cover lg:h-[35px] lg:w-[59px]" loading="lazy" decoding="async" />
                    </span>
                  </div>
                  <div className="grid grid-cols-[1fr_100px_46px] items-center gap-3 border-t border-line px-4 py-[7px] text-[10px] leading-[1.4] text-fg-strong lg:grid-cols-[1fr_150px_110px] lg:gap-4 lg:px-6 lg:py-[15px] lg:text-body-s">
                    <span className="flex min-w-0 items-center gap-2.5">
                      <svg viewBox="0 0 24 24" className="size-4 shrink-0 text-fg-subtle" fill="currentColor">
                        <path d="M6.5 2h6.67a1 1 0 0 1 .7.29l5.34 5.32a1 1 0 0 1 .29.71V20a2 2 0 0 1-2 2h-11a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Zm7.25 2.42v2.9a.6.6 0 0 0 .6.6h2.9l-3.5-3.5Z" />
                      </svg>
                      <span className="truncate">
                        How to Create an Editable Vector Text Effect in Adobe Illustrator
                      </span>
                    </span>
                    <span className="text-fg-muted whitespace-nowrap">
                      31 January 2025
                    </span>
                    <span>
                      <img src="/media/35d20a23587f3741da4aae49f4993cc0.jpg" alt="" className="h-[22px] w-[36px] rounded-[3px] object-cover lg:h-[35px] lg:w-[59px]" loading="lazy" decoding="async" />
                    </span>
                  </div>
                  <div className="grid grid-cols-[1fr_100px_46px] items-center gap-3 border-t border-line px-4 py-[7px] text-[10px] leading-[1.4] text-fg-strong lg:grid-cols-[1fr_150px_110px] lg:gap-4 lg:px-6 lg:py-[15px] lg:text-body-s">
                    <span className="flex min-w-0 items-center gap-2.5">
                      <svg viewBox="0 0 24 24" className="size-4 shrink-0 text-fg-subtle" fill="currentColor">
                        <path d="M6.5 2h6.67a1 1 0 0 1 .7.29l5.34 5.32a1 1 0 0 1 .29.71V20a2 2 0 0 1-2 2h-11a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Zm7.25 2.42v2.9a.6.6 0 0 0 .6.6h2.9l-3.5-3.5Z" />
                      </svg>
                      <span className="truncate">
                        Smooth Wix Studio Preloader Animation
                      </span>
                    </span>
                    <span className="text-fg-muted whitespace-nowrap">
                      29 January 2025
                    </span>
                    <span>
                      <img src="/media/152053cbd17ef12217ebd90970bdeeab.jpg" alt="" className="h-[22px] w-[36px] rounded-[3px] object-cover lg:h-[35px] lg:w-[59px]" loading="lazy" decoding="async" />
                    </span>
                  </div>
                </div>
              </article>
              <article data-reveal className="relative isolate overflow-hidden rounded-[12px] border border-fg/20 bg-card lg:min-h-0 min-[751px]:min-h-[520px] lg:min-h-0 flex flex-col">
                <div aria-hidden className="absolute inset-0 -z-10" style={{ background: "var(--vv-future-wash)" }} />
                <div className="relative z-10 px-5 py-8 lg:px-9 lg:pt-[45px] lg:pb-0">
                  <h3 className="font-display text-[clamp(24px,2.6vw,36px)] leading-[1.1] font-medium tracking-h2 ">
                    Future-Ready
                  </h3>
                  <p className="mt-2 text-[12px] leading-[1.6] text-fg-muted lg:mt-3 lg:text-lead ">
                    <span>
                      {"Websites designed to be "}
                    </span>
                    <span className="text-fg">
                      scalable and future-ready,
                    </span>
                    <span>
                      {" adapting as your business grows."}
                    </span>
                  </p>
                </div>
                <div className="flex min-h-0 flex-1 items-center">
                  <WatchDial />
                </div>
              </article>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
