/* Stardust — a particle invitation.
   One cloud of glowing points morphs between shapes as you scroll:
   0 galaxy → 1 names → 2 rings → 3 date → 4 heart → 5 map pin → 6 "Join us"           */
(() => {
'use strict';
const $ = s => document.querySelector(s);
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const small = Math.min(innerWidth, innerHeight) < 600;
const COUNT = small ? 11000 : 17000;
const SHAPES = 7;

/* ================= music ================= */
const bars = [[53,57,60,64,69,72],[52,55,59,62,67,71],[50,53,57,60,65,69],[48,55,59,62,64,67]];
const mel = [76,0,74,0,72,0,0,0, 74,0,72,0,71,0,67,0, 72,0,69,0,65,0,69,0, 67,0,0,64,62,0,64,0];
const bell = [[1,1,1],[2.01,.28,.5],[3.98,.08,.3]];
const music = createMusic({ spb: .27, reverb: .55, play(step, t, tone) {
  const bar = Math.floor(step / 8) % 4, s = step % 8, ch = bars[bar];
  if (s === 0) tone(ch[0] - 12, t, { type: 'triangle', dur: 2.3, vol: .07, attack: .7, sustain: true });
  tone(ch[[1,2,3,4,5,4,3,2][s]] + 12, t, { dur: 1.5, vol: .04, partials: bell });
  const m = mel[step % 32]; if (m) tone(m + 12, t, { dur: 2.4, vol: .075, partials: bell });
}});
const musicBtn = $('#music');
musicBtn.addEventListener('click', () => {
  const on = music.toggle();
  musicBtn.classList.toggle('off', !on); musicBtn.setAttribute('aria-label', on ? 'Pause music' : 'Play music');
});

/* ================= helpers ================= */
const ease = {
  inOut: t => t < .5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3) / 2,
  out: t => 1 - Math.pow(1 - t, 3)
};
function tween(ms, fn, e = ease.inOut) {
  return new Promise(res => {
    if (reduce) { fn(1); return res(); }
    const t0 = performance.now();
    (function loop(now) { const k = Math.min(1, (now - t0) / ms); fn(e(k)); k < 1 ? requestAnimationFrame(loop) : res(); })(t0);
  });
}
const rand = (a = 0, b = 1) => a + Math.random() * (b - a);
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

/* ================= renderer ================= */
const canvas = $('#scene');
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
} catch (e) {
  $('#loader p').textContent = 'This invitation needs a browser with WebGL.';
  return;
}
const DPR = Math.min(devicePixelRatio || 1, small ? 1.6 : 1.75);
renderer.setPixelRatio(DPR);
renderer.setClearColor(0x030308, 1);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, .1, 500);
const CAM_Z = 9;
camera.position.set(0, 0, 22);

