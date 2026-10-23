/** The frosted panel that slides over the parallax page title (PageTitle) when scrolling, as on /about-us. */
export default function BlurPanel({children, className = ''}: {children: React.ReactNode; className?: string}) {
  return (
    <div className={`relative pt-[40px] ${className}`} style={{ background: "color-mix(in srgb, var(--vv-bg) 80%, transparent)" }}>
      <span aria-hidden className="pointer-events-none absolute top-0 left-1/2 h-px w-[600px] max-w-full -translate-x-1/2" style={{ background: "linear-gradient(90deg, transparent 0%, var(--vv-card-line) 50%, transparent 100%)" }} />
      <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[420px]" style={{ background: "radial-gradient(34% 40% at 50% 0%, var(--vv-card-lift) 0%, var(--vv-card-lift-mid) 45%, transparent 76%)" }} />
      <div className="relative">{children}</div>
    </div>
  );
}
