import AuroraImage from '@/components/AuroraImage';
import HeadingReveal from '@/components/motion/HeadingReveal';
import Link from '@/components/Link';
import RollText from '@/components/RollText';

// Converted 1:1 from the RSC payload of /contact/thank-you.
export default function Page_contact__thank_you() {
  return (
    <>
      <main className="relative isolate grid min-h-screen place-items-center px-6 py-[clamp(80px,12vw,160px)]">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <AuroraImage src="/contact/aurora-dark.webp" className="vv-aurora-dark absolute max-w-none -translate-x-1/2 -translate-y-1/2 rotate-45" style={{ height: "min(max(92.58vw, 100vh), 108vh)", width: "min(max(92.58vw, 100vh), 108vh)", left: "49.5vw", top: "50%", maskImage: "radial-gradient(closest-side, #000 55%, transparent 92%)", WebkitMaskImage: "radial-gradient(closest-side, #000 55%, transparent 92%)" }} />
          <AuroraImage src="/contact/aurora-light.webp" className="vv-aurora-light absolute max-w-none -translate-x-1/2 -translate-y-1/2 rotate-45" style={{ height: "min(max(92.58vw, 100vh), 108vh)", width: "min(max(92.58vw, 100vh), 108vh)", left: "49.5vw", top: "50%", maskImage: "radial-gradient(closest-side, #000 55%, transparent 92%)", WebkitMaskImage: "radial-gradient(closest-side, #000 55%, transparent 92%)" }} />
        </div>
        <div className="relative w-full max-w-[560px] rounded-[20px] border border-fg/12 bg-[var(--vv-glass-card)] px-8 py-10 text-center backdrop-blur-[12px]">
          <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px" style={{ background: "linear-gradient(90deg, transparent 0%, color-mix(in srgb, var(--vv-text-primary) 45%, transparent) 50%, transparent 100%)" }} />
          <HeadingReveal>
            <h1 className="font-display text-[clamp(38px,5vw,56px)] leading-[1.1] font-medium tracking-[-0.03em]">
              Thank You!
            </h1>
          </HeadingReveal>
          <p className="mx-auto mt-4 max-w-[420px] text-[16px] leading-[1.7] text-fg-muted">
            Your submission has been received. We will be in touch shortly via your preferred response method.
          </p>
          <Link href="/" className="mt-8 inline-flex h-[52px] w-full max-w-[420px] items-center justify-center rounded-full bg-fg text-[16px] font-medium text-bg transition-opacity hover:opacity-90">
            <RollText text="Back to Home" />
          </Link>
        </div>
      </main>
    </>
  );
}
