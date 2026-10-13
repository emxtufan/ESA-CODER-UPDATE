import type {ReactNode} from 'react';

import HeadingReveal from '@/components/motion/HeadingReveal';
import Link from '@/components/Link';
import ParallaxDrift from '@/components/motion/ParallaxDrift';
import RevealBatch from '@/components/motion/RevealBatch';
import RollText from '@/components/RollText';
import WorkShots from '@/components/works/WorkShots';

import {collection} from '@/lib/collections';
import {text} from '@/lib/text';

const $t = text('templates/project');

const SITE = 'https://visuvate.com';

const PLATFORM_ICONS: Record<string, string> = {
  'Wix Studio': '/media/12f174fbe6106094af5b31e0042943c2.png',
  'Custom Code': '/media/329ed40d85305cc2cc3b7320e517a911.png',
  Astro: '/media/1b3665b4ea0465298ca8d869fbbca207.png',
  WordPress: '/media/14b4685a23fcb8a367c70dc4aa12a650.png',
  'Next.js': '/media/01c6c37ed2862ef3d8bbe647dc861174.png',
  Framer: '/media/b8f738a1ce12a869dd6b08b1ea128e6b.png',
};

const shineStyle = (angle: string) => ({
  padding: 1,
  animationDuration: '2.8s',
  backgroundImage: `conic-gradient(from calc(var(${angle}) - var(--vv-shine-w, 24deg)), transparent 0deg, #0099FF calc(var(--vv-shine-w, 24deg) / 2), #7ACAFF var(--vv-shine-w, 24deg), transparent calc(var(--vv-shine-w, 24deg) * 2), transparent 360deg)`,
  mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
  WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
  maskComposite: 'exclude',
  WebkitMaskComposite: 'xor',
});
const SHINE_A = shineStyle('--vv-shine-a');
const SHINE_B = shineStyle('--vv-shine-b');

const stripHtml = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

type IconItem = {icon?: string; title?: string};

export function Stat({label, value, icon, className = ''}: {label: string; value: ReactNode; icon: ReactNode; className?: string}) {
  return (
    <div className={`flex flex-col items-center text-center ${className}`}>
      <dt className="order-3 mt-1.5 text-[14px] leading-[1.2] text-fg-subtle">
        {label}
      </dt>
      <dd className="order-2 mt-3 text-[15px] leading-[1.2] font-medium text-fg">
        {value}
      </dd>
      <span aria-hidden className="order-1 text-fg">
        {icon}
      </span>
    </div>
  );
}

export function BriefCard({title, body}: {title: string; body: string}) {
  return (
    <div data-act className="group relative flex flex-col overflow-hidden rounded-[12px] border border-fg/12 backdrop-blur-[12px]" style={{ background: "color-mix(in srgb, var(--vv-bg) 42%, transparent)" }}>
      <span aria-hidden className="pointer-events-none absolute top-0 left-1/2 h-px w-[180px] max-w-[70%] -translate-x-1/2" style={{ background: "linear-gradient(90deg, transparent 0%, color-mix(in srgb, var(--vv-card-line) 52%, transparent) 50%, transparent 100%)" }} />
      <span aria-hidden className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(58% 46% at 50% 0%, color-mix(in srgb, var(--vv-card-lift) 38%, transparent) 0%, color-mix(in srgb, var(--vv-card-lift-mid) 38%, transparent) 45%, transparent 78%)" }} />
      <span aria-hidden className="vv-shine vv-shine-lyr-a pointer-events-none absolute inset-0 rounded-[inherit] pointer-coarse:hidden" style={SHINE_A} />
      <span aria-hidden className="vv-shine vv-shine-lyr-b pointer-events-none absolute inset-0 rounded-[inherit] pointer-coarse:hidden" style={SHINE_B} />
      <div className="relative flex flex-1 flex-col p-7 md:p-8">
        <h2 className="font-display text-[20px] leading-[1.1] font-medium tracking-h3 lg:text-[24px] lg:leading-[1.2]">
          {title}
        </h2>
        <p className="mt-3 text-[14px] leading-[1.6] text-fg-muted lg:mt-4 lg:text-[16px] lg:leading-[1.7]">
          {body}
        </p>
      </div>
    </div>
  );
}

