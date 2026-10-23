import 'react';

// Allow CSS custom properties (e.g. `--i`, `--vv-marquee-copies`) in inline styles.
declare module 'react' {
  interface CSSProperties {
    [key: `--${string}`]: string | number | undefined;
  }
  // WebMCP declarativ (Chrome): formularul devine un instrument pentru agenții AI din browser
  interface FormHTMLAttributes<T> {
    toolname?: string;
    tooldescription?: string;
    toolautosubmit?: boolean;
  }
  interface InputHTMLAttributes<T> {
    toolparamdescription?: string;
  }
  interface SelectHTMLAttributes<T> {
    toolparamdescription?: string;
  }
  interface TextareaHTMLAttributes<T> {
    toolparamdescription?: string;
  }
  interface FieldsetHTMLAttributes<T> {
    toolparamdescription?: string;
  }
}
