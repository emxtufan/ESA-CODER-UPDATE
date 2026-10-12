import HeadingReveal from '@/components/motion/HeadingReveal';
import Link from '@/components/Link';
import RevealBatch from '@/components/motion/RevealBatch';
import RollText from '@/components/RollText';
import ServicesBackdrop from '@/components/services/ServicesBackdrop';

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
            <RollText text="All services" />
          </Link>
          <HeadingReveal className="mt-10">
            <h1 className="font-display text-[clamp(40px,7vw,104px)] leading-[1] font-medium tracking-[-0.05em]">
              {"Maintenance &\nOngoing Support"}
            </h1>
          </HeadingReveal>
        </header>
        <section className="mx-auto max-w-[1425px] px-6 pb-[clamp(56px,7vw,96px)] md:px-8">
          <div className="grid gap-x-16 gap-y-12 lg:grid-cols-[1fr_0.78fr]">
            <div className="max-w-[660px]">
              <p className="text-[clamp(20px,2vw,26px)] leading-[1.5] font-medium text-fg">
                Keep your website updated, secure, and performing at its best. We handle ongoing adjustments so you can focus on your business.
              </p>
              <p className="mt-5 text-lead leading-[1.75] text-fg-muted">
                Websites decay quietly. Content goes out of date, links break as other sites reorganise, browsers update and change how something renders, images accumulate until pages slow down, and integrations stop working without announcing it. None of this is dramatic on any given week, which is exactly why it is usually discovered by a customer rather than by the business.
              </p>
              <p className="mt-5 text-lead leading-[1.75] text-fg-muted">
                Regular checks catch that before it costs you anything. Pages are reviewed for errors and broken links, loading is re-measured against where it was at launch, forms are tested end to end so an enquiry route never fails silently, and the site is checked on current browsers rather than assumed to still work.
              </p>
              <p className="mt-5 text-lead leading-[1.75] text-fg-muted">
                Content and design updates are handled as they come up. New case studies, revised service copy, seasonal changes, a new team member, an updated price — the small ongoing edits that are quick for us and a distraction for you. Where a change would be better made structurally than patched, we will say so.
              </p>
              <p className="mt-5 text-lead leading-[1.75] text-fg-muted">
                Backups and security monitoring run in the background, so an unwanted change can be reversed rather than reconstructed. That matters most for sites where more than one person can edit content.
              </p>
              <p className="mt-5 text-lead leading-[1.75] text-fg-muted">
                Priority support means a direct line rather than a queue. If something breaks on a live site — a form, a payment, a page — it is looked at as the current job, not scheduled behind other work.
              </p>
              <p className="mt-5 text-lead leading-[1.75] text-fg-muted">
                It suits businesses whose site is a working part of how they sell, rather than something built once and left alone.
              </p>
            </div>
            <div className="relative h-fit rounded-[16px] border border-fg/12 bg-bg/30 p-7 backdrop-blur-[14px] lg:sticky lg:top-[104px]">
              <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px" style={{ background: "linear-gradient(90deg, transparent 0%, color-mix(in srgb, var(--vv-text-primary) 40%, transparent) 50%, transparent 100%)" }} />
              <h2 className="text-[12px] leading-none font-medium tracking-[0.14em] text-fg-subtle uppercase">
                What’s included
              </h2>
              <ul className="mt-6 flex flex-col gap-4">
                <li className="flex gap-3 text-[15px] leading-[1.5] text-fg-strong">
                  <svg viewBox="0 0 24 24" className="mt-[3px] size-[15px] shrink-0 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="m5 13 4 4L19 7" />
                  </svg>
                  Regular site checkups
                </li>
                <li className="flex gap-3 text-[15px] leading-[1.5] text-fg-strong">
                  <svg viewBox="0 0 24 24" className="mt-[3px] size-[15px] shrink-0 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="m5 13 4 4L19 7" />
                  </svg>
                  Content and design updates
                </li>
                <li className="flex gap-3 text-[15px] leading-[1.5] text-fg-strong">
                  <svg viewBox="0 0 24 24" className="mt-[3px] size-[15px] shrink-0 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="m5 13 4 4L19 7" />
                  </svg>
                  Backup and security monitoring
                </li>
                <li className="flex gap-3 text-[15px] leading-[1.5] text-fg-strong">
                  <svg viewBox="0 0 24 24" className="mt-[3px] size-[15px] shrink-0 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="m5 13 4 4L19 7" />
                  </svg>
                  Performance review and optimization
                </li>
                <li className="flex gap-3 text-[15px] leading-[1.5] text-fg-strong">
                  <svg viewBox="0 0 24 24" className="mt-[3px] size-[15px] shrink-0 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="m5 13 4 4L19 7" />
                  </svg>
                  Priority technical support
                </li>
                <li className="flex gap-3 text-[15px] leading-[1.5] text-fg-strong">
                  <svg viewBox="0 0 24 24" className="mt-[3px] size-[15px] shrink-0 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="m5 13 4 4L19 7" />
                  </svg>
                  Forms tested end to end so enquiries never fail silently
                </li>
              </ul>
              <Link href="/contact" className="mt-7 flex h-11 items-center justify-center rounded-full bg-fg text-[14px] font-medium text-bg transition-opacity hover:opacity-90">
                <RollText text="Start a project" />
              </Link>
            </div>
          </div>
        </section>
        <RevealBatch className="mx-auto max-w-[1425px] px-6 pb-[clamp(56px,7vw,96px)] md:px-8">
          <h2 className="mb-8 font-display text-[clamp(28px,3.4vw,44px)] leading-[1] font-medium tracking-h2">
            Recent work
          </h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <Link data-reveal href="/works/4dolfins" className="group relative rounded-[12px] border border-fg/12 bg-bg/30 p-[10px] pb-4 backdrop-blur-[14px]">
              <span aria-hidden className="vv-shine vv-shine-lyr-a pointer-events-none absolute inset-0 rounded-[inherit] pointer-coarse:hidden" style={{ padding: 1, animationDuration: "2.8s", backgroundImage: "conic-gradient(from calc(var(--vv-shine-a) - var(--vv-shine-w, 24deg)), transparent 0deg, #0099FF calc(var(--vv-shine-w, 24deg) / 2), #7ACAFF var(--vv-shine-w, 24deg), transparent calc(var(--vv-shine-w, 24deg) * 2), transparent 360deg)", mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", maskComposite: "exclude", WebkitMaskComposite: "xor" }} />
              <span aria-hidden className="vv-shine vv-shine-lyr-b pointer-events-none absolute inset-0 rounded-[inherit] pointer-coarse:hidden" style={{ padding: 1, animationDuration: "2.8s", backgroundImage: "conic-gradient(from calc(var(--vv-shine-b) - var(--vv-shine-w, 24deg)), transparent 0deg, #0099FF calc(var(--vv-shine-w, 24deg) / 2), #7ACAFF var(--vv-shine-w, 24deg), transparent calc(var(--vv-shine-w, 24deg) * 2), transparent 360deg)", mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", maskComposite: "exclude", WebkitMaskComposite: "xor" }} />
              <div className="relative overflow-hidden rounded-[6px] bg-surface" style={{ aspectRatio: "4 / 3" }}>
                <img src="/media/54f06e115564feee03cc900ead225dd7.jpg" alt="4Dolfins" className="absolute inset-x-0 top-0 w-full transition-[filter] duration-500 ease-brand group-hover:[filter:blur(7px)_brightness(0.62)]" loading="lazy" decoding="async" />
                <span className="pointer-events-none absolute inset-0 grid place-items-center opacity-0 transition-opacity duration-400 ease-brand group-hover:opacity-100">
                  <span className="vv-accent text-[clamp(20px,2vw,28px)] leading-none text-white">
                    View Project
                  </span>
                </span>
              </div>
              <h3 className="mt-4 px-3 font-display text-[20px] leading-[1.2] font-medium tracking-h3">
                4Dolfins
              </h3>
            </Link>
            <Link data-reveal href="/works/orvel" className="group relative rounded-[12px] border border-fg/12 bg-bg/30 p-[10px] pb-4 backdrop-blur-[14px]">
              <span aria-hidden className="vv-shine vv-shine-lyr-a pointer-events-none absolute inset-0 rounded-[inherit] pointer-coarse:hidden" style={{ padding: 1, animationDuration: "2.8s", backgroundImage: "conic-gradient(from calc(var(--vv-shine-a) - var(--vv-shine-w, 24deg)), transparent 0deg, #0099FF calc(var(--vv-shine-w, 24deg) / 2), #7ACAFF var(--vv-shine-w, 24deg), transparent calc(var(--vv-shine-w, 24deg) * 2), transparent 360deg)", mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", maskComposite: "exclude", WebkitMaskComposite: "xor" }} />
              <span aria-hidden className="vv-shine vv-shine-lyr-b pointer-events-none absolute inset-0 rounded-[inherit] pointer-coarse:hidden" style={{ padding: 1, animationDuration: "2.8s", backgroundImage: "conic-gradient(from calc(var(--vv-shine-b) - var(--vv-shine-w, 24deg)), transparent 0deg, #0099FF calc(var(--vv-shine-w, 24deg) / 2), #7ACAFF var(--vv-shine-w, 24deg), transparent calc(var(--vv-shine-w, 24deg) * 2), transparent 360deg)", mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", maskComposite: "exclude", WebkitMaskComposite: "xor" }} />
              <div className="relative overflow-hidden rounded-[6px] bg-surface" style={{ aspectRatio: "4 / 3" }}>
                <img src="/media/eace44ddc70352a3c3d0d1ea71b9fcb9.jpg" alt="Orvel" className="absolute inset-x-0 top-0 w-full transition-[filter] duration-500 ease-brand group-hover:[filter:blur(7px)_brightness(0.62)]" loading="lazy" decoding="async" />
                <span className="pointer-events-none absolute inset-0 grid place-items-center opacity-0 transition-opacity duration-400 ease-brand group-hover:opacity-100">
                  <span className="vv-accent text-[clamp(20px,2vw,28px)] leading-none text-white">
                    View Project
                  </span>
                </span>
              </div>
              <h3 className="mt-4 px-3 font-display text-[20px] leading-[1.2] font-medium tracking-h3">
                Orvel
              </h3>
            </Link>
            <Link data-reveal href="/works/lasada-pippen" className="group relative rounded-[12px] border border-fg/12 bg-bg/30 p-[10px] pb-4 backdrop-blur-[14px]">
              <span aria-hidden className="vv-shine vv-shine-lyr-a pointer-events-none absolute inset-0 rounded-[inherit] pointer-coarse:hidden" style={{ padding: 1, animationDuration: "2.8s", backgroundImage: "conic-gradient(from calc(var(--vv-shine-a) - var(--vv-shine-w, 24deg)), transparent 0deg, #0099FF calc(var(--vv-shine-w, 24deg) / 2), #7ACAFF var(--vv-shine-w, 24deg), transparent calc(var(--vv-shine-w, 24deg) * 2), transparent 360deg)", mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", maskComposite: "exclude", WebkitMaskComposite: "xor" }} />
              <span aria-hidden className="vv-shine vv-shine-lyr-b pointer-events-none absolute inset-0 rounded-[inherit] pointer-coarse:hidden" style={{ padding: 1, animationDuration: "2.8s", backgroundImage: "conic-gradient(from calc(var(--vv-shine-b) - var(--vv-shine-w, 24deg)), transparent 0deg, #0099FF calc(var(--vv-shine-w, 24deg) / 2), #7ACAFF var(--vv-shine-w, 24deg), transparent calc(var(--vv-shine-w, 24deg) * 2), transparent 360deg)", mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", maskComposite: "exclude", WebkitMaskComposite: "xor" }} />
              <div className="relative overflow-hidden rounded-[6px] bg-surface" style={{ aspectRatio: "4 / 3" }}>
                <img src="/media/6c273acf295ebe4fcd8cfcb2a86bda56.jpg" alt="Lasada Pippen" className="absolute inset-x-0 top-0 w-full transition-[filter] duration-500 ease-brand group-hover:[filter:blur(7px)_brightness(0.62)]" loading="lazy" decoding="async" />
                <span className="pointer-events-none absolute inset-0 grid place-items-center opacity-0 transition-opacity duration-400 ease-brand group-hover:opacity-100">
                  <span className="vv-accent text-[clamp(20px,2vw,28px)] leading-none text-white">
                    View Project
                  </span>
                </span>
              </div>
              <h3 className="mt-4 px-3 font-display text-[20px] leading-[1.2] font-medium tracking-h3">
                Lasada Pippen
              </h3>
            </Link>
          </div>
        </RevealBatch>
        <section className="mx-auto max-w-[1425px] px-6 pb-[clamp(80px,10vw,140px)] md:px-8">
          <div className="flex flex-col items-start gap-6 rounded-[12px] border border-fg/12 bg-bg/30 p-8 backdrop-blur-[14px] md:flex-row md:items-center md:justify-between md:p-10">
            <div>
              <h2 className="font-display text-[clamp(24px,2.6vw,34px)] leading-[1.15] font-medium tracking-h3">
                Need this for your project?
              </h2>
              <p className="mt-2 text-body-s text-fg-muted">
                Tell us where you are and we will tell you what it takes.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/contact" className="inline-flex items-center rounded-full border border-transparent bg-fg px-[15px] py-[9px] text-[14px] leading-none font-medium text-bg transition-colors hover:bg-fg-strong">
                <RollText text="Get in touch" />
              </Link>
              <Link href="/services/crafted-websites" className="inline-flex items-center rounded-full border border-line-strong px-[15px] py-[9px] text-[14px] leading-none font-medium transition-colors hover:border-fg-subtle hover:bg-surface">
                <RollText text={"Next: Crafted\nWebsites"} />
              </Link>
            </div>
          </div>
          <ul className="mt-6 flex flex-wrap gap-2">
            <li>
              <Link href="/services/crafted-websites" className="inline-flex rounded-full border border-line px-4 py-2 text-body-s text-fg-muted transition-colors hover:border-line-strong hover:text-fg">
                {"Crafted\nWebsites"}
              </Link>
            </li>
            <li>
              <Link href="/services/website-redesign" className="inline-flex rounded-full border border-line px-4 py-2 text-body-s text-fg-muted transition-colors hover:border-line-strong hover:text-fg">
                {"Website\nRedesign"}
              </Link>
            </li>
            <li>
              <Link href="/services/ecommerce-website-design" className="inline-flex rounded-full border border-line px-4 py-2 text-body-s text-fg-muted transition-colors hover:border-line-strong hover:text-fg">
                {"eCommerce\nWebsite Design"}
              </Link>
            </li>
          </ul>
        </section>
      </main>
    </>
  );
}
