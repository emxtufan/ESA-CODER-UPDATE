import HeadingReveal from '@/components/motion/HeadingReveal';
import {CategoryNav, PostGrid, getPostsByCategory} from '@/components/blog/PostList';

const SITE = 'https://visuvate.com';

export default function PostCategoryPage({category}: {category: any}) {
  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {'@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/`},
      {'@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE}/blog`},
      {'@type': 'ListItem', position: 3, name: category.label, item: `${SITE}/blog/category/${category.key}`},
    ],
  };
  return (
    <>
      <main className="relative isolate">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
        <header className="mx-auto max-w-[820px] px-6 pt-[clamp(80px,10vw,153px)] text-center md:px-8">
          <HeadingReveal>
            <h1 className="font-display text-[clamp(38px,5vw,72px)] leading-[1] font-medium tracking-[-0.05em]">
              {category.label}
            </h1>
          </HeadingReveal>
          <p className="mx-auto mt-[24px] max-w-[640px] text-[17px] leading-[1.5] text-fg-subtle">
            {category.description}
          </p>
        </header>
        <div className="pt-[clamp(32px,4vw,56px)]">
          <CategoryNav active={category.key} />
        </div>
        <PostGrid posts={getPostsByCategory(category.key)} />
      </main>
    </>
  );
}
