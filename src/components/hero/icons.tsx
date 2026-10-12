// module 1659 (inspector icons + tooltip)
import type {ReactNode} from 'react';

import {text} from '@/lib/text';

const $t = text("components/hero/icons");

export const chevronRight = (className = 'w-3') => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 6l6 6-6 6" />
  </svg>
);

export const chevronDown = (className = 'w-3') => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9l6 6 6-6" />
  </svg>
);

export const homeIcon = (className = 'w-4') => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M11.34 2.28a1 1 0 0 1 1.32 0l8.5 7.42a1 1 0 0 1 .34.75V20a2 2 0 0 1-2 2h-4.25v-5.5a1 1 0 0 0-1-1h-2.4a1 1 0 0 0-1 1V22H4.5a2 2 0 0 1-2-2v-9.55a1 1 0 0 1 .34-.75l8.5-7.42Z" />
  </svg>
);

export const pageIcon = (className = 'w-4') => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" fillRule="evenodd" clipRule="evenodd">
    <path d="M6.5 2h6.67a1 1 0 0 1 .7.29l5.34 5.32a1 1 0 0 1 .29.71V20a2 2 0 0 1-2 2h-11a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Zm7.25 2.42v2.9a.6.6 0 0 0 .6.6h2.9l-3.5-3.5Z" />
  </svg>
);

export const layersIcon = (className = 'w-4') => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M11.55 2.2a1 1 0 0 1 .9 0l8.6 4.3a.62.62 0 0 1 0 1.11l-8.6 4.3a1 1 0 0 1-.9 0l-8.6-4.3a.62.62 0 0 1 0-1.11l8.6-4.3Z" />
    <path d="m3.83 11 -.88.44a.62.62 0 0 0 0 1.11l8.6 4.3a1 1 0 0 0 .9 0l8.6-4.3a.62.62 0 0 0 0-1.11L20.17 11l-7.72 3.86a1 1 0 0 1-.9 0L3.83 11Z" />
    <path d="m3.83 15.7 -.88.44a.62.62 0 0 0 0 1.11l8.6 4.3a1 1 0 0 0 .9 0l8.6-4.3a.62.62 0 0 0 0-1.11l-.88-.44-7.72 3.86a1 1 0 0 1-.9 0L3.83 15.7Z" />
  </svg>
);

export const desktopIcon = (className = 'w-5') => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="14" rx="2" />
    <line x1="8" y1="21" x2="16" y2="21" />
    <line x1="12" y1="17" x2="12" y2="21" />
  </svg>
);

export const mobileIcon = (className = 'w-4') => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="5" y="2" width="14" height="20" rx="2" />
    <path d="M12 18h.01" />
  </svg>
);

export const searchIcon = (className = 'w-3') => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="11" cy="11" r="7" />
    <path d="M20 20l-3.5-3.5" />
  </svg>
);

export const sunIcon = (className = 'size-6') => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2">
    <path d="M12 4V3m5.657 3.343l.707-.707M20 12h1m-3.343 5.657l.707.707M12 20v1m-5.657-3.343l-.707.707M4 12H3m3.343-5.657l-.707-.707M17 12a5 5 0 1 1-10 0a5 5 0 0 1 10 0Z" />
  </svg>
);

export const moonIcon = (className = 'size-6') => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="m13.38 4.121l-.91.412a1 1 0 0 1 1.082-1.397zM14 7h1zm-9.879 6.38l-.985.171a1 1 0 0 1 1.397-1.082zM20 12h1zm-6.62-7.879l.912-.412A8 8 0 0 1 15 7h-2c0-.88-.19-1.715-.53-2.467zM14 7h1a8 8 0 0 1-8 8v-2a6 6 0 0 0 6-6zm-7 7v1a8 8 0 0 1-3.29-.709l.411-.911l.412-.911A6 6 0 0 0 7 13zm-2.879-.62l.985-.171A7 7 0 0 0 12 19v2c-4.443 0-8.128-3.218-8.864-7.449zM12 20v-1a7 7 0 0 0 7-7h2a9 9 0 0 1-9 9zm8-8h-1a7 7 0 0 0-5.79-6.894l.17-.985l.172-.985C17.782 3.872 21 7.558 21 12z" />
  </svg>
);

