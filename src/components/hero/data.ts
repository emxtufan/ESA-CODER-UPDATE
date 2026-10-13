// Sizes and image helpers of the hero project strip.
export const DESKTOP_SIZE = {
  desktop: { w: 700, h: 700 },
  mobile: { w: 400, h: Math.round(6400 / 9) },
};
export const MOBILE_SIZE = {
  desktop: { w: 430, h: 430 },
  mobile: { w: 232, h: Math.round(3712 / 9) },
};
export const DEFAULT_WIDTHS = [448, 828, 1440];

// Build a /_next/image srcSet from widths (only for optimizer URLs)
export function buildSrcSet(src: string, widths: number[] = DEFAULT_WIDTHS) {
  if (src.startsWith('/_next/image?'))
    return widths.map((w) => `${src.replace(/([?&])w=\d+/, `$1w=${w}`)} ${w}w`).join(', ');
}

export const MOBILE_WIDTHS = [448];

export function preloadImages(projects: any[], mode: string) {
  return Promise.all(
    projects
      .slice(0, 4)
      .map((p) => ('desktop' === mode ? p.desktop : p.mobile))
      .filter((src) => !!src)
      .map(
(src) =>
  new Promise<void>((resolve) => {
    const img = new Image();
    img.src = src;
    img.decode?.().then(
      () => resolve(),
      () => resolve(),
    ) ?? resolve();
  }),
      ),
  );
}

export const wait = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));
