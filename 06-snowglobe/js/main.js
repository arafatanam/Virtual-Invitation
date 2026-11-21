/* Snow Globe — a real 3D glass globe with a tiny snowy world inside.
   Swipe to spin · shake (phone motion or button) to swirl the snow · aurora sky behind. */
(() => {
'use strict';
const $ = s => document.querySelector(s);
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const small = Math.min(innerWidth, innerHeight) < 600;
const rand = (a = 0, b = 1) => a + Math.random() * (b - a);
const wait = ms => new Promise(r => setTimeout(r, reduce ? 0 : ms));
function tween(ms, fn, e = t => t < .5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3) / 2) {
  return new Promise(res => { if (reduce) { fn(1); return res(); } const t0 = performance.now();
    (function l(n) { const k = Math.min(1, (n - t0) / ms); fn(e(k)); k < 1 ? requestAnimationFrame(l) : res(); })(t0); });
}

/* ================= music: a celesta waltz with sleigh bells ================= */
const ch = [[40,[55,59,64]],[36,[55,60,64]],[43,[55,59,62]],[38,[54,57,62]]];
const mel = [[83,0,79,0,76,0],[79,0,0,0,76,79],[83,0,86,0,83,79],[81,0,0,0,0,0],[83,0,79,0,76,0],[76,0,72,0,76,79],[78,0,79,0,81,78],[76,0,0,0,0,0]];
const cel = [[1,1,1],[2,.3,.4],[4.01,.1,.2]];
const music = createMusic({ spb: .2, reverb: .55, play(step, t, tone, noise) {
  const bar = Math.floor(step / 6) % 8, s = step % 6, [bass, c] = ch[bar % 4];
  if (s === 0) tone(bass, t, { type: 'triangle', dur: 1.2, vol: .1 });
  if (s === 2 || s === 4) c.forEach(n => tone(n + 12, t, { dur: .5, vol: .025, partials: cel }));
  const m = mel[bar][s]; if (m) tone(m, t, { dur: 1.6, vol: .06, partials: cel });
  if (s % 2 === 0) noise(t, { dur: .09, vol: .018, freq: 9000 });   // sleigh bells
}});
const musicBtn = $('#music');
musicBtn.addEventListener('click', () => { const on = music.toggle(); musicBtn.classList.toggle('off', !on); musicBtn.setAttribute('aria-label', on ? 'Pause music' : 'Play music'); });

/* split hero names into letters (they fall like snow) */
let ci = 0;
document.querySelectorAll('.names .w, .names .amp').forEach(w => {
  w.innerHTML = [...w.textContent].map(c => `<span class="char" style="--i:${ci++}">${c}</span>`).join('');
});

/* ================= renderer ================= */
let renderer;
try { renderer = new THREE.WebGLRenderer({ canvas: $('#scene'), antialias: true, powerPreference: 'high-performance' }); }
catch (e) { $('#loader p').textContent = 'This invitation needs a browser with WebGL.'; return; }
const DPR = Math.min(devicePixelRatio || 1, small ? 1.6 : 1.8);
renderer.setPixelRatio(DPR);
renderer.setClearColor(0x050a1a, 1);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(42, innerWidth / innerHeight, .1, 300);

const softDot = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
  const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.4, 'rgba(255,255,255,.6)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();

/* ---------- sky: gradient, stars, aurora, mountains ---------- */
const skyU = { uTime: { value: 0 }, uAur: { value: 0 }, uHue: { value: 0 } };
const skyPlane = new THREE.Mesh(new THREE.PlaneGeometry(160, 90), new THREE.ShaderMaterial({
  uniforms: skyU,
  vertexShader: `varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
  fragmentShader: `varying vec2 vUv;uniform float uTime,uAur,uHue;
    float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    float n(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),u.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),u.x),u.y);}
    void main(){vec2 p=vUv;
      vec3 c=mix(vec3(.05,.1,.2),vec3(.01,.02,.06),smoothstep(.2,.95,p.y));
      // stars
      vec2 g=floor(p*vec2(260.,150.));float s=h(g);c+=vec3(.9,.95,1.)*step(.993,s)*(.5+.5*sin(uTime*2.+s*80.))*smoothstep(.3,.7,p.y);
      // aurora: three curtains of light with vertical rays
      vec3 a=vec3(0.);
      for(int i=0;i<3;i++){float fi=float(i);
        float y=.56+fi*.07+.08*sin(p.x*3.+uTime*.12+fi*1.7)+.03*sin(p.x*9.-uTime*.3+fi);
        float d=p.y-y;
        float curtain=exp(-max(d,0.)*9.)*smoothstep(-.012,.02,d);
        float rays=.55+.45*n(vec2(p.x*60.+fi*13.,uTime*.25));
        vec3 col=mix(vec3(.2,1.,.6),vec3(.45,.4,1.),smoothstep(.0,.25,d)+fi*.25+uHue*.4);
        a+=col*curtain*rays*(.8-fi*.18);}
      c+=a*uAur*.85;
      gl_FragColor=vec4(c,1.);}`,
  depthWrite: false
}));
skyPlane.position.set(0, 12, -45); scene.add(skyPlane);
const ridge = new THREE.Mesh(new THREE.PlaneGeometry(160, 24), new THREE.ShaderMaterial({
  vertexShader: `varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
  fragmentShader: `varying vec2 vUv;float h(float x){return fract(sin(x*91.7)*4375.5);}
    float n(float x){float i=floor(x),f=fract(x);f=f*f*(3.-2.*f);return mix(h(i),h(i+1.),f);}
    void main(){float x=vUv.x*14.;float r=.25+abs(n(x)*.6+n(x*2.3)*.3+n(x*5.)*.1-.5)*1.1;
      if(vUv.y>r)discard;vec3 c=mix(vec3(.02,.04,.09),vec3(.55,.66,.85),smoothstep(r-.09,r,vUv.y)*step(.42,r));
      gl_FragColor=vec4(c*.9,1.);}`
}));
ridge.position.set(0, -6, -38); scene.add(ridge);

