// module 1659 (press & hold full-page preview)
import {useEffect, useSyncExternalStore} from 'react';
import {createPortal} from 'react-dom';
import {lockScroll, unlockScroll} from '@/lib/scrollLock';
import EdgeGlow from './EdgeGlow';

const subscribePortrait = (cb: () => void) => {
  const mq = window.matchMedia('(orientation: portrait)');
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
};
const getPortrait = () => window.matchMedia('(orientation: portrait)').matches;

export default function PreviewPortal({target}: {target: any}) {
  const portrait = useSyncExternalStore(subscribePortrait, getPortrait, () => false);
  useEffect(() => {
    if (target) {
      lockScroll();
      return unlockScroll;
    }
  }, [target]);
  return typeof document === 'undefined' || !target
    ? null
    : createPortal(
        <div className="pointer-events-none fixed inset-0 z-[200] overflow-hidden" role="dialog" aria-label={`Preview of ${target.title}`}>
          <div className="absolute inset-0 bg-black/78 backdrop-blur-[7px]" />
          <img
            src={portrait ? (target.mobile ?? target.desktop) : target.desktop}
            alt={target.title}
            className="absolute inset-x-0 top-0 w-full select-none"
            draggable={false}
            style={{WebkitTouchCallout: 'none'} as any}
            onContextMenu={(ev) => ev.preventDefault()}
          />
          <div aria-hidden className="absolute inset-0" style={{boxShadow: 'inset 0 0 200px 40px rgba(0, 0, 0, 0.55)'}} />
          <EdgeGlow />
        </div>,
        document.body,
      );
}
