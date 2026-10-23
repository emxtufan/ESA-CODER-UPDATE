// module 9393
import { useEffect, useId, useRef, useState } from 'react';
import Link from '@/components/Link';

type Option = { key: string; label: string; href?: string; count?: number };

export default function CategorySelect({
  options,
  active,
  onSelect,
  label,
  eyebrow = label ?? 'Category',
  className = '',
}: {
  options: Option[];
  active: string;
  onSelect?: (key: string) => void;
  label?: string;
  eyebrow?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [shown, setShown] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef(0);
  const menuId = useId();
  const current = options.find((o) => o.key === active) ?? options[0];

  const openMenu = () => {
    window.clearTimeout(closeTimer.current);
    setOpen(true);
    requestAnimationFrame(() => requestAnimationFrame(() => setShown(true)));
    window.setTimeout(() => setShown(true), 60);
  };
  const closeMenu = (refocus = false) => {
    setShown(false);
    closeTimer.current = window.setTimeout(() => setOpen(false), 200);
    refocus && buttonRef.current?.focus();
  };

  useEffect(() => {
    if (!open) return;
    const onOutside = (e: Event) => {
      rootRef.current?.contains(e.target as Node) || closeMenu();
    };
    document.addEventListener('pointerdown', onOutside);
    document.addEventListener('focusin', onOutside);
    return () => {
      document.removeEventListener('pointerdown', onOutside);
      document.removeEventListener('focusin', onOutside);
    };
  }, [open]);

  useEffect(() => {
    if (!shown) return;
    const items = menuRef.current?.querySelectorAll('[role="menuitemradio"]');
    const activeIndex = Math.max(
      0,
      options.findIndex((o) => o.key === active),
    );
    (items?.[activeIndex] as HTMLElement | undefined)?.focus({ preventScroll: true });
  }, [shown, options, active]);

  useEffect(() => () => window.clearTimeout(closeTimer.current), []);

  const itemClass = (isActive: boolean) =>
    `flex h-[46px] w-full items-center gap-3 rounded-[9px] px-3.5 text-left text-[15px] leading-none transition-colors focus-visible:bg-fg/6 focus-visible:text-fg focus-visible:outline-none ${isActive ? 'bg-fg/6 font-medium text-fg' : 'text-fg-muted hover:bg-fg/5 hover:text-fg active:bg-fg/8'}`;
  const itemContent = (option: Option, isActive: boolean) => (
    <>
      <span
        aria-hidden
        className={`size-1.5 shrink-0 rounded-full transition-colors ${isActive ? 'bg-blue-500' : 'bg-transparent'}`}
      />
      <span className="min-w-0 flex-1 truncate">{option.label}</span>
      {option.count !== undefined ? (
        <span className="text-[13px] text-fg-subtle tabular-nums">{option.count}</span>
      ) : null}
    </>
  );

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => (open ? closeMenu() : openMenu())}
        onKeyDown={(e) => {
          (e.key === 'ArrowDown' || e.key === 'ArrowUp') && !open && (e.preventDefault(), openMenu());
        }}
        className={`group relative flex h-12 w-full items-center gap-3 overflow-hidden rounded-full border bg-[var(--vv-glass-card)] px-5 text-left backdrop-blur-[12px] transition-colors focus-visible:outline-none ${open ? 'border-fg/35' : 'border-fg/12 hover:border-fg/25 focus-visible:border-fg/60'}`}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background: 'radial-gradient(70% 70% at 50% 0%, var(--vv-card-lift) 0%, transparent 70%)',
          }}
        />
        <span className="relative shrink-0 text-[11px] leading-none font-medium tracking-[0.14em] text-fg-subtle uppercase">
          {eyebrow}
        </span>
        <span className="relative min-w-0 flex-1 truncate text-[15px] leading-none font-medium text-fg">
          {current.label}
        </span>
        {current.count !== undefined ? (
          <span className="relative text-[13px] leading-none text-fg-subtle tabular-nums">{current.count}</span>
        ) : null}
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          className={`relative size-4 shrink-0 text-fg-muted transition-transform duration-300 ease-brand ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {open ? (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-label={label}
          onKeyDown={(e) => {
            const items = menuRef.current
              ? ([...menuRef.current.querySelectorAll('[role="menuitemradio"]')] as HTMLElement[])
              : [];
            const count = items.length;
            const currentIndex = items.indexOf(document.activeElement as HTMLElement);
            e.key === 'ArrowDown' || e.key === 'ArrowUp'
              ? (e.preventDefault(),
                items[e.key === 'ArrowDown' ? (currentIndex + 1) % count : (currentIndex - 1 + count) % count]?.focus())
              : e.key === 'Home'
                ? (e.preventDefault(), items[0]?.focus())
                : e.key === 'End'
                  ? (e.preventDefault(), items[count - 1]?.focus())
                  : e.key === 'Escape'
                    ? (e.preventDefault(), closeMenu(true))
                    : e.key === 'Tab' && closeMenu();
          }}
          className={`absolute inset-x-0 top-[calc(100%+8px)] z-30 overflow-hidden rounded-[14px] border p-1.5 backdrop-blur-[22px] transition-[opacity,translate] duration-[220ms] ease-brand motion-reduce:transition-none ${shown ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'}`}
          style={{
            background: 'color-mix(in srgb, var(--vv-bg) 86%, transparent)',
            borderColor: 'var(--vv-card-border)',
            boxShadow: 'var(--vv-pop-shadow)',
          }}
        >
          <span
            aria-hidden
            className="pointer-events-none absolute top-0 left-1/2 h-px w-[240px] max-w-[80%] -translate-x-1/2"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, var(--vv-card-line) 50%, transparent 100%)',
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
          <ul className="relative max-h-[60vh] overflow-y-auto">
            {options.map((option) => {
              const isActive = option.key === active;
              return (
                <li key={option.key}>
                  {option.href ? (
                    <Link
                      href={option.href}
                      role="menuitemradio"
                      aria-checked={isActive}
                      tabIndex={-1}
                      className={itemClass(isActive)}
                      onClick={() => closeMenu()}
                    >
                      {itemContent(option, isActive)}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      role="menuitemradio"
                      aria-checked={isActive}
                      tabIndex={-1}
                      className={itemClass(isActive)}
                      onClick={() => {
                        onSelect?.(option.key);
                        closeMenu(true);
                      }}
                    >
                      {itemContent(option, isActive)}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
