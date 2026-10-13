import Approach from '@/components/sections/Approach';
import Automation from '@/components/sections/Automation';
import AutomationMore from '@/components/sections/AutomationMore';
import Faqs from '@/components/sections/Faqs';
import Hero from '@/components/sections/Hero';
import Introduction from '@/components/sections/Introduction';
import Marquee from '@/components/sections/Marquee';
import Pricing from '@/components/sections/Pricing';
import Services from '@/components/sections/Services';
import Software from '@/components/sections/Software';
import TechStack from '@/components/sections/TechStack';
import Testimonials from '@/components/sections/Testimonials';
import Works from '@/components/sections/Works';

import {collection} from '@/lib/collections';
import {text} from '@/lib/text';
import {faqJsonLd, offersJsonLd, reviewsJsonLd} from '@/lib/jsonLd';

const $t = text("/");

// Server-rendered tree of app/(site)/page.tsx, converted 1:1 from the RSC payload.
// Position fields in the projects collection decide who appears in the hero / the home coil (empty = hidden).
const byPosition = (field: string) => (a: any, b: any) => a[field] - b[field];

export default function Home() {
  const projects = collection('projects');
  const heroProjects = projects
    .filter((p: any) => p.heroPosition)
    .sort(byPosition('heroPosition'))
    .map((p: any) => ({
      title: p.title,
      slug: p.slug,
      desktop: p.image,
      mobile: p.heroMobile || p.image,
      themes: [p.heroDark && 'dark', p.heroLight && 'light'].filter(Boolean),
    }));
  const homeProjects = projects
    .filter((p: any) => p.homePosition)
    .sort(byPosition('homePosition'))
    .map((p: any) => ({title: p.title, slug: p.slug, image: p.homeImage || p.image}));
  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: faqJsonLd() }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: reviewsJsonLd() }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: offersJsonLd() }} />
      <Hero projects={heroProjects} />
      <TechStack />
      <Introduction />
      {homeProjects.map((p) => (
        <link key={p.slug} rel="preload" as="image" href={p.image} crossOrigin="anonymous" fetchPriority="low" />
      ))}
      <Works items={homeProjects} />
      <Services />
      <Software />
      <Automation />
      <AutomationMore />
      <Marquee />
      <Pricing />
      <Approach />
      <Testimonials items={collection('testimonials').map((t: any, i: number) => ({...t, id: t.id ?? `tst-${i}`}))} />
      <Faqs />
    </main>
  );
}
