// Minimal client-side router exposing the next/navigation API used by the
// original components (usePathname, useRouter, useSearchParams).
import {useSyncExternalStore} from 'react';

type Listener = () => void;
const listeners = new Set<Listener>();

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

if (typeof window !== 'undefined') {
  window.addEventListener('popstate', emit);
}

function normalize(pathname: string) {
  return pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
}

function getPathname() {
  return typeof window === 'undefined' ? '/' : normalize(window.location.pathname);
}

function getSearch() {
  return typeof window === 'undefined' ? '' : window.location.search;
}

function navigate(href: string, replace = false) {
  const url = new URL(href, window.location.href);
  if (url.origin !== window.location.origin) {
    window.location.assign(url.href);
    return;
  }
  const target = url.pathname + url.search + url.hash;
  if (replace) window.history.replaceState(null, '', target);
  else window.history.pushState(null, '', target);
  emit();
}

// Stable object, like Next's router.
const router = {
  push: (href: string) => navigate(href),
  replace: (href: string) => navigate(href, true),
  prefetch: (_href: string) => {},
  back: () => window.history.back(),
  forward: () => window.history.forward(),
  refresh: () => emit(),
};

// During server rendering (tests) the path can be set with globalThis.__SSR_PATH__.
const serverPathname = () => normalize((globalThis as any).__SSR_PATH__ ?? '/');

export function usePathname() {
  return useSyncExternalStore(subscribe, getPathname, serverPathname);
}

export function useRouter() {
  return router;
}

export function useSearchParams() {
  const search = useSyncExternalStore(subscribe, getSearch, () => '');
  return new URLSearchParams(search);
}

export {router};
