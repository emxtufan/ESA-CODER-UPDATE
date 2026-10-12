import type {CSSProperties} from 'react';

// module 9581
export default function ShineBorder({
  borderWidth = 1,
  duration = 2.8,
  colors = ['#0099FF', '#7ACAFF'],
}: {
  borderWidth?: number;
  duration?: number;
  colors?: string[];
}) {
  const [from, to] = colors;
  const layer = (variable: string): CSSProperties => ({
    padding: borderWidth,
    animationDuration: `${duration}s`,
    backgroundImage: `conic-gradient(from calc(var(${variable}) - var(--vv-shine-w, 24deg)), transparent 0deg, ${from} calc(var(--vv-shine-w, 24deg) / 2), ${to} var(--vv-shine-w, 24deg), transparent calc(var(--vv-shine-w, 24deg) * 2), transparent 360deg)`,
    mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
    WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
    maskComposite: 'exclude',
    WebkitMaskComposite: 'xor',
  });
  return (
    <>
      <span
        aria-hidden
        className="vv-shine vv-shine-lyr-a pointer-events-none absolute inset-0 rounded-[inherit] pointer-coarse:hidden"
        style={layer('--vv-shine-a')}
      />
      <span
        aria-hidden
        className="vv-shine vv-shine-lyr-b pointer-events-none absolute inset-0 rounded-[inherit] pointer-coarse:hidden"
        style={layer('--vv-shine-b')}
      />
    </>
  );
}