function IconList({title, items}: {title: string; items: IconItem[]}) {
  return (
    <div>
      <h3 className="text-[15px] leading-[1.2] font-medium text-fg">
        {title}
      </h3>
      <ul className="mt-4 flex flex-col gap-3">
        {items.map((entry, i) => (
          <li key={i} className="flex items-center gap-2.5 text-[15px] text-fg-muted">
            <img src={entry.icon} alt="" className="vv-service-icon size-4 shrink-0" loading="lazy" decoding="async" />
            {entry.title}
          </li>
        ))}
      </ul>
    </div>
  );
}

function RelatedCard({project}: {project: any}) {
  return (
    <Link data-reveal href={`/works/${project.slug}`} className="group relative w-[72vw] max-w-[280px] shrink-0 snap-start rounded-[6px] border border-fg/12 bg-bg/30 p-[6px] pb-3 backdrop-blur-[14px] sm:w-auto sm:max-w-none lg:rounded-[12px] lg:p-[10px] lg:pb-4">
      <span aria-hidden className="vv-shine vv-shine-lyr-a pointer-events-none absolute inset-0 rounded-[inherit] pointer-coarse:hidden" style={SHINE_A} />
      <span aria-hidden className="vv-shine vv-shine-lyr-b pointer-events-none absolute inset-0 rounded-[inherit] pointer-coarse:hidden" style={SHINE_B} />
      <div className="relative overflow-hidden rounded-[3px] bg-surface lg:rounded-[6px]" style={{ aspectRatio: "4 / 3" }}>
        <img src={project.image} alt={project.title} className="absolute inset-x-0 top-0 w-full transition-[filter] duration-500 ease-brand group-hover:[filter:blur(7px)_brightness(0.62)]" loading="lazy" decoding="async" />
        <span className="pointer-events-none absolute inset-0 grid place-items-center opacity-0 transition-opacity duration-400 ease-brand group-hover:opacity-100">
          <span className="vv-accent text-[clamp(20px,2vw,28px)] leading-none text-white">
            {$t('view-project')}
          </span>
        </span>
      </div>
      <div className="mt-3 pl-2 lg:mt-4 lg:pl-3">
        <h3 className="truncate font-display text-[16px] leading-[1.25] font-medium tracking-h3 lg:text-[20px]">
          {project.title}
        </h3>
        <p className="mt-[2px] truncate text-[13px] leading-[1.4] text-fg-muted lg:text-[16px]">
          {project.category}
        </p>
      </div>
    </Link>
  );
}

// Explicit `related` slugs first; new items without any get the first 3 other projects.
function relatedProjects(item: any): any[] {
  const all = collection('projects');
  const chosen = (item.related ?? [])
    .map((slug: string) => all.find((p: any) => p.slug === slug))
    .filter((p: any) => p && p.slug !== item.slug);
  return chosen.length ? chosen : all.filter((p: any) => p.slug !== item.slug).slice(0, 3);
}

// A new project may be filled in only partly: blocks without a value are left out.
const has = (value: unknown) => value !== undefined && value !== null && value !== '';

