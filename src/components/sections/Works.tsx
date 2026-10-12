// module 3572
import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import Link from '@/components/Link';
import RollText from '@/components/RollText';
import { ShaderCanvas } from '@/components/ShaderCanvas';
import { useRouter } from '@/lib/navigation';

import {text} from '@/lib/text';

const $t = text("components/sections/Works");

const CARD_ASPECT = 30 / 14;

// Coil (curved pole of cards) vertex shader
const COIL_VERTEX_SOURCE = `
  precision highp float;
  attribute vec3 position;
  attribute vec2 uv;
  uniform mat4 modelMatrix;
  uniform mat4 viewMatrix;
  uniform mat4 projectionMatrix;
  uniform float poleFlare;
  uniform float wind;
  varying vec2 vUv;

  void main() {
    vUv = uv;
    vec4 worldPos = modelMatrix * vec4(position, 1.0);

    // Bend the pole outward toward its ends: the trumpet flare.
    float yDist = worldPos.y;
    vec2 outward = normalize(worldPos.xz);
    float expansion = (yDist * yDist) * poleFlare;
    worldPos.xz += outward * expansion;

    // Wind: inertial flutter from scroll velocity.
    float windFlutter = sin(vUv.x * 3.1415) * wind * 30.0;
    worldPos.y -= windFlutter;
    worldPos.xz -= outward * (vUv.y - 0.5) * wind * 20.0;

    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const COIL_FRAGMENT_SOURCE = `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D map;
  uniform vec2 planeSize;
  uniform float borderRadius;
  uniform float opacity;
  uniform float imageAspect;

  void main() {
    vec2 px = vUv * planeSize;
    vec2 halfSize = planeSize * 0.5;

    // SDF for crisp rounded corners on the curved surface.
    vec2 d = abs(px - halfSize) - halfSize + vec2(borderRadius);
    float dist = length(max(d, 0.0)) - borderRadius;
    float edgeWidth = 0.02;
    float alpha = 1.0 - smoothstep(-edgeWidth, edgeWidth, dist);
    if (alpha < 0.01) discard;

    // object-fit: cover, hung from the top edge for taller artwork — the
    // same masthead-first crop every card on the site uses.
    float pa = planeSize.x / planeSize.y;
    vec2 tuv = vUv;
    if (imageAspect > pa) {
      tuv.x = 0.5 + (vUv.x - 0.5) * (pa / imageAspect);
    } else {
      tuv.y = 1.0 - (1.0 - vUv.y) * (imageAspect / pa);
    }

    // No colour management: the bytes from the file land in the framebuffer
    // untouched, as a DOM <img> would paint them.
    vec4 texColor = texture2D(map, tuv);
    gl_FragColor = vec4(texColor.rgb, texColor.a * alpha * opacity);
  }
