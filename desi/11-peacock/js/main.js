/* Royal Peacock — about 150 iridescent 3D feathers (each one shaded in a shader: vane, barbs, shaft and a full eye)
   sweep up from a closed train into a full Mughal fan around a gold medallion with the couple's initials.
   Tap to make the peacock rattle its train; each section turns the fan to face you from a new angle. */
(() => {
'use strict';
const $ = s => document.querySelector(s);
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const small = Math.min(innerWidth, innerHeight) < 600;
const rand = (a = 0, b = 1) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const SETTLE = location.hash === '#settle';

/* ================= music: a bowed string melody over a drone and a slow dadra ================= */
const MEL = { 0: [74, 4], 4: [72, 2], 6: [71, 2], 8: [67, 4], 12: [65, 2], 14: [67, 2], 16: [71, 6], 22: [72, 2], 24: [74, 4], 28: [77, 4],
  32: [76, 2], 34: [74, 2], 36: [72, 4], 40: [71, 2], 42: [67, 2], 44: [65, 4], 48: [67, 2], 50: [65, 2], 52: [62, 8] };
const music = createMusic({ spb: .27, reverb: .55, volume: .82, fadeIn: 3, play(step, t, tone, noise, pluck) {
  if (step % 2 === 0) pluck([57, 62, 62, 50][(step >> 1) % 4], t, { vol: .08, buzz: .55, bright: .4, dur: 2.6 });
  const k = step % 6;
  if (k === 0 || k === 3) tone(45, t, { dur: .55, vol: k ? .1 : .17, slide: 4 });
  if (k === 1 || k === 2 || k === 4 || k === 5) tone(76, t, { dur: .14, vol: .03, partials: [[1, 1], [2.02, .4], [2.98, .2]] });
  const n = MEL[step % 64];
  if (n) tone(n[0], t, { type: 'sawtooth', dur: n[1] * .27 + .2, vol: .04, attack: .09, bend: 1, bendTime: .2, sustain: true, vib: [5.5, 20], bp: [1300, 1.8], partials: [[1, 1], [2, .25]] });
}});
const musicBtn = $('#music');
musicBtn.addEventListener('click', () => { const on = music.toggle(); musicBtn.classList.toggle('off', !on); musicBtn.setAttribute('aria-label', on ? 'Pause music' : 'Play music'); });
const rattle = (v = 1) => music.sfx((t, tone, noise) => { for (let i = 0; i < 26; i++) noise(t + i * .028, { dur: .03, vol: .035 * v * (1 - i / 30), freq: 4200, type: 'bandpass', q: 2 }); noise(t, { dur: .8, vol: .03 * v, freq: 2000, type: 'bandpass', q: .5 }); });

/* ================= renderer ================= */
let renderer;
try { renderer = new THREE.WebGLRenderer({ canvas: $('#scene'), antialias: true, powerPreference: 'high-performance' }); }
catch (e) { $('#open').addEventListener('click', () => { $('#gate').classList.add('gone'); document.body.classList.remove('locked'); document.querySelectorAll('.stop').forEach(s => s.classList.add('in')); }); return; }
const DPR = Math.min(devicePixelRatio || 1, small ? 1.6 : 1.75);
renderer.setPixelRatio(DPR);
renderer.outputEncoding = THREE.sRGBEncoding;
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x03100f);
const camera = new THREE.PerspectiveCamera(40, innerWidth / innerHeight, .1, 200);

// backdrop: a deep teal glow behind the fan
const backdrop = new THREE.Mesh(new THREE.PlaneGeometry(120, 120), new THREE.ShaderMaterial({ depthWrite: false,
  vertexShader: `varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
  fragmentShader: `varying vec2 vUv;void main(){vec2 p=vUv-vec2(.5,.52);float d=length(p);vec3 c=mix(vec3(.025,.12,.115),vec3(.005,.03,.03),smoothstep(0.,.2,d));
    float rays=.5+.5*sin(atan(p.y,p.x)*24.);c+=vec3(.2,.16,.06)*rays*.035*(1.-smoothstep(0.,.25,d));gl_FragColor=vec4(c,1.);}` })); backdrop.position.z = -6; scene.add(backdrop);

/* ---------- the feathers ---------- */
const fan = new THREE.Group(); scene.add(fan);
const ROWS = [
  { n: small ? 34 : 44, L: 4.7, tilt: -.3, spread: 1.42, z: -.3 },
  { n: small ? 28 : 36, L: 3.8, tilt: -.16, spread: 1.36, z: -.15 },
  { n: small ? 22 : 28, L: 2.85, tilt: -.05, spread: 1.26, z: 0 }
];
const feathers = [];
ROWS.forEach((r, ri) => { for (let i = 0; i < r.n; i++) { const u = (i / (r.n - 1)) * 2 - 1 + (ri % 2 ? .5 / r.n : 0); feathers.push({ u, row: ri, L: r.L * (1 - Math.abs(u) * .12) * rand(.96, 1.04), tilt: r.tilt, spread: r.spread, z: r.z, seed: rand(0, 100) }); } });
const fGeo = new THREE.PlaneGeometry(1, 1, 2, 14); fGeo.translate(0, .5, 0);
fGeo.setAttribute('aSeed', new THREE.InstancedBufferAttribute(new Float32Array(feathers.map(f => f.seed)), 1));
fGeo.setAttribute('aLen', new THREE.InstancedBufferAttribute(new Float32Array(feathers.map(f => f.L)), 1));
const fU = { uT: { value: 0 }, uGlow: { value: 0 } };
const fMat = new THREE.ShaderMaterial({ uniforms: fU, side: THREE.DoubleSide,
  vertexShader: `attribute float aSeed,aLen;uniform float uT;varying vec2 vUv;varying float vSeed,vLen,vFres;
    void main(){vUv=uv;vSeed=aSeed;vLen=aLen;vec3 p=position;p.z-=p.y*p.y*.28;p.x+=sin(uT*1.3+aSeed+p.y*3.)*.02*p.y;
      vec4 w=modelMatrix*instanceMatrix*vec4(p,1.);vec3 n=normalize(mat3(modelMatrix*instanceMatrix)*vec3(0.,0.,1.));
      vFres=abs(dot(n,normalize(cameraPosition-w.xyz)));gl_Position=projectionMatrix*viewMatrix*w;}`,
  fragmentShader: `uniform float uT,uGlow;varying vec2 vUv;varying float vSeed,vLen,vFres;
    void main(){float y=vUv.y,x=vUv.x-.5;
      float w=.5*pow(sin(3.14159*clamp(y,0.,1.)),.5)*smoothstep(0.,.18,y);
      float fr=.05*sin(y*150.+vSeed*7.)*smoothstep(.25,1.,y);
      if(abs(x)>w+fr)discard;
      float barb=.5+.5*sin(y*120.-abs(x)*70.+vSeed);
      vec3 irid=.5+.5*cos(6.2832*(vec3(0.,.33,.67)+vFres*.9+y*.4+uT*.04));
      vec3 body=mix(vec3(.02,.13,.08),vec3(.42,.3,.07),barb*.4+y*.25);
      body=mix(body,irid*vec3(.12,.55,.45),.28);
      float d=length(vec2(x*.8,(y-.78)*vLen*.95))/.3;
      vec3 col=body;
      if(vLen>2.){
        col=mix(vec3(.2,.55,.22),col,smoothstep(1.2,1.32,d));
        col=mix(vec3(.88,.64,.22),col,smoothstep(.95,1.05,d));
        col=mix(vec3(.04,.62,.56),col,smoothstep(.74,.82,d));
        col=mix(vec3(.06,.32,.95),col,smoothstep(.52,.6,d));
        col=mix(vec3(.02,.04,.22),col,smoothstep(.3,.38,d));
      }
      col*=.55+.35*barb;
      col+=smoothstep(.025,0.,abs(x))*(1.-smoothstep(.8,1.,y))*vec3(.45,.4,.28);
      col+=pow(1.-vFres,3.)*vec3(.05,.35,.3)+uGlow*vec3(.25,.2,.05)*barb;
      if(!gl_FrontFacing)col*=.55;
      gl_FragColor=vec4(col,1.);}` });
const fMesh = new THREE.InstancedMesh(fGeo, fMat, feathers.length); fMesh.frustumCulled = false; fan.add(fMesh);

/* ---------- the medallion ---------- */
const env = (() => { const pm = new THREE.PMREMGenerator(renderer), s = new THREE.Scene(); s.background = new THREE.Color(0x061a18);
  [[0xffe0a0, [0, 5, 3], 5], [0x6ff0d8, [-5, 1, 2], 3], [0xffffff, [4, 2, 4], 3], [0x2a5cff, [0, -4, 2], 3]].forEach(([c, p, z]) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(z, z), new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(2), side: THREE.DoubleSide })); m.position.set(...p); m.lookAt(0, 0, 0); s.add(m); });
  return pm.fromScene(s, .02).texture; })();
const goldM = new THREE.MeshStandardMaterial({ color: 0xd4a24c, metalness: 1, roughness: .22, envMap: env, envMapIntensity: 1.2 });
const medal = new THREE.Group(); medal.position.set(0, 0, .35); fan.add(medal);
const faceTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 512; const x = c.getContext('2d');
  const draw = () => { const g = x.createRadialGradient(256, 220, 20, 256, 256, 256); g.addColorStop(0, '#0f5a58'); g.addColorStop(1, '#04201f'); x.fillStyle = g; x.fillRect(0, 0, 512, 512);
    const gold = x.createLinearGradient(100, 150, 412, 360); gold.addColorStop(0, '#9c7426'); gold.addColorStop(.5, '#f3d68a'); gold.addColorStop(1, '#9c7426');
    x.strokeStyle = gold; x.lineWidth = 4; x.beginPath(); x.arc(256, 256, 226, 0, 7); x.stroke(); x.lineWidth = 1.5; x.beginPath(); x.arc(256, 256, 210, 0, 7); x.stroke();
    x.fillStyle = gold; x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = '400 190px "Italiana", "Bodoni Moda", serif'; x.fillText('A', 176, 262); x.fillText('I', 336, 262);
    x.font = 'italic 64px "Bodoni Moda", serif'; x.fillText('&', 256, 280); x.font = '400 24px "Jost", sans-serif'; x.fillText('M M X X V I I I', 256, 400);
    for (let i = 0; i < 2; i++) { x.save(); x.translate(256, 140); x.scale(i ? -1 : 1, 1); for (let k = 0; k < 5; k++) { x.beginPath(); x.ellipse(28 + k * 18, -k * 6 + 8, 10, 4, -.5, 0, 7); x.fill(); } x.restore(); }
    t.needsUpdate = true; };
  const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.center.set(.5, .5); t.rotation = Math.PI / 2; draw(); if (document.fonts) document.fonts.ready.then(draw); return t; })();
const disc = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, .14, 64), [goldM, new THREE.MeshStandardMaterial({ map: faceTex, metalness: .3, roughness: .35, envMap: env, envMapIntensity: .6 }), goldM]);
disc.rotation.x = Math.PI / 2; medal.add(disc);
medal.add(new THREE.Mesh(new THREE.TorusGeometry(1.03, .06, 12, 80), goldM));
const pearls = new THREE.InstancedMesh(new THREE.SphereGeometry(.05, 12, 8), new THREE.MeshStandardMaterial({ color: 0xfff6ea, roughness: .25, metalness: .1, envMap: env, envMapIntensity: .8 }), 36);
const dm = new THREE.Object3D(); for (let i = 0; i < 36; i++) { const a = i / 36 * Math.PI * 2; dm.position.set(Math.cos(a) * 1.16, Math.sin(a) * 1.16, 0); dm.updateMatrix(); pearls.setMatrixAt(i, dm.matrix); }
medal.add(pearls);
scene.add(new THREE.AmbientLight(0xffffff, .4)); const key = new THREE.DirectionalLight(0xfff0d8, 1); key.position.set(2, 3, 6); scene.add(key);

/* ---------- gold dust ---------- */
const DN = small ? 120 : 200, dPos = new Float32Array(DN * 3), dSeed = new Float32Array(DN);
for (let i = 0; i < DN; i++) { dPos.set([rand(-8, 8), rand(-6, 9), rand(-3, 3)], i * 3); dSeed[i] = rand(0, 100); }
const dGeo = new THREE.BufferGeometry(); dGeo.setAttribute('position', new THREE.BufferAttribute(dPos, 3)); dGeo.setAttribute('seed', new THREE.BufferAttribute(dSeed, 1));
const dU = { uT: { value: 0 }, uS: { value: 1 }, uB: { value: 0 } };
scene.add(new THREE.Points(dGeo, new THREE.ShaderMaterial({ uniforms: dU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  vertexShader: `attribute float seed;uniform float uT,uS,uB;varying float vA;void main(){vec3 p=position;p.y+=mod(uT*.25+seed,15.)-7.;p.x+=sin(uT*.3+seed)*.4;
    vA=(.3+.7*pow(.5+.5*sin(uT*2.+seed*5.),4.))*(1.+uB);vec4 mv=modelViewMatrix*vec4(p,1.);gl_PointSize=uS*.09/-mv.z;gl_Position=projectionMatrix*mv;}`,
  fragmentShader: `varying float vA;void main(){float d=length(gl_PointCoord-.5);gl_FragColor=vec4(vec3(1.,.82,.45)*smoothstep(.5,0.,d)*vA,1.);}` })));

let composer = null;
if (THREE.EffectComposer && THREE.UnrealBloomPass) {
  composer = new THREE.EffectComposer(renderer); composer.addPass(new THREE.RenderPass(scene, camera));
  composer.addPass(new THREE.UnrealBloomPass(new THREE.Vector2(innerWidth / 2, innerHeight / 2), .55, .4, .78));
}
const resize = () => { renderer.setSize(innerWidth, innerHeight, false); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); if (composer) composer.setSize(innerWidth, innerHeight); dU.uS.value = innerHeight * DPR * .5; };
resize(); addEventListener('resize', resize);

/* ================= animate ================= */
let open = 0, openT = 0, shiver = 0, turn = 0, turnT = 0, sp = 0, spS = 0;
const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), P = new THREE.Vector3(), S = new THREE.Vector3();
const clock = new THREE.Clock();
(function frame() {
  const dt = Math.min(clock.getDelta(), .05), t = clock.elapsedTime;
  open = SETTLE ? openT : Math.min(openT, open + dt / 2.6);
  shiver *= Math.pow(.25, dt); spS += (sp - spS) * Math.min(1, dt * 3); turn += (turnT - turn) * Math.min(1, dt * 1.5);
  const portrait = camera.aspect < 1, half = Math.tan(THREE.MathUtils.degToRad(20));
  const dist = Math.max(12, (portrait ? 7.4 : 11.5) / (2 * half * Math.min(camera.aspect, 1.4)));
  const vis = 2 * half * dist;
  camera.position.set(Math.sin(t * .15) * .4, (portrait ? -vis * .2 : -vis * .08) + 1.6, dist); camera.lookAt(0, (portrait ? -vis * .2 : -vis * .08) + 1.6, 0);
  fan.position.y = 0;
  fan.rotation.y = turn + Math.sin(t * .25) * .06; fan.rotation.x = -.08 + spS * .1;
  feathers.forEach((f, i) => {
    const e0 = clamp(open * 1.5 - (1 - Math.abs(f.u)) * .25 - f.row * .12, 0, 1), e = e0 * e0 * (3 - 2 * e0);
    const fanA = f.u * f.spread, closedA = Math.sign(f.u || 1) * (Math.PI - .08 * Math.abs(f.u));
    let a = closedA + (fanA - closedA) * e;
    a += Math.sin(t * 52 + f.seed * 9) * .014 * shiver + Math.sin(t * .8 + f.u * 3) * .01;
    E.set(f.tilt * e - (1 - e) * .7, 0, -a, 'ZXY'); Q.setFromEuler(E);
    P.set(0, 0, f.z); S.set(.8 * (f.row === 2 ? .85 : 1), f.L * (.55 + .45 * e), 1);
    M.compose(P, Q, S); fMesh.setMatrixAt(i, M);
  });
  fMesh.instanceMatrix.needsUpdate = true;
  medal.rotation.y = Math.sin(t * .5) * .25; medal.scale.setScalar(.6 + .4 * open);
  fU.uT.value = t; fU.uGlow.value = shiver * .6; dU.uT.value = t; dU.uB.value = shiver;
  composer ? composer.render() : renderer.render(scene, camera);
  requestAnimationFrame(frame);
})();

/* ================= interaction ================= */
let down = null;
$('#scene').addEventListener('pointerdown', e => { down = { x: e.clientX, y: e.clientY, t: performance.now() }; });
addEventListener('pointerup', e => { if (down && openT && Math.hypot(e.clientX - down.x, e.clientY - down.y) < 10 && performance.now() - down.t < 400) { shiver = 1.4; rattle(); } down = null; });
$('#open').addEventListener('click', () => {
  openT = 1; music.start(); musicBtn.hidden = false;
  setTimeout(() => { shiver = 1.2; rattle(1.2); }, reduce ? 0 : 2300);
  $('#gate').classList.add('gone');
  setTimeout(() => { document.body.classList.remove('locked'); onScroll(); }, reduce || SETTLE ? 0 : 2000);
});

/* ================= scroll ================= */
const stops = [...document.querySelectorAll('.stop')];
let cur = null;
function onScroll() {
  const H = document.documentElement.scrollHeight - innerHeight; sp = H > 0 ? clamp(scrollY / H, 0, 1) : 0;
  if (!openT) return;
  let c = stops[0]; stops.forEach(s => { if (s.getBoundingClientRect().top < innerHeight * .55) c = s; });
  c.classList.add('in');
  if (c !== cur) { const i = stops.indexOf(c); if (cur) { shiver = Math.max(shiver, .8); rattle(.5); } cur = c; turnT = [0, .5, -.5, .35, -.35, 0, 0][i] || 0; }
}
addEventListener('scroll', onScroll, { passive: true });

/* ================= countdown & reply ================= */
const target = new Date('2028-05-20T20:00:00+06:00').getTime();
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
  $('#thanks-msg').textContent = yes ? `Dear ${name.split(' ')[0]}, ${n > 1 ? n + ' seats have' : 'a seat has'} been reserved at the royal court.` : `Dear ${name.split(' ')[0]}, you will be missed. Thank you for your duas.`;
  $('.rsvp').classList.add('sent'); shiver = 1.6; rattle(1.3);
});
})();
