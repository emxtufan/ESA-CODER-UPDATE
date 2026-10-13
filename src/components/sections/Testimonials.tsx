// module 5382
import { useCallback, useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { createGlobe } from '@/lib/webgl';

import {text} from '@/lib/text';

const $t = text("components/sections/Testimonials");

const DARK_GLOBE = {
  dark: 1,
  diffuse: 0.55,
  mapBrightness: 4.6,
  baseColor: [0.32, 0.34, 0.38],
  glowColor: [0.09, 0.11, 0.15],
  markerColor: [0, 0.6, 1],
};

const LIGHT_GLOBE = {
  dark: 0,
  diffuse: 0.45,
  mapBrightness: 1.3,
  baseColor: [0.74, 0.75, 0.79],
  glowColor: [1, 1, 1],
  markerColor: [0, 0.6, 1],
};

function useIsLightTheme() {
  const [isLight, setIsLight] = useState(false);
  useEffect(() => {
    const sync = () =>
      setIsLight(document.documentElement.getAttribute('data-theme') === 'light');
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
    return () => observer.disconnect();
  }, []);
  return isLight;
}

function Globe({ className = '' }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const isLight = useIsLightTheme();
  const pointerStartRef = useRef<number | null>(null);
  const dragOffsetRef = useRef(0);
  const dragPhiRef = useRef(0);
  const visibleRef = useRef(false);
  const [shouldRender, setShouldRender] = useState(false);
  const themeRef = useRef<any>(DARK_GLOBE);

  useEffect(() => {
    themeRef.current = isLight ? LIGHT_GLOBE : DARK_GLOBE;
  }, [isLight]);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper || typeof IntersectionObserver === 'undefined') {
      visibleRef.current = true;
      setShouldRender(true);
      return;
    }
    // set up a screen ahead (no pop-in), but only animate while actually on screen
    const ahead = new IntersectionObserver(([entry]) => entry.isIntersecting && setShouldRender(true), { rootMargin: '100% 0px' });
    const onScreen = new IntersectionObserver(([entry]) => (visibleRef.current = entry.isIntersecting));
    ahead.observe(wrapper);
    onScreen.observe(wrapper);
    return () => {
      ahead.disconnect();
      onScreen.disconnect();
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!shouldRender || !canvas) return;
    let width = canvas.offsetWidth;
    const onResize = () => {
      if (canvasRef.current) width = canvasRef.current.offsetWidth;
    };
    window.addEventListener('resize', onResize);
    // the globe stands still while the page scrolls, so scrolling never competes with it for the GPU
    let scrollingUntil = 0;
    const onScroll = () => (scrollingUntil = performance.now() + 150);
    window.addEventListener('scroll', onScroll, { passive: true });
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // createGlobe multiplies width/height by devicePixelRatio itself: pass CSS pixels, at most 2x density
    // (it used to get 2x the width *and* a ratio of 2: a 4x canvas, ~15 million pixels shaded per frame)
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const globe = createGlobe(canvas, {
      devicePixelRatio: dpr,
      width,
      height: width,
      phi: 0,
      theta: 0.28,
      mapSamples: 16e3,
      ...themeRef.current,
    });
    let phi = 0;
    let rafId = 0;
    let last = 0;
    const FRAME = 1000 / 30; // a slow spin reads the same at 30 fps, for half the GPU work
    const tick = (now: number) => {
      rafId = requestAnimationFrame(tick);
      if (!visibleRef.current || now < scrollingUntil || now - last < FRAME) return;
      const dt = last ? Math.min(now - last, 100) : FRAME;
      last = now;
      if (pointerStartRef.current === null && !reducedMotion) phi += 0.0032 * (dt / (1000 / 60));
      globe.update({ phi: phi + dragPhiRef.current, width, height: width, ...themeRef.current });
    };
    if (reducedMotion) {
      globe.update({ phi, width, height: width, ...themeRef.current });
    }
    rafId = requestAnimationFrame(tick);
    const fadeId = requestAnimationFrame(() => {
      if (canvasRef.current) canvasRef.current.style.opacity = '1';
    });
    return () => {
      cancelAnimationFrame(rafId);
      cancelAnimationFrame(fadeId);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onScroll);
      globe.destroy();
      try {
        const gl: any = canvas.getContext('webgl2') ?? canvas.getContext('webgl');
        gl?.getExtension('WEBGL_lose_context')?.loseContext();
      } catch {}
    };
  }, [shouldRender]);

  const setPointer = (value: number | null) => {
    pointerStartRef.current = value;
    if (canvasRef.current) canvasRef.current.style.cursor = value === null ? 'grab' : 'grabbing';
  };
  const drag = (clientX: number) => {
    if (pointerStartRef.current !== null) {
      dragOffsetRef.current = clientX - pointerStartRef.current;
      dragPhiRef.current = dragOffsetRef.current / 200;
    }
  };

  return (
    <div ref={wrapperRef} className={`absolute inset-0 mx-auto aspect-square w-full ${className}`}>
      <canvas
        ref={canvasRef}
        aria-hidden
        className="size-full cursor-grab opacity-0 transition-opacity duration-700 [contain:layout_paint_size]"
        onPointerDown={(e) => setPointer(e.clientX - dragOffsetRef.current)}
        onPointerUp={() => setPointer(null)}
        onPointerOut={() => setPointer(null)}
        onMouseMove={(e) => drag(e.clientX)}
        onTouchMove={(e) => e.touches[0] && drag(e.touches[0].clientX)}
      />
    </div>
  );
}

