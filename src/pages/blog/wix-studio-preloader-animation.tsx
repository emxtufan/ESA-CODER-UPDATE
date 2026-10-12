import ArticleCodeBlocks from '@/components/blog/ArticleCodeBlocks';
import ArticleLightbox from '@/components/blog/ArticleLightbox';
import HeadingReveal from '@/components/motion/HeadingReveal';
import Link from '@/components/Link';
import ParallaxDrift from '@/components/motion/ParallaxDrift';
import RevealBatch from '@/components/motion/RevealBatch';
import RollText from '@/components/RollText';

// Converted 1:1 from the RSC payload of /blog/wix-studio-preloader-animation.
export default function Page_blog__wix_studio_preloader_animation() {
  return (
    <>
      <main className="relative isolate">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: "{\"@context\":\"https://schema.org\",\"@type\":\"BlogPosting\",\"headline\":\"Smooth Wix Studio Preloader Animation\",\"description\":\"Learn how to add a smooth page loading animation in Wix Studio using a preloader, custom code, and loop videos for a seamless transition.\",\"url\":\"https://visuvate.com/blog/wix-studio-preloader-animation\",\"mainEntityOfPage\":\"https://visuvate.com/blog/wix-studio-preloader-animation\",\"image\":[\"https://visuvate.com/_next/image?url=%2Fmedia%2F152053cbd17ef12217ebd90970bdeeab.jpg&w=1200&q=80\"],\"datePublished\":\"2025-01-29T00:00:00.000Z\",\"author\":{\"@type\":\"Organization\",\"name\":\"Visuvate\",\"url\":\"https://visuvate.com\"},\"publisher\":{\"@id\":\"https://visuvate.com/#organization\"}}" }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: "{\"@context\":\"https://schema.org\",\"@type\":\"BreadcrumbList\",\"itemListElement\":[{\"@type\":\"ListItem\",\"position\":1,\"name\":\"Home\",\"item\":\"https://visuvate.com/\"},{\"@type\":\"ListItem\",\"position\":2,\"name\":\"Blog\",\"item\":\"https://visuvate.com/blog\"},{\"@type\":\"ListItem\",\"position\":3,\"name\":\"Wix Studio\",\"item\":\"https://visuvate.com/blog/category/wix-studio\"},{\"@type\":\"ListItem\",\"position\":4,\"name\":\"Smooth Wix Studio Preloader Animation\",\"item\":\"https://visuvate.com/blog/wix-studio-preloader-animation\"}]}" }} />
        <header className="relative">
          <ParallaxDrift drift={185} className="mx-auto max-w-[964px] px-6 pt-[96px] md:px-8 md:pt-[153px]">
            <HeadingReveal>
              <h1 className="text-center font-display text-[clamp(38px,5vw,72px)] leading-[1] font-medium tracking-[-0.05em] will-change-transform">
                Smooth Wix Studio Preloader Animation
              </h1>
            </HeadingReveal>
          </ParallaxDrift>
          <div className="relative z-10 mx-auto mt-[28px] max-w-[1182px] px-6 md:px-8">
            <div className="relative rounded-[20px] p-2 backdrop-blur-[10px]" style={{ background: "color-mix(in srgb, var(--vv-bg) 80%, transparent)" }}>
              <span aria-hidden className="pointer-events-none absolute top-0 left-1/2 h-px w-[600px] max-w-full -translate-x-1/2" style={{ background: "linear-gradient(90deg, transparent 0%, var(--vv-card-line) 50%, transparent 100%)" }} />
              <span aria-hidden className="pointer-events-none absolute inset-0 rounded-[20px]" style={{ background: "radial-gradient(58% 46% at 50% 0%, var(--vv-card-lift) 0%, var(--vv-card-lift-mid) 45%, transparent 78%)" }} />
              <img src="/media/152053cbd17ef12217ebd90970bdeeab.jpg" alt="Smooth Wix Studio Preloader Animation" className="relative block w-full rounded-[12px]" style={{ aspectRatio: "1102 / 620", objectFit: "cover" }} decoding="async" />
            </div>
          </div>
        </header>
        <article className="article mt-[65px] pb-[82px]" dangerouslySetInnerHTML={{ __html: "<blockquote><p>How to Add a Stylish Wix Studio Preloader to Your Website (Step-by-Step Guide)</p></blockquote><p>Want to make your website more engaging with a sleek preloader animation? In this guide, I’ll show you how to implement a custom preloader using Wix’s built-in tools and a bit of code. Let’s get started!</p><h2>What You’ll Need</h2><ul><li>A Wix website.</li><li>A loopable animation or video (you can use Wix’s library or upload your own).</li><li>Basic understanding of Wix’s editor.<br></li></ul><hr><h2><u>Wix Studio Preloader Guide</u></h2><h3>Step 1: Create the Preloader Container</h3><ol><li>Open your Wix editor and go to the page where you want to add the preloader.</li><li>Add a <strong>Container</strong> element to your page.</li><li>Resize the container to fit the entire screen.</li><li>Rename the container’s ID to #PreLoader&nbsp;(this is important for the code to work).</li><li><strong>Pin the container</strong>:</li><li>Click on the container.</li><li>Go to the <strong>Position</strong> menu.</li><li>Select <strong>Pinned to Page</strong>.<br></li></ol><hr><h3>Step 2: Add a Loop Animation</h3><ol><li>Inside the #PreLoader&nbsp;container, add a <strong>Video</strong> element.</li><li>Choose a loopable animation:</li><li>Use Wix’s built-in video library.</li><li>Or upload your transparent video (e.g., a progress bar or logo animation).</li><li>Adjust the video settings to loop seamlessly.<br></li></ol><hr><h3>Step 3: Add the Preloader Code</h3><ol><li>Go to the <strong>Page Code</strong> tab in your Wix editor.</li><li>Paste the following code:<br><br>// Preloader code<br>$w.onReady(() =&gt; {<br>  $w('#header').hide(); // Hide header<br>  waitForLoading();<br>});<br><br>export function button_onClick() {<br>  $w('#PreLoader').show();<br>  waitForLoading();<br>}<br><br>function waitForLoading() {<br>  setTimeout(() =&gt; {<br>    $w('#PreLoader').collapse(); // Hide the preloader<br>    $w('#header').show('fade');  // Show header<br>  }, 3500); // Wait for miliseconds<br>}<br></li></ol><hr><h3>Step 4: Customize the Code</h3><ul><li><strong>Change the duration</strong>: Adjust the 3500 value in the setTimeout function to match your video length or desired loading time.</li><li><strong>Hide additional elements</strong>: If you want to hide more elements (e.g., footer, buttons), duplicate the $w('#header').hide(); line and replace #header with the ID of the element you want to hide.<br></li></ul><hr><h4>Pro Tips</h4><ul><li>Use a <strong>transparent video</strong> for a modern look, or match the preloader container’s background colour to your video.</li><li>For a <strong>progress bar animation</strong>, ensure the video length and code duration are perfectly synced.</li><li>Experiment with different animations to match your website’s vibe.</li></ul><hr><h4>Why Add a Preloader?</h4><p>A preloader isn’t just visually appealing—it also improves user experience by giving visitors something to look at while your page loads. Plus, it’s a great way to showcase your creativity!</p><hr><h4>Final Thoughts</h4><p>Adding a Wix Studio Preloader to your website is a simple yet effective way to elevate its design. With this guide, you can implement it in just a few steps. Try it out and let me know how it goes!</p><p>This kind of loading polish is one of the details our <a href=\"/services/motion-and-interaction-design\">Motion &amp; Interaction Design service </a>handles on client builds.</p>" }} />
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
