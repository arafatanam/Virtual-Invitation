/* Nikah — break the wax seal and a royal farman unrolls in front of a moonlit Mughal palace: onion dome, minarets,
   cypress avenues and a long reflecting pool that mirrors everything, including the fireworks (atishbazi). */
(() => {
'use strict';
const $ = s => document.querySelector(s);
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const small = Math.min(innerWidth, innerHeight) < 600;
const rand = (a = 0, b = 1) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const wait = ms => new Promise(r => setTimeout(r, reduce ? 0 : ms));
const SETTLE = location.hash === '#settle';

/* ================= music: santoor tremolo, harmonium drone and a soft daf, raag Kafi ================= */
const mel = [69, 0, 67, 65, 67, 0, 69, 0, 72, 0, 71, 69, 67, 0, 0, 0, 65, 0, 64, 62, 64, 0, 65, 67, 69, 0, 67, 0, 65, 0, 0, 0,
             74, 0, 72, 0, 71, 69, 71, 0, 72, 71, 69, 0, 67, 0, 69, 0, 65, 0, 67, 0, 64, 0, 62, 0, 62, 0, 0, 0, 0, 0, 0, 0];
const daf = (t, tone, noise, open) => { tone(open ? 47 : 52, t, { dur: open ? .5 : .18, vol: open ? .22 : .08, slide: -2 }); noise(t, { dur: open ? .12 : .05, vol: open ? .04 : .05, freq: open ? 900 : 3000, type: 'bandpass', q: .8 }); };
const music = createMusic({ spb: .19, reverb: .55, volume: .78, fadeIn: 3, play(step, t, tone, noise, pluck) {
  if (step % 32 === 0) [50, 57, 62, 65].forEach(n => tone(n, t, { type: 'sawtooth', dur: 6.2, vol: .012, cutoff: 1100, sustain: true, attack: .6, vib: [4.5, 6] }));
  const k = step % 12;
  if (k === 0) daf(t, tone, noise, true); if (k === 6) daf(t, tone, noise, true); if (k === 3 || k === 9 || k === 10) daf(t, tone, noise, false);
  const m = mel[step % mel.length];
  if (m) { pluck(m, t, { vol: .17, bright: .9, dur: 1.4 }); pluck(m, t + .095, { vol: .1, bright: .9, dur: 1.2 }); if (step % 4 === 0) pluck(m + 12, t + .045, { vol: .05, bright: .95, dur: .9 }); }
}});
const musicBtn = $('#music');
musicBtn.addEventListener('click', () => { const on = music.toggle(); musicBtn.classList.toggle('off', !on); musicBtn.setAttribute('aria-label', on ? 'Pause music' : 'Play music'); });

/* ================= renderer ================= */
let renderer, ok = true;
try { renderer = new THREE.WebGLRenderer({ canvas: $('#scene'), antialias: !small, powerPreference: 'high-performance' }); }
catch (e) { ok = false; }
const scene = ok ? new THREE.Scene() : null;
const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, .1, 400);
let composer = null, frameFn = () => {};
const boom = [];   // pending firework requests
const PZ = -40;   // palace z position

if (ok) {
const DPR = Math.min(devicePixelRatio || 1, small ? 1.5 : 1.75);
renderer.setPixelRatio(DPR);
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = .78;
scene.fog = new THREE.Fog(0x070d24, 70, 200);

/* ---------- sky, stars, crescent moon ---------- */
scene.add(new THREE.Mesh(new THREE.SphereGeometry(300, 32, 16), new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false,
  vertexShader: `varying vec3 vP;void main(){vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
  fragmentShader: `varying vec3 vP;float h(vec3 p){return fract(sin(dot(p,vec3(12.9898,78.233,37.719)))*43758.5453);}
    void main(){vec3 d=normalize(vP);float y=max(d.y,0.);vec3 c=mix(vec3(.06,.045,.14),vec3(.01,.018,.06),pow(y,.45));
    vec3 q=floor(d*320.);float s=step(.9965,h(q))*smoothstep(.02,.25,y)*(.5+.5*h(q+1.));
    float band=exp(-pow((d.x*.6+d.y-.55)*3.,2.))*.06;gl_FragColor=vec4(c+s+band*vec3(.6,.6,1.),1.);}` })));
const moonTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d');
  const g = x.createRadialGradient(128, 128, 20, 128, 128, 128); g.addColorStop(0, 'rgba(255,244,214,.45)'); g.addColorStop(1, 'rgba(255,244,214,0)');
  x.fillStyle = g; x.fillRect(0, 0, 256, 256);
  x.fillStyle = '#fff6dc'; x.beginPath(); x.arc(128, 128, 44, 0, Math.PI * 2); x.fill();
  x.globalCompositeOperation = 'destination-out'; x.beginPath(); x.arc(150, 112, 40, 0, Math.PI * 2); x.fill();
  const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; return t; })();
const moon = new THREE.Sprite(new THREE.SpriteMaterial({ map: moonTex, transparent: true, depthWrite: false, fog: false }));
moon.scale.set(22, 22, 1); moon.position.set(16, 46, -120); scene.add(moon);

/* ---------- materials ---------- */
const marble = new THREE.MeshStandardMaterial({ color: 0xd9d4e4, roughness: .6, metalness: 0, emissive: 0x0e0e22, emissiveIntensity: .5 });
const goldM = new THREE.MeshStandardMaterial({ color: 0xf0c35a, metalness: .9, roughness: .3, emissive: 0x6a4410, emissiveIntensity: .6 });
const glowM = new THREE.ShaderMaterial({ vertexShader: `varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
  fragmentShader: `varying vec2 vUv;void main(){vec3 c=mix(vec3(1.,.62,.25),vec3(.35,.12,.05),smoothstep(0.,6.,vUv.y));gl_FragColor=vec4(c*.95,1.);}` });

/* ---------- geometry helpers ---------- */
function archShape(w, spring, apex) {
  const a = apex - spring, d = (a * a - w * w / 4) / w, R = w / 2 + d, phMax = Math.acos(d / R), s = new THREE.Shape();
  s.moveTo(-w / 2, 0); s.lineTo(-w / 2, spring);
  for (let i = 0; i <= 24; i++) { const ph = i / 24 * phMax; s.lineTo(d - R * Math.cos(ph), spring + R * Math.sin(ph)); }
  for (let i = 24; i >= 0; i--) { const ph = i / 24 * phMax; s.lineTo(-d + R * Math.cos(ph), spring + R * Math.sin(ph)); }
  s.lineTo(w / 2, 0); s.closePath(); return s;
}
const onion = (scale = 1) => new THREE.LatheGeometry([[3, 0], [3.4, .8], [3.72, 1.8], [3.62, 2.8], [3.1, 3.8], [2.2, 4.7], [1.2, 5.4], [.45, 6], [.16, 6.5], [0, 6.65]].map(([r, y]) => new THREE.Vector2(r * scale, y * scale)), 32);
function chhatri(g, x, y, z, s) {
  const c = new THREE.Group(); c.position.set(x, y, z); g.add(c);
  for (let i = 0; i < 4; i++) { const a = i / 4 * Math.PI * 2 + Math.PI / 4, p = new THREE.Mesh(new THREE.CylinderGeometry(.08 * s * 3, .08 * s * 3, 1.4 * s * 3, 6), marble); p.position.set(Math.cos(a) * .9 * s * 3, .7 * s * 3, Math.sin(a) * .9 * s * 3); c.add(p); }
  const slab = new THREE.Mesh(new THREE.CylinderGeometry(1.25 * s * 3, 1.25 * s * 3, .15 * s * 3, 8), marble); slab.position.y = 1.45 * s * 3; c.add(slab);
  const d = new THREE.Mesh(onion(.33 * s), marble); d.position.y = 1.5 * s * 3; c.add(d);
  const f = new THREE.Mesh(new THREE.ConeGeometry(.08, .8 * s * 3, 6), goldM); f.position.y = 1.5 * s * 3 + 2.2 * s; c.add(f);
}

/* ---------- the palace ---------- */

function buildPalace() {
  const g = new THREE.Group(); g.position.z = PZ;
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(20, 1.4, 16), marble); plinth.position.y = .7; g.add(plinth);
  const body = new THREE.Mesh(new THREE.CylinderGeometry(5.6, 5.6, 7.4, 8), marble); body.rotation.y = Math.PI / 8; body.scale.z = .9; body.position.y = 1.4 + 3.7; g.add(body);
  const front = 5.6 * Math.cos(Math.PI / 8) * .9;
  // pishtaq: the tall frame around the great arch
  const pish = new THREE.Mesh(new THREE.BoxGeometry(5.4, 8.6, .5), marble); pish.position.set(0, 1.4 + 4.3, front + .1); g.add(pish);
  const iwan = new THREE.Mesh(new THREE.ShapeGeometry(archShape(3.4, 3.8, 6.6)), glowM); iwan.position.set(0, 1.4, front + .37); g.add(iwan);
  const trim = new THREE.Mesh(new THREE.ShapeGeometry(archShape(3.8, 3.8, 6.95)), goldM); trim.position.set(0, 1.4, front + .36); g.add(trim);
  [[-3.6, 1.9], [3.6, 1.9], [-3.6, 5.0], [3.6, 5.0]].forEach(([x, y]) => {
    const a = new THREE.Mesh(new THREE.ShapeGeometry(archShape(1.3, 1.3, 2.3)), glowM); a.position.set(x, 1.4 + y - 1.2, front - .35); g.add(a); });
  const drum = new THREE.Mesh(new THREE.CylinderGeometry(3, 3, 1.6, 32), marble); drum.position.y = 1.4 + 7.4 + .8; g.add(drum);
  const dome = new THREE.Mesh(onion(1), marble); dome.position.y = 1.4 + 7.4 + 1.6; g.add(dome);
  const top = 1.4 + 7.4 + 1.6 + 6.65;
  const spire = new THREE.Mesh(new THREE.CylinderGeometry(.06, .1, 1.6, 6), goldM); spire.position.y = top + .7; g.add(spire);
  [.25, .7].forEach(y => { const b = new THREE.Mesh(new THREE.SphereGeometry(.2, 12, 8), goldM); b.position.y = top + y; g.add(b); });
  const crescent = new THREE.Mesh(new THREE.TorusGeometry(.38, .06, 6, 20, Math.PI * 1.3), goldM); crescent.position.y = top + 1.75; crescent.rotation.z = -Math.PI * .15 + Math.PI / 2; g.add(crescent);
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => chhatri(g, sx * 3.9, 1.4 + 7.4, sz * 3.4, .36));
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => {
    const m = new THREE.Group(); m.position.set(sx * 9.2, 1.4, sz * 7.2); g.add(m);
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(.42, .5, 14, 16), marble); shaft.position.y = 7; m.add(shaft);
    [4.6, 9.2, 13.6].forEach(y => { const r = new THREE.Mesh(new THREE.CylinderGeometry(.78, .62, .3, 16), marble); r.position.y = y; m.add(r); });
    chhatri(m, 0, 14, 0, .2);
  });
  return g;
}
const palace = buildPalace(); scene.add(palace);
const palaceMirror = buildPalace(); palaceMirror.scale.y = -1; scene.add(palaceMirror);

