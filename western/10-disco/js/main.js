/* Disco NYE — a WebGL club: mirror ball of ~1,500 real reflective tiles, light spots sweeping the walls,
   a beat-synced LED dance floor you can tap, sweeping beams, glitter, and a page that pulses on every kick. */
(() => {
'use strict';
const $ = s => document.querySelector(s);
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const small = Math.min(innerWidth, innerHeight) < 600;
const rand = (a = 0, b = 1) => a + Math.random() * (b - a);
const wait = ms => new Promise(r => setTimeout(r, reduce ? 0 : ms));
const root = document.documentElement;

/* ================= music: disco at 120 bpm, with a beat clock ================= */
const beats = [];
const chords = [[45,[57,60,64,67]],[50,[57,62,66,69]],[43,[55,59,62,66]],[48,[55,60,64,67]]];  // Am7 D9 Gmaj7 Cmaj7
const strings = [76,0,0,0,0,0,74,0, 72,0,0,0,74,0,76,0, 79,0,0,0,0,0,78,0, 76,0,0,0,0,0,0,0];
const music = createMusic({ spb: .125, reverb: .32, volume: .85, play(step, t, tone, noise) {
  const s = step % 16, bar = Math.floor(step / 16) % 4, [root, ch] = chords[bar];
  if (s % 4 === 0) { tone(36, t, { dur: .3, vol: .42, slide: -22 }); beats.push({ t, kind: 'kick', step }); }
  if (s % 4 === 2) noise(t, { dur: .12, vol: .05, freq: 7500 });
  if (s === 4 || s === 12) noise(t, { dur: .15, vol: .1, freq: 1700, type: 'bandpass', q: .6 });
  if (s % 2 === 0) tone(root - 12 + (s % 4 === 2 ? 12 : 0), t, { type: 'sawtooth', dur: .16, vol: .085, cutoff: 700, q: 3 });
  if (s === 6 || s === 14) ch.forEach(n => tone(n + 12, t, { type: 'sawtooth', dur: .18, vol: .018, cutoff: 3200 }));
  const m = strings[(step >> 1) % 32]; if (m && step % 2 === 0) tone(m, t, { type: 'sawtooth', dur: 1.1, vol: .03, attack: .12, cutoff: 2600, sustain: true });
  if (s === 0 && bar === 0) beats.push({ t, kind: 'bar', step });
}});
const musicBtn = $('#music');
musicBtn.addEventListener('click', () => { const on = music.toggle(); musicBtn.classList.toggle('off', !on); musicBtn.setAttribute('aria-label', on ? 'Pause music' : 'Play music'); });

/* ================= renderer ================= */
let renderer;
try { renderer = new THREE.WebGLRenderer({ canvas: $('#club'), antialias: !small, powerPreference: 'high-performance' }); }
catch (e) { document.body.classList.remove('locked'); return; }
const DPR = Math.min(devicePixelRatio || 1, small ? 1.5 : 1.75);
renderer.setPixelRatio(DPR);
renderer.setClearColor(0x0c0314, 1);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, .1, 100);

// a colourful room for the mirror tiles to reflect
const pmrem = new THREE.PMREMGenerator(renderer);
const env = new THREE.Scene(); env.background = new THREE.Color(0x07020c);
[[0xff3ea5, [6, 2, 0]], [0x38e1ff, [-6, 1, 2]], [0xffd166, [0, 6, -5]], [0xffffff, [2, -4, 6]], [0x9b6bff, [-3, 3, -6]], [0xff7a3e, [5, -2, -4]], [0x38e1ff, [0, -6, -2]]].forEach(([c, p]) => {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 2.6), new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(2.4), side: THREE.DoubleSide }));
  m.position.set(...p); m.lookAt(0, 0, 0); env.add(m);
});
const envTex = pmrem.fromScene(env, .01).texture;

