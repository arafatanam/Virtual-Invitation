/* Churiyan — glass, gold and kundan bangles drop one by one onto an invisible wrist (each with its own clink),
   jingle when tapped, and re-form into a new shape and colour for every event as you scroll. */
(() => {
'use strict';
const $ = s => document.querySelector(s);
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const small = Math.min(innerWidth, innerHeight) < 600;
const rand = (a = 0, b = 1) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const SETTLE = location.hash === '#settle';   // test hook: skip the physics and show final shapes

/* ================= music: Bengali folk — dotara, khol, kartal and bangles ================= */
// Sa = E (64), folk scale with a flat seventh
const tune = [76, 0, 74, 76, 79, 0, 76, 0, 74, 72, 71, 0, 69, 0, 71, 72, 74, 0, 72, 71, 69, 0, 67, 69, 71, 0, 0, 0, 64, 0, 0, 0,
              69, 0, 71, 72, 74, 0, 76, 74, 72, 0, 71, 69, 71, 0, 72, 0, 74, 0, 72, 71, 69, 71, 69, 67, 64, 0, 0, 0, 0, 0, 0, 0];
let jingleHook = () => {};
const clinkSfx = (t, tone, v = 1, m = 98) => tone(m + rand(-3, 5), t, { dur: .55, vol: .045 * v, partials: [[1, 1, 1], [2.76, .5, .6], [5.4, .3, .4], [8.93, .2, .3]] });
const music = createMusic({ spb: .16, reverb: .32, volume: .82, play(step, t, tone, noise, pluck) {
  const k = step % 8;
  if (k === 0 || k === 5) { tone(41, t, { dur: .4, vol: .3, slide: 3 }); noise(t, { dur: .05, vol: .05, freq: 240, type: 'lowpass' }); }   // khol bass
  if (k === 2 || k === 6) { tone(81, t, { dur: .1, vol: .05, partials: [[1, 1], [1.5, .5], [2.3, .3]] }); noise(t, { dur: .05, vol: .05, freq: 2800, type: 'bandpass', q: 1.2 }); }
  if (k === 3 || k === 7) noise(t, { dur: .09, vol: .03, freq: 6500, type: 'bandpass', q: 3 });   // kartal
  if (k === 4 || k === 1) { for (let i = 0; i < 3; i++) clinkSfx(t + i * .03, tone, .5, 100 + i * 2); setTimeout(() => jingleHook(.25), Math.max(0, (t - music.time()) * 1000)); }
  const m = tune[step % tune.length];
  if (m) pluck(m, t, { vol: .2, bright: .8, dur: 1 });
  if (step % 16 === 0) pluck(52, t, { vol: .14, bright: .5, dur: 2.4 });
  if (step % 16 === 8) pluck(59, t, { vol: .1, bright: .5, dur: 2 });
}});
const musicBtn = $('#music');
musicBtn.addEventListener('click', () => { const on = music.toggle(); musicBtn.classList.toggle('off', !on); musicBtn.setAttribute('aria-label', on ? 'Pause music' : 'Play music'); });

/* ================= renderer ================= */
let renderer;
try { renderer = new THREE.WebGLRenderer({ canvas: $('#scene'), antialias: true, powerPreference: 'high-performance' }); }
catch (e) { document.body.classList.remove('locked'); $('#gate').remove(); document.querySelectorAll('.stop').forEach(s => s.classList.add('in')); return; }
const DPR = Math.min(devicePixelRatio || 1, small ? 1.6 : 1.75);
renderer.setPixelRatio(DPR);
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = .95;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(42, innerWidth / innerHeight, .1, 100);

// reflections: a jewel-box room of warm lights
const pmrem = new THREE.PMREMGenerator(renderer);
const envScene = new THREE.Scene(); envScene.background = new THREE.Color(0x140610);
[[0xffd27a, [0, 6, 2], 5], [0xff5a8a, [6, 1, 0], 3.5], [0x5ad1ff, [-6, 2, 1], 2.4], [0xffffff, [0, 1, 7], 3.2], [0xffa040, [-3, -5, -3], 2.6], [0xb07cff, [3, 3, -6], 2.4]].forEach(([c, p, s]) => {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(s, s), new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(1.1), side: THREE.DoubleSide }));
  m.position.set(...p); m.lookAt(0, 0, 0); envScene.add(m);
});
const envTex = pmrem.fromScene(envScene, .02).texture;
scene.environment = envTex;

