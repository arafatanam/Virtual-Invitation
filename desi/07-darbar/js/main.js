/* Shahi Biye — haggle with the bride's cousins at the gate (gate dhora), snip the ribbon, then scroll to walk a red carpet
   through a royal darbar hall: marble pillars, crystal chandeliers, twinkling fairy-light curtains, to the couple's stage. */
(() => {
'use strict';
const $ = s => document.querySelector(s);
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const small = Math.min(innerWidth, innerHeight) < 600;
const rand = (a = 0, b = 1) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const wait = ms => new Promise(r => setTimeout(r, reduce ? 0 : ms));

/* ================= music: santoor and strings in raag Yaman, with a soft daf ================= */
const mel = { 0: 73, 2: 74, 4: 76, 6: 78, 8: 76, 10: 74, 12: 73, 14: 71, 16: 69, 20: 71, 22: 73, 24: 74, 28: 73, 30: 71,
  32: 69, 34: 71, 36: 73, 38: 76, 40: 74, 42: 73, 44: 71, 46: 69, 48: 66, 52: 68, 54: 69, 56: 71, 60: 69 };
const chords = [[50, 57, 62, 66], [47, 54, 59, 62], [43, 50, 55, 59], [45, 52, 57, 61]];
const music = createMusic({ spb: .2, reverb: .55, volume: .8, fadeIn: 3, play(step, t, tone, noise, pluck) {
  if (step % 16 === 0) chords[(step >> 4) % 4].forEach(n => tone(n, t, { type: 'sawtooth', dur: 3.4, vol: .014, cutoff: 1400, sustain: true, attack: .5, vib: [5, 8] }));
  const k = step % 8;
  if (k === 0) { tone(45, t, { dur: .5, vol: .2, slide: -2 }); noise(t, { dur: .1, vol: .03, freq: 900, type: 'bandpass' }); }
  if (k === 3 || k === 6) noise(t, { dur: .05, vol: .04, freq: 3200, type: 'bandpass', q: 1 });
  const m = mel[step % 64];
  if (m) { pluck(m, t, { vol: .17, bright: .9, dur: 1.4 }); pluck(m, t + .09, { vol: .09, bright: .9, dur: 1.1 }); }
}});
const musicBtn = $('#music');
musicBtn.addEventListener('click', () => { const on = music.toggle(); musicBtn.classList.toggle('off', !on); musicBtn.setAttribute('aria-label', on ? 'Pause music' : 'Play music'); });

/* ================= gate dhora ================= */
{ const arch = document.querySelector('.arch'); arch.querySelectorAll('i').forEach((el, i) => { el.style.left = (8 + i * 8.4) + '%'; el.style.setProperty('--h', (30 + Math.sin(i / 10 * Math.PI) * 25) + '%'); el.style.animationDelay = (-i * .27) + 's'; }); }
const STEPS = [
  { say: '“৳ 5,000?! That won’t even pay for the ribbon!”', btn: 'Offer ৳ 20,000' },
  { say: '“Hmm… getting warmer. The bride’s sister says <b>৳ 40,000</b> and a box of mishti.”', btn: 'Pay ৳ 40,000 + mishti' },
  { say: '“Deal! Let the groom’s side in!” 🎉', btn: null }
];
let stepI = 0, entered = 0, enterT = 0;
const cousins = $('#cousins'), offer = $('#offer'), gate = $('#gate');
offer.addEventListener('click', async () => {
  const s = STEPS[stepI++];
  cousins.innerHTML = s.say.replace(' 🎉', '') + '<small>— the bride’s cousins</small>'; cousins.classList.remove('pop'); void cousins.offsetWidth; cousins.classList.add('pop');
  music.sfx((t, tone, noise) => { for (let i = 0; i < 3; i++) tone(79 + i * 4, t + i * .07, { dur: .2, vol: .06, partials: [[1, 1], [2, .3]] }); });
  if (s.btn) { offer.textContent = s.btn; return; }
  offer.disabled = true; offer.style.visibility = 'hidden';
  gate.classList.add('snip');
  await wait(1500);
  music.sfx((t, tone, noise) => { noise(t, { dur: .08, vol: .2, freq: 5000, type: 'bandpass', q: 2 }); for (let i = 0; i < 14; i++) noise(t + .1 + i * .05, { dur: .15, vol: .03, freq: rand(900, 2500), type: 'bandpass', q: .6 }); });
  gate.classList.add('cut');
  music.start(); musicBtn.hidden = false;
  enterT = 1; petalBurst = 1;
  await wait(700); gate.classList.add('gone');
  await wait(1800); document.body.classList.remove('locked'); onScroll();
});

/* ================= the darbar hall ================= */
let renderer, petalBurst = 0;
try { renderer = new THREE.WebGLRenderer({ canvas: $('#scene'), antialias: !small, powerPreference: 'high-performance' }); }
catch (e) { renderer = null; }
let onScroll = () => {};
if (renderer) {
const DPR = Math.min(devicePixelRatio || 1, small ? 1.5 : 1.75);
renderer.setPixelRatio(DPR);
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = .9;
const scene = new THREE.Scene();
const BG = new THREE.Color(0x0d0608); scene.background = BG; scene.fog = new THREE.Fog(BG, 18, 62);
const camera = new THREE.PerspectiveCamera(62, innerWidth / innerHeight, .1, 150);

const pmrem = new THREE.PMREMGenerator(renderer);
const envS = new THREE.Scene(); envS.background = new THREE.Color(0x1a0a08);
[[0xffe0a0, [0, 6, 0], 5], [0xffffff, [5, 2, 3], 3], [0xff8a6a, [-5, 1, -2], 3], [0xffd27a, [0, -4, 5], 4], [0x9fd8ff, [3, 3, -6], 2]].forEach(([c, p, s]) => {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(s, s), new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(2), side: THREE.DoubleSide })); m.position.set(...p); m.lookAt(0, 0, 0); envS.add(m); });
const env = pmrem.fromScene(envS, .02).texture;

