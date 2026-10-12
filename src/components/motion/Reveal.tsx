import {useRef, type ReactNode} from 'react';
import gsap from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
import {useGSAP} from '@gsap/react';

gsap.registerPlugin(ScrollTrigger, useGSAP);

// module 7649
export default function Reveal({
  children,
  className,
  y = 26,
  stagger = 0.09,
  start = 'top 80%',
  duration = 0.75,
  refreshOnComplete = false,
}: {
  children?: ReactNode;
  className?: string;
  y?: number;
  stagger?: number;
  start?: string;
  duration?: number;
  refreshOnComplete?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const items = gsap.utils.toArray<HTMLElement>('[data-reveal]', ref.current);
        if (!items.length) return;
        gsap.from(items, {
          y,
          opacity: 0,
          duration,
          ease: 'power3.out',
          stagger,
          scrollTrigger: {trigger: ref.current, start},
          clearProps: 'transform,opacity',
          onComplete: refreshOnComplete ? () => ScrollTrigger.refresh() : undefined,
        });
      });
      return () => mm.revert();
    },
    {scope: ref},
  );
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
