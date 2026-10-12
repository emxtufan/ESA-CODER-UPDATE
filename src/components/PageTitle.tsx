// module 6598
import { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import HeadingReveal from '@/components/motion/HeadingReveal';

gsap.registerPlugin(ScrollTrigger, useGSAP);

export default function PageTitle({ lead, trail, children }: any) {
  const headerRef = useRef<HTMLElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(
        {
          mobile: '(prefers-reduced-motion: no-preference) and (max-width: 767px)',
          desktop: '(prefers-reduced-motion: no-preference) and (min-width: 768px)',
        },
        (context) => {
          const { mobile } = context.conditions as any;
          gsap.to(innerRef.current, {
            y: mobile ? 78 : 230,
            ease: 'none',
            scrollTrigger: {
              trigger: headerRef.current,
              start: 'top top',
              end: 'bottom top',
              scrub: true,
              invalidateOnRefresh: true,
            },
          });
        },
      );
      return () => mm.revert();
    },
    { scope: headerRef },
  );
  return (
    <header
      ref={headerRef}
      className="relative z-0 mx-auto max-w-[1425px] px-6 pt-[clamp(132px,11vw,150px)] pb-[clamp(40px,5vw,70px)] md:px-8"
    >
      <div ref={innerRef} className="will-change-transform">
        <HeadingReveal>
          <h1 className="text-center font-display text-[clamp(58px,11.2vw,160px)] leading-[1] font-medium tracking-[-0.05em]">
            {lead}
            <span className="vv-accent" style={/\s$/.test(lead) ? undefined : { marginLeft: '0.06em' }}>
              {trail}
            </span>
          </h1>
        </HeadingReveal>
        {children}
      </div>
    </header>
  );
}
