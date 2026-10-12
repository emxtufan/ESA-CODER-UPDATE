import React from 'react';
import { TECH_STACK } from '../data/siteData';

export const TechStack: React.FC = () => {
  // Duplicate for seamless infinite loop
  const logos = [...TECH_STACK, ...TECH_STACK, ...TECH_STACK];

  return (
    <section aria-label="Tools and platforms we build with" className="py-12 md:py-16 overflow-hidden border-y border-[#181818] bg-[#050505]">
      <div className="mx-auto max-w-[1440px] px-6 md:px-8 mb-6 text-center">
        <p className="text-xs uppercase font-mono tracking-[0.2em] text-[#666]">
          Engineered With Leading Industry Tools & Frameworks
        </p>
      </div>

      <div
        className="relative overflow-hidden w-full"
        style={{
          maskImage: 'linear-gradient(90deg, transparent 0%, #000 15%, #000 85%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(90deg, transparent 0%, #000 15%, #000 85%, transparent 100%)',
        }}
      >
        <div className="ts-ticker flex w-max gap-12 md:gap-16 items-center">
          {logos.map((item, index) => (
            <div
              key={`${item.name}-${index}`}
              className="flex shrink-0 items-center justify-center opacity-65 hover:opacity-100 transition-opacity duration-300 filter grayscale hover:grayscale-0"
            >
              <img
                src={item.logo}
                alt={item.name}
                className="h-6 md:h-7 w-auto select-none object-contain"
                loading="lazy"
                decoding="async"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
