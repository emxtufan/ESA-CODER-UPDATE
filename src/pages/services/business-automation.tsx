import ServicePage from '@/templates/ServicePage';

export default function BusinessAutomation() {
  return <ServicePage scope="/services/business-automation" next="/services/3d-modeling" related={['/automation', '/services/software-and-erp', '/services/maintenance-and-ongoing-support']} />;
}
