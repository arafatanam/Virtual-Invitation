/* Gaye Holud — 3D marigolds bloom open petal by petal, garland ropes swing with real rope physics (grab them),
   and every tap throws a splash of turmeric that drips down the screen. */
(() => {
'use strict';
const $ = s => document.querySelector(s);
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const small = Math.min(innerWidth, innerHeight) < 600;
const rand = (a = 0, b = 1) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const TAU = Math.PI * 2;
const SETTLE = location.hash === '#settle';

/* ================= music: dhol, claps, shakers and a bright bansuri ================= */
const mel = [79, 0, 76, 79, 81, 0, 79, 76, 74, 0, 76, 0, 79, 0, 0, 0, 76, 0, 74, 76, 79, 0, 76, 74, 71, 0, 74, 0, 67, 0, 0, 0,
             71, 0, 74, 0, 76, 0, 79, 0, 81, 79, 76, 0, 74, 0, 76, 0, 79, 0, 76, 74, 71, 0, 69, 0, 67, 0, 0, 0, 0, 0, 0, 0];
const dholL = (t, tone, noise, v = 1) => { tone(40, t, { dur: .32, vol: .38 * v, slide: 2 }); noise(t, { dur: .06, vol: .07 * v, freq: 220, type: 'lowpass' }); };
const dholR = (t, tone, noise, v = 1) => { tone(70, t, { dur: .07, vol: .06 * v, partials: [[1, 1], [1.6, .4]] }); noise(t, { dur: .04, vol: .07 * v, freq: 1900, type: 'bandpass', q: 1.2 }); };
const clap = (t, noise) => { for (let i = 0; i < 3; i++) noise(t + i * .008, { dur: .05, vol: .06, freq: 1400, type: 'bandpass', q: .9 }); };
const music = createMusic({ spb: .13, reverb: .22, volume: .82, play(step, t, tone, noise) {
  const k = step % 8;
  if (k === 0 || k === 3 || k === 6) dholL(t, tone, noise, k ? .8 : 1);
  if (k === 2 || k === 4 || k === 7) dholR(t, tone, noise);
  if (step % 16 === 4 || step % 16 === 12) clap(t, noise);
  noise(t, { dur: .04, vol: k % 2 ? .02 : .012, freq: 8000 });
  const m = mel[step % mel.length];
  if (m) tone(m, t, { type: 'triangle', dur: .4, vol: .06, attack: .02, bend: .7, vib: [6, 14], partials: [[1, 1], [2, .15]] });
  if (step % 32 === 0) tone(43, t, { type: 'sawtooth', dur: 4, vol: .012, cutoff: 600, sustain: true, attack: .3 });
}});
const musicBtn = $('#music');
musicBtn.addEventListener('click', () => { const on = music.toggle(); musicBtn.classList.toggle('off', !on); musicBtn.setAttribute('aria-label', on ? 'Pause music' : 'Play music'); });
const splatSfx = (v = 1) => music.sfx((t, tone, noise) => { noise(t, { dur: .18, vol: .16 * v, freq: 700, type: 'lowpass' }); noise(t + .02, { dur: .1, vol: .05 * v, freq: 2500, type: 'bandpass', q: .7 }); tone(46, t, { dur: .12, vol: .12 * v, slide: -8 }); });

/* ================= blob shapes ================= */
function blobPts(r, n = 22, rough = .35) { const ph = [rand(0, 6), rand(0, 6), rand(0, 6)];
  return Array.from({ length: n }, (_, i) => { const a = i / n * TAU, k = 1 + rough * (.5 * Math.sin(a * 3 + ph[0]) + .3 * Math.sin(a * 5 + ph[1]) + .2 * Math.sin(a * 9 + ph[2])) + rand(-.05, .05); return [Math.cos(a) * r * k, Math.sin(a) * r * k]; }); }
function smoothPath(ctx, pts) {
  const n = pts.length; ctx.beginPath();
  for (let i = 0; i <= n; i++) { const p = pts[i % n], q = pts[(i + 1) % n], mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2; i ? ctx.quadraticCurveTo(p[0], p[1], mx, my) : ctx.moveTo(mx, my); }
  ctx.closePath();
}
{ // gate splash svg
  const pts = blobPts(80, 26, .3); let d = '';
  pts.forEach((p, i) => { const q = pts[(i + 1) % pts.length]; const mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2; d += i ? `Q${p[0].toFixed(1)} ${p[1].toFixed(1)} ${mx.toFixed(1)} ${my.toFixed(1)}` : `M${mx.toFixed(1)} ${my.toFixed(1)}`; });
  $('#splashPath').setAttribute('d', d + 'Z');
}

/* ================= turmeric splats with drips ================= */
const sc = $('#splats'), sx = sc.getContext('2d');
let W, H, SD;
function sizeSplats() { const old = sc.width ? sx.getImageData(0, 0, sc.width, sc.height) : null; SD = Math.min(devicePixelRatio || 1, 1.5); W = innerWidth; H = innerHeight; sc.width = W * SD; sc.height = H * SD; sx.setTransform(SD, 0, 0, SD, 0, 0); if (old) sx.putImageData(old, 0, 0); }
sizeSplats(); addEventListener('resize', sizeSplats);
const drips = [];
function splat(x, y, s = 1) {
  const r = rand(26, 46) * s;
  sx.save(); sx.translate(x, y); sx.rotate(rand(0, TAU));
  const g = sx.createRadialGradient(-r * .2, -r * .25, r * .1, 0, 0, r * 1.3); g.addColorStop(0, '#ffe46b'); g.addColorStop(.55, '#ffc300'); g.addColorStop(1, '#e99a00');
  sx.fillStyle = g; smoothPath(sx, blobPts(r, 24, .45)); sx.fill();
  sx.fillStyle = 'rgba(255,255,255,.35)'; smoothPath(sx, blobPts(r * .28, 12, .3).map(([a, b]) => [a - r * .3, b - r * .3])); sx.fill();
  for (let i = 0; i < 10 * s; i++) { const a = rand(0, TAU), d = r * rand(1.2, 2.4), rr = rand(2, 7) * s; sx.fillStyle = i % 3 ? '#ffc300' : '#f6a900'; sx.beginPath(); sx.arc(Math.cos(a) * d, Math.sin(a) * d, rr, 0, TAU); sx.fill(); }
  sx.restore();
  const nd = Math.floor(rand(1, 4) * s);
  for (let i = 0; i < nd; i++) drips.push({ x: x + rand(-r * .7, r * .7), y: y + r * rand(.3, .7), w: rand(4, 9) * Math.sqrt(s), v: rand(40, 90), life: rand(.8, 2.2) });
}
let fadeTick = 0;
function updateSplats(dt) {
  for (let i = drips.length - 1; i >= 0; i--) {
    const d = drips[i]; d.life -= dt; d.v *= .985; const ny = d.y + d.v * dt;
    sx.strokeStyle = '#f6b400'; sx.lineCap = 'round'; sx.lineWidth = d.w; sx.beginPath(); sx.moveTo(d.x, d.y); sx.lineTo(d.x, ny); sx.stroke();
    d.y = ny; d.w *= .997;
    if (d.life <= 0) { sx.fillStyle = '#f6b400'; sx.beginPath(); sx.arc(d.x, d.y + 1, d.w * .8, 0, TAU); sx.fill(); drips.splice(i, 1); }
  }
  if (++fadeTick % 8 === 0) { sx.save(); sx.globalCompositeOperation = 'destination-out'; sx.fillStyle = 'rgba(0,0,0,.02)'; sx.fillRect(0, 0, W, H); sx.restore(); }
}

/* ================= 3D marigolds ================= */
let renderer = null, scene, camera, petals, flowers = [], centers;
try {
  renderer = new THREE.WebGLRenderer({ canvas: $('#flowers'), antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, small ? 1.6 : 1.75));
  renderer.setClearColor(0x000000, 0);
  renderer.outputEncoding = THREE.sRGBEncoding;
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(40, innerWidth / innerHeight, .1, 100);
  camera.position.set(0, 0, 12);
  scene.add(new THREE.HemisphereLight(0xfff4d6, 0xb36b00, 1.05));
  const sun = new THREE.DirectionalLight(0xffffff, .9); sun.position.set(3, 6, 8); scene.add(sun);
  // a ruffled, cupped petal
  const pg = new THREE.PlaneGeometry(1, 1, 8, 5); pg.translate(0, .5, 0);
  const pa = pg.attributes.position;
  for (let i = 0; i < pa.count; i++) {
    let x = pa.getX(i), y = pa.getY(i);
    const w = Math.pow(Math.sin(Math.PI * Math.min(1, y * .9 + .1)), .5) * .55 + .08;
    x *= w * 2;
    const z = Math.sin(x * 26 + y * 4) * .05 * y + x * x * .9 - y * y * .15;
    pa.setXYZ(i, x, y, z);
  }
  pg.rotateX(Math.PI / 2); pg.computeVertexNormals();
  const PER = small ? 170 : 240, NF = 5;
  petals = new THREE.InstancedMesh(pg, new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, roughness: .65 }), PER * NF);
  const cols = [0xffb700, 0xffa000, 0xff8f00, 0xf57c00, 0xef6c00, 0xffc93c].map(c => new THREE.Color(c));
  for (let f = 0; f < NF; f++) {
    const yellow = f % 2 === 1;
    flowers.push({ pos: new THREE.Vector3(), tilt: rand(-.2, .2), spin: rand(0, TAU), open: 0, target: 0, size: f === 0 ? 1.5 : rand(.55, .8), wob: rand(0, 6), per: PER, base: f * PER });
    for (let i = 0; i < PER; i++) { const t = i / PER; const c = cols[Math.min(5, Math.floor((yellow ? 2 + t * 4 : t * 5)))].clone(); if (yellow) c.lerp(new THREE.Color(0xffd23f), .55); c.offsetHSL(rand(-.01, .01), 0, rand(-.04, .04)); petals.setColorAt(f * PER + i, c); }
  }
  scene.add(petals);
  centers = flowers.map(f => { const m = new THREE.Mesh(new THREE.SphereGeometry(.16, 16, 12), new THREE.MeshStandardMaterial({ color: 0xc75000, roughness: .8 })); scene.add(m); return m; });
  const resizeR = () => { renderer.setSize(innerWidth, innerHeight, false); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); };
  resizeR(); addEventListener('resize', resizeR);
} catch (e) { renderer = null; }

