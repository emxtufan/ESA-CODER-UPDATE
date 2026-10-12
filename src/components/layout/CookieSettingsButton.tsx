import {text} from '@/lib/text';

const $t = text("components/layout/CookieSettingsButton");
// module 1203
export default function CookieSettingsButton({className}: {className?: string}) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event('vv:consent-open'))}
      className={
        className ??
        'text-caption text-fg-dim underline decoration-fg/20 underline-offset-4 transition-colors hover:text-fg-muted'
      }
    >
      {$t("cookies")}
    </button>
  );
}
