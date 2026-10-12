import {lazy} from 'react';
import {text} from '@/lib/text';
import {resolveDynamic, type ResolvedRoute} from '@/lib/dynamicRoutes';

// Static pages. Projects, blog posts, blog categories and custom pages are resolved from
// collections (src/lib/dynamicRoutes.ts). Titles live in source_data.json.
export const routes: Record<string, ResolvedRoute> = {
  '/': {title: text('/')('meta-title'), page: lazy(() => import('@/pages/Home'))},
  "/about-us": {title: text("/about-us")('meta-title'), page: lazy(() => import('@/pages/about-us'))},
  "/blog": {title: text("/blog")('meta-title'), page: lazy(() => import('@/pages/blog'))},
  "/contact": {title: text("/contact")('meta-title'), page: lazy(() => import('@/pages/contact'))},
  "/contact/thank-you": {title: text("/contact/thank-you")('meta-title'), page: lazy(() => import('@/pages/contact/thank-you'))},
  "/privacy-policy": {title: text("/privacy-policy")('meta-title'), page: lazy(() => import('@/pages/privacy-policy'))},
  "/services": {title: text("/services")('meta-title'), page: lazy(() => import('@/pages/services'))},
  "/services/cms-and-dynamic-websites": {title: text("/services/cms-and-dynamic-websites")('meta-title'), page: lazy(() => import('@/pages/services/cms-and-dynamic-websites'))},
  "/services/consistent-identity": {title: text("/services/consistent-identity")('meta-title'), page: lazy(() => import('@/pages/services/consistent-identity'))},
  "/services/crafted-websites": {title: text("/services/crafted-websites")('meta-title'), page: lazy(() => import('@/pages/services/crafted-websites'))},
  "/services/ecommerce-website-design": {title: text("/services/ecommerce-website-design")('meta-title'), page: lazy(() => import('@/pages/services/ecommerce-website-design'))},
  "/services/landing-pages-and-microsites": {title: text("/services/landing-pages-and-microsites")('meta-title'), page: lazy(() => import('@/pages/services/landing-pages-and-microsites'))},
  "/services/maintenance-and-ongoing-support": {title: text("/services/maintenance-and-ongoing-support")('meta-title'), page: lazy(() => import('@/pages/services/maintenance-and-ongoing-support'))},
  "/services/motion-and-interaction-design": {title: text("/services/motion-and-interaction-design")('meta-title'), page: lazy(() => import('@/pages/services/motion-and-interaction-design'))},
  "/services/performance-optimization": {title: text("/services/performance-optimization")('meta-title'), page: lazy(() => import('@/pages/services/performance-optimization'))},
  "/services/ux-centric-strategy": {title: text("/services/ux-centric-strategy")('meta-title'), page: lazy(() => import('@/pages/services/ux-centric-strategy'))},
  "/services/website-redesign": {title: text("/services/website-redesign")('meta-title'), page: lazy(() => import('@/pages/services/website-redesign'))},
  "/templates": {title: text("/templates")('meta-title'), page: lazy(() => import('@/pages/templates'))},
  "/terms-and-conditions": {title: text("/terms-and-conditions")('meta-title'), page: lazy(() => import('@/pages/terms-and-conditions'))},
  "/works": {title: text("/works")('meta-title'), page: lazy(() => import('@/pages/works'))},
};

export const notFound = {title: text('404')('meta-title'), page: lazy(() => import('@/pages/NotFound'))};

export type {ResolvedRoute};

/** Static pages first, then collection-backed URLs (projects, posts, custom pages). */
export function resolveRoute(pathname: string): ResolvedRoute | null {
  const route = routes[pathname];
  if (route) return route;
  return resolveDynamic(pathname);
}
