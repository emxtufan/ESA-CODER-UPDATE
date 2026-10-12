// Shared Lenis handle + scroll locking (module 1946).
import type Lenis from 'lenis';

let lenis: Lenis | null = null;
let locks = 0;

export function setLenis(instance: Lenis | null) {
  lenis = instance;
}

export function lockScroll() {
  if (locks++ > 0) return;
  lenis?.stop();
  document.documentElement.style.overflow = 'hidden';
}

export function unlockScroll() {
  if (locks === 0 || --locks > 0) return;
  lenis?.start();
  document.documentElement.style.overflow = '';
}

export function scrollToTop() {
  window.scrollTo(0, 0);
  lenis?.scrollTo(0, {immediate: true});
}
