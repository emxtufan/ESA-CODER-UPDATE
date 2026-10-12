// module 8015
import { useEffect, useRef } from 'react';

export function IconCloud({ images, size = 210 }: { images: string[]; size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);
    const count = images.length;
    // points distributed on a sphere (golden angle)
    const points = Array.from({ length: count }, (_, i) => {
      const y = 1 - (i / (count - 1)) * 2;
      const radius = Math.sqrt(1 - y * y);
      const angle = 2.39996323 * i;
      return { x: Math.cos(angle) * radius, y, z: Math.sin(angle) * radius };
    });
    const imgs = images.map((src) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = src;
      return img;
    });
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const sphereRadius = 0.38 * size;
    let rotation = 0;
    let raf = 0;
    let visible = true;
    const reducedUntil = performance.now() + 2500;
    const frame = () => {
      ctx.clearRect(0, 0, size, size);
      if (!reduced) rotation += 0.0035;
      const tilt = 0.25 * Math.sin(0.6 * rotation);
      const cosR = Math.cos(rotation);
      const sinR = Math.sin(rotation);
      const cosT = Math.cos(tilt);
      const sinT = Math.sin(tilt);
      points
        .map((p, i) => {
          const x = p.x * cosR + p.z * sinR;
          const z = -p.x * sinR + p.z * cosR;
          return { i, x, y: p.y * cosT - z * sinT, z: p.y * sinT + z * cosT };
        })
        .sort((a, b) => a.z - b.z)
        .forEach((p) => {
          const img = imgs[p.i];
          if (!img.complete || !img.naturalWidth) return;
          const depth = (p.z + 1) / 2;
          const s = 11 + 12 * depth;
          ctx.globalAlpha = 0.22 + 0.78 * depth;
          ctx.drawImage(img, size / 2 + p.x * sphereRadius - s / 2, size / 2 + p.y * sphereRadius - s / 2, s, s);
        });
      ctx.globalAlpha = 1;
      if (visible && (!reduced || performance.now() < reducedUntil)) raf = requestAnimationFrame(frame);
    };
    const observer = new IntersectionObserver(([entry]) => {
      const wasVisible = visible;
      visible = entry.isIntersecting;
      if (visible && !wasVisible) raf = requestAnimationFrame(frame);
      if (!visible) cancelAnimationFrame(raf);
    });
    observer.observe(canvas);
    raf = requestAnimationFrame(frame);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [images, size]);
  return <canvas ref={canvasRef} style={{ width: size, height: size }} aria-hidden />;
}
