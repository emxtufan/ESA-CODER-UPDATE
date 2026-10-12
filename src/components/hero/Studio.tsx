// module 1659 (interactive studio inspector with project strip)
import {useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore} from 'react';
import gsap from 'gsap';
import {useGSAP} from '@gsap/react';
import Link from '@/components/Link';
import {VisuvateMark} from '@/components/Logo';
import ShineBorder from '@/components/ShineBorder';
import {useRouter} from '@/lib/navigation';
import {
  DESKTOP_SIZE,
  LANGUAGE_NAMES,
  LAYERS,
  LOCALES,
  MOBILE_SIZE,
  MOBILE_WIDTHS,
  PAGES,
  PANEL_TRANSITION,
  SPEEDS,
  buildSrcSet,
  preloadImages,
  wait,
} from './data';
import {
  Tip,
  TOOLS,
  chevronDown,
  chevronRight,
  desktopIcon,
  homeIcon,
  languageIcon,
  layersIcon,
  mobileIcon,
  moonIcon,
  pageIcon,
  searchIcon,
  sunIcon,
} from './icons';
import PreviewPortal from './PreviewPortal';
import PropertyPanel from './PropertyPanel';

import {text} from '@/lib/text';

const $t = text("components/hero/Studio");

export default function Studio({projects}: {projects: any[]}) {
  const [tab, setTab] = useState('Layers');
  const [langIndex, setLangIndex] = useState(0);
  const [langTipOpen, setLangTipOpen] = useState(false);
  const langTimer = useRef<any>(undefined);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [previewTarget, setPreviewTarget] = useState<any>(null);
  const locale = LOCALES[langIndex];
  const tr = (word: string) => locale.words[word] ?? word;
  const [page, setPage] = useState('Home');
  const [pageMenuOpen, setPageMenuOpen] = useState(false);
  const [activeLayer, setActiveLayer] = useState(0);
  const layers = LAYERS[page] ?? LAYERS.Home;
  const [mode, setMode] = useState('desktop');
  const [modeButton, setModeButton] = useState('desktop');
  const [switched, setSwitched] = useState(false);
  const [fading, setFading] = useState(false);
  const token = useRef(0);
  const [sysTheme, setSysTheme] = useState('dark');
  const [theme, setTheme] = useState('dark');
  const lastSysTheme = useRef<string | null>(null);
  const [panelsOpen, setPanelsOpen] = useState<boolean | null>(null);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setPanelsOpen(window.matchMedia('(min-width: 640px)').matches));
    return () => cancelAnimationFrame(raf);
  }, []);
  useEffect(() => {
    if (!window.matchMedia('(max-width: 639px)').matches) return;
    const raf = requestAnimationFrame(() => {
      setMode('mobile');
      setModeButton('mobile');
    });
    return () => cancelAnimationFrame(raf);
  }, []);
  const [tool, setTool] = useState('cursor');
  const router = useRouter();
  const cardSize = (
    useSyncExternalStore(
      (cb) => {
        const mq = window.matchMedia('(max-width: 639px)');
        mq.addEventListener('change', cb);
        return () => mq.removeEventListener('change', cb);
      },
      () => window.matchMedia('(max-width: 639px)').matches,
      () => false,
    )
      ? MOBILE_SIZE
      : DESKTOP_SIZE
  )[mode];
  const holdTimer = useRef(0);
  const touchStart = useRef({x: 0, y: 0});
  const [speedIndex, setSpeedIndex] = useState(SPEEDS.indexOf(1));
  const dragRef = useRef<{pointer: number; offset: number} | null>(null);
  const [dragging, setDragging] = useState(false);
  const speed = SPEEDS[speedIndex];
  const tweenRef = useRef<any>(null);
  const speedRef = useRef(1);
  const [winWidth, setWinWidth] = useState(0);
  const scopeRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      setWinWidth(window.innerWidth);
    };
    const onResize = () => {
      raf || (raf = requestAnimationFrame(update));
    };
    update();
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      raf && cancelAnimationFrame(raf);
    };
  }, []);
  const list = useMemo(() => {
    const filtered = projects.filter((p) => !p.themes.length || p.themes.includes(theme));
    return filtered.length ? filtered : projects;
  }, [projects, theme]);
  const preloads = switched
    ? null
    : list.slice(0, 2).flatMap((p) => [
        p.mobile ? (
          <link
            key={`${p.slug}-m`}
            rel="preload"
            as="image"
            fetchPriority="high"
            media="(max-width: 639px)"
            href={p.mobile}
            imageSrcSet={buildSrcSet(p.mobile, MOBILE_WIDTHS)}
            imageSizes="232px"
          />
        ) : null,
        <link
          key={`${p.slug}-d`}
          rel="preload"
          as="image"
          fetchPriority="high"
          media="(min-width: 640px)"
          href={p.desktop}
          imageSrcSet={buildSrcSet(p.desktop)}
          imageSizes="700px"
        />,
      ]);
  useEffect(() => () => void ++token.current, []);
  useEffect(() => {
    const read = () => ('light' === document.documentElement.getAttribute('data-theme') ? 'light' : 'dark');
    const initial = read();
    setSysTheme(initial);
    setTheme(initial);
    lastSysTheme.current = initial;
    const observer = new MutationObserver(() => setSysTheme(read()));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
    return () => observer.disconnect();
  }, []);
  const themeRef = useRef('dark');
  useEffect(() => {
    themeRef.current = theme;
  }, [theme]);
  const changeTheme = useCallback(
    (next: string) => {
      if (themeRef.current === next) return;
      if (((themeRef.current = next), window.matchMedia('(prefers-reduced-motion: reduce)').matches))
        return void setTheme(next);
      const id = ++token.current;
      setFading(true);
      const filtered = projects.filter((p) => !p.themes.length || p.themes.includes(next));
      const loaded = preloadImages(filtered.length ? filtered : projects, mode);
      Promise.all([wait(260), Promise.race([loaded, wait(1200)])]).then(() => {
        token.current === id &&
          (setTheme(next),
          requestAnimationFrame(() =>
            requestAnimationFrame(() => {
              token.current === id && setFading(false);
            }),
          ));
      });
    },
    [projects, mode],
  );
  useEffect(() => {
    lastSysTheme.current !== sysTheme && ((lastSysTheme.current = sysTheme), changeTheme(sysTheme));
  }, [sysTheme, changeTheme]);
  const loopWidth = useMemo(() => list.length * (cardSize.w + 20), [list.length, cardSize.w]);
  useGSAP(
    () => {
      const track = trackRef.current;
      if (!track || !list.length || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const tween = gsap.fromTo(track, {x: 0}, {x: -loopWidth, duration: loopWidth / 60, ease: 'none', repeat: -1});
      tween.timeScale(speedRef.current);
      tweenRef.current = tween;
      const io = new IntersectionObserver(([entry]) => (entry.isIntersecting ? tween.play() : tween.pause()), {
        threshold: 0,
      });
      io.observe(track);
      return () => {
        io.disconnect();
        tween.kill();
        tweenRef.current = null;
      };
    },
    {scope: scopeRef, dependencies: [mode, list.length, loopWidth]},
  );
  useEffect(() => {
    speedRef.current = speed;
    tweenRef.current?.timeScale(speed);
  }, [speed]);
  const getTweens = () => gsap.getTweensOf(trackRef.current);
  const endDrag = (ev: any) => {
    if (!dragRef.current) return;
    dragRef.current = null;
    setDragging(false);
    ev.currentTarget.releasePointerCapture?.(ev.pointerId);
    const track = trackRef.current;
    const tween = tweenRef.current ?? getTweens()[0];
    if (!track || !tween || !loopWidth) return;
    const x = new DOMMatrixReadOnly(getComputedStyle(track).transform).m41;
    tween.progress((((-x / loopWidth) % 1) + 1) % 1);
    tween.play();
  };
  useEffect(() => {
    'hand' !== tool && dragRef.current && ((dragRef.current = null), setDragging(false), getTweens().forEach((tw) => tw.play()));
  }, [tool]);
  useEffect(() => {
    if (!pageMenuOpen) return;
    const onPointerDown = (ev: PointerEvent) => {
      (ev.target as Element).closest('[data-page-dropdown]') || setPageMenuOpen(false);
    };
    const onKeyDown = (ev: KeyboardEvent) => {
      'Escape' === ev.key && setPageMenuOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [pageMenuOpen]);

  return (
    <div className="relative">
      {preloads}
      <div
        ref={scopeRef}
        data-theme={theme}
        className="hh-editor relative h-[490px] w-full rounded-t-[18px] border border-b-0 border-hairline bg-transparent p-[6px] pb-0 text-left backdrop-blur-[14px] backdrop-saturate-[1.75] backdrop-brightness-[1.45] sm:h-[620px]"
      >
        <div className="relative flex h-full flex-col overflow-hidden rounded-t-[12px] bg-bg/80">
          <div className="relative z-20 grid grid-cols-[1fr_auto_1fr] items-center rounded-t-[6px] border-b border-hairline bg-bg px-5 py-3">
            <button
              onClick={() => setPanelsOpen((open) => !(open ?? true))}
              aria-expanded={panelsOpen ?? true}
              aria-label={(panelsOpen ?? true) ? $t("collapse-panels") : $t("expand-panels")}
              className="flex w-fit items-center gap-1 rounded-[6px] bg-tint-weak px-2 py-1.5 transition-colors hover:bg-tint"
            >
              <VisuvateMark className="size-[18px] text-fg" />
              <span className={`text-fg transition-transform duration-300 ${false === panelsOpen ? 'rotate-180' : ''}`}>
                {chevronRight('size-3')}
              </span>
            </button>
            <div className="flex items-center gap-2">
              <div className="flex h-[30px] w-[170px] gap-0.5 rounded-[6px] bg-field p-0.5">
                {['desktop', 'mobile'].map((m) => (
                  <button
                    key={m}
                    onClick={() =>
                      ((next: string) => {
                        if (next === mode || fading) return;
                        if (
                          (setSwitched(true),
                          setModeButton(next),
                          window.matchMedia('(prefers-reduced-motion: reduce)').matches)
                        )
                          return void setMode(next);
                        const id = ++token.current;
                        setFading(true);
                        const loaded = preloadImages(list, next);
                        Promise.all([wait(260), Promise.race([loaded, wait(1200)])]).then(() => {
                          token.current === id &&
                            (setMode(next),
                            requestAnimationFrame(() =>
                              requestAnimationFrame(() => {
                                token.current === id && setFading(false);
                              }),
                            ));
                        });
                      })(m)
                    }
                    aria-pressed={modeButton === m}
                    aria-label={`${m} preview`}
                    className={`grid flex-1 place-items-center rounded-[4px] transition-colors ${modeButton === m ? 'bg-bg text-fg shadow-[0_1px_2px_var(--vv-raise-shadow)]' : 'text-fg-subtle hover:text-fg-muted'}`}
                  >
                    {'desktop' === m ? desktopIcon('size-5') : mobileIcon('size-4')}
                  </button>
                ))}
              </div>
              <div className="hidden h-[30px] w-[170px] items-center gap-1 rounded-[6px] border border-hairline p-1 sm:flex">
                <span className="flex flex-1 items-center justify-center gap-0.5 text-[12px] leading-none">
                  <span className="text-fg-subtle">{$t("w")}</span>
                  <span className="text-fg tabular-nums">
                    {winWidth || '0000'}
                    {$t("px")}
                  </span>
                </span>
                <span className="text-[14px] leading-none text-fg-subtle">|</span>
                <span className="flex flex-1 items-center justify-center gap-0.5 text-[12px] leading-none text-fg">
                  {searchIcon('size-3 text-fg-subtle')}
                  <span className="tabular-nums">
                    {100}
                    {'%'}
                  </span>
                </span>
              </div>
            </div>
            <div className="flex justify-self-end">
              {[
                {src: '/team/avatar-2.58306c73.jpg', alt: $t("visuvate-team-member")},
                {src: '/team/avatar-1.0c4e3fc0.jpg', alt: $t("visuvate-team-member")},
              ].map((avatar, i) => (
                <img
                  key={avatar.src}
                  src={avatar.src}
                  alt={avatar.alt}
                  width={28}
                  height={28}
                  decoding="async"
                  className={`size-7 rounded-full border border-hairline object-cover ${i ? '-ml-2' : ''}`}
                />
              ))}
            </div>
          </div>
          <div className="relative flex-1 overflow-hidden">
            <div
              className={`absolute inset-0 z-0 overflow-hidden transition-[opacity,translate] motion-reduce:transition-none ${fading ? 'translate-y-2 opacity-0 duration-[220ms] ease-in' : 'translate-y-0 opacity-100 duration-[380ms] ease-[cubic-bezier(0.22,0.61,0.36,1)]'} ${'hand' === tool ? `pointer-events-auto touch-pan-y select-none ${dragging ? 'cursor-grabbing' : 'cursor-grab'}` : ''}`}
              style={{paddingTop: 30}}
              onPointerDown={(ev) => {
                'hand' === tool &&
                  trackRef.current &&
                  (getTweens().forEach((tw) => tw.pause()),
                  (dragRef.current = {
                    pointer: ev.clientX,
                    offset: new DOMMatrixReadOnly(getComputedStyle(trackRef.current).transform).m41,
                  }),
                  setDragging(true),
                  ev.currentTarget.setPointerCapture(ev.pointerId));
              }}
              onPointerMove={(ev) => {
                const drag = dragRef.current;
                if (!drag || !trackRef.current) return;
                const delta = ev.clientX - drag.pointer;
                delta && ((drag.pointer = ev.clientX), (drag.offset += delta), gsap.set(trackRef.current, {x: drag.offset}));
              }}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
            >
              <div ref={trackRef} className="flex w-max will-change-transform" style={{gap: 20}}>
                {[0, 1].map((copy) =>
                  list.map((project, index) => {
                    const src = 'desktop' === mode ? project.desktop : project.mobile;
                    if (switched ? !src : !project.desktop) return null;
                    const eager = 0 === copy && index < 2;
                    const key = `${copy}-${project.title}`;
                    const isSelect = 'cursor' === tool;
                    const isZoom = 'zoom' === tool;
                    const interactive = isSelect || isZoom;
                    const isHovered = interactive && hoveredCard === key;
                    const image = (
                      <img
                        src={switched ? src : project.desktop}
                        srcSet={buildSrcSet(switched ? src : project.desktop)}
                        sizes={switched ? '(max-width: 639px) 232px, 700px' : '700px'}
                        alt={0 === copy ? project.title : ''}
                        aria-hidden={1 === copy}
                        draggable={false}
                        width={cardSize.w}
                        height={cardSize.h}
                        className="size-full select-none rounded-[8px] object-cover object-top"
                        style={{WebkitTouchCallout: 'none'} as any}
                        loading={eager ? 'eager' : 'lazy'}
                        decoding="async"
                        fetchPriority={eager ? 'high' : 'auto'}
                      />
                    );
                    return (
                      <div
                        key={key}
                        style={switched ? {width: cardSize.w, height: cardSize.h} : undefined}
                        className={`group group/card relative shrink-0 touch-pan-y rounded-[8px] ${switched ? '' : 'h-[412px] w-[232px] sm:h-[700px] sm:w-[700px] '}${interactive ? `pointer-events-auto ${isSelect ? 'cursor-zoom-in' : 'cursor-pointer'}` : 'pointer-events-none'} ${isHovered ? 'z-10' : ''}`}
                        role={isZoom ? 'link' : undefined}
                        tabIndex={isZoom && 0 === copy ? 0 : undefined}
                        aria-label={isZoom && 0 === copy ? `Open ${project.title}` : undefined}
                        onClick={() => {
                          isZoom && router.push(`/works/${project.slug}`);
                        }}
                        onContextMenu={(ev) => ev.preventDefault()}
                        onKeyDown={(ev) => {
                          isZoom && 'Enter' === ev.key && router.push(`/works/${project.slug}`);
                        }}
                        onPointerEnter={() => interactive && setHoveredCard(key)}
                        onPointerMove={(ev) => {
                          if (!interactive) return;
                          holdTimer.current &&
                            'touch' === ev.pointerType &&
                            Math.hypot(ev.clientX - touchStart.current.x, ev.clientY - touchStart.current.y) > 8 &&
                            (window.clearTimeout(holdTimer.current), (holdTimer.current = 0));
                          const rect = ev.currentTarget.getBoundingClientRect();
                          ev.currentTarget.style.setProperty('--vv-bx', `${ev.clientX - rect.left}px`);
                          ev.currentTarget.style.setProperty('--vv-by', `${ev.clientY - rect.top}px`);
                        }}
                        onPointerLeave={() => {
                          window.clearTimeout(holdTimer.current);
                          holdTimer.current = 0;
                          setHoveredCard((current) => (current === key ? null : current));
                          setPreviewTarget(null);
                          tweenRef.current?.play();
                        }}
                        onPointerDown={(ev) => {
                          if (!isSelect) return;
                          const el = ev.currentTarget;
                          const pointerId = ev.pointerId;
                          const hold = () => {
                            tweenRef.current?.pause();
                            try {
                              el.setPointerCapture(pointerId);
                            } catch {}
                            setPreviewTarget({
                              title: project.title,
                              desktop: project.desktop,
                              mobile: project.mobile,
                            });
                          };
                          'touch' === ev.pointerType
                            ? ((touchStart.current = {x: ev.clientX, y: ev.clientY}),
                              window.clearTimeout(holdTimer.current),
                              (holdTimer.current = window.setTimeout(hold, 350)))
                            : hold();
                        }}
                        onPointerUp={() => {
                          window.clearTimeout(holdTimer.current);
                          holdTimer.current = 0;
                          setPreviewTarget(null);
                          tweenRef.current?.play();
                        }}
                        onPointerCancel={() => {
                          window.clearTimeout(holdTimer.current);
                          holdTimer.current = 0;
                          setPreviewTarget(null);
                          tweenRef.current?.play();
                        }}
                      >
                        {switched ? (
                          image
                        ) : (
                          <picture className="contents">
                            {project.mobile ? (
                              <source media="(max-width: 639px)" srcSet={buildSrcSet(project.mobile, MOBILE_WIDTHS)} sizes="232px" />
                            ) : null}
                            {image}
                          </picture>
                        )}
                        <ShineBorder />
                        <span
                          aria-hidden
                          style={{
                            left: 'var(--vv-bx, 50%)',
                            top: 'var(--vv-by, 50%)',
                            translate: '-50% 24px',
                          }}
                          className={`pointer-events-none absolute rounded-full bg-blue-700 px-3.5 py-2 text-[12px] leading-none font-medium whitespace-nowrap text-white shadow-[0_10px_30px_-8px_rgba(0,0,0,0.6)] transition-[opacity,scale] duration-200 ease-brand ${isHovered && !previewTarget ? 'scale-100 opacity-100' : 'scale-90 opacity-0'}`}
                        >
                          {isSelect ? $t("press-hold") : $t("view-project")}
                        </span>
                      </div>
                    );
                  }),
                )}
              </div>
            </div>
            <aside
              aria-hidden={false === panelsOpen}
              inert={false === panelsOpen}
              className={`absolute top-0 bottom-0 left-0 z-10 flex w-[300px] max-w-[85%] flex-col gap-2.5 border-r border-hairline bg-bg pt-3 pr-5 pl-5 will-change-transform ${PANEL_TRANSITION} ${null === panelsOpen ? 'pointer-events-none -translate-x-full sm:pointer-events-auto sm:translate-x-0' : panelsOpen ? 'translate-x-0' : 'pointer-events-none -translate-x-full'}`}
            >
              <div className="border-b border-hairline pb-3">
                <div className="flex gap-0.5 rounded-[10px] bg-tint-weak p-0.5">
                  {['Pages', 'Layers', 'Assets'].map((name, i) => (
                    <button
                      key={name}
                      onClick={() => setTab(name)}
                      aria-pressed={tab === name}
                      className={`flex-1 rounded-[8px] px-2 py-1.5 text-center text-body-s transition-colors hover:bg-tint hover:text-fg-strong ${tab === name ? 'bg-tint font-medium text-fg-strong shadow-[0_1px_2px_var(--vv-raise-shadow)]' : 'text-fg-muted'}`}
                    >
                      {locale.tabs[i]}
                    </button>
                  ))}
                </div>
              </div>
              {'Layers' === tab && (
                <>
                  <div data-page-dropdown className="relative border-b border-hairline pb-3">
                    <button
                      onClick={() => setPageMenuOpen((open) => !open)}
                      aria-expanded={pageMenuOpen}
                      className="flex w-full items-center gap-2.5 rounded-[8px] bg-tint-weak p-2 text-left text-body-s text-fg transition-colors hover:bg-tint"
                    >
                      {homeIcon('size-4 text-fg-muted')}
                      {tr(page)}
                      <span className="ml-auto text-fg-subtle">{chevronDown('size-3')}</span>
                    </button>
                    {pageMenuOpen && (
                      <ul className="absolute inset-x-0 top-[calc(100%-4px)] z-20 flex flex-col gap-0.5 rounded-[8px] border border-hairline bg-bg p-1 shadow-[0_18px_40px_-12px_rgba(0,0,0,0.7)]">
                        {PAGES.map((item) => (
                          <li key={item.label}>
                            <button
                              onClick={() => {
                                setPage(item.label);
                                setActiveLayer(0);
                                setPageMenuOpen(false);
                              }}
                              className={`flex w-full items-center gap-2.5 rounded-[6px] p-2 text-left text-body-s transition-colors hover:bg-tint ${page === item.label ? 'bg-tint text-fg' : 'text-fg-muted'}`}
                            >
                              {'Home' === item.label ? homeIcon('size-4') : pageIcon('size-4')}
                              {tr(item.label)}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <ul className="-mx-1 flex flex-col gap-0.5 overflow-y-auto px-1 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {layers.map((layer, i) => (
                      <li key={layer}>
                        <button
                          onClick={() => {
                            setActiveLayer(i);
                            'Home' === page &&
                              document.getElementById(layers[i].toLowerCase().replace(/\s+/g, '-'))?.scrollIntoView({
                                behavior: 'smooth',
                              });
                          }}
                          className={`flex w-full items-center gap-2.5 rounded-[8px] p-2 text-left text-body-s whitespace-nowrap transition-colors ${activeLayer === i ? 'bg-blue-700 font-medium text-white' : 'text-fg-muted hover:bg-tint-weak hover:text-fg'}`}
                        >
                          <span className={activeLayer === i ? 'text-white/70' : 'text-fg-subtle'}>{chevronRight('size-2.5')}</span>
                          {layersIcon(`size-4 ${activeLayer === i ? 'text-white' : 'text-fg-subtle'}`)}
                          {tr(layer)}
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              )}
              {'Pages' === tab && (
                <ul className="-mx-1 flex flex-col gap-0.5 overflow-y-auto px-1 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {PAGES.map((item) => (
                    <li key={item.label}>
                      <Link
                        href={item.href}
                        className={`flex items-center gap-2.5 rounded-[8px] p-2 text-body-s transition-colors hover:bg-tint ${'Home' === item.label ? 'bg-tint-weak text-fg' : 'text-fg-muted'}`}
                      >
                        {'Home' === item.label ? homeIcon('size-4') : pageIcon('size-4 text-fg-subtle')}
                        {tr(item.label)}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              {'Assets' === tab && (
                <ul className="grid auto-rows-max grid-cols-2 content-start gap-2 overflow-y-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {list.map((project) => (
                    <li key={project.title} className="overflow-hidden rounded-[8px] border border-hairline">
                      <img
                        src={project.desktop}
                        alt={project.title}
                        loading="lazy"
                        decoding="async"
                        draggable={false}
                        className="aspect-[4/3] w-full object-cover object-top"
                      />
                    </li>
                  ))}
                </ul>
              )}
            </aside>
            <aside
              aria-hidden={false === panelsOpen}
              inert={false === panelsOpen}
              className={`absolute top-0 right-0 bottom-0 z-10 hidden w-[300px] overflow-hidden border-l border-hairline bg-bg will-change-transform min-[981px]:block ${PANEL_TRANSITION} ${false === panelsOpen ? 'pointer-events-none translate-x-full' : 'translate-x-0'}`}
            >
              <PropertyPanel t={tr} />
            </aside>
          </div>
        </div>
        <span aria-hidden className="pointer-events-none absolute top-[18px] bottom-0 left-[5px] w-[2px] bg-bg" />
        <span aria-hidden className="pointer-events-none absolute top-[18px] bottom-0 right-[5px] w-[2px] bg-bg" />
      </div>
      <div className="hh-editor pointer-events-none absolute inset-x-0 bottom-4 z-30 flex justify-center">
        <div role="toolbar" aria-label={$t("canvas-tools")} className="pointer-events-auto flex gap-1 rounded-[10px] border border-hairline bg-bg p-[5px]">
          {TOOLS.map((item) => (
            <Tip key={item.id} text={item.tip}>
              <button
                onClick={() => setTool(item.id)}
                aria-pressed={tool === item.id}
                aria-label={item.label}
                className={`grid size-10 place-items-center rounded-[6px] transition-colors ${tool === item.id ? 'bg-blue-500 text-white' : 'text-fg hover:bg-tint'}`}
              >
                {item.icon('size-6')}
              </button>
            </Tip>
          ))}
          <Tip text={$t("marquee-speed")}>
            <button
              onClick={() => setSpeedIndex((i) => (i + 1) % SPEEDS.length)}
              aria-label={`Ticker speed, ${speed}x`}
              className="grid size-10 place-items-center rounded-[6px] text-[13px] leading-none font-semibold text-fg transition-colors hover:bg-tint"
            >
              {speed}
              {$t("x")}
            </button>
          </Tip>
          <Tip text={$t("canvas-theme")}>
            <button
              onClick={() => changeTheme('dark' === theme ? 'light' : 'dark')}
              aria-label={`Canvas theme, ${theme}`}
              className="grid size-10 place-items-center rounded-[6px] text-fg transition-colors hover:bg-tint"
            >
              {'light' === theme ? sunIcon('size-6') : moonIcon('size-6')}
            </button>
          </Tip>
          <Tip text={langTipOpen ? (LANGUAGE_NAMES[locale.code] ?? locale.code) : $t("interface-language")} open={langTipOpen}>
            <button
              onClick={() => {
                setLangIndex((i) => (i + 1) % LOCALES.length);
                setLangTipOpen(true);
                window.clearTimeout(langTimer.current);
                langTimer.current = window.setTimeout(() => setLangTipOpen(false), 1400);
              }}
              aria-label={`Interface language, ${locale.code}`}
              className="grid size-10 place-items-center rounded-[6px] text-fg transition-colors hover:bg-tint"
            >
              {languageIcon('size-6')}
            </button>
          </Tip>
        </div>
      </div>
      <PreviewPortal target={previewTarget} />
    </div>
  );
}
