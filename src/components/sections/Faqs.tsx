// module 5540
import { useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

import {text} from '@/lib/text';
import {collection} from '@/lib/collections';

const $t = text("components/sections/Faqs");

gsap.registerPlugin(ScrollTrigger, useGSAP);

export default function Faqs() {
  const FAQS: {question: string; answer: string}[] = collection('faqs');
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
          {$t("frequently-asked")}<span className="vv-accent">{$t("questions")}</span>
        </h2>
        <div className="mx-auto mt-[70px] flex max-w-[880px] flex-col gap-3">
          {FAQS.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div key={index} data-faq-row className="rounded-[12px] border border-line px-4">
                <h3>
                  <button
                    type="button"
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                    aria-expanded={isOpen}
                    aria-controls={`faq-panel-${index}`}
                    className="group flex w-full cursor-pointer items-center gap-6 py-[13px] text-left"
                  >
                    <span className="flex-1 font-text text-[16px] leading-[1.8] font-normal text-fg-strong transition-colors group-hover:text-fg">
                      {index + 1}. {faq.question}
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
                    <p className="pr-10 pb-[18px] text-[16px] leading-[1.6] text-fg-muted">{faq.answer}</p>
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
