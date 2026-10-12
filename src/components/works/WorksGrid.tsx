// module 5186
import {useMemo, useState} from 'react';
import RevealBatch from '@/components/motion/RevealBatch';
import {CategoryFilter, ALL_CATEGORY, getCategories, getCategoryCounts} from '@/components/works/filters';
import {CardGrid, ProjectCard} from '@/components/works/cards';

import {text} from '@/lib/text';

const $t = text("components/works/WorksGrid");

export default function WorksGrid({items}: any) {
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
        label={$t("work-categories")}
      />
      <RevealBatch refresh={active}>
        <CardGrid>
          {visible.map((e: any, i: number) => (
            <div key={e.id} data-reveal>
              <ProjectCard
                href={`/works/${e.slug}`}
                eager={i < 3}
                image={e.image}
                title={e.title}
                action="Visit site"
                actionHref={e.url}
                sub={e.category}
              />
            </div>
          ))}
        </CardGrid>
      </RevealBatch>
    </>
  );
}
