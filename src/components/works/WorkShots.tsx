// module 9518
import {useEffect, useRef, useState} from 'react';
import gsap from 'gsap';
import {useGSAP} from '@gsap/react';

import {mediaSrcSet} from '@/lib/media';
import {text} from '@/lib/text';

const $t = text("components/works/WorkShots");

gsap.registerPlugin(useGSAP);

export default function WorkShots({shots, alt}: any) {
  // Frame height follows the viewport (mobile: 210, otherwise 344)
  const [frameH, setFrameH] = useState(344);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 640px)');
    const update = () => setFrameH(mq.matches ? 210 : 344);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  const shotH = frameH - 24 - 2;
  const shotW = Math.round((16 * shotH) / 9);
  const step = shotW + 20;

  const [vw, setVw] = useState(0);
  useEffect(() => {
    let raf = 0;
    const measure = () => {
      raf = 0;
      setVw(window.innerWidth);
    };
    measure();
    const onResize = () => {
      if (!raf) raf = requestAnimationFrame(measure);
    };
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const startX = vw ? vw / 2 - shotW / 2 : 0;
  const lead = vw ? Math.ceil((startX + shotW) / step) : 1;
  const offset = -step * lead;
  const copies = vw ? Math.max(2, Math.ceil((lead + Math.ceil(vw / step) + 2) / shots.length)) : 2;

  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof IntersectionObserver === 'undefined') return;
    let done = false;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((en) => en.isIntersecting)) {
          (() => {
            if (!done) {
              done = true;
              for (const img of root.querySelectorAll('img[loading="lazy"]') as any) {
                img.loading = 'eager';
              }
            }
          })();
          io.disconnect();
        }
      },
      {rootMargin: '100% 0px'},
    );
    io.observe(root);
    return () => io.disconnect();
  }, [shots]);

  const trackRef = useRef<HTMLDivElement>(null);
  const slideRef = useRef<(dir: number) => void>(() => {});
  const restartRef = useRef<() => void>(() => {});
  useGSAP(
    () => {
      const track = trackRef.current;
      if (!track || shots.length < 2) return;
      let busy = false;
      gsap.set(track, {x: offset});
      slideRef.current = (dir: number) => {
        if (busy || !trackRef.current) return;
        busy = true;
        const el = trackRef.current;
        if (-1 === dir) {
          const last = el.lastElementChild;
          if (last) el.insertBefore(last, el.firstElementChild);
          gsap.set(el, {x: offset - step});
        }
        gsap.to(el, {
          x: 1 === dir ? offset - step : offset,
          duration: 0.9,
          ease: 'power3.inOut',
          onComplete: () => {
            if (1 === dir) {
              const first = el.firstElementChild;
              if (first) el.appendChild(first);
              gsap.set(el, {x: offset});
            }
            busy = false;
          },
        });
      };
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      let timer = 0;
      const restart = () => {
        window.clearInterval(timer);
        timer = window.setInterval(() => slideRef.current(1), 3900);
      };
      restartRef.current = restart;
      restart();
      return () => {
        window.clearInterval(timer);
        gsap.killTweensOf(track);
      };
    },
    {scope: rootRef, dependencies: [shots.length, step, offset, copies]},
  );

  const go = (dir: number) => {
    slideRef.current(dir);
    restartRef.current();
  };

  return shots.length ? (
    <div
      ref={rootRef}
      className="relative left-1/2 w-screen -translate-x-1/2 overflow-hidden border-y"
      style={{
        height: frameH,
        paddingTop: 12,
        paddingBottom: 12,
        paddingLeft: `calc(50vw - ${Math.round(shotW / 2)}px)`,
        borderColor: 'var(--vv-card-rule)',
      }}
    >
      <div ref={trackRef} className="flex w-max will-change-transform" style={{gap: 20}}>
        {Array.from({length: copies}, (_, i) => i).map((copy) =>
          shots.map((shot: any) => (
            <img
              key={`${copy}-${shot.id}`}
              src={shot.src}
              srcSet={mediaSrcSet(shot.src)}
              sizes={`${shotW}px`}
              alt={0 === copy ? (shot.title ?? alt) : ''}
              aria-hidden={1 === copy}
              draggable={false}
              width={shotW}
              height={shotH}
              style={{width: shotW, height: shotH}}
              className="shrink-0 rounded-[4px] object-contain select-none"
              loading="lazy"
              decoding="async"
            />
          )),
        )}
      </div>
      <button
        type="button"
        onClick={() => go(-1)}
        aria-label={$t("previous-screenshot")}
        className="absolute top-1/2 left-4 z-10 grid size-11 -translate-y-1/2 place-items-center rounded-full border border-fg/12 bg-bg/60 text-fg backdrop-blur-[10px] transition-colors hover:bg-bg/85"
      >
        <svg
          viewBox="0 0 24 24"
          className="size-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M15 5l-7 7 7 7" />
        </svg>
      </button>
      <button
        type="button"
        onClick={() => go(1)}
        aria-label={$t("next-screenshot")}
        className="absolute top-1/2 right-4 z-10 grid size-11 -translate-y-1/2 place-items-center rounded-full border border-fg/12 bg-bg/60 text-fg backdrop-blur-[10px] transition-colors hover:bg-bg/85"
      >
        <svg
          viewBox="0 0 24 24"
          className="size-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  ) : null;
}
