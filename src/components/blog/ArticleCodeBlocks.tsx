// module 7338
import { useEffect } from 'react';

const COPY_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2"></rect><path d="M5 15V5a2 2 0 0 1 2-2h10"></path></svg>';

async function copyText(text: string) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {}
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.cssText = 'position:fixed;top:-1000px;opacity:0';
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand('copy');
    textarea.remove();
    return ok;
  } catch {
    return false;
  }
}

export default function ArticleCodeBlocks() {
  useEffect(() => {
    const article = document.querySelector('article.article');
    if (!article) return;
    const timers: any[] = [];
    const wrappers: HTMLElement[] = [];
    article.querySelectorAll('pre').forEach((pre) => {
      if (pre.parentElement?.classList.contains('vv-code')) return;
      const wrapper = document.createElement('div');
      wrapper.className = 'vv-code';
      pre.replaceWith(wrapper);
      wrapper.appendChild(pre);
      wrappers.push(wrapper);
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'vv-code-copy';
      button.innerHTML = COPY_ICON;
      button.title = 'Copy code';
      button.setAttribute('aria-label', 'Copy code to clipboard');
      button.addEventListener('click', async () => {
        const text = (pre.querySelector('code') ?? pre).textContent ?? '';
        const ok = await copyText(text);
        button.innerHTML = ok
          ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"></path></svg>'
          : COPY_ICON;
        button.dataset.done = ok ? 'true' : 'false';
        button.title = ok ? 'Copied' : 'Copy failed — press Ctrl+C';
        button.setAttribute('aria-label', ok ? 'Code copied to clipboard' : 'Copy failed');
        timers.push(
          setTimeout(() => {
            button.innerHTML = COPY_ICON;
            delete button.dataset.done;
            button.title = 'Copy code';
            button.setAttribute('aria-label', 'Copy code to clipboard');
          }, 1800),
        );
      });
      wrapper.appendChild(button);
    });
    return () => {
      timers.forEach(clearTimeout);
      wrappers.forEach((wrapper) => {
        const pre = wrapper.querySelector('pre');
        pre && wrapper.replaceWith(pre);
      });
    };
  }, []);
  return null;
}
