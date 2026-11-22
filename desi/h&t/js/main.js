/* Hamza & Tahia — a draped stage that opens on tap and re-dresses itself as you scroll:
     intro      ivory silk, jasmine strands
     Holud      blush & sage drapes, brass lanterns, hanging flowers, a garden behind
     Reception  burgundy velvet with gold trim, crystal chandelier, candelabras, a carved arch and marble floor
     Walima     ivory sheers, fairy lights, glass globes, greenery and candles on the lawn
   Everything is drawn in code: the cloth folds are shaders, the flowers are shaded point sprites. */
(() => {
'use strict';
const $ = s => document.querySelector(s);
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const small = Math.min(innerWidth, innerHeight) < 700;
const rand = (a = 0, b = 1) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const SETTLE = location.hash === '#settle';
if (SETTLE) document.documentElement.classList.add('settle');
const pick = a => a[Math.floor(Math.random() * a.length)];

/* ================= music: a slow harp-and-piano nocturne (Canon-like progression in D) ================= */
const CH = [[50, 57, 62, 66, 69], [45, 52, 57, 61, 64], [47, 54, 59, 62, 66], [42, 49, 54, 57, 61], [43, 50, 55, 59, 62], [50, 57, 62, 66, 69], [40, 47, 52, 55, 59], [45, 52, 57, 61, 64]];
const MEL = [78, 76, 74, 73, 71, 69, 71, 73, 74, 73, 71, 69, 67, 66, 64, 69];
const ARP = [0, 2, 3, 4, 3, 2];
const piano = (tone, m, t, v, d) => tone(m, t, { dur: d, vol: v, attack: .005, cutoff: 3400, partials: [[1, 1], [2, .3, .55], [3, .1, .35], [4.02, .04, .25]] });
const music = createMusic({ spb: .3, reverb: .62, volume: .8, fadeIn: 3, play(step, t, tone, noise, pluck) {
  const bar = Math.floor(step / 6) % 8, k = step % 6, c = CH[bar], cyc = Math.floor(step / 48) % 2;
  if (k === 0) {
    piano(tone, c[0], t, .05, 3.4);
    tone(c[2], t, { type: 'triangle', dur: 2.2, vol: .012, attack: .7, sustain: true, cutoff: 900 });
    tone(c[3], t, { type: 'triangle', dur: 2.2, vol: .01, attack: .9, sustain: true, cutoff: 900 });
    piano(tone, MEL[bar + cyc * 8], t + .02, .045, 3.2);
  }
  pluck(c[ARP[k]] + 12, t, { vol: k ? .05 : .065, bright: .72, dur: 2.2 });
  if (cyc === 1 && k === 3 && bar % 2 === 0) piano(tone, MEL[bar + 8] + 2 + (bar === 4 ? -1 : 0), t, .03, 1.6);
}});
const musicBtn = $('#music');
musicBtn.addEventListener('click', () => { const on = music.toggle(); musicBtn.classList.toggle('off', !on); musicBtn.setAttribute('aria-label', on ? 'Pause music' : 'Play music'); });
const swish = () => music.sfx((t, tone, noise) => { for (let i = 0; i < 14; i++) noise(t + i * .07, { dur: .32, vol: .02 * (1 - i / 16), freq: 900 + i * 170, type: 'bandpass', q: .5 }); });
const chime = (base = 74) => music.sfx((t, tone, noise, pluck) => { [0, 4, 7, 12, 16].forEach((d, i) => pluck(base + d, t + i * .075, { vol: .06, bright: .85, dur: 1.8 })); });

/* ================= state ================= */
const W = [1, 0, 0, 0];             // current blend of the four looks (intro, holud, reception, walima)
let opened = false, openStart = 0, kick = 0, lastTheme = 0;
const stops = [...document.querySelectorAll('.stop')];
function targetW() {
  if (!opened) return [1, 0, 0, 0];
  const mid = innerHeight * .5, cs = stops.map(s => { const r = s.getBoundingClientRect(); return r.top + r.height / 2; });
  let i = 0; while (i < cs.length - 1 && cs[i + 1] <= mid) i++;
  let f = 0; if (i < cs.length - 1 && cs[i] < mid) f = sstep(.28, .72, (mid - cs[i]) / (cs[i + 1] - cs[i]));
  const a = +stops[i].dataset.theme, b = +stops[Math.min(i + 1, cs.length - 1)].dataset.theme, w = [0, 0, 0, 0];
  w[a] += 1 - f; w[b] += f; return w;
}

/* ================= 3D stage ================= */
let renderer = null;
try { renderer = new THREE.WebGLRenderer({ canvas: $('#scene'), antialias: true, powerPreference: 'high-performance' }); } catch (e) { console.warn('WebGL unavailable', e); }
if (!renderer) document.body.classList.add('no3d');

if (renderer) {
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, small ? 1.75 : 1.5));
renderer.setClearColor(0xf3ece0, 1);
const scene = new THREE.Scene();
const FOV = 35, CZ = 10, T = Math.tan(FOV * Math.PI / 360), VH = T * CZ;
let VW = VH, ASP = 1, pxScale = 400, lastW = 0;
const camera = new THREE.PerspectiveCamera(FOV, 1, .1, 80); camera.position.set(0, 0, CZ);
const halfW = z => T * (CZ - z) * ASP;
const halfH = z => T * (CZ - z);

const NOISE = `
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(hash(i), hash(i + vec2(1., 0.)), f.x), mix(hash(i + vec2(0., 1.)), hash(i + vec2(1., 1.)), f.x), f.y); }
float fbm(vec2 p){ float s = 0., a = .5; for (int i = 0; i < 4; i++) { s += a * vnoise(p); p = p * 2.03 + 1.7; a *= .5; } return s; }`;

/* ---------- backdrop: the wall, the garden / arch / lawn behind, and the floor ---------- */
const bgU = { uW: { value: new THREE.Vector4(1, 0, 0, 0) }, uT: { value: 0 }, uRes: { value: new THREE.Vector2(1, 1) }, uAsp: { value: .5 } };
const bg = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({ uniforms: bgU, depthWrite: false, depthTest: false,
  vertexShader: `void main(){ gl_Position = vec4(position.xy, .999, 1.); }`,
  fragmentShader: `uniform vec4 uW; uniform float uT, uAsp; uniform vec2 uRes;
  ${NOISE}
  void main(){
    vec2 p = gl_FragCoord.xy / uRes; float x = (p.x - .5) * uAsp, y = p.y;
    vec3 wall = vec3(.955, .93, .88) * uW.x + vec3(.962, .937, .888) * uW.y + vec3(.935, .872, .79) * uW.z + vec3(.93, .906, .852) * uW.w;
    float n = fbm(vec2(x, y) * 8.);
    vec3 col = wall * (.965 + .07 * n);
    col *= .87 + .15 * exp(-(x * x * 3. + (y - .55) * (y - .55) * 3.5));
    float hz = .135;
    if (uW.z > .002) {                       // reception: carved arch panel + pilasters + chandelier warmth
      float aw = min(.37 * uAsp, .34), sp = .7;
      float d = y < sp ? abs(x) - aw : length(vec2(x, y - sp)) - aw;
      vec3 a = col * (d < 0. ? 1.035 : .95);
      a *= 1. - .16 * smoothstep(.004, 0., abs(d + .01)) + .12 * smoothstep(.003, 0., abs(d + .019));
      a *= 1. - .12 * smoothstep(.005, 0., abs(d - .05));
      float band = step(.05, d) * step(d, .12) * step(y, sp);
      a *= mix(1., .965 + .035 * sin(abs(x) * 520.), band);
      a += vec3(.3, .17, .05) * .24 * exp(-(x * x * 12. + (y - .86) * (y - .86) * 9.));
      col = mix(col, a, uW.z);
    }
    if (uW.y > .002) {                       // holud: soft garden behind
      vec3 a = col;
      float side = smoothstep(.03, .2, abs(x));
      float tree = hz + .2 + .12 * fbm(vec2(x * 3., 5.));
      a = mix(a, vec3(.76, .79, .64), .38 * smoothstep(tree + .04, tree - .04, y) * side);
      float bt = hz + .03 + .14 * fbm(vec2(x * 5. + 2., 1.)) * side;
      vec3 bc = mix(vec3(.58, .66, .45), vec3(.7, .76, .55), fbm(vec2(x, y) * 30.));
      vec2 q = vec2(x, y) * 55.; vec2 id = floor(q); float hh = hash(id);
      float dm = smoothstep(.34, .16, length(fract(q) - .5 + (vec2(hash(id + 3.), hash(id + 7.)) - .5) * .3)) * step(.55, hh);
      bc = mix(bc, hh > .86 ? vec3(.98, .95, .9) : vec3(.93, .66, .74), dm * .8);
      a = mix(a, bc, .85 * smoothstep(bt + .02, bt - .02, y));
      col = mix(col, a, uW.y);
    }
    if (uW.w > .002) {                       // walima: dusk glow and greenery
      vec3 a = col * mix(1., .92, smoothstep(.4, 1., y));
      a += vec3(.26, .17, .06) * .22 * exp(-(x * x * 2. + (y - .95) * (y - .95) * 6.));
      float side = smoothstep(.05, .25, abs(x));
      float bt = hz + .05 + .2 * fbm(vec2(x * 4. + 9., 3.)) * side;
      a = mix(a, vec3(.58, .61, .46) * (.8 + .3 * fbm(vec2(x, y) * 25.)), .6 * smoothstep(bt + .03, bt - .03, y) * side);
      col = mix(col, a, uW.w);
    }
    if (y < hz + .01) {                      // floor
      float fm = smoothstep(hz + .006, hz - .006, y);
      float dz = 1. / max(hz - y + .02, .02);
      vec2 fp = vec2(x * dz * .9, dz * .25);
      float g = fbm(vec2(x * 12., y * 60.)), up = smoothstep(0., hz, y);
      vec3 f0 = wall * (.84 + .1 * up) + vec3(.05, .03, .0) * exp(-x * x * 10.) * up;
      vec3 f1 = mix(vec3(.55, .62, .36), vec3(.73, .77, .5), g) * (.82 + .25 * up);
      float tile = mod(floor(fp.x) + floor(fp.y), 2.);
      vec3 f2 = vec3(.9, .84, .75) * (.84 + .07 * tile + .08 * fbm(fp * 1.5));
      f2 -= .06 * smoothstep(.03, 0., abs(fbm(fp * .8 + 3.) - .5));
      f2 += vec3(.22, .12, .04) * exp(-x * x * 10.) * up * .8;
      vec3 f3 = mix(vec3(.4, .44, .3), vec3(.56, .59, .41), g) * (.8 + .2 * up);
      col = mix(col, f0 * uW.x + f1 * uW.y + f2 * uW.z + f3 * uW.w, fm);
    }
    for (int i = 0; i < 7; i++) {            // walima: candle bokeh on the lawn
      float fi = float(i);
      vec2 c = vec2((hash(vec2(fi, 1.)) - .5) * uAsp * 1.1, .025 + .09 * hash(vec2(fi, 2.)));
      float r = .012 + .02 * hash(vec2(fi, 3.));
      col += vec3(.5, .33, .12) * smoothstep(r, r * .3, length(vec2(x, y) - c)) * .5 * uW.w * (.8 + .2 * sin(uT * 2. + fi));
    }
    float vg = length(vec2(x / max(uAsp, .4) * 1.2, (y - .5) * 1.1));
    col *= 1. - .2 * smoothstep(.35, 1., vg);
    col += (hash(gl_FragCoord.xy + fract(uT)) - .5) * .012;
    gl_FragColor = vec4(col, 1.);
  }` }));
