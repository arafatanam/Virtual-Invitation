/* Lanterns — a moonlit lake in WebGL.
   Mirror water with real reflections, layered mountains, a moon, stars, fireflies,
   rising paper lanterns, floating lanterns, tap-to-release, and a personal RSVP lantern. */
(() => {
'use strict';
const $ = s => document.querySelector(s);
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const small = Math.min(innerWidth, innerHeight) < 600;
const rand = (a = 0, b = 1) => a + Math.random() * (b - a);
const wait = ms => new Promise(r => setTimeout(r, reduce ? 0 : ms));

/* ================= music: slow arpeggios in D ================= */
const prog = [[50,[62,66,69,73]],[49,[61,64,69,73]],[47,[62,66,69,71]],[43,[62,67,71,74]]];
const mel = [81,0,0,78,0,0,76,0, 0,0,0,0,73,0,0,0, 74,0,0,76,0,0,78,0, 0,0,0,0,0,0,0,0];
const soft = [[1,1,1],[2,.2,.5],[3,.06,.3]];
const music = createMusic({ spb: .32, reverb: .6, play(step, t, tone) {
  const bar = Math.floor(step / 8) % 4, s = step % 8, [bass, ch] = prog[bar];
  if (s === 0) { tone(bass - 12, t, { type: 'triangle', dur: 2.6, vol: .09, attack: .4, sustain: true }); tone(bass, t, { type: 'sine', dur: 2.6, vol: .04, attack: .9, sustain: true }); }
  tone(ch[[0,1,2,3,2,1,2,3][s]], t, { dur: 1.6, vol: .035, partials: soft });
  const m = mel[step % 32]; if (m) tone(m, t, { dur: 2.8, vol: .065, partials: soft });
}});
const musicBtn = $('#music');
musicBtn.addEventListener('click', () => { const on = music.toggle(); musicBtn.classList.toggle('off', !on); musicBtn.setAttribute('aria-label', on ? 'Pause music' : 'Play music'); });

/* ================= renderer ================= */
let renderer;
try { renderer = new THREE.WebGLRenderer({ canvas: $('#lake'), antialias: true, powerPreference: 'high-performance' }); }
catch (e) { $('#loader p').textContent = 'This invitation needs a browser with WebGL.'; return; }
const DPR = Math.min(devicePixelRatio || 1, small ? 1.5 : 1.75);
renderer.setPixelRatio(DPR);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, .1, 1200);
const MOON = new THREE.Vector3(-0.38, 0.32, -1).normalize();

/* ---------- sky dome with moon ---------- */
const sky = new THREE.Mesh(new THREE.SphereGeometry(600, 48, 24), new THREE.ShaderMaterial({
  uniforms: { uMoon: { value: MOON }, uGlow: { value: 0 } },
  vertexShader: `varying vec3 vDir;void main(){vDir=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
  fragmentShader: `varying vec3 vDir;uniform vec3 uMoon;uniform float uGlow;
    float h(vec3 p){return fract(sin(dot(p,vec3(12.9898,78.233,37.719)))*43758.5453);}
    void main(){vec3 d=normalize(vDir);float y=d.y;
      vec3 zen=vec3(.008,.014,.05),mid=vec3(.04,.06,.17),hor=vec3(.1,.07,.17);
      vec3 c=mix(hor,mid,smoothstep(0.,.22,y));c=mix(c,zen,smoothstep(.22,.85,y));
      if(y<0.)c=mix(hor,vec3(.02,.03,.08),smoothstep(0.,-.15,y));
      c+=vec3(.5,.22,.06)*exp(-abs(y)*14.)*smoothstep(0.,1.,-d.z)*uGlow;
      float m=max(dot(d,uMoon),0.);
      float disc=smoothstep(.99955,.9997,m);
      float craters=.86+.14*h(floor(d*900.));
      c+=vec3(1.,.98,.92)*disc*1.7*craters;
      c+=vec3(.55,.6,.8)*pow(m,60.)*.35+vec3(.25,.3,.5)*pow(m,8.)*.18;
      gl_FragColor=vec4(c,1.);}`,
  side: THREE.BackSide, depthWrite: false
}));
scene.add(sky);

/* ---------- stars ---------- */
const starMat = new THREE.ShaderMaterial({
  uniforms: { uTime: { value: 0 }, uPR: { value: DPR } },
  vertexShader: `attribute float aS;attribute float aP;uniform float uTime,uPR;varying float vA;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mv;
    float tw=.55+.45*sin(uTime*(.6+aP*2.)+aP*70.);vA=tw*smoothstep(10.,80.,position.y);gl_PointSize=aS*uPR*(.7+tw*.5);}`,
  fragmentShader: `varying float vA;void main(){float d=length(gl_PointCoord-.5);float a=smoothstep(.5,0.,d);a*=a*vA;gl_FragColor=vec4(vec3(1.,.96,.9)*a,a);}`,
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
});
(() => {
  const N = small ? 2200 : 3500, p = new Float32Array(N * 3), s = new Float32Array(N), ph = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const th = rand(0, Math.PI * 2), y = Math.pow(Math.random(), .7) * .98 + .02, k = Math.sqrt(1 - y * y), r = 560;
    p.set([Math.cos(th) * k * r, y * r, Math.sin(th) * k * r], i * 3);
    s[i] = Math.random() < .04 ? rand(3, 4.5) : rand(1, 2.4); ph[i] = Math.random();
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(p, 3)); g.setAttribute('aS', new THREE.BufferAttribute(s, 1)); g.setAttribute('aP', new THREE.BufferAttribute(ph, 1));
  scene.add(new THREE.Points(g, starMat));
})();

/* ---------- mountains ---------- */
function ridge(z, color, base, amp, seed, freq) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1400, 110), new THREE.ShaderMaterial({
    uniforms: { uC: { value: new THREE.Color(color) }, uBase: { value: base }, uAmp: { value: amp }, uSeed: { value: seed }, uF: { value: freq } },
    vertexShader: `varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader: `varying vec2 vUv;uniform vec3 uC;uniform float uBase,uAmp,uSeed,uF;
      float h(float x){return fract(sin(x*127.1+uSeed)*43758.5453);}
      float n(float x){float i=floor(x),f=fract(x);f=f*f*(3.-2.*f);return mix(h(i),h(i+1.),f);}
      float fbm(float x){float v=0.,a=.55;for(int i=0;i<6;i++){v+=a*n(x);x*=2.1;a*=.5;}return v;}
      void main(){float x=vUv.x*uF;float r=uBase+fbm(x)*uAmp*(.6+.4*sin(vUv.x*3.1416));
        if(vUv.y>r)discard;
        vec3 c=uC*(.55+.45*vUv.y/r);
        c+=vec3(.35,.4,.6)*smoothstep(.012,0.,r-vUv.y)*.35;
        gl_FragColor=vec4(c,1.);}`
  }));
  m.position.set(0, 55 - 1.5, z);
  scene.add(m);
}
ridge(-330, 0x1b2352, .3, .5, 3.1, 7);
ridge(-250, 0x111938, .2, .42, 7.7, 9);
ridge(-180, 0x0a1129, .08, .3, 1.9, 12);

