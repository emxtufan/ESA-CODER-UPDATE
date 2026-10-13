// Financial-accounting automation (SAGA WEB): a second row right under Software (no heading of its own), mirrored:
// the flows we automate in the left card, the whole video in the right card, under its text.
// Texts are edited in the admin (Homepage › Automatizare); /automation has the details.
import {useEffect, useRef, useState} from 'react';
import Link from '@/components/Link';
import Reveal from '@/components/motion/Reveal';
import RollText from '@/components/RollText';
import {ICONS, useOptionsInView} from '@/components/sections/Software';
import '@/styles/automation.css';

import {text} from '@/lib/text';

const $t = text("components/sections/Automation");

export const PREVIEW = {src: '/automation/saga-preview.mp4', poster: '/automation/saga-preview.jpg'};

// The preview: a muted loop (it only downloads and plays while on screen) with a zoom button; the zoom button or a
// click on the video opens it large in a native <dialog>, where our own controls (not the browser's) appear:
// play/pause, a progress line you can click, the time and close.
const PLAYER_ICONS = {
  play: <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z" fill="currentColor" stroke="none" />,
  pause: <path d="M8 5v14M16 5v14" strokeWidth="3" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  zoom: <path d="M3 9V3h6M3 3l6 6M21 9V3h-6M21 3l-6 6M3 15v6h6M3 21l6-6M21 15v6h-6M21 21l-6-6" />,
};
const PlayerIcon = ({name}: {name: keyof typeof PLAYER_ICONS}) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    {PLAYER_ICONS[name]}
  </svg>
);
const clock = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

function Controls({video, onClose}: {video: React.RefObject<HTMLVideoElement | null>; onClose: () => void}) {
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState({at: 0, of: 0});
  useEffect(() => {
    const v = video.current;
    if (!v) return;
    const sync = () => {
      setPlaying(!v.paused);
      setTime({at: v.currentTime, of: v.duration || 0});
    };
    const events = ['play', 'pause', 'timeupdate', 'loadedmetadata'];
    events.forEach((e) => v.addEventListener(e, sync));
    return () => events.forEach((e) => v.removeEventListener(e, sync));
  }, [video]);
  const toggle = () => {
    const v = video.current;
    if (!v) return;
    if (v.paused) v.play().catch(() => {});
    else v.pause();
  };
  const seek = (e: React.MouseEvent<HTMLElement>) => {
    const v = video.current;
    if (!v?.duration) return;
    const r = e.currentTarget.getBoundingClientRect();
    v.currentTime = ((e.clientX - r.left) / r.width) * v.duration;
  };
  const pct = time.of ? (time.at / time.of) * 100 : 0;
  return (
    <div className="au-controls">
      <button type="button" className="au-btn" onClick={toggle} aria-label={$t(playing ? 'pause' : 'play')}>
        <PlayerIcon name={playing ? 'pause' : 'play'} />
      </button>
      <button type="button" className="au-track" onClick={seek} aria-label={$t('seek')}>
        <i style={{width: `${pct}%`}} />
      </button>
      <span className="au-time">{clock(time.at)} / {clock(time.of)}</span>
      <button type="button" className="au-btn" onClick={onClose} aria-label={$t('close')}>
        <PlayerIcon name="close" />
      </button>
    </div>
  );
}