bg.frustumCulled = false; bg.renderOrder = -10; scene.add(bg);

/* ---------- fabric: curtains with tie-backs, and the swag valance ---------- */
const FABRIC_FS = `uniform vec3 uCol, uCol2; uniform float uStripe, uSheer, uVelvet, uSatin, uTrim, uSwag, uA;
  varying vec2 vUv; varying float vS, vC;
  float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  void main(){
    float u = vUv.x, v = vUv.y;
    vec3 base = mix(uCol, uCol2, smoothstep(.46, .54, u) * uStripe);
    float ridge = .5 + .5 * vS;
    float lit = .76 + .24 * ridge + .06 * vC;
    lit = mix(lit, .26 + .74 * pow(ridge, 1.5), uVelvet);
    vec3 col = base * lit;
    col += uVelvet * pow(abs(vC), 5.) * .32 * (base + vec3(.3, .12, .12));
    col += uSatin * pow(ridge, 12.) * .2 * vec3(1., .97, .9);
    float top = uSwag > .5 ? 1. : mix(.8, 1., smoothstep(1., .8, v));
    col *= top * (.9 + .1 * smoothstep(0., .2, v));
    col *= .985 + .03 * hash(floor(vUv * vec2(220., 420.)));
    float trim = uTrim * (uSwag > .5 ? smoothstep(.06, .025, v) : max(smoothstep(.972, .99, u), smoothstep(.022, .01, v)));
    col = mix(col, vec3(.82, .64, .34) * (.7 + .5 * ridge), trim);
    col = mix(col, col * 1.04 + .025, uSheer);
    float a = mix(1., .32 + .42 * ridge * ridge + .2 * smoothstep(.85, 1., u) * (1. - uSwag), uSheer);
    gl_FragColor = vec4(col, max(a, trim) * uA);
  }`;
const CURTAIN_VS = `uniform float uOpen, uT, uSide, uOuter, uHalf, uTop, uBot, uTieV, uTieW, uTopW, uBotW, uFolds, uDepth, uZ, uSeed;
  varying vec2 vUv; varying float vS, vC;
  void main(){
    float u = uv.x, v = uv.y;
    float lower = mix(uBotW, uTieW, pow(smoothstep(0., uTieV, v), .8));
    float upper = mix(uTieW, uTopW, pow(smoothstep(uTieV, 1., v), 1.4));
    float w = mix(1., v < uTieV ? lower : upper, uOpen);
    float comp = clamp(1. / max(w, .05), 1., 6.);
    float ph = u * uFolds * 6.2831 + sin(v * 2.5 + uSeed) * .8;
    float amp = uDepth * (.7 + .18 * comp);
    float sway = sin(uT * .7 + v * 2.2 + uSeed) * .03 * (1. - v) + sin(uT * 1.3 + u * 5. + uSeed) * .006;
    float x = u * w * uHalf + sway * u;
    vec3 pos = vec3(uSide * (uOuter - x), mix(uBot, uTop, v), uZ + sin(ph) * amp * (.35 + .65 * u) + .06 * u * uOpen * (1. - abs(v - uTieV)));
    vS = sin(ph); vC = cos(ph) * uSide; vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.);
  }`;
