import React, { useState } from 'react';
import { Sparkles, Layers, ArrowRight, Check } from 'lucide-react';
import { SERVICES_LIST, PLATFORMS_DATA } from '../data/siteData';

interface ServicesProps {
  onOpenContact: () => void;
}

export const Services: React.FC<ServicesProps> = ({ onOpenContact }) => {
  const [activePlatform, setActivePlatform] = useState<string>('Framer');

  return (
    <section id="services" className="relative z-10 bg-[#030303] py-24 md:py-32 border-t border-[#1a1a1a]">
      <div className="mx-auto max-w-[1440px] px-6 md:px-8">
        {/* Section 1: Services List */}
        <div className="max-w-3xl mb-16">
          <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-[0.2em] text-[#777] mb-3">
            <Layers className="size-3.5 text-blue-400" />
            <span>End-to-End Capabilities</span>
          </div>
          <h2 className="font-display text-[clamp(40px,5.5vw,72px)] font-medium leading-[1.05] tracking-[-0.04em] text-[#efefef]">
            Elevate your <br />
            <span className="text-[#888888]">digital footprint.</span>
          </h2>
          <p className="mt-6 text-base md:text-lg leading-[1.65] text-[#999999]">
            We build holistic digital platforms from concept to launch. Design systems, fluid micro-interactions, responsive development, and scalable CMS architectures.
          </p>
        </div>

        {/* Interactive service tags showcase */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-24">
          {SERVICES_LIST.map((service, index) => (
            <div
              key={service}
              onClick={onOpenContact}
              className="group flex items-center justify-between p-5 rounded-xl border border-[#202020] bg-[#090909] hover:bg-[#121212] hover:border-[#383838] transition-all duration-300 cursor-pointer shadow-sm"
            >
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs text-[#555] group-hover:text-blue-400 transition-colors">
                  0{index + 1}
                </span>
                <span className="text-sm font-medium text-[#dfdfdf] group-hover:text-white transition-colors">
                  {service}
                </span>
              </div>
              <ArrowRight className="size-4 text-[#555] group-hover:text-white group-hover:translate-x-1 transition-all" />
            </div>
          ))}
        </div>

        {/* Section 2: Platform Flexibility with Starfield Video */}
        <div className="relative rounded-3xl border border-[#222222] bg-[#070707] overflow-hidden p-8 md:p-14 lg:p-16">
          {/* Background Starfield Video */}
          <div className="absolute inset-0 -z-10 overflow-hidden opacity-40">
            <video
              src="/platform-starfield.mp4"
              autoPlay
              loop
              muted
              playsInline
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#070707] via-[#070707]/60 to-[#070707]" />
          </div>

          <div className="relative z-10 max-w-3xl mb-12">
            <span className="text-xs font-mono uppercase tracking-[0.2em] text-[#888] mb-2 block">
              Ecosystem Agnostic
            </span>
            <h3 className="font-display text-[clamp(32px,4vw,56px)] font-medium leading-[1.1] tracking-[-0.035em] text-[#efefef]">
              Platform flexibility.<br />
              <span className="text-[#888888]">Design consistency.</span>
            </h3>
            <p className="mt-4 text-sm md:text-base leading-[1.6] text-[#aaaaaa]">
              We adapt to your team's workflow and existing tech stack. Whether you require the rapid visual precision of Framer, the robust enterprise power of Webflow, or custom React applications, our craft remains uncompromised.
            </p>
          </div>

          {/* Platforms Grid */}
          <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {PLATFORMS_DATA.map((plat) => {
              const isSelected = activePlatform === plat.name;
              return (
                <div
                  key={plat.name}
                  onClick={() => setActivePlatform(plat.name)}
                  className={`group relative flex flex-col justify-between p-6 rounded-2xl border transition-all duration-300 cursor-pointer backdrop-blur-md ${
                    isSelected
                      ? 'border-[#444444] bg-[#141414]/90 shadow-[0_12px_40px_rgba(0,0,0,0.8)]'
                      : 'border-[#1e1e1e] bg-[#0e0e0e]/80 hover:border-[#303030] hover:bg-[#121212]/80'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <div className="h-7 w-auto flex items-center">
                        <img
                          src={plat.logo}
                          alt={plat.name}
                          className="h-6 w-auto object-contain"
                          loading="lazy"
                        />
                      </div>
                      <span className="rounded-full bg-[#1e1e1e] border border-[#2e2e2e] px-2.5 py-0.5 text-[10px] font-mono uppercase tracking-wider text-[#bbb]">
                        {plat.badge}
                      </span>
                    </div>

                    <h4 className="font-display text-lg font-medium text-white mb-2">
                      {plat.name}
                    </h4>
                    <p className="text-xs leading-[1.6] text-[#8e8e8e]">
                      {plat.description}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-[#1c1c1c] flex items-center justify-between text-xs text-[#777]">
                    <span className="flex items-center gap-1.5 text-emerald-400">
                      <Check className="size-3" /> Fully Supported
                    </span>
                    <span className="group-hover:text-white transition-colors">Select Stack</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