/* background snowfall (outside the globe) */
const BS = small ? 500 : 900, bsPos = new Float32Array(BS * 3), bsVel = new Float32Array(BS);
for (let i = 0; i < BS; i++) { bsPos.set([rand(-30, 30), rand(-15, 20), rand(-30, 4)], i * 3); bsVel[i] = rand(.4, 1.2); }
const bsGeo = new THREE.BufferGeometry(); bsGeo.setAttribute('position', new THREE.BufferAttribute(bsPos, 3));
const bgSnow = new THREE.Points(bsGeo, new THREE.PointsMaterial({ size: .16, map: softDot, transparent: true, opacity: .75, depthWrite: false }));
scene.add(bgSnow);

/* ---------- the globe ---------- */
const world = new THREE.Group(); scene.add(world);       // tilt/shake
const spin = new THREE.Group(); world.add(spin);         // drag rotation
const R = 2, C = new THREE.Vector3(0, .4, 0);

scene.add(new THREE.HemisphereLight(0xbcd4ff, 0x203050, .75));
const moon = new THREE.DirectionalLight(0xd6e4ff, .7); moon.position.set(-4, 6, 5); scene.add(moon);
const warm = new THREE.PointLight(0xffb060, 0, 4.5, 1.6); warm.position.set(.1, -.15, .35); spin.add(warm);

const snowMat = new THREE.MeshStandardMaterial({ color: 0xf4f8ff, roughness: .95 });
const ground = new THREE.Mesh(new THREE.SphereGeometry(1.7, 48, 16, 0, Math.PI * 2, 0, Math.PI / 2), snowMat);
ground.scale.y = .2; ground.position.y = -.72; spin.add(ground);

