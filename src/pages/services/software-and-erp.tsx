import ServicePage from '@/templates/ServicePage';

export default function SoftwareAndErp() {
  return <ServicePage scope="/services/software-and-erp" next="/services/business-automation" related={['/automation', '/services/business-automation', '/services/cms-and-dynamic-websites']} />;
}
