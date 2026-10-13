// The services added after the original ten, as /services cards in the same shell (glass card, shine, title, "Detalii").
// Their pictures are coded (aria-hidden): the dashboard and SAGA video poster we already have, the data-flow mock-up of
// the home page, a turning cube and three vertical "reels".
import Link from '@/components/Link';
import {PipelineMock} from '@/components/sections/AutomationMore';
import '@/styles/automation-more.css';
import '@/styles/services-extra.css';

import {text} from '@/lib/text';

const $t = text("/services");

const SHINE = (v: 'a' | 'b') => ({
  padding: 1,
  animationDuration: '2.8s',
  backgroundImage: `conic-gradient(from calc(var(--vv-shine-${v}) - var(--vv-shine-w, 24deg)), transparent 0deg, #0099FF calc(var(--vv-shine-w, 24deg) / 2), #7ACAFF var(--vv-shine-w, 24deg), transparent calc(var(--vv-shine-w, 24deg) * 2), transparent 360deg)`,
  mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
  WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
  maskComposite: 'exclude',
  WebkitMaskComposite: 'xor',
} as React.CSSProperties);

const CARDS = [
  {
    href: '/services/software-and-erp', key: 'software-and-erp', title: $t("software-and-erp"), text: $t("software-and-erp-text"),
    art: <div className="svx-frame"><img src="/services/erp-dashboard.webp" alt="" loading="lazy" decoding="async" /></div>,
  },
  {
    href: '/automation', key: 'saga-automation', title: $t("saga-automation"), text: $t("saga-automation-text"),
    art: <img className="svx-cover" src="/automation/saga-preview.jpg" alt="" loading="lazy" decoding="async" />,
  },
  {
    href: '/services/business-automation', key: 'business-automation', title: $t("business-automation"), text: $t("business-automation-text"),
    art: <div className="svx-mock is-in is-live"><PipelineMock /></div>,
  },
  {
    href: '/services/3d-modeling', key: '3d-modeling', title: $t("3d-modeling"), text: $t("3d-modeling-text"),
    art: (
      <div className="svx-scene">
        <div className="svx-cube">{['f', 'b', 'r', 'l', 't', 'd'].map((s) => <i key={s} className={`svx-${s}`} />)}</div>
        <span className="svx-shadow" />
      </div>
    ),
  },
  {
    href: '/services/video-and-reels', key: 'video-and-reels', title: $t("video-and-reels"), text: $t("video-and-reels-text"),
    art: (
      <div className="svx-reels">
        {['/approach/phone-a.webp', '/approach/site-b.webp', '/approach/phone-b.webp'].map((src, i) => (
          <span key={src} className="svx-reel" style={{animationDelay: `${i * 0.9}s`}}>
            <img src={src} alt="" loading="lazy" decoding="async" />
            <b className="svx-play" />
            <i className="svx-progress" style={{animationDelay: `${i * 0.9}s`}} />
          </span>
        ))}
      </div>
    ),
  },
];

export default function ExtraServiceCards() {
  return (
    <>
      {CARDS.map((c) => (
        <Link key={c.key} data-reveal href={c.href} className="group relative flex flex-col gap-3 rounded-[6px] border border-fg/12 bg-bg/30 p-[6px] pb-3 backdrop-blur-[14px] lg:gap-5 lg:rounded-[12px] lg:p-[10px] lg:pb-4">
          <span aria-hidden className="vv-shine vv-shine-lyr-a pointer-events-none absolute inset-0 rounded-[inherit] pointer-coarse:hidden" style={SHINE('a')} />
          <span aria-hidden className="vv-shine vv-shine-lyr-b pointer-events-none absolute inset-0 rounded-[inherit] pointer-coarse:hidden" style={SHINE('b')} />
          <div className="relative overflow-hidden rounded-[3px] lg:rounded-[6px]">
            <div aria-hidden className="svx-art relative aspect-[16/10] overflow-hidden">
              <span className="pointer-events-none absolute inset-0" style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.17) 1px, transparent 1px)", backgroundSize: "13px 13px", maskImage: "radial-gradient(130% 110% at 50% 0%, #000 26%, transparent 76%)", WebkitMaskImage: "radial-gradient(130% 110% at 50% 0%, #000 26%, transparent 76%)" }} />
              {c.art}
            </div>
          </div>
          <div className="flex flex-1 items-end justify-between gap-4 pl-2">
            <div className="flex min-w-0 flex-col gap-1.5">
              <h2 className="font-display text-[16px] leading-[1.25] font-medium tracking-h3 lg:text-[21px]">
                {c.title}
              </h2>
              <p className="line-clamp-2 text-[13px] leading-[1.5] text-fg-muted lg:text-[14px]">
                {c.text}
              </p>
            </div>
            <span className="hidden shrink-0 rounded-[10px] bg-fg/10 px-4 py-2.5 text-[14px] leading-none font-medium text-fg transition-colors group-hover:bg-fg/20 group-hover:text-fg-strong lg:inline-flex">
              {$t("explore")}
            </span>
          </div>
        </Link>
      ))}
    </>
  );
}