/* ---------- mirror ball ---------- */
const BALL_Y = 3.1, BR = 1.35;
const ballRig = new THREE.Group(); ballRig.position.set(0, 12, 0); scene.add(ballRig);
const ball = new THREE.Group(); ballRig.add(ball);
const tile = small ? .14 : .12, mats = [];
const tileMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 1, roughness: .06, envMap: envTex, envMapIntensity: 1.6 });
const tiles = [];
for (let lat = -Math.PI / 2 + tile / BR / 2; lat < Math.PI / 2; lat += tile / BR * 1.08) {
  const ringR = Math.cos(lat) * BR, count = Math.max(1, Math.floor(2 * Math.PI * ringR / (tile * 1.08)));
  for (let k = 0; k < count; k++) tiles.push([lat, k / count * Math.PI * 2 + (lat * 7) % 1]);
}
const tileMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(tile, tile, .03), tileMat, tiles.length);
const d = new THREE.Object3D();
tiles.forEach(([lat, lon], i) => {
  d.position.set(Math.cos(lat) * Math.cos(lon) * BR, Math.sin(lat) * BR, Math.cos(lat) * Math.sin(lon) * BR);
  d.lookAt(d.position.clone().multiplyScalar(2));
  d.rotateX(rand(-.06, .06)); d.rotateY(rand(-.06, .06));
  d.updateMatrix(); tileMesh.setMatrixAt(i, d.matrix);
});
ball.add(tileMesh);
ball.add(new THREE.Mesh(new THREE.SphereGeometry(BR * .97, 32, 24), new THREE.MeshBasicMaterial({ color: 0x0a0a10 })));
const chain = new THREE.Mesh(new THREE.CylinderGeometry(.02, .02, 12, 6), new THREE.MeshStandardMaterial({ color: 0x888899, metalness: 1, roughness: .3, envMap: envTex }));
chain.position.y = BR + 6; ballRig.add(chain);
const ballLight = new THREE.PointLight(0xffffff, 0, 10); ballRig.add(ballLight);
scene.add(new THREE.AmbientLight(0x6040a0, .5));

/* ---------- the room: walls covered in moving reflections ---------- */
const roomU = { uRot: { value: 0 }, uTime: { value: 0 }, uOn: { value: 0 }, uBall: { value: new THREE.Vector3(0, BALL_Y, 0) }, uBeat: { value: 0 } };
const room = new THREE.Mesh(new THREE.SphereGeometry(22, 48, 32), new THREE.ShaderMaterial({
  uniforms: roomU,
  vertexShader: `varying vec3 vW;void main(){vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}`,
  fragmentShader: `varying vec3 vW;uniform float uRot,uTime,uOn,uBeat;uniform vec3 uBall;
    float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    void main(){vec3 dir=normalize(vW-uBall);
      float c=cos(uRot),s=sin(uRot);dir.xz=mat2(c,-s,s,c)*dir.xz;
      float lat=asin(clamp(dir.y,-1.,1.)),lon=atan(dir.z,dir.x);
      vec2 g=vec2(lon*9.,lat*9.);vec2 cell=floor(g),f=fract(g)-.5;
      float r=h(cell);float spot=step(.55,r)*smoothstep(.22,.05,length(f+vec2(h(cell+3.)-.5,h(cell+7.)-.5)*.4));
      vec3 col=r>.85?vec3(1.,.24,.65):r>.75?vec3(.22,.88,1.):r>.65?vec3(1.,.82,.4):vec3(1.);
      vec3 base=mix(vec3(.03,.01,.06),vec3(.09,.02,.14),smoothstep(-.4,.6,normalize(vW).y));
      gl_FragColor=vec4(base+col*spot*uOn*(.55+.45*uBeat),1.);}`,
  side: THREE.BackSide, depthWrite: false
}));
scene.add(room);

