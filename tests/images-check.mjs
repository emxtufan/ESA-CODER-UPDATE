// node tests/images-check.mjs — server/images.mjs: WebP for browsers that take it, cache, 304, invalidation, fallbacks
import assert from 'node:assert/strict';
import {copyFileSync, mkdirSync, mkdtempSync, readdirSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import express from 'express';
import sharp from 'sharp';
import {imageOptimizer, MAX_EDGE} from '../server/images.mjs';

const dir = mkdtempSync(path.join(tmpdir(), 'vv-images-'));
const root = path.join(dir, 'public');
const cacheDir = path.join(dir, 'cache');
mkdirSync(path.join(root, 'media'), {recursive: true});
// real screenshots of the site: a 3.2 MB PNG and a 2.7 MB JPG
const media = path.resolve(import.meta.dirname, '../public/media');
copyFileSync(path.join(media, 'fa82d0ba7b07aeb6f52d002c58a4b803.png'), path.join(root, 'media/big.png'));
const otherShot = path.join(media, '24256474797948598af6e055ef03431e.jpg');
writeFileSync(path.join(root, 'media/tiny.png'), await sharp({create: {width: 8, height: 8, channels: 3, background: '#f00'}}).png().toBuffer());

const app = express();
app.use(imageOptimizer({root, cacheDir}));
app.use(express.static(root));
const server = app.listen(0);
const url = (p) => `http://127.0.0.1:${server.address().port}${p}`;
const WEBP = {accept: 'image/avif,image/webp,*/*'};

let r = await fetch(url('/media/big.png'), {headers: WEBP});
let body = Buffer.from(await r.arrayBuffer());
assert.ok(body.length < 3266301 / 5, `WebP much lighter (${body.length} bytes)`);
assert.equal(r.headers.get('content-type'), 'image/webp');
assert.match(r.headers.get('vary') ?? '', /Accept/);
const meta = await sharp(body).metadata();
assert.equal(meta.format, 'webp');
assert.equal(Math.max(meta.width, meta.height), MAX_EDGE);
const etag = r.headers.get('etag');
assert.equal(readdirSync(cacheDir).length, 1, 'one cached variant');

r = await fetch(url('/media/big.png'), {headers: {...WEBP, 'if-none-match': etag}});
assert.equal(r.status, 304);

r = await fetch(url('/media/big.png'), {headers: {accept: 'image/png,*/*'}});
assert.equal(r.headers.get('content-type'), 'image/png', 'no WebP support → original');

r = await fetch(url('/media/tiny.png'), {headers: WEBP});
assert.equal(r.headers.get('content-type'), 'image/png', 'small file → original');

r = await fetch(url('/media/../../etc/passwd.png'), {headers: WEBP});
assert.notEqual(r.headers.get('content-type'), 'image/webp');

// replaced from the admin: a new variant, a new ETag
await new Promise((ok) => setTimeout(ok, 20));
writeFileSync(path.join(root, 'media/big.png'), await sharp(otherShot).png().toBuffer());
r = await fetch(url('/media/big.png'), {headers: {...WEBP, 'if-none-match': etag}});
assert.equal(r.status, 200);
assert.notEqual(r.headers.get('etag'), etag);
assert.equal((await sharp(Buffer.from(await r.arrayBuffer())).metadata()).width, MAX_EDGE);

server.close();
console.log('images: ok');
