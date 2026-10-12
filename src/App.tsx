import {Suspense, useLayoutEffect} from 'react';
import SiteLayout from '@/components/layout/SiteLayout';
import {usePathname} from '@/lib/navigation';
import {notFound, routes} from '@/routes';

// Known URLs render inside the (site) layout; anything else gets the root
// not-found page, which carries its own header and footer.
export default function App() {
  const pathname = usePathname();
  const known = pathname in routes;

  useLayoutEffect(() => {
    if (!known) document.title = notFound.title;
  }, [known]);

  if (known) return <SiteLayout />;
  const NotFound = notFound.page;
  return (
    <Suspense fallback={null}>
      <NotFound />
    </Suspense>
  );
}