const SWAG_VS = `uniform float uN, uPh, uH, uDrop, uTop, uHW, uZ, uT, uFolds;
  varying vec2 vUv; varying float vS, vC;
  void main(){
    float u = uv.x, d = 1. - uv.y;
    float sag = sin(3.14159 * fract(u * uN + uPh));
    float ph = d * uFolds * 6.2831;
    vec3 pos = vec3((u - .5) * 2. * uHW, uTop - d * (uH + uDrop * sag), uZ + sin(ph) * .03 * (.4 + sag) + sag * d * .18 + sin(uT * .6 + u * 6.) * .008);
    vS = sin(ph); vC = cos(ph) * .5; vUv = vec2(u, 1. - d);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.);
  }`;
const fabricU = () => ({ uCol: { value: new THREE.Color() }, uCol2: { value: new THREE.Color() }, uStripe: { value: 0 }, uSheer: { value: 0 }, uVelvet: { value: 0 },
  uSatin: { value: 0 }, uTrim: { value: 0 }, uSwag: { value: 0 }, uA: { value: 1 }, uT: { value: 0 } });
const curtains = [];   // { mat, layer }
function makeCurtain(side, layer) {
  const u = Object.assign(fabricU(), { uOpen: { value: 0 }, uSide: { value: side }, uOuter: { value: 1 }, uHalf: { value: 1 }, uTop: { value: 1 }, uBot: { value: -1 },
    uTieV: { value: .4 }, uTieW: { value: .15 }, uTopW: { value: .5 }, uBotW: { value: .35 }, uFolds: { value: layer ? 9 : 7 }, uDepth: { value: layer ? .05 : .07 },
    uZ: { value: layer ? .22 : 0 }, uSeed: { value: rand(0, 6) } });
  const mat = new THREE.ShaderMaterial({ uniforms: u, vertexShader: CURTAIN_VS, fragmentShader: FABRIC_FS, side: THREE.DoubleSide, transparent: true, depthWrite: !layer });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1, 48, 72), mat);
  mesh.frustumCulled = false; mesh.renderOrder = layer ? 5 : 4; scene.add(mesh);
  curtains.push({ mat, layer });
}
makeCurtain(-1, 0); makeCurtain(1, 0); makeCurtain(-1, 1); makeCurtain(1, 1);
const swags = [];
function makeSwag(layer) {
  const u = Object.assign(fabricU(), { uN: { value: small ? 2 : 3 }, uPh: { value: layer ? .5 : 0 }, uH: { value: layer ? .12 : .2 }, uDrop: { value: layer ? .4 : .5 },
    uTop: { value: VH }, uHW: { value: 2 }, uZ: { value: layer ? .46 : .32 }, uFolds: { value: layer ? 4 : 3 } });
  u.uSwag.value = 1;
  const mat = new THREE.ShaderMaterial({ uniforms: u, vertexShader: SWAG_VS, fragmentShader: FABRIC_FS, side: THREE.DoubleSide, transparent: true, depthWrite: !layer });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1, 120, 14), mat);
  mesh.frustumCulled = false; mesh.renderOrder = layer ? 9 : 8; scene.add(mesh);
  swags.push({ mat, layer });
}
makeSwag(0); makeSwag(1);

// the four looks for the drapes: [back layer, front sheer]
const F = (col, col2, o = {}) => Object.assign({ col, col2: col2 || col, stripe: 0, sheer: 0, velvet: 0, satin: 0, trim: 0 }, o);
const LOOKS = [
  [F([.93, .885, .8], null, { satin: .7, trim: .55 }), F([.985, .965, .925], null, { sheer: .85, satin: .3 })],
  [F([.93, .75, .72], [.74, .77, .63], { stripe: 1, sheer: .1, satin: .25 }), F([.97, .89, .85], [.95, .93, .86], { stripe: 1, sheer: .8 })],
  [F([.44, .05, .1], null, { velvet: 1, trim: 1 }), F([.98, .93, .85], null, { sheer: .93, satin: .15 })],
  [F([.95, .925, .86], [.85, .86, .76], { stripe: .6, sheer: .45, satin: .3 }), F([.985, .97, .93], null, { sheer: .85 })],
];
function applyLook(mat, layer, swag) {
  const u = mat.uniforms, o = { col: [0, 0, 0], col2: [0, 0, 0], stripe: 0, sheer: 0, velvet: 0, satin: 0, trim: 0 };
  LOOKS.forEach((L, i) => { const p = L[layer], w = W[i]; for (let k = 0; k < 3; k++) { o.col[k] += p.col[k] * w; o.col2[k] += p.col2[k] * w; }
    o.stripe += p.stripe * w; o.sheer += p.sheer * w; o.velvet += p.velvet * w; o.satin += p.satin * w; o.trim += p.trim * w; });
  u.uCol.value.setRGB(o.col[0], o.col[1], o.col[2]);
  if (swag && layer === 0) u.uCol2.value.setRGB(o.col2[0], o.col2[1], o.col2[2]), u.uCol.value.setRGB(o.col2[0] * .5 + o.col[0] * .5, o.col2[1] * .5 + o.col[1] * .5, o.col2[2] * .5 + o.col[2] * .5);
  else u.uCol2.value.setRGB(o.col2[0], o.col2[1], o.col2[2]);
  u.uStripe.value = swag ? 0 : o.stripe; u.uSheer.value = o.sheer; u.uVelvet.value = o.velvet; u.uSatin.value = o.satin; u.uTrim.value = o.trim;
}
function layoutCurtains() {
  const k = clamp(.62 / ASP, .42, 1);           // keep the drapes slender on wide screens
  curtains.forEach(({ mat, layer }) => {
    const u = mat.uniforms, z = u.uZ.value, hw = halfW(z);
    u.uOuter.value = hw + .08; u.uHalf.value = hw + .16; u.uTop.value = halfH(z) + .05; u.uBot.value = -halfH(z) - .05;
    u.uTieV.value = layer ? .33 : .4; u.uTieW.value = (layer ? .1 : .15) * k; u.uTopW.value = (layer ? .38 : .55) * k; u.uBotW.value = (layer ? .24 : .36) * k;
  });
  swags.forEach(({ mat }) => { const u = mat.uniforms, z = u.uZ.value; u.uHW.value = halfW(z) + .3; u.uTop.value = halfH(z) + .04; u.uN.value = ASP < .8 ? 2 : 3; });
}

/* ---------- shared materials ---------- */
const MVS = `varying vec3 vN, vV; varying vec2 vUv;
  void main(){ vec4 p = vec4(position, 1.); vec3 n = normal;
    #ifdef USE_INSTANCING
      p = instanceMatrix * p; n = mat3(instanceMatrix) * n;
    #endif
    vec4 wp = modelMatrix * p; vN = normalize(mat3(modelMatrix) * n); vV = normalize(cameraPosition - wp.xyz); vUv = uv;
    gl_Position = projectionMatrix * viewMatrix * wp; }`;
