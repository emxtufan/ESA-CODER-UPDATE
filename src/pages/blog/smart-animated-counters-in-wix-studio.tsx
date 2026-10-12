import ArticleCodeBlocks from '@/components/blog/ArticleCodeBlocks';
import ArticleLightbox from '@/components/blog/ArticleLightbox';
import HeadingReveal from '@/components/motion/HeadingReveal';
import Link from '@/components/Link';
import ParallaxDrift from '@/components/motion/ParallaxDrift';
import RevealBatch from '@/components/motion/RevealBatch';
import RollText from '@/components/RollText';

// Converted 1:1 from the RSC payload of /blog/smart-animated-counters-in-wix-studio.
export default function Page_blog__smart_animated_counters_in_wix_studio() {
  return (
    <>
      <main className="relative isolate">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: "{\"@context\":\"https://schema.org\",\"@type\":\"BlogPosting\",\"headline\":\"Smart Animated Counters in Wix Studio\",\"description\":\"Learn how to add smart animated number counters to your Wix Studio site. This step-by-step guide provides a copy-and-paste Velo code snippet that automatically handles complex formats, such as 10k, $500, or 98% satisfaction.\",\"url\":\"https://visuvate.com/blog/smart-animated-counters-in-wix-studio\",\"mainEntityOfPage\":\"https://visuvate.com/blog/smart-animated-counters-in-wix-studio\",\"image\":[\"https://visuvate.com/_next/image?url=%2Fmedia%2F3990486d63ac121ae76e45c695fb18ca.jpg&w=1200&q=80\"],\"datePublished\":\"2026-01-10T00:00:00.000Z\",\"author\":{\"@type\":\"Organization\",\"name\":\"Visuvate\",\"url\":\"https://visuvate.com\"},\"publisher\":{\"@id\":\"https://visuvate.com/#organization\"}}" }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: "{\"@context\":\"https://schema.org\",\"@type\":\"BreadcrumbList\",\"itemListElement\":[{\"@type\":\"ListItem\",\"position\":1,\"name\":\"Home\",\"item\":\"https://visuvate.com/\"},{\"@type\":\"ListItem\",\"position\":2,\"name\":\"Blog\",\"item\":\"https://visuvate.com/blog\"},{\"@type\":\"ListItem\",\"position\":3,\"name\":\"Wix Studio\",\"item\":\"https://visuvate.com/blog/category/wix-studio\"},{\"@type\":\"ListItem\",\"position\":4,\"name\":\"Smart Animated Counters in Wix Studio\",\"item\":\"https://visuvate.com/blog/smart-animated-counters-in-wix-studio\"}]}" }} />
        <header className="relative">
          <ParallaxDrift drift={185} className="mx-auto max-w-[964px] px-6 pt-[96px] md:px-8 md:pt-[153px]">
            <HeadingReveal>
              <h1 className="text-center font-display text-[clamp(38px,5vw,72px)] leading-[1] font-medium tracking-[-0.05em] will-change-transform">
                Smart Animated Counters in Wix Studio
              </h1>
            </HeadingReveal>
          </ParallaxDrift>
          <div className="relative z-10 mx-auto mt-[28px] max-w-[1182px] px-6 md:px-8">
            <div className="relative rounded-[20px] p-2 backdrop-blur-[10px]" style={{ background: "color-mix(in srgb, var(--vv-bg) 80%, transparent)" }}>
              <span aria-hidden className="pointer-events-none absolute top-0 left-1/2 h-px w-[600px] max-w-full -translate-x-1/2" style={{ background: "linear-gradient(90deg, transparent 0%, var(--vv-card-line) 50%, transparent 100%)" }} />
              <span aria-hidden className="pointer-events-none absolute inset-0 rounded-[20px]" style={{ background: "radial-gradient(58% 46% at 50% 0%, var(--vv-card-lift) 0%, var(--vv-card-lift-mid) 45%, transparent 78%)" }} />
              <img src="/media/3990486d63ac121ae76e45c695fb18ca.jpg" alt="Smart Animated Counters in Wix Studio" className="relative block w-full rounded-[12px]" style={{ aspectRatio: "1102 / 620", objectFit: "cover" }} decoding="async" />
            </div>
          </div>
        </header>
        <article className="article mt-[65px] pb-[82px]" dangerouslySetInnerHTML={{ __html: "<h2>How to Add a Smart Counter in Wix Studio (The Animated Way)</h2><p>Nothing grabs attention on a portfolio or landing page quite like animated statistics. Whether it’s <strong>\"10k+ Views\"</strong>&nbsp;or <strong>\"100% Satisfaction,\"</strong>&nbsp;watching numbers count up creates a sense of momentum.</p><p>If you are looking for the perfect <strong>Counter in Wix Studio</strong>, you might have realized that standard text elements don't animate by default. In this tutorial, I’m sharing a robust Velo (JavaScript) snippet that I use on my projects. It’s \"smart\" because it automatically handles suffixes (k, M, B), decimals, and symbols (%) without you needing to write extra code for each text box.</p><figure><img src=\"/media/6a1808ca24070b154f27f19fc3402ced.gif\" width=\"1080\" height=\"196\" alt=\"Preview of the animated number counter \" loading=\"lazy\"><figcaption>Preview</figcaption></figure><hr><h3>The Outcome</h3><p>By the end of this guide, you will have text elements that automatically count up from 0 when the user scrolls them into view, acting as a fully dynamic <strong>Counter in Wix Studio</strong>.</p><h4>Step 1: Open the Code Panel</h4><p>You don't need to install anything complex to get this working.</p><ol><li>In the Wix Studio Editor, look at the left sidebar.</li><li>Click the <strong>{ } (Code)</strong>&nbsp;icon.</li><li>A panel will slide up at the bottom of your screen. This is where we will paste the code.</li></ol><h4>Step 2: Prepare Your Text Elements</h4><p>The code needs to know <em>which</em>&nbsp;text elements to animate. To create a specific <strong>Counter in Wix Studio</strong>, we use a specific ID.</p><ol><li>Add a <strong>Text Element</strong>&nbsp;to your canvas.</li><li><p>Type in your final number (e.g., 1500, 98%, $10k).</p><ul><li><em>Note: You can style the font, size, and color however you like.</em></li></ul></li><li>Select the text element.</li><li>Look at the <strong>bottom right</strong>&nbsp;of your screen (next to the code editor) to find the <strong>Properties &amp; Events</strong>&nbsp;panel.</li><li>Find the <strong>ID</strong>&nbsp;field.</li><li><p>Change the ID to start with num.</p><ul><li>Examples: numCounter1, numStats, numRevenue.</li></ul></li></ol><p>The code specifically looks for IDs starting with \"num\" and ignores everything else.</p><blockquote><p><strong>⚠️ Important Limitation:</strong> This code is designed for <strong>static</strong>&nbsp;text elements only. It will <strong>not</strong>&nbsp;work for text elements inside a <strong>Repeater</strong>&nbsp;(connected to the CMS). Repeaters require a different coding approach using onItemReady.</p></blockquote><h4>Step 3: The Code</h4><p>Copy the code below and paste it directly into the panel at the bottom of your screen. <em>(Note: If you see existing code like $w.onReady..., you can delete it and replace it with this complete snippet.)</em></p><p>JavaScript</p><pre><code>$w.onReady(() =&gt; {\n\n  // CONFIGURATION: Animation Duration in milliseconds\n\n  const DURATION = 1500;\n\n\n\n  // 1. Find and Initialize all \"num\" elements\n\n  $w('Text').forEach(el =&gt; {\n\n    if (!el.id || !el.id.toLowerCase().startsWith('num')) return;\n\n    initCounter(el);\n\n  });\n\n\n\n  // 2. The Core Counter Function\n\n  function initCounter(el) {\n\n    const original = (el.text || '').toString();\n\n    // Regex to find numbers, decimals, commas, and suffixes (k, M, B)\n\n    const matches = [...original.matchAll(/(\\d[\\d,]*(?:\\.\\d+)?(?:\\s*[kKmMbB])?)([%\\+]?)/g)];\n\n    if (!matches.length) return;\n\n\n\n    let template = original;\n\n    matches.forEach((m, i) =&gt; {\n\n      template = template.replace(m[0], `{{n${i}}}`);\n\n    });\n\n\n\n    const tokens = matches.map(m =&gt; {\n\n      const rawNum = m[1].replace(/\\s+/g, '');\n\n      const trail = m[2] || '';\n\n      return parseTokenPreserveShort(rawNum, trail);\n\n    });\n\n\n\n    const zeroState = () =&gt; tokens.map(t =&gt; formatDisplayValue(0, t));\n\n    const finalState = () =&gt; tokens.map(t =&gt; formatDisplayValue(t.isShort ? t.shortValue : t.fullValue, t));\n\n\n\n    // Reset text to 0 initially\n\n    el.text = buildTextFromTemplate(template, zeroState(), tokens.map(t =&gt; t.trail));\n\n\n\n    let started = false;\n\n\n\n    // Animation Loop\n\n    function animate() {\n\n      if (started) return;\n\n      started = true;\n\n      const startTime = performance.now();\n\n\n\n      function step(now) {\n\n        const t = Math.min((now - startTime) / DURATION, 1);\n\n        // Easing function (Cubic Ease Out) for smooth effect\n\n        const eased = 1 - Math.pow(1 - t, 3);\n\n\n\n        const current = tokens.map(tok =&gt; {\n\n          const val = tok.isShort ? tok.shortValue * eased : tok.fullValue * eased;\n\n          return formatDisplayValue(val, tok);\n\n        });\n\n\n\n        el.text = buildTextFromTemplate(template, current, tokens.map(t =&gt; t.trail));\n\n\n\n        if (t &lt; 1) {\n\n          requestAnimationFrame(step);\n\n        } else {\n\n          el.text = buildTextFromTemplate(template, finalState(), tokens.map(t =&gt; t.trail));\n\n        }\n\n      }\n\n      requestAnimationFrame(step);\n\n    }\n\n\n\n    // Trigger animation when element enters viewport\n\n    el.onViewportEnter(animate);\n\n    \n\n    // Optional: Reset when leaving viewport so it plays again\n\n    el.onViewportLeave(() =&gt; {\n\n      started = false;\n\n      el.text = buildTextFromTemplate(template, zeroState(), tokens.map(t =&gt; t.trail));\n\n    });\n\n  }\n\n});\n\n\n\n/* ================= HELPERS (Paste these outside onReady) ================= */\n\n\n\nfunction parseTokenPreserveShort(rawNum, trail) {\n\n  // UPDATED: Do not force lowercase on the whole string immediately\n\n  // Regex now looks for uppercase or lowercase suffixes: [kKmMbB]\n\n  const shortMatch = rawNum.match(/^([\\d.,]+)([kKmMbB])$/);\n\n\n\n  if (shortMatch) {\n\n    const num = parseFloat(shortMatch[1].replace(/,/g, ''));\n\n    const originalSuffix = shortMatch[2]; // \"M\" or \"m\"\n\n    const lowerSuffix = originalSuffix.toLowerCase(); // used for math only\n\n    \n\n    const multiplier = lowerSuffix === 'k' ? 1e3 : lowerSuffix === 'm' ? 1e6 : 1e9;\n\n    const decimals = (shortMatch[1].split('.')[1] || '').length;\n\n\n\n    return {\n\n      isShort: true,\n\n      suffix: originalSuffix, // Preserves the original Case (e.g. \"M\")\n\n      shortValue: num,\n\n      fullValue: num * multiplier,\n\n      decimals,\n\n      hasSeparator: /,/.test(rawNum),\n\n      trail\n\n    };\n\n  }\n\n\n\n  const numeric = parseFloat(rawNum.replace(/,/g, ''));\n\n  const decimals = (rawNum.split('.')[1] || '').length;\n\n\n\n  return {\n\n    isShort: false,\n\n    suffix: '',\n\n    shortValue: null,\n\n    fullValue: isFinite(numeric) ? numeric : 0,\n\n    decimals,\n\n    hasSeparator: /,/.test(rawNum),\n\n    trail\n\n  };\n\n}\n\n\n\nfunction formatDisplayValue(value, tok) {\n\n  const rounded = tok.decimals === 0 ? Math.round(value) : roundToDecimals(value, tok.decimals);\n\n  if (tok.isShort) {\n\n    return tok.decimals === 0 \n\n      ? `${rounded}${tok.suffix}` \n\n      : `${rounded.toFixed(tok.decimals)}${tok.suffix}`;\n\n  }\n\n  if (tok.hasSeparator) {\n\n    return Number(rounded).toLocaleString(undefined, {\n\n      minimumFractionDigits: tok.decimals,\n\n      maximumFractionDigits: tok.decimals\n\n    });\n\n  }\n\n  return String(rounded);\n\n}\n\n\n\nfunction buildTextFromTemplate(template, values, trails) {\n\n  let text = template;\n\n  values.forEach((v, i) =&gt; { text = text.replace(`{{n${i}}}`, v + (trails[i] || '')); });\n\n  return text;\n\n}\n\n\n\nfunction roundToDecimals(num, dec) {\n\n  const m = Math.pow(10, dec);\n\n  return Math.round((num + Number.EPSILON) * m) / m;\n\n}</code></pre><figure><img src=\"/media/8c07adde026fcde3dd7d118942433a30.png\" width=\"1833\" height=\"975\" alt=\"Wix IDE screenshot showing JavaScript code for counter animation, with numbers 1234, 6234+, 264M, and 1.2K. Sidebar displays settings.\" loading=\"lazy\"><figcaption>Wix Studio Editor</figcaption></figure><hr><h3>Understanding the Code (What you can change)</h3><p>You don't need to be a coding expert to tweak this <strong>Counter in Wix Studio</strong>. Here is the one value you might want to adjust:</p><p><strong>The Animation Speed</strong> At the very top of the code, find this line: const DURATION = 1500;</p><p><strong>1500</strong>&nbsp;represents the time in milliseconds (1.5 seconds). <strong>To make it faster:</strong>&nbsp;Change it to 1000&nbsp;(1 second). <strong>To make it slower:</strong>&nbsp;Change it to 3000&nbsp;(3 seconds).</p><hr><h3>Why this code is \"Smart\"</h3><p>Unlike basic scripts you might find online, this approach uses <strong>Regular Expressions (Regex)</strong>&nbsp;to read your text before animating it.</p><p>If you write <strong>10k</strong>, it knows to count from 0 to 10, keeping the 'k'. If you write <strong>$50.00</strong>, it preserves the dollar sign and the decimal points. It uses an <strong>Ease-Out</strong>&nbsp;mathematical function, meaning the numbers spin fast at the start and land gently on the final number. This looks much more professional than a linear count and elevates the quality of your <strong>Counter in Wix Studio</strong>.</p><p>Enjoy adding some motion to your metrics!</p><p>It's one of many small motion details we build into client sites through our <a href=\"/services/motion-and-interaction-design\">Motion &amp; Interaction Design service</a>.</p>" }} />
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
            <Link data-reveal href="/blog/smooth-scroll-in-a-wix-website" className="group relative rounded-[12px] border border-fg/20 bg-bg/30 p-3 pb-5 backdrop-blur-[14px]">
              <span aria-hidden className="vv-shine vv-shine-lyr-a pointer-events-none absolute inset-0 rounded-[inherit] pointer-coarse:hidden" style={{ padding: 1, animationDuration: "2.8s", backgroundImage: "conic-gradient(from calc(var(--vv-shine-a) - var(--vv-shine-w, 24deg)), transparent 0deg, #0099FF calc(var(--vv-shine-w, 24deg) / 2), #7ACAFF var(--vv-shine-w, 24deg), transparent calc(var(--vv-shine-w, 24deg) * 2), transparent 360deg)", mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", maskComposite: "exclude", WebkitMaskComposite: "xor" }} />
              <span aria-hidden className="vv-shine vv-shine-lyr-b pointer-events-none absolute inset-0 rounded-[inherit] pointer-coarse:hidden" style={{ padding: 1, animationDuration: "2.8s", backgroundImage: "conic-gradient(from calc(var(--vv-shine-b) - var(--vv-shine-w, 24deg)), transparent 0deg, #0099FF calc(var(--vv-shine-w, 24deg) / 2), #7ACAFF var(--vv-shine-w, 24deg), transparent calc(var(--vv-shine-w, 24deg) * 2), transparent 360deg)", mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", maskComposite: "exclude", WebkitMaskComposite: "xor" }} />
              <div className="relative overflow-hidden rounded-[8px] bg-surface" style={{ aspectRatio: "408 / 229" }}>
                <img src="/media/78ab2a87ac838db6bd9c1b6d891a8b6e.jpg" alt="How to Add Smooth Scroll in a Wix Website" className="absolute inset-0 size-full object-cover transition-[filter] duration-500 ease-brand group-hover:[filter:blur(7px)_brightness(0.62)]" loading="lazy" decoding="async" />
                <span className="pointer-events-none absolute inset-0 grid place-items-center opacity-0 transition-opacity duration-400 ease-brand group-hover:opacity-100">
                  <span className="vv-accent text-[32px] leading-none text-white">
                    Read post
                  </span>
                </span>
              </div>
              <p className="mt-[27px] px-2 text-[14px] leading-[1] text-fg-subtle">
                1 Feb 2025
              </p>
              <h3 className="mt-[12px] px-2 font-display text-[24px] leading-[1.2] font-medium tracking-h3">
                How to Add Smooth Scroll in a Wix Website
              </h3>
              <p className="mt-[8px] line-clamp-2 px-2 text-[16px] leading-[1.4] text-fg-subtle">
                {"Adding smooth scrolling to your Wix website enhances user experience by creating a fluid and polished transition between scroll actions. In this guide, we will implement smooth scrolling using Lenis , a lightweight JavaScript library for smooth page scrolling. Requirements A Wix Premium Plan  (Custom code functionality is only available in premium plans). Smooth Scroll in a Wix Website Guide Step 1: Adding the Custom Code To enable smooth scrolling, we will use Lenis.js . Below is the custom..."}
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