// cabin
const cabin = new THREE.Group(); cabin.position.set(.05, -.55, -.25); spin.add(cabin);
const wood = new THREE.MeshStandardMaterial({ color: 0x6b3f2a, roughness: .8 });
const body = new THREE.Mesh(new THREE.BoxGeometry(.9, .5, .6), wood); body.position.y = .25; cabin.add(body);
const roof = new THREE.Mesh(new THREE.CylinderGeometry(.48, .48, 1.02, 3), new THREE.MeshStandardMaterial({ color: 0x3a2a24, roughness: .9 }));
roof.rotation.z = Math.PI / 2; roof.rotation.x = Math.PI / 6; roof.position.y = .63; roof.scale.set(1, 1, .82); cabin.add(roof);
const roofSnow = new THREE.Mesh(new THREE.CylinderGeometry(.5, .5, 1.06, 3), snowMat);
roofSnow.rotation.copy(roof.rotation); roofSnow.position.y = .67; roofSnow.scale.set(1, 1, .7); cabin.add(roofSnow);
const chimney = new THREE.Mesh(new THREE.BoxGeometry(.1, .28, .1), wood); chimney.position.set(.25, .82, -.05); cabin.add(chimney);
const winMat = new THREE.MeshBasicMaterial({ color: 0x2a1a10 });
const winGeo = new THREE.PlaneGeometry(.16, .16);
const windows = [[-.25, .28], [.25, .28]].map(([x, y]) => { const w = new THREE.Mesh(winGeo, winMat.clone()); w.position.set(x, y, .302); cabin.add(w); return w; });
const door = new THREE.Mesh(new THREE.PlaneGeometry(.14, .26), new THREE.MeshStandardMaterial({ color: 0x3d2416 })); door.position.set(0, .13, .302); cabin.add(door);

// pines
const pineMat = new THREE.MeshStandardMaterial({ color: 0x173a2c, roughness: .9 });
[[-1.05, -.15, .9], [-.75, .55, .7], [1.0, .05, 1], [.8, -.7, .65], [-.3, -.95, .55], [.55, .85, .8], [-1.15, .7, .55]].forEach(([x, z, s]) => {
  const t = new THREE.Group(); t.position.set(x, -.65, z); t.scale.setScalar(s); spin.add(t);
  [[.38, .5, .35], [.3, .42, .62], [.2, .34, .86]].forEach(([r, h, y]) => {
    const c = new THREE.Mesh(new THREE.ConeGeometry(r, h, 10), pineMat); c.position.y = y; t.add(c);
    const sc = new THREE.Mesh(new THREE.ConeGeometry(r * .62, h * .4, 10), snowMat); sc.position.y = y + h * .3; t.add(sc);
  });
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(.05, .06, .25, 6), wood); trunk.position.y = .1; t.add(trunk);
});
// lamp post
const lamp = new THREE.Group(); lamp.position.set(-.55, -.62, .55); spin.add(lamp);
const post = new THREE.Mesh(new THREE.CylinderGeometry(.018, .025, .7, 8), new THREE.MeshStandardMaterial({ color: 0x222831, metalness: .6, roughness: .4 }));
post.position.y = .35; lamp.add(post);
const bulb = new THREE.Mesh(new THREE.SphereGeometry(.05, 12, 8), new THREE.MeshBasicMaterial({ color: 0x2a1a10 })); bulb.position.y = .73; lamp.add(bulb);
const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: softDot, color: 0xffc675, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
halo.scale.set(.6, .6, 1); halo.position.y = .73; lamp.add(halo);
// the couple
const couple = new THREE.Group(); couple.position.set(.35, -.6, .6); couple.rotation.y = -.3; spin.add(couple);
const skin = new THREE.MeshStandardMaterial({ color: 0xf0c9a8, roughness: .7 });
[[-.07, 0xfbfbff, .14], [.07, 0x1d2333, .1]].forEach(([x, col, r]) => {
  const p = new THREE.Group(); p.position.x = x;
  const b = new THREE.Mesh(new THREE.ConeGeometry(r, .3, 12), new THREE.MeshStandardMaterial({ color: col, roughness: .6 })); b.position.y = .15; p.add(b);
  const hd = new THREE.Mesh(new THREE.SphereGeometry(.045, 12, 8), skin); hd.position.y = .34; p.add(hd);
  couple.add(p);
});

