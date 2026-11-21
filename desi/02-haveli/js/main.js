/* Shahi Mahal — carved palace doors swing open, then scrolling walks the camera through seven cusped Mughal arches hung with
   marigold strands, past rows of brass lamps and falling rose petals, to the couple's royal pavilion and throne. */
(() => {
'use strict';
const $ = s => document.querySelector(s);
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const small = Math.min(innerWidth, innerHeight) < 600;
const rand = (a = 0, b = 1) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const wait = ms => new Promise(r => setTimeout(r, reduce ? 0 : ms));

/* ================= music: sanai in raag Yaman over a drone and tabla ================= */
// Sa = D (62). Yaman: S R G M# P D N
const shehnai = { 0: [73, 2], 2: [64, 2], 4: [66, 4], 8: [68, 2], 10: [66, 2], 12: [64, 2], 14: [62, 2], 16: [69, 2], 18: [68, 1], 19: [71, 1], 20: [73, 4], 24: [74, 6], 30: [73, 2],
  32: [71, 3], 35: [69, 1], 36: [68, 2], 38: [66, 2], 40: [64, 3], 43: [66, 1], 44: [62, 6], 52: [66, 2], 54: [68, 2], 56: [69, 4], 60: [71, 1], 61: [73, 1], 62: [74, 2] };
const tabla = (t, tone, noise, bol) => {
  if (bol === 'dha' || bol === 'ge') tone(45, t, { dur: .45, vol: bol === 'dha' ? .2 : .12, slide: 4 });
  if (bol === 'dha' || bol === 'na' || bol === 'dhin') tone(74, t, { dur: bol === 'dhin' ? .35 : .16, vol: .06, partials: [[1, 1], [2.02, .4], [2.98, .25]] });
  if (bol === 'tin') tone(76, t, { dur: .2, vol: .045, partials: [[1, 1], [2.7, .3]] });
  if (bol !== 'ge') noise(t, { dur: .03, vol: .025, freq: 3500, type: 'bandpass', q: 2 });
};
const theka = ['dha', 'dhin', 'dhin', 'dha', 'dha', 'dhin', 'dhin', 'dha', 'dha', 'tin', 'tin', 'na', 'na', 'dhin', 'dhin', 'dha'];
const music = createMusic({ spb: .2, reverb: .45, volume: .8, fadeIn: 3, play(step, t, tone, noise, pluck) {
  const tp = [57, 62, 62, 50][(step >> 1) % 4];
  if (step % 2 === 0) pluck(tp, t, { vol: .1, buzz: .55, bright: .45, dur: 2.2 });
  if (step % 2 === 0) tabla(t, tone, noise, theka[(step >> 1) % 16]);
  const n = shehnai[step % 64];
  if (n) tone(n[0], t, { type: 'sawtooth', dur: n[1] * .2 + .12, vol: .045, attack: .05, bend: 1, bendTime: .1, vib: [6, 22], sustain: true, bp: [1500, 2.2], partials: [[1, 1], [2, .35]] });
}});
const musicBtn = $('#music');
musicBtn.addEventListener('click', () => { const on = music.toggle(); musicBtn.classList.toggle('off', !on); musicBtn.setAttribute('aria-label', on ? 'Pause music' : 'Play music'); });

/* ================= the door frame (cusped arch cut out of a carved wall) ================= */
function archPts(w, spring, apex, lobes, depth, steps = 60) {
  const a = apex - spring, d = (a * a - w * w / 4) / w, R = w / 2 + d, phMax = Math.acos(d / R), pts = [];
  for (let i = 0; i <= steps; i++) {
    const u = i / steps, ph = u * phMax, r = R - depth * (1 - Math.abs(Math.sin(lobes * Math.PI * u)));
    pts.push([-d + r * Math.cos(ph), spring + r * Math.sin(ph)]);
  }
  return pts;   // right half, from springline to apex
}
{ const pts = archPts(304, 0, 210, 4, 12, 80).map(([x, y]) => [200 + x, 300 - y]);   // right half, springline → apex (y down)
  const left = pts.map(([x, y]) => `${400 - x} ${y}`), right = pts.slice().reverse().slice(1).map(p => p.join(' '));
  const hole = `M48 800L48 300L${left.join('L')}L${right.join('L')}L352 300L352 800Z`;
  $('#frameShape').setAttribute('d', `M0 0H400V800H0Z${hole}`);
  $('#frameLine').setAttribute('d', hole.replace(/Z$/, ''));
  const big = archPts(340, 0, 240, 1, 0, 40).map(([x, y]) => [200 + x, 290 - y]);
  $('#frameLine2').setAttribute('d', `M30 800L30 290L${big.map(([x, y]) => `${400 - x} ${y}`).join('L')}L${big.slice().reverse().slice(1).map(p => p.join(' ')).join('L')}L370 290L370 800`);
  const toran = $('#toran'); for (let i = 0; i < (small ? 13 : 19); i++) { const el = document.createElement('i'); el.style.animationDelay = `${-rand(0, 2.6)}s`; toran.appendChild(el); }
}

/* ================= renderer ================= */
let renderer;
try { renderer = new THREE.WebGLRenderer({ canvas: $('#scene'), antialias: !small, powerPreference: 'high-performance' }); }
catch (e) { document.body.classList.remove('locked'); $('#doorway').remove(); return; }
const DPR = Math.min(devicePixelRatio || 1, small ? 1.5 : 1.75);
renderer.setPixelRatio(DPR);
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = .82;
const scene = new THREE.Scene();
const BG = new THREE.Color(0x14081c);
scene.background = BG; scene.fog = new THREE.Fog(BG, 14, 58);
const camera = new THREE.PerspectiveCamera(62, innerWidth / innerHeight, .1, 200);

// night sky dome with stars
{ const g = new THREE.SphereGeometry(150, 32, 16), m = new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false,
    vertexShader: `varying vec3 vP;void main(){vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader: `varying vec3 vP;float h(vec3 p){return fract(sin(dot(p,vec3(12.9898,78.233,37.719)))*43758.5453);}
      void main(){vec3 d=normalize(vP);float y=d.y;vec3 c=mix(vec3(.08,.03,.1),vec3(.02,.01,.05),smoothstep(0.,.6,y));
      vec3 q=floor(d*260.);float s=step(.996,h(q))*smoothstep(.0,.3,y);gl_FragColor=vec4(c+s*vec3(1.,.9,.8),1.);}` });
  scene.add(new THREE.Mesh(g, m)); }

/* ---------- textures ---------- */
function canvasTex(S, draw, rep) { const c = document.createElement('canvas'); c.width = c.height = S; draw(c.getContext('2d'), S);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.encoding = THREE.sRGBEncoding; if (rep) t.repeat.set(rep, rep); t.anisotropy = 4; return t; }
const marble = canvasTex(512, (x, S) => {
  x.fillStyle = '#efe3d0'; x.fillRect(0, 0, S, S);
  for (let i = 0; i < 40; i++) { x.strokeStyle = `rgba(150,120,100,${rand(.05, .14)})`; x.lineWidth = rand(.5, 2); x.beginPath(); let px = rand(0, S), py = rand(0, S); x.moveTo(px, py); for (let k = 0; k < 8; k++) { px += rand(-60, 60); py += rand(-60, 60); x.lineTo(px, py); } x.stroke(); }
  // pietra dura medallion: red & green inlay flower
  x.translate(S / 2, S / 2);
  for (let i = 0; i < 8; i++) { x.rotate(Math.PI / 4); x.fillStyle = '#a3243a'; x.beginPath(); x.ellipse(0, -70, 20, 46, 0, 0, Math.PI * 2); x.fill(); x.fillStyle = '#2f6b3a'; x.beginPath(); x.ellipse(0, -140, 9, 26, 0, 0, Math.PI * 2); x.fill(); }
  x.fillStyle = '#c99a2e'; x.beginPath(); x.arc(0, 0, 26, 0, Math.PI * 2); x.fill();
  x.strokeStyle = '#c99a2e'; x.lineWidth = 5; x.beginPath(); x.arc(0, 0, 200, 0, Math.PI * 2); x.stroke();
  x.setTransform(1, 0, 0, 1, 0, 0); x.strokeStyle = 'rgba(160,120,60,.5)'; x.lineWidth = 6; x.strokeRect(0, 0, S, S);
});
const stoneTex = canvasTex(256, (x, S) => {
  x.fillStyle = '#f4e7d4'; x.fillRect(0, 0, S, S);
  x.strokeStyle = 'rgba(176,58,72,.35)'; x.lineWidth = 3;
  for (let i = 0; i < 4; i++) { x.beginPath(); x.arc(S / 2, S / 2, 30 + i * 26, 0, Math.PI * 2); x.stroke(); }
  x.fillStyle = 'rgba(176,58,72,.35)'; for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; x.beginPath(); x.ellipse(S / 2 + Math.cos(a) * 62, S / 2 + Math.sin(a) * 62, 6, 14, a + Math.PI / 2, 0, Math.PI * 2); x.fill(); }
});

/* ---------- materials ---------- */
const stoneMat = new THREE.MeshStandardMaterial({ map: stoneTex, roughness: .75, metalness: 0, color: 0xe2bfa0, emissive: 0x2a0e06, emissiveIntensity: .2 });
const goldMat = new THREE.MeshStandardMaterial({ color: 0xffc35a, metalness: .85, roughness: .3, emissive: 0x6a3a06, emissiveIntensity: .45 });
const floorMat = new THREE.MeshStandardMaterial({ map: marble, roughness: .45, metalness: .05, color: 0xa89480 });
marble.repeat.set(2, 16);

/* ---------- floor ---------- */
const SP = 9, NARCH = 7, Z0 = -4, MANDAP_Z = Z0 - NARCH * SP - 4;
const floor = new THREE.Mesh(new THREE.PlaneGeometry(14, 120), floorMat);
floor.rotation.x = -Math.PI / 2; floor.position.z = -50; scene.add(floor);

/* ---------- arches ---------- */
const OPEN_W = 5.4, SPRING = 4.3, APEX = 7.7, WALL_W = 13, WALL_H = 11;
const holePts = archPts(OPEN_W, SPRING, APEX, 5, .22, 70);
function archGeometry() {
  const s = new THREE.Shape();
  s.moveTo(-WALL_W / 2, 0); s.lineTo(-OPEN_W / 2, 0); s.lineTo(-OPEN_W / 2, SPRING);
  holePts.forEach(([x, y]) => s.lineTo(-x, y));
  holePts.slice().reverse().slice(1).forEach(([x, y]) => s.lineTo(x, y));
  s.lineTo(OPEN_W / 2, 0); s.lineTo(WALL_W / 2, 0); s.lineTo(WALL_W / 2, WALL_H); s.lineTo(-WALL_W / 2, WALL_H); s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: .9, bevelEnabled: true, bevelThickness: .06, bevelSize: .06, bevelSegments: 1, curveSegments: 4 });
  const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * .45, uv.getY(i) * .45);
  return g;
}
const archGeo = archGeometry();
const trimCurve = new THREE.CatmullRomCurve3([[-OPEN_W / 2, 0], ...holePts.map(([x, y]) => [-x, y]), ...holePts.slice().reverse().slice(1), [OPEN_W / 2, 0]]
  .map(([x, y]) => new THREE.Vector3(x * 1.02, y + (y > 0 ? .02 : 0), .98)), false, 'catmullrom', .1);
const trimGeo = new THREE.TubeGeometry(trimCurve, 260, .07, 6, false);
const frameGeo = new THREE.BoxGeometry(.12, .12, .12);
const medalGeo = new THREE.CircleGeometry(.42, 24);
const arches = [];
const flowerGeo = new THREE.IcosahedronGeometry(.12, 1);
const flowerMat = new THREE.MeshStandardMaterial({ roughness: .7, metalness: 0, emissive: 0x401000, emissiveIntensity: .5 });
const MARI = [0xffa31a, 0xff8c00, 0xffc93c, 0xf26b1d, 0xd81b60].map(c => new THREE.Color(c));
const dummy = new THREE.Object3D();
for (let i = 0; i < NARCH; i++) {
  const g = new THREE.Group(); g.position.z = Z0 - i * SP; scene.add(g);
  g.add(new THREE.Mesh(archGeo, stoneMat));
  const trim = new THREE.Mesh(trimGeo, goldMat); g.add(trim);
  // alfiz frame (rectangle around the arch)
  [[0, APEX + .7, OPEN_W + 2, .1], [-(OPEN_W / 2 + 1), (APEX + .7) / 2, .1, APEX + .7], [OPEN_W / 2 + 1, (APEX + .7) / 2, .1, APEX + .7]].forEach(([x, y, w, h]) => {
    const b = new THREE.Mesh(frameGeo, goldMat); b.scale.set(w / .12, h / .12, 1); b.position.set(x, y, .98); g.add(b); });
  // spandrel medallions
  [-1, 1].forEach(sx => { const m = new THREE.Mesh(medalGeo, goldMat); m.position.set(sx * (OPEN_W / 2 + .2), APEX - .3, .97); g.add(m); });
  // marigold: a swag across the opening + a curtain of strands
  const strands = [], swag = 26;
  for (let k = 0; k <= swag; k++) { const u = k / swag, x = (u - .5) * OPEN_W * .96; strands.push([x, SPRING + 2.2 - Math.sin(u * Math.PI) * .7 - (1 - Math.abs(Math.cos(u * Math.PI))) * .2, -.05, MARI[k % 3]]); }
  const NS = 9;
  for (let s = 0; s < NS; s++) {
    const u = (s + .5) / NS, x = (u - .5) * OPEN_W * .9, topY = Math.min(SPRING + Math.sqrt(Math.max(0, 1 - (x / (OPEN_W / 2)) ** 2)) * (APEX - SPRING) - .3, APEX - .4);
    const len = 1.2 + (1 - Math.abs(u - .5) * 2) * .2 + Math.abs(u - .5) * 2.4;
    for (let y = 0; y < len; y += .24) strands.push([x, topY - y, .15, (Math.round(y / .24) % 4 === 3) ? MARI[4] : MARI[(s + Math.round(y / .24)) % 4]]);
  }
  const inst = new THREE.InstancedMesh(flowerGeo, flowerMat, strands.length);
  strands.forEach(([x, y, z, c], k) => { dummy.position.set(x, y, z + .45); dummy.rotation.set(rand(0, 6), rand(0, 6), 0); dummy.scale.set(1, .8, 1); dummy.updateMatrix(); inst.setMatrixAt(k, dummy.matrix); inst.setColorAt(k, c); });
  const sway = new THREE.Group(); sway.position.y = APEX; inst.position.y = -APEX; sway.add(inst); g.add(sway);
  // a brass lantern in each arch
  const lamp = new THREE.Group(); lamp.position.set(0, APEX - .9, .45);
  const lb = new THREE.Mesh(new THREE.CylinderGeometry(.16, .22, .45, 8, 1, true), goldMat); lamp.add(lb);
  const lc = new THREE.Mesh(new THREE.ConeGeometry(.24, .3, 8), goldMat); lc.position.y = .35; lamp.add(lc);
  g.add(lamp);
  arches.push({ g, sway, lamp, ph: rand(0, 6) });
}

/* ---------- glow sprites (lantern glow) ---------- */
const glowTex = canvasTex(128, (x, S) => { const g = x.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  g.addColorStop(0, 'rgba(255,240,200,1)'); g.addColorStop(.2, 'rgba(255,180,90,.7)'); g.addColorStop(.6, 'rgba(255,120,40,.12)'); g.addColorStop(1, 'rgba(255,100,30,0)'); x.fillStyle = g; x.fillRect(0, 0, S, S); });
arches.forEach(a => { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, fog: false }));
  sp.scale.set(1.6, 1.6, 1); a.lamp.add(sp); a.glow = sp; });

/* ---------- diyas along the path ---------- */
const diyaPos = [];
for (let z = 2; z > MANDAP_Z + 3; z -= 1.5) [-2.3, 2.3].forEach(x => diyaPos.push([x + rand(-.1, .1), z + rand(-.2, .2)]));
for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; diyaPos.push([Math.cos(a) * 4.2, MANDAP_Z + Math.sin(a) * 4.2]); }
const bowlGeo = new THREE.LatheGeometry([[0, 0], [.14, .01], [.2, .06], [.22, .1], [.2, .11], [.05, .05]].map(([x, y]) => new THREE.Vector2(x, y)), 14);
const bowls = new THREE.InstancedMesh(bowlGeo, new THREE.MeshStandardMaterial({ color: 0xd9a845, metalness: .8, roughness: .3, emissive: 0x3a2000, emissiveIntensity: .5 }), diyaPos.length);
diyaPos.forEach(([x, z], i) => { dummy.position.set(x, 0, z); dummy.rotation.set(0, 0, 0); dummy.scale.set(1, 1, 1); dummy.updateMatrix(); bowls.setMatrixAt(i, dummy.matrix); });
scene.add(bowls);
const flameGeo = new THREE.BufferGeometry();
flameGeo.setAttribute('position', new THREE.Float32BufferAttribute(diyaPos.flatMap(([x, z]) => [x, .2, z]), 3));
flameGeo.setAttribute('seed', new THREE.Float32BufferAttribute(diyaPos.map(() => rand(0, 100)), 1));
const flameU = { uTime: { value: 0 }, uScale: { value: innerHeight * DPR * .5 } };
const flames = new THREE.Points(flameGeo, new THREE.ShaderMaterial({ uniforms: flameU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  vertexShader: `attribute float seed;uniform float uTime,uScale;varying float vF;void main(){vF=.8+.2*sin(uTime*13.+seed)*sin(uTime*7.3+seed*2.);
    vec4 mv=modelViewMatrix*vec4(position,1.);gl_PointSize=uScale*.32*vF/-mv.z;gl_Position=projectionMatrix*mv;}`,
  fragmentShader: `varying float vF;void main(){vec2 p=gl_PointCoord*2.-1.;p.y=-p.y;
    float body=1.-smoothstep(0.,1.,length(vec2(p.x*1.9/(1.1-p.y*.45),(p.y+.25)*1.05)));
    float halo=exp(-dot(p,p)*3.)*.35;vec3 c=mix(vec3(1.,.45,.08),vec3(1.,.95,.75),body*body);
    gl_FragColor=vec4(c*(body*1.6+halo)*vF,1.);}` }));
scene.add(flames);

/* ---------- mandap ---------- */
const mandap = new THREE.Group(); mandap.position.z = MANDAP_Z; scene.add(mandap);
{ const red = new THREE.MeshStandardMaterial({ color: 0xa3122e, roughness: .55, emissive: 0x3a0510, emissiveIntensity: .5, side: THREE.DoubleSide });
  const base = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 3.8, .3, 8), stoneMat); base.position.y = .15; mandap.add(base);
  [[-2.4, -2.4], [2.4, -2.4], [-2.4, 2.4], [2.4, 2.4]].forEach(([x, z]) => {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(.16, .2, 4.6, 12), stoneMat); p.position.set(x, 2.6, z); mandap.add(p);
    [.6, 2.2, 4.6].forEach(y => { const r = new THREE.Mesh(new THREE.TorusGeometry(.22, .05, 6, 16), goldMat); r.rotation.x = Math.PI / 2; r.position.set(x, y + .3, z); mandap.add(r); });
  });
  const dome = new THREE.Mesh(new THREE.SphereGeometry(3.5, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), red); dome.scale.y = .55; dome.position.y = 4.9; mandap.add(dome);
  const finial = new THREE.Mesh(new THREE.ConeGeometry(.2, .9, 10), goldMat); finial.position.y = 7; mandap.add(finial);
  const fringe = new THREE.Mesh(new THREE.TorusGeometry(3.5, .07, 6, 60), goldMat); fringe.rotation.x = Math.PI / 2; fringe.position.y = 4.9; mandap.add(fringe);
  // the couple's throne under the canopy
  const crimson = new THREE.MeshStandardMaterial({ color: 0x8e0e22, roughness: .7 });
  const seat = new THREE.Mesh(new THREE.BoxGeometry(2.4, .45, .9), crimson); seat.position.set(0, .75, -.6); mandap.add(seat);
  const sbase = new THREE.Mesh(new THREE.BoxGeometry(2.6, .3, 1), goldMat); sbase.position.set(0, .45, -.6); mandap.add(sbase);
  const bs = new THREE.Shape(); bs.moveTo(-1.3, 0); bs.lineTo(-1.3, 1); bs.quadraticCurveTo(-.9, 1.3, -.45, 1.25); bs.quadraticCurveTo(0, 2, .45, 1.25); bs.quadraticCurveTo(.9, 1.3, 1.3, 1); bs.lineTo(1.3, 0); bs.closePath();
  const sback = new THREE.Mesh(new THREE.ExtrudeGeometry(bs, { depth: .2, bevelEnabled: true, bevelSize: .05, bevelThickness: .05, bevelSegments: 2 }), goldMat); sback.position.set(0, .85, -1.15); mandap.add(sback);
  const cush = new THREE.Mesh(new THREE.ExtrudeGeometry(bs, { depth: .08, bevelEnabled: false }), crimson); cush.scale.set(.85, .8, 1); cush.position.set(0, .98, -.9); mandap.add(cush);
}
const fireU = { uTime: { value: 0 } };
const fireLight = new THREE.PointLight(0xffc27a, 2.2, 14, 1.6); fireLight.position.set(0, 4, 1.5); mandap.add(fireLight);

// couple's names in gold, floating above the mandap
let namesSprite;
function makeNames() {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 300; const x = c.getContext('2d');
  x.textAlign = 'center'; x.textBaseline = 'middle';
  x.font = '400 150px "Rozha One", Georgia, serif';
  const g = x.createLinearGradient(0, 60, 0, 240); g.addColorStop(0, '#fff3c4'); g.addColorStop(.5, '#ffc95a'); g.addColorStop(1, '#c98a1e');
  x.shadowColor = 'rgba(255,170,60,.8)'; x.shadowBlur = 30; x.fillStyle = g; x.fillText('Raisa & Fahim', 512, 150);
  const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding;
  namesSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false, opacity: 0, fog: false }));
  namesSprite.scale.set(7, 2.05, 1); namesSprite.position.set(0, 8.4, MANDAP_Z); scene.add(namesSprite);
}
(document.fonts && document.fonts.load ? document.fonts.load('150px "Rozha One"').catch(() => {}) : Promise.resolve()).then(makeNames);

/* ---------- falling rose petals ---------- */
const PETALS = small ? 160 : 300;
const petalGeo = new THREE.CircleGeometry(.07, 6); petalGeo.scale(1, 1.5, 1);
const petals = new THREE.InstancedMesh(petalGeo, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, transparent: true, opacity: .95 }), PETALS);
const pData = Array.from({ length: PETALS }, () => ({ x: rand(-5, 5), y: rand(0, 9), z: rand(-12, 4), vy: rand(.5, 1.1), r: rand(0, 6), vr: rand(1, 3), ph: rand(0, 6) }));
const PC = [0xc2102e, 0xe0284f, 0xff5f7e, 0xff9a1f, 0xffc93c].map(c => new THREE.Color(c));
pData.forEach((p, i) => petals.setColorAt(i, PC[i % PC.length]));
scene.add(petals);

/* ---------- lights ---------- */
scene.add(new THREE.HemisphereLight(0xffd7a8, 0x2a0a20, .35));
const moon = new THREE.DirectionalLight(0x9fb0ff, .25); moon.position.set(-6, 12, 4); scene.add(moon);
const camLights = [0, 1].map(() => { const l = new THREE.PointLight(0xffa04a, 1.1, 14, 1.8); scene.add(l); return l; });

/* ---------- post ---------- */
let composer = null;
if (THREE.EffectComposer && THREE.UnrealBloomPass) {
  composer = new THREE.EffectComposer(renderer);
  composer.addPass(new THREE.RenderPass(scene, camera));
  composer.addPass(new THREE.UnrealBloomPass(new THREE.Vector2(innerWidth / 2, innerHeight / 2), .6, .5, .86));
}
function resize() {
  renderer.setSize(innerWidth, innerHeight, false); camera.aspect = innerWidth / innerHeight;
  camera.fov = camera.aspect < .7 ? 70 : 58; camera.updateProjectionMatrix();
  if (composer) composer.setSize(innerWidth, innerHeight);
  flameU.uScale.value = innerHeight * DPR * .5;
}
resize(); addEventListener('resize', resize);

/* ================= scroll → walk ================= */
let prog = 0, smooth = 0, entered = 0, enterT = 0;
function onScroll() { const H = document.documentElement.scrollHeight - innerHeight; prog = H > 0 ? clamp(scrollY / H, 0, 1) : 0; }
addEventListener('scroll', onScroll, { passive: true });
let px = 0, py = 0;
addEventListener('pointermove', e => { px = e.clientX / innerWidth - .5; py = e.clientY / innerHeight - .5; });

const clock = new THREE.Clock();
const look = new THREE.Vector3();
function frame() {
  const dt = Math.min(clock.getDelta(), .05), t = clock.elapsedTime;
  smooth += (prog - smooth) * Math.min(1, dt * 4);
  entered += ((enterT) - entered) * Math.min(1, dt * 1.2);
  // camera path: starts outside the first arch, ends in front of the mandap and rises
  const zStart = 9, zEnd = MANDAP_Z + 8.5, k = smooth;
  const z = zStart + (zEnd - zStart) * k + (1 - entered) * 6;
  const y = 2.1 + Math.sin(k * 40) * .04 + Math.max(0, k - .88) * 14;
  camera.position.set(Math.sin(t * .3) * .25 + px * .6, y - py * .3, z);
  look.set(px * 1.2, 3.2 + Math.max(0, k - .88) * 8, z - 10);
  camera.lookAt(look);
  camLights[0].position.set(-1.8, 3, z - 5); camLights[1].position.set(1.8, 3, z - 13);
  arches.forEach(a => { a.sway.rotation.z = Math.sin(t * .9 + a.ph) * .012; a.sway.rotation.x = Math.sin(t * .7 + a.ph) * .02; a.lamp.rotation.y = t * .3; a.glow.material.opacity = .7 + Math.sin(t * 8 + a.ph) * .08; });
  flameU.uTime.value = t; fireU.uTime.value = t;
  fireLight.intensity += (2.2 - fireLight.intensity) * Math.min(1, dt * 2);
  if (namesSprite) namesSprite.material.opacity = clamp((k - .8) * 6, 0, 1);
  // petals drift around the camera
  pData.forEach((p, i) => {
    p.y -= p.vy * dt; p.r += p.vr * dt; p.ph += dt;
    if (p.y < 0) { p.y = rand(7, 9); p.x = rand(-5, 5); p.z = camera.position.z + rand(-14, 2); }
    if (p.z > camera.position.z + 2) p.z -= 16;
    dummy.position.set(p.x + Math.sin(p.ph) * .3, p.y, p.z); dummy.rotation.set(p.r, p.r * .7, p.ph); dummy.scale.set(1, 1, 1); dummy.updateMatrix(); petals.setMatrixAt(i, dummy.matrix);
  });
  petals.instanceMatrix.needsUpdate = true;
  composer ? composer.render() : renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

/* ================= opening the doors ================= */
$('#knock').addEventListener('click', async () => {
  music.sfx((t, tone, noise) => [0, .22].forEach(d => { tone(48, t + d, { dur: .18, vol: .5, slide: -10 }); noise(t + d, { dur: .08, vol: .2, freq: 500, type: 'lowpass' }); }));
  await wait(600);
  const dw = $('#doorway'); dw.classList.add('opening');
  music.sfx((t, tone, noise) => { noise(t, { dur: 2.4, vol: .05, freq: 300, type: 'bandpass', q: .5 }); tone(40, t, { dur: 2.2, vol: .08, slide: 3, sustain: true }); });
  music.start(); musicBtn.hidden = false;
  enterT = 1;
  await wait(900); dw.classList.add('gone');
  await wait(1600); document.body.classList.remove('locked'); onScroll();
});

/* ================= reveal cards ================= */
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .25 });
document.querySelectorAll('.stop').forEach(el => io.observe(el));

/* ================= countdown ================= */
const target = new Date('2027-02-06T19:00:00+06:00').getTime();
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
  $('#thanks-msg').textContent = `${name.split(' ')[0]}, we can’t wait to see ${n > 1 ? 'all ' + n + ' of you' : 'you'} at the ${list}.`;
  $('.rsvp').classList.add('sent');
  // a shower of petals and a warm flare over the throne
  pData.forEach(p => { p.y = rand(6, 10); p.z = camera.position.z + rand(-10, 0); p.vy = rand(.8, 1.6); });
  fireLight.intensity = 6;
  music.sfx((t, tone, n2, pluck) => [62, 66, 69, 74, 78].forEach((m, i) => pluck(m, t + i * .1, { vol: .16, buzz: .4 })));
});
})();
