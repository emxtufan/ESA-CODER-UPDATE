import PageTitle from '@/components/PageTitle';
import BlurPanel from '@/components/BlurPanel';
import WorksGrid from '@/components/works/WorksGrid';

import {collection} from '@/lib/collections';
import {text} from '@/lib/text';

const $t = text("/works");

// Converted 1:1 from the RSC payload of /works.
export default function Page_works() {
  const items = collection('projects').map(({id, slug, title, category, image, url}: any) => ({id: id ?? slug, slug, title, category, image, url}));
  return (
    <>
      <main className="relative isolate">
        <PageTitle lead={$t("our")} trail={$t("works")} />
        <BlurPanel>
          <WorksGrid items={items} />
        </BlurPanel>
      </main>
    </>
  );
}
