// module 4766
import {useEffect, useRef} from 'react';
import gsap from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
import {SplitText} from 'gsap/SplitText';
import {useGSAP} from '@gsap/react';
import Link from '@/components/Link';
import RollText from '@/components/RollText';
import ShineBorder from '@/components/ShineBorder';
import {slugify} from '@/lib/slugify';
import ShimmerMask from '@/components/services/ShimmerMask';
import {SERVICES} from '@/components/services/servicesData';

gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);

const PLATFORMS = [
  {name: 'Webflow', src: '/platforms/webflow.png'},
  {name: 'WordPress', src: '/platforms/wordpress.png'},
  {name: 'Wix', src: '/platforms/wix.png'},
  {name: 'Framer', src: '/platforms/framer.png'},
  {name: 'Hostinger', src: '/platforms/hostinger.png'},
  {name: 'Squarespace', src: '/platforms/squarespace.png'},
  {name: 'Shopify', src: '/platforms/shopify.png'},
  {name: 'Figma', src: '/platforms/figma.png'},
];

export default function Services() {
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        entry.isIntersecting ? video.play().catch(() => {}) : video.pause();
      },
      {rootMargin: '200px'},
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.set('#services-heading', {autoAlpha: 0});
        let split: any = null;
        document.fonts.ready.then(() => {
          split = SplitText.create('#services-heading', {
            type: 'chars',
            aria: 'auto',
            tag: 'span',
          });
          document
            .querySelector('#services-heading')
            ?.setAttribute('aria-label', 'Elevate your digital footprint.');
          gsap.set('#services-heading', {autoAlpha: 1});
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
        gsap.from('.svc-card', {
          opacity: 0,
          y: 22,
          duration: 0.6,
          stagger: 0.035,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: '.svc-grid',
            start: 'top 85%',
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
      id="services"
      ref={sectionRef}
      aria-labelledby="services-heading"
      className="bg-bg py-[clamp(80px,10vw,136px)]"
    >
      <div className="mx-auto max-w-[1380px] px-6 md:px-8">
        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between md:gap-10">
          <h2
            id="services-heading"
            className="font-display text-[clamp(38px,4.6vw,64px)] leading-[1] font-medium tracking-h1"
          >
            Elevate your
            <br />
            digital footprint.
          </h2>
          <div className="flex shrink-0 flex-wrap gap-3">
            <Link
              href="/services"
              className="inline-flex items-center rounded-full border border-transparent bg-fg px-[15px] py-[9px] text-[14px] leading-none font-medium text-bg transition-colors hover:bg-fg-strong"
            >
              <RollText text="View all services" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center rounded-full border border-transparent bg-fg/15 px-[15px] py-[9px] text-[14px] leading-none font-medium transition-colors hover:bg-fg/25"
            >
              <RollText text="Start a project" />
            </Link>
          </div>
        </div>
        <ul className="svc-grid mt-12 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {SERVICES.map((service) => (
            <li key={service.label.join(' ')}>
              <Link
                href={`/services/${slugify(service.label.join(' '))}`}
                className="svc-card group group/cell relative grid aspect-square place-items-center overflow-hidden rounded-[12px] border border-line px-3 text-center transition-colors duration-300 ease-brand"
              >
                <ShimmerMask />
                <ShineBorder />
                <div className="relative flex flex-col items-center gap-[21px]">
                  <svg
                    aria-hidden
                    viewBox={service.viewBox}
                    className="size-7 shrink-0 text-fg"
                    fill="currentColor"
                  >
                    {service.paths.map((d) => (
                      <path key={d} d={d} />
                    ))}
                  </svg>
                  <span className="text-[16px] leading-[21px] text-fg-dim transition-colors duration-300 ease-brand group-hover/cell:text-fg">
                    {service.label[0]}
                    <br />
                    {service.label[1]}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <div className="relative isolate min-h-[294px] overflow-hidden rounded-[12px] p-8 md:p-[45px]">
            <video
              ref={videoRef}
              poster="/platform-starfield.jpg"
              muted
              loop
              playsInline
              preload="none"
              aria-hidden
              tabIndex={-1}
              className="absolute inset-0 -z-10 size-full object-cover"
            >
              <source src="/platform-starfield.mp4" type="video/mp4" />
            </video>
            <h3 className="font-display text-[clamp(28px,2.6vw,36px)] leading-[1.1] font-medium tracking-h2 text-white">
              Platform flexibility.
              <br />
              Design consistency.
            </h3>
            <p className="mt-3 max-w-[568px] text-lead leading-[1.6] text-white/75">
              No matter the platform, our design language stays{' '}
              <span className="text-white">consistent, refined, responsive,</span> and built to
              perform.
            </p>
            <Link
              href="/works"
              className="mt-5 inline-flex items-center rounded-[8px] bg-white/20 px-[15px] py-[10px] text-[14px] leading-none font-medium text-white transition-colors hover:bg-white/30"
            >
              <RollText text="See our work" />
            </Link>
          </div>
          <ul className="grid grid-cols-4 grid-rows-2 gap-px overflow-hidden rounded-[12px] border border-line bg-line sm:min-h-[294px]">
            {PLATFORMS.map((platform) => (
              <li
                key={platform.name}
                className={`group/cell relative grid aspect-square place-items-center bg-bg sm:aspect-auto ${'Wix' === platform.name ? 'z-10' : ''}`}
              >
                <ShimmerMask />
                <img
                  src={platform.src}
                  alt={platform.name}
                  className="tech-logo relative size-[34px] object-contain transition-opacity duration-500 ease-brand group-hover/cell:opacity-100 sm:size-[50px]"
                  loading="lazy"
                  decoding="async"
                />
                {'Wix' === platform.name && (
                  <img
                    src="/platforms/wix-partner.png"
                    alt="Wix Legend Partner"
                    className="absolute right-2 bottom-1 size-[32px] origin-center rotate-[25deg] object-contain transition-transform duration-[400ms] ease-out group-hover/cell:scale-[4] group-hover/cell:rotate-0 sm:right-4 sm:bottom-[5px] sm:size-[46px]"
                    loading="lazy"
                    decoding="async"
                  />
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
