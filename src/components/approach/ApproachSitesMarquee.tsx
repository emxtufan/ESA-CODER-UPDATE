// module 6057
import { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger, useGSAP);

const SITES = [
  '/Proiecte/teamstoica.ro.png',
  '/Proiecte/xelle.ro.png',
  '/Proiecte/beautyvilla.ro.png',
  '/Proiecte/greentechpro.png',
  '/Proiecte/greentechcharity.ro.png',
];
const DOTS = ['#ff5f57', '#febc2e', '#28c840'];

export default function ApproachSitesMarquee() {
  const trackRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.fromTo(
          trackRef.current,
          { x: 210 },
          {
            x: -210,
            ease: 'none',
            scrollTrigger: {
              trigger: trackRef.current,
              start: 'top bottom',
              end: 'bottom top',
              scrub: 0.6,
            },
          },
        );
      });
      return () => mm.revert();
    },
    { scope: trackRef },
  );

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute top-[168px] left-[-150px] origin-top-left scale-[0.5] lg:top-[219px] lg:left-[-472px] lg:scale-100"
    >
      <div ref={trackRef} className="flex will-change-transform" style={{ gap: 20 }}>
        {SITES.map((site) => (
          <div
            key={site}
            className="shrink-0 overflow-hidden rounded-[7px] bg-black"
            style={{ width: 524, height: 524 * 9 / 16, boxShadow: '0 6px 12px 6px rgba(0, 0, 0, 0.1)' }}
          >
            <div className="flex items-center gap-[5px] pl-[10px]" style={{ height: 18 }}>
              {DOTS.map((color) => (
                <span key={color} className="size-[7px] rounded-full" style={{ background: color }} />
              ))}
            </div>
            <img
              src={`${site}?w=828`}
              alt=""
              width={524}
              height={277}
              loading="lazy"
              decoding="async"
              className="block w-full object-cover object-top"
              style={{ height: 'calc(100% - 18px)' }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