/* ---------- gardens: lawns, walkways, pool, cypress avenues ---------- */
const lawn = new THREE.MeshStandardMaterial({ color: 0x0c1f18, roughness: 1 });
const walk = new THREE.MeshStandardMaterial({ color: 0x5a5668, roughness: .85 });
const plane = (w, d, x, z, m, y = 0) => { const p = new THREE.Mesh(new THREE.PlaneGeometry(w, d), m); p.rotation.x = -Math.PI / 2; p.position.set(x, y, z); scene.add(p); return p; };
const POOL_W = 3.4, POOL_Z0 = 6, POOL_Z1 = PZ + 8;
plane(2.2, POOL_Z0 - POOL_Z1, -(POOL_W / 2 + 1.1), (POOL_Z0 + POOL_Z1) / 2, walk, .02);
plane(2.2, POOL_Z0 - POOL_Z1, (POOL_W / 2 + 1.1), (POOL_Z0 + POOL_Z1) / 2, walk, .02);
plane(60, POOL_Z0 - POOL_Z1, -(POOL_W / 2 + 2.2 + 30), (POOL_Z0 + POOL_Z1) / 2, lawn);
plane(60, POOL_Z0 - POOL_Z1, (POOL_W / 2 + 2.2 + 30), (POOL_Z0 + POOL_Z1) / 2, lawn);
plane(200, 80, 0, POOL_Z1 - 40, lawn, -.01);
plane(200, 60, 0, POOL_Z0 + 30, lawn);
const waterU = { uTime: { value: 0 } };
const water = plane(POOL_W, POOL_Z0 - POOL_Z1, 0, (POOL_Z0 + POOL_Z1) / 2, new THREE.ShaderMaterial({ uniforms: waterU, transparent: true, depthWrite: false,
  vertexShader: `varying vec3 vW;void main(){vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}`,
  fragmentShader: `varying vec3 vW;uniform float uTime;void main(){float r=sin(vW.z*9.+uTime*1.6+sin(vW.x*4.+uTime)*1.5)*.5+.5;
    float glint=pow(r,14.)*.25;gl_FragColor=vec4(vec3(.02,.05,.14)+glint*vec3(.8,.8,1.),.58);}` }));
