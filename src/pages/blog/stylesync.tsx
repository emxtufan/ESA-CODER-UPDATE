import ArticleCodeBlocks from '@/components/blog/ArticleCodeBlocks';
import ArticleLightbox from '@/components/blog/ArticleLightbox';
import HeadingReveal from '@/components/motion/HeadingReveal';
import Link from '@/components/Link';
import ParallaxDrift from '@/components/motion/ParallaxDrift';
import RevealBatch from '@/components/motion/RevealBatch';
import RollText from '@/components/RollText';

// Converted 1:1 from the RSC payload of /blog/stylesync.
export default function Page_blog__stylesync() {
  return (
    <>
      <main className="relative isolate">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: "{\"@context\":\"https://schema.org\",\"@type\":\"BlogPosting\",\"headline\":\"StyleSync ~ Import Styles\",\"description\":\"Import color and text styles from Figma, CSS, JSON, or any website directly into Framer as native styles — in seconds.\",\"url\":\"https://visuvate.com/blog/stylesync\",\"mainEntityOfPage\":\"https://visuvate.com/blog/stylesync\",\"image\":[\"https://visuvate.com/_next/image?url=%2Fmedia%2F24256474797948598af6e055ef03431e.jpg&w=1200&q=80\"],\"datePublished\":\"2026-06-27T00:00:00.000Z\",\"author\":{\"@type\":\"Organization\",\"name\":\"Visuvate\",\"url\":\"https://visuvate.com\"},\"publisher\":{\"@id\":\"https://visuvate.com/#organization\"}}" }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: "{\"@context\":\"https://schema.org\",\"@type\":\"BreadcrumbList\",\"itemListElement\":[{\"@type\":\"ListItem\",\"position\":1,\"name\":\"Home\",\"item\":\"https://visuvate.com/\"},{\"@type\":\"ListItem\",\"position\":2,\"name\":\"Blog\",\"item\":\"https://visuvate.com/blog\"},{\"@type\":\"ListItem\",\"position\":3,\"name\":\"Framer\",\"item\":\"https://visuvate.com/blog/category/framer\"},{\"@type\":\"ListItem\",\"position\":4,\"name\":\"StyleSync ~ Import Styles\",\"item\":\"https://visuvate.com/blog/stylesync\"}]}" }} />
        <header className="relative">
          <ParallaxDrift drift={185} className="mx-auto max-w-[964px] px-6 pt-[96px] md:px-8 md:pt-[153px]">
            <HeadingReveal>
              <h1 className="text-center font-display text-[clamp(38px,5vw,72px)] leading-[1] font-medium tracking-[-0.05em] will-change-transform">
                {"StyleSync ~ Import Styles"}
              </h1>
            </HeadingReveal>
          </ParallaxDrift>
          <div className="relative z-10 mx-auto mt-[28px] max-w-[1182px] px-6 md:px-8">
            <div className="relative rounded-[20px] p-2 backdrop-blur-[10px]" style={{ background: "color-mix(in srgb, var(--vv-bg) 80%, transparent)" }}>
              <span aria-hidden className="pointer-events-none absolute top-0 left-1/2 h-px w-[600px] max-w-full -translate-x-1/2" style={{ background: "linear-gradient(90deg, transparent 0%, var(--vv-card-line) 50%, transparent 100%)" }} />
              <span aria-hidden className="pointer-events-none absolute inset-0 rounded-[20px]" style={{ background: "radial-gradient(58% 46% at 50% 0%, var(--vv-card-lift) 0%, var(--vv-card-lift-mid) 45%, transparent 78%)" }} />
              <img src="/media/24256474797948598af6e055ef03431e.jpg" alt="StyleSync ~ Import Styles" className="relative block w-full rounded-[12px]" style={{ aspectRatio: "1102 / 620", objectFit: "cover" }} decoding="async" />
            </div>
          </div>
        </header>
        <article className="article mt-[65px] pb-[82px]" dangerouslySetInnerHTML={{ __html: "<h2>StyleSync - Import Design Tokens &amp; Styles into Framer</h2><p>StyleSync is a Framer plugin that extracts actively-used styles from your Figma files, design token files, and websites, and imports them directly into Framer as native color and text styles. No manual copying, no missed tokens, no mismatched values.</p><hr><h3>What StyleSync Does</h3><p>Every design workflow involves moving styles between tools. Designers maintain color palettes and typography in Figma, developers define tokens in CSS or JSON, and production sites carry their own computed styles. Getting those values into Framer accurately and quickly is tedious work done manually.</p><p>StyleSync automates that transfer. It reads your styles from wherever they live, shows you a preview with full control over what gets imported, and injects only the styles you select directly into your Framer project as native color styles and text styles, accessible from any element in the canvas.</p><hr><h3>Import Methods</h3><p>StyleSync supports three distinct import methods, each designed for a different point in your workflow.</p><h4>Figma File Import</h4><p>Paste any Figma file URL and StyleSync scans the entire document for actively-used styles. Rather than pulling every style defined in the file including unused library styles, StyleSync walks the document tree and extracts only the styles that are actually applied to elements. This keeps your Framer style panel clean and relevant.</p><p>Supported:</p><ul><li>Fill colors and solid color styles</li><li>Typography styles including font family, size, weight, line height, and letter spacing</li><li>Both local styles and shared library styles in use</li></ul><p>To use Figma import you will need a Figma Personal Access Token. You can generate one in Figma under Settings → Security → Personal access tokens. Name it anything, copy it, and paste it once into StyleSync. It is stored locally and never transmitted to any third party.</p><h4>Upload File</h4><p>If your team works with design tokens in code, upload your token file directly. StyleSync parses the file client-side and extracts all color and typography values.</p><p>Supported formats:</p><ul><li><strong>CSS files</strong>&nbsp;— extracts custom properties from :root, resolves var()&nbsp;references, handles clamp()&nbsp;values</li><li><strong>JSON files</strong>&nbsp;— supports Tokens Studio format, Figma Variables export, and W3C Design Tokens specification</li></ul><p>Drag and drop your file or click to browse. StyleSync auto-detects the format and parses it immediately.</p><h4>Paste Code</h4><p>Skip the file entirely and paste CSS or JSON directly into the plugin. Useful for copying styles from a codebase, a Storybook, or a design system documentation site. StyleSync auto-detects whether the pasted content is CSS or JSON and processes it accordingly.</p><h4>Website URL</h4><p>Enter any public website URL and StyleSync extracts the CSS custom properties and computed color and typography values from the live site. Useful for matching an existing brand's styles or importing from a live design system documentation site.</p><figure><img src=\"/media/1e59596e3f84bf0a5012715570a7c62f.jpg\" width=\"1600\" height=\"1200\" alt=\"StyleSync Plugin\" loading=\"lazy\"><figcaption>StyleSync Plugin</figcaption></figure><hr><h3>Style Preview and Selection</h3><p>Before anything is imported you see a full preview of every extracted style. Each style shows its name, value, and a visual swatch for colors or a type sample for text styles.</p><p>You can:</p><ul><li>Select individual styles using checkboxes</li><li>Use Select All / Deselect All</li><li>Review exactly what will be imported before committing</li></ul><p>Only the styles you select are imported. Nothing is written to your Framer project until you confirm.</p><hr><h3>What Gets Created in Framer</h3><p>StyleSync creates native Framer styles, not overrides or custom properties. After import:</p><ul><li><strong>Color styles</strong>&nbsp;appear in your Framer color panel, available from any fill, stroke, or background picker</li><li><strong>Text styles</strong>&nbsp;appear in your Framer text styles panel, applicable to any text element</li></ul><p>Styles are named exactly as they appear in the source file, preserving your naming conventions and token hierarchy.</p><hr><h3>Pricing</h3><p>StyleSync is free to start with a usage limit on the free tier.</p><table><tbody><tr><td>Plan</td><td>Price</td><td>Imports</td></tr><tr><td>Free</td><td>$0</td><td>3 imports/month</td></tr><tr><td>Monthly</td><td>$9/month</td><td>Unlimited</td></tr><tr><td>Yearly</td><td>$49/year</td><td>Unlimited (save 54%)</td></tr><tr><td>Lifetime</td><td>$89 one-time</td><td>Unlimited forever</td></tr></tbody></table><p>Usage is tracked server-side, tied to your Framer account. Upgrading to Pro unlocks unlimited imports across all three import methods.</p><hr><h3>How to Get Started</h3><ol><li>Install StyleSync from the Framer Marketplace</li><li>Open any Framer project</li><li>Go to Plugins → StyleSync</li><li>Choose your import method</li><li>Preview and select your styles</li><li>Click Import</li></ol><hr><h3>How to Get a Figma Access Token</h3><p>For Figma file imports StyleSync requires a Personal Access Token. Here is how to generate one:</p><ol><li>Open Figma and click your avatar in the top left</li><li>Go to <strong>Settings</strong></li><li>Scroll to <strong>Security</strong></li><li>Under <strong>Personal access tokens</strong>&nbsp;click <strong>Generate new token</strong></li><li>Give it a name like \"StyleSync\"</li><li>Copy the token and paste it into StyleSync</li></ol><p>The token is stored locally in your browser and is only used to read your Figma file. It is never sent to Visuvate servers.</p><hr><h3>Frequently Asked Questions</h3><details><summary>Does StyleSync import all styles in a Figma file?</summary><p>No. StyleSync only extracts styles that are actively applied to elements in your file. Unused library styles are ignored, keeping your import clean.</p></details><details><summary>Can I use StyleSync without a Figma account?</summary><p>Yes. The Upload File and Website URL methods work without any Figma connection.</p></details><details><summary>What happens to my Figma token?</summary><p>Your token is stored locally in your browser only. It is used exclusively to read file data from Figma's API and is never transmitted to Visuvate.</p></details><details><summary>Does importing overwrite existing Framer styles?</summary><p>No. StyleSync creates new styles. If a style with the same name already exists in Framer it will be added alongside it, not replaced.</p></details><details><summary>I upgraded my plan. How do I activate Pro?</summary><p>After purchasing you will receive a license key by email. Open StyleSync, click the gear icon, go to Account, and enter your license key.</p></details><hr><h3>Built by Visuvate</h3><p>StyleSync is built and maintained by Visuvate, a web design and development studio specialising in Framer and Wix Studio. We build tools for designers and developers who care about workflow quality.</p><p><a href=\"http://visuvate.com\" target=\"_blank\" rel=\"noreferrer\"><u>visuvate.com</u></a></p>" }} />
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