// base with plaque
const base = new THREE.Group(); spin.add(base);
const baseMat = new THREE.MeshStandardMaterial({ color: 0x2a1c18, roughness: .35, metalness: .2, side: THREE.DoubleSide });
const goldMat = new THREE.MeshStandardMaterial({ color: 0xd8b26a, roughness: .25, metalness: 1 });
const baseShape = new THREE.LatheGeometry([[1.35, 0], [1.75, -.05], [1.95, -.5], [2.05, -1.05], [2.15, -1.12], [0, -1.12]].map(([x, y]) => new THREE.Vector2(x, y)), 64);
const baseMesh = new THREE.Mesh(baseShape, baseMat); baseMesh.position.y = -.9; base.add(baseMesh);
const band = new THREE.Mesh(new THREE.TorusGeometry(1.78, .035, 8, 96), goldMat); band.rotation.x = Math.PI / 2; band.position.y = -1.0; base.add(band);
const band2 = band.clone(); band2.scale.setScalar(1.15); band2.position.y = -1.95; base.add(band2);
const plaqueTex = (() => { const c = document.createElement('canvas'); c.width = 1024; c.height = 256; const x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 1024, 0); g.addColorStop(0, '#9c7a3d'); g.addColorStop(.5, '#f3d996'); g.addColorStop(1, '#9c7a3d');
  x.fillStyle = g; x.fillRect(0, 0, 1024, 256); x.strokeStyle = '#6d5224'; x.lineWidth = 6; x.strokeRect(14, 14, 996, 228);
  x.fillStyle = '#3b2a12'; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.font = '110px "Italianno", cursive'; x.fillText('Ingrid & Theo', 512, 112);
  x.font = '600 34px "Josefin Sans", sans-serif'; x.fillText('1 8 · 1 2 · 2 0 2 7', 512, 196);
  return new THREE.CanvasTexture(c); })();
const plaque = new THREE.Mesh(new THREE.CylinderGeometry(2.005, 2.06, .5, 64, 1, true, -.55, 1.1), new THREE.MeshStandardMaterial({ map: plaqueTex, metalness: .6, roughness: .35 }));
plaque.position.y = -1.6; base.add(plaque);

// snow inside the globe
const SN = small ? 700 : 1100, sPos = new Float32Array(SN * 3), sVel = new Float32Array(SN * 3), rest = new Uint8Array(SN);
const groundY = (x, z) => -.72 + .34 * Math.sqrt(Math.max(0, 1 - (x * x + z * z) / 2.89));
for (let i = 0; i < SN; i++) {
  const a = rand(0, 6.28), r = Math.sqrt(Math.random()) * 1.6, x = Math.cos(a) * r, z = Math.sin(a) * r;
  sPos.set([x, groundY(x, z) + .01, z], i * 3); rest[i] = 1;
}
const sGeo = new THREE.BufferGeometry(); sGeo.setAttribute('position', new THREE.BufferAttribute(sPos, 3));
const snow = new THREE.Points(sGeo, new THREE.PointsMaterial({ size: .05, map: softDot, transparent: true, depthWrite: false, color: 0xffffff }));
snow.frustumCulled = false; spin.add(snow);
// chimney smoke
const SM = 40, smPos = new Float32Array(SM * 3), smAge = new Float32Array(SM).map(() => Math.random());
const smGeo = new THREE.BufferGeometry(); smGeo.setAttribute('position', new THREE.BufferAttribute(smPos, 3));
const smoke = new THREE.Points(smGeo, new THREE.PointsMaterial({ size: .12, map: softDot, transparent: true, opacity: .25, depthWrite: false, color: 0xc8d4e8 }));
smoke.frustumCulled = false; spin.add(smoke);

