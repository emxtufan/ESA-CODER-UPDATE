import ArticleCodeBlocks from '@/components/blog/ArticleCodeBlocks';
import ArticleLightbox from '@/components/blog/ArticleLightbox';
import HeadingReveal from '@/components/motion/HeadingReveal';
import Link from '@/components/Link';
import ParallaxDrift from '@/components/motion/ParallaxDrift';
import RevealBatch from '@/components/motion/RevealBatch';
import RollText from '@/components/RollText';

// Converted 1:1 from the RSC payload of /blog/smart-theme-switch-framer-component.
export default function Page_blog__smart_theme_switch_framer_component() {
  return (
    <>
      <main className="relative isolate">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: "{\"@context\":\"https://schema.org\",\"@type\":\"BlogPosting\",\"headline\":\"Smart Theme Switch ~ Framer Component\",\"description\":\"One-tap light and dark mode for any Framer site — flips the whole page, remembers the visitor's choice, and works with your existing Color Styles.\",\"url\":\"https://visuvate.com/blog/smart-theme-switch-framer-component\",\"mainEntityOfPage\":\"https://visuvate.com/blog/smart-theme-switch-framer-component\",\"image\":[\"https://visuvate.com/_next/image?url=%2Fmedia%2Ffa82d0ba7b07aeb6f52d002c58a4b803.png&w=1200&q=80\"],\"datePublished\":\"2026-07-10T00:00:00.000Z\",\"author\":{\"@type\":\"Organization\",\"name\":\"Visuvate\",\"url\":\"https://visuvate.com\"},\"publisher\":{\"@id\":\"https://visuvate.com/#organization\"}}" }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: "{\"@context\":\"https://schema.org\",\"@type\":\"BreadcrumbList\",\"itemListElement\":[{\"@type\":\"ListItem\",\"position\":1,\"name\":\"Home\",\"item\":\"https://visuvate.com/\"},{\"@type\":\"ListItem\",\"position\":2,\"name\":\"Blog\",\"item\":\"https://visuvate.com/blog\"},{\"@type\":\"ListItem\",\"position\":3,\"name\":\"Framer\",\"item\":\"https://visuvate.com/blog/category/framer\"},{\"@type\":\"ListItem\",\"position\":4,\"name\":\"Smart Theme Switch ~ Framer Component\",\"item\":\"https://visuvate.com/blog/smart-theme-switch-framer-component\"}]}" }} />
        <header className="relative">
          <ParallaxDrift drift={185} className="mx-auto max-w-[964px] px-6 pt-[96px] md:px-8 md:pt-[153px]">
            <HeadingReveal>
              <h1 className="text-center font-display text-[clamp(38px,5vw,72px)] leading-[1] font-medium tracking-[-0.05em] will-change-transform">
                {"Smart Theme Switch ~ Framer Component"}
              </h1>
            </HeadingReveal>
          </ParallaxDrift>
          <div className="relative z-10 mx-auto mt-[28px] max-w-[1182px] px-6 md:px-8">
            <div className="relative rounded-[20px] p-2 backdrop-blur-[10px]" style={{ background: "color-mix(in srgb, var(--vv-bg) 80%, transparent)" }}>
              <span aria-hidden className="pointer-events-none absolute top-0 left-1/2 h-px w-[600px] max-w-full -translate-x-1/2" style={{ background: "linear-gradient(90deg, transparent 0%, var(--vv-card-line) 50%, transparent 100%)" }} />
              <span aria-hidden className="pointer-events-none absolute inset-0 rounded-[20px]" style={{ background: "radial-gradient(58% 46% at 50% 0%, var(--vv-card-lift) 0%, var(--vv-card-lift-mid) 45%, transparent 78%)" }} />
              <img src="/media/fa82d0ba7b07aeb6f52d002c58a4b803.png" alt="Smart Theme Switch ~ Framer Component" className="relative block w-full rounded-[12px]" style={{ aspectRatio: "1102 / 620", objectFit: "cover" }} decoding="async" />
            </div>
          </div>
        </header>
        <article className="article mt-[65px] pb-[82px]" dangerouslySetInnerHTML={{ __html: "<h2><strong>Smart Theme Switch – Add Light &amp; Dark Mode to Any Framer Site</strong></h2><p>Smart Theme Switch is a Framer code component that adds a one-tap light and dark mode toggle to your site. It flips every page instantly, remembers each visitor's choice, and works with your existing Framer Color Styles automatically. No custom code, no duplicated styles, no flash of the wrong theme.</p><p><br></p><p data-cta=\"\"><a href=\"https://framer.link/EutEnUE\" target=\"_blank\" rel=\"noreferrer\" data-button=\"\">Get component</a></p><h3><strong>What Smart Theme Switch Does</strong></h3><p>Framer already lets you design light and dark variants of your Color Styles, but by default a visitor only ever sees the version that matches their device. There is no built-in way to give them a switch — and rolling your own means writing code that rewrites stylesheets, tracking state across pages, and hoping nothing breaks on export.</p><p>Smart Theme Switch handles all of it. Drop the component onto any page, point it at your brand colors, and it becomes a live control that flips your entire site between light and dark on a single tap. It reads the light and dark styles Framer already generates and re-applies the set the visitor chooses — so every background, text color, border, and surface repaints together, with zero manual wiring.</p><h3><strong>How It Works</strong></h3><p>When you use Color Styles in Framer, Framer compiles them into light and dark variants behind the scenes. Smart Theme Switch reads those variants and, when a visitor picks a theme, applies the matching set across the whole page — without ever modifying Framer's own stylesheets.</p><p>That approach keeps it safe and automatic. It works with the styles you already have, adds nothing to the page until a visitor actually interacts with it, and leaves your site behaving exactly like stock Framer for anyone who never touches the switch.</p><figure><img src=\"/media/fa82d0ba7b07aeb6f52d002c58a4b803.png\" width=\"1600\" height=\"1200\" alt=\"Smart Theme Switch\" loading=\"lazy\"><figcaption>Smart Theme Switch</figcaption></figure><p><br></p><h3><strong>Features</strong></h3><h4><strong>Whole-Page Flip</strong></h4><p>One tap repaints the entire site. Backgrounds, text, borders, strokes, and every themed surface change together in a single click — not just the area around the toggle.</p><h4><strong>Remembers the Visitor's Choice</strong></h4><p>A visitor's selection is saved to their browser and restored on their next visit and on every other page of your site. Choose dark once and the site stays dark as they navigate and when they come back later.</p><h4><strong>Light, Dark, or Device</strong></h4><p>Set how the toggle starts:</p><ul><li><strong>Light</strong> — always open in light mode</li><li><strong>Dark</strong> — always open in dark mode</li><li><strong>Device</strong> — follow the visitor's system setting automatically, then let them override it</li></ul><h4><strong>Style Every Part</strong></h4><p>Tune the switch to match your brand. Every part is a control:</p><ul><li>Separate track and thumb colors for light and dark</li><li>Stroke width and color</li><li>Padding and corner sizing</li><li>Optional backdrop blur for glass-style tracks</li><li>Custom animation for the thumb, from a soft spring to an instant snap</li></ul><h4><strong>Custom Icons</strong></h4><p>Show a sun and moon inside the thumb, or upload your own SVGs for each state with independent colors and size. Turn icons off entirely for a clean, minimal switch.</p><h4><strong>Built for Accessibility</strong></h4><p>The toggle is a proper switch, not just a styled div. It announces its label and on/off state to screen readers, is fully keyboard operable, and shows a customizable focus ring for keyboard users.</p><h4><strong>Multiple Toggles, One State</strong></h4><p>Place a switch in your header, your footer, and your mobile menu — they all stay in sync. Flipping any one of them updates the theme and every other toggle on the page at once.</p><h3><strong>Property Controls</strong></h3><p>Everything is editable from the Framer properties panel, no code required:</p><ul><li><strong>Default</strong> — Light, Dark, or Device</li><li><strong>Label</strong> — the accessible name announced to screen readers</li><li><strong>Track &amp; Thumb colors</strong> — separate values for light and dark</li><li><strong>Stroke</strong> — width and color</li><li><strong>Padding</strong> — spacing around the thumb</li><li><strong>Backdrop Blur</strong> — optional blur behind the track</li><li><strong>Icons</strong> — show/hide, custom SVGs, colors, and size</li><li><strong>Focus Ring</strong> — color and width</li><li><strong>Animation</strong> — the thumb's transition</li></ul><h3><strong>How to Add It to Your Site</strong></h3><ol><li>Install Smart Theme Switch from the Framer Marketplace</li><li>Open your Framer project and drag the component onto your header or nav</li><li>Set your light and dark track, thumb, and stroke colors to match your brand</li><li>Choose how it starts — Light, Dark, or Device</li><li>Publish your site</li><li>The live flip runs on your published and preview links — tap it to test</li></ol><h3><strong>Pricing</strong></h3><p>Smart Theme Switch is <strong>free</strong>. Install it from the Framer Marketplace and add unlimited toggles to your project — no license key, no usage limits.</p><h3><strong>Frequently Asked Questions</strong></h3><p><strong>Do I need to set anything up for it to work?</strong></p><p>No. If you use Framer Color Styles with light and dark values, the toggle works automatically. Just drop it in and pick your colors.</p><p><strong>Will it work with my existing dark mode styles?</strong></p><p>Yes. It reads the light and dark variants Framer already generates from your Color Styles, so it matches your existing design with no extra configuration.</p><p><strong>Does the choice persist across pages and visits?</strong></p><p>Yes. A visitor's selection is stored in their browser, kept as they move between pages, and restored the next time they return.</p><p><strong>Can visitors follow their device theme automatically?</strong></p><p>Yes. Set the default to <strong>Device</strong> and the site opens in whatever theme the visitor's system uses, while still letting them override it with the switch.</p><p><strong>Will it slow down my site or affect SEO?</strong></p><p>No. The component stays completely inert until a visitor interacts with it and never rewrites Framer's own stylesheets, so pages that are never toggled behave exactly like stock Framer.</p><p><strong>Why doesn't the switch animate on the Framer canvas?</strong></p><p>On the canvas and during export it shows a clean static preview by design. The live flip runs on your published and preview links, not inside the editor.</p><p><strong>Can I use my own icons?</strong></p><p>Yes. Upload custom SVGs for the light and dark states, set their colors and size, or turn icons off for a minimal look.</p><h3><strong>Built by Visuvate</strong></h3><p>Smart Theme Switch is built and maintained by Visuvate, a web design and development studio specialising in Framer and Wix Studio. We build tools for designers and developers who care about workflow quality.</p><p><a href=\"http://visuvate.com\" target=\"_blank\" rel=\"noreferrer\">visuvate.com</a></p>" }} />
        <ArticleCodeBlocks />
        <ArticleLightbox />
        <div className="mx-auto max-w-[964px] px-6 pb-[90px] md:px-8">
          <div className="flex flex-wrap items-center gap-3 border-t pt-6" style={{ borderColor: "var(--vv-card-line)" }}>
            <span className="text-[14px] text-fg-subtle">
              Filed under
            </span>
            <Link href="/blog/category/framer" className="inline-flex h-[34px] items-center rounded-full border border-line bg-bg px-4 text-[15px] leading-none font-medium text-fg-muted transition-colors hover:border-line-strong hover:text-fg">
              <RollText text="Framer" />
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
            <Link data-reveal href="/blog/stylesync" className="group relative rounded-[12px] border border-fg/20 bg-bg/30 p-3 pb-5 backdrop-blur-[14px]">
              <span aria-hidden className="vv-shine vv-shine-lyr-a pointer-events-none absolute inset-0 rounded-[inherit] pointer-coarse:hidden" style={{ padding: 1, animationDuration: "2.8s", backgroundImage: "conic-gradient(from calc(var(--vv-shine-a) - var(--vv-shine-w, 24deg)), transparent 0deg, #0099FF calc(var(--vv-shine-w, 24deg) / 2), #7ACAFF var(--vv-shine-w, 24deg), transparent calc(var(--vv-shine-w, 24deg) * 2), transparent 360deg)", mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", maskComposite: "exclude", WebkitMaskComposite: "xor" }} />
              <span aria-hidden className="vv-shine vv-shine-lyr-b pointer-events-none absolute inset-0 rounded-[inherit] pointer-coarse:hidden" style={{ padding: 1, animationDuration: "2.8s", backgroundImage: "conic-gradient(from calc(var(--vv-shine-b) - var(--vv-shine-w, 24deg)), transparent 0deg, #0099FF calc(var(--vv-shine-w, 24deg) / 2), #7ACAFF var(--vv-shine-w, 24deg), transparent calc(var(--vv-shine-w, 24deg) * 2), transparent 360deg)", mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", maskComposite: "exclude", WebkitMaskComposite: "xor" }} />
              <div className="relative overflow-hidden rounded-[8px] bg-surface" style={{ aspectRatio: "408 / 229" }}>
                <img src="/media/24256474797948598af6e055ef03431e.jpg" alt="StyleSync ~ Import Styles" className="absolute inset-0 size-full object-cover transition-[filter] duration-500 ease-brand group-hover:[filter:blur(7px)_brightness(0.62)]" loading="lazy" decoding="async" />
                <span className="pointer-events-none absolute inset-0 grid place-items-center opacity-0 transition-opacity duration-400 ease-brand group-hover:opacity-100">
                  <span className="vv-accent text-[32px] leading-none text-white">
                    Read post
                  </span>
                </span>
              </div>
              <p className="mt-[27px] px-2 text-[14px] leading-[1] text-fg-subtle">
                27 Jun 2026
              </p>
              <h3 className="mt-[12px] px-2 font-display text-[24px] leading-[1.2] font-medium tracking-h3">
                {"StyleSync ~ Import Styles"}
              </h3>
              <p className="mt-[8px] line-clamp-2 px-2 text-[16px] leading-[1.4] text-fg-subtle">
                Import color and text styles from Figma, CSS, JSON, or any website directly into Framer as native styles — in seconds.
              </p>
            </Link>
            <Link data-reveal href="/blog/advanced-cms-slideshow-for-framer" className="group relative rounded-[12px] border border-fg/20 bg-bg/30 p-3 pb-5 backdrop-blur-[14px]">
              <span aria-hidden className="vv-shine vv-shine-lyr-a pointer-events-none absolute inset-0 rounded-[inherit] pointer-coarse:hidden" style={{ padding: 1, animationDuration: "2.8s", backgroundImage: "conic-gradient(from calc(var(--vv-shine-a) - var(--vv-shine-w, 24deg)), transparent 0deg, #0099FF calc(var(--vv-shine-w, 24deg) / 2), #7ACAFF var(--vv-shine-w, 24deg), transparent calc(var(--vv-shine-w, 24deg) * 2), transparent 360deg)", mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", maskComposite: "exclude", WebkitMaskComposite: "xor" }} />
              <span aria-hidden className="vv-shine vv-shine-lyr-b pointer-events-none absolute inset-0 rounded-[inherit] pointer-coarse:hidden" style={{ padding: 1, animationDuration: "2.8s", backgroundImage: "conic-gradient(from calc(var(--vv-shine-b) - var(--vv-shine-w, 24deg)), transparent 0deg, #0099FF calc(var(--vv-shine-w, 24deg) / 2), #7ACAFF var(--vv-shine-w, 24deg), transparent calc(var(--vv-shine-w, 24deg) * 2), transparent 360deg)", mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", maskComposite: "exclude", WebkitMaskComposite: "xor" }} />
              <div className="relative overflow-hidden rounded-[8px] bg-surface" style={{ aspectRatio: "408 / 229" }}>
                <img src="/media/9eef896b4ea5097e3d83cc8d531e4056.jpg" alt="Advanced CMS Slideshow for Framer" className="absolute inset-0 size-full object-cover transition-[filter] duration-500 ease-brand group-hover:[filter:blur(7px)_brightness(0.62)]" loading="lazy" decoding="async" />
                <span className="pointer-events-none absolute inset-0 grid place-items-center opacity-0 transition-opacity duration-400 ease-brand group-hover:opacity-100">
                  <span className="vv-accent text-[32px] leading-none text-white">
                    Read post
                  </span>
                </span>
              </div>
              <p className="mt-[27px] px-2 text-[14px] leading-[1] text-fg-subtle">
                31 May 2026
              </p>
              <h3 className="mt-[12px] px-2 font-display text-[24px] leading-[1.2] font-medium tracking-h3">
                Advanced CMS Slideshow for Framer
              </h3>
              <p className="mt-[8px] line-clamp-2 px-2 text-[16px] leading-[1.4] text-fg-subtle">
                CMS Slideshow Pro is a powerful and highly customizable slideshow component for Framer CMS collections. Create responsive slideshows, infinite carousels, and continuous marquee layouts with advanced controls, smooth interactions, and native-feeling customization.
              </p>
            </Link>
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
          </RevealBatch>
        </section>
      </main>
    </>
  );
}
