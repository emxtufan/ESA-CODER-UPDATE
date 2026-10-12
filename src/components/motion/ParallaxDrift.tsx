// module 2749
import { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger, useGSAP);

export default function ParallaxDrift({
  children,
  className,
  drift = 95,
  smooth = 1,
}: {
  children?: any;
  className?: string;
  drift?: number;
  smooth?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const trigger = ref.current?.parentElement ?? ref.current;
        gsap.to(ref.current, {
          y: drift,
          ease: 'none',
          scrollTrigger: {
            trigger,
            start: 'top top',
            end: 'bottom top',
            scrub: smooth,
            invalidateOnRefresh: true,
          },
        });
      });
      document.fonts?.ready.then(() => ScrollTrigger.refresh());
      return () => mm.revert();
    },
    { scope: ref, dependencies: [drift, smooth] },
  );
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
