// module 9484
import { useCallback, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { usePathname, useRouter } from '@/lib/navigation';
import { scrollToTop } from '@/lib/scrollLock';

export default function PageTransition() {
  const router = useRouter();
  const pathname = usePathname();
  const rootRef = useRef<HTMLDivElement>(null);
  const panelsRef = useRef<HTMLDivElement[]>([]);
  const markRef = useRef<HTMLSpanElement>(null);
  const pending = useRef<{ path: string; pop: boolean } | null>(null);
  const timeoutRef = useRef<any>(null);
  const currentPath = useRef(pathname);

  const reveal = useCallback(() => {
    const pop = pending.current?.pop ?? false;
    pending.current = null;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    const root = rootRef.current;
    if (root) {
      gsap
        .timeline({
          onComplete: () => {
            root.style.visibility = 'hidden';
            root.style.pointerEvents = 'none';
          },
        })
        .to(markRef.current, { opacity: 0, duration: 0.18, ease: 'power2.in' }, 0)
        .to(
          panelsRef.current,
          {
            yPercent: pop ? 100 : -100,
            duration: 0.46,
            ease: 'power3.inOut',
            stagger: { each: 0.05, from: 'start' },
          },
          0.06,
        );
    }
  }, []);

  useEffect(() => {
    currentPath.current = pathname;
    if (pending.current !== null) {
      if (!pending.current.pop) scrollToTop();
      reveal();
    }
  }, [pathname, reveal]);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const onClick = (e: MouseEvent) => {
      let url: URL;
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)
        return;
      const anchor = (e.target as any)?.closest?.('a') as HTMLAnchorElement | null;
      const href = anchor?.getAttribute('href');
      if (
        !anchor ||
        !href ||
        anchor.hasAttribute('download') ||
        (anchor.target && anchor.target !== '_self') ||
        /^(mailto:|tel:|#)/i.test(href)
      )
        return;
      try {
        url = new URL(href, location.href);
      } catch {
        return;
      }
      if (
        url.origin !== location.origin ||
        url.pathname.startsWith('/admin') ||
        url.pathname === location.pathname
      )
        return;
      if (pending.current !== null) return void e.preventDefault();
      e.preventDefault();
      const target = url.pathname + url.search + url.hash;
      pending.current = { path: url.pathname, pop: false };
      timeoutRef.current = setTimeout(reveal, 4e3);
      const clientX = e.clientX;
      new Promise<void>((resolve) => {
        const root = rootRef.current;
        if (!root) return resolve();
        gsap.set(panelsRef.current, { yPercent: 100 });
        gsap.set(markRef.current, { opacity: 0, scale: 0.86 });
        root.style.visibility = 'visible';
        root.style.pointerEvents = 'auto';
        const from = Math.min(4, Math.max(0, Math.floor((clientX / (window.innerWidth || 1)) * 5)));
        gsap
          .timeline({ onComplete: resolve })
          .to(
            panelsRef.current,
            {
              yPercent: 0,
              duration: 0.38,
              ease: 'power3.inOut',
              stagger: { each: 0.05, from },
            },
            0,
          )
          .to(markRef.current, { opacity: 1, scale: 1, duration: 0.3, ease: 'power2.out' }, 0.2);
      }).then(() => {
        router.push(target);
      });
    };
    const onPopState = () => {
      if (pending.current !== null || location.pathname === currentPath.current) return;
      const root = rootRef.current;
      if (root) {
        pending.current = { path: location.pathname, pop: true };
        gsap.set(panelsRef.current, { yPercent: 0 });
        gsap.set(markRef.current, { opacity: 1, scale: 1 });
        root.style.visibility = 'visible';
        root.style.pointerEvents = 'auto';
        timeoutRef.current = setTimeout(reveal, 4e3);
      }
    };
    document.addEventListener('click', onClick, true);
    window.addEventListener('popstate', onPopState);
    return () => {
      document.removeEventListener('click', onClick, true);
      window.removeEventListener('popstate', onPopState);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [router, reveal]);

  return (
    <div
      ref={rootRef}
      aria-hidden
      className="fixed inset-0 z-[400]"
      style={{ visibility: 'hidden', pointerEvents: 'none' }}
    >
      <div className="absolute inset-0 flex">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            ref={(el) => {
              if (el) panelsRef.current[i] = el;
            }}
            className="h-full flex-1"
            style={{ background: 'var(--vv-bg)', marginRight: i === 4 ? 0 : -1 }}
          />
        ))}
      </div>
      <div className="pointer-events-none absolute inset-0 grid place-items-center">
        <span
          ref={markRef}
          className="w-[180px]"
          style={{
            opacity: 0,
            aspectRatio: '2785 / 778',
            backgroundColor: 'var(--vv-text-primary)',
            mask: 'url(/brand/logo.webp) center / contain no-repeat',
            WebkitMask: 'url(/brand/logo.webp) center / contain no-repeat',
          }}
        />
      </div>
    </div>
  );
}
