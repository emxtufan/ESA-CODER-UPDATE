// module 1659 (animated gradient bars behind the hero)
export default function GradientBars({
  numBars = 15,
  gradientFrom = '#0099FF',
  gradientTo = 'transparent',
  animationDuration = 2,
  className = '',
}: {
  numBars?: number;
  gradientFrom?: string;
  gradientTo?: string;
  animationDuration?: number;
  className?: string;
}) {
  return (
    <>
      <style>{`
        @keyframes vvPulseBar {
          0% { transform: scaleY(var(--initial-scale)); }
          100% { transform: scaleY(calc(var(--initial-scale) * 0.7)); }
        }
        @media (prefers-reduced-motion: reduce) {
          .vv-gradient-bar { animation: none !important; }
        }
      `}</style>
      <div className={`absolute inset-0 z-0 overflow-hidden ${className}`}>
        <div
          className="flex h-full"
          style={{
            width: '100%',
            transform: 'translateZ(0)',
            backfaceVisibility: 'hidden',
            WebkitFontSmoothing: 'antialiased',
          }}
        >
          {Array.from({length: numBars}).map((_, i) => {
            const scale = 30 + 70 * Math.pow(2 * Math.abs(i / (numBars - 1) - 0.5), 1.2);
            return (
              <div
                key={i}
                className="vv-gradient-bar"
                style={
                  {
                    flex: `1 0 calc(100% / ${numBars})`,
                    maxWidth: `calc(100% / ${numBars})`,
                    height: '100%',
                    background: `linear-gradient(to top, ${gradientFrom}, ${gradientTo})`,
                    transform: `scaleY(${scale / 100})`,
                    transformOrigin: 'bottom',
                    transition: 'transform 0.5s ease-in-out',
                    animation: `vvPulseBar ${animationDuration}s ease-in-out infinite alternate`,
                    animationDelay: `${0.1 * i}s`,
                    outline: '1px solid rgba(0, 0, 0, 0)',
                    boxSizing: 'border-box',
                    '--initial-scale': scale / 100,
                  } as any
                }
              />
            );
          })}
        </div>
      </div>
    </>
  );
}