export const languageIcon = (className = 'size-6') => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.5">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M5 5.828h2.7m3.3 0H9.5m-1.8 0h1.8m-1.8 0V5m1.8.828c-.316 1.131-.98 2.201-1.736 3.141M5.836 11a19 19 0 0 0 1.928-2.03m0 0c-.385-.453-.925-1.184-1.08-1.515m1.08 1.514l1.157 1.203M13.5 19l.833-2m4.167 2l-.833-2m-3.334 0L16 13l1.667 4m-3.334 0h3.334"
    />
    <path
      strokeLinecap="round"
      d="M14 10V8c0-2.828 0-4.243-.879-5.121C12.243 2 10.828 2 8 2s-4.243 0-5.121.879C2 3.757 2 5.172 2 8s0 4.243.879 5.121C3.757 14 5.172 14 8 14h2"
    />
    <path d="M10 16c0-2.828 0-4.243.879-5.121C11.757 10 13.172 10 16 10s4.243 0 5.121.879C22 11.757 22 13.172 22 16s0 4.243-.879 5.121C20.243 22 18.828 22 16 22s-4.243 0-5.121-.879C10 20.243 10 18.828 10 16Z" />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M4 16.5c0 1.404 0 2.107.337 2.611a2 2 0 0 0 .552.552C5.393 20 6.096 20 7.5 20M20 7.5c0-1.404 0-2.107-.337-2.611a2 2 0 0 0-.552-.552C18.607 4 17.904 4 16.5 4"
    />
  </svg>
);

export function Tip({text, children, open = false}: {text: string; children?: ReactNode; open?: boolean}) {
  return (
    <span className="vv-tip-host relative grid">
      {children}
      <span
        aria-hidden
        className={`vv-tip${open ? ' vv-tip-open' : ''} pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 rounded-[6px] border border-hairline bg-bg px-2 py-[5px] text-[11px] leading-none whitespace-nowrap text-fg`}
      >
        {text}
      </span>
    </span>
  );
}

export const TOOLS = [
  {
    id: 'cursor',
    label: $t("select"),
    tip: $t("hold-a-shot-to-preview"),
    icon: (className = 'size-6') => (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.5">
        <path d="M8.084 20.276c-1.06 1.38-3.264.66-3.306-1.079L4.443 5.392C4.407 3.932 6 3.012 7.247 3.773l11.788 7.192c1.485.906 1.006 3.176-.719 3.403l-5.581.738a1.84 1.84 0 0 0-1.221.705z" />
      </svg>
    ),
  },
  {
    id: 'zoom',
    label: $t("zoom"),
    tip: $t("click-a-shot-to-open-its"),
    icon: (className = 'size-6') => (
      <svg viewBox="0 0 24 24" className={className} fill="currentColor">
        <path d="M9.5 3A6.5 6.5 0 0 1 16 9.5c0 1.61-.59 3.09-1.56 4.23l.27.27h.79l5 5l-1.5 1.5l-5-5v-.79l-.27-.27A6.52 6.52 0 0 1 9.5 16A6.5 6.5 0 0 1 3 9.5A6.5 6.5 0 0 1 9.5 3m0 2C7 5 5 7 5 9.5S7 14 9.5 14S14 12 14 9.5S12 5 9.5 5" />
      </svg>
    ),
  },
  {
    id: 'hand',
    label: $t("pan"),
    tip: $t("drag-the-strip"),
    icon: (className = 'size-6') => (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5">
        <path d="M7.315 11.055v4.176m3.246-6.593V6.555c0-.892-.727-1.615-1.623-1.615s-1.623.723-1.623 1.615v3.747m3.246-.566V4.365a1.62 1.62 0 0 1 1.623-1.615c.897 0 1.623.723 1.623 1.615V9.73m0 .005v-3.18a1.624 1.624 0 0 1 3.246 0v2.19m0 0v.99m0-.99a1.62 1.62 0 0 1 1.624-1.615A1.62 1.62 0 0 1 20.3 8.745v5.935a6.57 6.57 0 0 1-6.57 6.57h-2.95a7.08 7.08 0 0 1-7.069-7.492l.015-.256a3.06 3.06 0 0 1 2.13-2.738l1.458-.462m0 0V11.4" />
      </svg>
    ),
  },
];