/* ---------- water (mirror reflections) ---------- */
function normalMap() {
  const S = 256, c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d'), img = x.createImageData(S, S);
  const waves = Array.from({ length: 14 }, () => ({ fx: Math.round(rand(-8, 8)), fy: Math.round(rand(1, 9)), a: rand(.2, 1), p: rand(0, 6.28) }));
  const H = (u, v) => waves.reduce((s, w) => s + w.a * Math.sin((u * w.fx + v * w.fy) * Math.PI * 2 / S + w.p), 0);
  for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) {
    const dx = H(i + 1, j) - H(i - 1, j), dy = H(i, j + 1) - H(i, j - 1);
    let nx = -dx * 2.2, ny = -dy * 2.2, nz = 1; const l = Math.hypot(nx, ny, nz); nx /= l; ny /= l; nz /= l;
    const k = (j * S + i) * 4; img.data[k] = (nx * .5 + .5) * 255; img.data[k + 1] = (ny * .5 + .5) * 255; img.data[k + 2] = (nz * .5 + .5) * 255; img.data[k + 3] = 255;
  }
  x.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}
let water = null;
if (THREE.Water) {
  water = new THREE.Water(new THREE.PlaneGeometry(2400, 2400), {
    textureWidth: small ? 512 : 1024, textureHeight: small ? 512 : 1024, waterNormals: normalMap(),
    sunDirection: MOON.clone(), sunColor: 0xcfd8ff, waterColor: 0x01040c, distortionScale: 2.2, fog: false
  });
  water.rotation.x = -Math.PI / 2;
  water.material.uniforms.size.value = 7;
  scene.add(water);
} else {
  const w = new THREE.Mesh(new THREE.PlaneGeometry(2400, 2400), new THREE.MeshBasicMaterial({ color: 0x030712 })); w.rotation.x = -Math.PI / 2; scene.add(w);
}