// glass (front + back faces)
const glassShader = side => new THREE.ShaderMaterial({
  uniforms: { uAur: skyU.uAur, uFlash: { value: 0 } },
  vertexShader: `varying vec3 vN;varying vec3 vV;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);vN=normalize(normalMatrix*normal);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}`,
  fragmentShader: `varying vec3 vN;varying vec3 vV;uniform float uAur,uFlash;
    void main(){vec3 n=normalize(vN);${side === 'back' ? 'n=-n;' : ''}float f=pow(1.-abs(dot(n,vV)),2.6);
      float s1=pow(max(0.,dot(n,normalize(vec3(-.55,.55,.62)))),60.);
      float s2=pow(max(0.,dot(n,normalize(vec3(.7,.15,.7)))),220.);
      float streak=smoothstep(.985,1.,dot(n,normalize(vec3(-.3,.75,.6))))*.6;
      vec3 rim=mix(vec3(.6,.75,1.),vec3(.35,1.,.75),uAur*.35);
      vec3 c=rim*f*.9+vec3(1.)*(s1*1.3+s2*1.6+streak)+uFlash*.3;
      float a=clamp(f*.6+s1+s2+streak+.03,0.,1.)*${side === 'back' ? '.35' : '1.'};
      gl_FragColor=vec4(c,a);}`,
  transparent: true, depthWrite: false, side: side === 'back' ? THREE.BackSide : THREE.FrontSide
});
const glassBack = new THREE.Mesh(new THREE.SphereGeometry(R, 64, 48), glassShader('back'));
const glass = new THREE.Mesh(new THREE.SphereGeometry(R, 64, 48), glassShader('front'));
glassBack.position.copy(C); glass.position.copy(C);
glassBack.renderOrder = 9; glass.renderOrder = 10;
world.add(glassBack, glass);
spin.position.y = 0;

/* ---------- post ---------- */
let composer = null;
if (THREE.EffectComposer && THREE.UnrealBloomPass) {
  composer = new THREE.EffectComposer(renderer);
  composer.addPass(new THREE.RenderPass(scene, camera));
  composer.addPass(new THREE.UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), .7, .5, .62));
}

/* ---------- framing: keep the globe inside the hero's empty space on any screen ---------- */
const frame = { D: 10, H: 4, look: 0 };
function resize() {
  const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false);
  camera.aspect = w / h; camera.fov = camera.aspect < .8 ? 50 : 40; camera.updateProjectionMatrix();
  if (composer) { composer.setPixelRatio(DPR); composer.setSize(w, h); }
  const t = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  const H = Math.max(5.4 / (2 * .5), 2.45 / (camera.aspect * .9));   // globe ≈ 50% of height, ≤ 90% of width
  frame.D = H / t; frame.H = H; frame.look = .13 * H;                  // look a bit higher → globe sits lower
}
addEventListener('resize', resize); resize();

/* ================= interaction ================= */
const S = { yaw: -.35, yawV: 0, shake: 0, swirl: 0, tx: 0, ty: 0, px: 0, py: 0, aur: 0, lights: 0, intro: 1 };
const hero = $('#hero');
let dragX = null, lastX = 0;
hero.addEventListener('pointerdown', e => { dragX = e.clientX; lastX = e.clientX; });
addEventListener('pointermove', e => {
  S.tx = e.clientX / innerWidth - .5; S.ty = e.clientY / innerHeight - .5;
  if (dragX !== null) { S.yawV += (e.clientX - lastX) * .0022; lastX = e.clientX; }
}, { passive: true });
addEventListener('pointerup', () => dragX = null); addEventListener('pointercancel', () => dragX = null);