const METAL_FS = `uniform vec3 uCol; uniform float uSpec, uWarm, uCrystal; varying vec3 vN, vV;
  void main(){
    vec3 n = normalize(vN); if (!gl_FrontFacing) n = -n; vec3 v = normalize(vV);
    vec3 L1 = normalize(vec3(-.4, .7, .6)), L2 = normalize(vec3(.7, -.1, .7));
    float d = .35 + .65 * max(dot(n, L1), 0.);
    float s = pow(max(dot(reflect(-L1, n), v), 0.), 28.) + .6 * pow(max(dot(reflect(-L2, n), v), 0.), 16.);
    float fr = pow(1. - max(dot(n, v), 0.), 3.);
    vec3 col = uCol * (d * .7 + (.5 + .5 * n.y) * .3) + s * uSpec * mix(uCol, vec3(1.), .45) + fr * .22 * uCol;
    col += uWarm * vec3(1., .72, .38) * max(-n.y, 0.) * .2;
    col += uCrystal * (.5 + .5 * sin(dot(n, vec3(11., 7., 5.)) * vec3(1., 1.35, 1.7))) * .14;
    gl_FragColor = vec4(col, 1.);
  }`;
const metal = (col, spec, warm, crystal = 0) => new THREE.ShaderMaterial({ uniforms: { uCol: { value: new THREE.Color(...col) }, uSpec: { value: spec }, uWarm: { value: warm }, uCrystal: { value: crystal } },
  vertexShader: MVS, fragmentShader: METAL_FS });
const gold = metal([.78, .58, .28], 1, .6), crystal = metal([.9, .91, .96], 1.6, .3, 1), wax = metal([1.14, 1.09, 1.0], .12, .25);
const panelMat = new THREE.ShaderMaterial({ uniforms: { uT: { value: 0 } }, vertexShader: MVS, side: THREE.DoubleSide,
  fragmentShader: `uniform float uT; varying vec2 vUv;
  void main(){ vec2 f = fract(vec2(vUv.x * 12., vUv.y * 4.)) - .5;
    float m = max(smoothstep(.38, .45, max(abs(f.x), abs(f.y))), .85 * smoothstep(.06, 0., abs(abs(f.x) + abs(f.y) - .3)));
    vec3 glow = vec3(1., .85, .56) * (1. + .07 * sin(uT * 8.) * sin(uT * 5.3));
    gl_FragColor = vec4(mix(glow, vec3(.5, .34, .14), m), 1.); }` });
const globeMat = new THREE.ShaderMaterial({ uniforms: {}, vertexShader: MVS, transparent: true, depthWrite: false,
  fragmentShader: `varying vec3 vN, vV; void main(){ float fr = pow(1. - abs(dot(normalize(vN), normalize(vV))), 2.);
    gl_FragColor = vec4(mix(vec3(1., .86, .6), vec3(.62, .5, .3), fr * .8), .3 + .65 * fr); }` });

// soft halo sprite
const haloTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
  const r = g.createRadialGradient(64, 64, 0, 64, 64, 64); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(.25, 'rgba(255,255,255,.45)'); r.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = r; g.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c); })();
const halo = (col, size, op) => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTex, color: new THREE.Color(...col), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: op }));
  s.scale.setScalar(size); s.userData.op = op; s.renderOrder = 7; return s; };

/* ---------- glowing points: flames, fairy lights, dust ---------- */
const glowMats = [];
const GLOW_VS = `attribute vec3 acol; attribute float asize, akind, aseed, afall;
  uniform float uT, uScale, uVis, uVH; varying vec3 vCol; varying float vKind, vI;
  void main(){
    vec3 p = position;
    if (afall > .5) { p.y = mod(p.y + uT * (.06 + .1 * aseed) + uVH, 2. * uVH) - uVH; p.x += sin(uT * .4 + aseed * 20.) * .2; }
    vec4 mv = modelViewMatrix * vec4(p, 1.);
    float fl = akind < .5 ? .85 + .15 * sin(uT * 9. + aseed * 40.) * sin(uT * 5.3 + aseed * 7.) : akind < 1.5 ? .9 + .1 * sin(uT * 14. + aseed * 30.) : .55 + .45 * sin(uT * (1.2 + aseed * 2.) + aseed * 30.);
    vI = fl * uVis; vCol = acol; vKind = akind;
    gl_PointSize = asize * uScale / -mv.z * (akind > 1.5 ? .75 + .25 * fl : 1.) * clamp(uVis * 1.5, 0., 1.);
    gl_Position = projectionMatrix * mv;
  }`;
const GLOW_FS = `varying vec3 vCol; varying float vKind, vI;
  void main(){
    vec2 c = (gl_PointCoord - .5) * 2.; float r = length(c), a; vec3 col = vCol;
    if (vKind < .5) a = exp(-r * r * 5.) * .8;
    else if (vKind < 1.5) { vec2 q = vec2(c.x, -c.y); float d = length(vec2(q.x * (2.4 - q.y * 1.1), (q.y + .25) * .9));
      a = smoothstep(.8, .15, d) + exp(-r * r * 5.) * .2; col = mix(vCol, vec3(1., .97, .86), smoothstep(.55, .1, d)); }
    else a = smoothstep(.28, 0., r) + exp(-r * r * 7.) * .45;
    col *= a * vI; if (col.r + col.g + col.b < .006) discard;
    gl_FragColor = vec4(col, 1.);
  }`;
