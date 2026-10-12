import BadgeImage from '@/components/BadgeImage';
import CategorySelect from '@/components/blog/CategorySelect';
import HeadingReveal from '@/components/motion/HeadingReveal';
import Link from '@/components/Link';
import RevealBatch from '@/components/motion/RevealBatch';
import RollText from '@/components/RollText';

// Converted 1:1 from the RSC payload of /blog/category/wix-studio.
export default function Page_blog__category__wix_studio() {
  return (
    <>
      <main className="relative isolate">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: "{\"@context\":\"https://schema.org\",\"@type\":\"BreadcrumbList\",\"itemListElement\":[{\"@type\":\"ListItem\",\"position\":1,\"name\":\"Home\",\"item\":\"https://visuvate.com/\"},{\"@type\":\"ListItem\",\"position\":2,\"name\":\"Blog\",\"item\":\"https://visuvate.com/blog\"},{\"@type\":\"ListItem\",\"position\":3,\"name\":\"Wix Studio\",\"item\":\"https://visuvate.com/blog/category/wix-studio\"}]}" }} />
        <header className="mx-auto max-w-[820px] px-6 pt-[clamp(80px,10vw,153px)] text-center md:px-8">
          <HeadingReveal>
            <h1 className="font-display text-[clamp(38px,5vw,72px)] leading-[1] font-medium tracking-[-0.05em]">
              Wix Studio
            </h1>
          </HeadingReveal>
          <p className="mx-auto mt-[24px] max-w-[640px] text-[17px] leading-[1.5] text-fg-subtle">
            Practical Wix Studio guides, mostly the things the editor cannot do on its own. Each one is a working Velo or custom-code recipe you can paste in, with the IDs, settings and gotchas spelled out — animated counters, smooth scrolling, page preloaders and similar polish.
          </p>
        </header>
        <div className="pt-[clamp(32px,4vw,56px)]">
          <nav aria-label="Blog categories" className="relative z-10 mx-auto max-w-[1425px] px-6 pb-[clamp(32px,4vw,56px)] md:px-8">
            <CategorySelect className="mx-auto w-full max-w-[380px] md:hidden" label="Blog categories" active="wix-studio" options={[{ key: "all", label: "All", href: "/blog", count: 7 }, { key: "framer", label: "Framer", href: "/blog/category/framer", count: 3 }, { key: "wix-studio", label: "Wix Studio", href: "/blog/category/wix-studio", count: 3 }]} />
            <div className="hidden flex-wrap justify-center gap-2 md:flex">
              <Link href="/blog" className="inline-flex h-[34px] items-center rounded-full border px-4 text-[15px] leading-none font-medium transition-colors border-line bg-bg text-fg-muted hover:border-line-strong hover:text-fg">
                <RollText text="All" />
              </Link>
              <Link href="/blog/category/framer" className="inline-flex h-[34px] items-center rounded-full border px-4 text-[15px] leading-none font-medium transition-colors border-line bg-bg text-fg-muted hover:border-line-strong hover:text-fg">
                <RollText text="Framer" />
              </Link>
              <Link href="/blog/category/wix-studio" aria-current="page" className="inline-flex h-[34px] items-center rounded-full border px-4 text-[15px] leading-none font-medium transition-colors border-transparent bg-fg text-bg">
                <RollText text="Wix Studio" />
              </Link>
            </div>
          </nav>
        </div>
        <RevealBatch>
          <div className="mx-auto max-w-[1425px] px-4 pb-[clamp(80px,10vw,140px)] md:px-8">
            <div className="flex flex-wrap justify-center gap-2 lg:gap-5 lg:[&>*]:w-[calc((100%-40px)/3)] [&>*]:w-full">
              <div data-reveal>
                <Link href="/blog/smart-animated-counters-in-wix-studio" className="group relative flex flex-col gap-3 rounded-[6px] border border-fg/12 bg-bg/30 p-[6px] pb-3 backdrop-blur-[14px] lg:gap-6 lg:rounded-[12px] lg:p-[10px] lg:pb-4">
                  <span aria-hidden className="vv-shine vv-shine-lyr-a pointer-events-none absolute inset-0 rounded-[inherit] pointer-coarse:hidden" style={{ padding: 1, animationDuration: "2.8s", backgroundImage: "conic-gradient(from calc(var(--vv-shine-a) - var(--vv-shine-w, 24deg)), transparent 0deg, #0099FF calc(var(--vv-shine-w, 24deg) / 2), #7ACAFF var(--vv-shine-w, 24deg), transparent calc(var(--vv-shine-w, 24deg) * 2), transparent 360deg)", mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", maskComposite: "exclude", WebkitMaskComposite: "xor" }} />
                  <span aria-hidden className="vv-shine vv-shine-lyr-b pointer-events-none absolute inset-0 rounded-[inherit] pointer-coarse:hidden" style={{ padding: 1, animationDuration: "2.8s", backgroundImage: "conic-gradient(from calc(var(--vv-shine-b) - var(--vv-shine-w, 24deg)), transparent 0deg, #0099FF calc(var(--vv-shine-w, 24deg) / 2), #7ACAFF var(--vv-shine-w, 24deg), transparent calc(var(--vv-shine-w, 24deg) * 2), transparent 360deg)", mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", maskComposite: "exclude", WebkitMaskComposite: "xor" }} />
                  <div className="relative overflow-hidden rounded-[3px] bg-surface lg:rounded-[6px]" style={{ aspectRatio: "16 / 9" }}>
                    <BadgeImage src="/media/3990486d63ac121ae76e45c695fb18ca.jpg" sizes="(max-width: 639px) 92vw, (max-width: 1023px) 46vw, 430px" alt="Smart Animated Counters in Wix Studio" className="absolute transition-[filter,opacity] duration-500 ease-brand group-hover:[filter:blur(7px)_brightness(0.62)] inset-0 size-full object-cover object-center" loading="lazy" decoding="async" />
                    <span className="pointer-events-none absolute inset-0 grid place-items-center opacity-0 transition-opacity duration-400 ease-brand group-hover:opacity-100">
                      <span className="vv-accent text-[clamp(22px,2.2vw,32px)] leading-none text-white">
                        View Project
                      </span>
                    </span>
                  </div>
                  <div className="flex items-end justify-between gap-4 pl-2">
                    <div className="flex min-w-0 flex-col gap-1">
                      <h2 className="truncate font-display text-[16px] leading-[1.25] font-medium tracking-h3 lg:text-[24px] lg:leading-[1.2]">
                        Smart Animated Counters in Wix Studio
                      </h2>
                      <p className="text-[13px] leading-[1.3] text-fg-muted lg:text-[16px]">
                        10 Jan 2026
                        {" · 4 min read"}
                      </p>
                    </div>
                    <span className="flex shrink-0 flex-col items-end gap-2">
                      <span className="hidden rounded-[10px] bg-tint px-4 py-2.5 text-[14px] leading-none font-medium text-fg transition-colors group-hover:bg-tint-strong group-hover:text-fg-strong lg:inline-flex">
                        Read post
                      </span>
                    </span>
                  </div>
                </Link>
              </div>
              <div data-reveal>
                <Link href="/blog/smooth-scroll-in-a-wix-website" className="group relative flex flex-col gap-3 rounded-[6px] border border-fg/12 bg-bg/30 p-[6px] pb-3 backdrop-blur-[14px] lg:gap-6 lg:rounded-[12px] lg:p-[10px] lg:pb-4">
                  <span aria-hidden className="vv-shine vv-shine-lyr-a pointer-events-none absolute inset-0 rounded-[inherit] pointer-coarse:hidden" style={{ padding: 1, animationDuration: "2.8s", backgroundImage: "conic-gradient(from calc(var(--vv-shine-a) - var(--vv-shine-w, 24deg)), transparent 0deg, #0099FF calc(var(--vv-shine-w, 24deg) / 2), #7ACAFF var(--vv-shine-w, 24deg), transparent calc(var(--vv-shine-w, 24deg) * 2), transparent 360deg)", mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", maskComposite: "exclude", WebkitMaskComposite: "xor" }} />
                  <span aria-hidden className="vv-shine vv-shine-lyr-b pointer-events-none absolute inset-0 rounded-[inherit] pointer-coarse:hidden" style={{ padding: 1, animationDuration: "2.8s", backgroundImage: "conic-gradient(from calc(var(--vv-shine-b) - var(--vv-shine-w, 24deg)), transparent 0deg, #0099FF calc(var(--vv-shine-w, 24deg) / 2), #7ACAFF var(--vv-shine-w, 24deg), transparent calc(var(--vv-shine-w, 24deg) * 2), transparent 360deg)", mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", maskComposite: "exclude", WebkitMaskComposite: "xor" }} />
                  <div className="relative overflow-hidden rounded-[3px] bg-surface lg:rounded-[6px]" style={{ aspectRatio: "16 / 9" }}>
                    <BadgeImage src="/media/78ab2a87ac838db6bd9c1b6d891a8b6e.jpg" sizes="(max-width: 639px) 92vw, (max-width: 1023px) 46vw, 430px" alt="How to Add Smooth Scroll in a Wix Website" className="absolute transition-[filter,opacity] duration-500 ease-brand group-hover:[filter:blur(7px)_brightness(0.62)] inset-0 size-full object-cover object-center" loading="lazy" decoding="async" />
                    <span className="pointer-events-none absolute inset-0 grid place-items-center opacity-0 transition-opacity duration-400 ease-brand group-hover:opacity-100">
                      <span className="vv-accent text-[clamp(22px,2.2vw,32px)] leading-none text-white">
                        View Project
                      </span>
                    </span>
                  </div>
                  <div className="flex items-end justify-between gap-4 pl-2">
                    <div className="flex min-w-0 flex-col gap-1">
                      <h2 className="truncate font-display text-[16px] leading-[1.25] font-medium tracking-h3 lg:text-[24px] lg:leading-[1.2]">
                        How to Add Smooth Scroll in a Wix Website
                      </h2>
                      <p className="text-[13px] leading-[1.3] text-fg-muted lg:text-[16px]">
                        1 Feb 2025
                        {" · 2 min read"}
                      </p>
                    </div>
                    <span className="flex shrink-0 flex-col items-end gap-2">
                      <span className="hidden rounded-[10px] bg-tint px-4 py-2.5 text-[14px] leading-none font-medium text-fg transition-colors group-hover:bg-tint-strong group-hover:text-fg-strong lg:inline-flex">
                        Read post
                      </span>
                    </span>
                  </div>
                </Link>
              </div>
              <div data-reveal>
                <Link href="/blog/wix-studio-preloader-animation" className="group relative flex flex-col gap-3 rounded-[6px] border border-fg/12 bg-bg/30 p-[6px] pb-3 backdrop-blur-[14px] lg:gap-6 lg:rounded-[12px] lg:p-[10px] lg:pb-4">
                  <span aria-hidden className="vv-shine vv-shine-lyr-a pointer-events-none absolute inset-0 rounded-[inherit] pointer-coarse:hidden" style={{ padding: 1, animationDuration: "2.8s", backgroundImage: "conic-gradient(from calc(var(--vv-shine-a) - var(--vv-shine-w, 24deg)), transparent 0deg, #0099FF calc(var(--vv-shine-w, 24deg) / 2), #7ACAFF var(--vv-shine-w, 24deg), transparent calc(var(--vv-shine-w, 24deg) * 2), transparent 360deg)", mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", maskComposite: "exclude", WebkitMaskComposite: "xor" }} />
                  <span aria-hidden className="vv-shine vv-shine-lyr-b pointer-events-none absolute inset-0 rounded-[inherit] pointer-coarse:hidden" style={{ padding: 1, animationDuration: "2.8s", backgroundImage: "conic-gradient(from calc(var(--vv-shine-b) - var(--vv-shine-w, 24deg)), transparent 0deg, #0099FF calc(var(--vv-shine-w, 24deg) / 2), #7ACAFF var(--vv-shine-w, 24deg), transparent calc(var(--vv-shine-w, 24deg) * 2), transparent 360deg)", mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", maskComposite: "exclude", WebkitMaskComposite: "xor" }} />
                  <div className="relative overflow-hidden rounded-[3px] bg-surface lg:rounded-[6px]" style={{ aspectRatio: "16 / 9" }}>
                    <BadgeImage src="/media/152053cbd17ef12217ebd90970bdeeab.jpg" sizes="(max-width: 639px) 92vw, (max-width: 1023px) 46vw, 430px" alt="Smooth Wix Studio Preloader Animation" className="absolute transition-[filter,opacity] duration-500 ease-brand group-hover:[filter:blur(7px)_brightness(0.62)] inset-0 size-full object-cover object-center" loading="lazy" decoding="async" />
                    <span className="pointer-events-none absolute inset-0 grid place-items-center opacity-0 transition-opacity duration-400 ease-brand group-hover:opacity-100">
                      <span className="vv-accent text-[clamp(22px,2.2vw,32px)] leading-none text-white">
                        View Project
                      </span>
                    </span>
                  </div>
                  <div className="flex items-end justify-between gap-4 pl-2">
                    <div className="flex min-w-0 flex-col gap-1">
                      <h2 className="truncate font-display text-[16px] leading-[1.25] font-medium tracking-h3 lg:text-[24px] lg:leading-[1.2]">
                        Smooth Wix Studio Preloader Animation
                      </h2>
                      <p className="text-[13px] leading-[1.3] text-fg-muted lg:text-[16px]">
                        29 Jan 2025
                        {" · 2 min read"}
                      </p>
                    </div>
                    <span className="flex shrink-0 flex-col items-end gap-2">
                      <span className="hidden rounded-[10px] bg-tint px-4 py-2.5 text-[14px] leading-none font-medium text-fg transition-colors group-hover:bg-tint-strong group-hover:text-fg-strong lg:inline-flex">
                        Read post
                      </span>
                    </span>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </RevealBatch>
      </main>
    </>
  );
}
