import React, { useState } from 'react';
import { Plus, Minus, HelpCircle } from 'lucide-react';
import { FAQS } from '../data/siteData';

export const Faqs: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faqs" className="relative z-10 bg-[#030303] py-24 md:py-32 border-t border-[#1a1a1a]">
      <div className="mx-auto max-w-[1440px] px-6 md:px-8">
        <div className="max-w-3xl mb-16">
          <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-[0.2em] text-[#777] mb-3">
            <HelpCircle className="size-3.5 text-blue-400" />
            <span>Clarity & Answers</span>
          </div>
          <h2 className="font-display text-[clamp(40px,5.5vw,72px)] font-medium leading-[1.05] tracking-[-0.04em] text-[#efefef]">
            Frequently Asked <br />
            <span className="text-[#888888]">Questions</span>
          </h2>
          <p className="mt-6 text-base md:text-lg leading-[1.65] text-[#999999]">
            Everything you need to know about partnering with Visuvate, our timelines, deliverables, and ongoing support.
          </p>
        </div>

        {/* FAQs Accordion */}
        <div className="max-w-4xl divide-y divide-[#1c1c1c] border-y border-[#1c1c1c]">
          {FAQS.map((faq, idx) => {
            const isOpen = openIndex === idx;

            return (
              <div key={idx} className="py-6 md:py-8">
                <button
                  type="button"
                  onClick={() => toggle(idx)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between text-left group cursor-pointer"
                >
                  <h3 className="font-display text-lg md:text-2xl font-medium text-[#efefef] group-hover:text-white transition-colors pr-6">
                    {faq.question}
                  </h3>
                  <div className="size-8 shrink-0 rounded-full border border-[#2a2a2a] bg-[#111] grid place-items-center text-[#888] group-hover:text-white group-hover:border-[#444] transition-all">
                    {isOpen ? <Minus className="size-4" /> : <Plus className="size-4" />}
                  </div>
                </button>

                {isOpen && (
                  <div className="mt-4 pt-2 text-sm md:text-base leading-[1.7] text-[#999999] max-w-3xl animate-in fade-in duration-300">
                    <p>{faq.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
