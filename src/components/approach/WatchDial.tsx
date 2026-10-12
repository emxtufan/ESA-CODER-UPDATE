// module 4956
import { useEffect, useRef } from 'react';

const HANDS = [
  { src: 'hand-hour', cls: 'vv-hand-hour' },
  { src: 'hand-minute', cls: 'vv-hand-minute' },
  { src: 'hand-second', cls: 'vv-hand-second' },
];

export default function WatchDial() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const hands = HANDS.map((hand) => root.querySelector(`[data-hand="${hand.src}"]`) as HTMLElement | null);
    // Negative animation delays so the CSS rotations start at the real current time.
    const now = new Date();
    const seconds = now.getSeconds() + now.getMilliseconds() / 1e3;
    const minutes = 60 * now.getMinutes() + seconds;
    const offsets = [3600 * now.getHours() + minutes, minutes, seconds];
    hands.forEach((hand, i) => {
      if (hand) hand.style.animationDelay = `${-offsets[i]}s`;
    });
  }, []);

  return (
    <div ref={rootRef} className="pointer-events-none relative aspect-[382/300] w-full shrink-0">
      <div className="absolute inset-0 flex items-center justify-center px-8 pb-[18px]">
        <div className="relative h-full aspect-[540/392] shrink-0">
          <div className="vv-watch-dial absolute inset-0" aria-hidden />
          {HANDS.map((hand) => (
            <img
              key={hand.src}
              data-hand={hand.src}
              src={`/approach/${hand.src}.webp`}
              alt=""
              className={`absolute inset-0 h-full w-full max-w-none object-contain ${hand.cls}`}
              loading="lazy"
              decoding="async"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
