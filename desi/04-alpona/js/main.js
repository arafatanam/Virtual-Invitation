/* Alpona — ~15,000 grains of coloured powder pour into a Bengali alpona, ringed by 24 brass lanterns that light one by one.
   Each section blows the powder up into the air and lets it settle as a new design (including an eight-point Islamic star);
   the last one spells the couple's names. Tap a lantern to light it, drag a finger to draw with a sparkler. */
(() => {
'use strict';
const $ = s => document.querySelector(s);
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const small = Math.min(innerWidth, innerHeight) < 600;
const rand = (a = 0, b = 1) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const SETTLE = location.hash === '#settle';   // test hook

/* ================= music: sitar in raag Bhupali over a drone and soft tabla ================= */
const mel = { 0: [74, 0], 2: [71, 0], 3: [69, 0], 4: [66, 1], 6: [69, 0], 8: [71, 2], 10: [69, 0], 11: [66, 0], 12: [64, 0], 14: [62, 0], 16: [66, 0], 18: [69, 0], 20: [71, 0], 22: [74, 0], 24: [76, 2], 26: [74, 0],
  28: [71, 0], 30: [69, 0], 32: [71, 0], 33: [69, 0], 34: [66, 0], 36: [64, 1], 38: [66, 0], 40: [69, 0], 44: [66, 0], 46: [64, 0], 48: [62, 0], 52: [64, 0], 54: [66, 0], 56: [62, 2] };
const music = createMusic({ spb: .22, reverb: .5, volume: .8, fadeIn: 3, play(step, t, tone, noise, pluck) {
  if (step % 2 === 0) pluck([57, 62, 62, 50][(step >> 1) % 4], t, { vol: .09, buzz: .6, bright: .4, dur: 2.4 });
  const k = step % 8;
  if (k === 0 || k === 6) tone(45, t, { dur: .45, vol: .14, slide: 4 });
  if (k === 2 || k === 4 || k === 7) tone(76, t, { dur: .12, vol: .035, partials: [[1, 1], [2.02, .4], [2.98, .2]] });
  const m = mel[step % 64];
  if (m) { pluck(m[0], t, { vol: .2, buzz: .45, bright: .7, bend: m[1], bendTime: .18, dur: 1.6 }); if (step % 16 === 0) pluck(m[0] + 12, t + .02, { vol: .05, buzz: .3, dur: 1 }); }
}});
const musicBtn = $('#music');
musicBtn.addEventListener('click', () => { const on = music.toggle(); musicBtn.classList.toggle('off', !on); musicBtn.setAttribute('aria-label', on ? 'Pause music' : 'Play music'); });
const fwoomp = (v = 1) => music.sfx((t, tone, noise, pluck) => { noise(t, { dur: .35, vol: .07 * v, freq: 900, type: 'lowpass' }); pluck(86 + Math.floor(rand(0, 3)) * 2, t + .05, { vol: .06 * v, dur: .8 }); });

/* ================= alpona patterns (region functions on the floor disc) ================= */
const C = { white: 0xfff4e6, yellow: 0xffc233, sun: 0xffd23f, pink: 0xff5fa2, magenta: 0xd6125a, orange: 0xff7a1a, teal: 0x0e8c74, green: 0x2fbf71, purple: 0x7b2cbf, blue: 0x2350c8, red: 0xd7263d, deep: 0x5a0e3a };
const TAU = Math.PI * 2;
const local = (th, n, off = 0) => { const s = TAU / n; return ((th - off) % s + s * 1.5) % s - s / 2; };
function petalD(r, th, n, r0, r1, w, off = 0) { if (r < r0 || r > r1) return 9; const t = (r - r0) / (r1 - r0); return (Math.abs(local(th, n, off)) - w * Math.pow(Math.sin(Math.PI * Math.pow(t, .75)), .8)) * r; }
function dots(r, th, R, n, size) { const a = Math.round(th / TAU * n) / n * TAU; return Math.hypot(r * Math.cos(th) - R * Math.cos(a), r * Math.sin(th) - R * Math.sin(a)) < size; }
const EDGE = .055;
const PATTERNS = [
  // 0 · lotus
  (x, z) => { const r = Math.hypot(x, z), th = Math.atan2(z, x);
    if (r > 3.15) return null;
    if (dots(r, th, 3.02, 40, .075)) return C.white;
    if (r > 2.9) return null;
    if (r < .3) return C.sun; if (r < .38) return C.white;
    const a = petalD(r, th, 8, .38, 1.8, .34);
    if (a < -EDGE) return r < 1.05 ? C.magenta : C.pink; if (a < 0) return C.white;
    const b = petalD(r, th, 8, .85, 2.35, .26, Math.PI / 8);
    if (b < -EDGE) return r < 1.6 ? C.yellow : C.orange; if (b < 0) return C.white;
    if (r < 2.42) return C.teal; if (r < 2.5) return C.white;
    const sc = 2.86 - .16 * Math.abs(Math.sin(th * 12));
    if (r < sc - EDGE) return C.yellow; if (r < sc) return C.white;
    return null; },
  // 1 · twelve-point star
  (x, z) => { const r = Math.hypot(x, z), th = Math.atan2(z, x);
    if (dots(r, th, 3.05, 48, .07)) return C.yellow;
    const s = .62 + .38 * Math.pow(Math.abs(Math.cos(th * 6)), 1.6), u = r / (2.95 * s);
    if (u > 1) return null;
    const p = petalD(r, th, 6, .1, 1.2, .4);
    if (p < -EDGE) return C.orange; if (p < 0) return C.white;
    if (u < .16) return C.sun; if (u < .2) return C.white; if (u < .44) return C.magenta; if (u < .48) return C.white;
    if (u < .7) return C.purple; if (u < .74) return C.white; if (u < .95) return C.green; return C.white; },
  // 2 · eight-point Islamic star (khatam)
  (x, z) => { const r = Math.hypot(x, z), th = Math.atan2(z, x);
    if (r > 3.15) return null;
    if (dots(r, th, 3.02, 32, .075)) return C.yellow;
    const d = Math.min(Math.max(Math.abs(x), Math.abs(z)), Math.max(Math.abs(x + z), Math.abs(x - z)) / Math.SQRT2);
    if (d > 2.25) return r < 2.9 && r > 2.78 ? C.white : null;
    const bands = [[.35, C.sun], [.45, C.white], [.95, C.green], [1.05, C.white], [1.5, C.blue], [1.6, C.white], [2.05, C.red], [2.25, C.white]];
    for (const [lim, col] of bands) if (d < lim) return col;
    return null; },
  // 3 · ring of hearts
  (x, z) => { const r = Math.hypot(x, z), th = Math.atan2(z, x);
    if (r > 3.15) return null;
    if (r > 2.85 && r < 3.0) return C.white;
    if (dots(r, th, 2.7, 30, .06)) return C.yellow;
    const a = Math.round(th / TAU * 8) / 8 * TAU, ca = Math.cos(-a), sa = Math.sin(-a);
    let lx = (x * ca - z * sa - 1.75) / .62, ly = (x * sa + z * ca) / .62;
    [lx, ly] = [ly, -lx];   // point outwards
    const h = Math.pow(lx * lx + ly * ly - 1, 3) - lx * lx * ly * ly * ly;
    if (h < -.04) return C.red; if (h < .02) return C.white;
    if (r < .9) { const p = petalD(r, th, 8, .12, .9, .38); if (p < -EDGE) return C.pink; if (p < 0) return C.white; if (r < .14) return C.sun; return C.deep; }
    if (r < 2.62) return r < 1 ? C.white : C.deep;
    return null; },
];
// 4 · the couple's names, written in powder
let nameMask = null;
function buildNameMask() {
  const S = 512, c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d');
  x.fillStyle = '#000'; x.fillRect(0, 0, S, S); x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillStyle = '#f00'; x.font = '700 104px Laila, Georgia, serif'; x.fillText('Sadia', S / 2, S * .33); x.font = '700 96px Laila, Georgia, serif'; x.fillText('Rafsan', S / 2, S * .69);
  x.fillStyle = '#ff0'; x.font = '700 80px Laila, Georgia, serif'; x.fillText('&', S / 2, S * .51);
  nameMask = { S, d: x.getImageData(0, 0, S, S).data };
}
PATTERNS.push((x, z) => {
  const r = Math.hypot(x, z), th = Math.atan2(z, x);
  if (r > 3.15) return null;
  if (dots(r, th, 3.02, 44, .075)) return C.yellow;
  if (r > 2.82 && r < 2.92) return C.white;
  if (r > 2.92) return null;
  const S = nameMask.S, px = Math.floor((x / 5.6 + .5) * S), py = Math.floor((z / 5.6 + .5) * S);
  if (px < 0 || py < 0 || px >= S || py >= S) return C.deep;
  const i = (py * S + px) * 4, R = nameMask.d[i], G = nameMask.d[i + 1];
  if (R > 120 && G > 120) return C.orange; if (R > 120) return C.sun;
  return r < 2.82 ? (Math.abs(Math.sin(th * 20)) > .985 ? C.pink : C.deep) : null;
});

/* ================= renderer ================= */
let renderer;
try { renderer = new THREE.WebGLRenderer({ canvas: $('#scene'), antialias: false, powerPreference: 'high-performance' }); }
catch (e) { document.body.classList.remove('locked'); $('#gate').remove(); document.querySelectorAll('.stop').forEach(s => s.classList.add('in')); return; }
const DPR = Math.min(devicePixelRatio || 1, small ? 1.6 : 1.75);
renderer.setPixelRatio(DPR);
renderer.setClearColor(0x0b0716, 1);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, .1, 100);
const world = new THREE.Group(); scene.add(world);

/* ---------- lamps ---------- */
const ND = 24, RING = 3.55;
const lamps = Array.from({ length: ND }, (_, i) => { const a = i / ND * TAU; return { x: Math.cos(a) * RING, z: Math.sin(a) * RING, lit: 0, target: 0 }; });

/* ---------- floor: dark stone warmed by the lamps ---------- */
const floorU = { uLit: { value: new Array(ND).fill(0) }, uTime: { value: 0 } };
const floor = new THREE.Mesh(new THREE.CircleGeometry(16, 64), new THREE.ShaderMaterial({ uniforms: floorU,
  vertexShader: `varying vec2 vP;void main(){vP=position.xy;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
  fragmentShader: `varying vec2 vP;uniform float uLit[${ND}];uniform float uTime;
    float h(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
    void main(){vec2 p=vec2(vP.x,-vP.y);float g=0.;
      for(int i=0;i<${ND};i++){float a=float(i)/${ND}.*6.28318;vec2 d=p-vec2(cos(a),sin(a))*${RING.toFixed(2)};g+=uLit[i]*exp(-dot(d,d)*2.2);}
      float n=h(floor(vP*18.))*.04;float vig=smoothstep(14.,3.,length(vP));
      vec3 c=vec3(.045,.03,.07)+n+vec3(1.,.5,.18)*g*.34+vec3(.5,.25,.1)*g*g*.08;
      gl_FragColor=vec4(c*vig,1.);}` }));
floor.rotation.x = -Math.PI / 2; world.add(floor);

// clay bowls
const bowlGeo = new THREE.LatheGeometry([[0, 0], [.14, .01], [.22, .06], [.25, .11], [.22, .12], [.05, .06]].map(([x, y]) => new THREE.Vector2(x, y)), 16);
const bowls = new THREE.InstancedMesh(bowlGeo, new THREE.MeshStandardMaterial({ color: 0xd9a845, metalness: .8, roughness: .3 }), ND);
const dummy = new THREE.Object3D();
lamps.forEach((d, i) => { dummy.position.set(d.x, 0, d.z); dummy.updateMatrix(); bowls.setMatrixAt(i, dummy.matrix); });
world.add(bowls);
const bowlLight = new THREE.PointLight(0xff9a40, 0, 9, 2); bowlLight.position.y = 1.2; world.add(bowlLight);
scene.add(new THREE.AmbientLight(0x6a4060, .5));
const flameGeo = new THREE.BufferGeometry();
flameGeo.setAttribute('position', new THREE.Float32BufferAttribute(lamps.flatMap(d => [d.x, .23, d.z]), 3));
flameGeo.setAttribute('seed', new THREE.Float32BufferAttribute(lamps.map(() => rand(0, 100)), 1));
const litAttr = new THREE.Float32BufferAttribute(new Float32Array(ND), 1); flameGeo.setAttribute('lit', litAttr);
const flameU = { uTime: { value: 0 }, uScale: { value: 1 } };
world.add(new THREE.Points(flameGeo, new THREE.ShaderMaterial({ uniforms: flameU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  vertexShader: `attribute float seed,lit;uniform float uTime,uScale;varying float vF;void main(){vF=lit*(.82+.18*sin(uTime*13.+seed)*sin(uTime*7.3+seed*2.));
    vec4 mv=modelViewMatrix*vec4(position+vec3(0.,.1*lit,0.),1.);gl_PointSize=uScale*.95*vF/-mv.z;gl_Position=projectionMatrix*mv;}`,
  fragmentShader: `varying float vF;void main(){vec2 p=gl_PointCoord*2.-1.;p.y=-p.y;
    float body=1.-smoothstep(0.,1.,length(vec2(p.x*1.9/(1.1-p.y*.45),(p.y+.25)*1.05)));float halo=exp(-dot(p,p)*3.)*.4;
    vec3 c=mix(vec3(1.,.45,.08),vec3(1.,.96,.78),body*body);gl_FragColor=vec4(c*(body*1.7+halo)*vF,1.);}` })));

/* ---------- the powder ---------- */
const NP = small ? 11000 : 17000;
const aA = new Float32Array(NP * 3), aB = new Float32Array(NP * 3), cA = new Float32Array(NP * 3), cB = new Float32Array(NP * 3), ord = new Float32Array(NP), rnd = new Float32Array(NP);
const tmpC = new THREE.Color();
function sample(pi, posArr, colArr) {
  const f = PATTERNS[pi]; let n = 0, guard = 0;
  while (n < NP && guard++ < NP * 60) {
    const r = 3.2 * Math.sqrt(Math.random()), a = Math.random() * TAU, x = r * Math.cos(a), z = r * Math.sin(a), col = f(x, z);
    if (col == null) continue;
    posArr[n * 3] = x; posArr[n * 3 + 1] = rand(0, .025); posArr[n * 3 + 2] = z;
    tmpC.setHex(col); const v = rand(.82, 1.08); colArr[n * 3] = tmpC.r * v; colArr[n * 3 + 1] = tmpC.g * v; colArr[n * 3 + 2] = tmpC.b * v; n++;
  }
}
sample(0, aB, cB); aA.set(aB); cA.set(cB);
for (let i = 0; i < NP; i++) { const x = aB[i * 3], z = aB[i * 3 + 2], r = Math.hypot(x, z), th = (Math.atan2(z, x) + Math.PI) / TAU; ord[i] = r / 3.2 * .82 + th * .14 + Math.random() * .04; rnd[i] = Math.random(); }
const pGeo = new THREE.BufferGeometry();
pGeo.setAttribute('position', new THREE.BufferAttribute(aB, 3));
pGeo.setAttribute('aA', new THREE.BufferAttribute(aA, 3)); pGeo.setAttribute('cA', new THREE.BufferAttribute(cA, 3)); pGeo.setAttribute('cB', new THREE.BufferAttribute(cB, 3));
pGeo.setAttribute('ord', new THREE.BufferAttribute(ord, 1)); pGeo.setAttribute('rnd', new THREE.BufferAttribute(rnd, 1));
const powderU = { uDraw: { value: 0 }, uMix: { value: 1 }, uTime: { value: 0 }, uScale: { value: 1 }, uGlow: { value: 0 } };
const powder = new THREE.Points(pGeo, new THREE.ShaderMaterial({ uniforms: powderU, transparent: true, depthWrite: false,
  vertexShader: `attribute vec3 aA,cA,cB;attribute float ord,rnd;uniform float uDraw,uMix,uTime,uScale,uGlow;varying vec3 vC;varying float vV;
    void main(){float l=clamp((uDraw-ord)*9.,0.,1.);vV=step(.001,l);
      vec3 t=mix(aA,position,smoothstep(0.,1.,uMix));
      float arc=sin(uMix*3.14159);float ang=rnd*6.2832+uTime*1.5;
      t+=vec3(cos(ang),0.,sin(ang))*arc*(.4+rnd*.8);t.y+=arc*(.8+rnd*2.2);
      vec3 sp=t+vec3((rnd-.5)*.25,1.6+rnd*.8,(fract(rnd*7.)-.5)*.25);
      vec3 p=mix(sp,t,1.-pow(1.-l,3.));
      float ring=smoothstep(2.2,3.4,length(t.xz));
      vC=mix(cA,cB,smoothstep(.3,.7,uMix))*(.62+uGlow*(.3+ring*.35))*(1.+arc*.4);
      vec4 mv=modelViewMatrix*vec4(p,1.);gl_PointSize=uScale*(.072+arc*.03)/-mv.z;gl_Position=projectionMatrix*mv;}`,
  fragmentShader: `varying vec3 vC;varying float vV;void main(){if(vV<.5)discard;vec2 q=gl_PointCoord-.5;float d=max(abs(q.x),abs(q.y));if(d>.5)discard;gl_FragColor=vec4(vC*(1.-d*.5),1.);}` }));
world.add(powder);
let morphing = false, curPattern = 0;
function morphTo(pi) {
  if (pi === curPattern) return; curPattern = pi;
  if (pi === 4 && !nameMask) buildNameMask();
  // freeze where we are into A, sample the new pattern into B
  const m = powderU.uMix.value;
  for (let i = 0; i < NP * 3; i++) { aA[i] = aA[i] + (aB[i] - aA[i]) * m; cA[i] = cA[i] + (cB[i] - cA[i]) * m; }
  sample(pi, aB, cB);
  ['position', 'aA', 'cA', 'cB'].forEach(k => pGeo.attributes[k].needsUpdate = true);
  powderU.uMix.value = SETTLE ? 1 : 0; morphing = !SETTLE;
  music.sfx((t, tone, noise) => noise(t, { dur: 1.4, vol: .06, freq: 1200, type: 'bandpass', q: .4 }));
}

/* ---------- post ---------- */
let composer = null;
if (THREE.EffectComposer && THREE.UnrealBloomPass) {
  composer = new THREE.EffectComposer(renderer);
  composer.addPass(new THREE.RenderPass(scene, camera));
  composer.addPass(new THREE.UnrealBloomPass(new THREE.Vector2(innerWidth / 2, innerHeight / 2), .75, .5, .78));
}

/* ---------- camera framing (portrait first) ---------- */
function resize() {
  renderer.setSize(innerWidth, innerHeight, false); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  if (composer) composer.setSize(innerWidth, innerHeight);
  const S = innerHeight * DPR * .5; flameU.uScale.value = S; powderU.uScale.value = S;
  sizeSparks();
}
function placeCamera() {
  const a = camera.aspect, half = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  const dist = Math.max(9, 8.3 / (2 * half * Math.min(a, 1.3)));
  const tilt = THREE.MathUtils.degToRad(a < 1 ? 62 : 52);
  camera.position.set(0, Math.sin(tilt) * dist, Math.cos(tilt) * dist);
  camera.lookAt(0, 0, a < 1 ? 2.2 : .6);
}

/* ---------- sparklers (2D overlay) ---------- */
const sc = $('#sparks'), sx = sc.getContext('2d');
let SW, SH, SD;
function sizeSparks() { SD = Math.min(devicePixelRatio || 1, 1.5); SW = innerWidth; SH = innerHeight; sc.width = SW * SD; sc.height = SH * SD; sx.setTransform(SD, 0, 0, SD, 0, 0); }
resize(); addEventListener('resize', resize);
const sparks = [];
function emit(x, y, n, speed = 4) { for (let i = 0; i < n; i++) { const a = rand(0, TAU), s = rand(.5, speed); sparks.push({ x, y, px: x, py: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: rand(.4, 1), hue: rand(30, 55) }); } }
function drawSparks(dt) {
  sx.globalCompositeOperation = 'source-over'; sx.clearRect(0, 0, SW, SH);
  sx.globalCompositeOperation = 'lighter'; sx.lineCap = 'round';
  for (let i = sparks.length - 1; i >= 0; i--) {
    const p = sparks[i]; p.px = p.x; p.py = p.y; p.vy += .08 * dt * 60; p.vx *= .97; p.x += p.vx * dt * 60; p.y += p.vy * dt * 60; p.life -= dt * 1.4;
    if (p.life <= 0) { sparks.splice(i, 1); continue; }
    sx.strokeStyle = `hsla(${p.hue},100%,${60 + p.life * 30}%,${p.life})`; sx.lineWidth = 1.6 * p.life + .4;
    sx.beginPath(); sx.moveTo(p.px, p.py); sx.lineTo(p.x, p.y); sx.stroke();
    if (Math.random() < .03 && p.life > .5) emit(p.x, p.y, 2, 1.5);
  }
}

/* ---------- interaction: tap a lantern, draw with a sparkler ---------- */
const V = new THREE.Vector3();
let started = false, down = null, lastEmit = 0;
function lampAt(cx, cy) {
  let best = -1, bd = 46;
  lamps.forEach((d, i) => { V.set(d.x, .2, d.z); world.localToWorld(V); V.project(camera);
    const px = (V.x * .5 + .5) * innerWidth, py = (-V.y * .5 + .5) * innerHeight, dd = Math.hypot(px - cx, py - cy); if (dd < bd) { bd = dd; best = i; } });
  return best;
}
const canvas = $('#scene');
canvas.addEventListener('pointerdown', e => { down = { x: e.clientX, y: e.clientY, t: performance.now() }; });
addEventListener('pointermove', e => {
  if (!started) return;
  const now = performance.now();
  if (e.pointerType === 'mouse' || down) { if (now - lastEmit > 16) { emit(e.clientX, e.clientY, down ? 7 : 3, down ? 3.5 : 2); lastEmit = now; } }
});
addEventListener('pointerup', e => {
  if (!started || !down) { down = null; return; }
  if (Math.hypot(e.clientX - down.x, e.clientY - down.y) < 10 && performance.now() - down.t < 450) {
    const i = lampAt(e.clientX, e.clientY);
    if (i >= 0) { lamps[i].target = lamps[i].target > .5 ? 0 : 1; if (lamps[i].target) fwoomp(); emit(e.clientX, e.clientY, 30, 4); }
    else emit(e.clientX, e.clientY, 40, 5);
  }
  down = null;
});

/* ---------- animate ---------- */
const clock = new THREE.Clock();
let drawT = 0, drawing = false;
function frame() {
  const dt = Math.min(clock.getDelta(), .05), t = clock.elapsedTime;
  placeCamera();
  // turntable, easing to "upright" for the names
  if (curPattern === 4) { const tgt = Math.round(world.rotation.y / TAU) * TAU; world.rotation.y += (tgt - world.rotation.y) * Math.min(1, dt * 1.5); }
  else world.rotation.y += dt * .06;
  if (drawing) { drawT += dt / (reduce ? .3 : 7); powderU.uDraw.value = SETTLE ? 1.2 : drawT * 1.15; if (drawT >= 1) drawing = false; }
  if (morphing) { powderU.uMix.value = Math.min(1, powderU.uMix.value + dt / 2.6); if (powderU.uMix.value >= 1) morphing = false; }
  let litSum = 0;
  lamps.forEach((d, i) => { d.lit += (d.target - d.lit) * Math.min(1, dt * (d.target ? 5 : 3)); if (SETTLE) d.lit = d.target; litAttr.array[i] = d.lit; floorU.uLit.value[i] = d.lit; litSum += d.lit; });
  litAttr.needsUpdate = true;
  powderU.uGlow.value = .35 + litSum / ND * .9 + music.level() * .2;
  bowlLight.intensity = litSum / ND * 1.4;
  flameU.uTime.value = t; powderU.uTime.value = t; floorU.uTime.value = t;
  composer ? composer.render() : renderer.render(scene, camera);
  drawSparks(dt);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

/* ---------- gate: light the lamps, pour the alpona ---------- */
$('#open').addEventListener('click', () => {
  music.start(); musicBtn.hidden = false; started = true;
  $('#gate').classList.add('gone');
  // first lantern at the front, then a spiral around the ring
  const order = [...lamps.keys()].sort((a, b) => ((a - 6 + ND) % ND) - ((b - 6 + ND) % ND));
  order.forEach((i, k) => setTimeout(() => { lamps[i].target = 1; if (k % 3 === 0) fwoomp(.6); }, reduce || SETTLE ? 0 : 300 + k * 140));
  setTimeout(() => { drawing = true; drawT = 0; }, reduce || SETTLE ? 0 : 1200);
  setTimeout(() => document.body.classList.remove('locked'), reduce || SETTLE ? 0 : 2400);
});

/* ---------- scroll: each stop pours a new alpona ---------- */
const stops = [...document.querySelectorAll('.stop')];
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) e.target.classList.add('in'); }), { threshold: .2 });
stops.forEach(s => io.observe(s));
function onScroll() {
  if (!started) return;
  const mid = innerHeight * .5; let cur = stops[0];
  stops.forEach(s => { if (s.getBoundingClientRect().top < mid) cur = s; });
  const p = +cur.dataset.pattern; if (p !== curPattern) morphTo(p);
}
addEventListener('scroll', onScroll, { passive: true });
window.__state = () => 'pattern=' + curPattern + ' mix=' + powderU.uMix.value.toFixed(2);

/* ---------- countdown ---------- */
const target = new Date('2027-12-11T17:00:00+06:00').getTime();
const cd = ['d', 'h', 'm', 's'].map(k => $('#cd-' + k));
function count() { const s = Math.max(0, Math.floor((target - Date.now()) / 1000));
  [Math.floor(s / 86400), Math.floor(s % 86400 / 3600), Math.floor(s % 3600 / 60), s % 60].forEach((n, i) => cd[i].textContent = String(n).padStart(2, '0')); }
count(); setInterval(count, 1000);

/* ---------- RSVP ---------- */
$('#form').addEventListener('submit', e => {
  e.preventDefault();
  const name = $('#f-name').value.trim(), ev = [...document.querySelectorAll('fieldset input:checked')].map(i => i.value), n = +$('#f-count').value, err = $('#err');
  if (!name) { err.textContent = 'Please tell us your name.'; $('#f-name').focus(); return; }
  if (!ev.length) { err.textContent = 'Choose at least one event.'; return; }
  err.textContent = '';
  // NOTE: connect a form backend here (Google Forms, Formspree, Supabase…) — { name, events: ev, guests: n }
  const list = ev.length > 1 ? ev.slice(0, -1).join(', ') + ' and ' + ev.at(-1) : ev[0];
  $('#thanks-msg').textContent = `${name.split(' ')[0]}, your lantern is lit. We’ll see ${n > 1 ? 'all ' + n + ' of you' : 'you'} at the ${list}.`;
  $('.rsvp').classList.add('sent');
  lamps.forEach(d => d.target = 1);
  for (let i = 0; i < 6; i++) setTimeout(() => emit(rand(.15, .85) * innerWidth, rand(.1, .4) * innerHeight, 60, 6), i * 220);
  fwoomp(1.4);
});
})();
