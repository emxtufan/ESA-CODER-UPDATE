// module 1357
import { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger, useGSAP);

const LID = { left: -9, top: 201, width: 719 };
const SCREEN = { left: 67, top: 28, width: 604, height: 371 };

export default function Laptop() {
  const rootRef = useRef<HTMLDivElement>(null);
  const lidRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.fromTo(
          lidRef.current,
          { rotateX: -19 },
          {
            rotateX: 0,
            ease: 'none',
            scrollTrigger: {
              trigger: rootRef.current,
              start: 'top bottom',
              end: 'top 60%',
              scrub: 0.5,
            },
          },
        );
      });
      return () => mm.revert();
    },
    { scope: rootRef },
  );

  return (
    <div ref={rootRef} className="group/laptop pointer-events-none absolute inset-0">
      <div className="absolute" style={{ ...LID, height: 421, perspective: '900px' }}>
        <div
          ref={lidRef}
          className="absolute inset-0 will-change-transform"
          style={{ transformOrigin: '50% 100%' }}
        >
          <div className="absolute overflow-hidden" style={SCREEN}>
            <img
              src="/approach/dashboard.webp"
              alt=""
              className="absolute top-0 max-w-none transition-transform duration-500 ease-brand group-hover/laptop:translate-x-(--vv-reveal)"
              style={{ left: -95, width: 700, '--vv-reveal': '100px' } as any}
              loading="lazy"
              decoding="async"
            />
            <img
              src="/approach/rail.webp"
              alt=""
              className="absolute top-[1px] left-0"
              style={{ width: 33.95931142410016 }}
              loading="lazy"
              decoding="async"
            />
          </div>
          <img
            src="/approach/laptop-lid.webp"
            alt=""
            className="absolute inset-0 h-full w-full"
            loading="lazy"
            decoding="async"
          />
        </div>
      </div>
      <img
        src="/approach/laptop-base.webp"
        alt=""
        className="absolute max-w-none"
        style={{ left: LID.left, top: LID.top + 421, width: LID.width, height: 29 }}
        loading="lazy"
        decoding="async"
      />
      <span aria-hidden className="pointer-events-auto absolute" style={{ ...LID, height: 450 }} />
    </div>
  );
}
