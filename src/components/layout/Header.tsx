// module 513
import { useCallback, useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import Link from '@/components/Link';
import RollText from '@/components/RollText';
import { VisuvateWordmark } from '@/components/Logo';
import { usePathname } from '@/lib/navigation';
import { lockScroll, unlockScroll } from '@/lib/scrollLock';

function ThemeToggle() {
  const [theme, setTheme] = useState(() =>
    typeof document !== 'undefined' &&
    document.documentElement.getAttribute('data-theme') === 'light'
      ? 'light'
      : 'dark',
  );
  const buttonRef = useRef<HTMLButtonElement>(null);
  const busy = useRef(false);

  const toggle = useCallback(() => {
    if (busy.current) return;
    const next = theme === 'dark' ? 'light' : 'dark';
    const apply = () => {
      document.documentElement.setAttribute('data-theme', next);
      setTheme(next);
      try {
        localStorage.setItem('vv-theme', next);
      } catch {}
    };
    const startViewTransition = (document as any).startViewTransition?.bind(document);
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!startViewTransition || reduced) return void apply();
    const w = window.innerWidth;
    const h = window.innerHeight;
    const rect = buttonRef.current?.getBoundingClientRect();
    const cx = rect ? rect.left + rect.width / 2 : w / 2;
    const cy = rect ? rect.top + rect.height / 2 : h / 2;
    const radius = Math.hypot(Math.max(cx, w - cx), Math.max(cy, h - cy));
    const pct = (a: number, b: number) => `${(a / b) * 100}%`;
    const endRadius = `${(radius / (Math.hypot(w, h) / Math.SQRT2)) * 100}%`;
    const origin = `${pct(cx, w)} ${pct(cy, h)}`;
    const clipFrom = `circle(0% at ${origin})`;
    const clipTo = `circle(${endRadius} at ${origin})`;
    const root = document.documentElement;
    busy.current = true;
    root.dataset.vvThemeVt = 'active';
    root.style.setProperty('--vv-theme-clip-from', clipFrom);
    const transition = startViewTransition(() => flushSync(apply));
    transition.finished
      .finally(() => {
        busy.current = false;
        delete root.dataset.vvThemeVt;
        root.style.removeProperty('--vv-theme-clip-from');
      })
      .catch(() => {});
    transition.ready
      .then(() => {
        root.animate(
          { clipPath: [clipFrom, clipTo] },
          {
            duration: 480,
            easing: 'ease-in-out',
            fill: 'forwards',
            pseudoElement: '::view-transition-new(root)',
          } as any,
        );
      })
      .catch(() => {});
  }, [theme]);

  return (
    <button
      ref={buttonRef}
      onClick={toggle}
      role="switch"
      aria-checked={theme === 'light'}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      className="relative h-6 w-[46px] rounded-full border border-line-strong bg-surface-strong transition-colors"
    >
      <span
        className={`absolute top-[2px] left-[2px] size-[18px] rounded-full transition-transform duration-300 ${theme === 'light' ? 'translate-x-[22px] bg-blue-500' : 'bg-white'}`}
      />
    </button>
  );
}

const NAV_ITEMS = [
  { label: 'Home', href: '/' },
  { label: 'About Us', href: '/about-us' },
  { label: 'Works', href: '/works' },
  { label: 'Services', href: '/services' },
  { label: 'Blogs', href: '/blog' },
  { label: 'Templates', href: '/templates' },
];