/* ---------- LED dance floor ---------- */
const GX = 12, GZ = 12, TS = 1.02, FLOOR_Y = -1.3;
const floor = new THREE.InstancedMesh(new THREE.BoxGeometry(TS * .94, .06, TS * .94), new THREE.MeshBasicMaterial({ color: 0xffffff }), GX * GZ);
const cells = [];
for (let x = 0; x < GX; x++) for (let z = 0; z < GZ; z++) {
  d.position.set((x - GX / 2 + .5) * TS, FLOOR_Y, (z - GZ / 2 + .5) * TS - 1); d.rotation.set(0, 0, 0); d.updateMatrix();
  const i = cells.length; floor.setMatrixAt(i, d.matrix); floor.setColorAt(i, new THREE.Color(0, 0, 0));
  cells.push({ x, z, px: d.position.x, pz: d.position.z, glow: 0, col: new THREE.Color() });
}
scene.add(floor);
const palette = [0xff3ea5, 0x38e1ff, 0xffd166, 0x9b6bff, 0xff7a3e].map(c => new THREE.Color(c));
let pattern = 0, beatN = 0;
const ripples = [];

/* ---------- sweeping beams ---------- */
const beamMat = c => new THREE.ShaderMaterial({
  uniforms: { uA: { value: 0 }, uC: { value: new THREE.Color(c) } },
  vertexShader: `varying vec2 vUv;varying vec3 vN;varying vec3 vV;void main(){vUv=uv;vec4 mv=modelViewMatrix*vec4(position,1.);vN=normalize(normalMatrix*normal);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}`,
  fragmentShader: `varying vec2 vUv;varying vec3 vN;varying vec3 vV;uniform float uA;uniform vec3 uC;void main(){float e=pow(abs(dot(vN,vV)),1.6);float a=e*vUv.y*.22*uA;gl_FragColor=vec4(uC*a,a);}`,
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide
});
const beams = [[-6, 0xff3ea5], [6, 0x38e1ff], [-3, 0xffd166], [3, 0x9b6bff]].map(([x, c], i) => {
  const g = new THREE.Group(); g.position.set(x, 7.5, -4); scene.add(g);
  const cone = new THREE.Mesh(new THREE.ConeGeometry(1.3, 13, 32, 1, true), beamMat(c)); cone.position.y = -6.5; g.add(cone);
  return { g, cone, ph: i * 1.7 };
});
// a beam from above onto the ball
const topBeam = new THREE.Mesh(new THREE.ConeGeometry(1.8, 8, 32, 1, true), beamMat(0xffffff)); topBeam.position.set(0, BALL_Y + 4.5, 0); scene.add(topBeam);

/* ---------- glitter ---------- */
const GN = small ? 300 : 500, gPos = new Float32Array(GN * 3), gVel = new Float32Array(GN);
for (let i = 0; i < GN; i++) { gPos.set([rand(-8, 8), rand(-1, 10), rand(-8, 5)], i * 3); gVel[i] = rand(.3, .8); }
const gGeo = new THREE.BufferGeometry(); gGeo.setAttribute('position', new THREE.BufferAttribute(gPos, 3));
const sparkTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
  const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, '#fff'); g.addColorStop(.25, 'rgba(255,230,255,.7)'); g.addColorStop(1, 'rgba(255,200,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64);
  x.fillStyle = '#fff'; x.fillRect(31, 4, 2, 56); x.fillRect(4, 31, 56, 2); return new THREE.CanvasTexture(c); })();
const glitter = new THREE.Points(gGeo, new THREE.PointsMaterial({ size: .16, map: sparkTex, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, color: 0xffe8ff }));
scene.add(glitter);

/* ---------- post ---------- */
let composer = null;
if (THREE.EffectComposer && THREE.UnrealBloomPass) {
  composer = new THREE.EffectComposer(renderer);
  composer.addPass(new THREE.RenderPass(scene, camera));
  composer.addPass(new THREE.UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 1.0, .5, .35));
}
function resize() {
  renderer.setSize(innerWidth, innerHeight, false); camera.aspect = innerWidth / innerHeight;
  camera.fov = camera.aspect < .8 ? 70 : 55; camera.updateProjectionMatrix();
  if (composer) { composer.setPixelRatio(DPR); composer.setSize(innerWidth, innerHeight); }
}
addEventListener('resize', resize); resize();

