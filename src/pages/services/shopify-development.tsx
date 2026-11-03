import ServicePage from '@/templates/ServicePage';

export default function ShopifyDevelopment() {
  return <ServicePage scope="/services/shopify-development" next="/services/ecommerce-website-design" related={['/services/ecommerce-website-design', '/services/cms-and-dynamic-websites', '/services/performance-optimization']} />;
}