function glowPoints(items) {
  const n = items.length, P = new Float32Array(n * 3), C = new Float32Array(n * 3), S = new Float32Array(n), K = new Float32Array(n), SD = new Float32Array(n), FA = new Float32Array(n);
  items.forEach((it, i) => { P.set(it.p, i * 3); C.set(it.c, i * 3); S[i] = it.s; K[i] = it.k || 0; SD[i] = Math.random(); FA[i] = it.fall || 0; });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('acol', new THREE.BufferAttribute(C, 3)); g.setAttribute('asize', new THREE.BufferAttribute(S, 1));
  g.setAttribute('akind', new THREE.BufferAttribute(K, 1)); g.setAttribute('aseed', new THREE.BufferAttribute(SD, 1)); g.setAttribute('afall', new THREE.BufferAttribute(FA, 1));
  const m = new THREE.ShaderMaterial({ uniforms: { uT: { value: 0 }, uScale: { value: pxScale }, uVis: { value: 1 }, uVH: { value: VH } }, vertexShader: GLOW_VS, fragmentShader: GLOW_FS,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  glowMats.push(m);
  const pts = new THREE.Points(g, m); pts.frustumCulled = false; pts.renderOrder = 7; return pts;
}
const flame = (x, y, z, s = 1) => [{ p: [x, y, z], c: [1, .72, .32], s: .075 * s, k: 1 }, { p: [x, y, z], c: [.4, .24, .08], s: .34 * s, k: 0 }];

/* ---------- flowers & leaves: shaded point sprites ---------- */
const floraMat = new THREE.ShaderMaterial({ uniforms: { uW: { value: new THREE.Vector4(1, 0, 0, 0) }, uT: { value: 0 }, uScale: { value: pxScale }, uVH: { value: VH } },
  transparent: true, depthWrite: false,
  vertexShader: `attribute vec3 acol; attribute float asize, akind, arot, agrp, ahang, aseed, afall;
  uniform vec4 uW; uniform float uT, uScale, uVH; varying vec3 vCol; varying float vKind, vRot, vA;
  void main(){
    float w = dot(uW, vec4(equal(vec4(agrp), vec4(0., 1., 2., 3.))));
    float e = w * w * (3. - 2. * w);
    vec3 p = position;
    p.x += sin(uT * .9 + aseed * 6.28) * .05 * ahang + sin(uT * .5 + aseed * 9.) * .008;
    p.y += (1. - e) * step(.001, ahang) * 2.4;
    float spin = 0.;
    if (afall > .5) { p.y = mod(p.y - uT * (.18 + .14 * aseed) + uVH + .3, 2. * uVH + .6) - uVH - .3; p.x += sin(uT * .7 + aseed * 9.) * .25; spin = uT * (.6 + aseed); }
    float bloom = clamp(e * 1.6 - aseed * .6, 0., 1.);
    vec4 mv = modelViewMatrix * vec4(p, 1.);
    gl_PointSize = asize * uScale / -mv.z * bloom;
    vRot = arot + spin + sin(uT * .8 + aseed * 6.) * .15 * ahang; vCol = acol; vKind = akind; vA = bloom;
    gl_Position = projectionMatrix * mv;
  }`,
  fragmentShader: `varying vec3 vCol; varying float vKind, vRot, vA;
  void main(){
    vec2 c = gl_PointCoord - .5; c.y = -c.y;
    float cs = cos(vRot), sn = sin(vRot); c = mat2(cs, -sn, sn, cs) * c;
    float r = length(c) * 2., an = atan(c.y, c.x), al; vec3 col = vCol;
    if (vKind < .5) {                       // five-petal blossom
      float pet = .62 + .38 * cos(5. * an), edge = pet * .95;
      al = smoothstep(edge, edge - .12, r);
      col *= .82 + .22 * (.5 + .5 * cos(5. * an)) - .12 * smoothstep(.5, .2, r);
      col = mix(col, vec3(.95, .78, .35), smoothstep(.2, .1, r));
    } else if (vKind < 1.5) {               // hanging bell
      vec2 q = c * 2.; q.y += .15;
      float d = length(vec2(q.x * (1.2 + q.y * .6), q.y * .85));
      al = smoothstep(.75, .62, d); col *= .78 + .35 * smoothstep(.7, 0., length(q - vec2(-.15, .2)));
    } else if (vKind < 2.5) {               // bud / bead
      al = smoothstep(.62, .48, r); col *= .75 + .45 * smoothstep(.6, 0., length(c * 2. - vec2(-.2, .25)));
    } else if (vKind < 3.5) {               // leaf
      vec2 q = c * 2.; float wd = .38 * (1. - q.y * q.y);
      al = smoothstep(.04, -.04, abs(q.x) - wd) * step(abs(q.y), .98);
      col *= .8 + .3 * smoothstep(-.4, .4, q.x) - .22 * smoothstep(.04, 0., abs(q.x)) * step(abs(q.y), .9);
    } else if (vKind < 4.5) {               // loose petal
      vec2 q = c * 2.; float d = length(vec2(q.x * 1.6, q.y + .15 * q.x * q.x));
      al = smoothstep(.8, .68, d); col *= .85 + .25 * (1. - d);
    } else {                                // rose
      al = smoothstep(.95, .82, r);
      col *= (.74 + .26 * (.5 + .5 * sin(an * 3. + r * 15.))) * (.74 + .32 * r);
    }
    if (al < .02) discard;
    gl_FragColor = vec4(col, al * min(vA * 2., 1.));
  }` });
let FL = [];
const fl = (x, y, z, c, s, k, g, o = {}) => FL.push({ p: [x, y, z], c, s, k, g, hang: o.hang || 0, fall: o.fall || 0, rot: o.rot ?? rand(0, 6.28) });
function floraPoints() {
  const n = FL.length, P = new Float32Array(n * 3), C = new Float32Array(n * 3), A = ['asize', 'akind', 'arot', 'agrp', 'ahang', 'aseed', 'afall'].map(() => new Float32Array(n));
  FL.forEach((f, i) => { P.set(f.p, i * 3); C.set(f.c, i * 3); A[0][i] = f.s; A[1][i] = f.k; A[2][i] = f.rot; A[3][i] = f.g; A[4][i] = f.hang; A[5][i] = Math.random(); A[6][i] = f.fall; });
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('acol', new THREE.BufferAttribute(C, 3));
  ['asize', 'akind', 'arot', 'agrp', 'ahang', 'aseed', 'afall'].forEach((k, i) => g.setAttribute(k, new THREE.BufferAttribute(A[i], 1)));
  const pts = new THREE.Points(g, floraMat); pts.frustumCulled = false; pts.renderOrder = 6; return pts;
}
const PINK = [.91, .55, .64], DEEP = [.82, .38, .5], BLUSH = [.97, .78, .82], WHITE = [.98, .96, .92], JAS = [.99, .97, .9], LEAF = [.45, .55, .32],
  SAGE = [.58, .65, .48], BEAD = [.86, .68, .36], ROSE = [.6, .07, .13], IVORY = [.96, .9, .82], OLIVE = [.5, .56, .38];
function cluster(cx, cy, cz, rx, ry, n, flowers, leaves, g, sz = 1) {
  for (let i = 0; i < n * .6; i++) { const a = rand(0, 6.28), r = Math.sqrt(Math.random()); fl(cx + Math.cos(a) * rx * r * 1.15, cy + Math.sin(a) * ry * r * 1.15, cz - .02, pick(leaves), rand(.1, .15) * sz, 3, g, { rot: a - 1.57 + rand(-.4, .4) }); }
  for (let i = 0; i < n; i++) { const a = rand(0, 6.28), r = Math.sqrt(Math.random()), f = pick(flowers);
    fl(cx + Math.cos(a) * rx * r, cy + Math.sin(a) * ry * r, cz + rand(0, .04), f.c, rand(f.s * .8, f.s * 1.2) * sz, f.k, g); }
}

/* ---------- props that come and go with each look ---------- */
const stage = new THREE.Group(); scene.add(stage);
let props = [];   // { obj, th, dy, base, pivots, sprites, glows }
function prop(obj, th, dy, extra = {}) { const pr = Object.assign({ obj, th, dy, base: obj.position.y, pivots: [], sprites: [], glows: [] }, extra); stage.add(obj); props.push(pr); return pr; }
const latheMesh = (pts, seg, mat, flat) => { let g = new THREE.LatheGeometry(pts.map(p => new THREE.Vector2(p[0], p[1])), seg); if (flat) { g = g.toNonIndexed(); g.computeVertexNormals(); } return new THREE.Mesh(g, mat); };
const tube = (pts, r, mat) => new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p))), 24, r, 6, false), mat);
function chain(len) { const m = new THREE.Mesh(new THREE.CylinderGeometry(.005, .005, len, 4), gold); m.position.y = -len / 2; return m; }

