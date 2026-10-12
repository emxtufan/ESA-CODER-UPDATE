// module 1790
import { useEffect, useState } from 'react';
import Link from '@/components/Link';
import { consentState } from '@/lib/consent';

import {text} from '@/lib/text';

const $t = text("components/layout/CookieBanner");

const STORAGE_KEY = 'vv-consent';

export default function CookieBanner() {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let raf = 0;
    let timeout = 0;
    const open = () => {
      setMounted(true);
      raf = requestAnimationFrame(() => {
        raf = requestAnimationFrame(() => setVisible(true));
      });
    };
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(STORAGE_KEY);
    } catch {}
    if (stored === null) timeout = window.setTimeout(open, 2200);
    const onOpen = () => open();
    window.addEventListener('vv:consent-open', onOpen);
    return () => {
      window.clearTimeout(timeout);
      cancelAnimationFrame(raf);
      window.removeEventListener('vv:consent-open', onOpen);
    };
  }, []);

  if (!mounted) return null;

  const choose = (granted: boolean) => {
    try {
      localStorage.setItem(STORAGE_KEY, granted ? 'granted' : 'denied');
    } catch {}
    const w = window as any;
    const dataLayer = (w.dataLayer = w.dataLayer ?? []);
    // gtag-style push (arguments object), as in the original
    (function (..._args: any[]) {
      dataLayer.push(arguments);
    })('consent', 'update', consentState(granted));
    setVisible(false);
    window.setTimeout(() => setMounted(false), 400);
  };

  return (
    <section
      aria-label={$t("cookie-consent")}
      className={`fixed bottom-4 left-4 z-[140] w-[calc(100%-32px)] max-w-[380px] transition-[opacity,translate] duration-[380ms] ease-brand motion-reduce:transition-none sm:bottom-6 sm:left-6 ${visible ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'}`}
    >
      <div
        className="relative overflow-hidden rounded-[12px] border p-5 backdrop-blur-[22px] sm:p-6"
        style={{
          background: 'color-mix(in srgb, var(--vv-bg) 72%, transparent)',
          borderColor: 'var(--vv-card-border)',
        }}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute top-0 left-1/2 h-px w-[240px] max-w-[80%] -translate-x-1/2"
          style={{
            background:
              'linear-gradient(90deg, transparent 0%, var(--vv-card-line) 50%, transparent 100%)',
          }}
        />
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(58% 46% at 50% 0%, var(--vv-card-lift) 0%, var(--vv-card-lift-mid) 45%, transparent 78%)',
          }}
        />
        <div className="relative">
          <p className="font-display text-[16px] leading-none font-medium tracking-[-0.02em]">
            {$t("cookies-briefly")}
          </p>
          <p className="mt-2.5 text-[13px] leading-[1.6] text-fg-muted">
            {$t("one-optional-cookie-tells-us-which")}{' '}
            <Link
              href="/privacy-policy"
              className="text-fg underline decoration-fg/30 underline-offset-4 transition-colors hover:decoration-fg"
            >
              {$t("privacy-policy")}
            </Link>
            .
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => choose(false)}
              className="rounded-full border border-line-strong px-4 py-[9px] text-[13px] leading-none font-medium transition-colors hover:border-fg-subtle hover:bg-surface"
            >
              {$t("decline")}
            </button>
            <button
              type="button"
              onClick={() => choose(true)}
              className="rounded-full border border-transparent bg-fg px-4 py-[9px] text-[13px] leading-none font-medium text-bg transition-colors hover:bg-fg-strong"
            >
              {$t("accept")}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