const M4 = new THREE.Matrix4(), Qt = new THREE.Quaternion(), Qf = new THREE.Quaternion(), Qp = new THREE.Quaternion(), E = new THREE.Euler(), S = new THREE.Vector3(), P = new THREE.Vector3(), OFF = new THREE.Vector3();
function layoutFlowers(t, sp) {
  const portrait = camera.aspect < 1, vw = Math.tan(THREE.MathUtils.degToRad(20)) * 12 * camera.aspect, vh = Math.tan(THREE.MathUtils.degToRad(20)) * 12;
  const spots = [[0, vh * .5], [-vw * .78, vh * .72], [vw * .8, vh * .62], [-vw * .82, -vh * .15], [vw * .78, -vh * .3]];
  flowers.forEach((f, i) => {
    let [x, y] = spots[i];
    if (i === 0) { y += sp * vh * 1.4; x += sp * vw * .4; }
    else { y += Math.sin(t * .5 + f.wob) * .2 + sp * (i % 2 ? .9 : -.4) * vh * .3; }
    f.pos.set(x, y, i === 0 ? 0 : -1);
    f.spin += .003 + (i === 0 ? .002 : 0);
    const sc = f.size * (portrait ? (i === 0 ? .9 : .75) : 1) * (i === 0 ? 1 - sp * .35 : 1);
    Qf.setFromEuler(E.set(1.15 + Math.sin(t * .6 + f.wob) * .08 + f.tilt, 0, Math.sin(t * .4 + f.wob) * .1));
    for (let k = 0; k < f.per; k++) {
      const u = k / f.per, yaw = k * 2.39996 + f.spin, open = f.open;
      const pitch = (-1.45 + (u * .1)) * (1 - open) + (-1.25 + u * 1.45) * open;
      Qp.setFromEuler(E.set(pitch, yaw, 0, 'YXZ'));
      const len = (.35 + u * .75) * sc;
      S.set(len * .9, len, len);
      OFF.set(0, 0, .06 * sc * u).applyQuaternion(Qp).applyQuaternion(Qf);
      P.copy(f.pos).add(OFF);
      M4.compose(P, Qt.copy(Qf).multiply(Qp), S);
      petals.setMatrixAt(f.base + k, M4);
    }
    centers[i].position.copy(f.pos); centers[i].scale.setScalar(sc * (1 - f.open * .3));
  });
  petals.instanceMatrix.needsUpdate = true;
}

