import {collection} from '@/lib/collections';

// The phrases come from the "marquee" collection (admin → Banda de text); the track repeats them 5×.
const COPIES = 5;

export default function Marquee() {
  const phrases: string[] = collection('marquee').map((item: any) => item.text);
  if (!phrases.length) return null;
  return (
    <section className="relative overflow-hidden bg-surface py-5">
      <div className="vv-marquee-track flex w-max text-[24px] leading-[1.2] text-fg-strong" style={{ "--vv-marquee-copies": COPIES }}>
        {Array.from({length: COPIES}, (_, copy) => (
          <span key={copy} {...(copy ? {'aria-hidden': true} : {})} className="flex shrink-0 items-center whitespace-nowrap">
            {phrases.map((phrase, index) => (
              <span key={index} className="flex items-center">
                {phrase}
                <span aria-hidden className="mx-[18px] text-fg-subtle">
                  {"•"}
                </span>
              </span>
            ))}
          </span>
        ))}
      </div>
      <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-1/4" style={{ background: "linear-gradient(90deg, var(--vv-surface) 6%, transparent 100%)" }} />
      <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 w-1/4" style={{ background: "linear-gradient(90deg, transparent 0%, var(--vv-surface) 94%)" }} />
    </section>
  );
}
