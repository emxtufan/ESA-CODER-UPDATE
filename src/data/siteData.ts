export interface Project {
  id: string;
  title: string;
  slug: string;
  category: string;
  description: string;
  desktop: string;
  mobile: string;
  tags: string[];
  year: string;
  theme?: 'dark' | 'light';
  link?: string;
}

export const PROJECTS: Project[] = [
  {
    id: 'alvara-house',
    title: 'Alvara House',
    slug: 'alvara-house',
    category: 'Crafted Websites',
    description: 'High-end architectural sanctuary showcasing minimal residential design and immersive spatial narratives.',
    desktop: '/media/43a45f30543208de53ade25795bdc673.jpg',
    mobile: '/media/caad124ec4b0aa7f0563df3fb0b36676.jpg',
    tags: ['Architecture', 'Crafted Website', 'Luxury'],
    year: '2026',
    theme: 'dark',
  },
  {
    id: 'tubwell',
    title: 'Tubwell',
    slug: 'tubwell',
    category: 'eCommerce Design',
    description: 'Holistic wellness & lifestyle ecommerce platform with tactile typography and seamless checkout.',
    desktop: '/media/8c1a7114fc1bfec6490aeb80e841b066.jpg',
    mobile: '/media/290fc8a82b8a333bef19796cc55c837f.jpg',
    tags: ['eCommerce', 'Design System', 'Shopify'],
    year: '2026',
    theme: 'light',
  },
  {
    id: 'horizone',
    title: 'Horizone',
    slug: 'horizone',
    category: 'CMS & Dynamic Websites',
    description: 'Next-generation venture capital firm site built with real-time portfolio filtering and editorial case studies.',
    desktop: '/media/ae4d73e3a7d806960f421c98e525ac2a.jpg',
    mobile: '/media/4f466bfac5d23d56dd5eae687f34259d.jpg',
    tags: ['Fintech', 'CMS', 'Webflow'],
    year: '2026',
    theme: 'dark',
  },
  {
    id: 'avara',
    title: 'Avara',
    slug: 'avara',
    category: 'Crafted Websites',
    description: 'Curated apparel collective merging editorial lookbooks with micro-interactions and high-performance loading.',
    desktop: '/media/cc006c5370888cd2c9322a58fa0c6c8e.jpg',
    mobile: '/media/3d46a9b642dccaca4c768f47270fe5cc.jpg',
    tags: ['Fashion', 'Lookbook', 'Interactions'],
    year: '2025',
    theme: 'light',
  },
  {
    id: 'aveline-dental',
    title: 'Aveline Dental',
    slug: 'aveline-dental',
    category: 'Website Redesign',
    description: 'Modern cosmetic healthcare experience designed to establish trust, ease anxiety, and streamline appointments.',
    desktop: '/media/f23aef1579afdfca8471ccc112558b8c.jpg',
    mobile: '/media/2969580ea424e930049d3f79cf449807.jpg',
    tags: ['Healthcare', 'Redesign', 'Booking'],
    year: '2025',
    theme: 'light',
  },
  {
    id: '4dolfins',
    title: '4Dolfins',
    slug: '4dolfins',
    category: 'Crafted Websites',
    description: 'Dynamic digital experience agency website featuring dark mode aesthetics and fluid page transitions.',
    desktop: '/media/54f06e115564feee03cc900ead225dd7.jpg',
    mobile: '/media/6a0c73f3e8d6ea4a6c32c735e54a4683.jpg',
    tags: ['Creative Agency', 'Web Design', 'Framer'],
    year: '2025',
    theme: 'dark',
  },
  {
    id: 'orvel',
    title: 'Orvel',
    slug: 'orvel',
    category: 'CMS & Dynamic Websites',
    description: 'Industrial studio product catalogue showcasing tactile materiality and precision engineering.',
    desktop: '/media/eace44ddc70352a3c3d0d1ea71b9fcb9.jpg',
    mobile: '/media/8ce44d3a83efce26bb56beb489ac0d04.jpg',
    tags: ['Industrial Design', 'Catalogue', 'CMS'],
    year: '2025',
    theme: 'dark',
  },
  {
    id: 'lasada-pippen',
    title: 'Lasada Pippen',
    slug: 'lasada-pippen',
    category: 'eCommerce Design',
    description: 'Luxury horology boutique website featuring bespoke micro-interactions and precision craftsmanship.',
    desktop: '/media/6c273acf295ebe4fcd8cfcb2a86bda56.jpg',
    mobile: '/media/97766dab9bedcd4bad6ad2d530fc305d.jpg',
    tags: ['Luxury Watches', 'eCommerce', 'Minimal'],
    year: '2025',
    theme: 'light',
  },
  {
    id: 'stillroom',
    title: 'Stillroom',
    slug: 'stillroom',
    category: 'Crafted Websites',
    description: 'Artisanal roastery and cafe brand digital presence highlighting bean origin narratives and subscriptions.',
    desktop: '/media/f51bbfe772c3d754c3738d4af8efca44.jpg',
    mobile: '/media/d41c2f8c3b977b2dc389e99570e47cf9.jpg',
    tags: ['Hospitality', 'Brand Experience', 'Food & Beverage'],
    year: '2025',
    theme: 'dark',
  },
  {
    id: 'averleigh',
    title: 'Averleigh',
    slug: 'averleigh',
    category: 'Website Redesign',
    description: 'Bespoke estate development platform featuring cinematic property tours and floorplan showcases.',
    desktop: '/media/fa6a9d8c4c3126f5ceb10e26d0d16805.jpg',
    mobile: '/media/effcaf53668ab4b58c9cfd0d1d27a25e.jpg',
    tags: ['Real Estate', 'Redesign', 'Visual Architecture'],
    year: '2025',
    theme: 'dark',
  },
];

