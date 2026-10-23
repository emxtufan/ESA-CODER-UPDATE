import {useEffect, useMemo, useRef, useState, useSyncExternalStore} from 'react';
import gsap from 'gsap';
import {useGSAP} from '@gsap/react';
import Link from '@/components/Link';
import ShineBorder from '@/components/ShineBorder';
import {EsaMark} from '@/components/Logo';
import {DESKTOP_SIZE, SMALL_SIZE, buildSrcSet} from './data';
import {text} from '@/lib/text';
import '@/styles/hero-studio.css';

const $h = text("components/sections/Hero");
type Project = {title: string; slug: string; desktop: string; themes: string[]};
const small = () => window.matchMedia('(max-width: 639px)').matches;
const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export default function Studio({projects}: {projects: Project[]}) {
  const isSmall = useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia('(max-width: 639px)');
      mq.addEventListener('change', cb);
      return () => mq.removeEventListener('change', cb);
    }, small, () => false,
  );
  const reduceMotion = useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      mq.addEventListener('change', cb);
      return () => mq.removeEventListener('change', cb);
    }, reduced, () => true,
  );
  const [theme, setTheme] = useState('light');
  const [panels, setPanels] = useState(true);
  const [paused, setPaused] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [selected, setSelected] = useState<string | null>(null);
  const [viewportSize, setViewportSize] = useState({w: 0, h: 0});
  const cardSize = viewportSize.w ? {w: viewportSize.w, h: viewportSize.w * 9 / 16} : (isSmall ? SMALL_SIZE : DESKTOP_SIZE);
  const scopeRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const tweenRef = useRef<gsap.core.Tween | null>(null);
  const pausedRef = useRef(false);
  const visibleRef = useRef(false);

  useEffect(() => {
    const read = () => setTheme(document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark');
    read();
    const observer = new MutationObserver(read);
    observer.observe(document.documentElement, {attributes: true, attributeFilter: ['data-theme']});
    return () => observer.disconnect();
  }, []);

  const list = useMemo(() => {
    const available = projects.filter(p => p.desktop);
    const matching = available.filter(p => !p.themes.length || p.themes.includes(theme));
    return matching.length ? matching : available;
  }, [projects, theme]);
  const activeProject = list.find(project => project.slug === selected);
  const visibleProjects = activeProject ? [activeProject] : list;
  const previewSize = activeProject && viewportSize.h ? {
    w: viewportSize.w,
    h: viewportSize.h,
  } : cardSize;
  const loopWidth = list.length * (cardSize.w + 20);
  const copies = activeProject || reduceMotion || !loopWidth ? 1 : Math.max(2, Math.ceil(viewportSize.w / loopWidth) + 1);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const observer = new ResizeObserver(([entry]) => setViewportSize({w: entry.contentRect.width, h: entry.contentRect.height}));
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [list.length]);

  useGSAP(() => {
    const track = trackRef.current;
    const viewport = viewportRef.current;
    if (!track || !viewport || !loopWidth) return;
    viewport.scrollLeft = 0;
    if (activeProject || reduceMotion) {
      gsap.set(track, {x: 0});
      return;
    }
    const tween = gsap.fromTo(track, {x: 0}, {
      x: -loopWidth, duration: loopWidth / 60, ease: 'none', repeat: -1, paused: true,
    });
    tweenRef.current = tween;
    const sync = () => tween.paused(pausedRef.current || !visibleRef.current || document.hidden);
    const observer = new IntersectionObserver(([entry]) => {
      visibleRef.current = entry.isIntersecting;
      sync();
    });
    observer.observe(viewport);
    document.addEventListener('visibilitychange', sync);
    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', sync);
      tween.kill();
      tweenRef.current = null;
    };
  }, {scope: scopeRef, dependencies: [list, loopWidth, reduceMotion, activeProject?.slug], revertOnUpdate: true});

  useEffect(() => { tweenRef.current?.timeScale(speed); }, [speed, list, loopWidth, reduceMotion, activeProject?.slug]);

  const setPlayback = (stop: boolean) => {
    pausedRef.current = stop;
    setPaused(stop);
    tweenRef.current?.paused(stop || !visibleRef.current || document.hidden);
    if (!stop) setSelected(null);
  };

  if (!list.length) return null;
  const imageSource = (project: Project) => project.desktop;

  return (
    <div className="esa-studio relative" data-mode="desktop" data-panels={panels} data-reduced={reduceMotion} data-selected={!!activeProject}>
      <div ref={scopeRef} data-theme={theme} className="hh-editor esa-studio-frame">
        <div className="esa-studio-window">
          <div className="esa-studio-header">
            <button
              type="button" className="esa-studio-brand"
              aria-expanded={panels} aria-controls="hero-projects hero-preview-details"
              aria-label={panels ? 'Ascunde panourile' : 'Arată panourile'}
              onClick={() => setPanels(!panels)}
            >
              <EsaMark className="esa-studio-logo" />
              <span aria-hidden>{panels ? '‹' : '›'}</span>
            </button>
            <EsaMark className="esa-studio-logo esa-studio-static-logo" />
            <div className="esa-studio-devices" role="group" aria-label="Dispozitiv de previzualizare">
              <button type="button" aria-pressed={true}>
                <svg viewBox="0 0 24 24" aria-hidden><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
                <span>Desktop</span>
              </button>
            </div>
            <span className="esa-studio-measure" aria-label="Dimensiuni previzualizare">{Math.round(previewSize.w)} × {Math.round(previewSize.h)} px</span>
          </div>
          <div className="esa-studio-body">
            <aside id="hero-projects" className="esa-studio-sidebar esa-studio-projects" aria-label="Proiecte în slider">
              <p className="esa-studio-panel-title">Proiecte <span>{list.length}</span></p>
              <div className="esa-studio-project-list">
                {list.map((project) => (
                  <button key={project.slug} type="button" aria-pressed={selected === project.slug}
                    onClick={() => { setPlayback(true); setSelected(project.slug); }}>
                    <svg viewBox="0 0 24 24" aria-hidden><path d="m12 3 9 5-9 5-9-5 9-5Zm-9 9 9 5 9-5M3 16l9 5 9-5"/></svg>
                    <span>{project.title}</span>
                  </button>
                ))}
              </div>
              <Link href={$h("strip-all-work-link")} className="esa-studio-project-link">{$h("strip-all-work")} ↗</Link>
            </aside>
            <div ref={viewportRef} className="esa-studio-viewport" role="region" aria-label="Previzualizări proiecte" tabIndex={reduceMotion ? 0 : -1}>
              <div ref={trackRef} className="esa-studio-track">
                {Array.from({length: copies}, (_, copy) => visibleProjects.map((project, index) => (
                  <div
                    key={`${copy}-${project.slug}`}
                    className="esa-studio-slide group" data-copy={copy}
                    style={activeProject ? undefined : {width: cardSize.w, height: cardSize.h}}
                    aria-hidden={copy > 0 || undefined}
                  >
                    <picture>
                      <img key={imageSource(project)} src={imageSource(project)} srcSet={buildSrcSet(imageSource(project))}
                        sizes={`${previewSize.w}px`} alt={copy === 0 ? project.title : ''}
                        width={cardSize.w} height={cardSize.h} draggable={false}
                        loading={copy === 0 && index < 2 ? 'eager' : 'lazy'} decoding="async"
                        fetchPriority={copy === 0 && index < 2 ? 'high' : 'auto'}/>
                    </picture>
                    <ShineBorder />
                  </div>
                )))}
              </div>
            </div>
            <aside id="hero-preview-details" className="esa-studio-sidebar esa-studio-details" aria-label="Detalii previzualizare">
              <p className="esa-studio-panel-title">Previzualizare</p>
              <div className="esa-studio-detail-group">
                <h2>Dispozitiv</h2>
                <p><span>Variantă</span><strong>Desktop</strong></p>
                <p><span>Lățime</span><strong>{Math.round(previewSize.w)} px</strong></p>
                <p><span>Înălțime</span><strong>{Math.round(previewSize.h)} px</strong></p>
              </div>
              <div className="esa-studio-detail-group">
                <h2>Galerie</h2>
                <p><span>Proiecte</span><strong>{list.length}</strong></p>
                <p><span>Redare</span><strong>{reduceMotion ? 'Manuală' : paused ? 'Oprită' : 'Automată'}</strong></p>
                {!reduceMotion && <p><span>Viteză</span><strong>{speed}×</strong></p>}
              </div>
              <p className="esa-studio-help">Alege un proiect din panou pentru a-l vedea separat.</p>
            </aside>
          </div>
        </div>
        <ShineBorder />
      </div>
      <div className="hh-editor esa-studio-toolbar">
        {(!reduceMotion || activeProject) && (
            <button type="button" onClick={() => setPlayback(reduceMotion ? false : !paused)} aria-label={reduceMotion ? 'Înapoi la galerie' : paused ? $h("strip-play") : $h("strip-pause")} title={reduceMotion ? 'Înapoi la galerie' : paused ? $h("strip-play") : $h("strip-pause")}>
              <svg viewBox="0 0 24 24" aria-hidden>{paused ? <path d="m8 5 11 7-11 7V5Z"/> : <path d="M8 5v14M16 5v14"/>}</svg>
            </button>
        )}
        {!reduceMotion && (
            <button type="button" onClick={() => setSpeed(speed === 2 ? 0.5 : speed + 0.5)} aria-label={`Viteza sliderului: ${speed}×. Schimbă viteza.`} title="Schimbă viteza">{speed}×</button>
        )}
        <Link href={$h("strip-all-work-link")} className="esa-studio-all">{$h("strip-all-work")} ↗</Link>
      </div>
    </div>
  );
}