function makeLantern(s) {
  const g = new THREE.Group();
  g.add(latheMesh([[0, -.1], [.016, -.085], [.032, -.055], [.022, -.035], [.07, -.012], [.105, 0], [.11, .03]], 6, gold, true));
  const glass = new THREE.Mesh(new THREE.CylinderGeometry(.096, .096, .26, 6, 1, true), panelMat); glass.position.y = .16; g.add(glass);
  for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2, b = new THREE.Mesh(new THREE.BoxGeometry(.014, .27, .014), gold); b.position.set(Math.cos(a) * .099, .16, Math.sin(a) * .099); g.add(b); }
  g.add(latheMesh([[.11, .29], [.115, .31], [.09, .34], [.07, .38], [.046, .42], [.03, .45], [.012, .48], [.022, .5], [.01, .53], [0, .54]], 6, gold, true));
  const ring = new THREE.Mesh(new THREE.TorusGeometry(.022, .006, 6, 12), gold); ring.position.y = .56; g.add(ring);
  const h = halo([1, .7, .35], .95, .55); h.position.y = .16; g.add(h);
  g.scale.setScalar(s); return { g, h };
}
function makeChandelier() {
  const g = new THREE.Group(), lights = [], drops = [], tips = [];
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(.008, .008, 3, 5), gold); rod.position.y = 1.8; g.add(rod);
  g.add(latheMesh([[0, -.62], [.025, -.6], [.05, -.54], [.07, -.46], [.05, -.4], [.03, -.34], [.075, -.27], [.11, -.2], [.075, -.13], [.035, -.08], [.03, .02], [.045, .06], [.022, .1], [.02, .28], [.04, .32], [0, .35]], 18, gold));
  const tier = (n, R, y0, sc, off) => {
    for (let i = 0; i < n; i++) {
      const a = (i + off) / n * Math.PI * 2, cx = Math.cos(a), cz = Math.sin(a), P = (r, y) => [cx * r, y, cz * r];
      g.add(tube([P(.05, y0), P(R * .45, y0 - .12 * sc), P(R * .85, y0 - .08 * sc), P(R, y0 + .02 * sc), P(R, y0 + .06 * sc)], .011 * sc, gold));
      const cup = latheMesh([[0, 0], [.045 * sc, 0], [.055 * sc, .012 * sc], [.03 * sc, .024 * sc], [0, .024 * sc]], 10, gold); cup.position.set(cx * R, y0 + .06 * sc, cz * R); g.add(cup);
      const cand = new THREE.Mesh(new THREE.CylinderGeometry(.016 * sc, .016 * sc, .11 * sc, 8), wax); cand.position.set(cx * R, y0 + .14 * sc, cz * R); g.add(cand);
      lights.push(...flame(cx * R, y0 + .22 * sc, cz * R, .9 * sc));
      tips.push([cx * R, y0 + .04 * sc, cz * R]);
    }
  };
  tier(8, .52, -.22, 1, 0); const lower = tips.slice(); tier(6, .3, .04, .8, .5);
  lower.forEach((a, i) => { const b = lower[(i + 1) % lower.length];
    for (let k = 1; k < 8; k++) { const t = k / 8; drops.push([lerp(a[0], b[0], t), lerp(a[1], b[1], t) - .1 - .1 * Math.sin(Math.PI * t), lerp(a[2], b[2], t), 1]); }
    for (let k = 0; k < 3; k++) drops.push([a[0], a[1] - .1 - k * .05, a[2], 1.1 - k * .15]); });
  for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; drops.push([Math.cos(a) * .12, -.46, Math.sin(a) * .12, .9]); drops.push([Math.cos(a) * .09, -.52, Math.sin(a) * .09, .8]); }
  drops.push([0, -.7, 0, 2.4]);
  const im = new THREE.InstancedMesh(new THREE.OctahedronGeometry(.017, 0), crystal, drops.length), M = new THREE.Matrix4(), Q = new THREE.Quaternion(), S = new THREE.Vector3();
  drops.forEach((d, i) => { S.set(d[3], d[3] * 1.7, d[3]); M.compose(new THREE.Vector3(d[0], d[1], d[2]), Q, S); im.setMatrixAt(i, M); });
  g.add(im);
  const pts = glowPoints(lights); g.add(pts);
  const h = halo([.9, .6, .3], 2.6, .35); h.position.y = -.15; g.add(h);
  return { g, h, pts };
}
function makeCandelabra(s) {
  const g = new THREE.Group(), lights = [];
  g.add(latheMesh([[0, 0], [.13, 0], [.14, .025], [.1, .04], [.05, .07], [.04, .12], [.025, .2], [.022, .85], [.04, .88], [.05, .92], [.03, .95], [.025, 1.05], [0, 1.06]], 14, gold));
  [-1, 1].forEach(d => {
    g.add(tube([[0, .95, 0], [d * .12, .9, 0], [d * .24, .98, 0], [d * .26, 1.1, 0]], .012, gold));
    const cand = new THREE.Mesh(new THREE.CylinderGeometry(.02, .02, .16, 8), wax); cand.position.set(d * .26, 1.19, 0); g.add(cand);
    lights.push(...flame(d * .26 * s, 1.3 * s, 0, s));
  });
  const c = new THREE.Mesh(new THREE.CylinderGeometry(.022, .022, .2, 8), wax); c.position.y = 1.16; g.add(c);
  lights.push(...flame(0, 1.29 * s, 0, s));
  g.scale.setScalar(s);
  const pts = glowPoints(lights); const holder = new THREE.Group(); holder.add(g, pts);
  return { g: holder, pts };
}
function makeGlobe(s) {
  const g = new THREE.Group();
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(.03, .036, .04, 10), gold); cap.position.y = .1; g.add(cap);
  const glass = new THREE.Mesh(new THREE.SphereGeometry(.1, 20, 14), globeMat); glass.renderOrder = 6; g.add(glass);
  const h = halo([1, .75, .4], .7, .5); g.add(h);
  const pts = glowPoints([{ p: [0, 0, 0], c: [1, .78, .42], s: .16, k: 2 }, { p: [0, 0, 0], c: [.5, .3, .1], s: .45, k: 0 }]); pts.renderOrder = 8; g.add(pts);
  g.scale.setScalar(s); return { g, h, pts };
}

