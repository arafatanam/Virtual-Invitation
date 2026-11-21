/* Woven in Jamdani — a shuttle flies across a handloom and the invitation appears thread by thread (zari borders,
   muslin butis, the couple's names). When the last row is beaten in, the cloth lifts off the loom and floats as a 3D sari. */
(() => {
'use strict';
const $ = s => document.querySelector(s);
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const small = Math.min(innerWidth, innerHeight) < 600;
const rand = (a = 0, b = 1) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const SETTLE = location.hash === '#settle';

/* ================= music: sitar in raag Bhairavi with tabla ================= */
const mel = { 0: 69, 2: 70, 3: 69, 4: 67, 6: 65, 8: 67, 10: 69, 12: 65, 14: 63, 16: 62, 20: 63, 22: 65, 24: 67, 26: 69, 28: 70, 30: 72,
  32: 74, 34: 72, 35: 70, 36: 69, 38: 70, 40: 69, 42: 67, 44: 65, 46: 63, 48: 62, 52: 65, 54: 63, 56: 62 };
const music = createMusic({ spb: .2, reverb: .45, volume: .8, fadeIn: 2, play(step, t, tone, noise, pluck) {
  if (step % 2 === 0) pluck([57, 62, 62, 50][(step >> 1) % 4], t, { vol: .08, buzz: .6, bright: .4, dur: 2.2 });
  const k = step % 8;
  if (k === 0 || k === 5) tone(45, t, { dur: .45, vol: .17, slide: 4 });
  if (k === 2 || k === 3 || k === 6) tone(76, t, { dur: .12, vol: .035, partials: [[1, 1], [2.02, .4], [2.98, .2]] });
  const m = mel[step % 64];
  if (m) pluck(m, t, { vol: .2, buzz: .45, bright: .7, bend: step % 16 === 0 ? 2 : 0, dur: 1.6 });
}});
const musicBtn = $('#music');
musicBtn.addEventListener('click', () => { const on = music.toggle(); musicBtn.classList.toggle('off', !on); musicBtn.setAttribute('aria-label', on ? 'Pause music' : 'Play music'); });
const clack = () => music.sfx((t, tone, noise) => { noise(t, { dur: .04, vol: .09, freq: 1700, type: 'bandpass', q: 3 }); tone(55, t, { dur: .06, vol: .1 }); });

/* ================= the design that will be woven ================= */
const wc = $('#weave'), wx = wc.getContext('2d'), sc = $('#shuttle'), sx = sc.getContext('2d');
const CS = small ? 3 : 4;
let W, H, D, COLS, ROWS, cells;
const PAL = { ground: [14, 20, 52], muslin: [246, 240, 228], zari: [217, 166, 60], rani: [214, 51, 108] };
const PK = Object.keys(PAL);
function buildMask() {
  const m = document.createElement('canvas'); m.width = COLS; m.height = ROWS; const x = m.getContext('2d');
  const rgb = k => `rgb(${PAL[k].join(',')})`;
  x.fillStyle = rgb('ground'); x.fillRect(0, 0, COLS, ROWS);
  const px = (i, j, k) => { x.fillStyle = rgb(k); x.fillRect(i, j, 1, 1); };
  // zari borders: diamond chain top & bottom, zigzag sides
  const band = (y0) => { for (let j = 0; j < 11; j++) for (let i = 0; i < COLS; i++) { const d = Math.abs((i % 12) - 6) + Math.abs(j - 5); if (j === 0 || j === 10 || d === 5 || d === 2) px(i, y0 + j, 'zari'); else if (d === 0) px(i, y0 + j, 'rani'); } };
  band(1); band(ROWS - 12);
  for (let j = 12; j < ROWS - 12; j++) { const z = Math.abs((j % 8) - 4); px(1 + z, j, 'zari'); px(COLS - 2 - z, j, 'zari'); px(0, j, 'zari'); px(COLS - 1, j, 'zari'); }
  // muslin butis (small flowers) across the field
  const B = ['...x...', '..x.x..', '.x.x.x.', 'x.xxx.x', '.x.x.x.', '..x.x..', '...x...'];
  for (let j = 16, r = 0; j < ROWS - 20; j += 13, r++) for (let i = 9 + (r % 2) * 7; i < COLS - 12; i += 14) B.forEach((row, b) => [...row].forEach((c, a) => { if (c === 'x') px(i + a, j + b, (a === 3 && b === 3) ? 'rani' : 'muslin'); }));
  // central panel framed in zari, cleared for the text
  const pl = Math.round(COLS * .1), pr = COLS - pl, pt = Math.round(ROWS * .13), pb = Math.round(ROWS * .74);
  x.fillStyle = rgb('ground'); x.fillRect(pl - 2, pt - 2, pr - pl + 4, pb - pt + 4);
  x.strokeStyle = rgb('zari'); x.lineWidth = 1; x.strokeRect(pl + .5, pt + .5, pr - pl - 1, pb - pt - 1); x.strokeRect(pl + 3.5, pt + 3.5, pr - pl - 7, pb - pt - 7);
  // corner paisleys (konka)
  [[pl + 8, pt + 8, 1], [pr - 8, pt + 8, -1], [pl + 8, pb - 8, 1], [pr - 8, pb - 8, -1]].forEach(([cx, cy, s]) => { x.fillStyle = rgb('rani'); x.beginPath(); x.arc(cx, cy, 2.4, 0, 7); x.fill(); x.strokeStyle = rgb('zari'); x.beginPath(); x.arc(cx, cy, 4.5, 0, 7); x.stroke(); });
  // the words
  x.textAlign = 'center'; x.textBaseline = 'middle';
  const fit = (txt, font, size, maxW) => { x.font = font.replace('%', size); while (x.measureText(txt).width > maxW && size > 6) { size -= 1; x.font = font.replace('%', size); } };
  x.fillStyle = rgb('zari'); fit('শুভ বিবাহ', '400 %px "Tiro Bangla"', Math.round(COLS * .11), (pr - pl) * .8); x.fillText('শুভ বিবাহ', COLS / 2, ROWS * .2);
  x.fillStyle = rgb('muslin'); fit('Nusaiba', '700 %px "Cormorant Garamond"', Math.round(COLS * .2), (pr - pl) * .86); x.fillText('Nusaiba', COLS / 2, ROWS * .34);
  x.fillStyle = rgb('rani'); x.font = `500 ${Math.round(COLS * .12)}px "Cormorant Garamond"`; x.fillText('&', COLS / 2, ROWS * .435);
  x.fillStyle = rgb('muslin'); fit('Tanzim', '700 %px "Cormorant Garamond"', Math.round(COLS * .2), (pr - pl) * .86); x.fillText('Tanzim', COLS / 2, ROWS * .53);
  x.fillStyle = rgb('zari'); fit('18 · 03 · 2028', '700 %px "Cormorant Garamond"', Math.round(COLS * .085), (pr - pl) * .8); x.fillText('18 · 03 · 2028', COLS / 2, ROWS * .63);
  fit('DHAKA', '700 %px "Cormorant Garamond"', Math.round(COLS * .06), (pr - pl) * .6); x.fillText('DHAKA', COLS / 2, ROWS * .69);
  // snap every pixel to the nearest thread colour
  const d = x.getImageData(0, 0, COLS, ROWS).data; cells = new Uint8Array(COLS * ROWS);
  for (let i = 0; i < COLS * ROWS; i++) { let best = 0, bd = 1e9; PK.forEach((k, n) => { const c = PAL[k], dd = (d[i * 4] - c[0]) ** 2 + (d[i * 4 + 1] - c[1]) ** 2 + (d[i * 4 + 2] - c[2]) ** 2; if (dd < bd) { bd = dd; best = n; } }); cells[i] = best; }
}
function setupLoom() {
  D = Math.min(devicePixelRatio || 1, 2); W = innerWidth; H = innerHeight; COLS = Math.floor(W / CS); ROWS = Math.floor(H / CS);
  [wc, sc].forEach(c => { c.width = COLS * CS * D; c.height = ROWS * CS * D; c.style.width = COLS * CS + 'px'; c.style.height = ROWS * CS + 'px'; c.style.left = (W - COLS * CS) / 2 + 'px'; });
  wx.setTransform(D, 0, 0, D, 0, 0); sx.setTransform(D, 0, 0, D, 0, 0);
  // the bare warp
  wx.fillStyle = '#1d130c'; wx.fillRect(0, 0, COLS * CS, ROWS * CS);
  for (let i = 0; i < COLS; i++) { wx.fillStyle = i % 2 ? 'rgba(233,223,207,.42)' : 'rgba(233,223,207,.3)'; wx.fillRect(i * CS + CS * .25, 0, CS * .5, ROWS * CS); }
}
setupLoom();
const shade = PK.map(k => { const [r, g, b] = PAL[k]; return { base: `rgb(${r},${g},${b})`, hi: `rgba(255,255,255,${k === 'zari' ? .32 : .13})`, lo: 'rgba(0,0,0,.16)' }; });
function weaveCell(i, j) {
  const s = shade[cells[j * COLS + i]], x = i * CS, y = j * CS;
  wx.fillStyle = s.base; wx.fillRect(x, y, CS, CS);
  if ((i + j) % 2) { wx.fillStyle = s.hi; wx.fillRect(x, y, CS, CS * .45); } else { wx.fillStyle = s.lo; wx.fillRect(x, y + CS * .55, CS, CS * .45); }
}

/* ================= weaving ================= */
const BAND = small ? 6 : 5;
let row = 0, passT = 0, dir = 1, drawnCols = 0, speed = 1, weaving = false, done = false;
function drawShuttle(p, y) {
  sx.clearRect(0, 0, COLS * CS, ROWS * CS);
  if (done) return;
  const w = COLS * CS, by = y + BAND * CS;
  // reed (beater)
  sx.fillStyle = '#6b4423'; sx.fillRect(0, by + 2, w, 10); sx.fillStyle = 'rgba(255,220,170,.25)'; sx.fillRect(0, by + 2, w, 2);
  sx.fillStyle = 'rgba(0,0,0,.35)'; for (let i = 0; i < w; i += 6) sx.fillRect(i, by + 5, 1, 6);
  // shuttle
  const x = dir > 0 ? p * w : (1 - p) * w, cy = y + BAND * CS / 2;
  sx.save(); sx.translate(x, cy); sx.scale(dir, 1);
  sx.fillStyle = '#8a5a2b'; sx.beginPath(); sx.moveTo(-46, 0); sx.quadraticCurveTo(-30, -9, 0, -9); sx.lineTo(28, -9); sx.quadraticCurveTo(40, -8, 50, 0); sx.quadraticCurveTo(40, 8, 28, 9); sx.lineTo(0, 9); sx.quadraticCurveTo(-30, 9, -46, 0); sx.fill();
  sx.fillStyle = '#c9c0b0'; sx.beginPath(); sx.moveTo(50, 0); sx.lineTo(60, 0); sx.lineTo(48, -3); sx.fill();
  sx.fillStyle = '#3a2412'; sx.fillRect(-14, -4, 28, 8); sx.fillStyle = '#d9a63c'; sx.fillRect(-12, -2, 24, 4);
  sx.restore();
  // the weft thread trailing behind it
  sx.strokeStyle = 'rgba(246,240,228,.7)'; sx.lineWidth = 1; sx.beginPath(); sx.moveTo(dir > 0 ? 0 : w, cy); sx.lineTo(x, cy); sx.stroke();
}
let lastT = performance.now();
function loomFrame() {
  const now = performance.now();
  const dt = clamp((now - lastT) / 1000, 0, .05); lastT = now;
  if (weaving && !done) {
    const passDur = (reduce || SETTLE ? .001 : .2) / speed;
    passT += dt / passDur;
    const target = Math.min(COLS, Math.floor(Math.min(1, passT) * COLS));
    for (; drawnCols < target; drawnCols++) { const i = dir > 0 ? drawnCols : COLS - 1 - drawnCols; for (let j = row; j < Math.min(ROWS, row + BAND); j++) weaveCell(i, j); }
    if (passT >= 1) {
      row += BAND; passT = 0; drawnCols = 0; dir = -dir; if (!SETTLE) clack();
      if (row >= ROWS) { done = true; finish(); }
      if (SETTLE) { while (row < ROWS) { for (let i = 0; i < COLS; i++) for (let j = row; j < Math.min(ROWS, row + BAND); j++) weaveCell(i, j); row += BAND; } done = true; finish(); }
    }
    drawShuttle(Math.min(1, passT), row * CS);
  }
  if (!done) requestAnimationFrame(loomFrame); else sx.clearRect(0, 0, COLS * CS, ROWS * CS);
}
window.__state = () => 'w=' + weaving + ' row=' + row + '/' + ROWS + ' pT=' + passT.toFixed(2) + ' done=' + done;
$('#weaveBtn').addEventListener('click', async e => {
  if (weaving) { speed = Math.min(6, speed * 2); return; }
  e.currentTarget.textContent = 'Weave faster';
  try { await Promise.all(['700 40px "Cormorant Garamond"', '400 40px "Tiro Bangla"'].map(f => document.fonts.load(f, 'NusaibaশুভTanzim'))); } catch (err) {}
  buildMask(); weaving = true; $('#loom').classList.add('weaving');
  music.start(); musicBtn.hidden = false;
  lastT = performance.now(); requestAnimationFrame(loomFrame);
});

/* ================= the finished cloth, in 3D ================= */
let renderer = null, startCloth = () => {};
try {
  renderer = new THREE.WebGLRenderer({ canvas: $('#cloth'), antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, small ? 1.6 : 1.75)); renderer.setClearColor(0, 0);
  renderer.outputEncoding = THREE.sRGBEncoding;
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(40, innerWidth / innerHeight, .1, 100);
  const tex = new THREE.CanvasTexture(wc); tex.encoding = THREE.sRGBEncoding; tex.anisotropy = 4;
  const PH = 6, PW = PH * (COLS / ROWS), DIST = (PH / 2) / Math.tan(THREE.MathUtils.degToRad(20));
  const U = { uMap: { value: tex }, uT: { value: 0 }, uAmp: { value: 0 }, uW: { value: PW }, uH: { value: PH } };
  const cloth = new THREE.Mesh(new THREE.PlaneGeometry(PW, PH, 60, 90), new THREE.ShaderMaterial({ uniforms: U, side: THREE.DoubleSide,
    vertexShader: `uniform float uT,uAmp,uW,uH;varying vec2 vUv;varying vec3 vN;varying vec3 vV;
      vec3 disp(vec3 p){float f=pow(clamp((uH*.5-p.y)/uH,0.,1.),1.25);
        float z=(sin(p.x*1.5+uT*1.2+p.y*1.3)*.38+sin(p.x*3.6-uT*1.7+p.y*2.2)*.1+sin(p.y*2.3+uT*.8)*.22)*f*uAmp;
        float x=sin(uT*.7+p.y*.8)*.22*f*uAmp;return vec3(p.x+x,p.y,p.z+z);}
      void main(){vUv=uv;vec3 p=disp(position);vec3 px=disp(position+vec3(.02,0.,0.));vec3 py=disp(position+vec3(0.,.02,0.));
        vN=normalize(normalMatrix*normalize(cross(px-p,py-p)));vec4 mv=modelViewMatrix*vec4(p,1.);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}`,
    fragmentShader: `uniform sampler2D uMap;varying vec2 vUv;varying vec3 vN;varying vec3 vV;
      void main(){vec4 c=texture2D(uMap,vUv);vec3 n=normalize(gl_FrontFacing?vN:-vN);vec3 L=normalize(vec3(.4,.6,.8));
        float dif=.5+.5*max(dot(n,L),0.);float gold=step(.55,c.r)*step(c.b,.45);float spec=pow(max(dot(reflect(-L,n),vV),0.),18.)*(.15+gold*1.2);
        vec3 col=c.rgb*dif+spec*vec3(1.,.85,.5);if(!gl_FrontFacing)col*=.55;gl_FragColor=vec4(col,1.);}` }));
  const rig = new THREE.Group(); rig.add(cloth); scene.add(rig);
  const gold = new THREE.MeshStandardMaterial({ color: 0xd9a63c, metalness: .9, roughness: .3 });
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(.05, .05, PW + .5, 12), gold); rod.rotation.z = Math.PI / 2; rod.position.y = PH / 2 + .03; rig.add(rod);
  [-1, 1].forEach(s => { const b = new THREE.Mesh(new THREE.SphereGeometry(.09, 12, 8), gold); b.position.set(s * (PW / 2 + .28), PH / 2 + .03, 0); rig.add(b); });
  scene.add(new THREE.AmbientLight(0xffffff, .6)); const dl = new THREE.DirectionalLight(0xffffff, .8); dl.position.set(2, 3, 4); scene.add(dl);
  const resize = () => { renderer.setSize(innerWidth, innerHeight, false); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); };
  resize(); addEventListener('resize', resize);
  let lift = 0, sp = 0;
  addEventListener('scroll', () => { sp = clamp(scrollY / (document.documentElement.scrollHeight - innerHeight || 1), 0, 1); }, { passive: true });
  const clock = new THREE.Clock();
  startCloth = () => {
    tex.needsUpdate = true;
    (function frame() {
      const dt = Math.min(clock.getDelta(), .05), t = clock.elapsedTime;
      lift = SETTLE ? 1 : Math.min(1, lift + dt / 3.2); const e = lift * lift * (3 - 2 * lift);
      U.uT.value = t; U.uAmp.value = e * (.8 + sp * .9);
      camera.position.set(0, 0, DIST * (1 + e * .5)); camera.lookAt(0, -e * .9, 0);
      rig.rotation.y = e * (Math.sin(t * .35) * .3 + sp * .9); rig.rotation.x = -e * .08;
      rig.position.y = e * (.2 + sp * 1.4);
      renderer.render(scene, camera);
      requestAnimationFrame(frame);
    })();
  };
} catch (err) { renderer = null; }

