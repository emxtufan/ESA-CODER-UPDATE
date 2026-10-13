// Serves lighter images without touching a single URL of the site: a request for /media/x.png (or any jpg/png/webp
// the site serves) from a browser that accepts WebP gets a WebP capped at MAX_EDGE px, made once with sharp and kept
// in a disk cache. The cache key holds the source's size and mtime, so an image replaced from the admin is redone
// on its next request. Browsers without WebP, and images that would not get smaller, get the original file.
import {createHash} from 'node:crypto';
import {createReadStream, existsSync} from 'node:fs';
import {mkdir, readFile, rename, stat, writeFile} from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

export const MAX_EDGE = 1600;
const QUALITY = 78;
const MIN_BYTES = 40 * 1024; // smaller files are not worth a second encode
const RASTER_RE = /\.(jpe?g|png|webp)$/i;

/** One pipeline for every image: EXIF orientation applied, long side capped, WebP, metadata stripped. Null = keep the original. */
export async function optimize(input) {
  const image = sharp(input, {failOn: 'none', animated: false});
  const meta = await image.metadata();
  if ((meta.pages ?? 1) > 1) return null; // animated
  const out = await image
    .rotate()
    .resize({width: MAX_EDGE, height: MAX_EDGE, fit: 'inside', withoutEnlargement: true})
    .webp({quality: QUALITY, effort: 4})
    .toBuffer();
  return out.length < input.length * 0.9 ? out : null;
}

/** Express middleware. `root`: the folder the site's files are served from; `cacheDir`: where the WebP copies go. */
export function imageOptimizer({root, cacheDir}) {
  const pending = new Map();
  const variantOf = async (file, st) => {
    const key = createHash('sha1').update(`${file}|${st.size}|${st.mtimeMs}|${MAX_EDGE}|${QUALITY}`).digest('hex');
    const cached = path.join(cacheDir, key.slice(0, 2), `${key}.webp`);
    const skip = `${cached}.skip`; // remembers "the original is already the lighter one"
    if (existsSync(cached)) return {file: cached, key};
    if (existsSync(skip)) return null;
    if (!pending.has(key)) {
      pending.set(key, (async () => {
        const out = await optimize(await readFile(file));
        await mkdir(path.dirname(cached), {recursive: true});
        const tmp = `${out ? cached : skip}.${process.pid}.tmp`;
        await writeFile(tmp, out ?? '');
        await rename(tmp, out ? cached : skip);
        return out ? {file: cached, key} : null;
      })().finally(() => pending.delete(key)));
    }
    return pending.get(key);
  };

  return async (req, res, next) => {
    if ((req.method !== 'GET' && req.method !== 'HEAD') || !RASTER_RE.test(req.path) || !/image\/webp/.test(req.get('accept') || '')) return next();
    let file;
    try {
      file = path.join(root, decodeURIComponent(req.path));
    } catch {
      return next();
    }
    if (!file.startsWith(root + path.sep)) return next();
    try {
      const st = await stat(file);
      if (!st.isFile() || st.size < MIN_BYTES) return next();
      const variant = await variantOf(file, st);
      res.vary('Accept');
      if (!variant) return next();
      const etag = `"w-${variant.key.slice(0, 20)}"`;
      // revalidated like the originals (they can be replaced from the admin), cheap thanks to the ETag
      res.set({'Content-Type': 'image/webp', 'Cache-Control': 'no-cache', ETag: etag});
      const match = (req.get('if-none-match') || '').split(',').map((t) => t.trim().replace(/^W\//, ''));
      if (match.includes(etag)) return res.status(304).end();
      if (req.method === 'HEAD') return res.end();
      createReadStream(variant.file).on('error', next).pipe(res);
    } catch (err) {
      if (err?.code !== 'ENOENT') console.error('[images]', req.path, err.message);
      next();
    }
  };
}
