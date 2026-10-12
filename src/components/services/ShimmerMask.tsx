// module 4766 (shimmer sub-component)
import {useEffect, useRef} from 'react';

// Perlin-style noise permutation table
const perm: number[] = Array(512);
for (let i = 0; i < 256; i++) perm[i] = perm[i + 256] = Math.floor(256 * Math.random());

const fade = (t: number) => t * t * t * (t * (6 * t - 15) + 10);
const lerp = (t: number, a: number, b: number) => a + t * (b - a);
const grad = (hash: number, x: number, y: number) => {
  const h = 15 & hash;
  const u = h < 8 ? x : y;
  const v = h < 4 ? y : 12 === h || 14 === h ? x : 0;
  return ((1 & h) == 0 ? u : -u) + ((2 & h) == 0 ? v : -v);
};

const noise = (x: number, y: number) => {
  const X = 255 & Math.floor(x);
  const Y = 255 & Math.floor(y);
  x -= Math.floor(x);
  y -= Math.floor(y);
  const u = fade(x);
  const v = fade(y);
  const a = perm[X] + Y;
  const b = perm[X + 1] + Y;
  return lerp(
    v,
    lerp(u, grad(perm[a], x, y), grad(perm[b], x - 1, y)),
    lerp(u, grad(perm[a + 1], x, y - 1), grad(perm[b + 1], x - 1, y - 1)),
  );
};

let maskPromise: Promise<string> | null = null;
const INTERACTION_EVENTS = ['pointermove', 'pointerdown', 'touchstart', 'keydown'];
const waiting: Array<(url: string) => void> = [];
let listening = false;

const COLORS: Record<string, string[]> = {
  dark: ['rgb(0,153,255)', 'rgb(255,255,255)', 'rgb(54,54,54)', 'rgb(34,34,34)'],
  light: ['rgb(0,153,255)', 'rgb(0,0,0)', 'rgb(171,171,171)', 'rgb(216,216,216)'],
};

// Builds the shared noise mask image (lazily, on first user interaction)
function whenMaskReady(cb: (url: string) => void) {
  if (maskPromise) {
    maskPromise.then(cb);
    return;
  }
  waiting.push(cb);
  if (listening) return;
  listening = true;
  const onInteract = () => {
    for (const ev of INTERACTION_EVENTS) window.removeEventListener(ev, onInteract);
    (
      maskPromise ||
      (maskPromise = new Promise<string>((resolve) => {
        (() => {
          const tile = document.createElement('canvas');
          tile.width = tile.height = 1e3;
          const tctx: any = tile.getContext('2d');
          const img = tctx.createImageData(1e3, 1e3);
          const data = img.data;
          for (let y = 0; y < 1e3; y++)
            for (let x = 0; x < 1e3; x++) {
              const val = ((noise(x / 48, y / 48) + 1) / 2) * 255;
              const idx = (x + 1e3 * y) * 4;
              data[idx] = data[idx + 1] = data[idx + 2] = val;
              data[idx + 3] = 255;
            }
          tctx.putImageData(img, 0, 0);
          const out = document.createElement('canvas');
          out.width = 3e3;
          out.height = 1e3;
          const octx: any = out.getContext('2d');
          octx.drawImage(tile, 0, 0);
          octx.save();
          octx.translate(2e3, 0);
          octx.scale(-1, 1);
          octx.drawImage(tile, 0, 0);
          octx.restore();
          octx.drawImage(tile, 2e3, 0);
          out.toBlob((blob) => resolve(blob ? URL.createObjectURL(blob) : ''));
        })();
      }))
    ).then((url) => {
      for (const fn of waiting) fn(url);
      waiting.length = 0;
    });
  };
  for (const ev of INTERACTION_EVENTS)
    window.addEventListener(ev, onInteract, {once: true, passive: true});
}

export default function ShimmerMask({className = ''}: {className?: string}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const draw = () => {
      const w = (canvas.width = parent.offsetWidth);
      const h = (canvas.height = parent.offsetHeight);
      ctx.clearRect(0, 0, w, h);
      const palette =
        COLORS['light' === document.documentElement.getAttribute('data-theme') ? 'light' : 'dark'];
      for (let y = 0; y < h; y += 6)
        for (let x = 0; x < w; x += 6) {
          ctx.fillStyle = palette[Math.floor(Math.random() * palette.length)].replace(
            ')',
            `,${1 - Math.pow(1 - Math.random(), 2)})`,
          );
          ctx.fillRect(x, y, 2, 2);
        }
    };
    draw();
    let disposed = false;
    whenMaskReady((url) => {
      if (!disposed && url) {
        canvas.style.maskImage = `url(${url})`;
        canvas.style.webkitMaskImage = `url(${url})`;
      }
    });
    const resizeObserver = new ResizeObserver(draw);
    resizeObserver.observe(parent);
    const mutationObserver = new MutationObserver(draw);
    mutationObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
    return () => {
      disposed = true;
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, []);
  return (
    <div
      aria-hidden
      className={`vv-shimmer-mask pointer-events-none absolute inset-0 ${className}`}
    >
      <canvas
        ref={canvasRef}
        className="vv-shimmer size-full"
        style={{animationDuration: '13333.333333333332ms'}}
      />
    </div>
  );
}