/* ---------- nebula backdrop ---------- */
const nebula = new THREE.Mesh(new THREE.PlaneGeometry(420, 260), new THREE.ShaderMaterial({
  uniforms: { uTime: { value: 0 } },
  vertexShader: `varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
  fragmentShader: `varying vec2 vUv;uniform float uTime;
    float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    float n(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),u.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),u.x),u.y);}
    float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*n(p);p*=2.03;a*=.5;}return v;}
    void main(){vec2 p=vUv*vec2(5.,3.);float q=fbm(p*1.3-uTime*.006);float f=fbm(p+q*1.6+vec2(uTime*.004,0.));
      float band=exp(-pow((vUv.y-.52+(vUv.x-.5)*.55)*3.,2.));
      vec3 c=mix(vec3(.03,.02,.09),vec3(.32,.11,.42),f)*f*band;
      c+=vec3(.75,.48,.22)*pow(f,5.)*band*1.2;
      c+=vec3(.08,.12,.3)*pow(q,3.)*.35;
      gl_FragColor=vec4(c*.32,1.);}`,
  depthWrite: false
}));
nebula.position.z = -120;
scene.add(nebula);

/* ---------- background stars ---------- */
const starMat = new THREE.ShaderMaterial({
  uniforms: { uTime: { value: 0 }, uPR: { value: DPR } },
  vertexShader: `attribute float aSize;attribute float aPh;uniform float uTime;uniform float uPR;varying float vA;varying vec3 vC;
    void main(){vec4 mv=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mv;
    float tw=.5+.5*sin(uTime*(.7+aPh*1.8)+aPh*60.);vA=tw;vC=mix(vec3(1.,.86,.62),vec3(.8,.86,1.),step(.7,aPh));
    gl_PointSize=aSize*uPR*(.6+tw*.6)*(70./-mv.z);}`,
  fragmentShader: `varying float vA;varying vec3 vC;void main(){float d=length(gl_PointCoord-.5);float a=smoothstep(.5,0.,d);a*=a;gl_FragColor=vec4(vC*a*vA,a*vA);}`,
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
});
(() => {
  const N = small ? 3500 : 6000, p = new Float32Array(N * 3), s = new Float32Array(N), ph = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const r = rand(50, 160), th = rand(0, 6.283), u = rand(-1, 1), k = Math.sqrt(1 - u * u);
    p.set([r * k * Math.cos(th), r * u, r * k * Math.sin(th) - 40], i * 3);
    s[i] = Math.random() < .03 ? rand(6, 10) : rand(1.4, 3.6); ph[i] = Math.random();
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(p, 3));
  g.setAttribute('aSize', new THREE.BufferAttribute(s, 1));
  g.setAttribute('aPh', new THREE.BufferAttribute(ph, 1));
  scene.add(new THREE.Points(g, starMat));
})();

/* ---------- shooting star ---------- */
const shoot = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.ShaderMaterial({
  uniforms: { uA: { value: 0 } },
  vertexShader: `varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
  fragmentShader: `varying vec2 vUv;uniform float uA;void main(){float a=pow(vUv.x,3.)*smoothstep(.5,0.,abs(vUv.y-.5));gl_FragColor=vec4(vec3(1.,.93,.8)*a*uA,a*uA);}`,
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
}));
shoot.scale.set(9, .12, 1); scene.add(shoot);
let shootT = -1, shootDir = new THREE.Vector3(), nextShoot = 3;

/* ================= the particle cloud ================= */
const geo = new THREE.BufferGeometry();
const attrs = [];
for (let s = 0; s < SHAPES; s++) {
  const a = new THREE.BufferAttribute(new Float32Array(COUNT * 3), 3);
  attrs.push(a);
  geo.setAttribute(s === 0 ? 'position' : 'aP' + s, a);
}
const rnd = new Float32Array(COUNT * 4);
for (let i = 0; i < COUNT * 4; i++) rnd[i] = Math.random();
geo.setAttribute('aRnd', new THREE.BufferAttribute(rnd, 4));
geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 40);

