// module 1790
import { useEffect, useState } from 'react';
import Link from '@/components/Link';
import { applyConsent, categories, needsConsent, readConsent, saveConsent, type Consent } from '@/lib/consent';

import {text} from '@/lib/text';

const $t = text("components/layout/CookieBanner");

// Asks once, by category (only the categories whose trackers are set in the admin); the footer "Cookies"
// button reopens it. Without any tracker configured it never shows.
export default function CookieBanner() {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [custom, setCustom] = useState(false);
  const [choice, setChoice] = useState<Consent>({statistics: false, marketing: false});

  useEffect(() => {
    let raf = 0;
    let timeout = 0;
    const open = () => {
      setChoice(readConsent() ?? {statistics: false, marketing: false});
      setMounted(true);
      raf = requestAnimationFrame(() => {
        raf = requestAnimationFrame(() => setVisible(true));
      });
    };
    const stored = readConsent();
    if (stored) applyConsent(stored);
    else if (needsConsent()) timeout = window.setTimeout(open, 2200);
    const onOpen = () => {
      if (!needsConsent()) return;
      setCustom(true);
      open();
    };
    window.addEventListener('vv:consent-open', onOpen);
    return () => {
      window.clearTimeout(timeout);
      cancelAnimationFrame(raf);
      window.removeEventListener('vv:consent-open', onOpen);
    };
  }, []);

  if (!mounted) return null;

  const has = categories();
  const choose = (next: Consent) => {
    saveConsent(next);
    setVisible(false);
    window.setTimeout(() => {
      setMounted(false);
      setCustom(false);
    }, 400);
  };
  const row = (key: keyof Consent | 'necessary', title: string, desc: string) => (
    <label key={key} className={`flex items-start justify-between gap-3 py-2.5${key === 'necessary' ? '' : ' border-t border-line'}`}>
      <span className="min-w-0">
        <span className="block text-[13px] leading-[1.4] font-medium">{title}</span>
        <span className="block text-[12px] leading-[1.5] text-fg-muted">{desc}</span>
      </span>
      {key === 'necessary' ? (
        <span className="shrink-0 pt-1 text-[11px] text-fg-muted">{$t("always-on")}</span>
      ) : (
        <input
          type="checkbox"
          className="mt-1 size-4 shrink-0"
          style={{accentColor: 'var(--vv-text-primary)'}}
          checked={choice[key]}
          onChange={(e) => setChoice((c) => ({...c, [key]: e.target.checked}))}
        />
      )}
    </label>
  );

  const button = 'rounded-full border px-4 py-[9px] text-[13px] leading-none font-medium transition-colors';
  const secondary = `${button} border-line-strong hover:border-fg-subtle hover:bg-surface`;
  const primary = `${button} border-transparent bg-fg text-bg hover:bg-fg-strong`;

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
          {custom && (
            <div className="mt-3">
              {row('necessary', $t("necessary"), $t("necessary-desc"))}
              {has.statistics && row('statistics', $t("statistics"), $t("statistics-desc"))}
              {has.marketing && row('marketing', $t("marketing"), $t("marketing-desc"))}
            </div>
          )}
          <div className="mt-4 grid grid-cols-2 gap-2.5">
            <button type="button" onClick={() => choose({statistics: false, marketing: false})} className={secondary}>
              {$t("decline")}
            </button>
            {custom ? (
              <button type="button" onClick={() => choose(choice)} className={primary}>
                {$t("save-choices")}
              </button>
            ) : (
              <button type="button" onClick={() => choose({statistics: has.statistics, marketing: has.marketing})} className={primary}>
                {$t("accept")}
              </button>
            )}
          </div>
          {!custom && (
            <button
              type="button"
              onClick={() => setCustom(true)}
              className="mt-3 w-full text-center text-[12px] text-fg-muted underline decoration-fg/20 underline-offset-4 transition-colors hover:text-fg"
            >
              {$t("customize")}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