function build() {
  props.forEach(p => { p.obj.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material && glowMats.includes(o.material)) { glowMats.splice(glowMats.indexOf(o.material), 1); o.material.dispose(); } }); stage.remove(p.obj); });
  props = []; FL = [];
  const vw = halfW(0), sx = Math.min(vw, 2.4) / 1.46, top = VH + .1, k = clamp(.62 / ASP, .42, 1);
  const tieY = lerp(-VH, VH, .4), tieX = vw + .08 - .15 * k * (vw + .16), botX = vw - .36 * k * vw * .6;

  /* intro: jasmine strands, ivory blooms at the ties */
  for (let i = 0; i < 6; i++) {
    const x = (i < 3 ? -1 : 1) * vw * (.3 + (i % 3) * .18) + rand(-.05, .05), L = rand(.35, .8);
    for (let d = .1; d < L; d += .05) fl(x, top - .3 - d, .75, (Math.round(d / .05) % 4 === 0) ? BEAD : JAS, Math.round(d / .05) % 4 === 0 ? .04 : .05, 2, 0, { hang: d / L });
    fl(x, top - .3 - L - .04, .75, WHITE, .1, 0, 0, { hang: 1 });
  }
  [-1, 1].forEach(sd => cluster(sd * tieX, tieY, .42, .16, .12, 14, [{ c: WHITE, s: .11, k: 0 }, { c: IVORY, s: .14, k: 5 }, { c: BEAD, s: .04, k: 2 }], [SAGE], 0));

  /* holud: hanging bells & jasmine, florals at the ties, down the edges and in the corners, falling petals */
  const ns = small ? 9 : 13;
  for (let i = 0; i < ns; i++) {
    const x = lerp(-vw * .92, vw * .92, (i + .5) / ns) + rand(-.06, .06), L = rand(.45, 1.05) * (Math.abs(x) < vw * .3 ? .55 : 1);
    for (let d = .08, j = 0; d < L; d += .062, j++) fl(x, top - .25 - d, .75, j % 3 === 2 ? pick([PINK, DEEP]) : JAS, j % 3 === 2 ? .09 : .05, j % 3 === 2 ? 1 : 2, 1, { hang: d / L, rot: 0 });
    fl(x, top - .25 - L - .05, .75, PINK, .12, 0, 1, { hang: 1 });
  }
  const HF = [{ c: PINK, s: .11, k: 0 }, { c: BLUSH, s: .1, k: 0 }, { c: WHITE, s: .08, k: 0 }, { c: DEEP, s: .09, k: 1 }];
  [-1, 1].forEach(sd => {
    cluster(sd * tieX, tieY, .42, .2, .16, 30, HF, [LEAF, SAGE], 1);
    for (let y = -VH + .3; y < VH - .2; y += .16) { const x = sd * (halfW(.5) - .06 + rand(-.05, .05));
      fl(x + rand(-.05, .05), y, .5, pick([LEAF, SAGE]), rand(.1, .14), 3, 1, { rot: rand(-1, 1) + (sd > 0 ? 1 : -1) });
      if (Math.random() < .6) fl(x + rand(-.06, .06), y + rand(-.05, .05), .52, pick([PINK, BLUSH, WHITE]), rand(.07, .1), 0, 1); }
    cluster(sd * (halfW(.6) - .2), -halfH(.6) + .2, .6, .38, .22, 46, HF, [LEAF, SAGE], 1, 1.1);
  });
  for (let i = 0; i < (small ? 26 : 40); i++) fl(rand(-vw, vw), rand(-VH, VH), .7, pick([PINK, BLUSH, DEEP]), rand(.06, .09), 4, 1, { fall: 1 });

  /* reception: roses at the ties, rosettes at the swag, rose banks on the floor */
  const RF = [{ c: ROSE, s: .13, k: 5 }, { c: ROSE, s: .11, k: 5 }, { c: IVORY, s: .12, k: 5 }, { c: [.98, .95, .9], s: .06, k: 2 }];
  [-1, 1].forEach(sd => {
    cluster(sd * tieX, tieY, .42, .17, .13, 22, RF, [[.3, .4, .25]], 2);
    cluster(sd * (halfW(.6) - .32), -halfH(.6) + .16, .62, .34, .16, 36, RF, [[.3, .4, .25]], 2, 1.1);
  });
  const nSw = ASP < .8 ? 2 : 3;
  for (let i = 0; i <= nSw; i++) { const x = lerp(-1, 1, i / nSw) * (halfW(.46) + .3); if (Math.abs(x) < halfW(.46)) cluster(x, halfH(.5) - .1, .55, .1, .07, 8, RF, [[.3, .4, .25]], 2); }

  /* walima: trailing greenery from the top corners, baby's breath, white blooms at the foot */
  [-1, 1].forEach(sd => {
    for (let v = 0; v < 3; v++) {
      let x = sd * (vw - .05 - v * .22), y = top - .02; const n = 20 + v * 5;
      for (let i = 0; i < n; i++) { x -= sd * rand(.0, .035); y -= rand(.05, .08);
        fl(x + rand(-.03, .03), y, .34, pick([SAGE, OLIVE, [.66, .71, .56]]), rand(.1, .14), 3, 3, { hang: i / n, rot: rand(-.8, .8) + sd * .6 });
        if (Math.random() < .5) fl(x + rand(-.05, .05), y + rand(-.03, .03), .35, WHITE, .035, 2, 3, { hang: i / n }); }
    }
    cluster(sd * tieX, tieY, .42, .14, .12, 14, [{ c: WHITE, s: .1, k: 0 }, { c: WHITE, s: .035, k: 2 }], [SAGE, OLIVE], 3);
    cluster(sd * (halfW(.6) - .3), -halfH(.6) + .14, .62, .36, .14, 34, [{ c: WHITE, s: .1, k: 0 }, { c: [.97, .95, .88], s: .04, k: 2 }, { c: IVORY, s: .12, k: 5 }], [SAGE, OLIVE], 3, 1.05);
  });
  stage.add(floraPoints());

  /* holud lanterns */
  [[-.72, .62, 1.05], [-.24, .26, .9], [.28, .44, 1], [.74, .78, 1.1]].forEach(([fx, len, s]) => {
    const pv = new THREE.Group(); pv.position.set(fx * sx, 0, -.2); pv.add(chain(len));
    const { g, h } = makeLantern(s * (small ? 1.1 : 1.25)); g.position.y = -len - .54 * s * (small ? 1.1 : 1.25); pv.add(g);
    const root = new THREE.Group(); root.position.y = top; root.add(pv);
    prop(root, 1, 2.6, { pivots: [pv], sprites: [h] });
  });

  /* reception chandelier + candelabras */
  { const { g, h, pts } = makeChandelier(); g.position.set(0, -.85, -.6); g.scale.setScalar(small ? 1.25 : 1.4);
    const root = new THREE.Group(); root.position.y = top; root.add(g);
    prop(root, 2, 3.2, { spin: g, sprites: [h], glows: [pts.material] }); }
  [-1, 1].forEach(sd => { const { g, pts } = makeCandelabra(small ? 1 : 1.15); g.position.set(sd * (halfW(.55) - .32), -halfH(.55), .55);
    prop(g, 2, -2.2, { glows: [pts.material] }); });

  /* walima: fairy lights, glass globes, candles */
  { const L = [], g = new THREE.Group(), hw = halfW(.25) + .2;
    for (let s = 0; s < 3; s++) { const y0 = top - .12 - s * .2, sag = .32 + s * .14;
      for (let x = -hw; x <= hw; x += .1) { const t = (x + hw) / (2 * hw); L.push({ p: [x, y0 - sag * Math.sin(Math.PI * t), .25 - s * .1], c: [1, .78, .45], s: .085, k: 2 }); } }
    [-1, 1].forEach(sd => { for (let j = 0; j < 5; j++) { const x = sd * (halfW(.1) * (.62 + j * .085)), len = rand(1.4, 2.6);
      for (let d = 0; d < len; d += .13) L.push({ p: [x + Math.sin(d * 3 + j) * .02, top - .1 - d, .1], c: [1, .8, .5], s: .07, k: 2 }); } });
    const pts = glowPoints(L); g.add(pts); prop(g, 3, 0, { glows: [pts.material] }); }
  [[-.5, .8], [.06, .5], [.56, 1.0]].forEach(([fx, len]) => {
    const pv = new THREE.Group(); pv.position.set(fx * sx, 0, -.1); pv.add(chain(len));
    const { g, h, pts } = makeGlobe(small ? 1.7 : 1.9); g.position.y = -len - .2; pv.add(g);
    const root = new THREE.Group(); root.position.y = top; root.add(pv);
    prop(root, 3, 2.4, { pivots: [pv], sprites: [h], glows: [pts.material] });
  });
  [-1, 1].forEach(sd => { const g = new THREE.Group(), L = [], bx = sd * (halfW(.7) * .5);
    [[0, .32, .06], [.15, .22, .055], [-.14, .4, .065], [.29, .15, .05], [-.27, .18, .05]].forEach(([dx, h, r]) => {
      const c = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 14), wax); c.position.set(bx + dx * sd, -halfH(.7) + h / 2, .7 + rand(-.05, .05)); g.add(c);
      L.push(...flame(c.position.x, -halfH(.7) + h + .05, c.position.z, .8)); });
    const pts = glowPoints(L); g.add(pts); prop(g, 3, -1.2, { glows: [pts.material] }); });

  /* drifting gold dust (all looks) */
  { const L = []; for (let i = 0; i < (small ? 50 : 80); i++) L.push({ p: [rand(-vw, vw), rand(-VH, VH), rand(-.4, .9)], c: [.55, .4, .16], s: rand(.03, .06), k: 2, fall: 1 });
    const pts = glowPoints(L); prop(pts, -1, 0, { glows: [pts.material] }); }
}