const U = {
  uShape: { value: 0 }, uTime: { value: 0 }, uPR: { value: DPR }, uSize: { value: small ? 3.4 : 3.1 },
  uPointer: { value: new THREE.Vector3(99, 99, 0) }, uPush: { value: 0 }, uSpin: { value: 0 }, uBurst: { value: 0 }, uFade: { value: 1 }
};
const cloudMat = new THREE.ShaderMaterial({
  uniforms: U,
  vertexShader: `
    uniform float uShape,uTime,uPR,uSize,uPush,uSpin,uBurst; uniform vec3 uPointer;
    attribute vec3 aP1,aP2,aP3,aP4,aP5,aP6; attribute vec4 aRnd;
    varying vec3 vC; varying float vA;
    vec3 rotY(vec3 p,float a){float c=cos(a),s=sin(a);return vec3(p.x*c+p.z*s,p.y,-p.x*s+p.z*c);}
    vec3 shape(float i){
      if(i<.5) return rotY(position,uTime*.06);
      if(i<1.5) return aP1;
      if(i<2.5){ vec3 c=vec3(0.,aP2.y,0.); return rotY(aP2-vec3(0.,0.,0.),uSpin); }
      if(i<3.5) return aP3;
      if(i<4.5) return rotY(aP4,sin(uTime*.7)*.35);
      if(i<5.5) return rotY(aP5,uTime*.4);
      return aP6;
    }
    void main(){
      float fi=floor(uShape), fr=uShape-fi;
      float d=aRnd.x*.4;
      float t=smoothstep(d,d+.6,fr);
      vec3 a=shape(fi), b=shape(min(fi+1.,6.));
      vec3 p=mix(a,b,t);
      float m=sin(t*3.14159);
      float ang=m*(1.2+aRnd.w*2.2)*(aRnd.y>.5?1.:-1.);
      p=rotY(p,ang);
      p+=m*vec3(sin(aRnd.w*40.+uTime),cos(aRnd.y*30.+uTime*1.3),sin(aRnd.z*20.+uTime*.7))*(.5+aRnd.x);
      p+=.025*vec3(sin(uTime*1.3+aRnd.w*50.),cos(uTime*1.1+aRnd.x*60.),sin(uTime*.9+aRnd.y*70.));
      vec4 wp=modelMatrix*vec4(p,1.);
      vec2 dv=wp.xy-uPointer.xy; float dist=length(dv);
      float f=uPush*exp(-dist*dist*2.2);
      wp.xy+=normalize(dv+1e-4)*f*1.1; wp.z+=f*1.5*(aRnd.z-.3);
      wp.xyz+=normalize(wp.xyz-vec3(0.,1.5,0.)+1e-4)*uBurst*(2.+aRnd.y*6.);
      vec4 mv=viewMatrix*wp; gl_Position=projectionMatrix*mv;
      float tw=.65+.35*sin(uTime*2.2+aRnd.w*90.);
      vA=tw;
      vC=mix(vec3(1.,.74,.38),vec3(1.,.96,.88),aRnd.z);
      if(aRnd.z<.1) vC=vec3(.78,.68,1.);
      vC+=m*vec3(.35,.15,.05)+f*vec3(.4,.3,.1);
      gl_PointSize=uSize*(.55+aRnd.y*1.1)*uPR*(10./-mv.z)*(1.+m*.6);
    }`,
  fragmentShader: `varying vec3 vC;varying float vA;
    void main(){float d=length(gl_PointCoord-.5);float a=smoothstep(.5,.05,d);a*=a;gl_FragColor=vec4(vC*a*vA,a*vA);}`,
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
});
const cloud = new THREE.Points(geo, cloudMat);
cloud.frustumCulled = false;
scene.add(cloud);

/* ---------- shape builders ---------- */
function layoutBox() {
  const visH = 2 * CAM_Z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  const visW = visH * camera.aspect;
  return { w: Math.min(visW * .86, 9.5), h: visH * .4, cy: visH * (.5 - .28), portrait: camera.aspect < .9 };
}

function rasterize(draw, W, H) {
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const x = c.getContext('2d'); x.fillStyle = '#fff'; x.strokeStyle = '#fff';
  draw(x, W, H);
  const d = x.getImageData(0, 0, W, H).data, pts = [];
  for (let y = 0; y < H; y += 2) for (let i = 0; i < W; i += 2) if (d[(y * W + i) * 4 + 3] > 120) pts.push(i, y);
  return pts;
}

