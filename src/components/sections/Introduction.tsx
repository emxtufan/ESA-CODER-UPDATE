// module 5385
import {useEffect, useRef} from 'react';
import gsap from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
import {SplitText} from 'gsap/SplitText';
import {useGSAP} from '@gsap/react';
import Link from '@/components/Link';
import RollText from '@/components/RollText';

import {text} from '@/lib/text';

const $t = text("components/sections/Introduction");

gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);

const CARD_WIDTH = 1072 / 3;

// Image ids per track row
const IMAGES = [
  ['84a40757', 'e9076ff8', '9f6f6a01', 'ff048242', 'f3ec6156', 'a295b880', '36e5a4f3', 'da002a67'],
  ['f3ec6156', 'da002a67', '23b28990', '2a53921c', '36e5a4f3', '84a40757', '816a7ff2', '3e3d732f'],
  [
    'a295b880',
    '5fa548c7',
    'f5b3fbda',
    '36e5a4f3',
    '816a7ff2',
    '3e3d732f',
    'f3ec6156',
    'ff048242',
    'e9076ff8',
    '76447a89',
  ],
];

const TRACKS: Array<{offset: number | string; travel: number; cards: number}> = [
  {offset: 365, travel: -40, cards: 10},
  {offset: 150, travel: 50, cards: 10},
  {offset: 'center', travel: -200, cards: 9},
];

const mix = (pct: number) => `color-mix(in srgb, var(--vv-bg) ${pct}%, transparent)`;
const stop = (n: number) => (74 + 26 * n).toFixed(1);

const EDGE_FADE = `radial-gradient(120% 96% at 50% 0%, transparent 74%, ${mix(8)} ${stop(0.25)}%, ${mix(28)} ${stop(0.5)}%, ${mix(62)} ${stop(0.72)}%, ${mix(88)} ${stop(0.88)}%, var(--vv-bg) 100%)`;
const MOBILE_SPOT = `radial-gradient(430px circle at calc(50vw + var(--fx, 225px) - 50px) calc(var(--fy, 240px) - 40px), ${mix(90)} 0%, ${mix(84)} 30%, ${mix(56)} 56%, ${mix(26)} 76%, ${mix(8)} 90%, transparent 100%)`;
const DESKTOP_SPOT = `radial-gradient(700px circle at calc(50vw + var(--fx, 225px) - 50px) calc(var(--fy, 240px) - 40px), var(--vv-bg) 0%, var(--vv-bg) 41%, ${mix(72)} 58%, ${mix(38)} 74%, ${mix(12)} 88%, transparent 100%)`;