/* ================= garland ropes (verlet) ================= */
const rc = $('#ropes'), rx = rc.getContext('2d');
let RD;
const ropes = [];
function buildRopes() {
  RD = Math.min(devicePixelRatio || 1, 1.5); rc.width = innerWidth * RD; rc.height = innerHeight * RD; rx.setTransform(RD, 0, 0, RD, 0, 0);
  ropes.length = 0;
  const w = innerWidth, defs = [[-10, 0, w * .62, -6, 1.22], [w * .38, -6, w + 10, 0, 1.2], [-10, -4, w + 10, -4, 1.12]];
  defs.forEach(([x0, y0, x1, y1, slack], ri) => {
    const n = small ? 16 : 22, len = Math.hypot(x1 - x0, y1 - y0) * slack / (n - 1), pts = [];
    for (let i = 0; i < n; i++) { const u = i / (n - 1); pts.push({ x: x0 + (x1 - x0) * u, y: y0 + (y1 - y0) * u, px: x0 + (x1 - x0) * u, py: y0 + (y1 - y0) * u, pin: i === 0 || i === n - 1 }); }
    ropes.push({ pts, len, ri });
  });
}
buildRopes(); addEventListener('resize', buildRopes);
let grab = null, ropeAlpha = 1;
function stepRopes(dt, t) {
  const g = 900, wind = Math.sin(t * .7) * 30 + Math.sin(t * 1.9) * 12;
  ropes.forEach(r => {
    r.pts.forEach(p => { if (p.pin || p === grab?.p) return; const vx = (p.x - p.px) * .985, vy = (p.y - p.py) * .985; p.px = p.x; p.py = p.y; p.x += vx + wind * dt * dt; p.y += vy + g * dt * dt; });
    for (let it = 0; it < 6; it++) for (let i = 0; i < r.pts.length - 1; i++) {
      const a = r.pts[i], b = r.pts[i + 1], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1, diff = (d - r.len) / d;
      const wa = a.pin || a === grab?.p ? 0 : .5, wb = b.pin || b === grab?.p ? 0 : .5, s = wa + wb || 1;
      a.x += dx * diff * wa / s; a.y += dy * diff * wa / s; b.x -= dx * diff * wb / s; b.y -= dy * diff * wb / s;
    }
  });
}
function flower(x, y, r, c1, c2) {
  rx.fillStyle = c2; for (let i = 0; i < 9; i++) { const a = i / 9 * TAU; rx.beginPath(); rx.arc(x + Math.cos(a) * r * .62, y + Math.sin(a) * r * .62, r * .48, 0, TAU); rx.fill(); }
  rx.fillStyle = c1; for (let i = 0; i < 7; i++) { const a = i / 7 * TAU + .3; rx.beginPath(); rx.arc(x + Math.cos(a) * r * .35, y + Math.sin(a) * r * .35, r * .38, 0, TAU); rx.fill(); }
  rx.fillStyle = 'rgba(160,70,0,.6)'; rx.beginPath(); rx.arc(x, y, r * .18, 0, TAU); rx.fill();
}
function drawRopes() {
  rx.clearRect(0, 0, innerWidth, innerHeight);
  if (ropeAlpha < .02) return;
  rx.globalAlpha = ropeAlpha;
  ropes.forEach(r => {
    rx.strokeStyle = 'rgba(122,74,38,.5)'; rx.lineWidth = 1.5; rx.beginPath(); r.pts.forEach((p, i) => i ? rx.lineTo(p.x, p.y) : rx.moveTo(p.x, p.y)); rx.stroke();
    for (let i = 0; i < r.pts.length - 1; i++) {
      const a = r.pts[i], b = r.pts[i + 1];
      for (let s = 0; s < 2; s++) {
        const u = s / 2, x = a.x + (b.x - a.x) * u, y = a.y + (b.y - a.y) * u, k = i * 2 + s;
        if (k % 5 === 4) { rx.fillStyle = '#2e7d32'; rx.save(); rx.translate(x, y); rx.rotate(Math.atan2(b.y - a.y, b.x - a.x) + 1.2); rx.beginPath(); rx.ellipse(0, 8, 5, 11, 0, 0, TAU); rx.fill(); rx.restore(); }
        else flower(x, y, small ? 10 : 12, (k + r.ri) % 2 ? '#ffd23f' : '#ff9f1c', (k + r.ri) % 2 ? '#ffb700' : '#f26b00');
      }
    }
  });
  rx.globalAlpha = 1;
}
function nearestRopePoint(x, y) { let best = null, bd = 44; ropes.forEach(r => r.pts.forEach(p => { if (p.pin) return; const d = Math.hypot(p.x - x, p.y - y); if (d < bd) { bd = d; best = p; } })); return best; }
addEventListener('pointerdown', e => { if (ropeAlpha < .5 || !opened) return; const p = nearestRopePoint(e.clientX, e.clientY); if (p) { grab = { p, id: e.pointerId }; music.sfx((t, tone) => tone(rand(84, 91), t, { dur: .6, vol: .04, partials: [[1, 1], [2.7, .3]] })); } });
addEventListener('pointermove', e => { if (grab && e.pointerId === grab.id) { grab.p.x = e.clientX; grab.p.y = Math.max(0, e.clientY); grab.p.px = grab.p.x; grab.p.py = grab.p.y; } }, { passive: true });
addEventListener('pointerup', () => { grab = null; });

