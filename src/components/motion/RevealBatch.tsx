import {useRef, type ReactNode} from 'react';
import gsap from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
import {useGSAP} from '@gsap/react';

gsap.registerPlugin(ScrollTrigger, useGSAP);

// module 3722
export default function RevealBatch({
  children,
  className,
  refresh,
  selector = '[data-reveal]',
  distance = 34,
  stagger = 0.1,
}: {
  children?: ReactNode;
  className?: string;
  refresh?: unknown;
  selector?: string;
  distance?: number;
  stagger?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const items = gsap.utils.toArray<HTMLElement>(selector, ref.current);
        if (!items.length) return;
        gsap.set(items, {y: distance, opacity: 0});
        const triggers = ScrollTrigger.batch(items, {
          start: 'top 92%',
          onEnter: (batch) =>
            gsap.to(batch, {
              y: 0,
              opacity: 1,
              duration: 0.7,
              ease: 'power3.out',
              stagger,
              overwrite: true,
              clearProps: 'transform,opacity',
            }),
        });
        return () => triggers.forEach((t) => t.kill());
      });
      return () => mm.revert();
    },
    {scope: ref, dependencies: [refresh, selector, distance, stagger]},
  );
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
