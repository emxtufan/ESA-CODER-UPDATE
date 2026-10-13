// module 2603
import { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);

// `scroll`: play when the heading scrolls into view instead of on load (for headings further down a page).
export default function HeadingReveal({ children, className, scroll = false }: { children?: any; className?: string; scroll?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      const heading = ref.current?.querySelector('h1, h2');
      if (!heading) return;
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.set(heading, { autoAlpha: 0 });
        let split: any = null;
        let cancelled = false;
        document.fonts.ready.then(() => {
          !cancelled &&
            ref.current &&
            (heading.setAttribute('aria-label', heading.textContent?.trim() ?? ''),
            (split = SplitText.create(heading, {
              type: 'words,chars',
              aria: 'none',
              tag: 'span',
            })),
            gsap.set(heading, { autoAlpha: 1 }),
            gsap.from(split.chars, {
              opacity: 0,
              yPercent: 45,
              filter: 'blur(7px)',
              duration: 0.7,
              stagger: 0.017,
              delay: 0.1,
              ease: 'power2.out',
              scrollTrigger: scroll ? { trigger: heading, start: 'top 85%' } : undefined,
              onComplete: () => split?.revert(),
            }));
        });
        return () => {
          cancelled = true;
          split?.revert();
        };
      });
      return () => mm.revert();
    },
    { scope: ref },
  );
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
