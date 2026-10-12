import Link from '@/components/Link';
import RevealBatch from '@/components/motion/RevealBatch';
import RollText from '@/components/RollText';

// Server component, converted 1:1 from the RSC payload.
export default function Pricing() {
  return (
    <section id="pricing" aria-labelledby="pricing-heading" className="relative isolate z-10 bg-bg py-[clamp(80px,9vw,120px)]">
      <div className="mx-auto max-w-[1380px] px-6 md:px-8">
        <h2 id="pricing-heading" className="text-center font-display text-[clamp(46px,9vw,132px)] leading-[1] font-medium tracking-[-0.05em]">
          Pricing
        </h2>
        <p className="sr-only">
          {"Starting points in "}
          <span className="inline [[data-currency=inr]_&]:hidden">
            US dollars
          </span>
          <span className="hidden [[data-currency=inr]_&]:inline">
            Indian rupees
          </span>
          {", stated up front — every project is quoted on its actual scope before any work begins."}
        </p>
        <RevealBatch className="relative mt-7 md:mt-[clamp(-22px,-1.5vw,-10px)]">
          <div className="grid gap-5 md:grid-cols-3">
            <div data-reveal className="group relative flex flex-col overflow-hidden rounded-[12px] border backdrop-blur-[12px]" style={{ background: "color-mix(in srgb, var(--vv-bg) 42%, transparent)", borderColor: "var(--vv-card-border)" }}>
              <span aria-hidden className="pointer-events-none absolute top-0 left-1/2 h-px w-[240px] max-w-[80%] -translate-x-1/2" style={{ background: "linear-gradient(90deg, transparent 0%, var(--vv-card-line) 50%, transparent 100%)" }} />
              <span aria-hidden className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(58% 46% at 50% 0%, color-mix(in srgb, var(--vv-card-lift) 62%, transparent) 0%, color-mix(in srgb, var(--vv-card-lift-mid) 62%, transparent) 45%, transparent 78%)" }} />
              <span aria-hidden className="vv-shine vv-shine-lyr-a pointer-events-none absolute inset-0 rounded-[inherit] pointer-coarse:hidden" style={{ padding: 1, animationDuration: "2.8s", backgroundImage: "conic-gradient(from calc(var(--vv-shine-a) - var(--vv-shine-w, 24deg)), transparent 0deg, #0099FF calc(var(--vv-shine-w, 24deg) / 2), #7ACAFF var(--vv-shine-w, 24deg), transparent calc(var(--vv-shine-w, 24deg) * 2), transparent 360deg)", mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", maskComposite: "exclude", WebkitMaskComposite: "xor" }} />
              <span aria-hidden className="vv-shine vv-shine-lyr-b pointer-events-none absolute inset-0 rounded-[inherit] pointer-coarse:hidden" style={{ padding: 1, animationDuration: "2.8s", backgroundImage: "conic-gradient(from calc(var(--vv-shine-b) - var(--vv-shine-w, 24deg)), transparent 0deg, #0099FF calc(var(--vv-shine-w, 24deg) / 2), #7ACAFF var(--vv-shine-w, 24deg), transparent calc(var(--vv-shine-w, 24deg) * 2), transparent 360deg)", mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", maskComposite: "exclude", WebkitMaskComposite: "xor" }} />
              <div className="relative flex flex-1 flex-col p-8 md:p-10">
                <p className="text-[12px] leading-none font-medium tracking-[0.14em] text-fg-subtle uppercase">
                  Business Website
                </p>
                <div className="mt-7 flex items-baseline gap-2.5">
                  <span className="text-body-s text-fg-muted">
                    from
                  </span>
                  <span className="font-display text-[clamp(44px,4.6vw,60px)] leading-[0.9] font-medium tracking-[-0.045em]">
                    <span className="inline [[data-currency=inr]_&]:hidden">
                      {"$"}
                      800
                    </span>
                    <span className="hidden [[data-currency=inr]_&]:inline">
                      {"₹"}
                      20,000
                    </span>
                  </span>
                </div>
                <p className="mt-5 text-body-s leading-[1.65] text-fg-muted">
                  The full presence — three core pages designed from the ground up, on a CMS you run yourself.
                </p>
                <ul className="mt-8 divide-y border-t" style={{ borderColor: "var(--vv-card-rule)" }}>
                  <li className="py-3 text-[13.5px] leading-[1.5] text-fg-strong" style={{ borderColor: "var(--vv-card-rule)" }}>
                    3 core pages, custom design
                  </li>
                  <li className="py-3 text-[13.5px] leading-[1.5] text-fg-strong" style={{ borderColor: "var(--vv-card-rule)" }}>
                    CMS for your own updates
                  </li>
                  <li className="py-3 text-[13.5px] leading-[1.5] text-fg-strong" style={{ borderColor: "var(--vv-card-rule)" }}>
                    Animation and interactions
                  </li>
                  <li className="py-3 text-[13.5px] leading-[1.5] text-fg-strong" style={{ borderColor: "var(--vv-card-rule)" }}>
                    Basic SEO setup
                  </li>
                </ul>
                <div className="mt-auto flex flex-wrap items-center justify-between gap-x-4 gap-y-3 pt-9">
                  <Link href="/contact" className="inline-flex items-center rounded-full border border-transparent bg-fg px-[15px] py-[9px] text-[14px] leading-none font-medium text-bg transition-colors hover:bg-fg-strong">
                    <RollText text="Start a project" />
                  </Link>
                  <Link href="/services/crafted-websites" className="group flex items-center gap-2 py-1 text-[13px] leading-none font-medium text-fg-subtle transition-colors hover:text-fg">
                    Details
                    <svg viewBox="0 0 24 24" className="size-3.5 shrink-0 transition-transform duration-300 ease-brand group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
            <div data-reveal className="group relative flex flex-col overflow-hidden rounded-[12px] border backdrop-blur-[12px]" style={{ background: "color-mix(in srgb, var(--vv-bg) 42%, transparent)", borderColor: "var(--vv-card-border)" }}>
              <span aria-hidden className="pointer-events-none absolute top-0 left-1/2 h-px w-[240px] max-w-[80%] -translate-x-1/2" style={{ background: "linear-gradient(90deg, transparent 0%, var(--vv-card-line) 50%, transparent 100%)" }} />
              <span aria-hidden className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(58% 46% at 50% 0%, color-mix(in srgb, var(--vv-card-lift) 62%, transparent) 0%, color-mix(in srgb, var(--vv-card-lift-mid) 62%, transparent) 45%, transparent 78%)" }} />
              <span aria-hidden className="vv-shine vv-shine-lyr-a pointer-events-none absolute inset-0 rounded-[inherit] pointer-coarse:hidden" style={{ padding: 1, animationDuration: "2.8s", backgroundImage: "conic-gradient(from calc(var(--vv-shine-a) - var(--vv-shine-w, 24deg)), transparent 0deg, #0099FF calc(var(--vv-shine-w, 24deg) / 2), #7ACAFF var(--vv-shine-w, 24deg), transparent calc(var(--vv-shine-w, 24deg) * 2), transparent 360deg)", mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", maskComposite: "exclude", WebkitMaskComposite: "xor" }} />
              <span aria-hidden className="vv-shine vv-shine-lyr-b pointer-events-none absolute inset-0 rounded-[inherit] pointer-coarse:hidden" style={{ padding: 1, animationDuration: "2.8s", backgroundImage: "conic-gradient(from calc(var(--vv-shine-b) - var(--vv-shine-w, 24deg)), transparent 0deg, #0099FF calc(var(--vv-shine-w, 24deg) / 2), #7ACAFF var(--vv-shine-w, 24deg), transparent calc(var(--vv-shine-w, 24deg) * 2), transparent 360deg)", mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", maskComposite: "exclude", WebkitMaskComposite: "xor" }} />
              <div className="relative flex flex-1 flex-col p-8 md:p-10">
                <p className="text-[12px] leading-none font-medium tracking-[0.14em] text-fg-subtle uppercase">
                  eCommerce Store
                </p>
                <div className="mt-7 flex items-baseline gap-2.5">
                  <span className="text-body-s text-fg-muted">
                    from
                  </span>
                  <span className="font-display text-[clamp(44px,4.6vw,60px)] leading-[0.9] font-medium tracking-[-0.045em]">
                    <span className="inline [[data-currency=inr]_&]:hidden">
                      {"$"}
                      1,500
                    </span>
                    <span className="hidden [[data-currency=inr]_&]:inline">
                      {"₹"}
                      50,000
                    </span>
                  </span>
                </div>
                <p className="mt-5 text-body-s leading-[1.65] text-fg-muted">
                  A complete store — catalogue, cart and checkout, with a dashboard you can actually run.
                </p>
                <ul className="mt-8 divide-y border-t" style={{ borderColor: "var(--vv-card-rule)" }}>
                  <li className="py-3 text-[13.5px] leading-[1.5] text-fg-strong" style={{ borderColor: "var(--vv-card-rule)" }}>
                    Product, cart and checkout pages
                  </li>
                  <li className="py-3 text-[13.5px] leading-[1.5] text-fg-strong" style={{ borderColor: "var(--vv-card-rule)" }}>
                    Payment and shipping integration
                  </li>
                  <li className="py-3 text-[13.5px] leading-[1.5] text-fg-strong" style={{ borderColor: "var(--vv-card-rule)" }}>
                    Store management dashboard
                  </li>
                  <li className="py-3 text-[13.5px] leading-[1.5] text-fg-strong" style={{ borderColor: "var(--vv-card-rule)" }}>
                    Mobile-first shopping experience
                  </li>
                </ul>
                <div className="mt-auto flex flex-wrap items-center justify-between gap-x-4 gap-y-3 pt-9">
                  <Link href="/contact" className="inline-flex items-center rounded-full border border-transparent bg-fg px-[15px] py-[9px] text-[14px] leading-none font-medium text-bg transition-colors hover:bg-fg-strong">
                    <RollText text="Start a project" />
                  </Link>
                  <Link href="/services/ecommerce-website-design" className="group flex items-center gap-2 py-1 text-[13px] leading-none font-medium text-fg-subtle transition-colors hover:text-fg">
                    Details
                    <svg viewBox="0 0 24 24" className="size-3.5 shrink-0 transition-transform duration-300 ease-brand group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
            <div data-reveal className="group relative flex flex-col overflow-hidden rounded-[12px] border backdrop-blur-[12px]" style={{ background: "color-mix(in srgb, var(--vv-bg) 42%, transparent)", borderColor: "var(--vv-card-border)" }}>
              <span aria-hidden className="pointer-events-none absolute top-0 left-1/2 h-px w-[240px] max-w-[80%] -translate-x-1/2" style={{ background: "linear-gradient(90deg, transparent 0%, var(--vv-card-line) 50%, transparent 100%)" }} />
              <span aria-hidden className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(58% 46% at 50% 0%, color-mix(in srgb, var(--vv-card-lift) 62%, transparent) 0%, color-mix(in srgb, var(--vv-card-lift-mid) 62%, transparent) 45%, transparent 78%)" }} />
              <span aria-hidden className="vv-shine vv-shine-lyr-a pointer-events-none absolute inset-0 rounded-[inherit] pointer-coarse:hidden" style={{ padding: 1, animationDuration: "2.8s", backgroundImage: "conic-gradient(from calc(var(--vv-shine-a) - var(--vv-shine-w, 24deg)), transparent 0deg, #0099FF calc(var(--vv-shine-w, 24deg) / 2), #7ACAFF var(--vv-shine-w, 24deg), transparent calc(var(--vv-shine-w, 24deg) * 2), transparent 360deg)", mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", maskComposite: "exclude", WebkitMaskComposite: "xor" }} />
              <span aria-hidden className="vv-shine vv-shine-lyr-b pointer-events-none absolute inset-0 rounded-[inherit] pointer-coarse:hidden" style={{ padding: 1, animationDuration: "2.8s", backgroundImage: "conic-gradient(from calc(var(--vv-shine-b) - var(--vv-shine-w, 24deg)), transparent 0deg, #0099FF calc(var(--vv-shine-w, 24deg) / 2), #7ACAFF var(--vv-shine-w, 24deg), transparent calc(var(--vv-shine-w, 24deg) * 2), transparent 360deg)", mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", maskComposite: "exclude", WebkitMaskComposite: "xor" }} />
              <div className="relative flex flex-1 flex-col p-8 md:p-10">
                <p className="text-[12px] leading-none font-medium tracking-[0.14em] text-fg-subtle uppercase">
                  Custom Build
                </p>
                <div className="mt-7 flex items-baseline gap-2.5">
                  <span className="text-body-s text-fg-muted">
                    from
                  </span>
                  <span className="font-display text-[clamp(44px,4.6vw,60px)] leading-[0.9] font-medium tracking-[-0.045em]">
                    <span className="inline [[data-currency=inr]_&]:hidden">
                      {"$"}
                      3,000
                    </span>
                    <span className="hidden [[data-currency=inr]_&]:inline">
                      {"₹"}
                      1,00,000
                    </span>
                  </span>
                </div>
                <p className="mt-5 text-body-s leading-[1.65] text-fg-muted">
                  Larger platforms and long-running partnerships — scoped together before anything is quoted.
                </p>
                <ul className="mt-8 divide-y border-t" style={{ borderColor: "var(--vv-card-rule)" }}>
                  <li className="py-3 text-[13.5px] leading-[1.5] text-fg-strong" style={{ borderColor: "var(--vv-card-rule)" }}>
                    Discovery and scoping first
                  </li>
                  <li className="py-3 text-[13.5px] leading-[1.5] text-fg-strong" style={{ borderColor: "var(--vv-card-rule)" }}>
                    Multi-collection CMS architecture
                  </li>
                  <li className="py-3 text-[13.5px] leading-[1.5] text-fg-strong" style={{ borderColor: "var(--vv-card-rule)" }}>
                    Advanced motion and interaction
                  </li>
                  <li className="py-3 text-[13.5px] leading-[1.5] text-fg-strong" style={{ borderColor: "var(--vv-card-rule)" }}>
                    Maintenance and support plans
                  </li>
                </ul>
                <div className="mt-auto flex flex-wrap items-center justify-between gap-x-4 gap-y-3 pt-9">
                  <Link href="/contact" className="inline-flex items-center rounded-full border border-transparent bg-fg px-[15px] py-[9px] text-[14px] leading-none font-medium text-bg transition-colors hover:bg-fg-strong">
                    <RollText text="Start a project" />
                  </Link>
                  <Link href="/contact" className="group flex items-center gap-2 py-1 text-[13px] leading-none font-medium text-fg-subtle transition-colors hover:text-fg">
                    Details
                    <svg viewBox="0 0 24 24" className="size-3.5 shrink-0 transition-transform duration-300 ease-brand group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </RevealBatch>
      </div>
    </section>
  );
}
