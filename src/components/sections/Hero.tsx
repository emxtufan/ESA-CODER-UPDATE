// module 1659
import {useRef} from 'react';
import gsap from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
import {SplitText} from 'gsap/SplitText';
import {useGSAP} from '@gsap/react';
import Link from '@/components/Link';
import RollText from '@/components/RollText';
import Badge from '@/components/hero/Badge';
import GradientBars from '@/components/hero/GradientBars';
import Studio from '@/components/hero/Studio';

import {text} from '@/lib/text';

const $t = text("components/sections/Hero");

gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);

// True until the first hero intro has been handled
let firstRun = true;

export default function Hero({projects}: {projects: any[]}) {
  const sectionRef = useRef<HTMLElement>(null);
  useGSAP(
    () => {
      // phones (touch or a phone-sized screen) skip the intro: the page shows at once
      if (window.matchMedia('(pointer: coarse), (max-width: 639px)').matches) {
        firstRun = false;
        document.documentElement.removeAttribute('data-intro');
        document.documentElement.setAttribute('data-hero-ready', '');
        window.dispatchEvent(new Event('vv:hero-ready'));
        return;
      }
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const skipIntro =
          firstRun &&
          !!sectionRef.current &&
          'visible' === getComputedStyle(sectionRef.current).visibility &&
          document.documentElement.hasAttribute('data-intro');
        firstRun = false;
        if (skipIntro) {
          document.documentElement.removeAttribute('data-intro');
          document.documentElement.setAttribute('data-hero-ready', '');
          window.dispatchEvent(new Event('vv:hero-ready'));
          return;
        }
        gsap.set('.hh-line', {autoAlpha: 0});
        gsap
          .timeline({
            delay: 0.1,
            defaults: {ease: 'power3.out'},
            onComplete: () => {
              document.documentElement.setAttribute('data-hero-ready', '');
              window.dispatchEvent(new Event('vv:hero-ready'));
            },
          })
          .from('.hh-badge', {opacity: 0, y: 16, duration: 0.6})
          .from('.hh-sub, .hh-ctas', {opacity: 0, y: 20, duration: 0.8, stagger: 0.1}, 0.55)
          .fromTo('.hh-editor', {opacity: 0}, {opacity: 1, duration: 0.5, ease: 'power1.out'}, 0.75)
          .fromTo(
            '.hh-editor',
            {
              y: 72,
              scale: 0.985,
              transformOrigin: '50% 100%',
              willChange: 'transform',
            },
            {
              y: 0,
              scale: 1,
              duration: 1.4,
              ease: 'expo.out',
              clearProps: 'willChange',
            },
            0.75,
          )
          .from('.hh-blob', {opacity: 0, duration: 1.6, ease: 'power2.out'}, 1.95);
        document.documentElement.removeAttribute('data-intro');
        let split: any = null;
        document.fonts.ready.then(() => {
          const lines = gsap.utils.toArray<HTMLElement>('.hh-line');
          const heading = lines[0]?.closest('h1');
          heading?.setAttribute('aria-label', lines.map((line) => line.textContent?.trim() ?? '').join(' '));
          split = SplitText.create('.hh-line', {
            type: 'words,chars',
            aria: 'none',
            tag: 'span',
          });
          lines.forEach((line) => line.setAttribute('aria-hidden', 'true'));
          gsap.set('.hh-line', {autoAlpha: 1});
          gsap.from(split.chars, {
            opacity: 0,
            yPercent: 45,
            filter: 'blur(7px)',
            duration: 0.7,
            stagger: 0.017,
            delay: 0.15,
            ease: 'power2.out',
            clearProps: 'filter',
            onComplete: () => split?.revert(),
          });
        });
        return () => split?.revert();
      });
      return () => mm.revert();
    },
    {scope: sectionRef},
  );
  return (
    <section ref={sectionRef} id="hero" className="hh-stage relative isolate overflow-hidden pt-[clamp(120px,14vh,168px)] text-center">
      <div aria-hidden className="hh-blob pointer-events-none absolute inset-0 -z-10">
        <GradientBars numBars={15} />
      </div>
      <div className="mx-auto max-w-[1440px] px-6 md:px-8">
        <Badge>{$t("design-in-details")}</Badge>
        <h1
          className="mb-6 font-display text-[clamp(48px,6.4vw,92px)] leading-[1] font-medium tracking-[-0.06em]"
          style={{fontFeatureSettings: "'ss02' 1"}}
        >
          <span className="hh-line block">
            {$t("crafted")}<span className="vv-accent">{$t("websites")}</span>
          </span>
          <span className="hh-line block">
            <span className="vv-accent-roman">{$t("lasting")}</span>{$t("impressions")}
          </span>
        </h1>
        <p className="hh-sub mb-9 text-lead text-fg-muted">{$t("premium-websites-crafted-for-bold-brands")}</p>
        <div className="hh-ctas mb-[60px] flex flex-wrap justify-center gap-2.5">
          <Link
            href={$t("get-in-touch-link")}
            className="inline-flex items-center rounded-full border border-transparent bg-fg px-[15px] py-[9px] text-[14px] leading-none font-medium text-bg transition-colors hover:bg-fg-strong"
          >
            <RollText text={$t("get-in-touch")} />
          </Link>
          <Link
            href={$t("see-our-work-link")}
            className="inline-flex items-center rounded-full border border-line-strong px-[15px] py-[9px] text-[14px] leading-none font-medium transition-colors hover:border-fg-subtle hover:bg-surface"
          >
            <RollText text={$t("see-our-work")} />
          </Link>
        </div>
        <Studio projects={projects} />
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-[200px] bg-gradient-to-b from-bg/0 to-bg"
      />
    </section>
  );
}
