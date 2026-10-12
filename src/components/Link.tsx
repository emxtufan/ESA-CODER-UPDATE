import type {AnchorHTMLAttributes, MouseEvent} from 'react';
import {router} from '@/lib/navigation';

// Stand-in for next/link: a plain anchor that navigates client-side for
// same-origin links (PageTransition usually intercepts first, in the capture phase).
type Props = AnchorHTMLAttributes<HTMLAnchorElement> & {prefetch?: boolean; scroll?: boolean; replace?: boolean};

export default function Link({prefetch: _p, scroll: _s, replace, onClick, ...props}: Props) {
  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (props.target && props.target !== '_self') return;
    const href = props.href;
    if (!href || /^(mailto:|tel:|#)/i.test(href)) return;
    const url = new URL(href, window.location.href);
    if (url.origin !== window.location.origin) return;
    if (url.pathname === window.location.pathname && url.hash) return;
    e.preventDefault();
    if (replace) router.replace(href);
    else router.push(href);
  };
  return <a {...props} onClick={handleClick} />;
}
