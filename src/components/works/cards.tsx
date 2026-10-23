// module 8438
// Exports (compiled name -> readable name): p -> CardGrid, $ -> ProjectCard
import Link from '@/components/Link';
import BadgeImage from '@/components/BadgeImage';
import ShineBorder from '@/components/ShineBorder';
import {mediaSrcSet} from '@/lib/media';

import {text} from '@/lib/text';

const $t = text("components/works/cards");

export function CardGrid({children, mobileColumns = 2}: any) {
  return (
    <div className="mx-auto max-w-[1425px] px-4 pb-[clamp(80px,10vw,140px)] md:px-8">
      <div
        className={`flex flex-wrap justify-center gap-2 lg:gap-5 lg:[&>*]:w-[calc((100%-40px)/3)] ${1 === mobileColumns ? '[&>*]:w-full' : '[&>*]:w-[calc((100%-8px)/2)]'}`}
      >
        {children}
      </div>
    </div>
  );
}

export function ProjectCard({
  href,
  image,
  title,
  sub,
  action,
  actionHref,
  overlay = $t("view-project"),
  meta,
  aspect = '4 / 3',
  focus = 'top',
  eager = false,
  children,
}: any) {
  const cardClass =
    'group relative flex flex-col gap-3 rounded-[6px] border border-fg/12 bg-bg/30 p-[6px] pb-3 lg:gap-6 lg:rounded-[12px] lg:p-[10px] lg:pb-4';
  const actionClass =
    'hidden rounded-[10px] bg-tint px-4 py-2.5 text-[14px] leading-none font-medium text-fg transition-colors group-hover:bg-tint-strong group-hover:text-fg-strong lg:inline-flex';
  const media = (
    <div
      className="relative overflow-hidden rounded-[3px] bg-surface lg:rounded-[6px]"
      style={{aspectRatio: aspect}}
    >
      {image ? (
        <BadgeImage
          src={image}
          srcSet={mediaSrcSet(image)}
          sizes="(max-width: 639px) 92vw, (max-width: 1023px) 46vw, 430px"
          alt={title}
          className={`absolute transition-[filter,opacity] duration-500 ease-brand group-hover:[filter:blur(7px)_brightness(0.62)] ${'center' === focus ? 'inset-0 size-full object-cover object-center' : 'inset-x-0 top-0 w-full'}`}
          loading={eager ? 'eager' : 'lazy'}
          fetchPriority={eager ? 'high' : undefined}
          decoding="async"
        />
      ) : null}
      <span className="pointer-events-none absolute inset-0 grid place-items-center opacity-0 transition-opacity duration-400 ease-brand group-hover:opacity-100">
        <span className="vv-accent text-[clamp(22px,2.2vw,32px)] leading-none text-white">
          {overlay}
        </span>
      </span>
    </div>
  );
  const footer = (
    <div className="flex items-end justify-between gap-4 pl-2">
      <div className="flex min-w-0 flex-col gap-1">
        <h2 className="truncate font-display text-[16px] leading-[1.25] font-medium tracking-h3 lg:text-[24px] lg:leading-[1.2]">
          {title}
        </h2>
        {sub ? (
          <p className="text-[13px] leading-[1.3] text-fg-muted lg:text-[16px]">{sub}</p>
        ) : null}
        {children}
      </div>
      <span className="flex shrink-0 flex-col items-end gap-2">
        {meta}
        {actionHref ? (
          <a href={actionHref} target="_blank" rel="noreferrer" className={actionClass}>
            {action}
          </a>
        ) : (
          <span className={actionClass}>{action}</span>
        )}
      </span>
    </div>
  );
  return actionHref ? (
    <div className={cardClass}>
      <ShineBorder />
      <Link href={href} className="block">
        {media}
      </Link>
      {footer}
    </div>
  ) : (
    <Link href={href} className={cardClass}>
      <ShineBorder />
      {media}
      {footer}
    </Link>
  );
}
