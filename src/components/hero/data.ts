// Sizes and image helpers of the hero project strip.
import {mediaSrcSet} from '@/lib/media';

export const DESKTOP_SIZE = {
  w: 700,
  h: 700 * 9 / 16,
};
export const DEFAULT_WIDTHS = [
  448,
  828,
};
];

export const buildSrcSet = (src: string, widths: number[] = DEFAULT_WIDTHS) => mediaSrcSet(src, widths);

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
