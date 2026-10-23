// URL patterns backed by collections. Keep in sync with server/routes.mjs.
//   /works/:slug          → projects       (field `slug`, title `metaTitle`)
//   /blog/category/:key   → postCategories (field `key`,  title `metaTitle`)
//   /blog/:slug           → posts          (field `slug`, title `metaTitle`)
//   /:slug                → pages          (field `slug`, title `metaTitle`), only when no static page exists
import {createElement, lazy, type ComponentType, type LazyExoticComponent} from 'react';
import {findInCollection} from './collections';

declare global {
  interface Window { __ITEMS__?: Record<string, Record<string, unknown>>; }
}

export type ResolvedRoute = {
  title: string;
  page: LazyExoticComponent<ComponentType<any>>;
  props?: Record<string, unknown>;
};

const loadProjectPage = () => import('@/templates/ProjectPage');
const loadPostPage = () => import('@/templates/PostPage');
const ProjectPage = lazy(loadProjectPage);
const PostPage = lazy(loadPostPage);
const PostCategoryPage = lazy(() => import('@/templates/PostCategoryPage'));
const CustomPage = lazy(() => import('@/templates/CustomPage'));

const DYNAMIC: Array<{pattern: RegExp; resolve: (param: string) => ResolvedRoute | null}> = [
  {
    pattern: /^\/works\/([^/]+)$/,
    resolve: (slug) => {
      const item = findInCollection('projects', 'slug', slug);
      return item ? {title: item.metaTitle, ...detail('projects', item, ProjectPage, loadProjectPage)} : null;
    },
  },
  {
    pattern: /^\/blog\/category\/([^/]+)$/,
    resolve: (key) => {
      const category = findInCollection('postCategories', 'key', key);
      return category ? {title: category.metaTitle, page: PostCategoryPage, props: {category}} : null;
    },
  },
  {
    pattern: /^\/blog\/([^/]+)$/,
    resolve: (slug) => {
      const item = findInCollection('posts', 'slug', slug);
      return item ? {title: item.metaTitle, ...detail('posts', item, PostPage, loadPostPage)} : null;
    },
  },
  {
    pattern: /^\/([^/]+)$/,
    resolve: (slug) => {
      const item = findInCollection('pages', 'slug', slug);
      return item ? {title: item.metaTitle, page: CustomPage, props: {item}} : null;
    },
  },
];

// In production /content.js leaves out the long fields of projects and posts (`_lite`, see
// server/content.mjs). The full record comes inlined with the server-rendered page
// (window.__ITEMS__) or, after client-side navigation, from /api/item/:collection/:slug.
const withDetails = new Map<string, LazyExoticComponent<ComponentType<any>>>();

function detail(
  collection: string,
  item: any,
  Page: LazyExoticComponent<ComponentType<any>>,
  load: () => Promise<{default: ComponentType<any>}>,
): Pick<ResolvedRoute, 'page' | 'props'> {
  if (!item._lite) return {page: Page, props: {item}};
  const key = `${collection}/${item.slug}`;
  const inlined = (window as any).__ITEMS__?.[key];
  if (inlined) return {page: Page, props: {item: inlined}};
  let page = withDetails.get(key);
  if (!page) {
    page = lazy(async () => {
      const [mod, full] = await Promise.all([
        load(),
        fetch(`/api/item/${key}`).then((r) => (r.ok ? r.json() : item)).catch(() => item),
      ]);
      (window.__ITEMS__ ??= {})[key] = full;
      return {default: (props: any) => createElement(mod.default, {...props, item: full})};
    });
    withDetails.set(key, page);
  }
  return {page};
}

export function resolveDynamic(pathname: string): ResolvedRoute | null {
  for (const {pattern, resolve} of DYNAMIC) {
    const match = pathname.match(pattern);
    if (match) {
      const route = resolve(decodeURIComponent(match[1]));
      if (route) return route;
    }
  }
  return null;
}
