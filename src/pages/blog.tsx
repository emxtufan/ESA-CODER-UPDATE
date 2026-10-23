import {CategoryNav, PostGrid, getPosts} from '@/components/blog/PostList';
import BlurPanel from '@/components/BlurPanel';
import PageTitle from '@/components/PageTitle';

import {text} from '@/lib/text';

const $t = text("/blog");

export default function Page_blog() {
  return (
    <>
      <main className="relative isolate">
        <PageTitle lead={$t("our")} trail={$t("blogs")} />
        <BlurPanel>
          <CategoryNav active="all" />
          <PostGrid posts={getPosts()} />
        </BlurPanel>
      </main>
    </>
  );
}