/* ---------- glow sprite ---------- */
const glowTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
  const g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(255,240,200,1)'); g.addColorStop(.18, 'rgba(255,190,110,.75)'); g.addColorStop(.5, 'rgba(255,130,50,.18)'); g.addColorStop(1, 'rgba(255,120,40,0)');
  x.fillStyle = g; x.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c); })();

/* ---------- lanterns ---------- */
const SKY_N = small ? 90 : 150, FLOAT_N = small ? 24 : 40, LN = SKY_N + FLOAT_N;
const lgeo = new THREE.CylinderGeometry(.36, .27, .82, 20, 1, false);
const aSeed = new Float32Array(LN).map(() => Math.random()), aOn = new Float32Array(LN);
lgeo.setAttribute('aSeed', new THREE.InstancedBufferAttribute(aSeed, 1));
const onAttr = new THREE.InstancedBufferAttribute(aOn, 1); onAttr.setUsage(THREE.DynamicDrawUsage);
lgeo.setAttribute('aOn', onAttr);
const lanternMat = new THREE.ShaderMaterial({
  uniforms: { uTime: { value: 0 } },
  vertexShader: `attribute float aSeed;attribute float aOn;uniform float uTime;varying vec2 vUv;varying float vF;varying float vOn;varying vec3 vN;varying vec3 vV;
    void main(){vUv=uv;vOn=aOn;mat4 mvm=modelViewMatrix*instanceMatrix;vec4 mv=mvm*vec4(position,1.);vN=normalize(mat3(mvm)*normal);vV=normalize(-mv.xyz);
      vF=.8+.2*sin(uTime*9.+aSeed*50.)*sin(uTime*5.3+aSeed*20.);gl_Position=projectionMatrix*mv;}`,
  fragmentShader: `varying vec2 vUv;varying float vF;varying float vOn;varying vec3 vN;varying vec3 vV;
    void main(){float face=abs(dot(normalize(vN),normalize(vV)));
      vec3 paper=vec3(.95,.32,.08),hot=vec3(1.,.72,.35);
      float glow=mix(1.5,.6,vUv.y);
      vec3 c=mix(paper,hot,face*.8)*glow*vF;
      float rib=smoothstep(.47,.5,abs(fract(vUv.x*10.)-.5));c*=1.-rib*.35;
      float band=smoothstep(.03,0.,abs(vUv.y-.94))+smoothstep(.04,0.,vUv.y);c=mix(c,vec3(.35,.12,.03),band*.6);
      vec3 off=vec3(.12,.07,.05);
      gl_FragColor=vec4(mix(off,c*1.9,vOn),1.);}`
});
const lanterns = new THREE.InstancedMesh(lgeo, lanternMat, LN);
lanterns.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
lanterns.frustumCulled = false;
scene.add(lanterns);

// flame glows (one per lantern)
const glowGeo = new THREE.BufferGeometry(), gPos = new Float32Array(LN * 3), gCol = new Float32Array(LN * 3);
glowGeo.setAttribute('position', new THREE.BufferAttribute(gPos, 3)); glowGeo.setAttribute('color', new THREE.BufferAttribute(gCol, 3));
const glows = new THREE.Points(glowGeo, new THREE.PointsMaterial({ size: 3.2, map: glowTex, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true }));
glows.frustumCulled = false; scene.add(glows);

