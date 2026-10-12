import HeadingReveal from '@/components/motion/HeadingReveal';
import Link from '@/components/Link';
import ParallaxDrift from '@/components/motion/ParallaxDrift';
import RevealBatch from '@/components/motion/RevealBatch';
import RollText from '@/components/RollText';
import WorkShots from '@/components/works/WorkShots';

// Converted 1:1 from the RSC payload of /works/devansh-portfolio.
export default function Page_works__devansh_portfolio() {
  return (
    <>
      <main className="relative isolate">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: "{\"@context\":\"https://schema.org\",\"@type\":\"CreativeWork\",\"name\":\"Devansh Portfolio\",\"description\":\"The Devansh Prakash portfolio website is a multi-disciplinary showcase built to highlight creativity and versatility across various design domains. Designed and developed from scratch, it embodies a dark, cinematic aesthetic that enhances visual storytelling while maintaining professional clarity. The site introduces a strong personal brand identity, establishing an immediate sense of expertise and modern craftsmanship. Each section is thoughtfully categorized — from website design and 3D modeling to video production and graphic design — allowing visitors to explore a wide range of projects with seamless navigation and fluid transitions. Dynamic project grids and subtle motion effects keep the browsing experience intuitive and visually appealing. The layout balances minimal design with impactful typography, ensuring every project stands out while maintaining a cohesive visual rhythm. Beyond aesthetics, the portfolio serves as a functional demonstration of Devansh’s technical and creative range — from interactive web layouts to product renderings and motion visuals. The site acts not only as a digital portfolio but as an evolving representation of creative progression, strategy, and precision-driven design.\",\"url\":\"https://visuvate.com/works/devansh-portfolio\",\"image\":[\"https://visuvate.com/_next/image?url=%2Fmedia%2Fd1253efc356fd82a57c4040edb6c6900.jpg&w=1200&q=80\"],\"creator\":{\"@id\":\"https://visuvate.com/#organization\"}}" }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: "{\"@context\":\"https://schema.org\",\"@type\":\"BreadcrumbList\",\"itemListElement\":[{\"@type\":\"ListItem\",\"position\":1,\"name\":\"Home\",\"item\":\"https://visuvate.com/\"},{\"@type\":\"ListItem\",\"position\":2,\"name\":\"Works\",\"item\":\"https://visuvate.com/works\"},{\"@type\":\"ListItem\",\"position\":3,\"name\":\"Devansh Portfolio\",\"item\":\"https://visuvate.com/works/devansh-portfolio\"}]}" }} />
        <header className="relative z-0 mx-auto max-w-[1425px] px-6 pt-[153px] md:px-8">
          <ParallaxDrift>
            <HeadingReveal>
              <h1 className="text-center font-display text-[clamp(72px,11vw,160px)] leading-[1] font-medium tracking-[-0.05em] will-change-transform">
                Devansh Portfolio
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
                  <div className="mt-3 text-[14px] leading-[1.6] text-fg-muted lg:mt-5 lg:text-lead lg:leading-[1.7] [&_a]:text-fg [&_a]:underline [&_li]:mt-2 [&_p]:mt-4 [&_strong]:text-fg [&_ul]:mt-4 [&_ul]:list-disc [&_ul]:pl-5" dangerouslySetInnerHTML={{ __html: "<p class=\"font_8\">Devansh Prakash’s portfolio website is a comprehensive showcase of creative expertise across web design, graphic design, video production, and 3D modeling. The site combines modern aesthetics, smooth interactions, and structured presentation for an engaging experience.</p>" }} />
                </div>
                <div className="flex flex-wrap items-end justify-start gap-3 lg:justify-end">
                  <Link href="/works" className="inline-flex items-center rounded-full border border-transparent bg-fg/15 px-[15px] py-[9px] text-[14px] leading-none font-medium transition-colors hover:bg-fg/25">
                    <RollText text="See all work" />
                  </Link>
                  <a href="https://www.devanshprakash.com" target="_blank" rel="noreferrer" className="inline-flex items-center rounded-full border border-transparent bg-fg px-[15px] py-[9px] text-[14px] leading-none font-medium text-bg transition-colors hover:bg-fg-strong">
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
                    Creative
                  </dd>
                  <span aria-hidden className="order-1 text-fg">
                    <img src="/media/65afe60d0d06f1e93094a674afcfc2c6.svg" alt="" className="size-[18px] vv-platform-logo object-contain" loading="lazy" decoding="async" />
                  </span>
                </div>
                <div className="flex flex-col items-center text-center hidden sm:flex">
                  <dt className="order-3 mt-1.5 text-[14px] leading-[1.2] text-fg-subtle">
                    Created
                  </dt>
                  <dd className="order-2 mt-3 text-[15px] leading-[1.2] font-medium text-fg">
                    {2025}
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
                    Wix Studio
                  </dd>
                  <span aria-hidden className="order-1 text-fg">
                    <img src="/media/12f174fbe6106094af5b31e0042943c2.png" alt="" className="size-[18px] vv-platform-logo object-contain" loading="lazy" decoding="async" />
                  </span>
                </div>
              </dl>
              <WorkShots shots={[{ id: 260, src: "/media/6944e2fc4dadaa6fede07bd55f948e0e.jpg", title: "Hero.jpeg" }, { id: 261, src: "/media/96f21015c28614235310da0a3bfdecac.png", title: "About.png" }, { id: 262, src: "/media/7eb8c07da6034ed8888226a0cbad2a36.jpg", title: "Websites.jpeg" }, { id: 263, src: "/media/c3503d923131c93795fb9eb810bf9d56.jpg", title: "Graphics.jpeg" }, { id: 264, src: "/media/34c37d3d106569a41c5f9fa71e08bd88.jpg", title: "Video.jpeg" }, { id: 265, src: "/media/e14b0a9a8872807055345327116ed0f0.jpg", title: "3dDesign.jpeg" }, { id: 266, src: "/media/7c59c5c82c692429ccd2eb758e7aa034.jpg", title: "Blogs.jpeg" }, { id: 267, src: "/media/3152b09b164fbd698ea288594568001a.png", title: "Contact.png" }]} alt="Devansh Portfolio" />
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
                  A multi-disciplinary creative — web design, graphic design, video, 3D — needed one portfolio that didn’t read as four stapled together. The risk with range is incoherence: the site had to prove versatility while feeling like the work of a single, decided sensibility.
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
                  We gave every discipline the same architectural treatment: one grid, one typographic system, one rhythm of reveal — so a 3D render and a brand identity sit side by side as equals. A CMS keeps all four streams publishable, and custom-coded interactions add the layer of craft the work itself promises.
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
                  The portfolio now argues for hiring the person, not just a skill. Visitors can enter through any discipline and leave understanding the whole practice, and the site grows with each new project without diluting its point of view.
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
              <div className="mt-3 text-[14px] leading-[1.6] text-fg-muted lg:mt-5 lg:text-lead lg:leading-[1.7] [&_a]:text-fg [&_a]:underline [&_li]:mt-2 [&_p]:mt-5 [&_strong]:text-fg [&_ul]:mt-4 [&_ul]:list-disc [&_ul]:pl-5" dangerouslySetInnerHTML={{ __html: "<p>The Devansh Prakash portfolio website is a multi-disciplinary showcase built to highlight creativity and versatility across various design domains. Designed and developed from scratch, it embodies a dark, cinematic aesthetic that enhances visual storytelling while maintaining professional clarity.</p>\n\n<p>The site introduces a strong personal brand identity, establishing an immediate sense of expertise and modern craftsmanship. Each section is thoughtfully categorized — from website design and 3D modeling to video production and graphic design — allowing visitors to explore a wide range of projects with seamless navigation and fluid transitions.</p>\n\n<p>Dynamic project grids and subtle motion effects keep the browsing experience intuitive and visually appealing. The layout balances minimal design with impactful typography, ensuring every project stands out while maintaining a cohesive visual rhythm.</p>\n\n<p>Beyond aesthetics, the portfolio serves as a functional demonstration of Devansh’s technical and creative range — from interactive web layouts to product renderings and motion visuals. The site acts not only as a digital portfolio but as an evolving representation of creative progression, strategy, and precision-driven design.</p>" }} />
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
                    <img src="/media/fcb525f05120c06db57182579bbd2582.svg" alt="" className="vv-service-icon size-4 shrink-0" loading="lazy" decoding="async" />
                    Projects
                  </li>
                  <li className="flex items-center gap-2.5 text-[15px] text-fg-muted">
                    <img src="/media/497607ca300b88b0b7372af23aa05e68.svg" alt="" className="vv-service-icon size-4 shrink-0" loading="lazy" decoding="async" />
                    Blogs
                  </li>
                  <li className="flex items-center gap-2.5 text-[15px] text-fg-muted">
                    <img src="/media/b73b885627885c3dd11a14cd42e789a6.svg" alt="" className="vv-service-icon size-4 shrink-0" loading="lazy" decoding="async" />
                    Posts
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
                    <img src="/media/497607ca300b88b0b7372af23aa05e68.svg" alt="" className="vv-service-icon size-4 shrink-0" loading="lazy" decoding="async" />
                    Blog
                  </li>
                  <li className="flex items-center gap-2.5 text-[15px] text-fg-muted">
                    <img src="/media/62b050a9d9aaf0218617f03fefa2d8ef.svg" alt="" className="vv-service-icon size-4 shrink-0" loading="lazy" decoding="async" />
                    Custom Code
                  </li>
                  <li className="flex items-center gap-2.5 text-[15px] text-fg-muted">
                    <img src="/media/a7f4303486270490068cb1479148a585.svg" alt="" className="vv-service-icon size-4 shrink-0" loading="lazy" decoding="async" />
                    CMS
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
            <Link data-reveal href="/works/wrenmoor-heath" className="group relative w-[72vw] max-w-[280px] shrink-0 snap-start rounded-[6px] border border-fg/12 bg-bg/30 p-[6px] pb-3 backdrop-blur-[14px] sm:w-auto sm:max-w-none lg:rounded-[12px] lg:p-[10px] lg:pb-4">
              <span aria-hidden className="vv-shine vv-shine-lyr-a pointer-events-none absolute inset-0 rounded-[inherit] pointer-coarse:hidden" style={{ padding: 1, animationDuration: "2.8s", backgroundImage: "conic-gradient(from calc(var(--vv-shine-a) - var(--vv-shine-w, 24deg)), transparent 0deg, #0099FF calc(var(--vv-shine-w, 24deg) / 2), #7ACAFF var(--vv-shine-w, 24deg), transparent calc(var(--vv-shine-w, 24deg) * 2), transparent 360deg)", mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", maskComposite: "exclude", WebkitMaskComposite: "xor" }} />
              <span aria-hidden className="vv-shine vv-shine-lyr-b pointer-events-none absolute inset-0 rounded-[inherit] pointer-coarse:hidden" style={{ padding: 1, animationDuration: "2.8s", backgroundImage: "conic-gradient(from calc(var(--vv-shine-b) - var(--vv-shine-w, 24deg)), transparent 0deg, #0099FF calc(var(--vv-shine-w, 24deg) / 2), #7ACAFF var(--vv-shine-w, 24deg), transparent calc(var(--vv-shine-w, 24deg) * 2), transparent 360deg)", mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", maskComposite: "exclude", WebkitMaskComposite: "xor" }} />
              <div className="relative overflow-hidden rounded-[3px] bg-surface lg:rounded-[6px]" style={{ aspectRatio: "4 / 3" }}>
                <img src="/media/93d9ff71e8d770563f89acba46eca4ad.jpg" alt="Wrenmoor Heath" className="absolute inset-x-0 top-0 w-full transition-[filter] duration-500 ease-brand group-hover:[filter:blur(7px)_brightness(0.62)]" loading="lazy" decoding="async" />
                <span className="pointer-events-none absolute inset-0 grid place-items-center opacity-0 transition-opacity duration-400 ease-brand group-hover:opacity-100">
                  <span className="vv-accent text-[clamp(20px,2vw,28px)] leading-none text-white">
                    View Project
                  </span>
                </span>
              </div>
              <div className="mt-3 pl-2 lg:mt-4 lg:pl-3">
                <h3 className="truncate font-display text-[16px] leading-[1.25] font-medium tracking-h3 lg:text-[20px]">
                  Wrenmoor Heath
                </h3>
                <p className="mt-[2px] truncate text-[13px] leading-[1.4] text-fg-muted lg:text-[16px]">
                  Sports
                </p>
              </div>
            </Link>
            <Link data-reveal href="/works/ellery-kowal" className="group relative w-[72vw] max-w-[280px] shrink-0 snap-start rounded-[6px] border border-fg/12 bg-bg/30 p-[6px] pb-3 backdrop-blur-[14px] sm:w-auto sm:max-w-none lg:rounded-[12px] lg:p-[10px] lg:pb-4">
              <span aria-hidden className="vv-shine vv-shine-lyr-a pointer-events-none absolute inset-0 rounded-[inherit] pointer-coarse:hidden" style={{ padding: 1, animationDuration: "2.8s", backgroundImage: "conic-gradient(from calc(var(--vv-shine-a) - var(--vv-shine-w, 24deg)), transparent 0deg, #0099FF calc(var(--vv-shine-w, 24deg) / 2), #7ACAFF var(--vv-shine-w, 24deg), transparent calc(var(--vv-shine-w, 24deg) * 2), transparent 360deg)", mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", maskComposite: "exclude", WebkitMaskComposite: "xor" }} />
              <span aria-hidden className="vv-shine vv-shine-lyr-b pointer-events-none absolute inset-0 rounded-[inherit] pointer-coarse:hidden" style={{ padding: 1, animationDuration: "2.8s", backgroundImage: "conic-gradient(from calc(var(--vv-shine-b) - var(--vv-shine-w, 24deg)), transparent 0deg, #0099FF calc(var(--vv-shine-w, 24deg) / 2), #7ACAFF var(--vv-shine-w, 24deg), transparent calc(var(--vv-shine-w, 24deg) * 2), transparent 360deg)", mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", maskComposite: "exclude", WebkitMaskComposite: "xor" }} />
              <div className="relative overflow-hidden rounded-[3px] bg-surface lg:rounded-[6px]" style={{ aspectRatio: "4 / 3" }}>
                <img src="/media/e939665a2da8212ca0f1667b5c552c51.jpg" alt="Ellery Kowal" className="absolute inset-x-0 top-0 w-full transition-[filter] duration-500 ease-brand group-hover:[filter:blur(7px)_brightness(0.62)]" loading="lazy" decoding="async" />
                <span className="pointer-events-none absolute inset-0 grid place-items-center opacity-0 transition-opacity duration-400 ease-brand group-hover:opacity-100">
                  <span className="vv-accent text-[clamp(20px,2vw,28px)] leading-none text-white">
                    View Project
                  </span>
                </span>
              </div>
              <div className="mt-3 pl-2 lg:mt-4 lg:pl-3">
                <h3 className="truncate font-display text-[16px] leading-[1.25] font-medium tracking-h3 lg:text-[20px]">
                  Ellery Kowal
                </h3>
                <p className="mt-[2px] truncate text-[13px] leading-[1.4] text-fg-muted lg:text-[16px]">
                  Legal
                </p>
              </div>
            </Link>
            <Link data-reveal href="/works/avara" className="group relative w-[72vw] max-w-[280px] shrink-0 snap-start rounded-[6px] border border-fg/12 bg-bg/30 p-[6px] pb-3 backdrop-blur-[14px] sm:w-auto sm:max-w-none lg:rounded-[12px] lg:p-[10px] lg:pb-4">
              <span aria-hidden className="vv-shine vv-shine-lyr-a pointer-events-none absolute inset-0 rounded-[inherit] pointer-coarse:hidden" style={{ padding: 1, animationDuration: "2.8s", backgroundImage: "conic-gradient(from calc(var(--vv-shine-a) - var(--vv-shine-w, 24deg)), transparent 0deg, #0099FF calc(var(--vv-shine-w, 24deg) / 2), #7ACAFF var(--vv-shine-w, 24deg), transparent calc(var(--vv-shine-w, 24deg) * 2), transparent 360deg)", mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", maskComposite: "exclude", WebkitMaskComposite: "xor" }} />
              <span aria-hidden className="vv-shine vv-shine-lyr-b pointer-events-none absolute inset-0 rounded-[inherit] pointer-coarse:hidden" style={{ padding: 1, animationDuration: "2.8s", backgroundImage: "conic-gradient(from calc(var(--vv-shine-b) - var(--vv-shine-w, 24deg)), transparent 0deg, #0099FF calc(var(--vv-shine-w, 24deg) / 2), #7ACAFF var(--vv-shine-w, 24deg), transparent calc(var(--vv-shine-w, 24deg) * 2), transparent 360deg)", mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", maskComposite: "exclude", WebkitMaskComposite: "xor" }} />
              <div className="relative overflow-hidden rounded-[3px] bg-surface lg:rounded-[6px]" style={{ aspectRatio: "4 / 3" }}>
                <img src="/media/cc006c5370888cd2c9322a58fa0c6c8e.jpg" alt="Avara" className="absolute inset-x-0 top-0 w-full transition-[filter] duration-500 ease-brand group-hover:[filter:blur(7px)_brightness(0.62)]" loading="lazy" decoding="async" />
                <span className="pointer-events-none absolute inset-0 grid place-items-center opacity-0 transition-opacity duration-400 ease-brand group-hover:opacity-100">
                  <span className="vv-accent text-[clamp(20px,2vw,28px)] leading-none text-white">
                    View Project
                  </span>
                </span>
              </div>
              <div className="mt-3 pl-2 lg:mt-4 lg:pl-3">
                <h3 className="truncate font-display text-[16px] leading-[1.25] font-medium tracking-h3 lg:text-[20px]">
                  Avara
                </h3>
                <p className="mt-[2px] truncate text-[13px] leading-[1.4] text-fg-muted lg:text-[16px]">
                  Fitness
                </p>
              </div>
            </Link>
          </div>
        </RevealBatch>
      </main>
    </>
  );
}