function finish() {
  music.sfx((t, tone, noise, pluck) => [62, 65, 69, 74].forEach((m, i) => pluck(m, t + i * .12, { vol: .18, buzz: .4 })));
  setTimeout(() => {
    document.body.classList.add('woven'); startCloth();
    $('#loom').classList.add('gone'); document.body.classList.remove('locked');
    setTimeout(() => $('.hero .panel').classList.add('in'), reduce ? 0 : 1600);
  }, SETTLE ? 0 : 900);
}

/* ================= reveal, countdown, RSVP ================= */
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting && document.body.classList.contains('woven')) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .2 });
document.querySelectorAll('.panel').forEach(el => io.observe(el));
addEventListener('scroll', () => document.querySelectorAll('.panel:not(.in)').forEach(p => { const r = p.getBoundingClientRect(); if (r.top < innerHeight * .85 && r.bottom > 0 && document.body.classList.contains('woven')) p.classList.add('in'); }), { passive: true });
const target = new Date('2028-03-18T17:00:00+06:00').getTime();
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
  $('#thanks-msg').textContent = `${name.split(' ')[0]}, you’re woven in. We’ll see ${n > 1 ? 'all ' + n + ' of you' : 'you'} at the ${list}.`;
  $('.rsvp').classList.add('sent');
  music.sfx((t, tone, noise, pluck) => [62, 65, 69, 74, 77].forEach((m, i) => pluck(m, t + i * .1, { vol: .18, buzz: .3 })));
});
})();
