/// <reference types="node" />
// Server rendering of a public URL (used by server/ssr.mjs): crawlers, link previews and
// visitors get the real page HTML at once; the browser then hydrates it.
// The page component is lazy: it is loaded first, so the render never suspends and the HTML
// reads top to bottom (no streamed, hidden blocks moved into place by scripts).
import {renderToString} from 'react-dom/server';
import App from '@/App';
import {notFound, resolveRoute} from '@/routes';

// React.lazy keeps its loader in _payload/_init; calling it throws the pending promise once.
async function preload(component: any) {
  try {
    component?._init?.(component._payload);
  } catch (pending: any) {
    if (typeof pending?.then === 'function') await pending;
  }
}

/** `data` is the current source_data.json, so texts edited in the admin show up immediately. */
export async function render(url: string, data: Record<string, any>): Promise<string> {
  (globalThis as any).__SSR_PATH__ = url;
  (globalThis as any).__SOURCE_DATA__ = data;
  await preload((resolveRoute(url) ?? notFound).page);
  return renderToString(<App />);
}
