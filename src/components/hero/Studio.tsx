// module 1659: the hero's project strip. A framed panel with the projects gliding past in a loop; a card opens
// its project. Below it, a small bar to pause the motion and go to all the work. Only that button stops the strip
// (no pause on hover: with the cards moving under a still cursor, hover pauses got stuck and out of step with it).
import {useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore} from 'react';
import gsap from 'gsap';
import {useGSAP} from '@gsap/react';
import Link from '@/components/Link';
import ShineBorder from '@/components/ShineBorder';
import {DESKTOP_SIZE, MOBILE_SIZE, MOBILE_WIDTHS, buildSrcSet, preloadImages, wait} from './data';

import {text} from '@/lib/text';

const $t = text("components/hero/Studio");
const $h = text("components/sections/Hero");

const small = () => window.matchMedia('(max-width: 639px)').matches;
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export default function Studio({projects}: {projects: any[]}) {
  const isSmall = useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia('(max-width: 639px)');
      mq.addEventListener('change', cb);
      return () => mq.removeEventListener('change', cb);
    },
    small,
    () => false,
  );
  const mode = isSmall ? 'mobile' : 'desktop';
  const cardSize = isSmall ? MOBILE_SIZE.mobile : DESKTOP_SIZE.desktop;
  const [theme, setTheme] = useState('dark');
  const [fading, setFading] = useState(false);
  const [paused, setPaused] = useState(false);
  const [canMove, setCanMove] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const token = useRef(0);
  const scopeRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const tweenRef = useRef<gsap.core.Tween | null>(null);
  const pausedRef = useRef(false);

  const list = useMemo(() => {
    const filtered = projects.filter((p) => !p.themes.length || p.themes.includes(theme));
    return filtered.length ? filtered : projects;
  }, [projects, theme]);

  // The strip follows the site theme: projects with a light and a dark shot show the matching one.
  useEffect(() => () => void ++token.current, []);
  const themeRef = useRef('dark');
  const changeTheme = useCallback(
    (next: string) => {
      if (themeRef.current === next) return;
      themeRef.current = next;
      if (reducedMotion()) return void setTheme(next);
      const id = ++token.current;
      setFading(true);
      const filtered = projects.filter((p) => !p.themes.length || p.themes.includes(next));
      Promise.all([wait(260), Promise.race([preloadImages(filtered.length ? filtered : projects, mode), wait(1200)])]).then(() => {
        if (token.current !== id) return;
        setTheme(next);
        requestAnimationFrame(() => requestAnimationFrame(() => token.current === id && setFading(false)));
      });
    },
    [projects, mode],
  );
  useEffect(() => {
    const read = () => (document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark');
    themeRef.current = read();
    setTheme(themeRef.current);
    const observer = new MutationObserver(() => changeTheme(read()));
    observer.observe(document.documentElement, {attributes: true, attributeFilter: ['data-theme']});
    return () => observer.disconnect();
  }, [changeTheme]);

  const loopWidth = list.length * (cardSize.w + 20);
  useGSAP(
    () => {
      const track = trackRef.current;
      setCanMove(!!track && !!list.length && !reducedMotion());
      if (!track || !list.length || reducedMotion()) return;
      const tween = gsap.fromTo(track, {x: 0}, {x: -loopWidth, duration: loopWidth / 60, ease: 'none', repeat: -1});
      tweenRef.current = tween;
      if (pausedRef.current) tween.pause();
      // runs only while on screen
      const io = new IntersectionObserver(([entry]) => (entry.isIntersecting && !pausedRef.current ? tween.play() : tween.pause()));
      io.observe(track);
      return () => {
        io.disconnect();
        tween.kill();
        tweenRef.current = null;
      };
    },
    {scope: scopeRef, dependencies: [mode, list.length, loopWidth]},
  );
  const togglePause = () => {
    pausedRef.current = !pausedRef.current;
    setPaused(pausedRef.current);
    if (pausedRef.current) tweenRef.current?.pause();
    else tweenRef.current?.play();
  };

  const preloads = list.slice(0, 2).flatMap((p) => [
    p.mobile ? (
      <link key={`${p.slug}-m`} rel="preload" as="image" fetchPriority="high" media="(max-width: 639px)" href={p.mobile} imageSrcSet={buildSrcSet(p.mobile, MOBILE_WIDTHS)} imageSizes="232px" />
    ) : null,
    <link key={`${p.slug}-d`} rel="preload" as="image" fetchPriority="high" media="(min-width: 640px)" href={p.desktop} imageSrcSet={buildSrcSet(p.desktop)} imageSizes="700px" />,
  ]);

  return (
    <div className="relative">
      {preloads}
      <div
        ref={scopeRef}
        data-theme={theme}
        className="hh-editor relative h-[490px] w-full rounded-t-[18px] border border-b-0 border-hairline bg-transparent p-[6px] pb-0 text-left backdrop-blur-[14px] backdrop-saturate-[1.75] backdrop-brightness-[1.45] sm:h-[620px]"
      >
        <div className="relative h-full overflow-hidden rounded-t-[12px] bg-bg/80">
          <div
            className={`absolute inset-0 overflow-hidden transition-[opacity,translate] motion-reduce:transition-none ${fading ? 'translate-y-2 opacity-0 duration-[220ms] ease-in' : 'translate-y-0 opacity-100 duration-[380ms] ease-[cubic-bezier(0.22,0.61,0.36,1)]'}`}
            style={{paddingTop: 30}}
          >
            <div ref={trackRef} className="flex w-max will-change-transform" style={{gap: 20}}>
              {[0, 1].map((copy) =>
                list.map((project, index) => {
                  if (!project.desktop) return null;
                  const eager = copy === 0 && index < 2;
                  const key = `${copy}-${project.title}`;
                  return (
                    <Link
                      key={key}
                      href={`/works/${project.slug}`}
                      aria-hidden={copy === 1 || undefined}
                      tabIndex={copy === 1 ? -1 : undefined}
                      aria-label={copy === 0 ? `${$t("view-project")}: ${project.title}` : undefined}
                      className={`group relative block h-[412px] w-[232px] shrink-0 touch-pan-y rounded-[8px] sm:h-[700px] sm:w-[700px] ${hovered === key ? 'z-10' : ''}`}
                      onPointerEnter={() => setHovered(key)}
                      onPointerLeave={() => setHovered((h) => (h === key ? null : h))}
                      onPointerMove={(ev) => {
                        const rect = ev.currentTarget.getBoundingClientRect();
                        ev.currentTarget.style.setProperty('--vv-bx', `${ev.clientX - rect.left}px`);
                        ev.currentTarget.style.setProperty('--vv-by', `${ev.clientY - rect.top}px`);
                      }}
                      onContextMenu={(ev) => ev.preventDefault()}
                    >
                      <picture className="contents">
                        {project.mobile ? <source media="(max-width: 639px)" srcSet={buildSrcSet(project.mobile, MOBILE_WIDTHS)} sizes="232px" /> : null}
                        <img
                          src={project.desktop}
                          srcSet={buildSrcSet(project.desktop)}
                          sizes="700px"
                          alt={copy === 0 ? project.title : ''}
                          draggable={false}
                          width={cardSize.w}
                          height={cardSize.h}
                          className="size-full select-none rounded-[8px] object-cover object-top"
                          style={{WebkitTouchCallout: 'none'} as any}
                          loading={eager ? 'eager' : 'lazy'}
                          decoding="async"
                          fetchPriority={eager ? 'high' : 'auto'}
                        />
                      </picture>
                      <ShineBorder />
                      <span
                        aria-hidden
                        style={{left: 'var(--vv-bx, 50%)', top: 'var(--vv-by, 50%)', translate: '-50% 24px'}}
                        className={`pointer-events-none absolute rounded-full bg-blue-700 px-3.5 py-2 text-[12px] leading-none font-medium whitespace-nowrap text-white shadow-[0_10px_30px_-8px_rgba(0,0,0,0.6)] transition-[opacity,scale] duration-200 ease-brand ${hovered === key ? 'scale-100 opacity-100' : 'scale-90 opacity-0'}`}
                      >
                        {$t("view-project")}
                      </span>
                    </Link>
                  );
                }),
              )}
            </div>
          </div>
        </div>
        <span aria-hidden className="pointer-events-none absolute top-[18px] bottom-0 left-[5px] w-[2px] bg-bg" />
        <span aria-hidden className="pointer-events-none absolute top-[18px] bottom-0 right-[5px] w-[2px] bg-bg" />
      </div>
      <div className="hh-editor pointer-events-none absolute inset-x-0 bottom-4 z-30 flex justify-center">
        <div className="pointer-events-auto flex items-center gap-1 rounded-[10px] border border-hairline bg-bg p-[5px]">
          {canMove && (
            <button
              type="button"
              onClick={togglePause}
              aria-label={paused ? $h("strip-play") : $h("strip-pause")}
              title={paused ? $h("strip-play") : $h("strip-pause")}
              className="grid size-10 place-items-center rounded-[6px] text-fg transition-colors hover:bg-tint"
            >
              {paused ? (
                <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden><path d="M8 5.14v13.72a1 1 0 0 0 1.5.86l11-6.86a1 1 0 0 0 0-1.72l-11-6.86A1 1 0 0 0 8 5.14Z" /></svg>
              ) : (
                <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg>
              )}
            </button>
          )}
          <Link
            href={$h("strip-all-work-link")}
            className="flex h-10 items-center gap-1.5 rounded-[6px] bg-fg px-4 text-[13px] leading-none font-medium whitespace-nowrap text-bg transition-colors hover:bg-fg-strong"
          >
            {$h("strip-all-work")}
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M5 12h14M13 6l6 6-6 6" /></svg>
          </Link>
        </div>
      </div>
    </div>
  );
}
