import React, { useState } from 'react';
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import { TESTIMONIALS } from '../data/siteData';

export const Testimonials: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const prev = () => {
    setCurrentIndex((c) => (c === 0 ? TESTIMONIALS.length - 1 : c - 1));
  };

  const next = () => {
    setCurrentIndex((c) => (c === TESTIMONIALS.length - 1 ? 0 : c + 1));
  };

  const activeTestimonial = TESTIMONIALS[currentIndex];

  return (
    <section id="testimonials" className="relative z-10 bg-[#030303] py-24 md:py-32 border-t border-[#1a1a1a]">
      <div className="mx-auto max-w-[1440px] px-6 md:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-[0.2em] text-[#777] mb-3">
              <Quote className="size-3.5 text-blue-400" />
              <span>Client Voices</span>
            </div>
            <h2 className="font-display text-[clamp(40px,5.5vw,72px)] font-medium leading-[1] tracking-[-0.04em] text-[#efefef]">
              Testimonials
            </h2>
          </div>

          {/* Slider navigation */}
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs text-[#777] mr-2">
              0{currentIndex + 1} / 0{TESTIMONIALS.length}
            </span>
            <button
              onClick={prev}
              aria-label="Previous testimonial"
              className="grid size-10 place-items-center rounded-full border border-[#2a2a2a] bg-[#111] text-white hover:border-[#444] hover:bg-[#1a1a1a] transition-all cursor-pointer"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              onClick={next}
              aria-label="Next testimonial"
              className="grid size-10 place-items-center rounded-full border border-[#2a2a2a] bg-[#111] text-white hover:border-[#444] hover:bg-[#1a1a1a] transition-all cursor-pointer"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>

        {/* Featured Testimonial Card */}
        <div className="relative rounded-3xl border border-[#222222] bg-[#090909] p-8 md:p-14 lg:p-16 shadow-[0_24px_80px_rgba(0,0,0,0.8)] overflow-hidden">
          <div className="flex items-center gap-1.5 text-amber-400 mb-8">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="size-4 fill-current" />
            ))}
          </div>

          <blockquote className="font-display text-xl sm:text-2xl md:text-3xl lg:text-4xl font-normal leading-[1.3] text-[#efefef] mb-12">
            "{activeTestimonial.quote}"
          </blockquote>

          <div className="flex items-center gap-4 pt-6 border-t border-[#1c1c1c]">
            <img
              src={activeTestimonial.avatar}
              alt={activeTestimonial.author}
              className="size-14 rounded-full object-cover border border-white/10"
              loading="lazy"
            />
            <div>
              <div className="font-display text-base font-semibold text-white">
                {activeTestimonial.author}
              </div>
              <div className="text-xs text-[#888888]">
                {activeTestimonial.role}
              </div>
            </div>
          </div>
        </div>

        {/* Testimonials 3-Card Summary Strip below */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          {TESTIMONIALS.map((t, idx) => (
            <div
              key={t.id}
              onClick={() => setCurrentIndex(idx)}
              className={`p-6 rounded-2xl border transition-all cursor-pointer ${
                currentIndex === idx
                  ? 'border-blue-500/50 bg-[#12141c]'
                  : 'border-[#1e1e1e] bg-[#080808] hover:border-[#2a2a2a]'
              }`}
            >
              <p className="text-xs text-[#aaa] line-clamp-3 mb-4">
                "{t.quote}"
              </p>
              <div className="flex items-center gap-3">
                <img
                  src={t.avatar}
                  alt={t.author}
                  className="size-8 rounded-full object-cover"
                />
                <div>
                  <div className="text-xs font-semibold text-white">{t.author}</div>
                  <div className="text-[10px] text-[#666]">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