/* ---------- resize ---------- */
function resize() {
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h, false); ASP = w / h; camera.aspect = ASP; camera.updateProjectionMatrix(); VW = VH * ASP;
  const db = renderer.getDrawingBufferSize(new THREE.Vector2()); bgU.uRes.value.copy(db); bgU.uAsp.value = ASP; pxScale = db.y / (2 * T);
  layoutCurtains();
  if (Math.abs(w - lastW) > 30) { lastW = w; build(); }
}
resize(); addEventListener('resize', resize);

/* ---------- parallax from tilt / pointer ---------- */
let tx = 0, ty = 0, cx = 0, cy = 0, tilted = 0;
addEventListener('deviceorientation', e => { if (e.gamma == null) return; tilted = performance.now(); tx = clamp(e.gamma / 30, -1, 1); ty = clamp((e.beta - 45) / 30, -1, 1); });
addEventListener('pointermove', e => { if (e.pointerType === 'mouse') { tilted = performance.now(); tx = e.clientX / innerWidth * 2 - 1; ty = e.clientY / innerHeight * 2 - 1; } });

/* ---------- frame ---------- */
let last = performance.now();
const perf = { acc: 0, n: 0, pr: renderer.getPixelRatio() };
function frame() {
  const now = performance.now(), dt = clamp((now - last) / 1000, 0, .05), t = now / 1000; last = now;
  const oa = opened ? (SETTLE || reduce ? 1 : clamp((now - openStart) / 2900, 0, 1)) : 0;
  const ob = opened ? (SETTLE || reduce ? 1 : clamp((now - openStart - 380) / 2900, 0, 1)) : 0;
  const tw = targetW(), kk = SETTLE ? 1 : 1 - Math.exp(-dt * 1.9);
  for (let i = 0; i < 4; i++) W[i] += (tw[i] - W[i]) * kk;
  const dip = (1 - Math.max(...W)) * .5;
  curtains.forEach(({ mat, layer }) => { const u = mat.uniforms; u.uT.value = t; u.uOpen.value = layer ? ease(oa) * (1 - dip * .8) : ease(ob) * (1 - dip * .45); applyLook(mat, layer, false); });
  swags.forEach(({ mat, layer }) => { mat.uniforms.uT.value = t; applyLook(mat, layer, true); });
  bgU.uW.value.set(W[0], W[1], W[2], W[3]); bgU.uT.value = t;
  floraMat.uniforms.uW.value.set(W[0], W[1], W[2], W[3]); floraMat.uniforms.uT.value = t; floraMat.uniforms.uScale.value = pxScale;
  panelMat.uniforms.uT.value = t;
  glowMats.forEach(m => { m.uniforms.uT.value = t; m.uniforms.uScale.value = pxScale; });
  kick *= Math.exp(-dt * 1.4);
  props.forEach(pr => {
    const v = pr.th < 0 ? clamp(W[0] * .8 + W[2] + W[3] * .9 + W[1] * .4, 0, 1) : (opened || pr.th === 0 ? W[pr.th] : 0), e = ease(clamp(v, 0, 1));
    pr.obj.visible = v > .004; pr.obj.position.y = pr.base + (1 - e) * pr.dy;
    pr.pivots.forEach((p, i) => { p.rotation.z = Math.sin(t * .9 + i * 1.7) * (.02 + kick * .09) + (1 - e) * .25 * Math.sin(t * 2.2 + i); p.rotation.y = t * .25 + i; });
    if (pr.spin) { pr.spin.rotation.y = t * .1; pr.spin.rotation.z = Math.sin(t * .7) * (.008 + kick * .04); }
    pr.sprites.forEach(s => { s.material.opacity = e * s.userData.op * (.9 + .1 * Math.sin(t * 6 + s.id)); });
    pr.glows.forEach(m => { m.uniforms.uVis.value = e; });
  });
  if (!tilted || now - tilted > 4000) { tx = Math.sin(t * .23) * .5; ty = Math.sin(t * .17) * .3; }
  cx += (tx - cx) * (1 - Math.exp(-dt * 2)); cy += (ty - cy) * (1 - Math.exp(-dt * 2));
  camera.position.set(cx * .16, -cy * .1, CZ); camera.lookAt(0, 0, 0);
  renderer.render(scene, camera);
  // keep it fluid on slower phones: if frames run long for a while, render at a lower pixel ratio
  if (!SETTLE) { perf.acc += dt; perf.n++; if (perf.acc > 1.5) { const avg = perf.acc / perf.n;
    if (avg > .024 && perf.pr > 1) { perf.pr = Math.max(1, perf.pr - .25); renderer.setPixelRatio(perf.pr); resize(); }
    perf.acc = 0; perf.n = 0; } }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
window.__state = () => JSON.stringify({ opened, W: W.map(v => +v.toFixed(2)), props: props.length, flora: FL.length });
}

/* ================= interaction ================= */
$('#open').addEventListener('click', () => {
  if (opened) return; opened = true; openStart = performance.now();
  music.start(); musicBtn.hidden = false; swish();
  $('#gate').classList.add('gone');
  setTimeout(() => { document.body.classList.remove('locked'); onScroll(); }, SETTLE || reduce ? 0 : 2000);
});
addEventListener('pointerdown', e => { if (!opened || e.target.closest('a, button')) return; kick = 1; chime(pick([74, 76, 79])); });

/* ================= scroll: reveal each card, chime when the look changes ================= */
function onScroll() {
  if (!opened) return;
  stops.forEach(s => { const r = s.getBoundingClientRect(); s.classList.toggle('in', r.top < innerHeight * .7 && r.bottom > innerHeight * .3); });
  const w = targetW(), th = w.indexOf(Math.max(...w));
  if (th !== lastTheme && Math.max(...w) > .9) { lastTheme = th; kick = .8; swish(); setTimeout(() => chime([74, 74, 69, 71][th] || 74), 250); }
}
addEventListener('scroll', onScroll, { passive: true });

/* ================= countdown to the Holud ================= */
const target = new Date('2026-12-30T15:00:00+06:00').getTime();
const cd = ['d', 'h', 'm', 's'].map(k => $('#cd-' + k));
function count() { const s = Math.max(0, Math.floor((target - Date.now()) / 1000));
  [Math.floor(s / 86400), Math.floor(s % 86400 / 3600), Math.floor(s % 3600 / 60), s % 60].forEach((n, i) => cd[i].textContent = String(n).padStart(2, '0')); }
count(); setInterval(count, 1000);
})();