function canvasTex(S, draw, rx = 1, ry = 1) { const c = document.createElement('canvas'); c.width = c.height = S; draw(c.getContext('2d'), S); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.encoding = THREE.sRGBEncoding; t.anisotropy = 4; return t; }
const marbleTex = canvasTex(512, (x, S) => {
  x.fillStyle = '#efe6d8'; x.fillRect(0, 0, S, S);
  for (let i = 0; i < 30; i++) { x.strokeStyle = `rgba(140,120,100,${rand(.05, .12)})`; x.lineWidth = rand(.5, 2); x.beginPath(); let px = rand(0, S), py = rand(0, S); x.moveTo(px, py); for (let k = 0; k < 8; k++) { px += rand(-60, 60); py += rand(-60, 60); x.lineTo(px, py); } x.stroke(); }
  x.fillStyle = '#2a1a14'; x.save(); x.translate(S / 2, S / 2); x.rotate(Math.PI / 4); x.fillRect(-40, -40, 80, 80); x.restore();
  x.strokeStyle = '#c99a3e'; x.lineWidth = 4; x.strokeRect(2, 2, S - 4, S - 4);
}, 6, 24);
const carpetTex = canvasTex(256, (x, S) => {
  x.fillStyle = '#8e0e22'; x.fillRect(0, 0, S, S);
  x.fillStyle = '#e8c26a'; x.fillRect(0, 0, 18, S); x.fillRect(S - 18, 0, 18, S);
  x.fillStyle = '#5e0716'; x.fillRect(18, 0, 8, S); x.fillRect(S - 26, 0, 8, S);
  x.strokeStyle = 'rgba(232,194,106,.5)'; x.lineWidth = 3; x.beginPath(); x.moveTo(S / 2, 30); x.lineTo(S / 2 + 50, S / 2); x.lineTo(S / 2, S - 30); x.lineTo(S / 2 - 50, S / 2); x.closePath(); x.stroke();
}, 1, 14);

const marbleM = new THREE.MeshStandardMaterial({ map: marbleTex, roughness: .22, metalness: .05, envMap: env, envMapIntensity: .5 });
const ivoryM = new THREE.MeshStandardMaterial({ color: 0xf3eadc, roughness: .45, envMap: env, envMapIntensity: .4 });
const goldM = new THREE.MeshStandardMaterial({ color: 0xe8b84e, metalness: 1, roughness: .25, envMap: env, envMapIntensity: 1.2 });
const crimsonM = new THREE.MeshStandardMaterial({ color: 0x8e0e22, roughness: .7 });

