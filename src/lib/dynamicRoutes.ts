// URL patterns backed by collections. Keep in sync with server/routes.mjs.
//   /works/:slug          → projects       (field `slug`, title `metaTitle`)
//   /blog/category/:key   → postCategories (field `key`,  title `metaTitle`)
//   /blog/:slug           → posts          (field `slug`, title `metaTitle`)
//   /:slug                → pages          (field `slug`, title `metaTitle`), only when no static page exists
import {lazy, type ComponentType, type LazyExoticComponent} from 'react';
import {findInCollection} from './collections';

export type ResolvedRoute = {
  title: string;
  page: LazyExoticComponent<ComponentType<any>>;
  props?: Record<string, unknown>;
};

const ProjectPage = lazy(() => import('@/templates/ProjectPage'));
const PostPage = lazy(() => import('@/templates/PostPage'));
const PostCategoryPage = lazy(() => import('@/templates/PostCategoryPage'));
const CustomPage = lazy(() => import('@/templates/CustomPage'));

const DYNAMIC: Array<{pattern: RegExp; resolve: (param: string) => ResolvedRoute | null}> = [
  {
    pattern: /^\/works\/([^/]+)$/,
    resolve: (slug) => {
      const item = findInCollection('projects', 'slug', slug);
      return item ? {title: item.metaTitle, page: ProjectPage, props: {item}} : null;
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
      return item ? {title: item.metaTitle, page: PostPage, props: {item}} : null;
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
