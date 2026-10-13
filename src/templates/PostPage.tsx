import ArticleCodeBlocks from '@/components/blog/ArticleCodeBlocks';
import ArticleLightbox from '@/components/blog/ArticleLightbox';
import {formatPostDate, getPosts} from '@/components/blog/PostList';
import HeadingReveal from '@/components/motion/HeadingReveal';
import Link from '@/components/Link';
import ParallaxDrift from '@/components/motion/ParallaxDrift';
import RevealBatch from '@/components/motion/RevealBatch';
import RollText from '@/components/RollText';

import {findInCollection} from '@/lib/collections';
import {text} from '@/lib/text';
import '@/styles/article.css';

const $t = text('templates/post');

const SITE = 'https://visuvate.com';

export default function PostPage({item}: {item: any}) {
  const category = item.category ? findInCollection('postCategories', 'key', item.category) : undefined;
  const url = `${SITE}/blog/${item.slug}`;

  const blogPosting = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: item.title,
    description: item.excerpt,
    url,
    mainEntityOfPage: url,
    image: [`${SITE}/_next/image?url=${encodeURIComponent(item.image)}&w=1200&q=80`],
    datePublished: `${item.date}T00:00:00.000Z`,
    author: {'@type': 'Organization', name: 'Visuvate', url: SITE},
    publisher: {'@id': `${SITE}/#organization`},
  };
  const crumbs = [
    {name: 'Home', item: `${SITE}/`},
    {name: 'Blog', item: `${SITE}/blog`},
    ...(category ? [{name: category.label, item: `${SITE}/blog/category/${category.key}`}] : []),
    {name: item.title, item: url},
  ];
  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, index) => ({'@type': 'ListItem', position: index + 1, ...crumb})),
  };

  // Explicit related slugs first; new posts fall back to the first 3 other posts.
  const others = getPosts().filter((post) => post.slug !== item.slug);
  const listed = Array.isArray(item.related) ? item.related : [];
  const related = listed.length
    ? listed.map((slug: string) => others.find((post) => post.slug === slug)).filter(Boolean)
    : others.slice(0, 3);

  return (
    <>
      <main className="relative isolate">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPosting) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
        <header className="relative">
          <ParallaxDrift drift={185} className="mx-auto max-w-[964px] px-6 pt-[96px] md:px-8 md:pt-[153px]">
            <HeadingReveal>
              <h1 className="text-center font-display text-[clamp(38px,5vw,72px)] leading-[1] font-medium tracking-[-0.05em] will-change-transform">
                {item.title}
              </h1>
            </HeadingReveal>
          </ParallaxDrift>
          <div className="relative z-10 mx-auto mt-[28px] max-w-[1182px] px-6 md:px-8">
            <div className="relative rounded-[20px] p-2 backdrop-blur-[10px]" style={{ background: "color-mix(in srgb, var(--vv-bg) 80%, transparent)" }}>
              <span aria-hidden className="pointer-events-none absolute top-0 left-1/2 h-px w-[600px] max-w-full -translate-x-1/2" style={{ background: "linear-gradient(90deg, transparent 0%, var(--vv-card-line) 50%, transparent 100%)" }} />
              <span aria-hidden className="pointer-events-none absolute inset-0 rounded-[20px]" style={{ background: "radial-gradient(58% 46% at 50% 0%, var(--vv-card-lift) 0%, var(--vv-card-lift-mid) 45%, transparent 78%)" }} />
              <img src={item.image} alt={item.title} className="relative block w-full rounded-[12px]" style={{ aspectRatio: "1102 / 620", objectFit: "cover" }} decoding="async" />
            </div>
          </div>
        </header>
        <article className="article mt-[65px] pb-[82px]" dangerouslySetInnerHTML={{ __html: item.html }} />
        <ArticleCodeBlocks />
        <ArticleLightbox />
        {category && (
          <div className="mx-auto max-w-[964px] px-6 pb-[90px] md:px-8">
            <div className="flex flex-wrap items-center gap-3 border-t pt-6" style={{ borderColor: "var(--vv-card-line)" }}>
              <span className="text-[14px] text-fg-subtle">
                {$t('filed-under')}
              </span>
              <Link href={`/blog/category/${category.key}`} className="inline-flex h-[34px] items-center rounded-full border border-line bg-bg px-4 text-[15px] leading-none font-medium text-fg-muted transition-colors hover:border-line-strong hover:text-fg">
                <RollText text={category.label} />
              </Link>
            </div>
          </div>
        )}
        <section className="mx-auto max-w-[1400px] px-6 pb-[130px] md:px-8">
          <div className="mb-[35px] flex items-end justify-between gap-6">
            <h2 className="font-display text-[24px] leading-[1.1] font-medium tracking-[-0.02em]">
              {$t('more-blogs')}
            </h2>
            <Link href="/blog" className="inline-flex h-[38px] shrink-0 items-center rounded-full bg-fg/15 px-5 text-[14px] font-medium transition-colors hover:bg-fg/25">
              <RollText text={$t('all-blogs')} />
            </Link>
          </div>
          <RevealBatch className="grid gap-[27px] sm:grid-cols-2 lg:grid-cols-3">
            {related.map((post: any) => (
              <Link data-reveal key={post.slug} href={`/blog/${post.slug}`} className="group relative rounded-[12px] border border-fg/20 bg-bg/30 p-3 pb-5 backdrop-blur-[14px]">
                <span aria-hidden className="vv-shine vv-shine-lyr-a pointer-events-none absolute inset-0 rounded-[inherit] pointer-coarse:hidden" style={{ padding: 1, animationDuration: "2.8s", backgroundImage: "conic-gradient(from calc(var(--vv-shine-a) - var(--vv-shine-w, 24deg)), transparent 0deg, #0099FF calc(var(--vv-shine-w, 24deg) / 2), #7ACAFF var(--vv-shine-w, 24deg), transparent calc(var(--vv-shine-w, 24deg) * 2), transparent 360deg)", mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", maskComposite: "exclude", WebkitMaskComposite: "xor" }} />
                <span aria-hidden className="vv-shine vv-shine-lyr-b pointer-events-none absolute inset-0 rounded-[inherit] pointer-coarse:hidden" style={{ padding: 1, animationDuration: "2.8s", backgroundImage: "conic-gradient(from calc(var(--vv-shine-b) - var(--vv-shine-w, 24deg)), transparent 0deg, #0099FF calc(var(--vv-shine-w, 24deg) / 2), #7ACAFF var(--vv-shine-w, 24deg), transparent calc(var(--vv-shine-w, 24deg) * 2), transparent 360deg)", mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", maskComposite: "exclude", WebkitMaskComposite: "xor" }} />
                <div className="relative overflow-hidden rounded-[8px] bg-surface" style={{ aspectRatio: "408 / 229" }}>
                  <img src={post.image} alt={post.title} className="absolute inset-0 size-full object-cover transition-[filter] duration-500 ease-brand group-hover:[filter:blur(7px)_brightness(0.62)]" loading="lazy" decoding="async" />
                  <span className="pointer-events-none absolute inset-0 grid place-items-center opacity-0 transition-opacity duration-400 ease-brand group-hover:opacity-100">
                    <span className="vv-accent text-[32px] leading-none text-white">
                      {$t('read-post')}
                    </span>
                  </span>
                </div>
                <p className="mt-[27px] px-2 text-[14px] leading-[1] text-fg-subtle">
                  {formatPostDate(post.date)}
                </p>
                <h3 className="mt-[12px] px-2 font-display text-[24px] leading-[1.2] font-medium tracking-h3">
                  {post.title}
                </h3>
                <p className="mt-[8px] line-clamp-2 px-2 text-[16px] leading-[1.4] text-fg-subtle">
                  {post.excerpt}
                </p>
              </Link>
            ))}
          </RevealBatch>
        </section>
      </main>
    </>
  );
}
