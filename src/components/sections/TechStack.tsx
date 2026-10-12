// module 8447
import {useRef} from 'react';
import gsap from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
import {useGSAP} from '@gsap/react';

import {text} from '@/lib/text';

const $t = text("components/sections/TechStack");

gsap.registerPlugin(ScrollTrigger, useGSAP);

const LOGOS = [
  {name: $t("wix-studio"), src: '/tech/wix-studio.webp', w: 720},
  {name: $t("notion"), src: '/tech/notion.webp', w: 348},
  {name: $t("figma"), src: '/tech/figma.webp', w: 433},
  {name: $t("adobe"), src: '/tech/adobe.webp', w: 455},
  {name: $t("claude"), src: '/tech/claude.svg', w: 550},
  {name: $t("framer"), src: '/tech/framer.svg', w: 446},
  {name: $t("blender"), src: '/tech/blender.webp', w: 447},
  {name: $t("google-analytics"), src: '/tech/analytics.webp', w: 489},
];

const MASK = 'linear-gradient(90deg, transparent, #000 10%, #000 90%, transparent)';

export default function TechStack() {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
        gsap.from('.ts-logo', {
          opacity: 0,
          y: 14,
          duration: 0.7,
          ease: 'power3.out',
          stagger: 0.05,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 88%',
            once: true,
          },
        });
    },
    {scope: sectionRef},
  );

  return (
    <section
      ref={sectionRef}
      aria-label={$t("tools-and-platforms-we-build-with")}
      className="px-6 py-[clamp(40px,5vw,72px)] md:px-8"
    >
      <div
        className="relative overflow-hidden sm:hidden"
        style={{maskImage: MASK, WebkitMaskImage: MASK}}
      >
        <div className="ts-ticker flex w-max gap-[52px]">
          {[0, 1].map((copy) => (
            <div
              key={copy}
              className="flex shrink-0 items-center gap-[52px]"
              aria-hidden={1 === copy}
            >
              {LOGOS.map((logo) => (
                <img
                  key={logo.name}
                  src={logo.src}
                  alt={0 === copy ? logo.name : ''}
                  width={Math.round((22 * logo.w) / 120)}
                  height={22}
                  loading="lazy"
                  decoding="async"
                  className="tech-logo max-w-none shrink-0 select-none"
                  style={{display: 'block', height: 22, width: 'auto'}}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="mx-auto hidden w-full max-w-[560px] grid-cols-2 items-center justify-items-center gap-y-[29px] sm:grid sm:grid-cols-4">
        {LOGOS.map((logo, index) => {
          const col = index % 4;
          return (
            <img
              key={logo.name}
              src={logo.src}
              alt={logo.name}
              width={Math.round((22 * logo.w) / 120)}
              height={22}
              loading="lazy"
              decoding="async"
              className={`ts-logo tech-logo select-none ${0 === col ? 'sm:justify-self-start' : 3 === col ? 'sm:justify-self-end' : 'sm:justify-self-center'}`}
              style={{display: 'block', height: 22, width: 'auto'}}
            />
          );
        })}
      </div>
    </section>
  );
}