function fit2D(pts, box, depthFn, out) {
  const n = pts.length / 2;
  let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
  for (let i = 0; i < n; i++) { const x = pts[i*2], y = pts[i*2+1]; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  const k = Math.min(box.w / (x1 - x0 + 1), box.h / (y1 - y0 + 1)), cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  for (let i = 0; i < COUNT; i++) {
    const j = (Math.random() * n | 0) * 2;
    const x = (pts[j] + rand(0, 2) - cx) * k, y = -(pts[j+1] + rand(0, 2) - cy) * k;
    out[i*3] = x; out[i*3+1] = y + box.cy; out[i*3+2] = depthFn(x / (box.w / 2), y / (box.h / 2));
  }
}

function textPts(lines, font, aspect) {
  const W = 1100, H = Math.round(W / aspect);
  return rasterize((x) => {
    x.textAlign = 'center'; x.textBaseline = 'middle';
    let size = H / lines.length * .95; x.font = font(size);
    const widest = Math.max(...lines.map(l => x.measureText(l).width));
    if (widest > W * .94) { size *= W * .94 / widest; x.font = font(size); }
    const lh = size * (lines.length > 1 ? .92 : 1);
    lines.forEach((l, i) => x.fillText(l, W / 2, H / 2 + (i - (lines.length - 1) / 2) * lh));
  }, W, H);
}

function buildShapes() {
  const box = layoutBox();
  const aspect = box.w / box.h;
  const flat = () => rand(-.12, .12);

  // 0: spiral galaxy
  const g = attrs[0].array;
  for (let i = 0; i < COUNT; i++) {
    const arm = i % 3, r = .4 + Math.pow(Math.random(), 1.5) * 9;
    const th = arm * 2.094 + r * .55 + rand(-.45, .45) * (1 + r * .05);
    const gx = Math.cos(th) * r, gz = Math.sin(th) * r, gy = rand(-.3, .3) * (1.4 - r / 9), tl = 1.05;
    g[i*3] = gx; g[i*3+1] = gy * Math.cos(tl) - gz * Math.sin(tl) + box.cy * .4; g[i*3+2] = gy * Math.sin(tl) + gz * Math.cos(tl);
  }

  // 1: names
  const script = s => `${s}px "Pinyon Script", "Snell Roundhand", cursive`;
  const caps = s => `500 ${s}px "Cinzel", Georgia, serif`;
  const nameLines = box.portrait ? ['Elena', '&', 'Marcus'] : ['Elena & Marcus'];
  fit2D(textPts(nameLines, script, aspect), box, flat, attrs[1].array);

  // 2: interlocked rings (true 3D)
  const r2 = attrs[2].array, s = Math.min(box.w / 3.2, box.h / 2.7), tilt = .38;
  for (let i = 0; i < COUNT; i++) {
    const pick = Math.random(), u = rand(0, 6.283), v = rand(0, 6.283);
    let x, y, z;
    if (pick < .5) { const R = 1, tr = .12; x = -.5 + (R + tr * Math.cos(v)) * Math.cos(u); y = (R + tr * Math.cos(v)) * Math.sin(u); z = tr * Math.sin(v); }
    else if (pick < .94) { const R = .86, tr = .1; x = .5 + (R + tr * Math.cos(v)) * Math.cos(u); z = (R + tr * Math.cos(v)) * Math.sin(u); y = tr * Math.sin(v); }
    else { const a = rand(0, 6.283), h = rand(-1, 1), rr = (1 - Math.abs(h)) * .2; x = -.5 + Math.cos(a) * rr; z = Math.sin(a) * rr; y = 1.3 + h * .18; }
    const yy = y * Math.cos(tilt) - z * Math.sin(tilt), zz = y * Math.sin(tilt) + z * Math.cos(tilt);
    r2[i*3] = x * s; r2[i*3+1] = yy * s + box.cy; r2[i*3+2] = zz * s;
  }

  // 3: the date
  const dateLines = box.portrait ? ['12 · 06', '2027'] : ['12 · 06 · 2027'];
  fit2D(textPts(dateLines, caps, aspect), box, flat, attrs[3].array);

  // 4: a puffy 3D heart
  const heartPts = rasterize((x, W, H) => {
    x.beginPath();
    for (let i = 0; i <= 200; i++) {
      const t = i / 200 * Math.PI * 2;
      const hx = 16 * Math.pow(Math.sin(t), 3), hy = 13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t);
      x.lineTo(W / 2 + hx * W / 36, H / 2 - hy * H / 36);
    }
    x.fill();
  }, 600, 600);
  fit2D(heartPts, { ...box, w: Math.min(box.w, box.h * 1.1) }, (nx, ny) => {
    const r = Math.min(1, Math.hypot(nx * .9, ny * .85));
    return (Math.random() < .5 ? -1 : 1) * Math.sqrt(Math.max(0, 1 - r * r)) * box.h * .22 * Math.random() ** .3;
  }, attrs[4].array);

  // 5: map pin with ripples on the ground
  const pinPts = rasterize((x, W, H) => {
    x.beginPath(); x.arc(W / 2, H * .36, W * .26, Math.PI * .82, Math.PI * .18);
    x.lineTo(W / 2, H * .94); x.closePath();
    x.arc(W / 2, H * .36, W * .1, 0, Math.PI * 2, true);
    x.fill('evenodd');
  }, 500, 640);
  const p5 = attrs[5].array;
  const pinBox = { ...box, w: box.h * .62, h: box.h * .82, cy: box.cy + box.h * .09 };
  fit2D(pinPts, pinBox, () => rand(-.18, .18), p5);
  const groundY = box.cy - box.h * .38;
  for (let i = 0; i < COUNT; i++) {
    if (Math.random() < .3) {
      const ring = Math.floor(rand(0, 3)), R = (.5 + ring * .55) * box.h * .45, a = rand(0, 6.283);
      p5[i*3] = Math.cos(a) * R; p5[i*3+2] = Math.sin(a) * R * .9; p5[i*3+1] = groundY + rand(-.02, .02);
    }
  }

  // 6: closing words
  fit2D(textPts(['Join us'], script, aspect), box, flat, attrs[6].array);

  attrs.forEach(a => a.needsUpdate = true);
}

