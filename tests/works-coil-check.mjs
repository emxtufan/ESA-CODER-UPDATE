// Run with the local development server on port 5000; no content is modified.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {chromium} from 'playwright';
import sharp from 'sharp';

const data = JSON.parse(await readFile('source_data.json', 'utf8'));
const projects = data._collections.projects.filter(p => p.published !== false && p.homePosition);
const expected = projects.map(p => p.homeImage || p.image).sort();
const paddingColor = [219, 234, 254];
const source = await readFile('src/components/sections/Works.tsx', 'utf8');
const fragment = source.match(/const COIL_FRAGMENT_SOURCE = `([\s\S]*?)`;/)?.[1];
assert.ok(fragment);
const browser = await chromium.launch({headless: true});
try {
  const shaderPage = await browser.newPage({viewport: {width: 320, height: 180}});
  for (const size of [[16, 9], [4, 3], [9, 16]]) {
    await shaderPage.setContent('<body style="margin:0;background:white"><canvas width="320" height="180"></canvas>');
    const bounds = await shaderPage.evaluate(({fragment, size: [w, h]}) => {
      const gl = document.querySelector('canvas').getContext('webgl', {alpha: true, premultipliedAlpha: true, preserveDrawingBuffer: true});
      const program = gl.createProgram();
      for (const [type, source] of [[gl.VERTEX_SHADER, 'attribute vec2 position; varying vec2 vUv; void main(){ vUv=(position+1.0)*0.5; gl_Position=vec4(position,0.0,1.0); }'], [gl.FRAGMENT_SHADER, fragment]]) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw Error(gl.getShaderInfoLog(shader));
        gl.attachShader(program, shader);
      }
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw Error(gl.getProgramInfoLog(program));
      gl.useProgram(program);
      gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
      const position = gl.getAttribLocation(program, 'position');
      gl.enableVertexAttribArray(position);
      gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
      const pixels = new Uint8Array(w * h * 4);
      const colors = [[255,0,0,255], [0,255,0,255], [0,0,255,255], [255,255,0,255]];
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) pixels.set(colors[(y >= h / 2 ? 2 : 0) + (x >= w / 2 ? 1 : 0)], (y * w + x) * 4);
      gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.uniform2f(gl.getUniformLocation(program, 'planeSize'), 5, 5 * 9 / 16);
      gl.uniform1f(gl.getUniformLocation(program, 'borderRadius'), 0.2);
      gl.uniform1f(gl.getUniformLocation(program, 'opacity'), 1);
      gl.uniform1f(gl.getUniformLocation(program, 'imageAspect'), w / h);
      gl.enable(gl.BLEND);
      gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      const result = new Uint8Array(320 * 180 * 4);
      gl.readPixels(0, 0, 320, 180, gl.RGBA, gl.UNSIGNED_BYTE, result);
      let left = 320, right = 0, bottom = 180, top = 0;
      const seen = new Set();
      for (let y = 0; y < 180; y++) for (let x = 0; x < 320; x++) {
        const pixel = result.slice((y * 320 + x) * 4, (y * 320 + x) * 4 + 4);
        if (pixel[3] === 255 && Math.min(...pixel.slice(0, 3)) < 128) {
          left = Math.min(left, x); right = Math.max(right, x); bottom = Math.min(bottom, y); top = Math.max(top, y);
          seen.add(pixel.slice(0, 3).join(','));
        }
      }
      return {left, right, bottom, top, colors: seen.size};
    }, {fragment, size});
    assert.equal(bounds.colors, 4, 'All image corners remain visible');
    assert.ok(Math.abs((bounds.right - bounds.left + 1) / (bounds.top - bounds.bottom + 1) - size[0] / size[1]) < 0.02, 'Image retains its proportions');
    assert.ok(Math.min(bounds.left, 319 - bounds.right, bounds.bottom, 179 - bounds.top) >= 8, 'Light blue padding surrounds the image');
    const {data: screenshot, info} = await sharp(await shaderPage.screenshot()).removeAlpha().raw().toBuffer({resolveWithObject: true});
    const paddingSample = (Math.floor(info.height / 2) * info.width + 2) * 3;
    assert.deepEqual([...screenshot.subarray(paddingSample, paddingSample + 3)], paddingColor, 'Padding uses the chosen light blue');
    for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) {
      if (x < 6 || x >= info.width - 6 || y < 6 || y >= info.height - 6) {
        const pixel = screenshot.subarray((y * info.width + x) * 3, (y * info.width + x) * 3 + 3);
        assert.ok(pixel.every((channel, index) => channel >= paddingColor[index] - 1), 'Rounded outer edges have no gray outline');
      }
    }
  }
  await shaderPage.close();
  console.log('PASS shader: light blue padding, no stretching/cropping, no gray edge');
  const page = await browser.newPage({reducedMotion: 'reduce'});
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => {
    window.coilCheck = {planes: [], textures: [], heights: []};
    for (const prototype of [WebGLRenderingContext.prototype, WebGL2RenderingContext.prototype]) {
      const names = new WeakMap();
      const getUniformLocation = prototype.getUniformLocation;
      prototype.getUniformLocation = function(program, name) {
        const location = getUniformLocation.call(this, program, name);
        if (location) names.set(location, name);
        return location;
      };
      const uniform2f = prototype.uniform2f;
      prototype.uniform2f = function(location, x, y) {
        if (this.canvas.closest('#works') && names.get(location) === 'planeSize') window.coilCheck.planes.push([x, y]);
        return uniform2f.call(this, location, x, y);
      };
      const bufferData = prototype.bufferData;
      prototype.bufferData = function(...args) {
        const vertices = args[1];
        if (this.canvas.closest('#works') && vertices instanceof Float32Array && vertices.length === 17 * 65 * 3) {
          const heights = vertices.filter((_, index) => index % 3 === 1);
          window.coilCheck.heights.push(Math.max(...heights) - Math.min(...heights));
        }
        return bufferData.apply(this, args);
      };
      const texImage2D = prototype.texImage2D;
      prototype.texImage2D = function(...args) {
        const image = args.at(-1);
        if (this.canvas.closest('#works') && image instanceof HTMLImageElement) window.coilCheck.textures.push(new URL(image.src).pathname);
        return texImage2D.apply(this, args);
      };
    }
  });
  for (const width of [1440, 390]) {
    await page.setViewportSize({width, height: 900});
    await page.goto('http://localhost:5000');
    await page.locator('#boot').waitFor({state: 'hidden'});
    await page.locator('#works').evaluate(el => window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY + (el.offsetHeight - innerHeight) * 0.95));
    await page.waitForFunction(count => window.coilCheck.textures.length >= count, expected.length);
    const state = await page.evaluate(() => window.coilCheck);
    assert.deepEqual([...new Set(state.textures)].sort(), expected, 'Coil uses the configured original screenshots');
    for (const [w, h] of state.planes) assert.ok(Math.abs(w / h - 16 / 9) < 0.001, 'Texture frame is 16:9');
    assert.ok(state.planes.length > 0 && state.heights.length > 0, 'WebGL cards were created');
    assert.equal(await page.locator('#works .z-10 > canvas').evaluate(canvas => (canvas.getContext('webgl2') || canvas.getContext('webgl')).getContextAttributes().premultipliedAlpha), true, 'Browser compositing matches WebGL alpha blending');
    assert.ok(state.heights.every(height => Math.abs(height - state.planes[0][1]) < 0.001), 'Mesh and texture frame have the same height');
    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'));
    const hitHandle = await page.waitForFunction(() => {
      const canvas = document.querySelector('#works .z-10 > canvas');
      const box = canvas.getBoundingClientRect();
      for (let y = box.height * 0.25; y < box.height * 0.75; y += 20) {
        for (let x = box.width * 0.25; x < box.width * 0.75; x += 20) {
          canvas.dispatchEvent(new PointerEvent('pointermove', {clientX: box.x + x, clientY: box.y + y}));
          if (canvas.style.cursor === 'pointer' && document.elementFromPoint(box.x + x, box.y + y) === canvas) return {x: box.x + x, y: box.y + y};
        }
      }
      return null;
    });
    const hit = await hitHandle.jsonValue();
    assert.ok(hit, 'A visible card is clickable');
    await page.screenshot({path: path.join(os.tmpdir(), `esa-works-desktop-captures-${width}.png`)});
    await page.mouse.click(hit.x, hit.y);
    await page.waitForURL('**/works/*');
    assert.ok(projects.some(p => page.url().endsWith('/works/' + p.slug)), 'Click opens an existing project');
    console.log(`PASS ${width}px: original screenshots, 16:9 WebGL cards, project navigation`);
  }
  assert.deepEqual(errors, []);
} finally {
  await browser.close();
}