function Stars({ filled }: { filled: number }) {
  return (
    <div aria-hidden className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <svg
          key={n}
          viewBox="0 0 24 24"
          className={`size-[17px] ${n <= filled ? 'text-amber' : 'text-fg-subtle'}`}
          fill="currentColor"
        >
          <path d="M12 2.6l2.6 5.9 6.4.6-4.8 4.3 1.4 6.3-5.6-3.3-5.6 3.3 1.4-6.3L3 9.1l6.4-.6L12 2.6Z" />
        </svg>
      ))}
    </div>
  );
}

function QuoteMark({ className = '' }: { className?: string }) {
  const d =
    'M18 4v10c0 7.7-4.6 12.9-11.4 14.9L5 25.6c3.6-1.3 5.8-3.7 6.4-6.6H6a4 4 0 0 1-4-4V8a4 4 0 0 1 4-4h12Z';
  return (
    <svg viewBox="0 0 44 32" className={className} fill="currentColor" aria-hidden>
      <path d={d} />
      <path d={d} transform="translate(24 0)" />
    </svg>
  );
}

gsap.registerPlugin(ScrollTrigger, useGSAP);

const chevron = (
  <svg
    viewBox="0 0 24 24"
    className="size-[18px]"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="M15 6l-6 6 6 6" />
  </svg>
);

function CardDecor() {
  return (
    <>
      <span
        aria-hidden
        className="pointer-events-none absolute top-0 left-1/2 h-px w-[420px] max-w-[80%] -translate-x-1/2"
        style={{
          background:
            'linear-gradient(90deg, transparent 0%, var(--vv-card-line) 50%, transparent 100%)',
        }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[12px]"
        style={{
          background:
            'radial-gradient(58% 46% at 50% 0%, color-mix(in srgb, var(--vv-card-lift) 62%, transparent) 0%, color-mix(in srgb, var(--vv-card-lift-mid) 62%, transparent) 45%, transparent 78%)',
        }}
      />
    </>
  );
}

const CARD_CLASS = 'relative overflow-hidden rounded-[12px] border backdrop-blur-[12px]';
const CARD_STYLE = {
  background: 'color-mix(in srgb, var(--vv-bg) 42%, transparent)',
  borderColor: 'var(--vv-card-border)',
};

function useIdleReady() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let handle: any = 0;
    const schedule = () => {
      const run = () => setReady(true);
      handle =
        typeof window.requestIdleCallback === 'function'
          ? window.requestIdleCallback(run, { timeout: 3e3 })
          : window.setTimeout(run, 200);
    };
    if (document.readyState === 'complete') schedule();
    else window.addEventListener('load', schedule, { once: true });
    return () => {
      window.removeEventListener('load', schedule);
      if (handle) {
        if (typeof window.cancelIdleCallback === 'function') window.cancelIdleCallback(handle);
        else window.clearTimeout(handle);
      }
    };
  }, []);
  return ready;
}

