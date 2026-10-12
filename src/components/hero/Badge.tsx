// module 1659 (glowing "Design In Details" badge)
import {useEffect, useRef} from 'react';
import type {ReactNode} from 'react';

export default function Badge({children}: {children?: ReactNode}) {
  const ref = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    let pointer: {x: number; y: number} | null = null;
    let visible = true;
    let glow = 0;
    let mx = el.offsetWidth / 2;
    let my = el.offsetHeight / 2;
    let radius = 72;
    const tick = () => {
      const rect = el.getBoundingClientRect();
      let targetGlow = 0;
      let tx = mx;
      let ty = my;
      let tr = radius;
      if (pointer && visible) {
        const dist = Math.hypot(
          Math.max(rect.left - pointer.x, 0, pointer.x - rect.right),
          Math.max(rect.top - pointer.y, 0, pointer.y - rect.bottom),
        );
        const k = Math.max(0, 1 - dist / 260);
        targetGlow = k * k * (3 - 2 * k);
        tx = pointer.x - rect.left;
        ty = pointer.y - rect.top;
        tr = Math.min(Math.max(72 + 0.9 * dist, 72), 340);
      }
      if (
        ((glow += (targetGlow - glow) * 0.14),
        (mx += (tx - mx) * 0.14),
        (my += (ty - my) * 0.14),
        (radius += (tr - radius) * 0.14),
        el.style.setProperty('--glow', glow.toFixed(4)),
        el.style.setProperty('--mx', `${mx.toFixed(1)}px`),
        el.style.setProperty('--my', `${my.toFixed(1)}px`),
        el.style.setProperty('--r', `${radius.toFixed(1)}px`),
        0 === targetGlow && glow < 0.002)
      ) {
        el.style.setProperty('--glow', '0');
        raf = 0;
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    const wake = () => {
      raf || (raf = requestAnimationFrame(tick));
    };
    const onMove = (ev: PointerEvent) => {
      pointer = {x: ev.clientX, y: ev.clientY};
      wake();
    };
    const onLeave = () => {
      pointer = null;
      wake();
    };
    window.addEventListener('pointermove', onMove, {passive: true});
    document.addEventListener('pointerleave', onLeave);
    const io = new IntersectionObserver(([entry]) => {
      (visible = entry.isIntersecting) || onLeave();
    });
    io.observe(el);
    return () => {
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerleave', onLeave);
      io.disconnect();
      raf && cancelAnimationFrame(raf);
    };
  }, []);
  return (
    <p ref={ref} className="hh-badge relative isolate mb-5 inline-flex items-center rounded-full border border-line px-4 py-2 text-body-s font-medium">
      <span
        aria-hidden
        className="pointer-events-none absolute -inset-[90px] -z-30"
        style={{
          opacity: 'calc(var(--glow, 0) * 0.85)',
          WebkitMaskImage:
            'radial-gradient(var(--r, 46px) circle at calc(var(--mx, 50%) + 90px) calc(var(--my, 50%) + 90px), #000, rgba(0,0,0,0.45) 35%, transparent 70%)',
          maskImage:
            'radial-gradient(var(--r, 46px) circle at calc(var(--mx, 50%) + 90px) calc(var(--my, 50%) + 90px), #000, rgba(0,0,0,0.45) 35%, transparent 70%)',
          WebkitMaskRepeat: 'no-repeat',
          maskRepeat: 'no-repeat',
        }}
      >
        <span className="absolute inset-[90px] rounded-full" style={{background: 'var(--color-blue-500)', filter: 'blur(24px)'}} />
      </span>
      <span aria-hidden className="pointer-events-none absolute inset-0 -z-20 rounded-full bg-bg" />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 rounded-full"
        style={{
          opacity: 'var(--glow, 0)',
          background:
            'radial-gradient(var(--r, 46px) circle at var(--mx, 50%) var(--my, 50%), color-mix(in srgb, var(--color-blue-500) 22%, transparent), transparent 72%)',
        }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-full"
        style={{
          opacity: 'var(--glow, 0)',
          padding: 1,
          background:
            'radial-gradient(calc(var(--r, 46px) * 1.15) circle at var(--mx, 50%) var(--my, 50%), var(--color-blue-300), color-mix(in srgb, var(--color-blue-500) 55%, transparent) 45%, transparent 70%)',
          WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
          WebkitMaskComposite: 'xor',
          mask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
          maskComposite: 'exclude',
        }}
      />
      {children}
    </p>
  );
}
