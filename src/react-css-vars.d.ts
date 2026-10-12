import 'react';

// Allow CSS custom properties (e.g. `--i`, `--vv-marquee-copies`) in inline styles.
declare module 'react' {
  interface CSSProperties {
    [key: `--${string}`]: string | number | undefined;
  }
}
