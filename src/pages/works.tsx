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
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: "{\"@context\":\"https://schema.org\",\"@type\":\"BreadcrumbList\",\"itemListElement\":[{\"@type\":\"ListItem\",\"position\":1,\"name\":\"Home\",\"item\":\"https://visuvate.com/\"},{\"@type\":\"ListItem\",\"position\":2,\"name\":\"Works\",\"item\":\"https://visuvate.com/works\"}]}" }} />
        <PageTitle lead={$t("our")} trail={$t("works")} />
        <BlurPanel>
          <WorksGrid items={items} />
        </BlurPanel>
      </main>
    </>
  );
}