// cypress trees
const cyGeo = new THREE.ConeGeometry(.55, 4.2, 10); cyGeo.translate(0, 2.1, 0);
const cyM = new THREE.MeshStandardMaterial({ color: 0x0f2a20, roughness: .95 });
const cyPos = [];
for (let z = POOL_Z0 - 3; z > POOL_Z1 + 2; z -= 3.2) [-1, 1].forEach(s => cyPos.push([s * (POOL_W / 2 + 3.2), z]));
const cy = new THREE.InstancedMesh(cyGeo, cyM, cyPos.length);
const dmy = new THREE.Object3D();
cyPos.forEach(([x, z], i) => { dmy.position.set(x, 0, z); dmy.scale.set(1, rand(.9, 1.15), 1); dmy.updateMatrix(); cy.setMatrixAt(i, dmy.matrix); });
scene.add(cy);

/* ---------- lights ---------- */
scene.add(new THREE.HemisphereLight(0x8fa0ff, 0x10101a, .3));
const moonL = new THREE.DirectionalLight(0xc9d4ff, .7); moonL.position.set(20, 40, 30); scene.add(moonL);
[-5, 5].forEach(x => { const l = new THREE.PointLight(0xffa860, 1.3, 18, 1.8); l.position.set(x, 2.5, PZ + 10); scene.add(l); });
const flash = new THREE.PointLight(0xffffff, 0, 90, 1.2); flash.position.set(0, 26, PZ); scene.add(flash);