export default function ProjectPage({item}: {item: any}) {
  const url = `${SITE}/works/${item.slug}`;
  const creativeWork = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: item.title,
    description: stripHtml(item.about ?? ''),
    url,
    image: [`${SITE}/_next/image?url=${encodeURIComponent(item.image ?? '')}&w=1200&q=80`],
    creator: {'@id': `${SITE}/#organization`},
  };
  const breadcrumbs = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {'@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/`},
      {'@type': 'ListItem', position: 2, name: 'Works', item: `${SITE}/works`},
      {'@type': 'ListItem', position: 3, name: item.title, item: url},
    ],
  };
  const platformIcon = PLATFORM_ICONS[item.platform];
  const related = relatedProjects(item);
  return (
    <>
      <main className="relative isolate">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(creativeWork) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }} />
        <header className="relative z-0 mx-auto max-w-[1425px] px-6 pt-[153px] md:px-8">
          <ParallaxDrift>
            <HeadingReveal>
              <h1 className="text-center font-display text-[clamp(72px,11vw,160px)] leading-[1] font-medium tracking-[-0.05em] will-change-transform">
                {item.title}
              </h1>
            </HeadingReveal>
          </ParallaxDrift>
        </header>
        <div className="relative z-10 mx-auto max-w-[1425px] px-0 md:px-8">
          <div className="relative rounded-[12px] backdrop-blur-[10px]" style={{ background: "color-mix(in srgb, var(--vv-bg) 80%, transparent)" }}>
            <span aria-hidden className="pointer-events-none absolute top-0 left-1/2 h-px w-[600px] max-w-full -translate-x-1/2" style={{ background: "linear-gradient(90deg, transparent 0%, var(--vv-card-line) 50%, transparent 100%)" }} />
            <span aria-hidden className="pointer-events-none absolute inset-0 rounded-[12px]" style={{ background: "radial-gradient(58% 46% at 50% 0%, var(--vv-card-lift) 0%, var(--vv-card-lift-mid) 45%, transparent 78%)" }} />
            <div className="relative flex flex-col gap-6 pt-[50px] lg:gap-10">
              <section className="grid gap-8 px-4 lg:grid-cols-[1fr_0.5fr] lg:px-8">
                <div>
                  <h2 className="font-display text-[20px] leading-[1.1] font-medium tracking-h3 lg:text-[24px] lg:leading-[1.2]">
                    {$t('project-overview')}
                  </h2>
                  <div className="mt-3 text-[14px] leading-[1.6] text-fg-muted lg:mt-5 lg:text-lead lg:leading-[1.7] [&_a]:text-fg [&_a]:underline [&_li]:mt-2 [&_p]:mt-4 [&_strong]:text-fg [&_ul]:mt-4 [&_ul]:list-disc [&_ul]:pl-5" dangerouslySetInnerHTML={{ __html: item.overview ?? '' }} />
                </div>
                <div className="flex flex-wrap items-end justify-start gap-3 lg:justify-end">
                  <Link href="/works" className="inline-flex items-center rounded-full border border-transparent bg-fg/15 px-[15px] py-[9px] text-[14px] leading-none font-medium transition-colors hover:bg-fg/25">
                    <RollText text={$t('see-all-work')} />
                  </Link>
                  {item.url ? (
                    <a href={item.url} target="_blank" rel="noreferrer" className="inline-flex items-center rounded-full border border-transparent bg-fg px-[15px] py-[9px] text-[14px] leading-none font-medium text-bg transition-colors hover:bg-fg-strong">
                      <RollText text={$t('preview-site')} />
                    </a>
                  ) : null}
                </div>
              </section>
              <dl className="mx-8 grid grid-cols-3 gap-8 border-t pt-6 sm:grid-cols-4 lg:pt-8" style={{ borderColor: "var(--vv-card-rule)" }}>
                <Stat
                  label={$t('industry')}
                  value={item.category}
                  icon={
                    item.industryIcon ? (
                      <img src={item.industryIcon} alt="" className="size-[18px] vv-platform-logo object-contain" loading="lazy" decoding="async" />
                    ) : (
                      <svg viewBox="2.25 2.3 19.5 19.45" className="size-[18px]" fill="currentColor">
                        <path d="m20.55 5.06-8-2.67c-.36-.12-.75-.12-1.11 0L3.45 5.06c-.72.24-1.2.91-1.2 1.66V8c0 .96.79 1.75 1.75 1.75h16c.96 0 1.75-.79 1.75-1.75V6.72c0-.75-.48-1.42-1.2-1.66" />
                        <path d="M21.17 19.13a2.75 2.75 0 0 0-2.61-1.88H5.44c-1.19 0-2.23.76-2.61 1.88l-.1.31c-.18.53-.09 1.12.24 1.58s.86.73 1.42.73h15.23c.56 0 1.09-.27 1.42-.73.33-.45.42-1.04.24-1.58l-.1-.32Z" />
                        <path d="M19.75 15.93v-4.68h-5.5v4.5h4.31c.41 0 .81.07 1.19.18" />
                        <path d="M9.75 15.75v-4.5h-5.5v4.68c.38-.11.78-.18 1.19-.18z" />
                      </svg>
                    )
                  }
                />
                {has(item.created) && <Stat
                  className="hidden sm:flex"
                  label={$t('created')}
                  value={item.created}
                  icon={
                    <svg viewBox="1 1 18 18" className="size-[18px]" fill="currentColor">
                      <path d="M10 1a9 9 0 0 1 9 9 9 9 0 0 1-9 9 9 9 0 0 1-9-9 9 9 0 0 1 9-9m1 4a1 1 0 0 0-2 0v5a1 1 0 0 0 1 1h5a1 1 0 0 0 0-2h-4z" />
                    </svg>
                  }
                />}
                {has(item.pageCount) && <Stat
                  label={$t('pages')}
                  value={item.pageCount}
                  icon={
                    <svg viewBox="1 2 18 16" className="size-[18px]" fill="currentColor">
                      <path d="M12 2a4 4 0 0 1 4 4v8a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V6a4 4 0 0 1 4-4z" />
                      <path d="M2.333 5c.369 0 .667.298.667.667v8.666a.666.666 0 0 1-.667.667A1.333 1.333 0 0 1 1 13.667V6.333C1 5.597 1.597 5 2.333 5" />
                      <path d="M17.667 5C18.403 5 19 5.597 19 6.333v7.334c0 .736-.597 1.333-1.333 1.333a.666.666 0 0 1-.667-.667V5.667c0-.369.298-.667.667-.667" />
                    </svg>
                  }
                />}
                {has(item.platform) && <Stat
                  label={$t('platform')}
                  value={item.platform}
                  icon={platformIcon ? <img src={platformIcon} alt="" className="size-[18px] vv-platform-logo object-contain" loading="lazy" decoding="async" /> : null}
                />}
              </dl>
              <WorkShots shots={(item.shots ?? []).map((shot: any, i: number) => ({ id: shot.id ?? 1000 + i, src: shot.src, title: shot.title }))} alt={item.title} />
            </div>
          </div>
        </div>
        <section className="mx-auto max-w-[1425px] px-4 pt-[36px] md:px-8 md:pt-[96px]">
          <RevealBatch selector="[data-act]" distance={22} stagger={0.09} className="grid gap-4 lg:grid-cols-3 lg:gap-5">
            {has(item.brief) && <BriefCard title={$t('the-brief')} body={item.brief} />}
            {has(item.approach) && <BriefCard title={$t('the-approach')} body={item.approach} />}
            {has(item.outcome) && <BriefCard title={$t('the-outcome')} body={item.outcome} />}
          </RevealBatch>
        </section>
        <section className="mx-auto max-w-[1425px] px-4 pt-[36px] md:px-8 md:pt-[96px]">
          <div className="grid gap-10 lg:grid-cols-[1fr_0.5fr]">
            <RevealBatch selector="h2, p" distance={22} stagger={0.07}>
              <h2 className="font-display text-[20px] leading-[1.1] font-medium tracking-h3 lg:text-[24px] lg:leading-[1.2]">
                {$t('about-the-project')}
              </h2>
              <div className="mt-3 text-[14px] leading-[1.6] text-fg-muted lg:mt-5 lg:text-lead lg:leading-[1.7] [&_a]:text-fg [&_a]:underline [&_li]:mt-2 [&_p]:mt-5 [&_strong]:text-fg [&_ul]:mt-4 [&_ul]:list-disc [&_ul]:pl-5" dangerouslySetInnerHTML={{ __html: item.about ?? '' }} />
            </RevealBatch>
            <RevealBatch selector="h3, li" distance={18} stagger={0.045} className="grid grid-cols-2 gap-x-6 gap-y-6 lg:flex lg:flex-col lg:pl-[132px]">
              <IconList title={$t('pages')} items={item.pagesList ?? []} />
              <IconList title={$t('features')} items={item.featuresList ?? []} />
            </RevealBatch>
          </div>
        </section>
        <RevealBatch className="mx-auto max-w-[1425px] pt-[100px] pb-[130px] max-sm:overflow-x-clip sm:px-6 md:px-8">
          <div className="mb-8 flex items-center justify-between gap-4 px-4 sm:px-0">
            <h2 className="font-display text-[20px] leading-[1.1] font-medium tracking-h3 lg:text-[24px] lg:leading-[1.2]">
              {$t('more-projects')}
            </h2>
            <Link href="/works" className="inline-flex items-center rounded-full border border-transparent bg-fg/15 px-[15px] py-[9px] text-[14px] leading-none font-medium transition-colors hover:bg-fg/25">
              <RollText text={$t('all-projects')} />
            </Link>
          </div>
          <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:grid sm:grid-cols-2 sm:gap-5 sm:overflow-visible sm:px-0 lg:grid-cols-3">
            {related.map((project) => (
              <RelatedCard key={project.slug} project={project} />
            ))}
          </div>
        </RevealBatch>
      </main>
    </>
  );
}
