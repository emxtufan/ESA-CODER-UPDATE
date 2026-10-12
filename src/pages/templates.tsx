import Link from '@/components/Link';
import PageTitle from '@/components/PageTitle';
import TemplatesGrid from '@/components/templates/TemplatesGrid';

import {text} from '@/lib/text';
import {collection} from '@/lib/collections';

const $t = text("/templates");

// Converted 1:1 from the RSC payload of /templates.
export default function Page_templates() {
  return (
    <>
      <main className="relative isolate">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: "{\"@context\":\"https://schema.org\",\"@type\":\"BreadcrumbList\",\"itemListElement\":[{\"@type\":\"ListItem\",\"position\":1,\"name\":\"Home\",\"item\":\"https://visuvate.com/\"},{\"@type\":\"ListItem\",\"position\":2,\"name\":\"Templates\",\"item\":\"https://visuvate.com/templates\"}]}" }} />
        <PageTitle lead={$t("tem")} trail={$t("plates")}>
          <p className="mx-auto mt-8 max-w-[640px] text-center text-lead leading-[1.6] text-fg-muted">
            {$t("every-template-here-began-as-a")}
          </p>
        </PageTitle>
        <TemplatesGrid items={collection<any>('templates').map((t, i) => ({...t, id: t.id || `template-${i}`}))} />
        <section aria-labelledby="templates-how" className="mx-auto max-w-[1425px] px-6 pb-[clamp(80px,10vw,140px)] md:px-8">
          <div className="mx-auto max-w-[720px]">
            <h2 id="templates-how" className="font-display text-[clamp(26px,3vw,40px)] leading-[1.15] font-medium tracking-[-0.03em]">
              {$t("how-the-templates-work")}
            </h2>
            <div className="mt-6 flex flex-col gap-5 text-lead leading-[1.75] text-fg-muted">
              <p>
                {$t("each-template-is-a-complete-production")}
              </p>
              <p>
                {$t("buying-one-takes-you-to-the")}
              </p>
              <p>
                {$t("because-each-one-started-life-as")}
              </p>
              <p>
                {$t("framer-and-wix-studio-suit-different")}
              </p>
              <p>
                {$t("if-a-template-is-close-but")}
                <Link href="/contact" className="text-fg underline decoration-fg/30 underline-offset-4 transition-colors hover:decoration-fg">
                  {$t("tell-us-what-you-need")}
                </Link>
                {$t("and-we-ll-tell-you-honestly")}
                {" "}
                <Link href="/services/crafted-websites" className="text-fg underline decoration-fg/30 underline-offset-4 transition-colors hover:decoration-fg">
                  {$t("custom-build")}
                </Link>
                {$t("serves-you-better")}
              </p>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