const LEN = 60, STAGE_Z = -52;
const floor = new THREE.Mesh(new THREE.PlaneGeometry(16, LEN + 20), marbleM); floor.rotation.x = -Math.PI / 2; floor.position.z = -LEN / 2 + 2; scene.add(floor);
const carpet = new THREE.Mesh(new THREE.PlaneGeometry(2.8, LEN), new THREE.MeshStandardMaterial({ map: carpetTex, roughness: .9 })); carpet.rotation.x = -Math.PI / 2; carpet.position.set(0, .01, -LEN / 2 + 4); scene.add(carpet);
const ceil = new THREE.Mesh(new THREE.PlaneGeometry(16, LEN + 20), new THREE.MeshStandardMaterial({ color: 0x2a140c, roughness: .8, map: canvasTex(128, (x, S) => { x.fillStyle = '#2a140c'; x.fillRect(0, 0, S, S); x.strokeStyle = '#a8803a'; x.lineWidth = 4; x.strokeRect(8, 8, S - 16, S - 16); x.beginPath(); x.arc(S / 2, S / 2, 22, 0, 7); x.stroke(); }, 4, 20) }));
ceil.rotation.x = Math.PI / 2; ceil.position.set(0, 9, -LEN / 2 + 2); scene.add(ceil);

// pillars
const dummy = new THREE.Object3D();
const pillarZ = []; for (let z = 0; z > STAGE_Z + 4; z -= 5.5) pillarZ.push(z);
const shaftGeo = new THREE.CylinderGeometry(.32, .38, 8, 20), ringGeo = new THREE.CylinderGeometry(.5, .5, .3, 20), capGeo = new THREE.BoxGeometry(1, .5, 1);
const shafts = new THREE.InstancedMesh(shaftGeo, ivoryM, pillarZ.length * 2), rings = new THREE.InstancedMesh(ringGeo, goldM, pillarZ.length * 4), caps = new THREE.InstancedMesh(capGeo, goldM, pillarZ.length * 2);
let si = 0, ri = 0;
pillarZ.forEach(z => [-4.4, 4.4].forEach(x => {
  dummy.position.set(x, 4, z); dummy.updateMatrix(); shafts.setMatrixAt(si, dummy.matrix);
  dummy.position.set(x, 8.75, z); dummy.updateMatrix(); caps.setMatrixAt(si++, dummy.matrix);
  [.15, 7.8].forEach(y => { dummy.position.set(x, y, z); dummy.updateMatrix(); rings.setMatrixAt(ri++, dummy.matrix); });
}));
scene.add(shafts, rings, caps);

// fairy-light curtains between the pillars (morich bati)
const fl = [];
for (let p = 0; p < pillarZ.length - 1; p++) [-4.4, 4.4].forEach(x => { const z0 = pillarZ[p], z1 = pillarZ[p + 1];
  for (let s = 0; s < 10; s++) { const z = z0 + (z1 - z0) * (s + .5) / 10; for (let k = 0; k < 18; k++) fl.push(x + (x > 0 ? .2 : -.2), 8.4 - k * .44 - (s % 2) * .2, z); } });
for (let s = 0; s < 40; s++) for (let k = 0; k < 18; k++) fl.push(-6 + s * .3, 8.6 - k * .45 - (s % 2) * .2, STAGE_Z - 3.2);   // behind the stage
const flGeo = new THREE.BufferGeometry(); flGeo.setAttribute('position', new THREE.Float32BufferAttribute(fl, 3));
flGeo.setAttribute('seed', new THREE.Float32BufferAttribute(Array.from({ length: fl.length / 3 }, () => rand(0, 100)), 1));
const flU = { uTime: { value: 0 }, uScale: { value: 1 } };
scene.add(new THREE.Points(flGeo, new THREE.ShaderMaterial({ uniforms: flU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  vertexShader: `attribute float seed;uniform float uTime,uScale;varying float vA;void main(){vA=.45+.55*pow(.5+.5*sin(uTime*(1.+fract(seed)*2.)+seed),3.);
    vec4 mv=modelViewMatrix*vec4(position,1.);gl_PointSize=uScale*.06*(.6+vA)/-mv.z;gl_Position=projectionMatrix*mv;}`,
  fragmentShader: `varying float vA;void main(){float d=length(gl_PointCoord-.5);float a=smoothstep(.5,0.,d);gl_FragColor=vec4(vec3(1.,.82,.5)*a*vA*1.6,1.);}` })));

