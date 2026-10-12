import {Suspense, useEffect, useLayoutEffect} from 'react';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
import {usePathname} from '@/lib/navigation';
import {resolveRoute, routes} from '@/routes';

// Renders the page for the current URL inside the site layout (the slot that
// Next's layout router fills in the original).
export default function RouteView() {
  const pathname = usePathname();
  const route = resolveRoute(pathname) ?? routes['/'];
  const Page = route.page;

  useLayoutEffect(() => {
    document.title = route.title;
  }, [route]);

  return (
    <Suspense fallback={null}>
      <Page key={pathname} {...route.props} />
      <AfterRender pathname={pathname} />
    </Suspense>
  );
}

// Runs once the lazy page has rendered: refresh scroll-driven animations and
// honour a #hash in the URL, like Next does after navigation.
function AfterRender({pathname}: {pathname: string}) {
  useEffect(() => {
    ScrollTrigger.refresh();
    const hash = decodeURIComponent(window.location.hash.slice(1));
    if (!hash) return;
    const id = requestAnimationFrame(() => document.getElementById(hash)?.scrollIntoView());
    return () => cancelAnimationFrame(id);
  }, [pathname]);
  return null;
}