const L = Array.from({ length: LN }, (_, i) => ({
  active: false, float: i >= SKY_N, p: new THREE.Vector3(), vy: 0, speed: rand(.55, 1.15), ph: rand(0, 6.28), on: 0, target: 0, rot: rand(0, 6.28), scale: i >= SKY_N ? .62 : rand(.85, 1.2), respawn: 0
}));
function spawn(i, x, z, quick) {
  const l = L[i]; l.active = true; l.p.set(x, l.float ? .18 : .5, z); l.vy = 0; l.on = quick ? .2 : 0; l.target = 1; l.ph = rand(0, 6.28);
}
function freeSky() { for (let i = 0; i < SKY_N; i++) if (!L[i].active && L[i].respawn <= 0) return i; return -1; }
let autoSpawn = false;

// fireflies near the shore
const FF = 90, ffGeo = new THREE.BufferGeometry(), ffBase = new Float32Array(FF * 3), ffPh = new Float32Array(FF);
for (let i = 0; i < FF; i++) { ffBase.set([rand(-14, 14), rand(.4, 3.5), rand(-6, 12)], i * 3); ffPh[i] = Math.random(); }
ffGeo.setAttribute('position', new THREE.BufferAttribute(ffBase, 3)); ffGeo.setAttribute('aP', new THREE.BufferAttribute(ffPh, 1));
const ffMat = new THREE.ShaderMaterial({
  uniforms: { uTime: { value: 0 }, uPR: { value: DPR }, uA: { value: 0 } },
  vertexShader: `attribute float aP;uniform float uTime,uPR;varying float vA;void main(){vec3 p=position+vec3(sin(uTime*.4+aP*30.)*1.2,sin(uTime*.6+aP*20.)*.5,cos(uTime*.3+aP*40.)*1.2);
    vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;vA=pow(max(0.,sin(uTime*(.8+aP)+aP*60.)),6.);gl_PointSize=uPR*90./-mv.z;}`,
  fragmentShader: `uniform float uA;varying float vA;void main(){float d=length(gl_PointCoord-.5);float a=smoothstep(.5,0.,d);a=a*a*vA*uA;gl_FragColor=vec4(vec3(.85,1.,.45)*a,a);}`,
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
});
scene.add(new THREE.Points(ffGeo, ffMat));

/* ---------- personal RSVP lantern ---------- */
let personal = null;
function personalLantern(name) {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 512; const x = c.getContext('2d');
  const g = x.createLinearGradient(0, 512, 0, 0); g.addColorStop(0, '#fff1c8'); g.addColorStop(.5, '#ffb15a'); g.addColorStop(1, '#e0611c');
  x.fillStyle = g; x.fillRect(0, 0, 1024, 512);
  x.strokeStyle = 'rgba(120,40,0,.25)'; for (let i = 0; i < 1024; i += 64) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, 512); x.stroke(); }
  x.fillStyle = '#7a2a08'; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.font = '96px "Great Vibes", cursive'; x.fillText(name, 512, 230);
  x.font = '30px "Italiana", serif'; x.fillText('for Leila & Kai', 512, 330);
  const tex = new THREE.CanvasTexture(c);
  const m = new THREE.Mesh(new THREE.CylinderGeometry(.55, .42, 1.3, 32, 1, false, Math.PI, Math.PI * 2), new THREE.MeshBasicMaterial({ map: tex, color: new THREE.Color(1.5, 1.15, .85) }));
  const gl = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true })); gl.scale.set(5, 5, 1); gl.position.y = -.4; m.add(gl);
  const dir = new THREE.Vector3(); camera.getWorldDirection(dir);
  m.position.copy(camera.position).addScaledVector(dir, 7); m.position.y = Math.max(m.position.y - 2.5, .8);
  scene.add(m); personal = { mesh: m, t: 0 };
}

