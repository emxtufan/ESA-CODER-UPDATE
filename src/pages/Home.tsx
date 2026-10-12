import Approach from '@/components/sections/Approach';
import Faqs from '@/components/sections/Faqs';
import Hero from '@/components/sections/Hero';
import Introduction from '@/components/sections/Introduction';
import Marquee from '@/components/sections/Marquee';
import Pricing from '@/components/sections/Pricing';
import Services from '@/components/sections/Services';
import TechStack from '@/components/sections/TechStack';
import Testimonials from '@/components/sections/Testimonials';
import Works from '@/components/sections/Works';

import {collection} from '@/lib/collections';
import {text} from '@/lib/text';
import {faqJsonLd, reviewsJsonLd} from '@/lib/jsonLd';

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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: "{\"@context\":\"https://schema.org\",\"@type\":\"ProfessionalService\",\"@id\":\"https://visuvate.com/#organization\",\"hasOfferCatalog\":{\"@type\":\"OfferCatalog\",\"name\":\"Web design services\",\"itemListElement\":[{\"@type\":\"Offer\",\"name\":\"Business Website\",\"description\":\"The full presence — three core pages designed from the ground up, on a CMS you run yourself.\",\"priceSpecification\":{\"@type\":\"PriceSpecification\",\"minPrice\":800,\"priceCurrency\":\"USD\"}},{\"@type\":\"Offer\",\"name\":\"eCommerce Store\",\"description\":\"A complete store — catalogue, cart and checkout, with a dashboard you can actually run.\",\"priceSpecification\":{\"@type\":\"PriceSpecification\",\"minPrice\":1500,\"priceCurrency\":\"USD\"}},{\"@type\":\"Offer\",\"name\":\"Custom Build\",\"description\":\"Larger platforms and long-running partnerships — scoped together before anything is quoted.\",\"priceSpecification\":{\"@type\":\"PriceSpecification\",\"minPrice\":3000,\"priceCurrency\":\"USD\"}}]}}" }} />
      <Hero projects={heroProjects} />
      <TechStack />
      <Introduction />
      {homeProjects.map((p) => (
        <link key={p.slug} rel="preload" as="image" href={p.image} crossOrigin="anonymous" fetchPriority="low" />
      ))}
      <Works items={homeProjects} />
      <Services />
      <Marquee />
      <Pricing />
      <Approach />
      <Testimonials items={collection('testimonials').map((t: any, i: number) => ({...t, id: t.id ?? `tst-${i}`}))} stats={[{ value: 30, suffix: "+", label: $t("projects-delivered") }, { value: 98, suffix: "%", label: $t("client-satisfaction") }, { value: 12, suffix: "+", label: $t("years-combined-experience") }]} />
      <Faqs />
    </main>
  );
}