// backdrop: soft velvet gradient whose colour follows the section
const bgU = { uA: { value: new THREE.Color(0x3a0b2c) }, uB: { value: new THREE.Color(0x0c0309) }, uT: { value: 0 } };
const bg = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.ShaderMaterial({ uniforms: bgU, depthWrite: false,
  vertexShader: `varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
  fragmentShader: `varying vec2 vUv;uniform vec3 uA,uB;uniform float uT;void main(){vec2 p=vUv-vec2(.5,.56);float d=length(p*vec2(1.,.8));
    float rays=.5+.5*sin(atan(p.y,p.x)*14.+uT*.2);vec3 c=mix(uA,uB,smoothstep(.0,.16,d));c+=uA*rays*.05*(1.-smoothstep(0.,.25,d));gl_FragColor=vec4(c,1.);}` }));
bg.position.z = -12; scene.add(bg);

/* ---------- bangles ---------- */
const N = small ? 20 : 26;
const glassGeo = new THREE.TorusGeometry(1, .07, 14, 80);
const goldGeo = new THREE.TorusGeometry(1, .095, 16, 90);
const rimGeo = new THREE.TorusGeometry(1, .014, 6, 80);
const gemGeo = new THREE.SphereGeometry(.06, 10, 8);
const gold = new THREE.MeshStandardMaterial({ color: 0xe8a93a, metalness: 1, roughness: .22, envMapIntensity: 1.1 });
const gemMats = [0xe0115f, 0x0fa36b, 0xffffff].map(c => new THREE.MeshPhysicalMaterial({ color: c, metalness: 0, roughness: .05, clearcoat: 1, emissive: c, emissiveIntensity: .25, envMapIntensity: 2 }));
const PALETTES = [
  [0xd9134a, 0xff5c8a, 0x18a558, 0xffb627, 0x8f2bd6, 0xff7a1a],
  [0x1f9e4a, 0x7ed957, 0x0b6e3a, 0xb8f28a, 0x2fbf71, 0x0f8a5f],
  [0xffc727, 0xff9f1c, 0xffe066, 0xf77f00, 0xffd166, 0xff7b00],
  [0xc1121f, 0x8a0f2d, 0xe0115f, 0xff4d6d, 0x9b0b2f, 0xd00000],
  [0xc9a7ff, 0xff9ecd, 0x8e6cff, 0xf7c6ff, 0xb48cff, 0xff7eb6],
  [0xffc766, 0xff4d6d, 0xffd9a0, 0xe0115f, 0xffb3c6, 0xffc766]
];
const group = new THREE.Group(); scene.add(group);
const spin = new THREE.Group(); group.add(spin);
const bangles = [];
for (let i = 0; i < N; i++) {
  const kind = i % 6 === 2 ? 'kundan' : i % 4 === 0 ? 'gold' : 'glass';
  let mesh, mat = null;
  if (kind === 'glass') {
    mat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: .2, roughness: .12, clearcoat: 1, clearcoatRoughness: .05, transparent: true, opacity: .92, envMapIntensity: .7, emissive: 0x000000 });
    mesh = new THREE.Mesh(glassGeo, mat);
    [-.055, .055].forEach(z => { const r = new THREE.Mesh(rimGeo, gold); r.position.z = z; r.scale.setScalar(1.005); mesh.add(r); });
  } else {
    mesh = new THREE.Mesh(goldGeo, gold);
    if (kind === 'kundan') for (let g = 0; g < 18; g++) { const a = g / 18 * Math.PI * 2, s = new THREE.Mesh(gemGeo, gemMats[g % 2 ? 0 : (g % 3 ? 1 : 2)]); s.position.set(Math.cos(a) * 1.085, Math.sin(a) * 1.085, 0); mesh.add(s); }
  }
  spin.add(mesh);
  bangles.push({ mesh, mat, kind, p: new THREE.Vector3(rand(-1, 1), 9 + i * .25, rand(-1, 1)), v: new THREE.Vector3(), q: new THREE.Quaternion(), tq: new THREE.Quaternion(), tp: new THREE.Vector3(),
    s: 1, ts: 1, released: false, landed: false, wob: 0, wv: 0, wAxis: new THREE.Vector3(1, 0, rand(-1, 1)).normalize(), seed: rand(0, 100), col: new THREE.Color(), tcol: new THREE.Color() });
}

/* ---------- layouts ---------- */
const E = new THREE.Euler(), Q = new THREE.Quaternion(), V = new THREE.Vector3();
const qFrom = (x, y, z, order = 'XYZ') => new THREE.Quaternion().setFromEuler(E.set(x, y, z, order));
const LAYOUTS = {
  stack: (i, b) => ({ p: V.set(Math.sin(b.seed) * .05, (i - N / 2) * .125, Math.cos(b.seed) * .05).clone(), q: qFrom(Math.PI / 2 + Math.sin(b.seed * 3) * .07, b.seed, Math.cos(b.seed * 2) * .07), s: 1 }),
  helix: i => { const a = i * .42; return { p: new THREE.Vector3(Math.sin(a) * .75, (i - N / 2) * .27, Math.cos(a) * .35), q: qFrom(Math.PI / 2 + Math.sin(a) * .55, a * .5, Math.cos(a) * .45), s: .9 }; },
  spiral: i => { const a = i * .5, r = .3 + i / N * .85; return { p: new THREE.Vector3(Math.cos(a) * r, (N / 2 - i) * .1, Math.sin(a) * r), q: qFrom(Math.PI / 2 - Math.cos(a) * .35, 0, Math.sin(a) * .35), s: .45 + i / N * .4 }; },
  orb: i => ({ p: new THREE.Vector3(0, 0, 0), q: qFrom(0, i / N * Math.PI, (i % 2 ? .18 : -.18), 'YXZ'), s: 1.05 + (i % 3) * .04 }),
  cascade: i => { const a = i / N * Math.PI * 2 + Math.PI / 2; return { p: new THREE.Vector3(Math.cos(a) * 1.55, Math.sin(a) * 1.55, 0), q: i % 2 ? qFrom(0, 0, a) : qFrom(0, Math.PI / 2, a, 'ZYX'), s: .42 }; },
  pair: (i, b, t) => {
    if (i === 0) return { p: new THREE.Vector3(-.42, 0, 0), q: qFrom(.25, 0, .1), s: 1.1 };
    if (i === 4) return { p: new THREE.Vector3(.42, 0, 0), q: qFrom(0, Math.PI / 2, .1), s: 1.1 };
    const a = i / N * Math.PI * 2 + t * .25;
    return { p: new THREE.Vector3(Math.cos(a) * 2.3, Math.sin(a) * .5, Math.sin(a) * 1.4), q: qFrom(t * .5 + i, a, 0), s: .26 };
  }
};
let layout = 'stack', palette = 0, layoutT = 0;
function applyPalette(k) {
  palette = k; const pal = PALETTES[k];
  bangles.forEach((b, i) => { if (b.mat) b.tcol.setHex(pal[i % pal.length]); });
  const accent = ['#ffb627', '#7ed957', '#ffc727', '#ff4d6d', '#c9a7ff', '#f5c86a'][k];
  document.documentElement.style.setProperty('--accent', accent);
  const A = [0x3a0b2c, 0x0b3a22, 0x4a2a05, 0x4a0614, 0x2c1a4a, 0x3a1020][k], B = [0x0c0309, 0x03120a, 0x140a02, 0x120207, 0x0b0614, 0x0c0408][k];
  bgTarget.a.setHex(A); bgTarget.b.setHex(B);
}
const bgTarget = { a: new THREE.Color(0x3a0b2c), b: new THREE.Color(0x0c0309) };
bangles.forEach((b, i) => { if (b.mat) { b.col.setHex(PALETTES[0][i % 6]); b.tcol.copy(b.col); b.mat.color.copy(b.col); } });
function setLayout(name, stagger = true) {
  if (name === layout) return; layout = name; layoutT = 0;
  bangles.forEach((b, i) => { b.delay = stagger ? i * .035 : 0; });
  music.sfx && music.playing && music.sfx((t, tone) => { for (let i = 0; i < 5; i++) clinkSfx(t + i * .06, tone, .6); });
}

/* ---------- glitter ---------- */
const GN = small ? 160 : 280;
const gGeo = new THREE.BufferGeometry(), gp = new Float32Array(GN * 3), gs = new Float32Array(GN);
for (let i = 0; i < GN; i++) { gp[i * 3] = rand(-4, 4); gp[i * 3 + 1] = rand(-4, 5); gp[i * 3 + 2] = rand(-4, 2); gs[i] = rand(0, 100); }
gGeo.setAttribute('position', new THREE.BufferAttribute(gp, 3)); gGeo.setAttribute('seed', new THREE.BufferAttribute(gs, 1));
const gU = { uTime: { value: 0 }, uScale: { value: innerHeight * DPR * .5 }, uBoost: { value: 0 } };
const glitter = new THREE.Points(gGeo, new THREE.ShaderMaterial({ uniforms: gU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  vertexShader: `attribute float seed;uniform float uTime,uScale,uBoost;varying float vA;void main(){vec3 p=position;p.y+=sin(uTime*.3+seed)*.2;p.x+=cos(uTime*.2+seed)*.2;
    vA=pow(.5+.5*sin(uTime*(1.5+fract(seed)*3.)+seed*7.),6.)+uBoost*fract(seed*3.1);vec4 mv=modelViewMatrix*vec4(p,1.);gl_PointSize=uScale*.05*(.5+vA)/-mv.z;gl_Position=projectionMatrix*mv;}`,
  fragmentShader: `varying float vA;void main(){vec2 p=gl_PointCoord-.5;float s=max(0.,1.-abs(p.x)*12.)*max(0.,1.-abs(p.y)*2.)+max(0.,1.-abs(p.y)*12.)*max(0.,1.-abs(p.x)*2.);
    float c=smoothstep(.5,0.,length(p));gl_FragColor=vec4(vec3(1.,.9,.7)*(s*.8+c*.6)*vA,1.);}` }));
scene.add(glitter);

/* ---------- lights ---------- */
const key = new THREE.SpotLight(0xfff0d8, 1.4, 30, .5, .6); key.position.set(3, 7, 6); scene.add(key);
const rimL = new THREE.PointLight(0xff4d8a, 1.2, 20); rimL.position.set(-4, -1, -2); scene.add(rimL);
scene.add(new THREE.AmbientLight(0x402030, .5));

/* ---------- post ---------- */
let composer = null;
if (THREE.EffectComposer && THREE.UnrealBloomPass) {
  composer = new THREE.EffectComposer(renderer);
  composer.addPass(new THREE.RenderPass(scene, camera));
  composer.addPass(new THREE.UnrealBloomPass(new THREE.Vector2(innerWidth / 2, innerHeight / 2), .45, .35, .9));
}
function resize() {
  renderer.setSize(innerWidth, innerHeight, false); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  if (composer) composer.setSize(innerWidth, innerHeight);
  gU.uScale.value = innerHeight * DPR * .5;
}
resize(); addEventListener('resize', resize);

/* ================= interaction ================= */
let dragY = 0, dragV = 0, down = null;
const canvas = $('#scene');
canvas.addEventListener('pointerdown', e => { down = { x: e.clientX, y: e.clientY, t: performance.now(), last: e.clientX }; });
addEventListener('pointermove', e => { if (!down) return; const dx = e.clientX - down.last; down.last = e.clientX; dragV = dx * .006; dragY += dragV; });
addEventListener('pointerup', e => {
  if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) < 10 && performance.now() - down.t < 400 && started) jingle(1);
  down = null;
});
function jingle(amt) {
  bangles.forEach((b, i) => { b.wv += rand(.6, 1.4) * amt * (i % 2 ? 1 : -1) * 2.2; b.v.y += rand(.5, 1.6) * amt; });
  gU.uBoost.value = Math.min(1.5, gU.uBoost.value + amt);
  if (amt >= 1) music.sfx((t, tone) => { for (let i = 0; i < 9; i++) clinkSfx(t + i * .028 + rand(0, .02), tone, 1.1); });
}
jingleHook = a => { if (started) bangles.forEach(b => { b.wv += rand(-.3, .3) * a * 3; }); gU.uBoost.value = Math.min(1.5, gU.uBoost.value + a * .6); };

/* ================= animate ================= */
let started = false, startT = 0;
const clock = new THREE.Clock();
function frame() {
  const dt = Math.min(clock.getDelta(), .05), t = clock.elapsedTime;
  layoutT += dt;
  // camera framing: the 3D sits in the top part of a portrait screen, above the text
  const portrait = camera.aspect < 1;
  camera.position.set(0, 0, portrait ? 9.6 : 7.2); camera.lookAt(0, portrait ? -1.5 : -.4, 0);
  group.position.y = portrait ? -.05 : 0;
  dragV *= .95; if (!down) dragY += dragV;
  spin.rotation.y = dragY + t * (layout === 'orb' ? .35 : layout === 'stack' ? .15 : .1);
  spin.rotation.x = layout === 'orb' ? Math.sin(t * .3) * .25 : layout === 'cascade' ? Math.sin(t * .4) * .15 : 0;
  if (layout === 'cascade') spin.rotation.y = dragY + Math.sin(t * .4) * .35;
  bangles.forEach((b, i) => {
    const L = LAYOUTS[layout](i, b, t);
    b.tp.copy(L.p); b.tq.copy(L.q); b.ts = L.s;
    if (!started) return;
    if (SETTLE) { b.p.copy(b.tp); b.q.copy(b.tq); b.s = b.ts; b.col.copy(b.tcol); b.released = b.landed = true; }
    if (!b.released) { if (t - startT > (reduce ? 0 : i * .14)) b.released = true; else return; }
    if (b.delay > 0 && !SETTLE) { b.delay -= dt; return; }
    // springy motion toward the target (bouncy on landing)
    const k = 55, c = 8.5;
    V.copy(b.tp).sub(b.p).multiplyScalar(k).addScaledVector(b.v, -c);
    b.v.addScaledVector(V, dt); b.p.addScaledVector(b.v, dt);
    if (!b.landed && b.p.distanceTo(b.tp) < .25) { b.landed = true; if (music.ctx) music.sfx((tt, tone) => clinkSfx(tt, tone, 1.2, b.kind === 'glass' ? 100 : 93)); b.wv += 2; }
    b.q.slerp(b.tq, Math.min(1, dt * 5));
    b.s += (b.ts - b.s) * Math.min(1, dt * 4);
    b.wv += -b.wob * 90 * dt - b.wv * 4 * dt; b.wob += b.wv * dt;
    Q.setFromAxisAngle(b.wAxis, b.wob * .25);
    b.mesh.position.copy(b.p); b.mesh.quaternion.copy(b.q).multiply(Q); b.mesh.scale.setScalar(b.s);
    if (b.mat) { b.col.lerp(b.tcol, Math.min(1, dt * 2.5)); b.mat.color.copy(b.col); b.mat.emissive.copy(b.col).multiplyScalar(.12 + gU.uBoost.value * .15); }
  });
  if (!started) bangles.forEach(b => { b.mesh.position.copy(b.p); });
  bgU.uA.value.lerp(bgTarget.a, Math.min(1, dt * 2)); bgU.uB.value.lerp(bgTarget.b, Math.min(1, dt * 2)); bgU.uT.value = t;
  gU.uTime.value = t; gU.uBoost.value *= Math.pow(.25, dt);
  key.intensity = 1.4 + music.level() * 1.2;
  composer ? composer.render() : renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

/* ================= gate ================= */
$('#open').addEventListener('click', () => {
  music.start(); musicBtn.hidden = false;
  $('#gate').classList.add('gone');
  started = true; startT = clock.elapsedTime;
  setTimeout(() => { document.body.classList.remove('locked'); }, reduce ? 0 : 1800);
});

/* ================= scroll: each stop sets layout + palette ================= */
const stops = [...document.querySelectorAll('.stop')];
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) e.target.classList.add('in'); }), { threshold: .2 });
stops.forEach(s => io.observe(s));
function onScroll() {
  const mid = innerHeight * .55; let cur = stops[0];
  stops.forEach(s => { if (s.getBoundingClientRect().top < mid) cur = s; });
  if (started && cur.dataset.layout !== layout) { setLayout(cur.dataset.layout); }
  if (+cur.dataset.palette !== palette) applyPalette(+cur.dataset.palette);
}
addEventListener('scroll', onScroll, { passive: true });
window.__state = () => layout + '/' + palette + ' y=' + scrollY;

/* ================= countdown ================= */
const target = new Date('2027-12-20T18:00:00+06:00').getTime();
const cd = ['d', 'h', 'm', 's'].map(k => $('#cd-' + k));
function count() { const s = Math.max(0, Math.floor((target - Date.now()) / 1000));
  [Math.floor(s / 86400), Math.floor(s % 86400 / 3600), Math.floor(s % 3600 / 60), s % 60].forEach((n, i) => cd[i].textContent = String(n).padStart(2, '0')); }
count(); setInterval(count, 1000);

/* ================= RSVP ================= */
$('#form').addEventListener('submit', e => {
  e.preventDefault();
  const name = $('#f-name').value.trim(), ev = [...document.querySelectorAll('fieldset input:checked')].map(i => i.value), n = +$('#f-count').value, err = $('#err');
  if (!name) { err.textContent = 'Please tell us your name.'; $('#f-name').focus(); return; }
  if (!ev.length) { err.textContent = 'Pick at least one day.'; return; }
  err.textContent = '';
  // NOTE: connect a form backend here (Google Forms, Formspree, Supabase…) — { name, events: ev, guests: n }
  const list = ev.length > 1 ? ev.slice(0, -1).join(', ') + ' and ' + ev.at(-1) : ev[0];
  $('#thanks-msg').textContent = `${name.split(' ')[0]}, we’ll see ${n > 1 ? 'all ' + n + ' of you' : 'you'} at the ${list}. Bring your loudest churi!`;
  $('.rsvp').classList.add('sent');
  jingle(1.6); setTimeout(() => jingle(1), 350);
});
})();
