import React, { useState } from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import { APPROACH_STEPS } from '../data/siteData';

export const OurApproach: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);

  return (
    <section id="approach" className="relative z-10 bg-[#030303] py-24 md:py-32 border-t border-[#1a1a1a]">
      <div className="mx-auto max-w-[1440px] px-6 md:px-8">
        {/* Section Heading */}
        <div className="max-w-3xl mb-16">
          <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-[0.2em] text-[#777] mb-3">
            <Sparkles className="size-3.5 text-blue-400" />
            <span>Methodology</span>
          </div>
          <h2 className="font-display text-[clamp(40px,5.5vw,72px)] font-medium leading-[1.05] tracking-[-0.04em] text-[#efefef]">
            Our <span className="text-[#ffffff] underline decoration-blue-500/40 decoration-1 underline-offset-8">Approach</span>
          </h2>
          <p className="mt-6 text-base md:text-lg leading-[1.65] text-[#999999]">
            A methodical six-phase process engineered to eliminate ambiguity, accelerate delivery, and ensure your website achieves real, measurable business outcomes.
          </p>
        </div>

        {/* 6 Step Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {APPROACH_STEPS.map((step, idx) => (
            <div
              key={step.number}
              onMouseEnter={() => setActiveStep(idx)}
              className={`group relative flex flex-col justify-between rounded-2xl border p-6 md:p-8 transition-all duration-500 overflow-hidden ${
                activeStep === idx
                  ? 'border-[#383838] bg-[#0c0c0c] shadow-[0_20px_50px_rgba(0,0,0,0.8)]'
                  : 'border-[#1e1e1e] bg-[#080808] hover:border-[#2e2e2e]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-6">
                  <span className="font-mono text-2xl font-light text-[#555] group-hover:text-blue-400 transition-colors">
                    {step.number}
                  </span>
                  <div className="h-1.5 w-1.5 rounded-full bg-[#333] group-hover:bg-blue-500 transition-colors" />
                </div>

                {/* Step visual artifact image */}
                <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl border border-[#222] bg-[#111] mb-6">
                  <img
                    src={step.image}
                    alt={step.title}
                    className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                </div>

                <h3 className="font-display text-xl font-medium text-white mb-3">
                  {step.title}
                </h3>

                <p className="text-xs leading-[1.65] text-[#8e8e8e]">
                  {step.description}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-[#181818] flex items-center justify-between text-[11px] font-mono text-[#555] group-hover:text-[#888]">
                <span>Phase {step.number} / 06</span>
                <ArrowRight className="size-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
