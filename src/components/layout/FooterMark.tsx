import {useRef} from 'react';
import gsap from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
import {useGSAP} from '@gsap/react';

gsap.registerPlugin(ScrollTrigger, useGSAP);

// module 5144
export default function FooterMark() {
  const ref = useRef<HTMLImageElement>(null);
  useGSAP(() => {
    const el = ref.current;
    const trigger = el?.parentElement;
    if (!el || !trigger) return;
    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.fromTo(el, {
        '--vv-footer-reveal': 0,
      }, {
        '--vv-footer-reveal': 1,
        ease: 'none',
        scrollTrigger: {
          trigger,
          start: 'clamp(top 90%)',
          end: 'clamp(top 70%)',
          scrub: 0.7,
          invalidateOnRefresh: true,
        },
      });
    });
    return () => mm.revert();
  }, {scope: ref});
  return (
    <img
      ref={ref}
      src="/brand/esa-coder-solutions-lockup-transparent.png"
      width={1800}
      height={900}
      alt=""
      aria-hidden
      className="vv-platform-logo vv-footer-mark pointer-events-none absolute top-0 left-1/2 -z-10 max-w-none"
      loading="lazy"
      decoding="async"
    />
  );
}
