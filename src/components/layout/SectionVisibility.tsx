import {useEffect} from 'react';

// module 7302: pauses CSS animations of sections far outside the viewport.
export default function SectionVisibility() {
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    const targets = Array.from(document.querySelectorAll('section, footer'));
    if (!targets.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const el = entry.target;
          if (entry.isIntersecting) el.removeAttribute('data-anim');
          else el.setAttribute('data-anim', 'paused');
        }
      },
      {rootMargin: '100% 0px'},
    );
    for (const el of targets) observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return null;
}
