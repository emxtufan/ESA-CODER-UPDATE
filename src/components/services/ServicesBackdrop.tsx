// module 5163
import { useEffect, useState } from 'react';
import { ShaderCanvas } from '@/components/ShaderCanvas';

const BRAND_DARK = [
  [0, 0, 0],
  [0, 0.36, 0.6],
  [0, 0.6, 1],
  [0.72, 0.96, 1],
];
const BRAND_LIGHT = [
  [1, 1, 1],
  [0.8, 0.925, 1],
  [0.239, 0.694, 1],
  [0, 0.6, 1],
];
const MONO_DARK = [
  [0, 0, 0],
  [0.15, 0.15, 0.17],
  [0.44, 0.45, 0.48],
  [0.9, 0.92, 0.95],
];
const MONO_LIGHT = [
  [1, 1, 1],
  [0.9, 0.9, 0.92],
  [0.58, 0.59, 0.62],
  [0.13, 0.14, 0.16],
];

function useTheme() {
  const [theme, setTheme] = useState('dark');
  useEffect(() => {
    const update = () =>
      setTheme(document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark');
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
    return () => observer.disconnect();
  }, []);
  return theme;
}

export default function ServicesBackdrop({ className = '', tone = 'brand' }: { className?: string; tone?: string }) {
  const isLight = useTheme() === 'light';
  return (
    <div aria-hidden className={`pointer-events-none ${className}`}>
      <ShaderCanvas
        className="size-full"
        colors={tone === 'mono' ? (isLight ? MONO_LIGHT : MONO_DARK) : isLight ? BRAND_LIGHT : BRAND_DARK}
        colorCount={4}
      />
    </div>
  );
}
