// module 6982
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { lockScroll, unlockScroll } from '@/lib/scrollLock';

import {text} from '@/lib/text';

const $t = text("components/blog/ArticleLightbox");

export default function ArticleLightbox() {
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const [items, setItems] = useState<{ src: string; alt: string; caption: string }[]>([]);
  const [index, setIndex] = useState<number | null>(null);
  const [zoomed, setZoomed] = useState(false);
  const close = useCallback(() => setIndex(null), []);
  const step = useCallback(
    (delta: number) => {
      setZoomed(false);
      setIndex((current) => (current === null ? null : (current + delta + items.length) % items.length));
    },
    [items.length],
  );

  useEffect(() => {
    const article = document.querySelector('article.article');
    if (!article) return;
    const images = [...article.querySelectorAll('img')].filter((img) => !img.closest('a'));
    imagesRef.current = images;
    const bound = images.map((img, i) => {
      const onClick = () => {
        setItems(
          imagesRef.current.map((el) => ({
            src: el.currentSrc || el.src,
            alt: el.alt,
            caption: el.closest('figure')?.querySelector('figcaption')?.textContent?.trim() ?? '',
          })),
        );
        setZoomed(false);
        setIndex(i);
      };
      img.addEventListener('click', onClick);
      img.style.cursor = 'zoom-in';
      img.setAttribute('role', 'button');
      img.setAttribute('tabindex', '0');
      const onKey = (e: KeyboardEvent) => {
        (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onClick());
      };
      img.addEventListener('keydown', onKey);
      return { img, onClick, onKey };
    });
    return () => {
      bound.forEach(({ img, onClick, onKey }) => {
        img.removeEventListener('click', onClick);
        img.removeEventListener('keydown', onKey);
        img.style.cursor = '';
        img.removeAttribute('role');
        img.removeAttribute('tabindex');
      });
    };
  }, []);

  useEffect(() => {
    if (index === null) return;
    lockScroll();
    const onKeyDown = (e: KeyboardEvent) => {
      e.key === 'Escape' ? close() : e.key === 'ArrowRight' ? step(1) : e.key === 'ArrowLeft' && step(-1);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      unlockScroll();
    };
  }, [index, close, step]);

  if (index === null || !items[index]) return null;
  const current = items[index];
  const multiple = items.length > 1;
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={current.alt || current.caption || $t("image")}
      className="vv-lightbox fixed inset-0 z-[350] flex flex-col"
      onClick={close}
    >
      <div className="vv-lightbox-scrim absolute inset-0" />
      <div className="relative flex shrink-0 items-center justify-between gap-4 px-5 py-4 md:px-7">
        <span className="text-[13px] tabular-nums" style={{ color: 'var(--vv-text-subtle)' }}>
          {multiple ? `${index + 1} / ${items.length}` : ''}
        </span>
        <button
          type="button"
          onClick={close}
          autoFocus
          aria-label={$t("close")}
          className="vv-lightbox-btn grid size-9 place-items-center rounded-full"
        >
          <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>
      <div
        className="relative flex min-h-0 flex-1 items-center justify-center px-4 pb-2 md:px-14"
        style={{ overflow: zoomed ? 'auto' : 'hidden' }}
      >
        {multiple ? (
          <>
            <button
              type="button"
              aria-label={$t("previous-image")}
              onClick={(e) => {
                e.stopPropagation();
                step(-1);
              }}
              className="vv-lightbox-btn absolute top-1/2 left-2 z-10 grid size-10 -translate-y-1/2 place-items-center rounded-full md:left-4"
            >
              <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M15 5l-7 7 7 7" />
              </svg>
            </button>
            <button
              type="button"
              aria-label={$t("next-image")}
              onClick={(e) => {
                e.stopPropagation();
                step(1);
              }}
              className="vv-lightbox-btn absolute top-1/2 right-2 z-10 grid size-10 -translate-y-1/2 place-items-center rounded-full md:right-4"
            >
              <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        ) : null}
        <img
          key={current.src}
          src={current.src}
          alt={current.alt}
          onClick={(e) => {
            e.stopPropagation();
            setZoomed((z) => !z);
          }}
          className="vv-lightbox-img"
          style={{
            maxWidth: zoomed ? 'none' : '100%',
            maxHeight: zoomed ? 'none' : '100%',
            width: zoomed ? 'auto' : undefined,
            cursor: zoomed ? 'zoom-out' : 'zoom-in',
          }}
        />
      </div>
      <div className="relative shrink-0 px-6 pt-2 pb-5 text-center">
        {current.caption ? (
          <p className="text-[13px] leading-[1.5]" style={{ color: 'var(--vv-text-muted)' }}>
            {current.caption}
          </p>
        ) : null}
        <p className="mt-1 text-[11px]" style={{ color: 'var(--vv-text-subtle)' }}>
          {zoomed ? $t("click-the-image-to-fit") : $t("click-the-image-to-zoom")}
          {multiple ? $t("arrow-keys-to-browse") : ''}
          {$t("esc-to-close")}
        </p>
      </div>
    </div>,
    document.body,
  );
}