// Up to three counters; one with an empty value is left out.
const STATS = [
  { value: $t("stat-1-value"), suffix: $t("stat-1-suffix"), label: $t("stat-1-label") },
  { value: $t("stat-2-value"), suffix: $t("stat-2-suffix"), label: $t("stat-2-label") },
  { value: $t("stat-3-value"), suffix: $t("stat-3-suffix"), label: $t("stat-3-label") },
]
  .map((stat) => ({ ...stat, value: Number(stat.value) || 0 }))
  .filter((stat) => stat.value);

export default function Testimonials({ items }: { items: any[] }) {
  const stats = STATS;
  const sectionRef = useRef<HTMLElement>(null);
  const ready = useIdleReady();
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const goTo = useCallback(
    (index: number) => setActive(((index % items.length) + items.length) % items.length),
    [items.length],
  );

  useEffect(() => {
    if (
      paused ||
      items.length < 2 ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    )
      return;
    const timer = window.setTimeout(() => goTo(active + 1), 7e3);
    return () => window.clearTimeout(timer);
  }, [active, paused, items.length, goTo]);

  useGSAP(
    () => {
      if (!ready || !items.length) return;
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.from('.vv-quote-stage', {
          opacity: 0,
          y: 26,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 76%',
            once: true,
          },
        });
        gsap.utils.toArray<HTMLElement>('.vv-stat-value').forEach((el) => {
          const target = Number(el.dataset.value ?? 0);
          if (!Number.isFinite(target) || target === 0) return;
          const counter = { n: 0 };
          gsap.to(counter, {
            n: target,
            duration: 1.5,
            ease: 'power2.out',
            onUpdate: () => {
              el.textContent = String(Math.round(counter.n));
            },
            scrollTrigger: {
              trigger: sectionRef.current,
              start: 'top 76%',
              once: true,
            },
          });
        });
      });
      return () => mm.revert();
    },
    { scope: sectionRef, dependencies: [ready, items.length] },
  );

  if (!items.length) return null;

  const pad = (n: number) => String(n + 1).padStart(2, '0');

  return (
    <section
      ref={sectionRef}
      id="testimonials"
      aria-labelledby="testimonials-heading"
      className="relative isolate z-10 overflow-hidden bg-bg py-[clamp(80px,9vw,120px)]"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 grid place-items-center"
      >
        <div className="relative -mt-[clamp(44px,5.5vw,92px)] aspect-square w-[min(980px,130vw)] opacity-[0.72]">
          <Globe />
        </div>
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(62% 62% at 50% 42%, transparent 42%, color-mix(in srgb, var(--vv-bg) 45%, transparent) 70%, var(--vv-bg) 96%)',
        }}
      />
      <div className="mx-auto max-w-[1380px] px-6 md:px-8">
        <h2
          id="testimonials-heading"
          className="text-center font-display text-[clamp(46px,9vw,132px)] leading-[1] font-medium tracking-[-0.05em]"
        >
          {$t("testimonials")}
        </h2>
        <div
          className="vv-quote-stage relative mt-7 md:mt-[clamp(-44px,-3vw,-18px)]"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocusCapture={() => setPaused(true)}
          onBlurCapture={() => setPaused(false)}
        >
          <div className="mx-auto grid max-w-[1120px] gap-4 lg:grid-cols-12">
            {stats.length ? (
              <div
                className={`${CARD_CLASS} order-2 flex flex-col justify-between gap-8 p-8 lg:order-1 lg:col-span-4 lg:gap-10 lg:p-10`}
                style={CARD_STYLE}
              >
                <CardDecor />
                {stats.map((stat) => (
                  <div key={stat.label} className="relative">
                    <div className="flex items-start font-display text-[clamp(40px,4.4vw,60px)] leading-[0.9] font-medium tracking-[-0.045em]">
                      <span className="vv-stat-value tabular-nums" data-value={stat.value}>
                        {stat.value}
                      </span>
                      {stat.suffix ? (
                        <span className="ml-0.5 text-[0.46em] leading-[1.5] text-blue-500">
                          {stat.suffix}
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-2 text-body-s text-fg-muted">{stat.label}</div>
                  </div>
                ))}
              </div>
            ) : null}
            <div
              className={`${CARD_CLASS} order-1 flex flex-col p-8 lg:order-2 lg:col-span-8 lg:p-11 ${stats.length ? '' : 'lg:col-span-12'}`}
              style={CARD_STYLE}
            >
              <CardDecor />
              <div className="relative flex items-center justify-between gap-6">
                <div>
                  <p className="text-body-s tracking-[0.06em] text-fg-muted tabular-nums">
                    <span className="text-fg" aria-live="polite">
                      {pad(active)}
                    </span>{' '}
                    <span aria-hidden>/ {pad(items.length - 1)}</span>
                    <span className="sr-only">{$t("of")}{items.length}</span>
                  </p>
                  <span
                    aria-hidden
                    className="mt-2.5 block h-px w-14"
                    style={{ background: 'var(--vv-card-rule)' }}
                  />
                </div>
                <QuoteMark className="h-[clamp(20px,2.2vw,28px)] w-auto shrink-0 text-fg opacity-30" />
              </div>
              <div className="relative mt-8 grid min-h-[clamp(210px,20vw,268px)] grid-cols-1">
                {items.map((item, index) => {
                  const isActive = index === active;
                  return (
                    <figure
                      key={item.id}
                      style={{ gridArea: '1 / 1' }}
                      inert={!isActive}
                      aria-hidden={!isActive}
                      className={`flex h-full flex-col transition-opacity duration-500 ease-brand ${isActive ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
                    >
                      {item.rating ? (
                        <div className="flex items-center gap-2.5">
                          <Stars filled={item.rating} />
                          <span className="sr-only">{item.rating}{$t("out-of-5")}</span>
                        </div>
                      ) : null}
                      <blockquote
                        className={`mt-auto font-display text-[clamp(18px,1.7vw,25px)] leading-[1.4] font-medium tracking-[-0.02em] text-fg ${item.rating ? 'pt-6' : ''}`}
                      >
                        “{item.quote}”
                      </blockquote>
                      <figcaption className="mt-7 flex items-center gap-3.5 sm:pr-24">
                        {item.avatar ? (
                          <img
                            src={item.avatar}
                            alt=""
                            width={48}
                            height={48}
                            loading="lazy"
                            decoding="async"
                            className={`size-12 shrink-0 rounded-full ${item.avatarKind === 'logo' ? 'bg-surface object-contain' : 'bg-surface-strong object-cover'}`}
                          />
                        ) : (
                          <span
                            aria-hidden
                            className="grid size-12 shrink-0 place-items-center rounded-full border border-line bg-surface font-display text-[17px] font-medium text-fg-muted"
                          >
                            {item.name.trim().charAt(0).toUpperCase()}
                          </span>
                        )}
                        <span className="min-w-0">
                          <span className="block truncate text-[15px] font-medium tracking-[0.02em] text-fg uppercase">
                            {item.name}
                          </span>
                          {item.role || item.company ? (
                            <span className="block text-body-s text-fg-muted sm:truncate">
                              {[item.role, item.company].filter(Boolean).join(', ')}
                            </span>
                          ) : null}
                        </span>
                      </figcaption>
                    </figure>
                  );
                })}
              </div>
              {items.length > 1 ? (
                <div className="mt-6 flex items-center justify-end gap-2 sm:absolute sm:right-8 sm:bottom-8 sm:mt-0 lg:right-11 lg:bottom-11">
                  <button
                    type="button"
                    onClick={() => goTo(active - 1)}
                    aria-label={$t("previous-testimonial")}
                    className="grid size-10 place-items-center rounded-full border border-line text-fg-muted transition-colors hover:bg-surface hover:text-fg"
                  >
                    {chevron}
                  </button>
                  <button
                    type="button"
                    onClick={() => goTo(active + 1)}
                    aria-label={$t("next-testimonial")}
                    className="grid size-10 place-items-center rounded-full border border-line text-fg-muted transition-colors hover:bg-surface hover:text-fg"
                  >
                    <span className="rotate-180">{chevron}</span>
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
