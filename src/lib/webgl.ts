// module 6635
// Minimal WebGL globe renderer (a "cobe"-style library) plus its shader helpers.
//
// Exports:
//   createGlobe(canvas, options) -> { update(options), destroy() }   (compiled export `A`)
//     Renders a dotted globe with optional markers/arcs. `update` accepts the same
//     option keys (phi, theta, width, height, markers, arcs, colors, ...) and redraws.
//   compileShader / createProgram / getUniformLocations / getAttribLocations (internal helpers, exported)
//   locationToVector([lat, lng]) -> [x, y, z] on the unit sphere.

export function compileShader(gl: any, type: number, source: string) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
  gl.deleteShader(shader);
  return null;
}

export function createProgram(gl: any, vertexSource: string, fragmentSource: string) {
  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
  if (!vertexShader || !fragmentShader) return null;
  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  if (gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    return program;
  }
  gl.deleteProgram(program);
  return null;
}

export function getUniformLocations(gl: any, program: any, names: string[]) {
  const locations: Record<string, any> = {};
  for (const name of names) locations[name] = gl.getUniformLocation(program, name);
  return locations;
}

export function getAttribLocations(gl: any, program: any, names: string[]) {
  const locations: Record<string, number> = {};
  for (const name of names) locations[name] = gl.getAttribLocation(program, name);
  return locations;
}

const { PI, sin, cos } = Math;

// [latitude, longitude] in degrees -> point on the unit sphere
export function locationToVector([lat, lng]: [number, number]) {
  const latRad = (lat * PI) / 180;
  const lngRad = (lng * PI) / 180 - PI;
  const cosLat = cos(latRad);
  return [-cosLat * cos(lngRad), sin(latRad), cosLat * sin(lngRad)];
}