/* ---------- post ---------- */
let composer = null;
if (THREE.EffectComposer && THREE.UnrealBloomPass) {
  composer = new THREE.EffectComposer(renderer);
  composer.addPass(new THREE.RenderPass(scene, camera));
  composer.addPass(new THREE.UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 1.05, .6, .5));
}
function resize() {
  renderer.setSize(innerWidth, innerHeight, false); camera.aspect = innerWidth / innerHeight;
  camera.fov = camera.aspect < .8 ? 68 : 55; camera.updateProjectionMatrix();
  if (composer) { composer.setPixelRatio(DPR); composer.setSize(innerWidth, innerHeight); }
}
addEventListener('resize', resize); resize();

/* ================= camera & loop ================= */
const C = { look: new THREE.Vector3(0, 4, -30), lookY: 4, follow: null, tx: 0, ty: 0, px: 0, py: 0, glow: 0 };
addEventListener('pointermove', e => { C.tx = e.clientX / innerWidth - .5; C.ty = e.clientY / innerHeight - .5; }, { passive: true });
const dummy = new THREE.Object3D();
let last = performance.now(), spawnTimer = 0;
function frame(now) {
  const t = now / 1000, dt = Math.min(.05, (now - last) / 1000); last = now;
  lanternMat.uniforms.uTime.value = t; starMat.uniforms.uTime.value = t; ffMat.uniforms.uTime.value = t;
  if (water) water.material.uniforms.time.value += dt * .45;

  // keep the sky populated
  if (autoSpawn) {
    spawnTimer -= dt;
    if (spawnTimer <= 0) { spawnTimer = rand(.08, .35); const i = freeSky(); if (i >= 0) spawn(i, rand(-55, 55), rand(-130, -6)); }
  }

  let lit = 0;
  for (let i = 0; i < LN; i++) {
    const l = L[i];
    if (!l.active) { if (l.respawn > 0) l.respawn -= dt; dummy.scale.setScalar(0); dummy.updateMatrix(); lanterns.setMatrixAt(i, dummy.matrix); aOn[i] = 0; gCol.set([0, 0, 0], i * 3); continue; }
    l.on += (l.target - l.on) * Math.min(1, dt * 1.4);
    if (l.float) {
      l.p.y = .15 + Math.sin(t * 1.3 + l.ph) * .05; l.p.x += Math.sin(t * .2 + l.ph) * dt * .15;
    } else if (l.on > .6) {
      l.vy += (l.speed - l.vy) * dt * .35;
      l.p.y += l.vy * dt; l.p.x += (Math.sin(t * .25 + l.ph) * .35 + .25) * dt; l.p.z -= .12 * dt;
      if (l.p.y > 70) l.target = 0;
      if (l.p.y > 70 && l.on < .05) { l.active = false; l.respawn = rand(.5, 3); }
    }
    lit += l.on;
    dummy.position.copy(l.p); dummy.rotation.set(Math.sin(t + l.ph) * .06, l.rot + t * .05, Math.cos(t * .8 + l.ph) * .06); dummy.scale.setScalar(l.scale);
    dummy.updateMatrix(); lanterns.setMatrixAt(i, dummy.matrix);
    aOn[i] = l.on;
    gPos.set([l.p.x, l.p.y - .25 * l.scale, l.p.z], i * 3);
    const k = l.on * (.85 + .15 * Math.sin(t * 8 + l.ph * 9));
    gCol.set([k, k * .85, k * .7], i * 3);
  }
  lanterns.instanceMatrix.needsUpdate = true; onAttr.needsUpdate = true;
  glowGeo.attributes.position.needsUpdate = true; glowGeo.attributes.color.needsUpdate = true;
  C.glow += (Math.min(1, lit / 40) - C.glow) * dt; sky.material.uniforms.uGlow.value = C.glow;

  if (personal) {
    personal.t += dt; const m = personal.mesh;
    m.position.y += dt * Math.min(1, personal.t * .4) * .9; m.position.z -= dt * .5; m.rotation.y = Math.sin(personal.t * .5) * .3;
    if (m.position.y > 80) { scene.remove(m); personal = null; }
  }

  // camera
  const sp = scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight);
  C.px += (C.tx - C.px) * .03; C.py += (C.ty - C.py) * .03;
  let targetLook = 4 + sp * 22;
  if (C.follow) targetLook = Math.max(targetLook, C.follow.p.y + 1);
  C.lookY += (targetLook - C.lookY) * Math.min(1, dt * 1.5);
  camera.position.set(C.px * 2, 2.4 + sp * 3 - C.py * .6, 16);
  camera.lookAt(C.px * 4, C.lookY, -30);

  composer ? composer.render() : renderer.render(scene, camera);
  requestAnimationFrame(frame);
}