/* ---------- fireworks (with their reflection) ---------- */
const FN = small ? 1400 : 2400;
const fPos = new Float32Array(FN * 3), fCol = new Float32Array(FN * 3), fA = new Float32Array(FN);
const fVel = new Float32Array(FN * 3), fLife = new Float32Array(FN), fMax = new Float32Array(FN);
const fGeo = new THREE.BufferGeometry();
fGeo.setAttribute('position', new THREE.BufferAttribute(fPos, 3)); fGeo.setAttribute('color', new THREE.BufferAttribute(fCol, 3)); fGeo.setAttribute('alpha', new THREE.BufferAttribute(fA, 1));
const fU = { uScale: { value: innerHeight * DPR * .5 } };
const fMat = new THREE.ShaderMaterial({ uniforms: fU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, vertexColors: true,
  vertexShader: `attribute float alpha;varying vec3 vC;varying float vA;uniform float uScale;void main(){vC=color;vA=alpha;vec4 mv=modelViewMatrix*vec4(position,1.);gl_PointSize=uScale*.45*(.4+alpha)/-mv.z;gl_Position=projectionMatrix*mv;}`,
  fragmentShader: `varying vec3 vC;varying float vA;void main(){float d=length(gl_PointCoord-.5);float a=smoothstep(.5,0.,d);gl_FragColor=vec4(vC*a*vA*1.6,1.);}` });
