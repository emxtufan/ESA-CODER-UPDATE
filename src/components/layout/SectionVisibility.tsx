import {useEffect} from 'react';

// module 7302: pauses CSS animations of sections far outside the viewport.
export default function SectionVisibility() {
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    const targets = Array.from(document.querySelectorAll('section, footer'));
    if (!targets.length) return;
    const onVisibility: IntersectionObserverCallback = (entries) => {
      for (const entry of entries) {
        const el = entry.target;
        if (entry.isIntersecting) el.removeAttribute('data-anim');
        else el.setAttribute('data-anim', 'paused');
      }
    };
    const observer = new IntersectionObserver(onVisibility, {rootMargin: '100% 0px'});
    const cards = new IntersectionObserver(onVisibility, {rootMargin: '100px'});
    for (const el of targets) observer.observe(el);
    for (const el of document.querySelectorAll('[data-services] [data-reveal]')) cards.observe(el);
    return () => { observer.disconnect(); cards.disconnect(); };
  }, []);
  return null;
}
