// Sizes and image helpers of the hero project strip.
import {mediaSrcSet} from '@/lib/media';

export const DESKTOP_SIZE = { w: 700, h: 700 * 9 / 16 };
export const SMALL_SIZE = { w: 430, h: 430 * 9 / 16 }; // cardul desktop pe ecran ≤639px
export const DEFAULT_WIDTHS = [448, 828, 1440];

export const buildSrcSet = (src: string, widths: number[] = DEFAULT_WIDTHS) => mediaSrcSet(src, widths);

export const wait = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));