export default function Introduction() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);

  // Tracks the copy block's center as --fx / --fy for the spotlight gradients
  useEffect(() => {
    const stage = stageRef.current;
    const copy = copyRef.current;
    if (!stage || !copy) return;
    const update = () => {
      const stageRect = stage.getBoundingClientRect();
      const copyRect = copy.getBoundingClientRect();
      stage.style.setProperty('--fx', `${copyRect.left + copyRect.width / 2 - stageRect.left}px`);
      stage.style.setProperty('--fy', `${copyRect.top + copyRect.height / 2 - stageRect.top}px`);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(stage);
    observer.observe(copy);
    return () => observer.disconnect();
  }, []);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.utils.toArray('.intro-track').forEach((track: any, index: number) => {
          const travel = TRACKS[index].travel;
          gsap.fromTo(
            track,
            {x: -travel / 2},
            {
              x: travel / 2,
              ease: 'none',
              scrollTrigger: {
                trigger: sectionRef.current,
                start: 'top bottom',
                end: 'bottom top',
                scrub: 0.6,
              },
            },
          );
        });
        gsap.set('#intro-heading', {autoAlpha: 0});
        let split: any = null;
        document.fonts.ready.then(() => {
          split = SplitText.create('#intro-heading', {
            type: 'words,chars',
            aria: 'auto',
            tag: 'span',
          });
          document
            .querySelector('#intro-heading')
            ?.setAttribute('aria-label', 'Design that speaks. Delivery that converts.');
          gsap.set('#intro-heading', {autoAlpha: 1});
          gsap.from(split.chars, {
            opacity: 0,
            yPercent: 45,
            filter: 'blur(7px)',
            duration: 0.7,
            stagger: 0.017,
            ease: 'power2.out',
            clearProps: 'filter',
            scrollTrigger: {
              trigger: sectionRef.current,
              start: 'top 70%',
              once: true,
            },
            onComplete: () => split?.revert(),
          });
        });
        gsap.from('.intro-copy > :not(#intro-heading)', {
          opacity: 0,
          y: 18,
          duration: 0.7,
          stagger: 0.09,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 70%',
            once: true,
          },
        });
        return () => split?.revert();
      });
      return () => mm.revert();
    },
    {scope: sectionRef},
  );

  return (
    <section
      ref={sectionRef}
      aria-labelledby="intro-heading"
      className="relative isolate z-10 bg-bg"
      style={{boxShadow: 'var(--vv-section-shadow)'}}
    >
      <div className="mx-auto max-w-[1440px] px-6 md:px-8">
        <div ref={stageRef} className="relative" style={{height: 820}}>
          <div className="absolute inset-0 flex flex-col" style={{gap: 8}}>
            {TRACKS.map((track, rowIndex) => (
              <div
                key={rowIndex}
                className="flex min-h-0 flex-1"
                style={
                  'center' === track.offset
                    ? {
                        marginLeft: `calc((100% - ${track.cards * CARD_WIDTH + (track.cards - 1) * 8}px) / 2)`,
                      }
                    : {paddingLeft: track.offset}
                }
              >
                <div
                  className="intro-track flex h-full w-max shrink-0 will-change-transform"
                  style={{gap: 8}}
                >
                  {Array.from({length: track.cards}, (_, cardIndex) => {
                    const id = IMAGES[rowIndex][cardIndex % IMAGES[rowIndex].length];
                    return (
                      <img
                        key={cardIndex}
                        src={`/intro/${id}.webp`}
                        alt=""
                        width={720}
                        height={540}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-auto shrink-0 rounded-md bg-surface-strong object-cover"
                        style={{aspectRatio: '4 / 3'}}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <div
            aria-hidden
            className="pointer-events-none absolute top-0 bottom-0 left-1/2 w-screen -translate-x-1/2"
            style={{background: EDGE_FADE}}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute top-0 bottom-0 left-[-50vw] right-[-50vw] hidden md:block"
            style={{background: DESKTOP_SPOT}}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute top-0 bottom-0 left-[-50vw] right-[-50vw] md:hidden"
            style={{background: MOBILE_SPOT}}
          />
          <div className="pointer-events-none absolute inset-0 flex items-start pt-[120px]">
            <div ref={copyRef} className="intro-copy pointer-events-auto">
              <h2
                id="intro-heading"
                className="font-display text-h3 leading-[1.1] font-medium tracking-h3 md:whitespace-nowrap"
              >
                {$t("design-that-speaks")}
                <br />
                {$t("delivery-that-converts")}
              </h2>
              <p className="mt-2.5 max-w-[450px] text-lead text-fg-muted">
                {
                  $t("visuvate-crafts-focused-digital-experiences-that")
                }
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href={$t("about-us-link")}
                  className="inline-flex items-center rounded-[12px] border border-transparent bg-fg px-[15px] py-[9px] text-[14px] leading-none font-medium text-bg transition-colors hover:bg-fg-strong"
                >
                  <RollText text={$t("about-us")} />
                </Link>
                <Link
                  href={$t("see-our-work-link")}
                  className="inline-flex items-center rounded-[12px] border border-line-strong px-[15px] py-[9px] text-[14px] leading-none font-medium transition-colors hover:border-fg-subtle hover:bg-surface"
                >
                  <RollText text={$t("see-our-work")} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