export const TECH_STACK = [
  { name: 'Wix Studio', logo: '/tech/wix-studio.webp', width: 132 },
  { name: 'Notion', logo: '/tech/notion.webp', width: 64 },
  { name: 'Figma', logo: '/tech/figma.webp', width: 79 },
  { name: 'Framer', logo: '/tech/framer.webp', width: 90 },
  { name: 'Webflow', logo: '/tech/webflow.webp', width: 110 },
  { name: 'Shopify', logo: '/tech/shopify.webp', width: 95 },
  { name: 'WordPress', logo: '/tech/wordpress.webp', width: 120 },
  { name: 'Next.js', logo: '/tech/nextjs.webp', width: 85 },
];

export const INTRO_IMAGES = [
  '/intro/84a40757.webp',
  '/intro/e9076ff8.webp',
  '/intro/9f6f6a01.webp',
  '/intro/9a4ee724.webp',
  '/intro/816c1410.webp',
  '/intro/eb98471b.webp',
];

export const SERVICES_LIST = [
  'Crafted Websites',
  'Website Redesign',
  'eCommerce Website Design',
  'CMS & Dynamic Websites',
  'Landing Pages & Microsites',
  'Consistent Identity',
  'Motion & Interaction Design',
  'UX Centric Strategy',
  'Performance Optimization',
  'Maintenance & Ongoing Support',
];

export const PLATFORMS_DATA = [
  {
    name: 'Framer',
    logo: '/platforms/framer.webp',
    description: 'High-fidelity visual design with fluid physics-based interactions and lightning-fast worldwide delivery.',
    badge: 'Design First',
  },
  {
    name: 'Webflow',
    logo: '/platforms/webflow.webp',
    description: 'Clean semantics, scalable CMS collections, and robust visual development for high-growth enterprises.',
    badge: 'Enterprise CMS',
  },
  {
    name: 'Shopify',
    logo: '/platforms/shopify.webp',
    description: 'Custom Liquid themes, high-converting checkout funnels, and frictionless global commerce architectures.',
    badge: 'Global Commerce',
  },
  {
    name: 'Wix Studio',
    logo: '/platforms/wix-studio.webp',
    description: 'Advanced responsive layouts with custom Velo JavaScript logic and fluid breakpoint intelligence.',
    badge: 'Fluid Responsive',
  },
  {
    name: 'WordPress',
    logo: '/platforms/wordpress.webp',
    description: 'Tailored headless configurations or lightweight Gutenberg setups for bespoke editorial operations.',
    badge: 'Open Ecosystem',
  },
  {
    name: 'Next.js',
    logo: '/platforms/nextjs.webp',
    description: 'Server-side rendering, React 19 architecture, and tailor-made interactive WebGL web applications.',
    badge: 'Custom Code',
  },
];

export const PRICING_TIERS = [
  {
    id: 'business',
    title: 'Business Website',
    tag: 'ESSENTIAL',
    description: 'Five to ten pages, CMS-backed blog or case studies, and responsive across every device.',
    priceUSD: '$1,500',
    priceINR: '₹50,000',
    features: [
      '5 to 10 bespoke designed pages',
      'CMS integration (blog or case studies)',
      'Responsive across every viewport',
      'SEO and analytics configuration',
      'Performance audit & speed tuning',
      'Interactive micro-animations',
    ],
    highlighted: false,
  },
  {
    id: 'ecommerce',
    title: 'Online Store',
    tag: 'ECOMMERCE',
    description: 'A complete store — catalogue, cart and checkout, with a dashboard you can actually run.',
    priceUSD: '$2,000',
    priceINR: '₹75,000',
    features: [
      'Product, cart and checkout pages',
      'Payment and shipping integration',
      'Store management dashboard',
      'Mobile-first shopping experience',
      'Inventory & discount rules setup',
      'Customer account portal',
    ],
    highlighted: true,
  },
  {
    id: 'custom',
    title: 'Custom Build',
    tag: 'ENTERPRISE',
    description: 'Larger platforms and long-running partnerships — scoped together before anything is quoted.',
    priceUSD: '$3,000',
    priceINR: '₹1,00,000',
    features: [
      'Discovery and scoping first',
      'Multi-collection CMS architecture',
      'Advanced motion and interaction',
      'Maintenance and support plans',
      'Third-party API & CRM integrations',
      'Dedicated project Slack channel',
    ],
    highlighted: false,
  },
];

