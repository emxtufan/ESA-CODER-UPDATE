// module 1659 (WebGL edge glow for the press & hold preview)
import {useEffect, useRef, useState} from 'react';

const FRAGMENT_SHADER = `
precision highp float;
uniform vec2  u_res;
uniform float u_time;
uniform float u_hover;    // 0..1 resting edge glow
uniform float u_fire;     // 0..1 walls closing in

void main(){
  float asp = u_res.x / u_res.y;
  vec2  p   = (gl_FragCoord.xy - 0.5 * u_res) / u_res.y;
  vec2  ext = vec2(0.5 * asp, 0.5);

  // signed distance to the viewport border, rounded at the corners
  float r  = 0.035;
  vec2  q  = abs(p) - (ext - vec2(r));
  float sd = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
  float depth = max(-sd, 0.0);          // how far in from the nearest edge

  // light drifting around the perimeter — integer harmonics keep it seamless
  float ang  = atan(p.y, p.x);
  float shim = 0.80 + 0.20 * sin(ang * 3.0 + u_time * 1.10)
                    + 0.12 * sin(ang * 5.0 - u_time * 0.80);

  vec3 BLUE = vec3(0.0, 0.600, 1.0);     // #0099FF
  vec3 CYAN = vec3(0.72, 0.90, 1.0);

  float band = exp(-depth / 0.085);      // soft inward falloff
  float hot  = exp(-depth / 0.020);      // bright line right on the edge
  float edge = (band * 0.70 + hot * 0.90) * u_hover * shim;

  float fireOn = step(0.0001, u_fire);
  float aa = 1.5 / u_res.y;

  float t   = u_fire;
  float s   = 1.0 - t;
  float rd  = smoothstep(0.30, 0.92, t);
  float R   = 0.45 * s;
  vec2  ap  = mix(ext * s, vec2(R), rd);
  float apr = min(mix(0.035, R, rd), min(ap.x, ap.y));

  vec2  aq   = abs(p) - ap + apr;
  float apSD = min(max(aq.x, aq.y), 0.0) + length(max(aq, 0.0)) - apr;

  float cover = smoothstep(-aa, aa, apSD) * fireOn;
  float wall  = exp(-abs(apSD) / 0.030) * fireOn;

  vec3 gcol = mix(BLUE, CYAN, hot);

  vec3 col = gcol * edge * (1.0 - cover);
  col += gcol * wall * (1.15 + u_fire * 1.5);

  float a = clamp(cover + edge * 0.90 + wall * 0.95, 0.0, 1.0);

  float done = smoothstep(0.93, 1.0, u_fire);
  col = mix(col, vec3(0.0), done);
  a   = mix(a, 1.0, done);

  gl_FragColor = vec4(col, a);
}`;

export default function EdgeGlow() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: WebGLRenderingContext | null = null;
    try {
      ctx = canvas.getContext('webgl', {
        alpha: true,
        premultipliedAlpha: false,
        antialias: false,
      });
    } catch {
      ctx = null;
    }
    if (!ctx) return;
    if (ctx.isContextLost()) {
      retry < 3 && queueMicrotask(() => setRetry((n) => n + 1));
      return;
    }
    const gl = ctx;
    const onContextLost = (ev: Event) => {
      ev.preventDefault();
      canvas.style.display = 'none';
      retry < 3 && queueMicrotask(() => setRetry((n) => n + 1));
    };
    canvas.addEventListener('webglcontextlost', onContextLost);
    const compile = (type: number, source: string) => {
      const shader = gl.createShader(type);
      return shader
        ? (gl.shaderSource(shader, source),
          gl.compileShader(shader),
          gl.getShaderParameter(shader, gl.COMPILE_STATUS) ? shader : null)
        : null;
    };
    const vertex = compile(
      gl.VERTEX_SHADER,
      'attribute vec2 a; void main(){ gl_Position = vec4(a, 0.0, 1.0); }',
    );
    const fragment = compile(gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    if (!vertex || !fragment) return;
    const program = gl.createProgram();
    if (
      !program ||
      (gl.attachShader(program, vertex),
      gl.attachShader(program, fragment),
      gl.linkProgram(program),
      !gl.getProgramParameter(program, gl.LINK_STATUS))
    )
      return;
    gl.useProgram(program);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const attrib = gl.getAttribLocation(program, 'a');
    gl.enableVertexAttribArray(attrib);
    gl.vertexAttribPointer(attrib, 2, gl.FLOAT, false, 0, 0);
    const uRes = gl.getUniformLocation(program, 'u_res');
    const uTime = gl.getUniformLocation(program, 'u_time');
    const uHover = gl.getUniformLocation(program, 'u_hover');
    const uFire = gl.getUniformLocation(program, 'u_fire');
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.floor(window.innerWidth * dpr);
      const h = Math.floor(window.innerHeight * dpr);
      (canvas.width !== w || canvas.height !== h) && ((canvas.width = w), (canvas.height = h));
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener('resize', resize);
    const start = performance.now();
    let raf = 0;
    const frame = (now: number) => {
      resize();
      const hover = Math.min((now - start) / 620, 1);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, now / 1e3);
      gl.uniform1f(uHover, hover);
      gl.uniform1f(uFire, 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('webglcontextlost', onContextLost);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
  }, [retry]);
  return <canvas key={retry} ref={canvasRef} className="pointer-events-none absolute inset-0 size-full" aria-hidden />;
}
