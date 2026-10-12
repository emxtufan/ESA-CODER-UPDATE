import AuroraImage from '@/components/AuroraImage';
import Footer from '@/components/layout/Footer';
import Header from '@/components/layout/Header';
import HeadingReveal from '@/components/motion/HeadingReveal';
import Link from '@/components/Link';
import RollText from '@/components/RollText';

// Converted 1:1 from the RSC payload of the not-found page.
export default function Page_this_page_does_not_exist() {
  return (
    <>
      <Header />
      <main id="vv-main" className="relative isolate grid min-h-screen place-items-center px-6 py-[clamp(80px,12vw,160px)]">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <AuroraImage src="/contact/aurora-dark.webp" className="vv-aurora-dark absolute max-w-none -translate-x-1/2 -translate-y-1/2 rotate-45" style={{ height: "min(max(92.58vw, 100vh), 108vh)", width: "min(max(92.58vw, 100vh), 108vh)", left: "49.5vw", top: "50%", maskImage: "radial-gradient(closest-side, #000 55%, transparent 92%)", WebkitMaskImage: "radial-gradient(closest-side, #000 55%, transparent 92%)" }} />
          <AuroraImage src="/contact/aurora-light.webp" className="vv-aurora-light absolute max-w-none -translate-x-1/2 -translate-y-1/2 rotate-45" style={{ height: "min(max(92.58vw, 100vh), 108vh)", width: "min(max(92.58vw, 100vh), 108vh)", left: "49.5vw", top: "50%", maskImage: "radial-gradient(closest-side, #000 55%, transparent 92%)", WebkitMaskImage: "radial-gradient(closest-side, #000 55%, transparent 92%)" }} />
        </div>
        <div className="relative w-full max-w-[560px] rounded-[20px] border border-fg/12 bg-[var(--vv-glass-card)] px-8 py-10 text-center backdrop-blur-[12px]">
          <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px" style={{ background: "linear-gradient(90deg, transparent 0%, color-mix(in srgb, var(--vv-text-primary) 45%, transparent) 50%, transparent 100%)" }} />
          <p aria-hidden className="mb-2 font-display text-[clamp(56px,8vw,84px)] leading-[0.9] font-medium tracking-[-0.05em] text-fg-dim">
            404
          </p>
          <HeadingReveal>
            <h1 className="font-display text-[clamp(30px,4.2vw,44px)] leading-[1.1] font-medium tracking-[-0.03em]">
              This page doesn’t exist
            </h1>
          </HeadingReveal>
          <p className="mx-auto mt-4 max-w-[420px] text-[16px] leading-[1.7] text-fg-muted">
            The link may be out of date, or the address slightly off. Everything the studio has published is still one click away.
          </p>
          <Link href="/" className="mt-8 inline-flex h-[52px] w-full max-w-[420px] items-center justify-center rounded-full bg-fg text-[16px] font-medium text-bg transition-opacity hover:opacity-90">
            <RollText text="Back to Home" />
          </Link>
          <div className="mt-5 flex flex-wrap justify-center gap-x-6 gap-y-2 text-[14px]">
            <Link href="/works" className="text-fg-muted underline decoration-fg/20 underline-offset-4 transition-colors hover:text-fg">
              See our work
            </Link>
            <Link href="/contact" className="text-fg-muted underline decoration-fg/20 underline-offset-4 transition-colors hover:text-fg">
              Get in touch
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