export function PreviewVideo({className = ''}: {className?: string}) {
  const small = useRef<HTMLVideoElement>(null);
  const big = useRef<HTMLVideoElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const video = small.current;
    if (!video) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) video.pause();
      else if (!dialog.current?.open) video.play().catch(() => {});
    }, {threshold: 0.25});
    io.observe(video);
    return () => io.disconnect();
  }, []);
  const open = () => {
    const [s, b, d] = [small.current, big.current, dialog.current];
    if (!s || !b || !d) return;
    b.currentTime = s.currentTime;
    s.pause();
    d.showModal();
    b.play().catch(() => {});
  };
  // the dialog's close event (button, Esc or a click on the backdrop): hand the position back to the small one
  const closed = () => {
    const [s, b] = [small.current, big.current];
    if (!s || !b) return;
    b.pause();
    s.currentTime = b.currentTime;
    s.play().catch(() => {});
  };
  const video = {src: PREVIEW.src, poster: PREVIEW.poster, muted: true, loop: true, playsInline: true, preload: 'none', 'aria-label': $t('video-label')} as const;
  return (
    <>
      <div className={`au-player ${className}`}>
        <video ref={small} className="au-video" {...video} onClick={open} />
        <button type="button" className="au-zoom" onClick={open} aria-label={$t('expand')}>
          <PlayerIcon name="zoom" />
        </button>
      </div>
      <dialog ref={dialog} className="au-lightbox" onClose={closed} onClick={(e) => e.target === e.currentTarget && dialog.current?.close()}>
        <div className="au-player">
          <video ref={big} className="au-video" {...video} onClick={() => (big.current?.paused ? big.current.play() : big.current?.pause())} />
          <Controls video={big} onClose={() => dialog.current?.close()} />
        </div>
      </dialog>
    </>
  );
}

const FLOWS = [
  {icon: ICONS.bank, n: 1},
  {icon: ICONS.invoice, n: 2},
  {icon: ICONS.plane, n: 3},
  {icon: ICONS.check, n: 4},
  {icon: ICONS.scan, n: 5},
  {icon: ICONS.chart, n: 6},
];

export default function Automation() {
  const options = useOptionsInView();
  return (
    <section id="automation" className="au-section bg-bg">
      <div className="mx-auto max-w-[1380px] px-6 md:px-8">
        <Reveal refreshOnComplete>
          {/* second row under Software, mirrored like Approach's rows: 540 / 775, 560px tall on large screens */}
          <div className="grid gap-5 min-[751px]:grid-cols-[540fr_775fr] lg:h-[560px]">
            <article data-reveal className="relative isolate flex flex-col overflow-hidden rounded-[12px] border border-fg/20 bg-card lg:min-h-0">
              <div className="sw-build relative z-10 flex h-full flex-col px-5 py-8 lg:px-9 lg:pt-[45px]">
                <h3 className="font-display text-[clamp(24px,2.6vw,36px)] leading-[1.1] font-medium tracking-h2">{$t("list-title")}</h3>
                <ul ref={options} className="sw-options" style={{'--n': FLOWS.length} as React.CSSProperties}>
                  {FLOWS.map((f, i) => (
                    <li key={f.n} style={{'--i': i} as React.CSSProperties}>
                      <span className="sw-option-icon">{f.icon}</span>
                      <span>
                        <b>{$t(`flow-${f.n}`)}</b>
                        <small>{$t(`flow-${f.n}-text`)}</small>
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="sw-cta mt-6 flex flex-wrap gap-2.5">
                  <Link
                    href={$t("cta-link")}
                    className="inline-flex items-center rounded-full border border-transparent bg-fg px-[15px] py-[9px] text-[14px] leading-none font-medium text-bg transition-colors hover:bg-fg-strong"
                  >
                    <RollText text={$t("cta")} />
                  </Link>
                  <Link
                    href={$t("more-link")}
                    className="inline-flex items-center rounded-full border border-line-strong px-[15px] py-[9px] text-[14px] leading-none font-medium transition-colors hover:border-fg-subtle hover:bg-surface"
                  >
                    <RollText text={$t("more")} />
                  </Link>
                </div>
              </div>
            </article>
            <article data-reveal className="relative isolate flex flex-col overflow-hidden rounded-[12px] border border-fg/20 bg-card lg:min-h-0">
              <div className="vv-art-cms absolute inset-0 -z-10" aria-hidden />
              <div className="relative z-10 px-5 py-8 lg:px-9 lg:pt-[45px] lg:pb-0">
                <h3 className="font-display text-[clamp(24px,2.6vw,36px)] leading-[1.1] font-medium tracking-h2 text-white">
                  {$t("card-title")}
                </h3>
                <p className="mt-2 text-[12px] leading-[1.6] lg:mt-3 lg:text-lead text-white/70">
                  <span>{$t("card-text-1")}</span>
                  <span className="text-white">{$t("card-text-2")}</span>
                  <span>{$t("card-text-3")}</span>
                </p>
              </div>
              <div className="au-media">
                <PreviewVideo />
              </div>
            </article>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
