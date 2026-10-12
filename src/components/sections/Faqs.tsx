// module 5540
import { useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

const FAQS = [
  {
    q: 'How do I get started with Visuvate?',
    a: 'Simply fill out the contact form, and we’ll reach out through email or WhatsApp based on your preferred method of communication.',
  },
  {
    q: 'How involved do I need to be during the project?',
    a: 'You only need to share your content, preferences, and feedback at important stages. We handle the complete design, development, testing, and launch process.',
  },
  {
    q: 'How long does it take to build a website?',
    a: 'Most websites are completed within 2–6 weeks, depending on the number of pages, design direction, and required features.',
  },
  {
    q: 'Do you provide support after the website is launched?',
    a: 'Yes. We offer post-launch maintenance, content updates, and technical support to ensure your website continues to perform well.',
  },
  {
    q: 'Do you create responsive and eCommerce websites?',
    a: 'Absolutely. Every site we build is fully responsive, and we also develop complete eCommerce stores with payment integration and custom product layouts.',
  },
  {
    q: 'Do you work with international clients?',
    a: 'Yes — most of our work is international. Visuvate serves clients across the United States, United Kingdom, Europe, the Middle East and worldwide, working across time zones with updates over email or WhatsApp.',
  },
];

gsap.registerPlugin(ScrollTrigger, useGSAP);

export default function Faqs() {
  const sectionRef = useRef<HTMLElement>(null);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.from('[data-faq-row]', {
          y: 26,
          opacity: 0,
          duration: 0.7,
          ease: 'power3.out',
          stagger: 0.08,
          scrollTrigger: { trigger: sectionRef.current, start: 'top 72%' },
        });
      });
      return () => mm.revert();
    },
    { scope: sectionRef },
  );

  return (
    <section ref={sectionRef} id="faqs" className="bg-bg py-[clamp(80px,9vw,120px)]">
      <div className="mx-auto max-w-[1380px] px-6 md:px-8">
        <h2 className="text-center font-display text-[clamp(38px,5vw,72px)] leading-[1] font-medium tracking-[-0.05em]">
          Frequently Asked <span className="vv-accent">Questions</span>
        </h2>
        <div className="mx-auto mt-[70px] flex max-w-[880px] flex-col gap-3">
          {FAQS.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div key={faq.q} data-faq-row className="rounded-[12px] border border-line px-4">
                <h3>
                  <button
                    type="button"
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                    aria-expanded={isOpen}
                    aria-controls={`faq-panel-${index}`}
                    className="group flex w-full cursor-pointer items-center gap-6 py-[13px] text-left"
                  >
                    <span className="flex-1 font-text text-[16px] leading-[1.8] font-normal text-fg-strong transition-colors group-hover:text-fg">
                      {index + 1}. {faq.q}
                    </span>
                    <svg
                      viewBox="0 0 24 24"
                      className={`size-[10px] shrink-0 text-fg-muted transition-transform duration-500 ease-brand ${isOpen ? '-rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden
                    >
                      <path d="m2 7 10 10L22 7" />
                    </svg>
                  </button>
                </h3>
                <div
                  id={`faq-panel-${index}`}
                  role="region"
                  className={`grid transition-[grid-template-rows,opacity] duration-500 ease-brand ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
                >
                  <div className="overflow-hidden">
                    <p className="pr-10 pb-[18px] text-[16px] leading-[1.6] text-fg-muted">{faq.a}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
