import HeadingReveal from '@/components/motion/HeadingReveal';
import Link from '@/components/Link';
import ParallaxDrift from '@/components/motion/ParallaxDrift';
import RevealBatch from '@/components/motion/RevealBatch';
import RollText from '@/components/RollText';
import WorkShots from '@/components/works/WorkShots';

// Converted 1:1 from the RSC payload of /works/longitude-society.
export default function Page_works__longitude_society() {
  return (
    <>
      <main className="relative isolate">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: "{\"@context\":\"https://schema.org\",\"@type\":\"CreativeWork\",\"name\":\"Longitude Society\",\"description\":\"Longitude Society is a concept brand for a small atelier of planners who design private journeys to remote places, built to prove that a travel site can sell judgement rather than packages — which is the hardest thing in the category to put on a page. Six pages carry it: a home that opens on a full-screen frame, an Expeditions register of the routes currently open, an Atlas of forty-one countries with a pin for each, The Atelier for the people and the method, a How it works timeline, and an enquiry page shaped like a travel document. The site is hand-built in plain HTML, CSS and JavaScript, with its typefaces embedded in the page rather than fetched from a CDN, so it opens as readily on a hotel connection as on a desk. Interaction is used only where it earns its place: a hero search that composes an enquiry, an atlas that opens a country on hover or keyboard, seven months of planning drawn as overlapping bars, and dispatches from past travellers printed like boarding passes.\",\"url\":\"https://visuvate.com/works/longitude-society\",\"image\":[\"https://visuvate.com/_next/image?url=%2Fmedia%2Fd63fa3dbe23e756858e2a3062dcec758.jpg&w=1200&q=80\"],\"creator\":{\"@id\":\"https://visuvate.com/#organization\"}}" }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: "{\"@context\":\"https://schema.org\",\"@type\":\"BreadcrumbList\",\"itemListElement\":[{\"@type\":\"ListItem\",\"position\":1,\"name\":\"Home\",\"item\":\"https://visuvate.com/\"},{\"@type\":\"ListItem\",\"position\":2,\"name\":\"Works\",\"item\":\"https://visuvate.com/works\"},{\"@type\":\"ListItem\",\"position\":3,\"name\":\"Longitude Society\",\"item\":\"https://visuvate.com/works/longitude-society\"}]}" }} />
        <header className="relative z-0 mx-auto max-w-[1425px] px-6 pt-[153px] md:px-8">
          <ParallaxDrift>
            <HeadingReveal>
              <h1 className="text-center font-display text-[clamp(72px,11vw,160px)] leading-[1] font-medium tracking-[-0.05em] will-change-transform">
                Longitude Society
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
                  <div className="mt-3 text-[14px] leading-[1.6] text-fg-muted lg:mt-5 lg:text-lead lg:leading-[1.7] [&_a]:text-fg [&_a]:underline [&_li]:mt-2 [&_p]:mt-4 [&_strong]:text-fg [&_ul]:mt-4 [&_ul]:list-disc [&_ul]:pl-5" dangerouslySetInnerHTML={{ __html: "Longitude Society is a private-expedition travel studio designed and built end to end — six pages that run from a full-screen hero into a register of open journeys, an atlas of forty-one countries, the planners behind them and an enquiry form, so the conversation starts on the site itself." }} />
                </div>
                <div className="flex flex-wrap items-end justify-start gap-3 lg:justify-end">
                  <Link href="/works" className="inline-flex items-center rounded-full border border-transparent bg-fg/15 px-[15px] py-[9px] text-[14px] leading-none font-medium transition-colors hover:bg-fg/25">
                    <RollText text="See all work" />
                  </Link>
                  <a href="https://longitude.visuvate.com/" target="_blank" rel="noreferrer" className="inline-flex items-center rounded-full border border-transparent bg-fg px-[15px] py-[9px] text-[14px] leading-none font-medium text-bg transition-colors hover:bg-fg-strong">
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
                    {6}
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
                    Custom Code
                  </dd>
                  <span aria-hidden className="order-1 text-fg">
                    <img src="/media/329ed40d85305cc2cc3b7320e517a911.png" alt="" className="size-[18px] vv-platform-logo object-contain" loading="lazy" decoding="async" />
                  </span>
                </div>
              </dl>
              <WorkShots shots={[{ id: 1138, src: "/media/e73e68338d45a017fca88720a1b02c6d.jpg", title: "Home — hero" }, { id: 1139, src: "/media/4c751b0498ad7540a988c828361ed203.jpg", title: "Expeditions" }, { id: 1140, src: "/media/6352aaa67a6c8cb9851b1c5187a75dde.jpg", title: "The Atlas" }, { id: 1141, src: "/media/a2f5ea4f69d3fe481c896f0ca5e63dd8.jpg", title: "The Atelier" }, { id: 1142, src: "/media/1f88e77e60f252a1a3bb4d445718a0ce.jpg", title: "How it works" }, { id: 1143, src: "/media/0f0242a49767be10646d0c7d647e3a1f.jpg", title: "Enquiry" }]} alt="Longitude Society" />
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
                  A travel brand that sells bespoke planning has nothing to show but photographs everyone else also has. The site had to make an atelier of eleven planners feel deliberate and rare, without listing packages like a tour operator.
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
                  We built six pages around one idea: every journey is drawn, not sold. A full-screen hero, a register of the routes open now, an atlas of forty-one countries, and a timeline showing how seven months actually overlap.
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
                  The site now reads as a studio rather than a catalogue. A visitor can judge the method in a single scroll, see which travel windows are still free, and send an enquiry that already carries the shape of the trip.
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
              <div className="mt-3 text-[14px] leading-[1.6] text-fg-muted lg:mt-5 lg:text-lead lg:leading-[1.7] [&_a]:text-fg [&_a]:underline [&_li]:mt-2 [&_p]:mt-5 [&_strong]:text-fg [&_ul]:mt-4 [&_ul]:list-disc [&_ul]:pl-5" dangerouslySetInnerHTML={{ __html: "Longitude Society is a concept brand for a small atelier of planners who design private journeys to remote places, built to prove that a travel site can sell judgement rather than packages — which is the hardest thing in the category to put on a page.<p>Six pages carry it: a home that opens on a full-screen frame, an Expeditions register of the routes currently open, an Atlas of forty-one countries with a pin for each, The Atelier for the people and the method, a How it works timeline, and an enquiry page shaped like a travel document.</p><p>The site is hand-built in plain HTML, CSS and JavaScript, with its typefaces embedded in the page rather than fetched from a CDN, so it opens as readily on a hotel connection as on a desk.</p><p>Interaction is used only where it earns its place: a hero search that composes an enquiry, an atlas that opens a country on hover or keyboard, seven months of planning drawn as overlapping bars, and dispatches from past travellers printed like boarding passes.</p>" }} />
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
            <Link data-reveal href="/works/ironwood" className="group relative w-[72vw] max-w-[280px] shrink-0 snap-start rounded-[6px] border border-fg/12 bg-bg/30 p-[6px] pb-3 backdrop-blur-[14px] sm:w-auto sm:max-w-none lg:rounded-[12px] lg:p-[10px] lg:pb-4">
              <span aria-hidden className="vv-shine vv-shine-lyr-a pointer-events-none absolute inset-0 rounded-[inherit] pointer-coarse:hidden" style={{ padding: 1, animationDuration: "2.8s", backgroundImage: "conic-gradient(from calc(var(--vv-shine-a) - var(--vv-shine-w, 24deg)), transparent 0deg, #0099FF calc(var(--vv-shine-w, 24deg) / 2), #7ACAFF var(--vv-shine-w, 24deg), transparent calc(var(--vv-shine-w, 24deg) * 2), transparent 360deg)", mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", maskComposite: "exclude", WebkitMaskComposite: "xor" }} />
              <span aria-hidden className="vv-shine vv-shine-lyr-b pointer-events-none absolute inset-0 rounded-[inherit] pointer-coarse:hidden" style={{ padding: 1, animationDuration: "2.8s", backgroundImage: "conic-gradient(from calc(var(--vv-shine-b) - var(--vv-shine-w, 24deg)), transparent 0deg, #0099FF calc(var(--vv-shine-w, 24deg) / 2), #7ACAFF var(--vv-shine-w, 24deg), transparent calc(var(--vv-shine-w, 24deg) * 2), transparent 360deg)", mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", maskComposite: "exclude", WebkitMaskComposite: "xor" }} />
              <div className="relative overflow-hidden rounded-[3px] bg-surface lg:rounded-[6px]" style={{ aspectRatio: "4 / 3" }}>
                <img src="/media/a593e5373ed93302134ec5f4240761a0.jpg" alt="Ironwood" className="absolute inset-x-0 top-0 w-full transition-[filter] duration-500 ease-brand group-hover:[filter:blur(7px)_brightness(0.62)]" loading="lazy" decoding="async" />
                <span className="pointer-events-none absolute inset-0 grid place-items-center opacity-0 transition-opacity duration-400 ease-brand group-hover:opacity-100">
                  <span className="vv-accent text-[clamp(20px,2vw,28px)] leading-none text-white">
                    View Project
                  </span>
                </span>
              </div>
              <div className="mt-3 pl-2 lg:mt-4 lg:pl-3">
                <h3 className="truncate font-display text-[16px] leading-[1.25] font-medium tracking-h3 lg:text-[20px]">
                  Ironwood
                </h3>
                <p className="mt-[2px] truncate text-[13px] leading-[1.4] text-fg-muted lg:text-[16px]">
                  Construction
                </p>
              </div>
            </Link>
            <Link data-reveal href="/works/stillroom" className="group relative w-[72vw] max-w-[280px] shrink-0 snap-start rounded-[6px] border border-fg/12 bg-bg/30 p-[6px] pb-3 backdrop-blur-[14px] sm:w-auto sm:max-w-none lg:rounded-[12px] lg:p-[10px] lg:pb-4">
              <span aria-hidden className="vv-shine vv-shine-lyr-a pointer-events-none absolute inset-0 rounded-[inherit] pointer-coarse:hidden" style={{ padding: 1, animationDuration: "2.8s", backgroundImage: "conic-gradient(from calc(var(--vv-shine-a) - var(--vv-shine-w, 24deg)), transparent 0deg, #0099FF calc(var(--vv-shine-w, 24deg) / 2), #7ACAFF var(--vv-shine-w, 24deg), transparent calc(var(--vv-shine-w, 24deg) * 2), transparent 360deg)", mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", maskComposite: "exclude", WebkitMaskComposite: "xor" }} />
              <span aria-hidden className="vv-shine vv-shine-lyr-b pointer-events-none absolute inset-0 rounded-[inherit] pointer-coarse:hidden" style={{ padding: 1, animationDuration: "2.8s", backgroundImage: "conic-gradient(from calc(var(--vv-shine-b) - var(--vv-shine-w, 24deg)), transparent 0deg, #0099FF calc(var(--vv-shine-w, 24deg) / 2), #7ACAFF var(--vv-shine-w, 24deg), transparent calc(var(--vv-shine-w, 24deg) * 2), transparent 360deg)", mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", maskComposite: "exclude", WebkitMaskComposite: "xor" }} />
              <div className="relative overflow-hidden rounded-[3px] bg-surface lg:rounded-[6px]" style={{ aspectRatio: "4 / 3" }}>
                <img src="/media/f51bbfe772c3d754c3738d4af8efca44.jpg" alt="Stillroom" className="absolute inset-x-0 top-0 w-full transition-[filter] duration-500 ease-brand group-hover:[filter:blur(7px)_brightness(0.62)]" loading="lazy" decoding="async" />
                <span className="pointer-events-none absolute inset-0 grid place-items-center opacity-0 transition-opacity duration-400 ease-brand group-hover:opacity-100">
                  <span className="vv-accent text-[clamp(20px,2vw,28px)] leading-none text-white">
                    View Project
                  </span>
                </span>
              </div>
              <div className="mt-3 pl-2 lg:mt-4 lg:pl-3">
                <h3 className="truncate font-display text-[16px] leading-[1.25] font-medium tracking-h3 lg:text-[20px]">
                  Stillroom
                </h3>
                <p className="mt-[2px] truncate text-[13px] leading-[1.4] text-fg-muted lg:text-[16px]">
                  Healthcare
                </p>
              </div>
            </Link>
            <Link data-reveal href="/works/tigre-tigre" className="group relative w-[72vw] max-w-[280px] shrink-0 snap-start rounded-[6px] border border-fg/12 bg-bg/30 p-[6px] pb-3 backdrop-blur-[14px] sm:w-auto sm:max-w-none lg:rounded-[12px] lg:p-[10px] lg:pb-4">
              <span aria-hidden className="vv-shine vv-shine-lyr-a pointer-events-none absolute inset-0 rounded-[inherit] pointer-coarse:hidden" style={{ padding: 1, animationDuration: "2.8s", backgroundImage: "conic-gradient(from calc(var(--vv-shine-a) - var(--vv-shine-w, 24deg)), transparent 0deg, #0099FF calc(var(--vv-shine-w, 24deg) / 2), #7ACAFF var(--vv-shine-w, 24deg), transparent calc(var(--vv-shine-w, 24deg) * 2), transparent 360deg)", mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", maskComposite: "exclude", WebkitMaskComposite: "xor" }} />
              <span aria-hidden className="vv-shine vv-shine-lyr-b pointer-events-none absolute inset-0 rounded-[inherit] pointer-coarse:hidden" style={{ padding: 1, animationDuration: "2.8s", backgroundImage: "conic-gradient(from calc(var(--vv-shine-b) - var(--vv-shine-w, 24deg)), transparent 0deg, #0099FF calc(var(--vv-shine-w, 24deg) / 2), #7ACAFF var(--vv-shine-w, 24deg), transparent calc(var(--vv-shine-w, 24deg) * 2), transparent 360deg)", mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", maskComposite: "exclude", WebkitMaskComposite: "xor" }} />
              <div className="relative overflow-hidden rounded-[3px] bg-surface lg:rounded-[6px]" style={{ aspectRatio: "4 / 3" }}>
                <img src="/media/1fe67bf8049f0972268b3ff14106d988.jpg" alt="Tigre-Tigre" className="absolute inset-x-0 top-0 w-full transition-[filter] duration-500 ease-brand group-hover:[filter:blur(7px)_brightness(0.62)]" loading="lazy" decoding="async" />
                <span className="pointer-events-none absolute inset-0 grid place-items-center opacity-0 transition-opacity duration-400 ease-brand group-hover:opacity-100">
                  <span className="vv-accent text-[clamp(20px,2vw,28px)] leading-none text-white">
                    View Project
                  </span>
                </span>
              </div>
              <div className="mt-3 pl-2 lg:mt-4 lg:pl-3">
                <h3 className="truncate font-display text-[16px] leading-[1.25] font-medium tracking-h3 lg:text-[20px]">
                  Tigre-Tigre
                </h3>
                <p className="mt-[2px] truncate text-[13px] leading-[1.4] text-fg-muted lg:text-[16px]">
                  Restaurant
                </p>
              </div>
            </Link>
          </div>
        </RevealBatch>
      </main>
    </>
  );
}
