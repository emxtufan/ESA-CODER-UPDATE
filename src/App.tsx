import {Suspense, useEffect, useLayoutEffect} from 'react';
import {trackView} from '@/lib/visits';
import {trackPageView} from '@/lib/consent';
import SiteLayout from '@/components/layout/SiteLayout';
import {usePathname} from '@/lib/navigation';
import {notFound, resolveRoute} from '@/routes';
import {updateMetadata} from '@/lib/metadata';

// Known URLs render inside the (site) layout; anything else gets the root
// not-found page, which carries its own header and footer.
export default function App() {
  const pathname = usePathname();
  const known = resolveRoute(pathname) !== null;

  useLayoutEffect(() => {
    if (!known) {
      updateMetadata(pathname, false);
      (window as any).__bootDone?.();
    }
  }, [known, pathname]);
  useEffect(() => {
    const visit = () => trackView(known ? pathname : `404 ${pathname}`);
    visit();
    window.addEventListener('vv:consent-change', visit);
    trackPageView(pathname);
    return () => window.removeEventListener('vv:consent-change', visit);
  }, [known, pathname]);

  if (known) return <SiteLayout />;
  const NotFound = notFound.page;
  return (
    <Suspense fallback={null}>
      <NotFound />
    </Suspense>
  );
}
