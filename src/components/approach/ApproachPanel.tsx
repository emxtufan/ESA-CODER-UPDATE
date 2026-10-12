// module 4398
import { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger, useGSAP);

const FRAME = { left: 36, top: 201, width: 685, height: 450 };
const SCREEN_W = FRAME.width - 14;
const SCREEN_H = (529 * SCREEN_W) / 780;
const SCALE = SCREEN_W / 780;
const ACTIVE_SITE = 'site-c';
const SITES = [
  { src: 'site-a', x: -73, y: 80, w: 200 },
  { src: 'site-b', x: 150, y: 80, w: 200 },
  { src: 'site-c', x: 374, y: 82, w: 196 },
  { src: 'site-d', x: 595, y: 80, w: 200 },
];
const CURSORS = [
  { name: 'Alex', x: 124, y: 262, ax: 79, ay: 238, size: 20, float: 0, entry: false, followY: true },
  { name: 'Gangu', x: 607, y: 338, ax: 567, ay: 319, size: 18, float: 23, entry: true, followY: false },
];
const TAN_20 = Math.tan((20 * Math.PI) / 180);

// Offscreen start position (along a 20deg diagonal) for the entering cursor.
function entryOffset(cursorX: number) {
  const dx = FRAME.left + FRAME.width + 28 - cursorX;
  return { x: dx, y: dx * TAN_20 };
}

function Pointer({ id, size }: { id: string; size: number }) {
  return (
    <svg width={size} height={(273 * size) / 249} viewBox="0 0 249 273" fill="none" aria-hidden>
      <defs>
        <linearGradient
          id={id}
          x1="202.877"
          y1="443.036"
          x2="-130.791"
          y2="313.847"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset=".023" stopColor="#A6DBFF" />
          <stop offset=".481" stopColor="#33ADFF" />
          <stop offset="1" stopColor="#0099FF" />
        </linearGradient>
      </defs>
      <path
        d="m1.81 20.046 39.667 238.391c2.237 13.443 19.18 18.114 27.99 7.717l57.9-68.335a30 30 0 0 1 14.345-9.364l94.457-28.064c13.362-3.97 15.611-21.939 3.639-29.079L25.788 3.678C14.086-3.3-.427 6.607 1.81 20.046Z"
        fill={`url(#${id})`}
        stroke="#fff"
        strokeWidth="2"
      />
    </svg>
  );
}

export default function ApproachPanel() {
  const rootRef = useRef<HTMLDivElement>(null);
  const sitesRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference) and (pointer: fine)', () => {
        const moveX = gsap.quickTo(sitesRef.current, 'x', { duration: 0.9, ease: 'power3.out' });
        const moveY = gsap.quickTo('[data-vv-follow-y]', 'y', { duration: 0.9, ease: 'power3.out' });
        const onPointerMove = (event: PointerEvent) => {
          moveX((event.clientX / window.innerWidth - 0.5) * 100);
          moveY((event.clientY / window.innerHeight - 0.5) * 50);
        };
        window.addEventListener('pointermove', onPointerMove, { passive: true });
        return () => window.removeEventListener('pointermove', onPointerMove);
      });
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const travel = () => window.innerHeight + (rootRef.current?.offsetHeight ?? 0);
        gsap.from('[data-vv-cursor]', {
          x: (_i: number, target: any) => Number(target.dataset.entryX),
          y: (_i: number, target: any) => Number(target.dataset.entryY),
          ease: 'none',
          scrollTrigger: {
            trigger: rootRef.current,
            start: () => `top bottom-=${0.1 * travel()}`,
            end: () => `top bottom-=${0.5 * travel()}`,
            invalidateOnRefresh: true,
            scrub: 0.6,
          },
        });
      });
      return () => mm.revert();
    },
    { scope: rootRef },
  );

  return (
    <div className="pointer-events-none absolute inset-0" ref={rootRef}>
      <div
        className="absolute overflow-hidden border border-white/10 bg-white/[0.02] backdrop-blur-[4px]"
        style={{
          ...FRAME,
          borderRadius: '13.5px 13.5px 0 0',
          boxShadow: '0 0 56px 9px rgba(0, 0, 0, 0.2)',
        }}
      >
        <div
          className="absolute overflow-hidden bg-black"
          style={{ left: 7, top: 7, width: SCREEN_W, height: SCREEN_H, borderRadius: 6.5 }}
        >
          <div ref={sitesRef} className="absolute inset-0 will-change-transform">
            {SITES.map((site) => (
              <img
                key={site.src}
                src={`/approach/${site.src}.webp`}
                alt=""
                className={`absolute max-w-none ${site.src === ACTIVE_SITE ? 'outline-[1.5px] outline-blue-500' : ''}`}
                style={{ left: site.x * SCALE, top: site.y * SCALE, width: site.w * SCALE }}
                loading="lazy"
                decoding="async"
              />
            ))}
            {SITES.filter((site) => site.src === ACTIVE_SITE).map((site) => (
              <div
                key={`${site.src}-label`}
                className="absolute flex items-center bg-[#161618]"
                style={{
                  left: site.x * SCALE,
                  top: (site.y - 8 - 18) * SCALE,
                  width: site.w * SCALE,
                  height: 18 * SCALE,
                  borderRadius: 4 * SCALE,
                  paddingLeft: 4 * SCALE,
                }}
              >
                <span
                  className="grid shrink-0 place-items-center bg-[#2f2f33]"
                  style={{ width: 8 * SCALE, height: 8 * SCALE, borderRadius: 2.5 * SCALE }}
                >
                  <svg viewBox="0 0 10 10" className="size-full" fill="#fff" aria-hidden>
                    <path d="M4 3.1 6.9 5 4 6.9z" />
                  </svg>
                </span>
                <span
                  className="font-text text-white"
                  style={{ marginLeft: 3 * SCALE, fontSize: 8 * SCALE, lineHeight: 1 }}
                >
                  Desktop
                </span>
              </div>
            ))}
          </div>
        </div>
        <img
          src="/approach/panel.webp"
          alt=""
          className="vv-panel-chrome absolute max-w-none"
          style={{ left: 7, top: 7, width: SCREEN_W, borderRadius: 6.5 }}
          loading="lazy"
          decoding="async"
        />
      </div>
      {CURSORS.map((cursor) => (
        <div
          key={cursor.name}
          {...(cursor.followY ? { 'data-vv-follow-y': true } : {})}
          {...(cursor.entry
            ? {
                'data-vv-cursor': true,
                'data-entry-x': entryOffset(FRAME.left + 7 + cursor.ax * SCALE).x,
                'data-entry-y': entryOffset(FRAME.left + 7 + cursor.ax * SCALE).y,
              }
            : {})}
          className="absolute inset-0"
        >
          <div
            className={`absolute inset-0 ${cursor.float ? 'vv-breathe' : ''}`}
            style={
              cursor.float
                ? ({ '--vv-breathe-distance': `${cursor.float}px`, animationDuration: '6s' } as any)
                : undefined
            }
          >
            <span
              className="absolute"
              style={{
                left: FRAME.left + 7 + cursor.ax * SCALE,
                top: FRAME.top + 7 + cursor.ay * SCALE,
              }}
            >
              <Pointer id={`vv-ptr-${cursor.name}`} size={cursor.size} />
            </span>
            <span
              className="absolute rounded-full bg-blue-500 px-[18px] py-[7px] text-[12px] leading-[14px] font-normal text-white"
              style={{
                left: FRAME.left + 7 + cursor.x * SCALE - 18,
                top: FRAME.top + 7 + cursor.y * SCALE - 7,
              }}
            >
              {cursor.name}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
