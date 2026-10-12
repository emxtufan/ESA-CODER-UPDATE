import AuroraImage from '@/components/AuroraImage';
import ContactForm from '@/components/contact/ContactForm';
import PageTitle from '@/components/PageTitle';
import Reveal from '@/components/motion/Reveal';

import {text} from '@/lib/text';

const $t = text("/contact");

// Converted 1:1 from the RSC payload of /contact.
export default function Page_contact() {
  return (
    <>
      <main className="relative isolate">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: "{\"@context\":\"https://schema.org\",\"@type\":\"BreadcrumbList\",\"itemListElement\":[{\"@type\":\"ListItem\",\"position\":1,\"name\":\"Home\",\"item\":\"https://visuvate.com/\"},{\"@type\":\"ListItem\",\"position\":2,\"name\":\"Contact\",\"item\":\"https://visuvate.com/contact\"}]}" }} />
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <AuroraImage src="/contact/aurora-dark.webp" className="vv-aurora-dark absolute max-w-none -translate-x-1/2 -translate-y-1/2 rotate-45" style={{ height: "min(max(92.58vw, 100vh), 1400px)", width: "min(max(92.58vw, 100vh), 1400px)", left: "49.5vw", top: "max(668px, calc(0.46 * min(max(92.58vw, 100vh), 1400px)))", maskImage: "radial-gradient(closest-side, #000 55%, transparent 92%)", WebkitMaskImage: "radial-gradient(closest-side, #000 55%, transparent 92%)" }} />
          <AuroraImage src="/contact/aurora-light.webp" className="vv-aurora-light absolute max-w-none -translate-x-1/2 -translate-y-1/2 rotate-45" style={{ height: "min(max(92.58vw, 100vh), 1400px)", width: "min(max(92.58vw, 100vh), 1400px)", left: "49.5vw", top: "max(668px, calc(0.46 * min(max(92.58vw, 100vh), 1400px)))", maskImage: "radial-gradient(closest-side, #000 55%, transparent 92%)", WebkitMaskImage: "radial-gradient(closest-side, #000 55%, transparent 92%)" }} />
        </div>
        <PageTitle lead={$t("let-s")} trail={$t("connect")} />
        <section className="mx-auto max-w-[1425px] -mt-[7px] px-6 pb-[clamp(80px,10vw,140px)] md:px-8">
          <div className="grid gap-x-[65px] gap-y-14 lg:mx-auto lg:w-fit lg:grid-cols-[450px_auto]">
            <Reveal className="relative rounded-[20px] border border-fg/12 bg-[var(--vv-glass-card)] backdrop-blur-[12px] p-6 lg:justify-self-start lg:w-[498px]">
              <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px" style={{ background: "linear-gradient(90deg, transparent 0%, color-mix(in srgb, var(--vv-text-primary) 45%, transparent) 50%, transparent 100%)" }} />
              <div data-reveal className="mb-[16px]">
                <svg viewBox="0 0 24 24" className="size-7 text-fg" fill="currentColor" aria-hidden>
                  <path d="M2 5.5A2.5 2.5 0 0 1 4.5 3h10A2.5 2.5 0 0 1 17 5.5v5A2.5 2.5 0 0 1 14.5 13H8l-4 3v-3H4.5A2.5 2.5 0 0 1 2 10.5v-5Z" />
                  <path d="M19 8h.5A2.5 2.5 0 0 1 22 10.5v5A2.5 2.5 0 0 1 19.5 18H19v3l-3.2-3h-3.3a2.5 2.5 0 0 1-2.2-1.3h4.7A4.5 4.5 0 0 0 19 12.2V8Z" />
                </svg>
              </div>
              <h2 data-reveal className="font-display text-[24px] leading-[1.2] font-medium tracking-[-0.02em]">
                {$t("start-your-project")}
              </h2>
              <p data-reveal className="mt-[5px] max-w-[300px] font-display text-[24px] leading-[1.2] font-medium tracking-[-0.02em] text-fg-muted">
                {$t("let-us-know-how-we-can")}
              </p>
              <div data-reveal className="mt-[25px]">
                <ContactForm />
              </div>
            </Reveal>
            <Reveal className="relative rounded-[20px] border border-fg/12 bg-[var(--vv-glass-card)] backdrop-blur-[12px] flex h-fit flex-col gap-[30px] px-4 py-5 lg:sticky lg:top-[104px]">
              <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px" style={{ background: "linear-gradient(90deg, transparent 0%, color-mix(in srgb, var(--vv-text-primary) 45%, transparent) 50%, transparent 100%)" }} />
              <div data-reveal className="flex flex-col gap-[10px] text-[14px] leading-[1]">
                <svg viewBox="0 0 24 24" className="size-[18px] text-fg" fill="currentColor" aria-hidden>
                  <path d="M2 6.2A1.2 1.2 0 0 1 3.2 5h17.6A1.2 1.2 0 0 1 22 6.2l-10 6.1L2 6.2Z" />
                  <path d="M22 8.5V17.8a1.2 1.2 0 0 1-1.2 1.2H3.2A1.2 1.2 0 0 1 2 17.8V8.5l10 6.1 10-6.1Z" />
                </svg>
                <a href="mailto:contact@visuvate.com" aria-label={$t("email")} className="w-fit text-[14px] leading-[1] text-fg-muted transition-colors hover:text-fg">
                  {$t("contact-visuvate-com")}
                </a>
              </div>
              <div data-reveal className="flex flex-col gap-[10px] text-[14px] leading-[1]">
                <svg viewBox="0 0 24 24" className="size-[18px] text-fg" fill="currentColor" aria-hidden>
                  <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.6-6.1c-.3-.1-1.6-.8-1.8-.9s-.4-.1-.6.1-.7.9-.8 1-.3.2-.5 0a6.7 6.7 0 0 1-2-1.2 7.4 7.4 0 0 1-1.4-1.7c-.1-.3 0-.4.1-.5l.4-.5.3-.4v-.5l-.8-1.9c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4 7.6 7.6 0 0 0 3.1.8 2.7 2.7 0 0 0 1.8-1.3 2.2 2.2 0 0 0 .2-1.3c-.1-.1-.3-.2-.5-.3Z" />
                </svg>
                <a href="tel:+919278388499" aria-label={$t("phone")} className="w-fit text-[14px] leading-[1] text-fg-muted transition-colors hover:text-fg">
                  {"+91 9278388499"}
                </a>
              </div>
              <div data-reveal className="flex flex-col gap-[10px] text-[14px] leading-[1]">
                <svg viewBox="0 0 24 24" className="size-[18px] text-fg" fill="currentColor" aria-hidden>
                  <path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 14.5 9 2.5 2.5 0 0 1 12 11.5Z" />
                </svg>
                <span className="text-[14px] leading-[1] text-fg-muted">
                  {$t("india-working-globally")}
                </span>
              </div>
            </Reveal>
          </div>
        </section>
      </main>
    </>
  );
}