const fw = new THREE.Points(fGeo, fMat); fw.frustumCulled = false; scene.add(fw);
const fwMirror = new THREE.Points(fGeo, fMat); fwMirror.scale.y = -1; fwMirror.frustumCulled = false; scene.add(fwMirror);
let fCursor = 0;
const FCOL = [[1, .82, .45], [1, .35, .5], [.5, .85, 1], [.6, 1, .6], [1, .6, .25], [.85, .6, 1]];
function burst(x, y, z, n = 220, col) {
  col = col || FCOL[Math.floor(rand(0, FCOL.length))]; const col2 = FCOL[Math.floor(rand(0, FCOL.length))], ring = Math.random() < .35, sp = rand(5, 8);
  for (let k = 0; k < n; k++) {
    const i = fCursor = (fCursor + 1) % FN;
    let u = rand(-1, 1), th = rand(0, Math.PI * 2); if (ring) u = rand(-.08, .08);
    const s = Math.sqrt(1 - u * u), v = sp * (ring ? 1 : Math.cbrt(rand(.2, 1)));
    fPos.set([x, y, z], i * 3); fVel.set([s * Math.cos(th) * v, u * v + (ring ? 0 : .5), s * Math.sin(th) * v * .6], i * 3);
    const c = k % 3 ? col : col2; fCol.set(c, i * 3); fLife[i] = fMax[i] = rand(1.4, 2.4);
  }
  flash.color.setRGB(col[0], col[1], col[2]); flash.intensity = 3.5;
  music.sfx((t, tone, noise) => { noise(t + .05, { dur: .9, vol: .07, freq: 600, type: 'lowpass' }); for (let i = 0; i < 6; i++) noise(t + .4 + i * rand(.05, .12), { dur: .05, vol: .02, freq: 6000 }); });
}
function updateFireworks(dt) {
  for (let i = 0; i < FN; i++) {
    if (fLife[i] <= 0) { fA[i] = 0; continue; }
    fLife[i] -= dt; const k = i * 3;
    fVel[k + 1] -= 3.2 * dt; fVel[k] *= .985; fVel[k + 1] *= .985; fVel[k + 2] *= .985;
    fPos[k] += fVel[k] * dt; fPos[k + 1] += fVel[k + 1] * dt; fPos[k + 2] += fVel[k + 2] * dt;
    const l = fLife[i] / fMax[i]; fA[i] = l * l * (.7 + .3 * Math.sin(i + fLife[i] * 30));
    if (fPos[k + 1] < .2) fLife[i] = 0;
  }
  fGeo.attributes.position.needsUpdate = true; fGeo.attributes.alpha.needsUpdate = true; fGeo.attributes.color.needsUpdate = true;
}

/* ---------- fireflies over the gardens ---------- */
const FF = small ? 70 : 120, ffPos = new Float32Array(FF * 3), ffSeed = [];
for (let i = 0; i < FF; i++) { ffSeed.push([rand(-12, 12), rand(.5, 4), rand(POOL_Z1, POOL_Z0), rand(0, 100)]); }
const ffGeo = new THREE.BufferGeometry(); ffGeo.setAttribute('position', new THREE.BufferAttribute(ffPos, 3));
const ffMat = new THREE.PointsMaterial({ color: 0xffd98a, size: .16, transparent: true, opacity: .9, blending: THREE.AdditiveBlending, depthWrite: false });
scene.add(new THREE.Points(ffGeo, ffMat));

/* ---------- post ---------- */
if (THREE.EffectComposer && THREE.UnrealBloomPass) {
  composer = new THREE.EffectComposer(renderer);
  composer.addPass(new THREE.RenderPass(scene, camera));
  composer.addPass(new THREE.UnrealBloomPass(new THREE.Vector2(innerWidth / 2, innerHeight / 2), .55, .45, .86));
}
const resize = () => { renderer.setSize(innerWidth, innerHeight, false); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); if (composer) composer.setSize(innerWidth, innerHeight); fU.uScale.value = innerHeight * DPR * .5; };
resize(); addEventListener('resize', resize);

