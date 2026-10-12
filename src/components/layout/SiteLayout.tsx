import CookieBanner from '@/components/layout/CookieBanner';
import Footer from '@/components/layout/Footer';
import Header from '@/components/layout/Header';
import PageTransition from '@/components/layout/PageTransition';
import RouteView from '@/components/layout/RouteView';
import SectionVisibility from '@/components/layout/SectionVisibility';
import SmoothScroll from '@/components/layout/SmoothScroll';

// Server-rendered tree of app/(site)/layout.tsx, converted 1:1 from the RSC payload.
export default function SiteLayout() {
  return (
    <SmoothScroll>
      <SectionVisibility />
      <CookieBanner />
      <a href="#vv-main" className="fixed top-3 left-3 z-[300] -translate-y-20 rounded-full bg-fg px-5 py-2.5 text-[14px] font-medium text-bg opacity-0 transition-transform focus-visible:translate-y-0 focus-visible:opacity-100">
        Skip to content
      </a>
      <Header />
      <div id="vv-main" tabIndex={-1} className="outline-none">
        <RouteView />
      </div>
      <Footer />
      <PageTransition />
    </SmoothScroll>
  );
}
