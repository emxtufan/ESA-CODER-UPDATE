import ArticleCodeBlocks from '@/components/blog/ArticleCodeBlocks';
import ArticleLightbox from '@/components/blog/ArticleLightbox';
import HeadingReveal from '@/components/motion/HeadingReveal';
import Link from '@/components/Link';
import ParallaxDrift from '@/components/motion/ParallaxDrift';
import RevealBatch from '@/components/motion/RevealBatch';
import RollText from '@/components/RollText';

// Converted 1:1 from the RSC payload of /blog/smooth-scroll-in-a-wix-website.
export default function Page_blog__smooth_scroll_in_a_wix_website() {
  return (
    <>
      <main className="relative isolate">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: "{\"@context\":\"https://schema.org\",\"@type\":\"BlogPosting\",\"headline\":\"How to Add Smooth Scroll in a Wix Website\",\"description\":\"Adding smooth scrolling to your Wix website enhances user experience by creating a fluid and polished transition between scroll actions. In this guide, we will implement smooth scrolling using Lenis , a lightweight JavaScript library for smooth page scrolling. Requirements A Wix Premium Plan  (Custom code functionality is only available in premium plans). Smooth Scroll in a Wix Website Guide Step 1: Adding the Custom Code To enable smooth scrolling, we will use Lenis.js . Below is the custom...\",\"url\":\"https://visuvate.com/blog/smooth-scroll-in-a-wix-website\",\"mainEntityOfPage\":\"https://visuvate.com/blog/smooth-scroll-in-a-wix-website\",\"image\":[\"https://visuvate.com/_next/image?url=%2Fmedia%2F78ab2a87ac838db6bd9c1b6d891a8b6e.jpg&w=1200&q=80\"],\"datePublished\":\"2025-02-01T00:00:00.000Z\",\"author\":{\"@type\":\"Organization\",\"name\":\"Visuvate\",\"url\":\"https://visuvate.com\"},\"publisher\":{\"@id\":\"https://visuvate.com/#organization\"}}" }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: "{\"@context\":\"https://schema.org\",\"@type\":\"BreadcrumbList\",\"itemListElement\":[{\"@type\":\"ListItem\",\"position\":1,\"name\":\"Home\",\"item\":\"https://visuvate.com/\"},{\"@type\":\"ListItem\",\"position\":2,\"name\":\"Blog\",\"item\":\"https://visuvate.com/blog\"},{\"@type\":\"ListItem\",\"position\":3,\"name\":\"Wix Studio\",\"item\":\"https://visuvate.com/blog/category/wix-studio\"},{\"@type\":\"ListItem\",\"position\":4,\"name\":\"How to Add Smooth Scroll in a Wix Website\",\"item\":\"https://visuvate.com/blog/smooth-scroll-in-a-wix-website\"}]}" }} />
        <header className="relative">
          <ParallaxDrift drift={185} className="mx-auto max-w-[964px] px-6 pt-[96px] md:px-8 md:pt-[153px]">
            <HeadingReveal>
              <h1 className="text-center font-display text-[clamp(38px,5vw,72px)] leading-[1] font-medium tracking-[-0.05em] will-change-transform">
                How to Add Smooth Scroll in a Wix Website
              </h1>
            </HeadingReveal>
          </ParallaxDrift>
          <div className="relative z-10 mx-auto mt-[28px] max-w-[1182px] px-6 md:px-8">
            <div className="relative rounded-[20px] p-2 backdrop-blur-[10px]" style={{ background: "color-mix(in srgb, var(--vv-bg) 80%, transparent)" }}>
              <span aria-hidden className="pointer-events-none absolute top-0 left-1/2 h-px w-[600px] max-w-full -translate-x-1/2" style={{ background: "linear-gradient(90deg, transparent 0%, var(--vv-card-line) 50%, transparent 100%)" }} />
              <span aria-hidden className="pointer-events-none absolute inset-0 rounded-[20px]" style={{ background: "radial-gradient(58% 46% at 50% 0%, var(--vv-card-lift) 0%, var(--vv-card-lift-mid) 45%, transparent 78%)" }} />
              <img src="/media/78ab2a87ac838db6bd9c1b6d891a8b6e.jpg" alt="How to Add Smooth Scroll in a Wix Website" className="relative block w-full rounded-[12px]" style={{ aspectRatio: "1102 / 620", objectFit: "cover" }} decoding="async" />
            </div>
          </div>
        </header>
        <article className="article mt-[65px] pb-[82px]" dangerouslySetInnerHTML={{ __html: "<blockquote><p>Adding smooth scrolling to your Wix website enhances user experience by creating a fluid and polished transition between scroll actions. </p></blockquote><p>In this guide, we will implement smooth scrolling using <strong>Lenis</strong>, a lightweight JavaScript library for smooth page scrolling.</p><p><strong>Requirements</strong></p><ul><li>A <strong>Wix Premium Plan</strong>&nbsp;(Custom code functionality is only available in premium plans).</li></ul><hr><h2><u>Smooth Scroll in a Wix Website Guide</u></h2><h3>Step 1: Adding the Custom Code</h3><p>To enable smooth scrolling, we will use <strong>Lenis.js</strong>. Below is the custom code you need to add to your Wix website:</p><pre>&lt;script src=\"https://unpkg.com/@studio-freight/lenis@1.0.42/dist/lenis.min.js\"&gt;&lt;/script&gt;<br><br>&lt;style&gt;<br><br>/* Ensure the page height is correctly set for Lenis */<br><br>html.lenis, html.lenis body {<br><br>height: auto;<br><br>}<br><br>/* Override default scroll behavior */<br><br>.lenis.lenis-smooth {<br><br>scroll-behavior: auto !important;<br><br>}<br><br>/* Prevent scrolling when necessary */<br><br>.lenis.lenis-stopped {<br><br>overflow: hidden;<br><br>}<br><br>&lt;/style&gt;<br><br>&lt;script&gt;<br><br>// Initialize Lenis with smooth scrolling configuration<br><br>const lenis = new Lenis({<br><br>lerp: 0.1, // Damping effect for smoothness<br><br>wheelMultiplier: 0.7, // Adjust scroll speed<br><br>gestureOrientation: 'vertical', // Enable vertical scrolling<br><br>normalizeWheel: false, // Preserve native wheel behavior<br><br>smoothTouch: false // Disable smooth scrolling for touch devices<br><br>});<br><br>// Animation frame loop to keep Lenis active<br><br>function raf(time) {<br><br>lenis.raf(time);<br><br>requestAnimationFrame(raf);<br><br>}<br><br>requestAnimationFrame(raf);<br><br>&lt;/script&gt;<br></pre><hr><figure data-gallery=\"\"><img src=\"/media/afd65dc8986f7f1ee7978d57290a33a4.png\" width=\"2198\" height=\"1694\" alt=\"Site Dashboard\" loading=\"lazy\"><img src=\"/media/5a1cece6c380b302551e497dfbdeb0ba.png\" width=\"1860\" height=\"1580\" alt=\"Custom Code Collection\" loading=\"lazy\"><img src=\"/media/e457f7c6435c9946787491f718e54128.png\" width=\"1388\" height=\"1541\" alt=\"Custom Code Property\" loading=\"lazy\"></figure><h3>Step 2: Implementing the Code in Wix Studio</h3><p>Follow these steps to add the custom code to your Wix website:</p><ol><li><strong>Go to your Wix Studio dashboard</strong>.</li><li>On the bottom-left, click <strong>Settings</strong>.</li><li>In <strong>Settings</strong>, search or scroll down to find <strong>Custom Code</strong>.</li><li>Click <strong>Add Custom Code</strong>.</li><li><p>In the pop-up panel:</p><ul><li>Paste the custom code in the <strong>\"Paste the code snippet here:\"</strong>&nbsp;box.</li><li>Give it a recognizable name like <strong>\"Smooth Scroll\"</strong>.</li><li>Apply the code to <strong>all pages</strong>.</li><li>Set the placement to <strong>Head</strong>.</li></ul></li><li>Click <strong>Apply</strong>.</li></ol><hr><h3>Step 3: Testing the Smooth Scroll Effect</h3><ul><li>Refresh your <strong>published</strong>&nbsp;website to activate the smooth scrolling effect.</li><li>Scroll up and down to experience the <strong>fluid transition</strong>.</li><li>If you want to <strong>adjust the smoothness</strong>, modify the lerp&nbsp;and wheelMultiplier&nbsp;values in the script.</li></ul><hr><h4>Credits</h4><ul><li><strong>Lenis.js</strong>&nbsp;developed by <a href=\"https://github.com/studio-freight/lenis\" target=\"_blank\" rel=\"noreferrer\">Studio Freight</a></li></ul><h4>Conclusion</h4><p>Adding <strong>smooth scrolling to a Wix website</strong>&nbsp;significantly improves the user experience, giving it a professional touch. Following this guide, you can effortlessly integrate <strong>Lenis.js</strong>&nbsp;and achieve a seamless scrolling effect on your Wix site.</p><p>It is a small polish detail, and exactly the kind of thing our <a href=\"/services/motion-and-interaction-design\">Motion &amp; Interaction Design service </a>builds into client sites by default.</p>" }} />
        <ArticleCodeBlocks />
        <ArticleLightbox />
        <div className="mx-auto max-w-[964px] px-6 pb-[90px] md:px-8">
          <div className="flex flex-wrap items-center gap-3 border-t pt-6" style={{ borderColor: "var(--vv-card-line)" }}>
            <span className="text-[14px] text-fg-subtle">
              Filed under
            </span>
            <Link href="/blog/category/wix-studio" className="inline-flex h-[34px] items-center rounded-full border border-line bg-bg px-4 text-[15px] leading-none font-medium text-fg-muted transition-colors hover:border-line-strong hover:text-fg">
              <RollText text="Wix Studio" />
            </Link>
          </div>
        </div>
        <section className="mx-auto max-w-[1400px] px-6 pb-[130px] md:px-8">
          <div className="mb-[35px] flex items-end justify-between gap-6">
            <h2 className="font-display text-[24px] leading-[1.1] font-medium tracking-[-0.02em]">
              More Blogs
            </h2>
            <Link href="/blog" className="inline-flex h-[38px] shrink-0 items-center rounded-full bg-fg/15 px-5 text-[14px] font-medium transition-colors hover:bg-fg/25">
              <RollText text="All Blogs" />
            </Link>
          </div>
          <RevealBatch className="grid gap-[27px] sm:grid-cols-2 lg:grid-cols-3">
            <Link data-reveal href="/blog/smart-animated-counters-in-wix-studio" className="group relative rounded-[12px] border border-fg/20 bg-bg/30 p-3 pb-5 backdrop-blur-[14px]">
              <span aria-hidden className="vv-shine vv-shine-lyr-a pointer-events-none absolute inset-0 rounded-[inherit] pointer-coarse:hidden" style={{ padding: 1, animationDuration: "2.8s", backgroundImage: "conic-gradient(from calc(var(--vv-shine-a) - var(--vv-shine-w, 24deg)), transparent 0deg, #0099FF calc(var(--vv-shine-w, 24deg) / 2), #7ACAFF var(--vv-shine-w, 24deg), transparent calc(var(--vv-shine-w, 24deg) * 2), transparent 360deg)", mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", maskComposite: "exclude", WebkitMaskComposite: "xor" }} />
              <span aria-hidden className="vv-shine vv-shine-lyr-b pointer-events-none absolute inset-0 rounded-[inherit] pointer-coarse:hidden" style={{ padding: 1, animationDuration: "2.8s", backgroundImage: "conic-gradient(from calc(var(--vv-shine-b) - var(--vv-shine-w, 24deg)), transparent 0deg, #0099FF calc(var(--vv-shine-w, 24deg) / 2), #7ACAFF var(--vv-shine-w, 24deg), transparent calc(var(--vv-shine-w, 24deg) * 2), transparent 360deg)", mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", maskComposite: "exclude", WebkitMaskComposite: "xor" }} />
              <div className="relative overflow-hidden rounded-[8px] bg-surface" style={{ aspectRatio: "408 / 229" }}>
                <img src="/media/3990486d63ac121ae76e45c695fb18ca.jpg" alt="Smart Animated Counters in Wix Studio" className="absolute inset-0 size-full object-cover transition-[filter] duration-500 ease-brand group-hover:[filter:blur(7px)_brightness(0.62)]" loading="lazy" decoding="async" />
                <span className="pointer-events-none absolute inset-0 grid place-items-center opacity-0 transition-opacity duration-400 ease-brand group-hover:opacity-100">
                  <span className="vv-accent text-[32px] leading-none text-white">
                    Read post
                  </span>
                </span>
              </div>
              <p className="mt-[27px] px-2 text-[14px] leading-[1] text-fg-subtle">
                10 Jan 2026
              </p>
              <h3 className="mt-[12px] px-2 font-display text-[24px] leading-[1.2] font-medium tracking-h3">
                Smart Animated Counters in Wix Studio
              </h3>
              <p className="mt-[8px] line-clamp-2 px-2 text-[16px] leading-[1.4] text-fg-subtle">
                {"Learn how to add smart animated number counters to your Wix Studio site. This step-by-step guide provides a copy-and-paste Velo code snippet that automatically handles complex formats, such as 10k, $500, or 98% satisfaction."}
              </p>
            </Link>
            <Link data-reveal href="/blog/wix-studio-preloader-animation" className="group relative rounded-[12px] border border-fg/20 bg-bg/30 p-3 pb-5 backdrop-blur-[14px]">
              <span aria-hidden className="vv-shine vv-shine-lyr-a pointer-events-none absolute inset-0 rounded-[inherit] pointer-coarse:hidden" style={{ padding: 1, animationDuration: "2.8s", backgroundImage: "conic-gradient(from calc(var(--vv-shine-a) - var(--vv-shine-w, 24deg)), transparent 0deg, #0099FF calc(var(--vv-shine-w, 24deg) / 2), #7ACAFF var(--vv-shine-w, 24deg), transparent calc(var(--vv-shine-w, 24deg) * 2), transparent 360deg)", mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", maskComposite: "exclude", WebkitMaskComposite: "xor" }} />
              <span aria-hidden className="vv-shine vv-shine-lyr-b pointer-events-none absolute inset-0 rounded-[inherit] pointer-coarse:hidden" style={{ padding: 1, animationDuration: "2.8s", backgroundImage: "conic-gradient(from calc(var(--vv-shine-b) - var(--vv-shine-w, 24deg)), transparent 0deg, #0099FF calc(var(--vv-shine-w, 24deg) / 2), #7ACAFF var(--vv-shine-w, 24deg), transparent calc(var(--vv-shine-w, 24deg) * 2), transparent 360deg)", mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", maskComposite: "exclude", WebkitMaskComposite: "xor" }} />
              <div className="relative overflow-hidden rounded-[8px] bg-surface" style={{ aspectRatio: "408 / 229" }}>
                <img src="/media/152053cbd17ef12217ebd90970bdeeab.jpg" alt="Smooth Wix Studio Preloader Animation" className="absolute inset-0 size-full object-cover transition-[filter] duration-500 ease-brand group-hover:[filter:blur(7px)_brightness(0.62)]" loading="lazy" decoding="async" />
                <span className="pointer-events-none absolute inset-0 grid place-items-center opacity-0 transition-opacity duration-400 ease-brand group-hover:opacity-100">
                  <span className="vv-accent text-[32px] leading-none text-white">
                    Read post
                  </span>
                </span>
              </div>
              <p className="mt-[27px] px-2 text-[14px] leading-[1] text-fg-subtle">
                29 Jan 2025
              </p>
              <h3 className="mt-[12px] px-2 font-display text-[24px] leading-[1.2] font-medium tracking-h3">
                Smooth Wix Studio Preloader Animation
              </h3>
              <p className="mt-[8px] line-clamp-2 px-2 text-[16px] leading-[1.4] text-fg-subtle">
                Learn how to add a smooth page loading animation in Wix Studio using a preloader, custom code, and loop videos for a seamless transition.
              </p>
            </Link>
            <Link data-reveal href="/blog/smart-theme-switch-framer-component" className="group relative rounded-[12px] border border-fg/20 bg-bg/30 p-3 pb-5 backdrop-blur-[14px]">
              <span aria-hidden className="vv-shine vv-shine-lyr-a pointer-events-none absolute inset-0 rounded-[inherit] pointer-coarse:hidden" style={{ padding: 1, animationDuration: "2.8s", backgroundImage: "conic-gradient(from calc(var(--vv-shine-a) - var(--vv-shine-w, 24deg)), transparent 0deg, #0099FF calc(var(--vv-shine-w, 24deg) / 2), #7ACAFF var(--vv-shine-w, 24deg), transparent calc(var(--vv-shine-w, 24deg) * 2), transparent 360deg)", mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", maskComposite: "exclude", WebkitMaskComposite: "xor" }} />
              <span aria-hidden className="vv-shine vv-shine-lyr-b pointer-events-none absolute inset-0 rounded-[inherit] pointer-coarse:hidden" style={{ padding: 1, animationDuration: "2.8s", backgroundImage: "conic-gradient(from calc(var(--vv-shine-b) - var(--vv-shine-w, 24deg)), transparent 0deg, #0099FF calc(var(--vv-shine-w, 24deg) / 2), #7ACAFF var(--vv-shine-w, 24deg), transparent calc(var(--vv-shine-w, 24deg) * 2), transparent 360deg)", mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", maskComposite: "exclude", WebkitMaskComposite: "xor" }} />
              <div className="relative overflow-hidden rounded-[8px] bg-surface" style={{ aspectRatio: "408 / 229" }}>
                <img src="/media/fa82d0ba7b07aeb6f52d002c58a4b803.png" alt="Smart Theme Switch ~ Framer Component" className="absolute inset-0 size-full object-cover transition-[filter] duration-500 ease-brand group-hover:[filter:blur(7px)_brightness(0.62)]" loading="lazy" decoding="async" />
                <span className="pointer-events-none absolute inset-0 grid place-items-center opacity-0 transition-opacity duration-400 ease-brand group-hover:opacity-100">
                  <span className="vv-accent text-[32px] leading-none text-white">
                    Read post
                  </span>
                </span>
              </div>
              <p className="mt-[27px] px-2 text-[14px] leading-[1] text-fg-subtle">
                10 Jul 2026
              </p>
              <h3 className="mt-[12px] px-2 font-display text-[24px] leading-[1.2] font-medium tracking-h3">
                {"Smart Theme Switch ~ Framer Component"}
              </h3>
              <p className="mt-[8px] line-clamp-2 px-2 text-[16px] leading-[1.4] text-fg-subtle">
                One-tap light and dark mode for any Framer site — flips the whole page, remembers the visitor's choice, and works with your existing Color Styles.
              </p>
            </Link>
          </RevealBatch>
        </section>
      </main>
    </>
  );
}