// crystal chandeliers
const chandeliers = [];
const crystalGeo = new THREE.OctahedronGeometry(.07, 0); crystalGeo.scale(1, 2.6, 1);
const crystalM = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 1, roughness: 0, envMap: env, envMapIntensity: 2.4 });
const bulbM = new THREE.MeshBasicMaterial({ color: 0xffe2a8 });
const bulbGeo = new THREE.SphereGeometry(.07, 8, 6);
[-6, -17, -28, -39].forEach(z => {
  const g = new THREE.Group(); g.position.set(0, 6.6, z); scene.add(g);
  const tiers = [[1.4, 0, 30], [1.0, -.55, 22], [.6, -1.05, 14], [.25, -1.45, 6]], drops = [];
  tiers.forEach(([r, y, n]) => {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r, .035, 6, 40), goldM); ring.rotation.x = Math.PI / 2; ring.position.y = y; g.add(ring);
    for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; for (let k = 0; k < 3; k++) drops.push([Math.cos(a) * r, y - .2 - k * .24, Math.sin(a) * r, k]); }
    for (let i = 0; i < Math.max(4, n / 3); i++) { const a = i / Math.max(4, n / 3) * Math.PI * 2, b = new THREE.Mesh(bulbGeo, bulbM); b.position.set(Math.cos(a) * r, y + .1, Math.sin(a) * r); g.add(b); }
  });
  const inst = new THREE.InstancedMesh(crystalGeo, crystalM, drops.length);
  drops.forEach(([x, y, zz, k], i) => { dummy.position.set(x, y, zz); dummy.scale.setScalar(1 - k * .15); dummy.rotation.set(0, rand(0, 6), 0); dummy.updateMatrix(); inst.setMatrixAt(i, dummy.matrix); });
  g.add(inst);
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, 2.4, 6), goldM); rod.position.y = 1.2; g.add(rod);
  const light = new THREE.PointLight(0xffd59a, 1.6, 16, 1.8); light.position.y = -.6; g.add(light);
  chandeliers.push({ g, ph: rand(0, 6) });
});