export const createGlobe = (canvas: HTMLCanvasElement, options: any) => {
  const contextAttributes = {
    alpha: true,
    stencil: false,
    antialias: true,
    depth: false,
    preserveDrawingBuffer: false,
    ...options.context,
  };
  let gl: any = canvas.getContext('webgl2', contextAttributes);
  const isWebGL2 = !!gl;
  if (!gl) gl = canvas.getContext('webgl', contextAttributes);
  if (!gl) return { destroy: () => {}, update: (_options?: any) => {} };
  const instancingExt = isWebGL2 ? null : gl.getExtension('ANGLE_instanced_arrays');
  const dpr = options.devicePixelRatio || 1;
  canvas.width = options.width * dpr;
  canvas.height = options.height * dpr;

  let phi = options.phi || 0;
  let theta = options.theta || 0;
  let markers = options.markers || [];
  let arcs = options.arcs || [];
  let mapSamples = options.mapSamples || 1e4;
  let mapBrightness = options.mapBrightness || 1;
  let mapBaseBrightness = options.mapBaseBrightness || 0;
  let baseColor = options.baseColor || [1, 1, 1];
  let markerColor = options.markerColor || [1, 0.5, 0];
  let glowColor = options.glowColor || [1, 1, 1];
  let arcColor = options.arcColor || [0.3, 0.6, 1];
  let arcWidth = options.arcWidth ?? 1;
  let arcHeight = options.arcHeight ?? 0.2;
  let diffuse = options.diffuse || 1;
  let dark = options.dark || 0;
  let opacity = options.opacity ?? 1;
  let offset = options.offset || [0, 0];
  let scale = options.scale || 1;
  let markerElevation = options.markerElevation ?? 0.05;

  const globeProgram = createProgram(
    gl,
    'attribute vec2 a;void main(){gl_Position=vec4(a,0,1);}',
    'precision highp float;uniform vec2 t,v,s;uniform vec3 F,w;uniform vec4 n;uniform float k,x,y;uniform sampler2D z;float u;mat3 A(float a,float b){float c=cos(a),d=cos(b),e=sin(a),f=sin(b);return mat3(d,f*e,-f*c,0,c,e,f,d*-e,d*c);}vec3 B(vec3 c,out float G){c=c.xzy;float q=max(2.,floor(log2(2.236068*k*3.141593*(1.-c.z*c.z))*.72021));vec2 g=floor(pow(1.618034,q)/2.236068*vec2(1,1.618034)+.5),d=fract((g+1.)*.618034)*6.283185-3.883222,e=-2.*g,f=vec2(atan(c.y,c.x),c.z-1.),r=floor(vec2(e.y*f.x-d.y*(f.y*k+1.),-e.x*f.x+d.x*(f.y*k+1.))/(d.x*e.y-e.x*d.y));float o=3.141593;vec3 C;for(float h=0.;h<4.;h+=1.){vec2 D=vec2(mod(h,2.),floor(h*.5));float j=dot(g,r+D);if(j>k)continue;float a=j,b=0.;a>=16384.?(a-=16384.,b+=.868872):0.,a>=8192.?(a-=8192.,b+=.934436):0.,a>=4096.?(a-=4096.,b+=.467218):0.,a>=2048.?(a-=2048.,b+=.733609):0.,a>=1024.?(a-=1024.,b+=.866804):0.,a>=512.?(a-=512.,b+=.433402):0.,a>=256.?(a-=256.,b+=.216701):0.,a>=128.?(a-=128.,b+=.108351):0.,a>=64.?(a-=64.,b+=.554175):0.,a>=32.?(a-=32.,b+=.777088):0.,a>=16.?(a-=16.,b+=.888544):0.,a>=8.?(a-=8.,b+=.944272):0.,a>=4.?(a-=4.,b+=.472136):0.,a>=2.?(a-=2.,b+=.236068):0.,a>=1.?(a-=1.,b+=.618034):0.;float l=fract(b)*6.283185,i=1.-2.*j*u,m=sqrt(1.-i*i);vec3 p=vec3(cos(l)*m,sin(l)*m,i);float E=length(c-p);if(E<o)o=E,C=p;}G=o;return C.xzy;}void main(){u=1./k;vec2 c=1./t,b=(gl_FragCoord.xy*c*2.-1.)/x-v*vec2(1,-1)*c;b.x*=t.x*c.y;float a=dot(b,b),f=0.;vec4 l=vec4(0);if(a<=.64){float g;vec4 m=vec4(0);vec3 h=normalize(vec3(b,sqrt(.64-a)));mat3 o=A(s.y,s.x);float i=h.z;vec3 d=B(h*o,g);float j=asin(d.y),e=acos(-d.x/cos(j));e=d.z<0.?-e:e;float p=max(texture2D(z,vec2(e*.5/3.141593,-(j/3.141593+.5))).x,y),q=p*smoothstep(8e-3,0.,g)*pow(i,n.y)*n.x;m+=vec4(F*(mix((1.-q)*pow(i,.4),q,n.z)+.1)+pow(1.-i,4.)*w,1),l+=m*(1.+n.w)*.5,f=(1.-a)*(1.-a)*smoothstep(0.,1.,.2/(a-.64));}else{float r=sqrt(.2/(a-.64));f=smoothstep(.5,1.,r/(r+1.));}gl_FragColor=l+vec4(f*w,f);}',
  );
  const markerProgram = createProgram(
    gl,
    'varying vec2 m;varying vec3 g;varying float h;attribute vec2 n;attribute vec3 p,w;attribute float q,x;uniform vec2 b,r;uniform float i,j,k,s;void main(){float c=cos(j),d=sin(j),e=cos(i),f=sin(i);vec3 a=p*(.8+s),l=vec3(e*a.x+f*a.z,f*d*a.x+c*a.y-e*d*a.z,-f*c*a.x+d*a.y+e*c*a.z);if(l.z<0.&&length(l.xy)<.8){gl_Position=vec4(2,2,0,1);return;}float t=b.y/b.x;vec2 y=(l.xy+n*q*2.)*vec2(t,1)*k+r*vec2(1,-1)*k/b;gl_Position=vec4(y,0,1),m=n,g=w,h=x;}',
    'precision highp float;varying vec2 m;varying vec3 g;varying float h;uniform vec3 v;void main(){if(length(m)>.25)discard;vec3 a=h>.5?g:v;gl_FragColor=vec4(a,1);}',
  );
  const arcProgram = createProgram(
    gl,
    'varying vec3 i;varying float j,s,t;attribute vec2 k;attribute vec3 l,m,N;attribute float v,w,O;uniform vec2 g,x;uniform float y,z,h,A;mat3 B(float a,float b){float c=cos(a),d=cos(b),e=sin(a),f=sin(b);return mat3(d,f*e,-f*c,0,c,e,f,d*-e,d*c);}vec3 C(vec3 c,vec3 d,vec3 e,float a){float b=1.-a;return b*b*c+2.*b*a*d+a*a*e;}vec3 D(vec3 c,vec3 b,vec3 d,float a){float e=1.-a;return 2.*e*(b-c)+2.*a*(d-b);}void main(){mat3 b=B(z,y);float c=.8+A;vec3 d=l*c,e=m*c,f=l+m;float n=length(f);vec3 E=n>1e-3?f/n:vec3(0,1,0),o=E*(.8+v);float p=k.x;vec3 F=C(d,o,e,p),q=b*F,G=D(d,o,e,p),H=b*G;vec2 a=H.xy;float r=length(a);vec2 I=r>1e-3?vec2(-a.y,a.x)/r:vec2(1,0);float J=g.x/g.y;vec2 K=q.xy*vec2(1./J,1)*h+x*vec2(1,-1)*h/g,P=K+I*w*k.y*h;gl_Position=vec4(P,0,1),i=N,j=O,s=q.z,t=length(q.xy);}',
    'precision highp float;varying vec3 i;varying float j,s,t;uniform vec3 M;void main(){if(s<0.&&t<.8)discard;vec3 a=j>.5?i:M;gl_FragColor=vec4(a,1);}',
  );
  if (!globeProgram) return { destroy: () => {}, update: (_options?: any) => {} };

  // full-screen quad (two triangles)
  const quadBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
    gl.STATIC_DRAW,
  );
  // triangle strip used for the arc ribbons
  const arcStripBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, arcStripBuffer);
  const arcStrip: number[] = [];
  for (let step = 0; step <= 32; step++) {
    const t = step / 32;
    arcStrip.push(t, -1, t, 1);
  }
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(arcStrip), gl.STATIC_DRAW);
  const markerBuffer = gl.createBuffer();
  const arcBuffer = gl.createBuffer();
  const globeUniforms = getUniformLocations(gl, globeProgram, ['t', 's', 'k', 'x', 'v', 'F', 'w', 'n', 'y', 'z']);
  const markerUniforms = getUniformLocations(gl, markerProgram, ['i', 'j', 'b', 'k', 'r', 'v', 's']);
  const markerAttribs = getAttribLocations(gl, markerProgram, ['n', 'p', 'q', 'w', 'x']);
  const arcUniforms = getUniformLocations(gl, arcProgram, ['y', 'z', 'g', 'h', 'x', 'M', 'A']);
  const arcAttribs = getAttribLocations(gl, arcProgram, ['k', 'l', 'm', 'v', 'w', 'N', 'O']);
  const quadAttrib = gl.getAttribLocation(globeProgram, 'a');

  // world-map texture (1x1 placeholder until the image has loaded)
  const mapTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, mapTexture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 1, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0]));
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  const mapImage = new Image();
  mapImage.onload = () => {
    gl.bindTexture(gl.TEXTURE_2D, mapTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, mapImage);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, mapTexture);
  };
  mapImage.src =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAACAAQAAAADMzoqnAAAECklEQVR42u3VsW4jRRzH8d94gzfF4Q0VQaC4vBLTRTp0mze4ggfAPAE5XQEFsGNAVIjwBrmW7h7gJE+giKjyABTZE4g06LKJETdRJvtD65kdz6yduKABiW+TVfzRf2bXYxtcE/59YJCz6YdbgQF6ACSRrwYKYImmh5PbwOewlV3wlQNbAN6SEExjUOO+BU0aCSnxReHABUlK4YFQeJeUT3da8IIkZ6NGoSnFY5KsMoVzMKfECUnqxgPYRArarmUCndHwzIEaQEpg5xVdBXROl8mpAQx5dUgPiHoYAAkg5w3JABR06byGAVgcRGAz5bznj6phBQNRFwyqgdxebH6gshJAesWoFhgYpApAFoG8BIZ/fEhSox5jDjQXmV0Ar5XJfAIrALi3URVs09gHIL4XJCkLC5LH9JWiArABFCSrQjdgkBzRJ0WJeUOSNyQAfJJwUSWUBRlJQ8oGHATACGlBynnzy2kEYLNjrxouigD8BZcgOeVPqh12RtufaCN5wCPVDpvQ9lsIrqndsJtDcWqBCpf4hWN7OdWHBw58FwIaNOU/n1TpMW2DFaD48cmr4185T8NHkpUFX749pQPVdgRKC/DGoQPVeAEKv+WHvY8OOWNTPRp5kHuwSf8wzXtVBKR7YwEH9H3lQUaypUfSATOALyVNu5vZJW31Bnx98nkLfDUWJaz6ixvm+RIQRdl3kmRxxiaDoGnZW4CpPfkaQadlcPim1xOSvETQo7Lv75enVAXJ3xGUlony4KQBBWUM1NiDc6qhyS8RgQs18OCMMtPDaAUIyg0PZkRWDqs+wnKJBTDI1Js6BolegOsKmUxNDBAAKqQyMQmidhegBlLZ+wwKYdv5M/8x1khkb1cgKqP2H+MKyV5vS+whrE8DQDgAlUAoRBX056EElJCjJVACeJBZgNfVp+iCCm4RBWCgKsRxASSA9KgDhDtCiTuMyfHsKXzhC6wNAIjjWb8LKAOA2ctk3FmCOlgKFy8f1N0JJtgsxinYnVAHt4t3gPzZXSCTyCWCQmBT91QE3B5yarSN40dNHYPka4TlDhTUI8zLvl0JSL3vZn6DsCFZOeB2yROEpR68sECQQA++xIGCR2X7DwlEoLRgUrZrqlUg50S1uy43YqDcN6UFBVkhAjWiCV2Q0jgQPdplMKxvBXodcOfAwJYvgdL+1etA1YJJfBcZlQV7sO1i2gHoNiyxtQ5sBsCgWyoxCHiFFd2L5nUTCqMAqGUgsQ9f5kCcCiZgRYkMgMTd5WsB1rTzj0Em14BE4r+QxN1lCEsVur2PoF5Wbg8RJXR4djgvBgauhLywoEZQrt1KKRdVS4CdlJ8qafyP+9KIj/nE/d7kKwH9jgS72e9DV+kvfTWgct4ZyP8Byb8BPG7MaaIIkAQAAAAASUVORK5CYII=';
  let arcCount = 0;

  // projects a rotated sphere point to [x, y] in 0..1 canvas space, plus visibility
  function project(point: number[]) {
    const cosTheta = Math.cos(theta);
    const cosPhi = Math.cos(phi);
    const sinTheta = Math.sin(theta);
    const sinPhi = Math.sin(phi);
    const x = cosPhi * point[0] + sinPhi * point[2];
    const y = sinPhi * sinTheta * point[0] + cosTheta * point[1] - cosPhi * sinTheta * point[2];
    return [
      ((x / (canvas.width / canvas.height)) * scale + (offset[0] * scale * dpr) / canvas.width + 1) / 2,
      (-y * scale + (offset[1] * scale * dpr) / canvas.height + 1) / 2,
      -sinPhi * cosTheta * point[0] + sinTheta * point[1] + cosPhi * cosTheta * point[2] >= 0 ||
        x * x + y * y >= 0.64,
    ];
  }

  function projectMarker(marker: [number, number]) {
    const vec = locationToVector(marker);
    const radius = 0.8 + markerElevation;
    const result = project([vec[0] * radius, vec[1] * radius, vec[2] * radius]);
    return { x: result[0], y: result[1], visible: result[2] };
  }

  function projectArc(arc: any) {
    const from = locationToVector(arc.from);
    const to = locationToVector(arc.to);
    const sum = [from[0] + to[0], from[1] + to[1], from[2] + to[2]];
    const length = (sum[0] ** 2 + sum[1] ** 2 + sum[2] ** 2) ** 0.5;
    if (length < 0.001) return null;
    const factor = 0.25 * (0.8 + markerElevation) + (0.5 * (0.8 + arcHeight + markerElevation)) / length;
    const result = project([sum[0] * factor, sum[1] * factor, sum[2] * factor]);
    return { x: result[0], y: result[1], visible: result[2] };
  }

  function setupInstancedAttrib(location: number, size: number, stride: number, byteOffset: number, divisor: number) {
    if (location < 0) return;
    gl.enableVertexAttribArray(location);
    gl.vertexAttribPointer(location, size, gl.FLOAT, false, stride, byteOffset);
    if (isWebGL2) gl.vertexAttribDivisor(location, divisor);
    else if (instancingExt) instancingExt.vertexAttribDivisorANGLE(location, divisor);
  }

  let undef: any; // `undefined`, used to detect which options were passed to update()

  // wrapper div + hidden anchor elements (CSS anchor positioning for markers/arcs)
  const container = document.createElement('div');
  container.style.cssText = 'position:relative;width:100%;height:100%';
  canvas.parentElement?.insertBefore(container, canvas);
  container.append(canvas);

  const anchors = (function (root: HTMLElement) {
    const markerEls: Record<string, HTMLElement> = {};
    const arcEls: Record<string, HTMLElement> = {};
    const visibleVars: Record<string, string> = {};
    const styleEl = document.createElement('style');
    function place(store: Record<string, HTMLElement>, id: string, anchorName: string, point: any) {
      let el = store[id];
      if (!el) {
        el = document.createElement('div');
        el.style.cssText =
          'position:absolute;width:1px;height:1px;pointer-events:none;anchor-name:' + anchorName;
        root.append(el);
        store[id] = el;
      }
      el.style.left = 100 * point.x + '%';
      el.style.top = 100 * point.y + '%';
    }
    document.head.append(styleEl);
    return {
      updateMarkers: function (list: any[], projector: (location: any) => any) {
        const seen: Record<string, number> = {};
        for (const marker of list) {
          const id = marker.id;
          if (!id) continue;
          const point = projector(marker.location);
          seen[id] = 1;
          place(markerEls, id, '--cobe-' + id, point);
          if (point.visible) visibleVars['--cobe-visible-' + id] = 'N';
          else delete visibleVars['--cobe-visible-' + id];
        }
        for (const id in markerEls) {
          if (!seen[id]) {
            markerEls[id].remove();
            delete markerEls[id];
            delete visibleVars['--cobe-visible-' + id];
          }
        }
      },
      updateArcs: function (list: any[], projector: (arc: any) => any) {
        const seen: Record<string, number> = {};
        for (const arc of list) {
          const id = arc.id;
          if (!id) continue;
          const point = projector(arc);
          seen[id] = 1;
          place(arcEls, id, '--cobe-arc-' + id, point);
          if (point.visible) visibleVars['--cobe-visible-arc-' + id] = 'N';
          else delete visibleVars['--cobe-visible-arc-' + id];
        }
        for (const id in arcEls) {
          if (!seen[id]) {
            arcEls[id].remove();
            delete arcEls[id];
            delete visibleVars['--cobe-visible-arc-' + id];
          }
        }
      },
      destroy: function () {
        for (const id in markerEls) markerEls[id].remove();
        for (const id in arcEls) arcEls[id].remove();
        styleEl.remove();
      },
      flush: function () {
        let css = '';
        for (const name in visibleVars) css += name + ':' + visibleVars[name] + ';';
        styleEl.textContent = ':root{' + css + '}';
      },
    };
  })(container);

  function update(next: any) {
    let markerData: Float32Array;
    let arcData: Float32Array;
    if (next.phi != undef) phi = next.phi;
    if (next.theta != undef) theta = next.theta;
    if (next.markers) {
      markers = next.markers;
      markerData = new Float32Array(8 * markers.length);
      markers.forEach((marker: any, index: number) => {
        markerData.set(
          [...locationToVector(marker.location), marker.size, ...(marker.color || [0, 0, 0]), +!!marker.color],
          8 * index,
        );
      });
      gl.bindBuffer(gl.ARRAY_BUFFER, markerBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, markerData, gl.DYNAMIC_DRAW);
    }
    if (next.arcs) {
      arcs = next.arcs;
      arcCount = arcs.length;
      arcData = new Float32Array(12 * arcs.length);
      arcs.forEach((arc: any, index: number) => {
        arcData.set(
          [
            ...locationToVector(arc.from),
            ...locationToVector(arc.to),
            arcHeight + markerElevation,
            0.005 * arcWidth,
            ...(arc.color || [0, 0, 0]),
            +!!arc.color,
          ],
          12 * index,
        );
      });
      gl.bindBuffer(gl.ARRAY_BUFFER, arcBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, arcData, gl.DYNAMIC_DRAW);
    }
    if (next.width && next.height) {
      canvas.width = next.width * dpr;
      canvas.height = next.height * dpr;
    }
    if (next.mapSamples != undef) mapSamples = next.mapSamples;
    if (next.mapBrightness != undef) mapBrightness = next.mapBrightness;
    if (next.mapBaseBrightness != undef) mapBaseBrightness = next.mapBaseBrightness;
    if (next.baseColor != undef) baseColor = next.baseColor;
    if (next.markerColor != undef) markerColor = next.markerColor;
    if (next.glowColor != undef) glowColor = next.glowColor;
    if (next.arcColor != undef) arcColor = next.arcColor;
    if (next.arcWidth != undef) arcWidth = next.arcWidth;
    if (next.arcHeight != undef) arcHeight = next.arcHeight;
    if (next.diffuse != undef) diffuse = next.diffuse;
    if (next.dark != undef) dark = next.dark;
    if (next.opacity != undef) opacity = next.opacity;
    if (next.offset != undef) offset = next.offset;
    if (next.scale != undef) scale = next.scale;
    if (next.markerElevation != undef) markerElevation = next.markerElevation;
    anchors.updateMarkers(markers, projectMarker);
    anchors.updateArcs(arcs, projectArc);
    anchors.flush();

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    // globe
    gl.useProgram(globeProgram);
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
    gl.enableVertexAttribArray(quadAttrib);
    gl.vertexAttribPointer(quadAttrib, 2, gl.FLOAT, false, 0, 0);
    if (isWebGL2) gl.vertexAttribDivisor(quadAttrib, 0);
    else if (instancingExt) instancingExt.vertexAttribDivisorANGLE(quadAttrib, 0);
    gl.uniform2f(globeUniforms.t, canvas.width, canvas.height);
    gl.uniform2f(globeUniforms.s, phi, theta);
    gl.uniform1f(globeUniforms.k, mapSamples);
    gl.uniform1f(globeUniforms.x, scale);
    gl.uniform2f(globeUniforms.v, offset[0] * dpr, offset[1] * dpr);
    gl.uniform3fv(globeUniforms.F, baseColor);
    gl.uniform3fv(globeUniforms.w, glowColor);
    gl.uniform4f(globeUniforms.n, mapBrightness, diffuse, dark, opacity);
    gl.uniform1f(globeUniforms.y, mapBaseBrightness);
    gl.uniform1i(globeUniforms.z, 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, mapTexture);
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    // arcs
    if (arcProgram && arcCount > 0) {
      gl.useProgram(arcProgram);
      gl.bindBuffer(gl.ARRAY_BUFFER, arcStripBuffer);
      if (arcAttribs.k >= 0) {
        gl.enableVertexAttribArray(arcAttribs.k);
        gl.vertexAttribPointer(arcAttribs.k, 2, gl.FLOAT, false, 0, 0);
        if (isWebGL2) gl.vertexAttribDivisor(arcAttribs.k, 0);
        else if (instancingExt) instancingExt.vertexAttribDivisorANGLE(arcAttribs.k, 0);
      }
      gl.bindBuffer(gl.ARRAY_BUFFER, arcBuffer);
      setupInstancedAttrib(arcAttribs.l, 3, 48, 0, 1);
      setupInstancedAttrib(arcAttribs.m, 3, 48, 12, 1);
      setupInstancedAttrib(arcAttribs.v, 1, 48, 24, 1);
      setupInstancedAttrib(arcAttribs.w, 1, 48, 28, 1);
      setupInstancedAttrib(arcAttribs.N, 3, 48, 32, 1);
      setupInstancedAttrib(arcAttribs.O, 1, 48, 44, 1);
      gl.uniform1f(arcUniforms.y, phi);
      gl.uniform1f(arcUniforms.z, theta);
      gl.uniform2f(arcUniforms.g, canvas.width, canvas.height);
      gl.uniform1f(arcUniforms.h, scale);
      gl.uniform2f(arcUniforms.x, offset[0] * dpr, offset[1] * dpr);
      gl.uniform3fv(arcUniforms.M, arcColor);
      gl.uniform1f(arcUniforms.A, markerElevation);
      if (isWebGL2) gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 66, arcCount);
      else if (instancingExt) instancingExt.drawArraysInstancedANGLE(gl.TRIANGLE_STRIP, 0, 66, arcCount);
      else for (let i = 0; i < arcCount; i++) gl.drawArrays(gl.TRIANGLE_STRIP, 0, 66);
    }

    // markers
    if (markerProgram && markers.length > 0) {
      gl.useProgram(markerProgram);
      gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
      if (markerAttribs.n >= 0) {
        gl.enableVertexAttribArray(markerAttribs.n);
        gl.vertexAttribPointer(markerAttribs.n, 2, gl.FLOAT, false, 0, 0);
        if (isWebGL2) gl.vertexAttribDivisor(markerAttribs.n, 0);
        else if (instancingExt) instancingExt.vertexAttribDivisorANGLE(markerAttribs.n, 0);
      }
      gl.bindBuffer(gl.ARRAY_BUFFER, markerBuffer);
      setupInstancedAttrib(markerAttribs.p, 3, 32, 0, 1);
      setupInstancedAttrib(markerAttribs.q, 1, 32, 12, 1);
      setupInstancedAttrib(markerAttribs.w, 3, 32, 16, 1);
      setupInstancedAttrib(markerAttribs.x, 1, 32, 28, 1);
      gl.uniform1f(markerUniforms.i, phi);
      gl.uniform1f(markerUniforms.j, theta);
      gl.uniform2f(markerUniforms.b, canvas.width, canvas.height);
      gl.uniform1f(markerUniforms.k, scale);
      gl.uniform2f(markerUniforms.r, offset[0] * dpr, offset[1] * dpr);
      gl.uniform3fv(markerUniforms.v, markerColor);
      gl.uniform1f(markerUniforms.s, markerElevation);
      const count = markers.length;
      if (isWebGL2) gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, count);
      else if (instancingExt) instancingExt.drawArraysInstancedANGLE(gl.TRIANGLES, 0, 6, count);
      else for (let i = 0; i < count; i++) gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
  }

  update({ markers, arcs });
  return {
    update,
    destroy: () => {
      gl.deleteBuffer(quadBuffer);
      gl.deleteBuffer(arcStripBuffer);
      gl.deleteBuffer(markerBuffer);
      gl.deleteBuffer(arcBuffer);
      gl.deleteProgram(globeProgram);
      if (markerProgram) gl.deleteProgram(markerProgram);
      if (arcProgram) gl.deleteProgram(arcProgram);
      anchors.destroy();
    },
  };
};
