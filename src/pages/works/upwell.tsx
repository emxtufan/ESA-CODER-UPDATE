import HeadingReveal from '@/components/motion/HeadingReveal';
import Link from '@/components/Link';
import ParallaxDrift from '@/components/motion/ParallaxDrift';
import RevealBatch from '@/components/motion/RevealBatch';
import RollText from '@/components/RollText';
import WorkShots from '@/components/works/WorkShots';

// Converted 1:1 from the RSC payload of /works/upwell.
export default function Page_works__upwell() {
  return (
    <>
      <main className="relative isolate">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: "{\"@context\":\"https://schema.org\",\"@type\":\"CreativeWork\",\"name\":\"Upwell\",\"description\":\"Upwell is a complete website for a London growth agency that makes the creative and runs the paid media for brands spending from £50k to £1.5m a month. It is designed to show the work the way it runs: as real ads, with the result sitting next to each one. The site includes Home, Work with six case studies, Services, Agency and Contact, plus Privacy, Terms and 404 pages. The visual direction is bold and editorial: a paper page, ink and one signal orange, Mona Sans set wide for headlines and Geist Mono for figures, and ads shown in their real 9:16, 4:5 and 1:1 formats. The hero is a story player with the headline crossing it, the studio line resolves from a knockout that reads one room, and a pinned scene cuts forty-two ad hooks down to three winners. Built as a fast static site in Astro with plain TypeScript, GSAP and Lenis, Upwell keeps its case studies, services, team, roles, results and FAQs as one content file per item, respects reduced-motion settings and works on a phone. The pricing slider and the sentence-style contact form are built in.\",\"url\":\"https://visuvate.com/works/upwell\",\"image\":[\"https://visuvate.com/_next/image?url=%2Fmedia%2F35942b9e0b82558c985b7bdcf3fd72cb.jpg&w=1200&q=80\"],\"creator\":{\"@id\":\"https://visuvate.com/#organization\"}}" }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: "{\"@context\":\"https://schema.org\",\"@type\":\"BreadcrumbList\",\"itemListElement\":[{\"@type\":\"ListItem\",\"position\":1,\"name\":\"Home\",\"item\":\"https://visuvate.com/\"},{\"@type\":\"ListItem\",\"position\":2,\"name\":\"Works\",\"item\":\"https://visuvate.com/works\"},{\"@type\":\"ListItem\",\"position\":3,\"name\":\"Upwell\",\"item\":\"https://visuvate.com/works/upwell\"}]}" }} />
        <header className="relative z-0 mx-auto max-w-[1425px] px-6 pt-[153px] md:px-8">
          <ParallaxDrift>
            <HeadingReveal>
              <h1 className="text-center font-display text-[clamp(72px,11vw,160px)] leading-[1] font-medium tracking-[-0.05em] will-change-transform">
                Upwell
              </h1>
            </HeadingReveal>
          </ParallaxDrift>
        </header>
        <div className="relative z-10 mx-auto max-w-[1425px] px-0 md:px-8">
          <div className="relative rounded-[12px] backdrop-blur-[10px]" style={{ background: "color-mix(in srgb, var(--vv-bg) 80%, transparent)" }}>
            <span aria-hidden className="pointer-events-none absolute top-0 left-1/2 h-px w-[600px] max-w-full -translate-x-1/2" style={{ background: "linear-gradient(90deg, transparent 0%, var(--vv-card-line) 50%, transparent 100%)" }} />
            <span aria-hidden className="pointer-events-none absolute inset-0 rounded-[12px]" style={{ background: "radial-gradient(58% 46% at 50% 0%, var(--vv-card-lift) 0%, var(--vv-card-lift-mid) 45%, transparent 78%)" }} />
            <div className="relative flex flex-col gap-6 pt-[50px] lg:gap-10">
              <section className="grid gap-8 px-4 lg:grid-cols-[1fr_0.5fr] lg:px-8">
                <div>
                  <h2 className="font-display text-[20px] leading-[1.1] font-medium tracking-h3 lg:text-[24px] lg:leading-[1.2]">
                    Project Overview
                  </h2>
                  <div className="mt-3 text-[14px] leading-[1.6] text-fg-muted lg:mt-5 lg:text-lead lg:leading-[1.7] [&_a]:text-fg [&_a]:underline [&_li]:mt-2 [&_p]:mt-4 [&_strong]:text-fg [&_ul]:mt-4 [&_ul]:list-disc [&_ul]:pl-5" dangerouslySetInnerHTML={{ __html: "Upwell is a website for a London growth agency, built around ads shown in their real formats, a pinned test that cuts forty-two hooks to three winners, one plan for six services and a published price." }} />
                </div>
                <div className="flex flex-wrap items-end justify-start gap-3 lg:justify-end">
                  <Link href="/works" className="inline-flex items-center rounded-full border border-transparent bg-fg/15 px-[15px] py-[9px] text-[14px] leading-none font-medium transition-colors hover:bg-fg/25">
                    <RollText text="See all work" />
                  </Link>
                  <a href="https://upwell.visuvate.com/" target="_blank" rel="noreferrer" className="inline-flex items-center rounded-full border border-transparent bg-fg px-[15px] py-[9px] text-[14px] leading-none font-medium text-bg transition-colors hover:bg-fg-strong">
                    <RollText text="Preview site" />
                  </a>
                </div>
              </section>
              <dl className="mx-8 grid grid-cols-3 gap-8 border-t pt-6 sm:grid-cols-4 lg:pt-8" style={{ borderColor: "var(--vv-card-rule)" }}>
                <div className="flex flex-col items-center text-center ">
                  <dt className="order-3 mt-1.5 text-[14px] leading-[1.2] text-fg-subtle">
                    Industry
                  </dt>
                  <dd className="order-2 mt-3 text-[15px] leading-[1.2] font-medium text-fg">
                    Agency
                  </dd>
                  <span aria-hidden className="order-1 text-fg">
                    <img src="/media/a4cd88f6ecf43388879a4b38417e2e63.svg" alt="" className="size-[18px] vv-platform-logo object-contain" loading="lazy" decoding="async" />
                  </span>
                </div>
                <div className="flex flex-col items-center text-center hidden sm:flex">
                  <dt className="order-3 mt-1.5 text-[14px] leading-[1.2] text-fg-subtle">
                    Created
                  </dt>
                  <dd className="order-2 mt-3 text-[15px] leading-[1.2] font-medium text-fg">
                    {2026}
                  </dd>
                  <span aria-hidden className="order-1 text-fg">
                    <svg viewBox="1 1 18 18" className="size-[18px]" fill="currentColor">
                      <path d="M10 1a9 9 0 0 1 9 9 9 9 0 0 1-9 9 9 9 0 0 1-9-9 9 9 0 0 1 9-9m1 4a1 1 0 0 0-2 0v5a1 1 0 0 0 1 1h5a1 1 0 0 0 0-2h-4z" />
                    </svg>
                  </span>
                </div>
                <div className="flex flex-col items-center text-center ">
                  <dt className="order-3 mt-1.5 text-[14px] leading-[1.2] text-fg-subtle">
                    Pages
                  </dt>
                  <dd className="order-2 mt-3 text-[15px] leading-[1.2] font-medium text-fg">
                    {5}
                  </dd>
                  <span aria-hidden className="order-1 text-fg">
                    <svg viewBox="1 2 18 16" className="size-[18px]" fill="currentColor">
                      <path d="M12 2a4 4 0 0 1 4 4v8a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V6a4 4 0 0 1 4-4z" />
                      <path d="M2.333 5c.369 0 .667.298.667.667v8.666a.666.666 0 0 1-.667.667A1.333 1.333 0 0 1 1 13.667V6.333C1 5.597 1.597 5 2.333 5" />
                      <path d="M17.667 5C18.403 5 19 5.597 19 6.333v7.334c0 .736-.597 1.333-1.333 1.333a.666.666 0 0 1-.667-.667V5.667c0-.369.298-.667.667-.667" />
                    </svg>
                  </span>
                </div>
                <div className="flex flex-col items-center text-center ">
                  <dt className="order-3 mt-1.5 text-[14px] leading-[1.2] text-fg-subtle">
                    Platform
                  </dt>
                  <dd className="order-2 mt-3 text-[15px] leading-[1.2] font-medium text-fg">
                    Astro
                  </dd>
                  <span aria-hidden className="order-1 text-fg">
                    <img src="/media/1b3665b4ea0465298ca8d869fbbca207.png" alt="" className="size-[18px] vv-platform-logo object-contain" loading="lazy" decoding="async" />
                  </span>
                </div>
              </dl>
              <WorkShots shots={[{ id: 1103, src: "/media/96b58c48bccaf8edd7052032ff942193.jpg", title: "Home: story player hero" }, { id: 1104, src: "/media/a843c2aa267be46ab9b06d8aa35c3e3b.jpg", title: "Home: one room" }, { id: 1105, src: "/media/3f89d9401aec1a90f800886913f0eb97.jpg", title: "Case study: Casa Odela" }, { id: 1106, src: "/media/ac9ba3a46243f80a86d0299580d014c5.jpg", title: "Case study: Brume Skin" }, { id: 1107, src: "/media/b07873dee6d38595902c727501c366bb.jpg", title: "Home: forty-two hooks" }, { id: 1108, src: "/media/799f72bc9f8a2fc73d24d4abd80b2648.jpg", title: "Home: three winners" }, { id: 1109, src: "/media/f9596837a2fbed4b89a5085f8afe0b73.jpg", title: "Home: client testimonials" }, { id: 1110, src: "/media/0e70d0435645b4292e1e6be4a989121a.jpg", title: "Home: how we charge" }]} alt="Upwell" />
            </div>
          </div>
        </div>
        <section className="mx-auto max-w-[1425px] px-4 pt-[36px] md:px-8 md:pt-[96px]">
          <RevealBatch selector="[data-act]" distance={22} stagger={0.09} className="grid gap-4 lg:grid-cols-3 lg:gap-5">
            <div data-act className="group relative flex flex-col overflow-hidden rounded-[12px] border border-fg/12 backdrop-blur-[12px]" style={{ background: "color-mix(in srgb, var(--vv-bg) 42%, transparent)" }}>
              <span aria-hidden className="pointer-events-none absolute top-0 left-1/2 h-px w-[180px] max-w-[70%] -translate-x-1/2" style={{ background: "linear-gradient(90deg, transparent 0%, color-mix(in srgb, var(--vv-card-line) 52%, transparent) 50%, transparent 100%)" }} />
              <span aria-hidden className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(58% 46% at 50% 0%, color-mix(in srgb, var(--vv-card-lift) 38%, transparent) 0%, color-mix(in srgb, var(--vv-card-lift-mid) 38%, transparent) 45%, transparent 78%)" }} />
              <span aria-hidden className="vv-shine vv-shine-lyr-a pointer-events-none absolute inset-0 rounded-[inherit] pointer-coarse:hidden" style={{ padding: 1, animationDuration: "2.8s", backgroundImage: "conic-gradient(from calc(var(--vv-shine-a) - var(--vv-shine-w, 24deg)), transparent 0deg, #0099FF calc(var(--vv-shine-w, 24deg) / 2), #7ACAFF var(--vv-shine-w, 24deg), transparent calc(var(--vv-shine-w, 24deg) * 2), transparent 360deg)", mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", maskComposite: "exclude", WebkitMaskComposite: "xor" }} />
              <span aria-hidden className="vv-shine vv-shine-lyr-b pointer-events-none absolute inset-0 rounded-[inherit] pointer-coarse:hidden" style={{ padding: 1, animationDuration: "2.8s", backgroundImage: "conic-gradient(from calc(var(--vv-shine-b) - var(--vv-shine-w, 24deg)), transparent 0deg, #0099FF calc(var(--vv-shine-w, 24deg) / 2), #7ACAFF var(--vv-shine-w, 24deg), transparent calc(var(--vv-shine-w, 24deg) * 2), transparent 360deg)", mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", maskComposite: "exclude", WebkitMaskComposite: "xor" }} />
              <div className="relative flex flex-1 flex-col p-7 md:p-8">
                <h2 className="font-display text-[20px] leading-[1.1] font-medium tracking-h3 lg:text-[24px] lg:leading-[1.2]">
                  The Brief
                </h2>
                <p className="mt-3 text-[14px] leading-[1.6] text-fg-muted lg:mt-4 lg:text-[16px] lg:leading-[1.7]">
                  {"A growth agency that makes the creative and buys the media wanted a site that proves both at once. Buyers spending £50k to £1.5m a month needed to see real ads, the result each one produced, what the work costs and who does it, without wading through an agency template of logos and adjectives."}
                </p>
              </div>
            </div>
            <div data-act className="group relative flex flex-col overflow-hidden rounded-[12px] border border-fg/12 backdrop-blur-[12px]" style={{ background: "color-mix(in srgb, var(--vv-bg) 42%, transparent)" }}>
              <span aria-hidden className="pointer-events-none absolute top-0 left-1/2 h-px w-[180px] max-w-[70%] -translate-x-1/2" style={{ background: "linear-gradient(90deg, transparent 0%, color-mix(in srgb, var(--vv-card-line) 52%, transparent) 50%, transparent 100%)" }} />
              <span aria-hidden className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(58% 46% at 50% 0%, color-mix(in srgb, var(--vv-card-lift) 38%, transparent) 0%, color-mix(in srgb, var(--vv-card-lift-mid) 38%, transparent) 45%, transparent 78%)" }} />
              <span aria-hidden className="vv-shine vv-shine-lyr-a pointer-events-none absolute inset-0 rounded-[inherit] pointer-coarse:hidden" style={{ padding: 1, animationDuration: "2.8s", backgroundImage: "conic-gradient(from calc(var(--vv-shine-a) - var(--vv-shine-w, 24deg)), transparent 0deg, #0099FF calc(var(--vv-shine-w, 24deg) / 2), #7ACAFF var(--vv-shine-w, 24deg), transparent calc(var(--vv-shine-w, 24deg) * 2), transparent 360deg)", mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", maskComposite: "exclude", WebkitMaskComposite: "xor" }} />
              <span aria-hidden className="vv-shine vv-shine-lyr-b pointer-events-none absolute inset-0 rounded-[inherit] pointer-coarse:hidden" style={{ padding: 1, animationDuration: "2.8s", backgroundImage: "conic-gradient(from calc(var(--vv-shine-b) - var(--vv-shine-w, 24deg)), transparent 0deg, #0099FF calc(var(--vv-shine-w, 24deg) / 2), #7ACAFF var(--vv-shine-w, 24deg), transparent calc(var(--vv-shine-w, 24deg) * 2), transparent 360deg)", mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", maskComposite: "exclude", WebkitMaskComposite: "xor" }} />
              <div className="relative flex flex-1 flex-col p-7 md:p-8">
                <h2 className="font-display text-[20px] leading-[1.1] font-medium tracking-h3 lg:text-[24px] lg:leading-[1.2]">
                  The Approach
                </h2>
                <p className="mt-3 text-[14px] leading-[1.6] text-fg-muted lg:mt-4 lg:text-[16px] lg:leading-[1.7]">
                  Show the work as the ad. The hero is a story player with the headline crossing it, case studies open on the ad formats with the result in mono, the studio line resolves from a knockout that reads one room, and a pinned scene cuts forty-two hooks to the three that won. Services run as one plan with a bar sized by price, the fee is a slider that prices a month of spend, and the contact form is a sentence that finishes itself.
                </p>
              </div>
            </div>
            <div data-act className="group relative flex flex-col overflow-hidden rounded-[12px] border border-fg/12 backdrop-blur-[12px]" style={{ background: "color-mix(in srgb, var(--vv-bg) 42%, transparent)" }}>
              <span aria-hidden className="pointer-events-none absolute top-0 left-1/2 h-px w-[180px] max-w-[70%] -translate-x-1/2" style={{ background: "linear-gradient(90deg, transparent 0%, color-mix(in srgb, var(--vv-card-line) 52%, transparent) 50%, transparent 100%)" }} />
              <span aria-hidden className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(58% 46% at 50% 0%, color-mix(in srgb, var(--vv-card-lift) 38%, transparent) 0%, color-mix(in srgb, var(--vv-card-lift-mid) 38%, transparent) 45%, transparent 78%)" }} />
              <span aria-hidden className="vv-shine vv-shine-lyr-a pointer-events-none absolute inset-0 rounded-[inherit] pointer-coarse:hidden" style={{ padding: 1, animationDuration: "2.8s", backgroundImage: "conic-gradient(from calc(var(--vv-shine-a) - var(--vv-shine-w, 24deg)), transparent 0deg, #0099FF calc(var(--vv-shine-w, 24deg) / 2), #7ACAFF var(--vv-shine-w, 24deg), transparent calc(var(--vv-shine-w, 24deg) * 2), transparent 360deg)", mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", maskComposite: "exclude", WebkitMaskComposite: "xor" }} />
              <span aria-hidden className="vv-shine vv-shine-lyr-b pointer-events-none absolute inset-0 rounded-[inherit] pointer-coarse:hidden" style={{ padding: 1, animationDuration: "2.8s", backgroundImage: "conic-gradient(from calc(var(--vv-shine-b) - var(--vv-shine-w, 24deg)), transparent 0deg, #0099FF calc(var(--vv-shine-w, 24deg) / 2), #7ACAFF var(--vv-shine-w, 24deg), transparent calc(var(--vv-shine-w, 24deg) * 2), transparent 360deg)", mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", maskComposite: "exclude", WebkitMaskComposite: "xor" }} />
              <div className="relative flex flex-1 flex-col p-7 md:p-8">
                <h2 className="font-display text-[20px] leading-[1.1] font-medium tracking-h3 lg:text-[24px] lg:leading-[1.2]">
                  The Outcome
                </h2>
                <p className="mt-3 text-[14px] leading-[1.6] text-fg-muted lg:mt-4 lg:text-[16px] lg:leading-[1.7]">
                  A buyer can watch an ad play, read the number it earned, price their own month of spend and ask for a growth audit in a few minutes. The pages stay light and quick on a phone, and every case study, service, role and result is a content file the client edits without touching the design.
                </p>
              </div>
            </div>
          </RevealBatch>
        </section>
        <section className="mx-auto max-w-[1425px] px-4 pt-[36px] md:px-8 md:pt-[96px]">
          <div className="grid gap-10 lg:grid-cols-[1fr_0.5fr]">
            <RevealBatch selector="h2, p" distance={22} stagger={0.07}>
              <h2 className="font-display text-[20px] leading-[1.1] font-medium tracking-h3 lg:text-[24px] lg:leading-[1.2]">
                About the Project
              </h2>
              <div className="mt-3 text-[14px] leading-[1.6] text-fg-muted lg:mt-5 lg:text-lead lg:leading-[1.7] [&_a]:text-fg [&_a]:underline [&_li]:mt-2 [&_p]:mt-5 [&_strong]:text-fg [&_ul]:mt-4 [&_ul]:list-disc [&_ul]:pl-5" dangerouslySetInnerHTML={{ __html: "Upwell is a complete website for a London growth agency that makes the creative and runs the paid media for brands spending from £50k to £1.5m a month. It is designed to show the work the way it runs: as real ads, with the result sitting next to each one.<p>The site includes Home, Work with six case studies, Services, Agency and Contact, plus Privacy, Terms and 404 pages.</p><p>The visual direction is bold and editorial: a paper page, ink and one signal orange, Mona Sans set wide for headlines and Geist Mono for figures, and ads shown in their real 9:16, 4:5 and 1:1 formats. The hero is a story player with the headline crossing it, the studio line resolves from a knockout that reads one room, and a pinned scene cuts forty-two ad hooks down to three winners.</p><p>Built as a fast static site in Astro with plain TypeScript, GSAP and Lenis, Upwell keeps its case studies, services, team, roles, results and FAQs as one content file per item, respects reduced-motion settings and works on a phone. The pricing slider and the sentence-style contact form are built in.</p>" }} />
            </RevealBatch>
            <RevealBatch selector="h3, li" distance={18} stagger={0.045} className="grid grid-cols-2 gap-x-6 gap-y-6 lg:flex lg:flex-col lg:pl-[132px]">
              <div>
                <h3 className="text-[15px] leading-[1.2] font-medium text-fg">
                  Pages
                </h3>
                <ul className="mt-4 flex flex-col gap-3">
                  <li className="flex items-center gap-2.5 text-[15px] text-fg-muted">
                    <img src="/media/a04620bf967827a01c9ab373294ded57.svg" alt="" className="vv-service-icon size-4 shrink-0" loading="lazy" decoding="async" />
                    Home
                  </li>
                  <li className="flex items-center gap-2.5 text-[15px] text-fg-muted">
                    <img src="/media/386cc56d796a304a0d2f725ee20ad4ae.svg" alt="" className="vv-service-icon size-4 shrink-0" loading="lazy" decoding="async" />
                    About
                  </li>
                  <li className="flex items-center gap-2.5 text-[15px] text-fg-muted">
                    <img src="/media/987b4aaddfb904c69bfc1e3fbc223e13.svg" alt="" className="vv-service-icon size-4 shrink-0" loading="lazy" decoding="async" />
                    Services
                  </li>
                  <li className="flex items-center gap-2.5 text-[15px] text-fg-muted">
                    <img src="/media/fcb525f05120c06db57182579bbd2582.svg" alt="" className="vv-service-icon size-4 shrink-0" loading="lazy" decoding="async" />
                    Projects
                  </li>
                  <li className="flex items-center gap-2.5 text-[15px] text-fg-muted">
                    <img src="/media/b73b885627885c3dd11a14cd42e789a6.svg" alt="" className="vv-service-icon size-4 shrink-0" loading="lazy" decoding="async" />
                    Case Studies
                  </li>
                  <li className="flex items-center gap-2.5 text-[15px] text-fg-muted">
                    <img src="/media/d1ca897b7f3d075d984debca4e756b7e.svg" alt="" className="vv-service-icon size-4 shrink-0" loading="lazy" decoding="async" />
                    Contact
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-[15px] leading-[1.2] font-medium text-fg">
                  Features
                </h3>
                <ul className="mt-4 flex flex-col gap-3">
                  <li className="flex items-center gap-2.5 text-[15px] text-fg-muted">
                    <img src="/media/482e08a8b4e942acdf01d1431cfcfea5.svg" alt="" className="vv-service-icon size-4 shrink-0" loading="lazy" decoding="async" />
                    Forms
                  </li>
                  <li className="flex items-center gap-2.5 text-[15px] text-fg-muted">
                    <img src="/media/ab5b52c0486d2971adb811f745f748ea.svg" alt="" className="vv-service-icon size-4 shrink-0" loading="lazy" decoding="async" />
                    404 Page
                  </li>
                  <li className="flex items-center gap-2.5 text-[15px] text-fg-muted">
                    <img src="/media/62b050a9d9aaf0218617f03fefa2d8ef.svg" alt="" className="vv-service-icon size-4 shrink-0" loading="lazy" decoding="async" />
                    Custom Code
                  </li>
                  <li className="flex items-center gap-2.5 text-[15px] text-fg-muted">
                    <img src="/media/ccc67fa56f9d5eeac04428f669a789be.svg" alt="" className="vv-service-icon size-4 shrink-0" loading="lazy" decoding="async" />
                    Animation
                  </li>
                </ul>
              </div>
            </RevealBatch>
          </div>
        </section>
        <RevealBatch className="mx-auto max-w-[1425px] pt-[100px] pb-[130px] max-sm:overflow-x-clip sm:px-6 md:px-8">
          <div className="mb-8 flex items-center justify-between gap-4 px-4 sm:px-0">
            <h2 className="font-display text-[20px] leading-[1.1] font-medium tracking-h3 lg:text-[24px] lg:leading-[1.2]">
              More Projects
            </h2>
            <Link href="/works" className="inline-flex items-center rounded-full border border-transparent bg-fg/15 px-[15px] py-[9px] text-[14px] leading-none font-medium transition-colors hover:bg-fg/25">
              <RollText text="All Projects" />
            </Link>
          </div>
          <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:grid sm:grid-cols-2 sm:gap-5 sm:overflow-visible sm:px-0 lg:grid-cols-3">
            <Link data-reveal href="/works/lumora" className="group relative w-[72vw] max-w-[280px] shrink-0 snap-start rounded-[6px] border border-fg/12 bg-bg/30 p-[6px] pb-3 backdrop-blur-[14px] sm:w-auto sm:max-w-none lg:rounded-[12px] lg:p-[10px] lg:pb-4">
              <span aria-hidden className="vv-shine vv-shine-lyr-a pointer-events-none absolute inset-0 rounded-[inherit] pointer-coarse:hidden" style={{ padding: 1, animationDuration: "2.8s", backgroundImage: "conic-gradient(from calc(var(--vv-shine-a) - var(--vv-shine-w, 24deg)), transparent 0deg, #0099FF calc(var(--vv-shine-w, 24deg) / 2), #7ACAFF var(--vv-shine-w, 24deg), transparent calc(var(--vv-shine-w, 24deg) * 2), transparent 360deg)", mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", maskComposite: "exclude", WebkitMaskComposite: "xor" }} />
              <span aria-hidden className="vv-shine vv-shine-lyr-b pointer-events-none absolute inset-0 rounded-[inherit] pointer-coarse:hidden" style={{ padding: 1, animationDuration: "2.8s", backgroundImage: "conic-gradient(from calc(var(--vv-shine-b) - var(--vv-shine-w, 24deg)), transparent 0deg, #0099FF calc(var(--vv-shine-w, 24deg) / 2), #7ACAFF var(--vv-shine-w, 24deg), transparent calc(var(--vv-shine-w, 24deg) * 2), transparent 360deg)", mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", maskComposite: "exclude", WebkitMaskComposite: "xor" }} />
              <div className="relative overflow-hidden rounded-[3px] bg-surface lg:rounded-[6px]" style={{ aspectRatio: "4 / 3" }}>
                <img src="/media/74825dc609fef87875347b831325907d.jpg" alt="Lumora" className="absolute inset-x-0 top-0 w-full transition-[filter] duration-500 ease-brand group-hover:[filter:blur(7px)_brightness(0.62)]" loading="lazy" decoding="async" />
                <span className="pointer-events-none absolute inset-0 grid place-items-center opacity-0 transition-opacity duration-400 ease-brand group-hover:opacity-100">
                  <span className="vv-accent text-[clamp(20px,2vw,28px)] leading-none text-white">
                    View Project
                  </span>
                </span>
              </div>
              <div className="mt-3 pl-2 lg:mt-4 lg:pl-3">
                <h3 className="truncate font-display text-[16px] leading-[1.25] font-medium tracking-h3 lg:text-[20px]">
                  Lumora
                </h3>
                <p className="mt-[2px] truncate text-[13px] leading-[1.4] text-fg-muted lg:text-[16px]">
                  Agency
                </p>
              </div>
            </Link>
            <Link data-reveal href="/works/guardian-vets" className="group relative w-[72vw] max-w-[280px] shrink-0 snap-start rounded-[6px] border border-fg/12 bg-bg/30 p-[6px] pb-3 backdrop-blur-[14px] sm:w-auto sm:max-w-none lg:rounded-[12px] lg:p-[10px] lg:pb-4">
              <span aria-hidden className="vv-shine vv-shine-lyr-a pointer-events-none absolute inset-0 rounded-[inherit] pointer-coarse:hidden" style={{ padding: 1, animationDuration: "2.8s", backgroundImage: "conic-gradient(from calc(var(--vv-shine-a) - var(--vv-shine-w, 24deg)), transparent 0deg, #0099FF calc(var(--vv-shine-w, 24deg) / 2), #7ACAFF var(--vv-shine-w, 24deg), transparent calc(var(--vv-shine-w, 24deg) * 2), transparent 360deg)", mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", maskComposite: "exclude", WebkitMaskComposite: "xor" }} />
              <span aria-hidden className="vv-shine vv-shine-lyr-b pointer-events-none absolute inset-0 rounded-[inherit] pointer-coarse:hidden" style={{ padding: 1, animationDuration: "2.8s", backgroundImage: "conic-gradient(from calc(var(--vv-shine-b) - var(--vv-shine-w, 24deg)), transparent 0deg, #0099FF calc(var(--vv-shine-w, 24deg) / 2), #7ACAFF var(--vv-shine-w, 24deg), transparent calc(var(--vv-shine-w, 24deg) * 2), transparent 360deg)", mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", maskComposite: "exclude", WebkitMaskComposite: "xor" }} />
              <div className="relative overflow-hidden rounded-[3px] bg-surface lg:rounded-[6px]" style={{ aspectRatio: "4 / 3" }}>
                <img src="/media/cfae7457b0a647b8a422a0a73231a34d.jpg" alt="Guardian Vets" className="absolute inset-x-0 top-0 w-full transition-[filter] duration-500 ease-brand group-hover:[filter:blur(7px)_brightness(0.62)]" loading="lazy" decoding="async" />
                <span className="pointer-events-none absolute inset-0 grid place-items-center opacity-0 transition-opacity duration-400 ease-brand group-hover:opacity-100">
                  <span className="vv-accent text-[clamp(20px,2vw,28px)] leading-none text-white">
                    View Project
                  </span>
                </span>
              </div>
              <div className="mt-3 pl-2 lg:mt-4 lg:pl-3">
                <h3 className="truncate font-display text-[16px] leading-[1.25] font-medium tracking-h3 lg:text-[20px]">
                  Guardian Vets
                </h3>
                <p className="mt-[2px] truncate text-[13px] leading-[1.4] text-fg-muted lg:text-[16px]">
                  Healthcare
                </p>
              </div>
            </Link>
            <Link data-reveal href="/works/parley" className="group relative w-[72vw] max-w-[280px] shrink-0 snap-start rounded-[6px] border border-fg/12 bg-bg/30 p-[6px] pb-3 backdrop-blur-[14px] sm:w-auto sm:max-w-none lg:rounded-[12px] lg:p-[10px] lg:pb-4">
              <span aria-hidden className="vv-shine vv-shine-lyr-a pointer-events-none absolute inset-0 rounded-[inherit] pointer-coarse:hidden" style={{ padding: 1, animationDuration: "2.8s", backgroundImage: "conic-gradient(from calc(var(--vv-shine-a) - var(--vv-shine-w, 24deg)), transparent 0deg, #0099FF calc(var(--vv-shine-w, 24deg) / 2), #7ACAFF var(--vv-shine-w, 24deg), transparent calc(var(--vv-shine-w, 24deg) * 2), transparent 360deg)", mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", maskComposite: "exclude", WebkitMaskComposite: "xor" }} />
              <span aria-hidden className="vv-shine vv-shine-lyr-b pointer-events-none absolute inset-0 rounded-[inherit] pointer-coarse:hidden" style={{ padding: 1, animationDuration: "2.8s", backgroundImage: "conic-gradient(from calc(var(--vv-shine-b) - var(--vv-shine-w, 24deg)), transparent 0deg, #0099FF calc(var(--vv-shine-w, 24deg) / 2), #7ACAFF var(--vv-shine-w, 24deg), transparent calc(var(--vv-shine-w, 24deg) * 2), transparent 360deg)", mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", maskComposite: "exclude", WebkitMaskComposite: "xor" }} />
              <div className="relative overflow-hidden rounded-[3px] bg-surface lg:rounded-[6px]" style={{ aspectRatio: "4 / 3" }}>
                <img src="/media/21a324b4d4441c17d05b0c0ac07343f1.jpg" alt="Parley" className="absolute inset-x-0 top-0 w-full transition-[filter] duration-500 ease-brand group-hover:[filter:blur(7px)_brightness(0.62)]" loading="lazy" decoding="async" />
                <span className="pointer-events-none absolute inset-0 grid place-items-center opacity-0 transition-opacity duration-400 ease-brand group-hover:opacity-100">
                  <span className="vv-accent text-[clamp(20px,2vw,28px)] leading-none text-white">
                    View Project
                  </span>
                </span>
              </div>
              <div className="mt-3 pl-2 lg:mt-4 lg:pl-3">
                <h3 className="truncate font-display text-[16px] leading-[1.25] font-medium tracking-h3 lg:text-[20px]">
                  Parley
                </h3>
                <p className="mt-[2px] truncate text-[13px] leading-[1.4] text-fg-muted lg:text-[16px]">
                  Corporate
                </p>
              </div>
            </Link>
          </div>
        </RevealBatch>
      </main>
    </>
  );
}
