import HeadingReveal from '@/components/motion/HeadingReveal';
import Link from '@/components/Link';
import ParallaxDrift from '@/components/motion/ParallaxDrift';
import RevealBatch from '@/components/motion/RevealBatch';
import RollText from '@/components/RollText';
import WorkShots from '@/components/works/WorkShots';

// Converted 1:1 from the RSC payload of /works/meridian-ecom.
export default function Page_works__meridian_ecom() {
  return (
    <>
      <main className="relative isolate">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: "{\"@context\":\"https://schema.org\",\"@type\":\"CreativeWork\",\"name\":\"Meridian eCom\",\"description\":\"The Meridian website is a full eCommerce build for a fictional Genève watchmaker, designed to feel closer to a boutique showroom than a typical online store. The homepage leads with a cinematic hero and a considered product narrative — \\\"Precision, worn quietly\\\" — before moving into curated collections (Best Sellers, New Arrivals, Sale) and a dedicated craft section that walks through materials, movement, and water resistance. Rather than presenting a flat product grid, the site layers storytelling throughout: a limited-edition GMT spotlight, a five-point craft breakdown, and a concierge-style service section covering warranty, servicing, and delivery. Category navigation (Luxury, Sports, Smart, Ladies) sits alongside a full catalogue, giving the store both a browsable structure and a strong editorial point of view. The visual language stays disciplined — deep blues and steel tones, generous whitespace, and typography that reads more editorial than retail — reinforcing the \\\"engineered to outlast trends\\\" positioning. A newsletter capture (\\\"Correspondence\\\") closes the experience, keeping the tone consistent with the rest of the site rather than reading as a bolt-on marketing form.\",\"url\":\"https://visuvate.com/works/meridian-ecom\",\"image\":[\"https://visuvate.com/_next/image?url=%2Fmedia%2F880bc5394692eafe333491e29aba8c01.jpg&w=1200&q=80\"],\"creator\":{\"@id\":\"https://visuvate.com/#organization\"}}" }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: "{\"@context\":\"https://schema.org\",\"@type\":\"BreadcrumbList\",\"itemListElement\":[{\"@type\":\"ListItem\",\"position\":1,\"name\":\"Home\",\"item\":\"https://visuvate.com/\"},{\"@type\":\"ListItem\",\"position\":2,\"name\":\"Works\",\"item\":\"https://visuvate.com/works\"},{\"@type\":\"ListItem\",\"position\":3,\"name\":\"Meridian eCom\",\"item\":\"https://visuvate.com/works/meridian-ecom\"}]}" }} />
        <header className="relative z-0 mx-auto max-w-[1425px] px-6 pt-[153px] md:px-8">
          <ParallaxDrift>
            <HeadingReveal>
              <h1 className="text-center font-display text-[clamp(72px,11vw,160px)] leading-[1] font-medium tracking-[-0.05em] will-change-transform">
                Meridian eCom
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
                  <div className="mt-3 text-[14px] leading-[1.6] text-fg-muted lg:mt-5 lg:text-lead lg:leading-[1.7] [&_a]:text-fg [&_a]:underline [&_li]:mt-2 [&_p]:mt-4 [&_strong]:text-fg [&_ul]:mt-4 [&_ul]:list-disc [&_ul]:pl-5" dangerouslySetInnerHTML={{ __html: "<p class=\"font_8\">Meridian is a premium eCommerce experience for a Swiss watchmaker, presenting mechanical timepieces across men's, women's, sports, and smart collections through a refined, gallery-like shopping flow built for a slower, more considered kind of browsing.</p>" }} />
                </div>
                <div className="flex flex-wrap items-end justify-start gap-3 lg:justify-end">
                  <Link href="/works" className="inline-flex items-center rounded-full border border-transparent bg-fg/15 px-[15px] py-[9px] text-[14px] leading-none font-medium transition-colors hover:bg-fg/25">
                    <RollText text="See all work" />
                  </Link>
                  <a href="https://visuvatestudio.wixstudio.com/meridian" target="_blank" rel="noreferrer" className="inline-flex items-center rounded-full border border-transparent bg-fg px-[15px] py-[9px] text-[14px] leading-none font-medium text-bg transition-colors hover:bg-fg-strong">
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
                    eCommerce
                  </dd>
                  <span aria-hidden className="order-1 text-fg">
                    <img src="/media/9554f3aa694e3007bb5e7531460ed79c.svg" alt="" className="size-[18px] vv-platform-logo object-contain" loading="lazy" decoding="async" />
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
                    {8}
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
                    Wix Studio
                  </dd>
                  <span aria-hidden className="order-1 text-fg">
                    <img src="/media/12f174fbe6106094af5b31e0042943c2.png" alt="" className="size-[18px] vv-platform-logo object-contain" loading="lazy" decoding="async" />
                  </span>
                </div>
              </dl>
              <WorkShots shots={[{ id: 251, src: "/media/f37d2a586e1771953dfaf4bda792c8f0.jpg", title: "Home 5.jpeg" }, { id: 252, src: "/media/7b9959fd2a33e6c68e00eafe0edfc039.jpg", title: "home1.jpeg" }, { id: 253, src: "/media/9d08521a8ddc638cd70e2ab2a1b6ef77.jpg", title: "Home 2.jpeg" }, { id: 254, src: "/media/5e8228ccce9270271e4385ad537e2e63.jpg", title: "Home 4.jpeg" }, { id: 255, src: "/media/81c11dd91c6e117a5fa272d8c9b55b21.jpg", title: "Meridian Store.jpeg" }, { id: 256, src: "/media/fb503afacd17a18945cc782251ca6d76.jpg", title: "Product 2.jpeg" }, { id: 257, src: "/media/a7221efc65a35731d94951357b34d63e.jpg", title: "Home Footer.jpeg" }, { id: 258, src: "/media/62e55073aadd83f56b1d418e6e935f7f.jpg", title: "Home 3.jpeg" }, { id: 259, src: "/media/1f4ce066ff7b4fc543bb2a7f67eef58b.jpg", title: "Product1.jpeg" }]} alt="Meridian eCom" />
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
                  A Swiss watchmaker needed a store that sells the way a boutique does — unhurried, precise, certain of its worth. Most ecommerce templates optimise for volume and noise; mechanical timepieces need the opposite: room, restraint, and product photography treated like the product itself.
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
                  We built a gallery-first storefront in Wix Studio: collections for men’s, women’s, sport, and smart lines, each presented on deep neutral grounds with the watch as the only saturated object on screen. Payments, filtering, and category browsing run on the platform’s commerce layer, so the elegance sits on proven checkout plumbing.
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
                  The store reads as a showroom and functions as a machine — browsing feels like being handed the watch, while cart and checkout behave exactly as buyers expect. Collections scale without crowding, and the brand’s restraint survives every screen size.
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
              <div className="mt-3 text-[14px] leading-[1.6] text-fg-muted lg:mt-5 lg:text-lead lg:leading-[1.7] [&_a]:text-fg [&_a]:underline [&_li]:mt-2 [&_p]:mt-5 [&_strong]:text-fg [&_ul]:mt-4 [&_ul]:list-disc [&_ul]:pl-5" dangerouslySetInnerHTML={{ __html: "<p><strong>The Meridian</strong> website is a full eCommerce build for a fictional Genève watchmaker, designed to feel closer to a boutique showroom than a typical online store. The homepage leads with a cinematic hero and a considered product narrative — \"Precision, worn quietly\" — before moving into curated collections (Best Sellers, New Arrivals, Sale) and a dedicated craft section that walks through materials, movement, and water resistance.</p>\n\n<p>Rather than presenting a flat product grid, the site layers storytelling throughout: a limited-edition GMT spotlight, a five-point craft breakdown, and a concierge-style service section covering warranty, servicing, and delivery. Category navigation (Luxury, Sports, Smart, Ladies) sits alongside a full catalogue, giving the store both a browsable structure and a strong editorial point of view.</p>\n\n<p>The visual language stays disciplined — deep blues and steel tones, generous whitespace, and typography that reads more editorial than retail — reinforcing the \"engineered to outlast trends\" positioning. A newsletter capture (\"Correspondence\") closes the experience, keeping the tone consistent with the rest of the site rather than reading as a bolt-on marketing form.</p>" }} />
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
                    <img src="/media/59f868d19fa62275a068aa661fcd0314.svg" alt="" className="vv-service-icon size-4 shrink-0" loading="lazy" decoding="async" />
                    Product
                  </li>
                  <li className="flex items-center gap-2.5 text-[15px] text-fg-muted">
                    <img src="/media/4b9de61edfa3a73c77506ffa789d289c.svg" alt="" className="vv-service-icon size-4 shrink-0" loading="lazy" decoding="async" />
                    Login
                  </li>
                  <li className="flex items-center gap-2.5 text-[15px] text-fg-muted">
                    <img src="/media/5775236a9a4bb8180b13c3415c7957f0.svg" alt="" className="vv-service-icon size-4 shrink-0" loading="lazy" decoding="async" />
                    Payment
                  </li>
                  <li className="flex items-center gap-2.5 text-[15px] text-fg-muted">
                    <img src="/media/e6e63814202f4ba316e1a24b96abc57f.svg" alt="" className="vv-service-icon size-4 shrink-0" loading="lazy" decoding="async" />
                    Privacy Policy
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-[15px] leading-[1.2] font-medium text-fg">
                  Features
                </h3>
                <ul className="mt-4 flex flex-col gap-3">
                  <li className="flex items-center gap-2.5 text-[15px] text-fg-muted">
                    <img src="/media/9429cbf9443912ff7006230e77b58aa5.svg" alt="" className="vv-service-icon size-4 shrink-0" loading="lazy" decoding="async" />
                    Payment Integration
                  </li>
                  <li className="flex items-center gap-2.5 text-[15px] text-fg-muted">
                    <img src="/media/482e08a8b4e942acdf01d1431cfcfea5.svg" alt="" className="vv-service-icon size-4 shrink-0" loading="lazy" decoding="async" />
                    Forms
                  </li>
                  <li className="flex items-center gap-2.5 text-[15px] text-fg-muted">
                    <img src="/media/9554f3aa694e3007bb5e7531460ed79c.svg" alt="" className="vv-service-icon size-4 shrink-0" loading="lazy" decoding="async" />
                    Store
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
            <Link data-reveal href="/works/valden" className="group relative w-[72vw] max-w-[280px] shrink-0 snap-start rounded-[6px] border border-fg/12 bg-bg/30 p-[6px] pb-3 backdrop-blur-[14px] sm:w-auto sm:max-w-none lg:rounded-[12px] lg:p-[10px] lg:pb-4">
              <span aria-hidden className="vv-shine vv-shine-lyr-a pointer-events-none absolute inset-0 rounded-[inherit] pointer-coarse:hidden" style={{ padding: 1, animationDuration: "2.8s", backgroundImage: "conic-gradient(from calc(var(--vv-shine-a) - var(--vv-shine-w, 24deg)), transparent 0deg, #0099FF calc(var(--vv-shine-w, 24deg) / 2), #7ACAFF var(--vv-shine-w, 24deg), transparent calc(var(--vv-shine-w, 24deg) * 2), transparent 360deg)", mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", maskComposite: "exclude", WebkitMaskComposite: "xor" }} />
              <span aria-hidden className="vv-shine vv-shine-lyr-b pointer-events-none absolute inset-0 rounded-[inherit] pointer-coarse:hidden" style={{ padding: 1, animationDuration: "2.8s", backgroundImage: "conic-gradient(from calc(var(--vv-shine-b) - var(--vv-shine-w, 24deg)), transparent 0deg, #0099FF calc(var(--vv-shine-w, 24deg) / 2), #7ACAFF var(--vv-shine-w, 24deg), transparent calc(var(--vv-shine-w, 24deg) * 2), transparent 360deg)", mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", maskComposite: "exclude", WebkitMaskComposite: "xor" }} />
              <div className="relative overflow-hidden rounded-[3px] bg-surface lg:rounded-[6px]" style={{ aspectRatio: "4 / 3" }}>
                <img src="/media/844396da09e74fc2d96a433de019306f.jpg" alt="Valden" className="absolute inset-x-0 top-0 w-full transition-[filter] duration-500 ease-brand group-hover:[filter:blur(7px)_brightness(0.62)]" loading="lazy" decoding="async" />
                <span className="pointer-events-none absolute inset-0 grid place-items-center opacity-0 transition-opacity duration-400 ease-brand group-hover:opacity-100">
                  <span className="vv-accent text-[clamp(20px,2vw,28px)] leading-none text-white">
                    View Project
                  </span>
                </span>
              </div>
              <div className="mt-3 pl-2 lg:mt-4 lg:pl-3">
                <h3 className="truncate font-display text-[16px] leading-[1.25] font-medium tracking-h3 lg:text-[20px]">
                  Valden
                </h3>
                <p className="mt-[2px] truncate text-[13px] leading-[1.4] text-fg-muted lg:text-[16px]">
                  Agency
                </p>
              </div>
            </Link>
            <Link data-reveal href="/works/alvara-house" className="group relative w-[72vw] max-w-[280px] shrink-0 snap-start rounded-[6px] border border-fg/12 bg-bg/30 p-[6px] pb-3 backdrop-blur-[14px] sm:w-auto sm:max-w-none lg:rounded-[12px] lg:p-[10px] lg:pb-4">
              <span aria-hidden className="vv-shine vv-shine-lyr-a pointer-events-none absolute inset-0 rounded-[inherit] pointer-coarse:hidden" style={{ padding: 1, animationDuration: "2.8s", backgroundImage: "conic-gradient(from calc(var(--vv-shine-a) - var(--vv-shine-w, 24deg)), transparent 0deg, #0099FF calc(var(--vv-shine-w, 24deg) / 2), #7ACAFF var(--vv-shine-w, 24deg), transparent calc(var(--vv-shine-w, 24deg) * 2), transparent 360deg)", mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", maskComposite: "exclude", WebkitMaskComposite: "xor" }} />
              <span aria-hidden className="vv-shine vv-shine-lyr-b pointer-events-none absolute inset-0 rounded-[inherit] pointer-coarse:hidden" style={{ padding: 1, animationDuration: "2.8s", backgroundImage: "conic-gradient(from calc(var(--vv-shine-b) - var(--vv-shine-w, 24deg)), transparent 0deg, #0099FF calc(var(--vv-shine-w, 24deg) / 2), #7ACAFF var(--vv-shine-w, 24deg), transparent calc(var(--vv-shine-w, 24deg) * 2), transparent 360deg)", mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", maskComposite: "exclude", WebkitMaskComposite: "xor" }} />
              <div className="relative overflow-hidden rounded-[3px] bg-surface lg:rounded-[6px]" style={{ aspectRatio: "4 / 3" }}>
                <img src="/media/43a45f30543208de53ade25795bdc673.jpg" alt="Alvara House" className="absolute inset-x-0 top-0 w-full transition-[filter] duration-500 ease-brand group-hover:[filter:blur(7px)_brightness(0.62)]" loading="lazy" decoding="async" />
                <span className="pointer-events-none absolute inset-0 grid place-items-center opacity-0 transition-opacity duration-400 ease-brand group-hover:opacity-100">
                  <span className="vv-accent text-[clamp(20px,2vw,28px)] leading-none text-white">
                    View Project
                  </span>
                </span>
              </div>
              <div className="mt-3 pl-2 lg:mt-4 lg:pl-3">
                <h3 className="truncate font-display text-[16px] leading-[1.25] font-medium tracking-h3 lg:text-[20px]">
                  Alvara House
                </h3>
                <p className="mt-[2px] truncate text-[13px] leading-[1.4] text-fg-muted lg:text-[16px]">
                  Real Estate
                </p>
              </div>
            </Link>
            <Link data-reveal href="/works/devansh-portfolio" className="group relative w-[72vw] max-w-[280px] shrink-0 snap-start rounded-[6px] border border-fg/12 bg-bg/30 p-[6px] pb-3 backdrop-blur-[14px] sm:w-auto sm:max-w-none lg:rounded-[12px] lg:p-[10px] lg:pb-4">
              <span aria-hidden className="vv-shine vv-shine-lyr-a pointer-events-none absolute inset-0 rounded-[inherit] pointer-coarse:hidden" style={{ padding: 1, animationDuration: "2.8s", backgroundImage: "conic-gradient(from calc(var(--vv-shine-a) - var(--vv-shine-w, 24deg)), transparent 0deg, #0099FF calc(var(--vv-shine-w, 24deg) / 2), #7ACAFF var(--vv-shine-w, 24deg), transparent calc(var(--vv-shine-w, 24deg) * 2), transparent 360deg)", mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", maskComposite: "exclude", WebkitMaskComposite: "xor" }} />
              <span aria-hidden className="vv-shine vv-shine-lyr-b pointer-events-none absolute inset-0 rounded-[inherit] pointer-coarse:hidden" style={{ padding: 1, animationDuration: "2.8s", backgroundImage: "conic-gradient(from calc(var(--vv-shine-b) - var(--vv-shine-w, 24deg)), transparent 0deg, #0099FF calc(var(--vv-shine-w, 24deg) / 2), #7ACAFF var(--vv-shine-w, 24deg), transparent calc(var(--vv-shine-w, 24deg) * 2), transparent 360deg)", mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", maskComposite: "exclude", WebkitMaskComposite: "xor" }} />
              <div className="relative overflow-hidden rounded-[3px] bg-surface lg:rounded-[6px]" style={{ aspectRatio: "4 / 3" }}>
                <img src="/media/d1253efc356fd82a57c4040edb6c6900.jpg" alt="Devansh Portfolio" className="absolute inset-x-0 top-0 w-full transition-[filter] duration-500 ease-brand group-hover:[filter:blur(7px)_brightness(0.62)]" loading="lazy" decoding="async" />
                <span className="pointer-events-none absolute inset-0 grid place-items-center opacity-0 transition-opacity duration-400 ease-brand group-hover:opacity-100">
                  <span className="vv-accent text-[clamp(20px,2vw,28px)] leading-none text-white">
                    View Project
                  </span>
                </span>
              </div>
              <div className="mt-3 pl-2 lg:mt-4 lg:pl-3">
                <h3 className="truncate font-display text-[16px] leading-[1.25] font-medium tracking-h3 lg:text-[20px]">
                  Devansh Portfolio
                </h3>
                <p className="mt-[2px] truncate text-[13px] leading-[1.4] text-fg-muted lg:text-[16px]">
                  Creative
                </p>
              </div>
            </Link>
          </div>
        </RevealBatch>
      </main>
    </>
  );
}