/* ================= post-processing ================= */
let composer = null;
if (THREE.EffectComposer && THREE.UnrealBloomPass) {
  composer = new THREE.EffectComposer(renderer);
  composer.addPass(new THREE.RenderPass(scene, camera));
  composer.addPass(new THREE.UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), .95, .5, .12));
}

let lastAspect = 0;
function resize() {
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h; camera.updateProjectionMatrix();
  if (composer) { composer.setPixelRatio(DPR); composer.setSize(w, h); }
  if (lastAspect && Math.abs(camera.aspect - lastAspect) / lastAspect > .15) buildShapes();
  lastAspect = camera.aspect;
  measure();
}

/* ================= scroll → shape ================= */
const sections = [...document.querySelectorAll('.ch')];
let anchors = [];
function measure() { anchors = sections.map(s => s.offsetTop); }
function scrollShape() {
  const y = scrollY;
  if (y <= anchors[0]) return 1;
  for (let i = 0; i < anchors.length - 1; i++) {
    if (y < anchors[i + 1]) {
      const f = (y - anchors[i]) / (anchors[i + 1] - anchors[i]);
      return i + 1 + smooth(.3, .92, f);
    }
  }
  return SHAPES - 1;
}

/* chapter dots */
const dots = $('#dots');
sections.forEach((s, i) => {
  const b = document.createElement('button');
  b.innerHTML = `<span>${s.dataset.label}</span>`;
  b.setAttribute('aria-label', 'Go to ' + s.dataset.label);
  b.addEventListener('click', () => scrollTo({ top: anchors[i] + 2, behavior: reduce ? 'auto' : 'smooth' }));
  dots.appendChild(b);
});
const dotBtns = [...dots.children];

/* panel text reveal */
document.querySelectorAll('.panel').forEach(p => [...p.children].forEach((c, i) => c.style.setProperty('--d', (i * 110) + 'ms')));
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) e.target.classList.add('on'); }), { threshold: .2 });
document.querySelectorAll('.panel').forEach(p => io.observe(p));

/* ================= pointer ================= */
const S = { started: false, shape: 0, tx: 0, ty: 0, px: 0, py: 0, push: 0, lastMove: 0, camZ: 22 };
const ray = new THREE.Raycaster(), plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), hit = new THREE.Vector3(), ndc = new THREE.Vector2();
function onPointer(e) {
  S.tx = e.clientX / innerWidth - .5; S.ty = e.clientY / innerHeight - .5;
  ndc.set(S.tx * 2, -S.ty * 2);
  ray.setFromCamera(ndc, camera);
  if (ray.ray.intersectPlane(plane, hit)) U.uPointer.value.copy(hit);
  S.lastMove = performance.now();
}
addEventListener('pointermove', onPointer, { passive: true });
addEventListener('pointerdown', onPointer, { passive: true });