/* ================= interaction ================= */
const S = { on: 0, spin: .35, spinV: 0, beat: 0, tx: 0, ty: 0, px: 0, py: 0, hue: 0 };
const ray = new THREE.Raycaster(), plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -FLOOR_Y), hit = new THREE.Vector3();
let dragX = null, lastX = 0, moved = 0;
addEventListener('pointerdown', e => { if (e.target.closest('.panel, button, a, input, select, label, form')) return; dragX = e.clientX; lastX = e.clientX; moved = 0; });
addEventListener('pointermove', e => {
  S.tx = e.clientX / innerWidth - .5; S.ty = e.clientY / innerHeight - .5;
  if (dragX !== null) { const dx = e.clientX - lastX; S.spinV += dx * .0006; moved += Math.abs(dx); lastX = e.clientX; }
}, { passive: true });
addEventListener('pointerup', e => {
  if (dragX !== null && moved < 10 && S.on > .5) {
    ray.setFromCamera(new THREE.Vector2(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1), camera);
    if (ray.ray.intersectPlane(plane, hit)) { ripples.push({ x: hit.x, z: hit.z, t: 0, col: palette[ripples.length % palette.length].clone() }); try { music.sfx((t, tone) => tone(84 + Math.floor(rand(0, 5)) * 2, t, { type: 'triangle', dur: .2, vol: .07 })); } catch (er) {} }
  }
  dragX = null;
});

/* ================= loop ================= */
let last = performance.now(), audioOffset = 0;
function frame(now) {
  const t = now / 1000, dt = Math.min(.05, (now - last) / 1000); last = now;

  // beat clock: fire events whose audio time has arrived
  const at = music.time();
  while (beats.length && beats[0].t <= at) {
    const b = beats.shift();
    if (b.kind === 'kick') { S.beat = 1; beatN++; }
    if (b.kind === 'bar') { pattern = (pattern + 1) % 4; S.hue = (S.hue + 1) % palette.length; }
  }
  S.beat *= Math.pow(.02, dt);
  root.style.setProperty('--beat', S.beat.toFixed(3));
  root.style.setProperty('--a', ((t * 60) % 360).toFixed(1) + 'deg');

  // ball
  S.spinV *= .97; S.spin += (.35 + S.spinV * 60) * dt * S.on + S.spinV;
  ball.rotation.y = S.spin; ball.rotation.x = .12;
  roomU.uRot.value = S.spin; roomU.uTime.value = t; roomU.uOn.value = S.on; roomU.uBeat.value = S.beat;
  ballLight.intensity = S.on * (1 + S.beat * 2);
  tileMat.envMapIntensity = 1.2 + S.beat * 1.8;

  // floor
  for (let i = 0; i < cells.length; i++) {
    const c = cells[i]; let v = 0, colIdx = (S.hue + c.x + c.z) % palette.length;
    if (pattern === 0) v = (c.x + c.z + beatN) % 4 === 0 ? 1 : .08;
    else if (pattern === 1) { const r = Math.hypot(c.x - GX / 2 + .5, c.z - GZ / 2 + .5); v = Math.abs(r - (beatN % 8)) < .8 ? 1 : .06; colIdx = (S.hue + Math.floor(r)) % palette.length; }
    else if (pattern === 2) v = ((c.x + beatN) % 3 === 0) ? .9 : .07;
    else v = (Math.sin(c.x * 1.3 + c.z * .7 + beatN * 1.7) > .6) ? 1 : .07;
    let rc = null;
    ripples.forEach(r => { const dd = Math.hypot(c.px - r.x, c.pz - r.z); const wave = Math.exp(-Math.pow(dd - r.t * 6, 2) * 1.5) * Math.max(0, 1 - r.t / 1.6); if (wave > .2) { v = Math.max(v, wave * 1.3); rc = r.col; } });
    c.glow += (v - c.glow) * Math.min(1, dt * 14);
    c.col.copy(rc || palette[colIdx]).multiplyScalar(c.glow * (.7 + S.beat * .8) * S.on + .02);
    floor.setColorAt(i, c.col);
  }
  floor.instanceColor.needsUpdate = true;
  ripples.forEach(r => r.t += dt); while (ripples.length && ripples[0].t > 1.6) ripples.shift();

  // beams
  beams.forEach((b, i) => {
    b.g.rotation.z = Math.sin(t * .7 + b.ph) * .6; b.g.rotation.x = Math.cos(t * .5 + b.ph) * .35;
    b.cone.material.uniforms.uA.value = S.on * (.6 + .4 * Math.sin(t * 3 + i) + S.beat * .5);
  });
  topBeam.material.uniforms.uA.value = S.on * .8;

  // glitter falls
  for (let i = 0; i < GN; i++) { gPos[i*3+1] -= gVel[i] * dt; gPos[i*3] += Math.sin(t + i) * dt * .2; if (gPos[i*3+1] < FLOOR_Y) gPos[i*3+1] = 10; }
  gGeo.attributes.position.needsUpdate = true; glitter.material.opacity = S.on * (.5 + S.beat * .5);

  // camera: low on the floor looking up at the ball; scroll walks you across the floor
  const sp = scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight);
  S.px += (S.tx - S.px) * .04; S.py += (S.ty - S.py) * .04;
  const ang = sp * Math.PI * 1.2 + S.px * .3;
  const R = 8.5 - sp * 2;
  camera.position.set(Math.sin(ang) * R, .6 + sp * 1.5 - S.py * .5, Math.cos(ang) * R);
  camera.lookAt(0, BALL_Y - .6 + Math.sin(t * 2) * .03 * S.beat, 0);

  composer ? composer.render() : renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

