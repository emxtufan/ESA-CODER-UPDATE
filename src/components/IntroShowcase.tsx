import React from 'react';
import { INTRO_IMAGES } from '../data/siteData';

export const IntroShowcase: React.FC = () => {
  const images = [...INTRO_IMAGES, ...INTRO_IMAGES];

  return (
    <section id="about" aria-labelledby="intro-heading" className="relative isolate z-10 bg-[#030303] py-24 md:py-32 overflow-hidden">
      <div className="mx-auto max-w-[1440px] px-6 md:px-8">
        {/* Header copy */}
        <div className="mx-auto max-w-3xl text-center mb-16">
          <p className="text-xs uppercase font-mono tracking-[0.2em] text-[#777] mb-3">
            Our Studio Ethos
          </p>
          <h2 id="intro-heading" className="font-display text-[clamp(36px,5vw,64px)] font-medium leading-[1.08] tracking-[-0.035em] text-[#efefef]">
            Design that speaks.<br />
            <span className="text-[#888888]">Delivery that converts.</span>
          </h2>
          <p className="mt-6 text-base md:text-lg leading-[1.65] text-[#999999]">
            Visuvate crafts focused digital experiences that captivate audiences and drive growth.
            Every detail is considered, every interaction refined, and every deliverable built for lasting performance.
          </p>
        </div>

        {/* Gallery track slider */}
        <div
          className="relative overflow-hidden w-full py-4"
          style={{
            maskImage: 'linear-gradient(90deg, transparent 0%, #000 10%, #000 90%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(90deg, transparent 0%, #000 10%, #000 90%, transparent 100%)',
          }}
        >
          <div className="flex w-max gap-4 md:gap-6 animate-[ts-ticker_40s_linear_infinite] hover:[animation-play-state:paused]">
            {images.map((imgSrc, i) => (
              <div
                key={i}
                className="group relative h-[240px] sm:h-[320px] md:h-[400px] aspect-[4/3] shrink-0 overflow-hidden rounded-xl border border-[#222222] bg-[#111111] shadow-lg transition-transform duration-500 hover:scale-[1.02]"
              >
                <img
                  src={imgSrc}
                  alt={`Visuvate Work Showcase ${i + 1}`}
                  className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  loading="lazy"
                  decoding="async"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