export const APPROACH_STEPS = [
  {
    number: '01',
    title: 'Discovery First',
    description: 'We begin by defining clear goals, understanding your audience, and aligning with your business vision to build with unwavering purpose.',
    image: '/approach/site-a.webp',
  },
  {
    number: '02',
    title: 'Mobile-First Design',
    description: 'Every layout is designed for seamless mobile-first experiences, ensuring performance, legibility, and visual impact across all screen sizes.',
    image: '/approach/phone-a.webp',
  },
  {
    number: '03',
    title: 'Conversion-Driven',
    description: 'Strategic user journeys, clear typographic hierarchy, and intentional calls-to-action designed to turn passive visitors into engaged clients.',
    image: '/approach/dashboard.webp',
  },
  {
    number: '04',
    title: 'Pixel-Perfect Development',
    description: 'Clean, performant code that translates Figma wireframes down to the exact sub-pixel, maintaining aesthetic rigor across browsers.',
    image: '/approach/panel.webp',
  },
  {
    number: '05',
    title: 'Seamless CMS Launch',
    description: 'Intuitive content management setups that empower your team to effortlessly publish new articles, products, and updates without code.',
    image: '/approach/site-c.webp',
  },
  {
    number: '06',
    title: 'Future-Ready',
    description: 'Websites designed to be scalable and future-ready, adapting smoothly as your business and service offerings grow over time.',
    image: '/approach/laptop-lid.webp',
  },
];

export const TESTIMONIALS = [
  {
    id: '1',
    quote: "I've worked with Visuvate on several different occasions and it's always a pleasure. They go through every detail and deliver according to your desires.",
    author: 'Ethan Vance',
    role: 'Founder, Vance Architecture',
    avatar: '/team/avatar-1.0c4e3fc0.jpg',
    rating: 5,
  },
  {
    id: '2',
    quote: "Great work overall. The design feels premium, the layout is well structured, and everything is responsive. They made the changes I requested quickly and didn't drag the process. Would definitely work again.",
    author: 'Marcus Lindqvist',
    role: 'Creative Director, Studio Nord',
    avatar: '/team/avatar-2.58306c73.jpg',
    rating: 5,
  },
  {
    id: '3',
    quote: "Talented, creative, and most importantly trustworthy. They completed the revisions even after the project was marked complete weeks earlier.",
    author: 'Sophia Chen',
    role: 'Product Lead, Lumora Health',
    avatar: '/team/avatar-1.0c4e3fc0.jpg',
    rating: 5,
  },
];

export const FAQS = [
  {
    question: '1. How do I get started with Visuvate?',
    answer: "Simply fill out the contact form or book a call, and we'll reach out through email or WhatsApp within 24 hours to schedule a brief discovery chat and define your scope.",
  },
  {
    question: '2. How involved do I need to be during the project?',
    answer: 'You only need to share your content, preferences, and feedback at key milestone stages (moodboards, wireframes, and final sign-off). We manage the end-to-end heavy lifting.',
  },
  {
    question: '3. How long does it take to build a website?',
    answer: 'Most bespoke business websites take between 2 to 4 weeks from kickoff to launch. More complex eCommerce stores or custom WebGL builds usually take 4 to 6 weeks.',
  },
  {
    question: '4. Do you provide support after the website is launched?',
    answer: 'Yes! Every project includes 30 days of complimentary post-launch support and bug fixes, along with full video training for your CMS and optional ongoing maintenance plans.',
  },
  {
    question: '5. Do you create responsive and eCommerce websites?',
    answer: 'Absolutely. Every website we build is responsive down to the pixel across desktop, tablet, and mobile devices, with full eCommerce capabilities on platforms like Shopify or Webflow.',
  },
  {
    question: '6. Do you work with international clients?',
    answer: 'Yes, we are based in India and proudly serve ambitious brands across the US, UK, Europe, Australia, and worldwide with smooth asynchronous communication.',
  },
];
