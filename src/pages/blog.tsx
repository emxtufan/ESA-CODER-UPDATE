import {CategoryNav, PostGrid, getPosts} from '@/components/blog/PostList';
import PageTitle from '@/components/PageTitle';

import {text} from '@/lib/text';

const $t = text("/blog");

export default function Page_blog() {
  return (
    <>
      <main className="relative isolate">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: "{\"@context\":\"https://schema.org\",\"@type\":\"BreadcrumbList\",\"itemListElement\":[{\"@type\":\"ListItem\",\"position\":1,\"name\":\"Home\",\"item\":\"https://visuvate.com/\"},{\"@type\":\"ListItem\",\"position\":2,\"name\":\"Blog\",\"item\":\"https://visuvate.com/blog\"}]}" }} />
        <PageTitle lead={$t("our")} trail={$t("blogs")} />
        <CategoryNav active="all" />
        <PostGrid posts={getPosts()} />
      </main>
    </>
  );
}