/* ================= boot & opening ================= */
(async () => {
  try { await Promise.race([Promise.all([document.fonts.load('60px "Great Vibes"'), document.fonts.load('30px "Italiana"')]), wait(2500)]); } catch (e) {}
  // a few floating lanterns already glow dimly on the water
  for (let i = SKY_N; i < LN; i++) { spawn(i, rand(-30, 30), rand(-60, 4)); L[i].target = .25; L[i].on = .25; }
  requestAnimationFrame(frame);
  $('#loader').classList.add('done');
})();

$('#light').addEventListener('click', async () => {
  music.start(); musicBtn.hidden = false;
  $('#gate').classList.add('gone');
  // the first lantern, right in front of you
  spawn(0, 0, 6); L[0].speed = .7; C.follow = L[0];
  ffMat.uniforms.uA.value = 1;
  for (let i = SKY_N; i < LN; i++) L[i].target = 1;
  await wait(2600);
  document.body.classList.add('lit');
  // then the whole lake joins in
  for (let k = 1; k < SKY_N * .7; k++) {
    setTimeout(() => { if (!L[k].active) spawn(k, rand(-50, 50), rand(-120, -8)); }, reduce ? 0 : 300 + k * 70 + Math.random() * 400);
  }
  await wait(4000);
  C.follow = null; autoSpawn = true;
  document.body.classList.remove('locked');
});

/* tap the lake to release a lantern */
const ray = new THREE.Raycaster(), plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), hit = new THREE.Vector3();
document.addEventListener('click', e => {
  if (!document.body.classList.contains('lit') || e.target.closest('.panel, button, a, input, select, textarea, label, form')) return;
  ray.setFromCamera(new THREE.Vector2(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1), camera);
  let x = rand(-6, 6), z = rand(-20, -4);
  if (ray.ray.intersectPlane(plane, hit) && hit.z < 12 && hit.z > -160) { x = hit.x; z = hit.z; }
  let i = freeSky();
  if (i < 0) { i = Math.floor(rand(1, SKY_N)); }
  spawn(i, x, z, true); L[i].speed = rand(.9, 1.3);
});

/* panels tilt up into place */
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .18 });
document.querySelectorAll('.panel').forEach(p => io.observe(p));

/* countdown */
const target = new Date('2027-08-21T19:00:00+02:00').getTime(), pad = (n, l = 2) => String(n).padStart(l, '0');
function count() { let s = Math.max(0, Math.floor((target - Date.now()) / 1000)); const d = Math.floor(s / 86400); s %= 86400; const h = Math.floor(s / 3600); s %= 3600; const m = Math.floor(s / 60); s %= 60;
  $('#cd-d').textContent = pad(d, 3); $('#cd-h').textContent = pad(h); $('#cd-m').textContent = pad(m); $('#cd-s').textContent = pad(s); }
count(); setInterval(count, 1000);

/* RSVP */
$('#form').addEventListener('submit', e => {
  e.preventDefault();
  const name = $('#f-name').value.trim();
  if (!name) { $('#err').textContent = 'Please add your name so your lantern knows who sent it.'; $('#f-name').focus(); return; }
  $('#err').textContent = '';
  const yes = $('#f-yes').checked, first = name.split(' ')[0];
  $('#thanks-msg').textContent = yes
    ? `${first}, your lantern is rising. Look up! We can’t wait to see you by the lake.`
    : `We’ll miss you, ${first}. Your lantern will still be with us on the night.`;
  $('#rsvp').classList.add('done');
  // NOTE: connect a form backend here to collect replies.
  personalLantern(first);
});
})();
