// Structured data (JSON-LD) built from collections, so it follows edits made in the admin.
import {collection} from './collections';

export function faqJsonLd() {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: collection<{question: string; answer: string}>('faqs').map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {'@type': 'Answer', text: faq.answer},
    })),
  });
}

export function reviewsJsonLd() {
  const items = collection<{name: string; company?: string; quote: string; rating?: number}>('testimonials');
  const rating = (r?: number) => ({'@type': 'Rating', ratingValue: r ?? 5, bestRating: 5, worstRating: 1});
  const average = items.length ? items.reduce((sum, t) => sum + (t.rating ?? 5), 0) / items.length : 5;
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    '@id': 'https://visuvate.com/#organization',
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: Math.round(average * 10) / 10,
      reviewCount: items.length,
      bestRating: 5,
      worstRating: 1,
    },
    review: items.map((t) => ({
      '@type': 'Review',
      reviewBody: t.quote,
      author: {'@type': 'Person', name: t.name, ...(t.company ? {worksFor: {'@type': 'Organization', name: t.company}} : {})},
      reviewRating: rating(t.rating),
    })),
  });
}

/** Offer catalogue of the home page, built from the pricing plans (admin → Pricing). */
export function offersJsonLd() {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    '@id': 'https://visuvate.com/#organization',
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Servicii de dezvoltare web',
      itemListElement: collection<{name: string; description: string; price: string}>('plans').map((plan) => ({
        '@type': 'Offer',
        name: plan.name,
        description: plan.description,
        // "4.990" lei: the dot is a thousands separator
        priceSpecification: {'@type': 'PriceSpecification', minPrice: Number(String(plan.price).replace(/\D/g, '')) || 0, priceCurrency: 'RON'},
      })),
    },
  });
}
