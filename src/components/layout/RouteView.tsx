import {Suspense, useEffect} from 'react';
import {updateMetadata} from '@/lib/metadata';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
import {usePathname} from '@/lib/navigation';
import {resolveRoute, routes} from '@/routes';
import SectionVisibility from '@/components/layout/SectionVisibility';

// Renders the page for the current URL inside the site layout (the slot that
// Next's layout router fills in the original).
export default function RouteView() {
  const pathname = usePathname();
  const route = resolveRoute(pathname) ?? routes['/'];
  const Page = route.page;

  return (
    <Suspense fallback={null}>
      <Page key={pathname} {...route.props} />
      <AfterRender pathname={pathname} />
      {/* inside Suspense so it runs after the lazy page's sections exist */}
      {/* its own key: siblings sharing a key keep old pages mounted after navigation */}
      <SectionVisibility key={`sections:${pathname}`} />
    </Suspense>
  );
}

// Runs once the lazy page has rendered: refresh scroll-driven animations and
// honour a #hash in the URL, like Next does after navigation.
function AfterRender({pathname}: {pathname: string}) {
  useEffect(() => {
    updateMetadata(pathname, true);
    (window as any).__bootDone?.();
    ScrollTrigger.refresh();
    const hash = decodeURIComponent(window.location.hash.slice(1));
    if (!hash) return;
    const id = requestAnimationFrame(() => document.getElementById(hash)?.scrollIntoView());
    return () => cancelAnimationFrame(id);
  }, [pathname]);
  return null;
}
