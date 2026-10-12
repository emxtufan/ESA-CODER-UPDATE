import {useEffect, useRef} from 'react';

// module 5144
export default function FooterMark() {
  const ref = useRef<HTMLImageElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        el.dataset.shown = String(entry.isIntersecting);
      },
      {threshold: 0.15},
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return (
    <img
      ref={ref}
      src="/brand/footer-mark.webp"
      alt=""
      aria-hidden
      className="vv-mark vv-footer-mark pointer-events-none absolute top-[292px] left-1/2 -z-10 w-[430px] max-w-none md:top-[374px] md:w-[924px]"
      loading="lazy"
      decoding="async"
    />
  );
}