export default function Header() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const hero = document.getElementById('hero');
    if (hero && typeof IntersectionObserver !== 'undefined') {
      const observer = new IntersectionObserver(([entry]) => setCompact(!entry.isIntersecting));
      observer.observe(hero);
      return () => observer.disconnect();
    }
    const onScroll = () => setCompact(window.scrollY > 480);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [pathname]);

  useEffect(() => {
    if (menuOpen) {
      lockScroll();
      return unlockScroll;
    }
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [menuOpen]);

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : !href.includes('#') && pathname.startsWith(href);

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-[200] border-b transition-[padding,background-color,border-color,backdrop-filter] duration-500 ease-brand motion-reduce:transition-none ${scrolled ? 'border-line bg-[var(--vv-nav-bg)] backdrop-blur-xl backdrop-saturate-150' : 'border-transparent'} ${compact ? 'min-[981px]:border-transparent min-[981px]:bg-transparent min-[981px]:pt-5 min-[981px]:backdrop-filter-none' : ''}`}
      >
        <div
          className={`mx-auto grid max-w-[1380px] grid-cols-[auto_1fr] items-center gap-5 px-6 py-4 transition-[max-width,padding,background-color,border-radius,box-shadow,backdrop-filter] duration-500 ease-brand motion-reduce:transition-none min-[981px]:grid-cols-[1fr_auto_1fr] ${compact ? 'min-[981px]:max-w-[920px] min-[981px]:rounded-[8px] min-[981px]:bg-[var(--vv-nav-bg)] min-[981px]:px-3 min-[981px]:py-3 min-[981px]:ring-1 min-[981px]:ring-white/10 min-[981px]:backdrop-blur-xl min-[981px]:backdrop-saturate-150' : 'md:px-8'}`}
        >
          <Link
            href="/"
            aria-label="Visuvate — home"
            className={`flex items-center justify-self-start ${compact ? 'min-[981px]:pl-3' : ''}`}
          >
            <VisuvateWordmark className="h-5 w-auto" />
          </Link>
          <nav aria-label="Primary" className="hidden items-center gap-7 min-[981px]:flex">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={`text-[15px] tracking-[-0.01em] transition-colors hover:text-fg ${isActive(item.href) ? 'font-medium text-fg' : 'text-fg-muted'}`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2 justify-self-end min-[981px]:gap-3.5">
            <ThemeToggle />
            <Link
              href="/contact"
              className="inline-flex h-[38px] shrink-0 items-center rounded-full border border-transparent bg-fg px-4 text-[13px] font-medium tracking-[-0.01em] whitespace-nowrap text-bg transition-colors hover:bg-fg-strong min-[981px]:h-[36px] min-[981px]:px-[18px]"
            >
              <RollText text="Connect" className="min-[981px]:hidden" />
              <RollText text="Let’s Connect" className="hidden min-[981px]:inline" />
            </Link>
            <button
              onClick={() => setMenuOpen((open) => !open)}
              aria-expanded={menuOpen}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              className={`grid size-[42px] shrink-0 place-items-center rounded-full border transition-colors duration-300 ease-brand min-[981px]:hidden ${menuOpen ? 'border-fg bg-fg' : 'border-line-strong'}`}
            >
              <span className="relative block h-[10px] w-4">
                <span
                  className={`absolute left-0 block h-[1.5px] w-full transition-[rotate,top,background-color] duration-[380ms] ease-brand motion-reduce:transition-none ${menuOpen ? 'top-[4.25px] rotate-45 bg-bg' : 'top-0 bg-fg'}`}
                />
                <span
                  className={`absolute left-0 block h-[1.5px] w-full transition-[rotate,top,background-color] duration-[380ms] ease-brand motion-reduce:transition-none ${menuOpen ? 'top-[4.25px] -rotate-45 bg-bg' : 'top-[8.5px] bg-fg'}`}
                />
              </span>
            </button>
          </div>
        </div>
      </header>
      <div
        inert={!menuOpen}
        className={`fixed inset-0 z-[190] flex flex-col justify-between bg-bg px-6 pt-[104px] pb-10 transition-[clip-path] duration-[600ms] ease-brand min-[981px]:hidden ${menuOpen ? '[clip-path:inset(0)]' : 'pointer-events-none [clip-path:inset(0_0_100%_0)]'}`}
      >
        <nav aria-label="Mobile" className="flex flex-col">
          {NAV_ITEMS.map((item, index) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                aria-current={active ? 'page' : undefined}
                style={{ transitionDelay: menuOpen ? `${180 + 55 * index}ms` : '0ms' }}
                className={`group flex items-baseline gap-4 border-b py-[13px] transition-[opacity,translate,border-color] duration-[550ms] ease-brand motion-reduce:transition-none ${menuOpen ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'} ${active ? 'border-fg/25' : 'border-line'}`}
              >
                <span
                  className={`w-6 shrink-0 text-[11px] tabular-nums transition-colors ${active ? 'text-fg' : 'text-fg-subtle'}`}
                >
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span
                  className={`font-display text-[34px] leading-[1.15] font-medium tracking-h2 transition-[translate,color] duration-300 ease-brand group-hover:translate-x-1 ${active ? 'text-fg' : 'text-fg-muted'}`}
                >
                  {item.label}
                </span>
                {active ? (
                  <span
                    aria-hidden
                    className="ml-auto size-1.5 self-center rounded-full bg-blue-500"
                  />
                ) : null}
              </Link>
            );
          })}
        </nav>
        <div
          style={{ transitionDelay: menuOpen ? `${180 + 55 * NAV_ITEMS.length}ms` : '0ms' }}
          className={`flex flex-col gap-4 transition-[opacity,translate] duration-[550ms] ease-brand motion-reduce:transition-none ${menuOpen ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
        >
          <Link
            href="/contact"
            onClick={() => setMenuOpen(false)}
            className="inline-flex h-[52px] w-full items-center justify-center rounded-full bg-blue-500 text-[15px] font-medium text-white transition-opacity hover:opacity-90"
          >
            <RollText text="Let’s Connect" />
          </Link>
          <a
            href="mailto:contact@visuvate.com"
            className="text-center text-[13px] text-fg-subtle transition-colors hover:text-fg-muted"
          >
            contact@visuvate.com
          </a>
        </div>
      </div>
    </>
  );
}
