import ServicePage from '@/templates/ServicePage';

export default function ThreeDModeling() {
  return <ServicePage scope="/services/3d-modeling" next="/services/video-and-reels" related={['/services/motion-and-interaction-design', '/services/video-and-reels', '/services/consistent-identity']} />;
}
