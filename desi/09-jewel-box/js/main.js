/* Jewel Box — a burgundy velvet box with a gold clasp opens (to a music-box melody) on a faceted diamond ring resting in
   satin, the couple's monogram foiled inside the lid. Scrolling orbits the ring, and each celebration swaps the stone. */
(() => {
'use strict';
const $ = s => document.querySelector(s);
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const small = Math.min(innerWidth, innerHeight) < 600;
const rand = (a = 0, b = 1) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const SETTLE = location.hash === '#settle';

/* ================= music: a music box over soft strings ================= */
const MEL = [81, 0, 88, 0, 85, 0, 83, 0, 86, 0, 83, 0, 81, 0, 85, 0, 88, 0, 90, 0, 88, 0, 85, 0, 86, 0, 85, 0, 83, 0, 81, 0, 80, 0, 81, 0, 85, 0, 83, 0, 80, 0, 81, 0, 0, 0, 0, 0];
const CH = [[45, 57, 61, 64], [50, 62, 66, 69], [52, 59, 64, 68], [45, 57, 61, 64]];
const bell = (m, t, pluck, tone, v = 1) => { pluck(m, t, { vol: .12 * v, bright: .95, dur: 1.6 }); tone(m, t, { dur: 1.3, vol: .025 * v, partials: [[1, 1], [3.98, .25, .5]] }); };
const music = createMusic({ spb: .24, reverb: .55, volume: .8, fadeIn: 1.5, play(step, t, tone, noise, pluck) {
  if (step % 12 === 0) { const c = CH[(step / 12) % 4]; pluck(c[0], t, { vol: .14, bright: .5, dur: 2.6 }); c.slice(1).forEach(n => tone(n, t, { type: 'sawtooth', dur: 2.9, vol: .009, cutoff: 1500, attack: .5, sustain: true, vib: [5, 6] })); }
  if (step % 12 === 4 || step % 12 === 8) pluck(CH[Math.floor(step / 12) % 4][1 + (step % 12) / 4], t, { vol: .06, bright: .6, dur: 1.2 });
  const m = MEL[step % MEL.length]; if (m) bell(m, t, pluck, tone);
}});
const musicBtn = $('#music');
musicBtn.addEventListener('click', () => { const on = music.toggle(); musicBtn.classList.toggle('off', !on); musicBtn.setAttribute('aria-label', on ? 'Pause music' : 'Play music'); });

/* ================= renderer ================= */
let renderer;
try { renderer = new THREE.WebGLRenderer({ canvas: $('#scene'), antialias: true, powerPreference: 'high-performance' }); }
catch (e) { $('#open').addEventListener('click', () => { $('#gate').classList.add('gone'); document.body.classList.remove('locked'); document.querySelectorAll('.stop').forEach(s => s.classList.add('in')); }); return; }
const DPR = Math.min(devicePixelRatio || 1, small ? 1.6 : 1.75);
renderer.setPixelRatio(DPR);
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1;
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x070407);
const camera = new THREE.PerspectiveCamera(38, innerWidth / innerHeight, .1, 100);
camera.position.set(0, 5, 11);

// a bright, busy environment so every facet throws a glint
const pmrem = new THREE.PMREMGenerator(renderer);
const envS = new THREE.Scene(); envS.background = new THREE.Color(0x0a0608);
for (let i = 0; i < 60; i++) {
  const s = rand(.3, 1.4), m = new THREE.Mesh(new THREE.PlaneGeometry(s, s), new THREE.MeshBasicMaterial({ color: new THREE.Color().setHSL(rand(.05, .15), rand(0, .4), rand(.6, 1)).multiplyScalar(rand(1.5, 3)), side: THREE.DoubleSide }));
  const a = rand(0, Math.PI * 2), b = rand(-.2, 1.3); m.position.set(Math.cos(a) * Math.cos(b) * 6, Math.sin(b) * 6, Math.sin(a) * Math.cos(b) * 6); m.lookAt(0, 0, 0); envS.add(m);
}
const env = pmrem.fromScene(envS, .01).texture;

// backdrop
scene.add(new THREE.Mesh(new THREE.SphereGeometry(40, 32, 16), new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false,
  vertexShader: `varying vec3 vP;void main(){vP=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
  fragmentShader: `varying vec3 vP;void main(){float g=smoothstep(-.3,.6,vP.y)*smoothstep(1.,.2,abs(vP.x));vec3 c=mix(vec3(.02,.01,.015),vec3(.16,.03,.07),g*.6);gl_FragColor=vec4(c,1.);}` })));
const floor = new THREE.Mesh(new THREE.CircleGeometry(14, 64), new THREE.MeshStandardMaterial({ color: 0x0b0608, roughness: .25, metalness: .6, envMap: env, envMapIntensity: .3 }));
floor.rotation.x = -Math.PI / 2; scene.add(floor);

/* ---------- materials ---------- */
const velvet = new THREE.ShaderMaterial({ uniforms: { uC: { value: new THREE.Color(0x2e0612) }, uS: { value: new THREE.Color(0x9a3a55) } },
  vertexShader: `varying vec3 vN;varying vec3 vV;varying vec3 vW;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);vN=normalize(normalMatrix*normal);vV=normalize(-mv.xyz);vW=position;gl_Position=projectionMatrix*mv;}`,
  fragmentShader: `uniform vec3 uC,uS;varying vec3 vN;varying vec3 vV;varying vec3 vW;float h(vec3 p){return fract(sin(dot(floor(p*90.),vec3(12.9898,78.233,37.7)))*43758.5);}
    void main(){vec3 n=normalize(vN);float d=max(dot(n,normalize(vec3(.3,.8,.6))),0.);float rim=pow(1.-abs(dot(n,vV)),2.4);
      vec3 c=uC*(.3+.7*d)+uS*rim*.45;c*=.92+.16*h(vW);gl_FragColor=vec4(c,1.);}` });
const gold = new THREE.MeshStandardMaterial({ color: 0xd49e3e, metalness: 1, roughness: .2, envMap: env, envMapIntensity: 1.05 });
const satin = new THREE.MeshStandardMaterial({ color: 0xcfc1ad, roughness: .38, metalness: .05, envMap: env, envMapIntensity: .25 });

/* ---------- the box ---------- */
function rounded(w, d, r) { const s = new THREE.Shape(), x = -w / 2, y = -d / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + d - r); s.quadraticCurveTo(x + w, y + d, x + w - r, y + d);
  s.lineTo(x + r, y + d); s.quadraticCurveTo(x, y + d, x, y + d - r); s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y); return s; }
function slab(w, d, h, r, bevel = .06) { const g = new THREE.ExtrudeGeometry(rounded(w, d, r), { depth: h, bevelEnabled: true, bevelSize: bevel, bevelThickness: bevel, bevelSegments: 3, curveSegments: 8 }); g.rotateX(-Math.PI / 2); return g; }
const BW = 3.2, BH = 1.25, LH = .72;
const box = new THREE.Group(); scene.add(box);
const base = new THREE.Mesh(slab(BW, BW, BH, .35), velvet); box.add(base);
const band = new THREE.Mesh(slab(BW + .04, BW + .04, .06, .37, .01), gold); band.position.y = BH - .02; box.add(band);
const cushion = new THREE.Mesh(slab(BW - .5, BW - .5, .18, .25, .12), satin); cushion.position.y = BH - .02; box.add(cushion);
const slit = new THREE.Mesh(new THREE.PlaneGeometry(1.5, .035), new THREE.MeshBasicMaterial({ color: 0x5a4a3a })); slit.rotation.x = -Math.PI / 2; slit.position.set(0, BH + .3, .25); box.add(slit);
// lid, hinged along the back edge
const hinge = new THREE.Group(); hinge.position.set(0, BH + .04, -BW / 2); box.add(hinge);
const lid = new THREE.Mesh(slab(BW, BW, LH, .35), velvet); lid.position.z = BW / 2; hinge.add(lid);
const lidBand = new THREE.Mesh(slab(BW + .04, BW + .04, .06, .37, .01), gold); lidBand.position.set(0, 0, BW / 2); hinge.add(lidBand);
const clasp = new THREE.Mesh(new THREE.BoxGeometry(.42, .5, .08), gold); clasp.position.set(0, 0, BW + .07); hinge.add(clasp);
// monogram foiled into the satin lining of the lid
const lining = (() => { const c = document.createElement('canvas'); c.width = c.height = 512; const x = c.getContext('2d');
  x.fillStyle = '#efe4d3'; x.fillRect(0, 0, 512, 512);
  const g = x.createLinearGradient(0, 160, 512, 360); g.addColorStop(0, '#8a6420'); g.addColorStop(.5, '#e8c77a'); g.addColorStop(1, '#8a6420');
  x.strokeStyle = g; x.lineWidth = 3; x.strokeRect(40, 40, 432, 432); x.lineWidth = 1; x.strokeRect(54, 54, 404, 404);
  x.fillStyle = g; x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = '400 150px "Italiana", "Bodoni Moda", serif'; x.fillText('A Z', 256, 236);
  x.font = 'italic 34px "Bodoni Moda", serif'; x.fillText('Anika & Zayan', 256, 340); x.font = '22px "Jost", sans-serif'; x.fillText('M M X X V I I I', 256, 390);
  const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; return { t, c, x };
})();
const liningMesh = new THREE.Mesh(new THREE.PlaneGeometry(BW - .5, BW - .5), new THREE.MeshStandardMaterial({ map: lining.t, roughness: .5, envMap: env, envMapIntensity: .15 }));
liningMesh.rotation.x = Math.PI / 2; liningMesh.position.set(0, -.075, BW / 2); hinge.add(liningMesh);
if (document.fonts) document.fonts.ready.then(() => { const x = lining.x; x.fillStyle = '#efe4d3'; x.fillRect(0, 0, 512, 512);
  const g = x.createLinearGradient(0, 160, 512, 360); g.addColorStop(0, '#8a6420'); g.addColorStop(.5, '#e8c77a'); g.addColorStop(1, '#8a6420');
  x.strokeStyle = g; x.lineWidth = 3; x.strokeRect(40, 40, 432, 432); x.lineWidth = 1; x.strokeRect(54, 54, 404, 404);
  x.fillStyle = g; x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = '400 150px "Italiana", serif'; x.fillText('A Z', 256, 236);
  x.font = 'italic 34px "Bodoni Moda", serif'; x.fillText('Anika & Zayan', 256, 340); x.font = '22px "Jost", sans-serif'; x.fillText('M M X X V I I I', 256, 390); lining.t.needsUpdate = true; });

/* ---------- the ring ---------- */
const ring = new THREE.Group(); ring.position.set(0, BH + .72, .25); box.add(ring);
ring.add(new THREE.Mesh(new THREE.TorusGeometry(.46, .055, 20, 90), gold));
const cut = new THREE.LatheGeometry([[0, -.5], [.62, -.02], [.62, .04], [.42, .21], [0, .21]].map(([r, y]) => new THREE.Vector2(r, y)), 16);
const gemMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 1, roughness: .02, flatShading: true, envMap: env, envMapIntensity: 2.6 });
const gem = new THREE.Mesh(cut, gemMat); gem.scale.setScalar(.46); gem.position.y = .46 + .26; ring.add(gem);
const coreMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .25, blending: THREE.AdditiveBlending, depthWrite: false });
const core = new THREE.Mesh(cut, coreMat); core.scale.setScalar(.38); core.position.copy(gem.position); ring.add(core);
for (let i = 0; i < 4; i++) { const a = i / 4 * Math.PI * 2 + Math.PI / 4, p = new THREE.Mesh(new THREE.CylinderGeometry(.018, .022, .26, 6), gold); p.position.set(Math.cos(a) * .17, .58, Math.sin(a) * .17); p.rotation.set(Math.sin(a) * .35, 0, -Math.cos(a) * .35); ring.add(p); }
const head = new THREE.Mesh(new THREE.CylinderGeometry(.12, .08, .14, 12), gold); head.position.y = .5; ring.add(head);

/* ---------- sparkles ---------- */
const SN = 40, spPos = new Float32Array(SN * 3), spSeed = new Float32Array(SN);
for (let i = 0; i < SN; i++) { const a = rand(0, Math.PI * 2), r = rand(.05, .35); spPos.set([Math.cos(a) * r, rand(-.15, .25), Math.sin(a) * r], i * 3); spSeed[i] = rand(0, 100); }
const spGeo = new THREE.BufferGeometry(); spGeo.setAttribute('position', new THREE.BufferAttribute(spPos, 3)); spGeo.setAttribute('seed', new THREE.BufferAttribute(spSeed, 1));
const spU = { uT: { value: 0 }, uS: { value: 1 }, uBoost: { value: 0 }, uC: { value: new THREE.Color(1, 1, 1) } };
const sparkles = new THREE.Points(spGeo, new THREE.ShaderMaterial({ uniforms: spU, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending,
  vertexShader: `attribute float seed;uniform float uT,uS,uBoost;varying float vA;void main(){vA=pow(max(0.,sin(uT*(1.3+fract(seed)*2.5)+seed*9.)),18.)*(.7+uBoost);
    vec4 mv=modelViewMatrix*vec4(position,1.);gl_PointSize=uS*(.08+.12*vA)/-mv.z;gl_Position=projectionMatrix*mv;}`,
  fragmentShader: `uniform vec3 uC;varying float vA;void main(){vec2 p=gl_PointCoord-.5;float s=max(0.,1.-abs(p.x)*14.)*max(0.,1.-abs(p.y)*2.2)+max(0.,1.-abs(p.y)*14.)*max(0.,1.-abs(p.x)*2.2);
    s+=smoothstep(.2,0.,length(p))*.8;gl_FragColor=vec4(mix(vec3(1.),uC,.35)*s*vA,1.);}` }));
sparkles.position.copy(gem.position); ring.add(sparkles);

/* ---------- light ---------- */
const spot = new THREE.SpotLight(0xfff0dc, 2.4, 30, .38, .6, 1.4); spot.position.set(2, 9, 5); spot.target = box; scene.add(spot);
const inner = new THREE.PointLight(0xfff4e0, 0, 4, 2); inner.position.set(0, BH + 1.2, .3); box.add(inner);
scene.add(new THREE.AmbientLight(0x402028, .6));
const rim = new THREE.DirectionalLight(0xff8aa8, .5); rim.position.set(-5, 3, -6); scene.add(rim);

let composer = null;
if (THREE.EffectComposer && THREE.UnrealBloomPass) {
  composer = new THREE.EffectComposer(renderer); composer.addPass(new THREE.RenderPass(scene, camera));
  composer.addPass(new THREE.UnrealBloomPass(new THREE.Vector2(innerWidth / 2, innerHeight / 2), .6, .3, .9));
}
const resize = () => { renderer.setSize(innerWidth, innerHeight, false); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); if (composer) composer.setSize(innerWidth, innerHeight); spU.uS.value = innerHeight * DPR * .5; };
resize(); addEventListener('resize', resize);

/* ================= gems ================= */
const GEMS = { diamond: [0xffffff, 2.6], citrine: [0xffb21e, 2.2], ruby: [0xe0115f, 2.3], emerald: [0x14a866, 2.2], sapphire: [0x2f5bff, 2.4] };
let gemName = 'diamond'; const gemTarget = new THREE.Color(0xffffff);
function setGem(name) {
  if (name === gemName) return; gemName = name; gemTarget.setHex(GEMS[name][0]); gemMat.envMapIntensity = GEMS[name][1];
  spU.uBoost.value = 3; spin = 7;
  music.sfx((t, tone, noise, pluck) => [88, 93, 97].forEach((m, i) => bell(m, t + i * .07, pluck, tone, .8)));
}

/* ================= animate ================= */
let open = 0, openT = 0, sp = 0, spS = 0, spin = 0, drag = 0, dragV = 0, down = null;
addEventListener('scroll', () => { const H = document.documentElement.scrollHeight - innerHeight; sp = H > 0 ? clamp(scrollY / H, 0, 1) : 0; onScroll(); }, { passive: true });
$('#scene').addEventListener('pointerdown', e => { down = e.clientX; });
addEventListener('pointermove', e => { if (down == null) return; dragV = (e.clientX - down) * .006; down = e.clientX; drag += dragV; });
addEventListener('pointerup', () => { down = null; });
const clock = new THREE.Clock(), look = new THREE.Vector3(), CP = new THREE.Vector3();
(function frame() {
  const dt = Math.min(clock.getDelta(), .05), t = clock.elapsedTime;
  open += (openT - open) * Math.min(1, dt * (SETTLE ? 60 : 1.6));
  spS += (sp - spS) * Math.min(1, dt * 3);
  hinge.rotation.x = -1.92 * (1 - Math.pow(1 - open, 3));
  inner.intensity = open * .5;
  ring.position.y = BH - .9 + Math.pow(open, 1.5) * 1.62;
  const portrait = camera.aspect < 1, far = portrait ? 1.55 : 1;
  // closed: a three-quarter view of the box; open: in on the ring, then orbit as you scroll
  const ang = spS * Math.PI * 1.6 + drag + (open > .98 ? Math.sin(t * .2) * .15 : 0);
  const dist = (7.5 - open * 2.6 + Math.sin(spS * Math.PI) * .6) * far, h = 4.2 - open * 1.2 + Math.sin(spS * Math.PI * 2) * .3;
  CP.set(Math.sin(ang) * dist, h * (portrait ? 1.15 : 1), Math.cos(ang) * dist); camera.position.lerp(CP, Math.min(1, dt * 3));
  look.set(0, (1 + open * .9) - (portrait ? 1.05 : .3), 0); camera.lookAt(look);
  dragV *= .94; if (down == null) drag += dragV;
  spin *= Math.pow(.2, dt);
  ring.rotation.y = Math.sin(t * .5) * .35 + spin * t * 0 + (spin > .05 ? t * spin * .3 : 0);
  gem.rotation.y = t * .3; core.rotation.y = t * .3;
  gemMat.color.lerp(gemTarget, Math.min(1, dt * 3)); coreMat.color.copy(gemMat.color); spU.uC.value.copy(gemMat.color);
  spU.uT.value = t; spU.uBoost.value *= Math.pow(.3, dt);
  composer ? composer.render() : renderer.render(scene, camera);
  requestAnimationFrame(frame);
})();

/* ================= open the box ================= */
$('#open').addEventListener('click', () => {
  music.sfx((t, tone, noise) => { noise(t, { dur: .06, vol: .2, freq: 3000, type: 'bandpass', q: 2 }); tone(60, t, { dur: .08, vol: .1 }); noise(t + .1, { dur: 1.2, vol: .03, freq: 600, type: 'lowpass' }); });
  setTimeout(() => { music.start(); musicBtn.hidden = false; }, reduce ? 0 : 500);
  openT = 1; spU.uBoost.value = 4;
  $('#gate').classList.add('gone');
  setTimeout(() => { document.body.classList.remove('locked'); onScroll(); }, reduce || SETTLE ? 0 : 1800);
});

/* ================= stops ================= */
const stops = [...document.querySelectorAll('.stop')];
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting && openT) e.target.classList.add('in'); }), { threshold: .2 });
stops.forEach(s => io.observe(s));
function onScroll() {
  if (!openT) return;
  let cur = stops[0]; stops.forEach(s => { if (s.getBoundingClientRect().top < innerHeight * .55) cur = s; });
  cur.classList.add('in'); setGem(cur.dataset.gem);
}
window.__state = () => 'gem=' + gemName + ' open=' + open.toFixed(2);

/* ================= countdown & reply ================= */
const target = new Date('2028-04-21T20:00:00+06:00').getTime();
const cd = ['d', 'h', 'm', 's'].map(k => $('#cd-' + k));
function count() { const s = Math.max(0, Math.floor((target - Date.now()) / 1000));
  [Math.floor(s / 86400), Math.floor(s % 86400 / 3600), Math.floor(s % 3600 / 60), s % 60].forEach((n, i) => cd[i].textContent = String(n).padStart(2, '0')); }
count(); setInterval(count, 1000);
$('#form').addEventListener('submit', e => {
  e.preventDefault();
  const name = $('#f-name').value.trim(), yes = $('#f-yes').checked, n = +$('#f-count').value, err = $('#err');
  if (!name) { err.textContent = 'Kindly add your name.'; $('#f-name').focus(); return; }
  err.textContent = '';
  // NOTE: connect a form backend here (Google Forms, Formspree, Supabase…) — { name, attending: yes, guests: n }
  $('#thanks-msg').textContent = yes ? `Dear ${name.split(' ')[0]}, ${n > 1 ? n + ' places are' : 'your place is'} reserved. We cannot wait to celebrate with you.` : `Dear ${name.split(' ')[0]}, you will be missed. Thank you for your duas.`;
  $('.rsvp').classList.add('sent'); spU.uBoost.value = 5; spin = 8;
  music.sfx((t, tone, noise, pluck) => [81, 85, 88, 93].forEach((m, i) => bell(m, t + i * .1, pluck, tone, 1.2)));
});
})();