/* ---------- animate ---------- */
const clock = new THREE.Clock();
let prog = 0, sm = 0, nextAuto = 4;
const look = new THREE.Vector3();
frameFn = () => {
  const dt = Math.min(clock.getDelta(), .05), t = clock.elapsedTime;
  sm += (prog - sm) * Math.min(1, dt * 3);
  const portrait = camera.aspect < 1;
  const z = 12 - sm * 24, y = 2.4 + sm * 2.6 + Math.sin(t * .2) * .15;
  camera.position.set(Math.sin(t * .1) * .6, y, z + (portrait ? 6 : 0));
  look.set(0, 8 + sm * 5, PZ); camera.lookAt(look);
  waterU.uTime.value = t;
  flash.intensity *= Math.pow(.05, dt);
  if (opened && t > nextAuto) { nextAuto = t + rand(2.5, 5); burst(rand(-14, 14), rand(20, 30), PZ + rand(-6, 6), small ? 160 : 240); }
  boom.splice(0).forEach(b => burst(...b));
  updateFireworks(dt);
  ffSeed.forEach(([x, y, z, s], i) => { ffPos[i * 3] = x + Math.sin(t * .4 + s) * .8; ffPos[i * 3 + 1] = y + Math.sin(t * .7 + s * 2) * .4; ffPos[i * 3 + 2] = z + Math.cos(t * .3 + s) * .8; });
  ffGeo.attributes.position.needsUpdate = true; ffMat.opacity = .6 + Math.sin(t * 3) * .3;
  composer ? composer.render() : renderer.render(scene, camera);
  requestAnimationFrame(frameFn);
};
addEventListener('scroll', () => { const H = document.documentElement.scrollHeight - innerHeight; prog = H > 0 ? clamp(scrollY / H, 0, 1) : 0; }, { passive: true });
requestAnimationFrame(frameFn);
}

addEventListener('scroll', () => document.documentElement.style.setProperty('--sy', (scrollY / innerHeight).toFixed(3)), { passive: true });

/* ================= break the seal ================= */
let opened = false;
const stage = $('#stage');
$('#seal').addEventListener('click', async e => {
  const seal = e.currentTarget; seal.disabled = true;
  music.sfx((t, tone, noise) => { noise(t, { dur: .12, vol: .25, freq: 1800, type: 'bandpass', q: .7 }); tone(40, t, { dur: .25, vol: .3, slide: -6 }); noise(t + .04, { dur: .3, vol: .06, freq: 400, type: 'lowpass' }); });
  stage.classList.add('open', 'unrolling');
  await wait(500);
  music.start(); musicBtn.hidden = false;
  stage.classList.add('revealed');
  opened = true;
  boom.push([-6, 24, PZ, 260], [7, 27, PZ - 4, 260]);
  await wait(2600);
  stage.classList.remove('unrolling');
  document.body.classList.remove('locked');
  $('#sealHint').textContent = 'Scroll for the celebrations';
  stage.classList.add('scrollcue');
});
if (!ok) { /* without WebGL the farman still works over the plain night background */ }

/* ================= reveal panels ================= */
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .15 });
document.querySelectorAll('.frame-card').forEach(el => io.observe(el));

/* ================= countdown ================= */
const target = new Date('2027-11-12T18:00:00+06:00').getTime();
const cd = ['d', 'h', 'm', 's'].map(k => $('#cd-' + k));
function count() { const s = Math.max(0, Math.floor((target - Date.now()) / 1000));
  [Math.floor(s / 86400), Math.floor(s % 86400 / 3600), Math.floor(s % 3600 / 60), s % 60].forEach((n, i) => cd[i].textContent = String(n).padStart(2, '0')); }
count(); setInterval(count, 1000);

/* ================= RSVP ================= */
$('#form').addEventListener('submit', e => {
  e.preventDefault();
  const name = $('#f-name').value.trim(), ev = [...document.querySelectorAll('fieldset input:checked')].map(i => i.value), n = +$('#f-count').value, err = $('#err');
  if (!name) { err.textContent = 'Please tell us your name.'; $('#f-name').focus(); return; }
  if (!ev.length) { err.textContent = 'Choose at least one event.'; return; }
  err.textContent = '';
  // NOTE: connect a form backend here (Google Forms, Formspree, Supabase…) — { name, events: ev, guests: n }
  const list = ev.length > 1 ? ev.slice(0, -1).join(', ') + ' and ' + ev.at(-1) : ev[0];
  $('#thanks-msg').textContent = `${name.split(' ')[0]}, your place is kept for ${n > 1 ? n + ' guests' : 'you'} at the ${list}. Please keep the couple in your duas.`;
  $('.rsvp').classList.add('sent');
  for (let i = 0; i < 5; i++) setTimeout(() => boom.push([rand(-12, 12), rand(20, 30), PZ + rand(-5, 5), 280]), i * 350);
});
})();