/* ================= main loop ================= */
let last = performance.now();
function frame(now) {
  const t = now / 1000, dt = Math.min(.05, (now - last) / 1000); last = now;
  U.uTime.value = t; starMat.uniforms.uTime.value = t; nebula.material.uniforms.uTime.value = t;

  if (S.started) {
    const target = scrollShape();
    S.shape += (target - S.shape) * Math.min(1, dt * 3.2);
    U.uShape.value = S.shape;
  }
  U.uSpin.value = t * .45;

  const active = now - S.lastMove < 350 && S.started;
  S.push += ((active ? 1 : 0) - S.push) * Math.min(1, dt * (active ? 6 : 1.6));
  U.uPush.value = S.push;

  S.px += (S.tx - S.px) * .04; S.py += (S.ty - S.py) * .04;
  cloud.rotation.y = Math.sin(t * .23) * .14 + S.px * .35;
  cloud.rotation.x = S.py * .12;
  const scrollK = scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight);
  camera.position.set(S.px * .8, -S.py * .5, S.camZ);
  camera.lookAt(0, 0, 0);
  nebula.rotation.z = scrollK * .4;
  nebula.position.y = -scrollK * 20;

  // shooting stars
  nextShoot -= dt;
  if (nextShoot < 0 && shootT < 0) {
    shootT = 0; nextShoot = rand(4, 10);
    shoot.position.set(rand(-40, 40), rand(10, 30), -60);
    shootDir.set(rand(-1, -.4), rand(-.6, -.2), 0).normalize();
    shoot.rotation.z = Math.atan2(shootDir.y, shootDir.x) + Math.PI;
  }
  if (shootT >= 0) {
    shootT += dt; shoot.position.addScaledVector(shootDir, dt * 60);
    shoot.material.uniforms.uA.value = Math.sin(Math.min(1, shootT / .9) * Math.PI);
    if (shootT > .9) { shootT = -1; shoot.material.uniforms.uA.value = 0; }
  }

  composer ? composer.render() : renderer.render(scene, camera);
  requestAnimationFrame(frame);
}

/* ================= boot ================= */
async function boot() {
  try {
    await Promise.race([
      Promise.all([document.fonts.load('100px "Pinyon Script"'), document.fonts.load('500 100px "Cinzel"')]),
      new Promise(r => setTimeout(r, 2500))
    ]);
  } catch (e) { /* fall back to system fonts */ }
  resize();
  buildShapes();
  addEventListener('resize', resize);
  requestAnimationFrame(frame);
  $('#loader').classList.add('done');
}
boot();

$('#begin').addEventListener('click', async () => {
  music.start(); musicBtn.hidden = false;
  $('#gate').classList.add('gone');
  measure();
  tween(4200, k => { S.camZ = 22 + (CAM_Z - 22) * k; });
  await tween(3800, k => { U.uShape.value = S.shape = k; });
  S.started = true;
  document.body.classList.remove('locked');
  document.body.classList.add('ready');
  measure();
});

/* active chapter dot */
addEventListener('scroll', () => {
  const idx = Math.round(Math.min(SHAPES - 1, Math.max(1, scrollShape())) - 1);
  dotBtns.forEach((b, i) => b.classList.toggle('on', i === idx));
}, { passive: true });

/* ================= countdown ================= */
const target = new Date('2027-06-12T17:00:00+02:00').getTime();
const pad = (n, l = 2) => String(n).padStart(l, '0');
function count() {
  let s = Math.max(0, Math.floor((target - Date.now()) / 1000));
  const d = Math.floor(s / 86400); s %= 86400; const h = Math.floor(s / 3600); s %= 3600; const m = Math.floor(s / 60); s %= 60;
  $('#cd-d').textContent = pad(d, 3); $('#cd-h').textContent = pad(h); $('#cd-m').textContent = pad(m); $('#cd-s').textContent = pad(s);
}
count(); setInterval(count, 1000);

/* ================= RSVP ================= */
$('#form').addEventListener('submit', async e => {
  e.preventDefault();
  const name = $('#f-name').value.trim();
  if (!name) { $('#err').textContent = 'Please add your name so we know who is replying.'; $('#f-name').focus(); return; }
  $('#err').textContent = '';
  const yes = $('#f-yes').checked, first = name.split(' ')[0];
  $('#thanks-msg').textContent = yes
    ? `${first}, your reply is written in the stars. We can’t wait to celebrate with you.`
    : `We’ll miss you, ${first}. Thank you for letting us know.`;
  $('#rsvp').classList.add('done');
  // NOTE: hook up a real backend here (Google Form, Formspree, Supabase…) to collect replies.
  if (yes) { await tween(700, k => U.uBurst.value = k, ease.out); await tween(1800, k => U.uBurst.value = 1 - k); }
});
})();
