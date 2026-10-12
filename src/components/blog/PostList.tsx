import BadgeImage from '@/components/BadgeImage';
import CategorySelect from '@/components/blog/CategorySelect';
import Link from '@/components/Link';
import RevealBatch from '@/components/motion/RevealBatch';
import RollText from '@/components/RollText';

import {collection} from '@/lib/collections';
import {text} from '@/lib/text';

const $t = text('components/blog/PostList');

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "2026-07-10" -> "10 Jul 2026" */
export function formatPostDate(date: string): string {
  const [year, month, day] = (date ?? '').split('-');
  const name = MONTHS[Number(month) - 1];
  if (!year || !name) return date ?? '';
  return `${Number(day)} ${name} ${year}`;
}

export function getPosts(): any[] {
  return collection('posts');
}

export function getPostsByCategory(key: string): any[] {
  return getPosts().filter((post) => post.category === key);
}

const PILL = 'inline-flex h-[34px] items-center rounded-full border px-4 text-[15px] leading-none font-medium transition-colors';
const PILL_ACTIVE = 'border-transparent bg-fg text-bg';
const PILL_IDLE = 'border-line bg-bg text-fg-muted hover:border-line-strong hover:text-fg';

/** Category dropdown (mobile) + pills (desktop). `active` = "all" or a category key. */
export function CategoryNav({active}: {active: string}) {
  const posts = getPosts();
  const categories = collection('postCategories');
  const options = [
    {key: 'all', label: $t('all'), href: '/blog', count: posts.length},
    ...categories.map((category) => ({
      key: category.key,
      label: category.label,
      href: `/blog/category/${category.key}`,
      count: posts.filter((post) => post.category === category.key).length,
    })),
  ];
  return (
    <nav aria-label={$t('blog-categories')} className="relative z-10 mx-auto max-w-[1425px] px-6 pb-[clamp(32px,4vw,56px)] md:px-8">
      <CategorySelect className="mx-auto w-full max-w-[380px] md:hidden" label={$t('blog-categories')} active={active} options={options} />
      <div className="hidden flex-wrap justify-center gap-2 md:flex">
        {options.map((option) =>
          option.key === active ? (
            <Link key={option.key} href={option.href} aria-current="page" className={`${PILL} ${PILL_ACTIVE}`}>
              <RollText text={option.label} />
            </Link>
          ) : (
            <Link key={option.key} href={option.href} className={`${PILL} ${PILL_IDLE}`}>
              <RollText text={option.label} />
            </Link>
          ),
        )}
      </div>
    </nav>
  );
}

/** Grid of post cards, in the order given. */
export function PostGrid({posts}: {posts: any[]}) {
  return (
    <RevealBatch>
      <div className="mx-auto max-w-[1425px] px-4 pb-[clamp(80px,10vw,140px)] md:px-8">
        <div className="flex flex-wrap justify-center gap-2 lg:gap-5 lg:[&>*]:w-[calc((100%-40px)/3)] [&>*]:w-full">
          {posts.map((post) => (
            <div data-reveal key={post.slug}>
              <Link href={`/blog/${post.slug}`} className="group relative flex flex-col gap-3 rounded-[6px] border border-fg/12 bg-bg/30 p-[6px] pb-3 backdrop-blur-[14px] lg:gap-6 lg:rounded-[12px] lg:p-[10px] lg:pb-4">
                <span aria-hidden className="vv-shine vv-shine-lyr-a pointer-events-none absolute inset-0 rounded-[inherit] pointer-coarse:hidden" style={{ padding: 1, animationDuration: "2.8s", backgroundImage: "conic-gradient(from calc(var(--vv-shine-a) - var(--vv-shine-w, 24deg)), transparent 0deg, #0099FF calc(var(--vv-shine-w, 24deg) / 2), #7ACAFF var(--vv-shine-w, 24deg), transparent calc(var(--vv-shine-w, 24deg) * 2), transparent 360deg)", mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", maskComposite: "exclude", WebkitMaskComposite: "xor" }} />
                <span aria-hidden className="vv-shine vv-shine-lyr-b pointer-events-none absolute inset-0 rounded-[inherit] pointer-coarse:hidden" style={{ padding: 1, animationDuration: "2.8s", backgroundImage: "conic-gradient(from calc(var(--vv-shine-b) - var(--vv-shine-w, 24deg)), transparent 0deg, #0099FF calc(var(--vv-shine-w, 24deg) / 2), #7ACAFF var(--vv-shine-w, 24deg), transparent calc(var(--vv-shine-w, 24deg) * 2), transparent 360deg)", mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", maskComposite: "exclude", WebkitMaskComposite: "xor" }} />
                <div className="relative overflow-hidden rounded-[3px] bg-surface lg:rounded-[6px]" style={{ aspectRatio: "16 / 9" }}>
                  <BadgeImage src={post.image} sizes="(max-width: 639px) 92vw, (max-width: 1023px) 46vw, 430px" alt={post.title} className="absolute transition-[filter,opacity] duration-500 ease-brand group-hover:[filter:blur(7px)_brightness(0.62)] inset-0 size-full object-cover object-center" loading="lazy" decoding="async" />
                  <span className="pointer-events-none absolute inset-0 grid place-items-center opacity-0 transition-opacity duration-400 ease-brand group-hover:opacity-100">
                    <span className="vv-accent text-[clamp(22px,2.2vw,32px)] leading-none text-white">
                      {$t('view-project')}
                    </span>
                  </span>
                </div>
                <div className="flex items-end justify-between gap-4 pl-2">
                  <div className="flex min-w-0 flex-col gap-1">
                    <h2 className="truncate font-display text-[16px] leading-[1.25] font-medium tracking-h3 lg:text-[24px] lg:leading-[1.2]">
                      {post.title}
                    </h2>
                    <p className="text-[13px] leading-[1.3] text-fg-muted lg:text-[16px]">
                      {formatPostDate(post.date)}
                      {$t('min-read').replace('{n}', String(post.readMinutes))}
                    </p>
                  </div>
                  <span className="flex shrink-0 flex-col items-end gap-2">
                    <span className="hidden rounded-[10px] bg-tint px-4 py-2.5 text-[14px] leading-none font-medium text-fg transition-colors group-hover:bg-tint-strong group-hover:text-fg-strong lg:inline-flex">
                      {$t('read-post')}
                    </span>
                  </span>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </RevealBatch>
  );
}