`;

function perspectiveMatrix(fov: number, aspect: number, far: number, near: number) {
  const s = 1 / Math.tan((fov * Math.PI) / 360);
  const n = 1 / (far - near);
  const m = new Float32Array(16);
  m[0] = s / aspect;
  m[5] = s;
  m[10] = (near + far) * n;
  m[11] = -1;
  m[14] = 2 * near * far * n;
  return m;
}

function compileShader(gl: any, type: number, source: string) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw Error(`coil shader: ${log}`);
  }
  return shader;
}

function createCoil(canvas: HTMLCanvasElement, options: any) {
  const { items, progressRef } = options;
  const count = items.length;
  const gl: any =
    canvas.getContext('webgl2', {
      alpha: true,
      antialias: true,
      premultipliedAlpha: false,
    }) ??
    canvas.getContext('webgl', {
      alpha: true,
      antialias: true,
      premultipliedAlpha: false,
    });
  if (!gl) return { dispose: () => {} };
  const isWebGL2 =
    typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext;
  const program = gl.createProgram();
  gl.attachShader(program, compileShader(gl, gl.VERTEX_SHADER, COIL_VERTEX_SOURCE));
  gl.attachShader(program, compileShader(gl, gl.FRAGMENT_SHADER, COIL_FRAGMENT_SOURCE));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS))
    throw Error(`coil program: ${gl.getProgramInfoLog(program)}`);
  gl.useProgram(program);
  const attribs = {
    position: gl.getAttribLocation(program, 'position'),
    uv: gl.getAttribLocation(program, 'uv'),
  };
  const uniforms = {
    model: gl.getUniformLocation(program, 'modelMatrix'),
    view: gl.getUniformLocation(program, 'viewMatrix'),
    projection: gl.getUniformLocation(program, 'projectionMatrix'),
    poleFlare: gl.getUniformLocation(program, 'poleFlare'),
    wind: gl.getUniformLocation(program, 'wind'),
    map: gl.getUniformLocation(program, 'map'),
    planeSize: gl.getUniformLocation(program, 'planeSize'),
    borderRadius: gl.getUniformLocation(program, 'borderRadius'),
    opacity: gl.getUniformLocation(program, 'opacity'),
    imageAspect: gl.getUniformLocation(program, 'imageAspect'),
  };
  const geometry = (function () {
    const thetaStart = Math.PI / 2 - 0.3246753246753247;
    const positions: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];
    for (let row = 0; row <= 16; row++) {
      const v = row / 16;
      const y = -(3.75 * v) + 1.875;
      for (let col = 0; col <= 64; col++) {
        const u = col / 64;
        const theta = thetaStart + 0.6493506493506493 * u;
        positions.push(7.7 * Math.sin(theta), y, 7.7 * Math.cos(theta));
        uvs.push(u, 1 - v);
      }
    }
    for (let row = 0; row < 16; row++)
      for (let col = 0; col < 64; col++) {
        const a = 65 * row + col;
        const b = (row + 1) * 65 + col;
        const c = (row + 1) * 65 + col + 1;
        const d = 65 * row + col + 1;
        indices.push(a, b, d, b, c, d);
      }
    return {
      positions: new Float32Array(positions),
      uvs: new Float32Array(uvs),
      indices: new Uint16Array(indices),
      thetaStart,
      thetaEnd: thetaStart + 0.6493506493506493,
    };
  })();
  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, geometry.positions, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(attribs.position);
  gl.vertexAttribPointer(attribs.position, 3, gl.FLOAT, false, 0, 0);
  const uvBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, geometry.uvs, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(attribs.uv);
  gl.vertexAttribPointer(attribs.uv, 2, gl.FLOAT, false, 0, 0);
  const indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, geometry.indices, gl.STATIC_DRAW);
  const indexCount = geometry.indices.length;
  gl.uniform1f(uniforms.poleFlare, 0.028);
  gl.uniform2f(uniforms.planeSize, 5, 3.75);
  gl.uniform1f(uniforms.borderRadius, 0.2);
  gl.uniform1i(uniforms.map, 0);
  const viewMatrix = new Float32Array(16);
  viewMatrix[0] = viewMatrix[5] = viewMatrix[10] = viewMatrix[15] = 1;
  viewMatrix[14] = -22;
  gl.uniformMatrix4fv(uniforms.view, false, viewMatrix);
  gl.enable(gl.BLEND);
  gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  gl.disable(gl.CULL_FACE);
  gl.enable(gl.DEPTH_TEST);
  gl.clearColor(0, 0, 0, 0);
  const textures: any[] = Array(count).fill(null);
  const aspects = new Float32Array(count).fill(5 / 3.75);
  const fades = new Float32Array(count);
  const anisotropic = gl.getExtension('EXT_texture_filter_anisotropic');
  const images: HTMLImageElement[] = [];
  let alive = true;
  items.forEach((item: any, index: number) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.decoding = 'async';
    img.onload = () => {
      if (!alive) return;
      const texture = gl.createTexture();
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      const powerOfTwo = (img.width & (img.width - 1)) == 0 && (img.height & (img.height - 1)) == 0;
      if (isWebGL2 || powerOfTwo) {
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.generateMipmap(gl.TEXTURE_2D);
      } else {
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      }
      if (anisotropic) gl.texParameterf(gl.TEXTURE_2D, anisotropic.TEXTURE_MAX_ANISOTROPY_EXT, 8);
      textures[index] = texture;
      aspects[index] = img.width / img.height;
    };
    img.src = item.image;
    images.push(img);
  });
  let projection = perspectiveMatrix(45, 1, 0.1, 1e3);
  let width = 1;
  let height = 1;
  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = canvas.clientWidth || 1;
    height = canvas.clientHeight || 1;
    const w = Math.round(width * dpr);
    const h = Math.round(height * dpr);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    gl.viewport(0, 0, w, h);
    projection = perspectiveMatrix(45, width / height, 0.1, 1e3);
    gl.uniformMatrix4fv(uniforms.projection, false, projection);
  };
  resize();
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas);
  let progress = progressRef.current;
  let velocity = 0;
  let lastTime = performance.now();
  let frame = 0;
  let visible = true;
  const slots = Array.from({ length: 14 }, () => ({
    idx: 0,
    y: 0,
    u: 0,
    opacity: 0,
    active: false,
  }));
  const order = slots.map((_, index) => index);
  const modelMatrix = new Float32Array(16);
  const tick = (now: number) => {
    frame = visible ? requestAnimationFrame(tick) : 0;
    const delta = Math.min((now - lastTime) / 1e3, 0.1);
    lastTime = now;
    const ease = 1 - Math.exp(-6 * delta);
    const previous = progress;
    progress += (progressRef.current - progress) * ease;
    velocity = 0.8 * velocity + (progress - previous) * 0.2;
    for (let i = 0; i < count; i++)
      textures[i] && fades[i] < 1 && (fades[i] = Math.min(1, fades[i] + delta / 0.35));
    for (let i = 0; i < 14; i++) {
      const t = i / 14 + progress;
      const whole = Math.floor(t);
      const frac = t - whole;
      const idx = count ? (((7 - i + 14 * whole) % count) + count) % count : 0;
      let fade = 1;
      if (frac < 0.25) fade = frac / 0.25;
      else if (frac > 0.75) fade = (1 - frac) / 0.25;
      const slot = slots[i];
      slot.idx = idx;
      slot.opacity = Math.sin((Math.PI / 2) * fade) * (fades[idx] ?? 0);
      slot.y = (frac - 0.5) * CARD_ASPECT * 14;
      slot.u = frac * Math.PI * 3;
      slot.active = -Math.sin(slot.u) > 0.55 && slot.opacity > 0.5;
    }
    order.sort((a, b) => -Math.sin(slots[a].u) - -Math.sin(slots[b].u));
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.uniform1f(uniforms.wind, 0.5 * velocity);
    for (const slotIndex of order) {
      const slot = slots[slotIndex];
      const texture = textures[slot.idx];
      if (texture && !(slot.opacity <= 0.001)) {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.uniform1f(uniforms.imageAspect, aspects[slot.idx]);
        gl.uniform1f(uniforms.opacity, slot.opacity);
        gl.uniformMatrix4fv(
          uniforms.model,
          false,
          (function (m: Float32Array, y: number, angle: number) {
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);
            m.fill(0);
            m[0] = cos;
            m[2] = -sin;
            m[5] = 1;
            m[8] = sin;
            m[10] = cos;
            m[13] = y;
            m[15] = 1;
            return m;
          })(modelMatrix, slot.y, slot.u),
        );
        gl.drawElements(gl.TRIANGLES, indexCount, gl.UNSIGNED_SHORT, 0);
      }
    }
  };
  frame = requestAnimationFrame(tick);
  const intersectionObserver = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible && !frame) {
      lastTime = performance.now();
      frame = requestAnimationFrame(tick);
    }
  });
  intersectionObserver.observe(canvas);
  const corners = [
    [7.7 * Math.sin(geometry.thetaStart), 1.875, 7.7 * Math.cos(geometry.thetaStart)],
    [7.7 * Math.sin(geometry.thetaEnd), 1.875, 7.7 * Math.cos(geometry.thetaEnd)],
    [7.7 * Math.sin(geometry.thetaEnd), -1.875, 7.7 * Math.cos(geometry.thetaEnd)],
    [7.7 * Math.sin(geometry.thetaStart), -1.875, 7.7 * Math.cos(geometry.thetaStart)],
  ];
  const project = (corner: number[], y: number, angle: number) => {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const x = cos * corner[0] + sin * corner[2];
    const py = corner[1] + y;
    const z = -sin * corner[0] + cos * corner[2] - 22;
    const sx = projection[0] * x;
    const sy = projection[5] * py;
    const w = -z;
    return [((sx / w + 1) / 2) * width, ((1 - sy / w) / 2) * height];
  };
  const insidePolygon = (point: number[], polygon: number[][]) => {
    let sign = 0;
    for (let i = 0; i < polygon.length; i++) {
      const a = polygon[i];
      const b = polygon[(i + 1) % polygon.length];
      const cross = (b[0] - a[0]) * (point[1] - a[1]) - (b[1] - a[1]) * (point[0] - a[0]);
      const s = cross > 0 ? 1 : cross < 0 ? -1 : 0;
      if (0 !== s) {
        if (0 === sign) sign = s;
        else if (sign !== s) return false;
      }
    }
    return true;
  };
  const hitTest = (event: PointerEvent | MouseEvent) => {
    const rect = canvas.getBoundingClientRect();
    const point = [event.clientX - rect.left, event.clientY - rect.top];
    for (const slot of slots)
      if (
        slot.active &&
        insidePolygon(
          point,
          corners.map((corner) => project(corner, slot.y, slot.u)),
        )
      )
        return items[slot.idx];
    return null;
  };
  const onPointerMove = (event: PointerEvent) => {
    canvas.style.cursor = hitTest(event) ? 'pointer' : '';
  };
  const onClick = (event: MouseEvent) => {
    const hit = hitTest(event);
    if (hit) options.onOpen?.(hit);
  };
  const onPointerLeave = () => {
    canvas.style.cursor = '';
  };
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerleave', onPointerLeave);
  canvas.addEventListener('click', onClick);
  const onContextLost = (event: Event) => {
    event.preventDefault();
    frame && cancelAnimationFrame(frame);
    frame = 0;
  };
  canvas.addEventListener('webglcontextlost', onContextLost);
  return {
    dispose() {
      alive = false;
      frame && cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerleave', onPointerLeave);
      canvas.removeEventListener('click', onClick);
      canvas.removeEventListener('webglcontextlost', onContextLost);
      for (const img of images) img.src = '';
      for (const texture of textures) texture && gl.deleteTexture(texture);
      gl.deleteBuffer(positionBuffer);
      gl.deleteBuffer(uvBuffer);
      gl.deleteBuffer(indexBuffer);
      gl.deleteProgram(program);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    },
  };
}

function Coil({ items, progressRef }: { items: any[]; progressRef: any }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // The compiled next/navigation router is referentially stable; keep the
  // latest one in a ref so the stand-in router does not re-create the GL scene.
  const router = useRouter();
  const routerRef = useRef(router);
  routerRef.current = router;
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const coil = createCoil(canvas, {
      items,
      progressRef,
      onOpen: (item: any) => routerRef.current.push(`/works/${item.slug}`),
    });
    return () => coil.dispose();
  }, [items, progressRef]);
  return (
    <>
      <canvas ref={canvasRef} aria-hidden className="absolute inset-0 block h-full w-full" />
      <nav aria-label={$t("featured-work")} className="sr-only">
        <ul>
          {items.map((item) => (
            <li key={item.slug}>
              <a href={`/works/${item.slug}`}>{item.title}</a>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}

gsap.registerPlugin(ScrollTrigger, useGSAP);

const DARK_COLORS = [
  [0, 0, 0],
  [0, 0.36, 0.6],
  [0, 0.6, 1],
  [0.72, 0.96, 1],
];

const LIGHT_COLORS = [
  [1, 1, 1],
  [0.8, 0.925, 1],
  [0.239, 0.694, 1],
  [0, 0.6, 1],
];

// Mounts the coil once the section nears the viewport (idle-deferred).
function useNearViewport(rootMargin = '100% 0px'): [any, boolean] {
  const ref = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === 'undefined') return void setReady(true);
    let handle = 0;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        const fire = () => setReady(true);
        handle =
          typeof window.requestIdleCallback === 'function'
            ? window.requestIdleCallback(fire, { timeout: 500 })
            : window.setTimeout(fire, 50);
      },
      { rootMargin },
    );
    observer.observe(node);
    return () => {
      observer.disconnect();
      handle &&
        (typeof window.cancelIdleCallback === 'function'
          ? window.cancelIdleCallback(handle)
          : window.clearTimeout(handle));
    };
  }, [rootMargin]);
  return [ref, ready];
}

function useTheme() {
  const [theme, setTheme] = useState('dark');
  useEffect(() => {
    const update = () =>
      setTheme(document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark');
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
    return () => observer.disconnect();
  }, []);
  return theme;
}

export default function Works({ items }: { items: any[] }) {
  const sectionRef = useRef<HTMLElement>(null);
  const progressRef = useRef(0);
  const [showAll, setShowAll] = useState(false);
  const [coilRef, coilReady] = useNearViewport();
  const isLight = useTheme() === 'light';

  useGSAP(
    () => {
      const update = () => {
        setShowAll(progressRef.current > 0.8421428571428571);
      };
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: reduce)', () => {
        progressRef.current = 0.4;
        update();
      });
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const trigger = ScrollTrigger.create({
          trigger: sectionRef.current,
          start: 'top top',
          end: 'bottom bottom',
          scrub: true,
          onUpdate: (self) => {
            progressRef.current = self.progress;
            update();
          },
        });
        return () => trigger.kill();
      });
      return () => mm.revert();
    },
    { scope: sectionRef, dependencies: [items.length] },
  );

  return (
    <section id="works" ref={sectionRef} className="relative z-0 text-fg" style={{ marginTop: -820 }}>
      <div className="sticky top-0 h-screen overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <ShaderCanvas
            className="size-full"
            colors={isLight ? LIGHT_COLORS : DARK_COLORS}
            colorCount={4}
          />
        </div>
        <div className="absolute inset-0 z-0 grid place-items-center px-6 md:px-8">
          <h2
            className={`text-center font-display text-[clamp(56px,10vw,150px)] leading-[1] font-medium tracking-[-0.05em] transition-opacity duration-500 ease-brand ${showAll ? 'opacity-0' : 'opacity-100'}`}
          >
            {$t("our")}<span className="vv-accent">{$t("works")}</span>
          </h2>
        </div>
        <div ref={coilRef} className="absolute inset-0 z-10">
          {coilReady ? <Coil items={items} progressRef={progressRef} /> : null}
        </div>
        <span
          aria-hidden
          className={`pointer-events-none absolute inset-0 z-[15] transition-opacity duration-500 ease-brand ${isLight ? 'bg-white/75' : 'bg-black/70'} ${showAll ? 'opacity-100' : 'opacity-0'}`}
        />
        <div
          className={`absolute inset-0 z-20 grid place-items-center px-6 md:px-8 ${showAll ? '' : 'pointer-events-none'}`}
        >
          <Link
            href="/works"
            aria-hidden={!showAll}
            tabIndex={showAll ? undefined : -1}
            className={`transition-opacity duration-500 ease-brand ${showAll ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
          >
            <span className="inline-flex font-display text-[clamp(44px,7vw,104px)] leading-[1] font-medium tracking-[-0.05em]">
              <span className="vv-accent">
                <RollText text={$t("view-all")} />
              </span>
            </span>
          </Link>
        </div>
      </div>
      <div
        aria-hidden
        className="works-scroll-room"
        style={{ height: `${Math.round(120 + 30 * items.length)}vh` }}
      />
    </section>
  );
}