// the stage: platform, flower-wall arch and the couple's throne sofa
const stage = new THREE.Group(); stage.position.z = STAGE_Z; scene.add(stage);
{ const plat = new THREE.Mesh(new THREE.BoxGeometry(10, .8, 5), ivoryM); plat.position.y = .4; stage.add(plat);
  const edge = new THREE.Mesh(new THREE.BoxGeometry(10.1, .12, .12), goldM); edge.position.set(0, .8, 2.5); stage.add(edge);
  [0, 1, 2].forEach(i => { const st = new THREE.Mesh(new THREE.BoxGeometry(3, .27, .5), crimsonM); st.position.set(0, .27 * i + .13, 2.5 + (2 - i) * .5 + .25); stage.add(st); });
  // cusped arch frame
  const w = 6.4, spring = 4.6, apex = 8.2, a = apex - spring, d = (a * a - w * w / 4) / w, R = w / 2 + d, phMax = Math.acos(d / R), sh = new THREE.Shape();
  sh.moveTo(-5, .8); sh.lineTo(-w / 2, .8); sh.lineTo(-w / 2, spring);
  for (let i = 0; i <= 30; i++) { const ph = i / 30 * phMax, r = R - .18 * (1 - Math.abs(Math.sin(5 * Math.PI * i / 30))); sh.lineTo(d - r * Math.cos(ph), spring + r * Math.sin(ph)); }
  for (let i = 30; i >= 0; i--) { const ph = i / 30 * phMax, r = R - .18 * (1 - Math.abs(Math.sin(5 * Math.PI * i / 30))); sh.lineTo(-d + r * Math.cos(ph), spring + r * Math.sin(ph)); }
  sh.lineTo(w / 2, .8); sh.lineTo(5, .8); sh.lineTo(5, 9); sh.lineTo(-5, 9); sh.closePath();
  const wall = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: .5, bevelEnabled: false }), ivoryM); wall.position.z = -2.3; stage.add(wall);
  // roses around the arch opening
  const roses = [];
  for (let i = 0; i <= 80; i++) { const u = i / 80; let x, y;
    if (u < .5) { const ph = (u / .5) * phMax; x = d - R * Math.cos(ph); y = spring + R * Math.sin(ph); } else { const ph = (1 - (u - .5) / .5) * phMax; x = -d + R * Math.cos(ph); y = spring + R * Math.sin(ph); }
    roses.push([x, y]); }
  for (let y = .9; y < spring; y += .28) { roses.push([-w / 2, y], [w / 2, y]); }
  const rm = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(.17, 1), new THREE.MeshStandardMaterial({ roughness: .7 }), roses.length * 2);
  const RC = [0xc2102e, 0xfff3f3, 0xe0284f, 0xffd0d8].map(c => new THREE.Color(c));
  roses.forEach(([x, y], i) => [0, 1].forEach(j => { dummy.position.set(x + (j ? .12 : -.12), y + (j ? .1 : 0), -1.7); dummy.scale.setScalar(rand(.8, 1.2)); dummy.updateMatrix(); rm.setMatrixAt(i * 2 + j, dummy.matrix); rm.setColorAt(i * 2 + j, RC[(i + j) % 4]); }));
  stage.add(rm);
  // throne sofa
  const sofa = new THREE.Group(); sofa.position.set(0, .8, -.6); stage.add(sofa);
  const seat = new THREE.Mesh(new THREE.BoxGeometry(3.2, .5, 1.1), crimsonM); seat.position.y = .55; sofa.add(seat);
  const base = new THREE.Mesh(new THREE.BoxGeometry(3.4, .35, 1.2), goldM); base.position.y = .18; sofa.add(base);
  const bs = new THREE.Shape(); bs.moveTo(-1.7, 0); bs.lineTo(-1.7, 1.2); bs.quadraticCurveTo(-1.2, 1.5, -.6, 1.45); bs.quadraticCurveTo(0, 2.3, .6, 1.45); bs.quadraticCurveTo(1.2, 1.5, 1.7, 1.2); bs.lineTo(1.7, 0); bs.closePath();
  const back = new THREE.Mesh(new THREE.ExtrudeGeometry(bs, { depth: .25, bevelEnabled: true, bevelSize: .06, bevelThickness: .06, bevelSegments: 2 }), goldM); back.position.set(0, .6, -.6); sofa.add(back);
  const cushion = new THREE.Mesh(new THREE.ExtrudeGeometry(bs, { depth: .1, bevelEnabled: false }), crimsonM); cushion.scale.set(.86, .82, 1); cushion.position.set(0, .75, -.32); sofa.add(cushion);
  [-1.75, 1.75].forEach(x => { const arm = new THREE.Mesh(new THREE.CylinderGeometry(.2, .2, 1.1, 14), goldM); arm.rotation.x = Math.PI / 2; arm.position.set(x, .95, 0); sofa.add(arm); });
  const spot = new THREE.SpotLight(0xffe6c0, 3, 20, .5, .6); spot.position.set(0, 8.5, 3); spot.target = sofa; stage.add(spot);
}

// rose petals
const PN = small ? 160 : 280;
const petalGeo = new THREE.CircleGeometry(.07, 6); petalGeo.scale(1, 1.5, 1);
const petals = new THREE.InstancedMesh(petalGeo, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }), PN);
const pd = Array.from({ length: PN }, () => ({ x: rand(-4, 4), y: rand(0, 9), z: rand(-12, 6), vy: rand(.5, 1.1), r: rand(0, 6), vr: rand(1, 3), ph: rand(0, 6) }));
const PCOL = [0xc2102e, 0xe0284f, 0xff5f7e, 0xfff0f0].map(c => new THREE.Color(c)); pd.forEach((p, i) => petals.setColorAt(i, PCOL[i % 4]));
scene.add(petals);

scene.add(new THREE.HemisphereLight(0xffe8c8, 0x3a1810, .45));
const fill = new THREE.PointLight(0xffc890, 1.2, 18, 1.8); scene.add(fill);

