// module 2136
import {useMemo, useState} from 'react';
import Link from '@/components/Link';
import ShineBorder from '@/components/ShineBorder';
import RevealBatch from '@/components/motion/RevealBatch';
import {CategoryFilter, ALL_CATEGORY, getCategories, getCategoryCounts} from '@/components/works/filters';
import {CardGrid} from '@/components/works/cards';

import {text} from '@/lib/text';

const $t = text("components/templates/TemplatesGrid");

function TemplateCard({t}: any) {
  return (
    <Link
      data-reveal
      href={t.href}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative flex flex-col gap-3 rounded-[6px] border border-fg/12 bg-bg/30 p-[6px] pb-3 backdrop-blur-[14px] lg:gap-6 lg:rounded-[12px] lg:p-[10px] lg:pb-4"
    >
      <ShineBorder />
      <div
        className="relative overflow-hidden rounded-[3px] border border-fg/8 bg-surface lg:rounded-[6px]"
        style={{aspectRatio: '4 / 3'}}
      >
        {t.image ? (
          <img
            src={t.image}
            alt={t.title}
            className="absolute inset-0 size-full object-cover object-top transition-[filter] duration-500 ease-brand group-hover:[filter:blur(7px)_brightness(0.62)]"
            loading="lazy"
            decoding="async"
          />
        ) : null}
        {t.platformLogo ? (
          <span className="absolute top-[8px] right-[8px] grid size-7 place-items-center rounded-full bg-black/55 backdrop-blur-[10px] lg:top-[10px] lg:right-[10px] lg:size-9">
            <img
              src={t.platformLogo}
              alt={t.platformName ?? ''}
              className="size-[14px] object-contain [filter:brightness(0)_invert(1)] lg:size-[19px]"
              loading="lazy"
              decoding="async"
            />
          </span>
        ) : null}
        <span className="pointer-events-none absolute inset-0 grid place-items-center opacity-0 transition-opacity duration-400 ease-brand group-hover:opacity-100">
          <span className="vv-accent text-[32px] leading-none text-white">{$t("view-details")}</span>
        </span>
      </div>
      <div className="pl-2">
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate font-display text-[16px] leading-[1.2] font-medium text-fg-strong lg:text-[20px]">
              {t.title}
            </h2>
            <p className="mt-[2px] text-[13px] leading-[1.4] text-fg-muted">{t.category}</p>
          </div>
          <span className="flex shrink-0 items-baseline gap-1">
            {t.was ? (
              <span className="text-[13px] leading-[1] text-fg-subtle line-through lg:text-[15px]">
                {t.was}
              </span>
            ) : null}
            <span className="font-display text-[16px] leading-[1] font-medium text-fg lg:text-[20px]">
              {t.price}
            </span>
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function TemplatesGrid({items}: any) {
  const [active, setActive] = useState(ALL_CATEGORY);
  const categories = useMemo(() => getCategories(items), [items]);
  const counts = useMemo(() => getCategoryCounts(items), [items]);
  const visible = active === ALL_CATEGORY ? items : items.filter((e: any) => e.category === active);
  return (
    <>
      <CategoryFilter
        categories={categories}
        counts={counts}
        active={active}
        onSelect={setActive}
        label={$t("template-categories")}
      />
      <RevealBatch refresh={active}>
        <CardGrid>
          {visible.map((e: any) => (
            <TemplateCard key={e.id} t={e} />
          ))}
        </CardGrid>
      </RevealBatch>
    </>
  );
}