/* ================= opening ================= */
function tween(ms, fn) { return new Promise(res => { if (reduce) { fn(1); return res(); } const t0 = performance.now();
  (function l(n) { const k = Math.min(1, (n - t0) / ms); fn(1 - Math.pow(1 - k, 3)); k < 1 ? requestAnimationFrame(l) : res(); })(t0); }); }
$('#drop').addEventListener('click', async () => {
  $('#gate').classList.add('gone');
  try { music.sfx((t, tone, noise) => { noise(t, { dur: 1.4, vol: .12, freq: 600, type: 'bandpass', q: .4 }); tone(48, t, { dur: 1.4, vol: .12, slide: 24, type: 'sawtooth', cutoff: 1200 }); }); } catch (e) {}
  await tween(1600, k => { ballRig.position.y = 12 + (BALL_Y - 12) * k; });
  music.start(); musicBtn.hidden = false;
  tween(900, k => S.on = k);
  document.body.classList.add('on');
  await wait(1200);
  document.body.classList.remove('locked');
});

/* panels */
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .15 });
document.querySelectorAll('.panel').forEach(p => io.observe(p));

/* countdown */
const target = new Date('2027-12-31T20:00:00+00:00').getTime(), pad = (n, l = 2) => String(n).padStart(l, '0');
function count() { let s = Math.max(0, Math.floor((target - Date.now()) / 1000)); const dd = Math.floor(s / 86400); s %= 86400; const h = Math.floor(s / 3600); s %= 3600; const m = Math.floor(s / 60); s %= 60;
  $('#cd-d').textContent = pad(dd, 3); $('#cd-h').textContent = pad(h); $('#cd-m').textContent = pad(m); $('#cd-s').textContent = pad(s); }
count(); setInterval(count, 1000);

/* RSVP */
$('#form').addEventListener('submit', e => {
  e.preventDefault();
  const name = $('#f-name').value.trim();
  if (!name) { $('#err').textContent = 'Add your name so the door knows you.'; $('#f-name').focus(); return; }
  $('#err').textContent = '';
  const yes = $('#f-yes').checked, first = name.split(' ')[0];
  $('#thanks-msg').textContent = yes ? `${first}, your name’s on the door. Wear something that sparkles.` : `We’ll miss you, ${first}. We’ll dance one for you.`;
  $('#rsvp').classList.add('done');
  // NOTE: connect a form backend here to collect replies.
  if (yes) { S.spinV += .05; for (let i = 0; i < 6; i++) ripples.push({ x: rand(-4, 4), z: rand(-5, 3), t: -i * .15, col: palette[i % palette.length].clone() }); }
});
})();