let composer = null;
if (THREE.EffectComposer && THREE.UnrealBloomPass) {
  composer = new THREE.EffectComposer(renderer); composer.addPass(new THREE.RenderPass(scene, camera));
  composer.addPass(new THREE.UnrealBloomPass(new THREE.Vector2(innerWidth / 2, innerHeight / 2), .7, .45, .8));
}
const resize = () => { renderer.setSize(innerWidth, innerHeight, false); camera.aspect = innerWidth / innerHeight; camera.fov = camera.aspect < .7 ? 70 : 58; camera.updateProjectionMatrix(); if (composer) composer.setSize(innerWidth, innerHeight); flU.uScale.value = innerHeight * DPR * .5; };
resize(); addEventListener('resize', resize);

let prog = 0, sm = 0;
onScroll = () => { const H = document.documentElement.scrollHeight - innerHeight; prog = H > 0 ? clamp(scrollY / H, 0, 1) : 0; };
addEventListener('scroll', onScroll, { passive: true });
let px = 0; addEventListener('pointermove', e => { px = e.clientX / innerWidth - .5; });
const clock = new THREE.Clock(), look = new THREE.Vector3();
(function frame() {
  const dt = Math.min(clock.getDelta(), .05), t = clock.elapsedTime;
  sm += (prog - sm) * Math.min(1, dt * 3.5);
  entered += (enterT - entered) * Math.min(1, dt * 1.1);
  const z = 8 - sm * (8 - (STAGE_Z + 9)) + (1 - entered) * 5;
  camera.position.set(Math.sin(t * .25) * .2 + px * .5, 2.1 + Math.sin(sm * 50) * .03, z);
  look.set(px * .8, 3.4 - sm * .6, z - 10); camera.lookAt(look);
  fill.position.set(0, 3, z - 4);
  chandeliers.forEach(c => { c.g.rotation.y = t * .1 + c.ph; });
  flU.uTime.value = t;
  if (petalBurst > 0) { pd.forEach(p => { p.y = rand(6, 9); p.z = camera.position.z + rand(-10, 0); }); petalBurst = 0; }
  pd.forEach((p, i) => { p.y -= p.vy * dt; p.r += p.vr * dt; p.ph += dt;
    if (p.y < 0) { p.y = rand(7, 9); p.x = rand(-4, 4); p.z = camera.position.z + rand(-14, 2); }
    if (p.z > camera.position.z + 2) p.z -= 16;
    dummy.position.set(p.x + Math.sin(p.ph) * .3, p.y, p.z); dummy.rotation.set(p.r, p.r * .7, p.ph); dummy.scale.setScalar(1); dummy.updateMatrix(); petals.setMatrixAt(i, dummy.matrix); });
  petals.instanceMatrix.needsUpdate = true;
  composer ? composer.render() : renderer.render(scene, camera);
  requestAnimationFrame(frame);
})();
}

/* ================= reveal, countdown, RSVP ================= */
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .2 });
document.querySelectorAll('.stop').forEach(el => io.observe(el));
const target = new Date('2028-02-25T19:30:00+06:00').getTime();
const cd = ['d', 'h', 'm', 's'].map(k => $('#cd-' + k));
function count() { const s = Math.max(0, Math.floor((target - Date.now()) / 1000));
  [Math.floor(s / 86400), Math.floor(s % 86400 / 3600), Math.floor(s % 3600 / 60), s % 60].forEach((n, i) => cd[i].textContent = String(n).padStart(2, '0')); }
count(); setInterval(count, 1000);
$('#form').addEventListener('submit', e => {
  e.preventDefault();
  const name = $('#f-name').value.trim(), ev = [...document.querySelectorAll('fieldset input:checked')].map(i => i.value), n = +$('#f-count').value, err = $('#err');
  if (!name) { err.textContent = 'Please tell us your name.'; $('#f-name').focus(); return; }
  if (!ev.length) { err.textContent = 'Choose at least one event.'; return; }
  err.textContent = '';
  // NOTE: connect a form backend here (Google Forms, Formspree, Supabase…) — { name, events: ev, guests: n }
  const list = ev.length > 1 ? ev.slice(0, -1).join(', ') + ' and ' + ev.at(-1) : ev[0];
  $('#thanks-msg').textContent = `${name.split(' ')[0]}, a royal welcome awaits ${n > 1 ? 'all ' + n + ' of you' : 'you'} at the ${list}.`;
  $('.rsvp').classList.add('sent'); petalBurst = 1;
  music.sfx((t, tone, n2, pluck) => [69, 73, 76, 81].forEach((m, i) => pluck(m, t + i * .1, { vol: .18, bright: .9 })));
});
})();