function shakeGlobe(power = 1) {
  S.shake = Math.min(1.4, S.shake + power);
  S.swirl = Math.min(2, S.swirl + power * 1.4);
  for (let i = 0; i < SN; i++) {
    if (rest[i] && Math.random() < .25 + power * .5) {
      rest[i] = 0;
      sVel[i*3] = rand(-1, 1) * power; sVel[i*3+1] = rand(1.2, 3.2) * power; sVel[i*3+2] = rand(-1, 1) * power;
    } else if (!rest[i]) { sVel[i*3+1] += rand(.5, 1.5) * power; }
  }
  try { music.sfx((t, tone, noise) => { noise(t, { dur: .5, vol: .06, freq: 3000, type: 'bandpass', q: .5 }); [88, 91, 95].forEach((m, k) => tone(m, t + k * .05, { dur: 1.2, vol: .03 })); }); } catch (e) {}
  if (navigator.vibrate) navigator.vibrate(30);
}
$('#shake').addEventListener('click', () => shakeGlobe(1));
let lastShake = 0, prevAcc = null;
function onMotion(e) {
  const a = e.accelerationIncludingGravity; if (!a || a.x == null) return;
  if (prevAcc) {
    const d = Math.abs(a.x - prevAcc.x) + Math.abs(a.y - prevAcc.y) + Math.abs(a.z - prevAcc.z);
    const now = performance.now();
    if (d > 18 && now - lastShake > 500) { lastShake = now; shakeGlobe(Math.min(1.3, d / 30)); }
  }
  prevAcc = { x: a.x, y: a.y, z: a.z };
}

/* ================= loop ================= */
let last = performance.now();
function loop(now) {
  const t = now / 1000, dt = Math.min(.05, (now - last) / 1000); last = now;
  skyU.uTime.value = t; skyU.uAur.value = S.aur * (.85 + .15 * Math.sin(t * .4));
  const sp = scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight);
  skyU.uHue.value = sp;

  // spin & shake
  S.yawV *= .94; S.yaw += S.yawV + dt * .08;
  spin.rotation.y = S.yaw + sp * Math.PI * 1.5;
  S.shake *= Math.pow(.04, dt);
  world.position.x = Math.sin(t * 38) * .09 * S.shake;
  world.position.y = Math.cos(t * 31) * .05 * S.shake;
  world.rotation.z = Math.sin(t * 25) * .06 * S.shake + S.px * -.05;
  world.rotation.x = S.py * .06 + .05;

  // snow physics (in the globe's local space)
  S.swirl *= Math.pow(.35, dt);
  for (let i = 0; i < SN; i++) {
    if (rest[i]) continue;
    const k = i * 3; let x = sPos[k], y = sPos[k+1], z = sPos[k+2];
    // swirl around the vertical axis + gentle turbulence
    sVel[k] += (-z * S.swirl * 1.6 + Math.sin(t * 2 + i) * .15) * dt;
    sVel[k+2] += (x * S.swirl * 1.6 + Math.cos(t * 1.7 + i) * .15) * dt;
    sVel[k+1] += (-.9 + S.swirl * .5) * dt;
    const drag = Math.pow(.18, dt); sVel[k] *= drag; sVel[k+1] *= drag; sVel[k+2] *= drag;
    if (sVel[k+1] < -.28) sVel[k+1] = -.28;
    x += sVel[k] * dt; y += sVel[k+1] * dt; z += sVel[k+2] * dt;
    const dx = x - 0, dy = y - .4, dz = z, d = Math.sqrt(dx*dx + dy*dy + dz*dz);
    if (d > R - .1) { const s = (R - .1) / d; x = dx * s; y = dy * s + .4; z = dz * s; sVel[k] *= -.4; sVel[k+1] *= -.4; sVel[k+2] *= -.4; }
    const gy = groundY(x, z);
    if (y < gy && S.swirl < .25) { y = gy + .005; rest[i] = 1; }
    else if (y < gy) { y = gy; sVel[k+1] = Math.abs(sVel[k+1]) * .3; }
    sPos[k] = x; sPos[k+1] = y; sPos[k+2] = z;
  }
  sGeo.attributes.position.needsUpdate = true;

  // smoke
  for (let i = 0; i < SM; i++) {
    smAge[i] += dt * .25; if (smAge[i] > 1) smAge[i] = 0;
    const a = smAge[i];
    smPos.set([.3 + Math.sin(a * 6 + i) * .06 * a + a * .15, .52 + a * .9, -.3 + Math.cos(i) * .04], i * 3);
  }
  smGeo.attributes.position.needsUpdate = true;
  smoke.material.opacity = .22 * S.lights;

  // background snow
  for (let i = 0; i < BS; i++) {
    bsPos[i*3+1] -= bsVel[i] * dt; bsPos[i*3] += Math.sin(t * .5 + i) * dt * .2;
    if (bsPos[i*3+1] < -15) bsPos[i*3+1] = 20;
  }
  bsGeo.attributes.position.needsUpdate = true;

  // lights
  const flick = .9 + .1 * Math.sin(t * 7) * Math.sin(t * 3.3);
  windows.forEach(w => w.material.color.setRGB(.16 + S.lights * 1.6 * flick, .1 + S.lights * 1.05 * flick, .06 + S.lights * .45));
  bulb.material.color.setRGB(.16 + S.lights * 1.8, .1 + S.lights * 1.3, .06 + S.lights * .6);
  halo.material.opacity = S.lights * .9; warm.intensity = S.lights * 1.6 * flick;

  // camera: pointer parallax + scroll drift
  S.px += (S.tx - S.px) * .05; S.py += (S.ty - S.py) * .05;
  const D = frame.D * (1 + sp * .25) + S.intro * 6;
  camera.position.set(S.px * 1.4, frame.look * .6 + sp * 1.5 - S.py * .8, D);
  camera.lookAt(0, frame.look + sp * 1.2, 0);

  composer ? composer.render() : renderer.render(scene, camera);
  requestAnimationFrame(loop);
}

