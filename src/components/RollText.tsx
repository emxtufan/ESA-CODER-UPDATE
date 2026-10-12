import type {CSSProperties} from 'react';

// module 1394
export default function RollText({text, className}: {text: string; className?: string}) {
  const label = text.replace(/\s+/g, ' ').trim();
  return (
    <span className={className}>
      <span className="sr-only pointer-coarse:not-sr-only">{label}</span>
      <span className="vv-roll pointer-coarse:hidden" aria-hidden>
        {[...label].map((char, i) => (
          <span key={i} className="vv-roll-char" style={{'--i': i} as CSSProperties}>
            <span>{char}</span>
            <span>{char}</span>
          </span>
        ))}
      </span>
    </span>
  );
}