/* ================= loop ================= */
let opened = false, sp = 0;
const clock = new THREE.Clock();
function loop() {
  const dt = Math.min(clock.getDelta(), .033), t = clock.elapsedTime;
  updateSplats(dt);
  stepRopes(dt, t); ropeAlpha += ((sp < .6 ? 1 : 0) - ropeAlpha) * .08; drawRopes();
  if (renderer) {
    flowers.forEach((f, i) => { if (SETTLE) f.open = f.target; f.open += (f.target - f.open) * Math.min(1, dt * (i ? 1.2 : .8)); });
    layoutFlowers(t, sp);
    renderer.render(scene, camera);
  }
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
addEventListener('scroll', () => { sp = clamp(scrollY / innerHeight, 0, 1.5); }, { passive: true });

/* ================= gate ================= */
$('#open').addEventListener('click', e => {
  const g = $('#gate'), r = e.currentTarget.getBoundingClientRect();
  $('#splash').style.left = (r.left + r.width / 2) + 'px'; $('#splash').style.top = (r.top + r.height / 2) + 'px';
  g.classList.add('splashing', 'gone'); splatSfx(1.6);
  music.start(); musicBtn.hidden = false;
  setTimeout(() => {
    document.body.classList.add('open'); document.body.classList.remove('locked'); opened = true;
    flowers.forEach((f, i) => setTimeout(() => { f.target = 1; }, reduce ? 0 : 300 + i * 250));
    for (let i = 0; i < 5; i++) setTimeout(() => splat(rand(.1, .9) * W, rand(.15, .7) * H, rand(.6, 1.2)), reduce ? 0 : 500 + i * 120);
  }, reduce ? 0 : 1000);
});

/* ================= tap anywhere to throw holud ================= */
document.addEventListener('click', e => {
  if (!opened || e.target.closest('a,button,input,select,label,textarea,form')) return;
  if (grab) return;
  splat(e.clientX, e.clientY, rand(.8, 1.2)); splatSfx();
});

/* ================= reveal signs ================= */
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); music.sfx((t, tone) => tone(rand(86, 90), t + .5, { dur: .5, vol: .04, partials: [[1, 1], [2.7, .25]] })); } }), { threshold: .3 });
document.querySelectorAll('.sign').forEach(el => io.observe(el));