/* ================= boot & opening ================= */
(async () => {
  try { await Promise.race([Promise.all([document.fonts.load('80px "Italianno"'), document.fonts.load('600 30px "Josefin Sans"')]), wait(2500)]); } catch (e) {}
  plaqueTex.needsUpdate = true;
  requestAnimationFrame(loop);
  $('#loader').classList.add('done');
})();

$('#wake').addEventListener('click', async () => {
  // iOS asks for motion permission; must happen inside the tap
  try {
    if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
      DeviceMotionEvent.requestPermission().then(s => { if (s === 'granted') addEventListener('devicemotion', onMotion); }).catch(() => {});
    } else addEventListener('devicemotion', onMotion);
  } catch (e) {}
  music.start();
  $('#gate').classList.add('gone');
  tween(3200, k => S.intro = 1 - k);
  await wait(700);
  shakeGlobe(1.2);
  document.body.classList.add('awake');
  tween(2600, k => S.lights = k);
  tween(5000, k => S.aur = k);
  await wait(2200);
  $('#dock').hidden = false;
  document.body.classList.remove('locked');
});

/* panels */
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .15 });
document.querySelectorAll('.panel').forEach(p => io.observe(p));

/* countdown */
const target = new Date('2027-12-18T15:00:00+01:00').getTime(), pad = (n, l = 2) => String(n).padStart(l, '0');
function count() { let s = Math.max(0, Math.floor((target - Date.now()) / 1000)); const d = Math.floor(s / 86400); s %= 86400; const h = Math.floor(s / 3600); s %= 3600; const m = Math.floor(s / 60); s %= 60;
  $('#cd-d').textContent = pad(d, 3); $('#cd-h').textContent = pad(h); $('#cd-m').textContent = pad(m); $('#cd-s').textContent = pad(s); }
count(); setInterval(count, 1000);

/* RSVP */
$('#form').addEventListener('submit', e => {
  e.preventDefault();
  const name = $('#f-name').value.trim();
  if (!name) { $('#err').textContent = 'Please add your name so we know who is replying.'; $('#f-name').focus(); return; }
  $('#err').textContent = '';
  const yes = $('#f-yes').checked, first = name.split(' ')[0];
  $('#thanks-msg').textContent = yes ? `${first}, we’ll save you a blanket by the fire. See you in Lofoten!` : `We’ll miss you, ${first}. Thank you for letting us know.`;
  $('#rsvp').classList.add('done');
  // NOTE: connect a form backend here to collect replies.
  if (yes) shakeGlobe(1.3);
});
})();
