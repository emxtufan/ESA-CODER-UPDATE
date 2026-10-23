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

const $t = text("/");

// Server-rendered tree of app/(site)/page.tsx, converted 1:1 from the RSC payload.
// The hero shows every published project in the order of the collection (as /works does);
// homePosition decides who appears in the home coil (empty = hidden).
const byPosition = (field: string) => (a: any, b: any) => a[field] - b[field];

export default function Home() {
  const projects = collection('projects');
  const heroProjects = projects
    .map((p: any) => ({
      title: p.title,
      slug: p.slug,
      desktop: p.heroDesktop || p.image,
      mobile: p.heroMobile || p.heroDesktop || p.image,
      themes: [p.heroDark && 'dark', p.heroLight && 'light'].filter(Boolean),
    }));
  const homeProjects = projects
    .filter((p: any) => p.homePosition)
    .sort(byPosition('homePosition'))
    .map((p: any) => ({title: p.title, slug: p.slug, image: p.homeImage || p.image}));
  return (
    <main>
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