/* ================= countdown ================= */
const target = new Date('2028-01-08T16:00:00+06:00').getTime();
const cd = ['d', 'h', 'm', 's'].map(k => $('#cd-' + k));
function count() { const s = Math.max(0, Math.floor((target - Date.now()) / 1000));
  [Math.floor(s / 86400), Math.floor(s % 86400 / 3600), Math.floor(s % 3600 / 60), s % 60].forEach((n, i) => cd[i].textContent = String(n).padStart(2, '0')); }
count(); setInterval(count, 1000);

/* ================= RSVP ================= */
$('#form').addEventListener('submit', e => {
  e.preventDefault();
  const name = $('#f-name').value.trim(), ev = [...document.querySelectorAll('fieldset input:checked')].map(i => i.value), n = +$('#f-count').value, err = $('#err');
  if (!name) { err.textContent = 'Please tell us your name.'; $('#f-name').focus(); return; }
  if (!ev.length) { err.textContent = 'Pick at least one event.'; return; }
  err.textContent = '';
  // NOTE: connect a form backend here (Google Forms, Formspree, Supabase…) — { name, events: ev, guests: n }
  const list = ev.length > 1 ? ev.slice(0, -1).join(', ') + ' and ' + ev.at(-1) : ev[0];
  $('#thanks-msg').textContent = `${name.split(' ')[0]}, see you at the ${list}${n > 1 ? ' with ' + (n - 1) + ' more' : ''}. Wear yellow!`;
  $('.rsvp').classList.add('sent');
  for (let i = 0; i < 9; i++) setTimeout(() => { splat(rand(.05, .95) * W, rand(.05, .8) * H, rand(.7, 1.4)); if (i % 3 === 0) splatSfx(.7); }, i * 110);
});
})();
