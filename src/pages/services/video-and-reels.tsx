import ServicePage from '@/templates/ServicePage';

export default function VideoAndReels() {
  return <ServicePage scope="/services/video-and-reels" next="/services/crafted-websites" related={['/services/3d-modeling', '/services/motion-and-interaction-design', '/services/landing-pages-and-microsites']} />;
}
