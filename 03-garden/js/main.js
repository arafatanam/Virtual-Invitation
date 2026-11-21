/* In the Garden — envelope, greenery, chandelier, flip clock,
   plus a WebGL layer of tumbling 3D petals and flapping butterflies.  */
(() => {
'use strict';
const $ = s => document.querySelector(s);
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const small = Math.min(innerWidth, innerHeight) < 600;
const rand = (a = 0, b = 1) => a + Math.random() * (b - a);
const wait = ms => new Promise(r => setTimeout(r, reduce ? 0 : ms));

/* ================= music box ================= */
const prog = [[60,64,67,72],[57,60,64,69],[53,57,60,65],[55,59,62,67]];
const mel = [79,0,76,0,77,79,0,0, 76,0,72,0,74,76,0,0, 72,0,69,0,72,74,77,0, 74,0,71,0,74,0,0,0];
const tine = [[1,1,1],[3.01,.18,.25],[5.4,.05,.1]];
const music = createMusic({ spb: .24, reverb: .4, play(step, t, tone) {
  const bar = Math.floor(step / 8) % 4, s = step % 8, ch = prog[bar];
  if (s % 2 === 0) tone(ch[[0,2,1,3][s / 2]] + (s === 0 ? -12 : 0), t, { dur: 1.8, vol: .065, attack: .004, partials: tine });
  const m = mel[step % 32]; if (m) tone(m + 12, t, { dur: 1.8, vol: .09, attack: .004, partials: tine });
}});
const musicBtn = $('#music');
musicBtn.addEventListener('click', () => { const on = music.toggle(); musicBtn.classList.toggle('off', !on); musicBtn.setAttribute('aria-label', on ? 'Pause music' : 'Play music'); });

/* ================= envelope ================= */
const gate = $('#gate'), env = $('#env');
gate.addEventListener('pointermove', e => {
  if (gate.classList.contains('opening')) return;
  const x = e.clientX / innerWidth - .5, y = e.clientY / innerHeight - .5;
  env.style.setProperty('--ry', (x * 34) + 'deg'); env.style.setProperty('--rx', (14 - y * 26) + 'deg');
});
gate.addEventListener('pointerleave', () => { env.style.setProperty('--ry', '-10deg'); env.style.setProperty('--rx', '14deg'); });
let opened = false;
$('#seal').addEventListener('click', async () => {
  if (opened) return; opened = true;
  music.start(); musicBtn.hidden = false;
  gate.classList.add('opening'); env.classList.add('cracked');
  env.style.setProperty('--ry', '0deg'); env.style.setProperty('--rx', '0deg');
  await wait(550); env.classList.add('open');
  await wait(900); env.classList.add('behind');
  await wait(150); env.classList.add('out');
  await wait(1500); gate.classList.add('zoom');
  Garden3D && Garden3D.shower(70);
  await wait(500);
  document.body.classList.add('reveal-in'); gate.classList.add('gone'); document.body.classList.remove('locked');
  scrollTo(0, 0);
});

/* ================= hanging greenery (2D canvas) ================= */
function Garland(canvas, opts) {
  const x = canvas.getContext('2d'); let w, h, r, strands = [];
  const greens = ['#4e6b3d', '#5f7d48', '#7f9a66', '#9caf86', '#3d5a30', '#6c8a55'];
  let seed; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  function build() {
    seed = opts.seed; r = Math.min(devicePixelRatio || 1, 2);
    w = canvas.width = canvas.clientWidth * r; h = canvas.height = canvas.clientHeight * r; strands = [];
    const n = Math.round(canvas.clientWidth / 14) + 8;
    for (let i = 0; i < n; i++) {
      const u = rnd(), edge = Math.pow(Math.abs(u - .5) * 2, 2.2);
      const len = h * (.12 + rnd() * .16 + edge * .72), segs = Math.max(6, Math.round(len / (13 * r))), leaves = [];
      for (let j = 1; j <= segs; j++) leaves.push({ t: j / segs, side: j % 2 ? 1 : -1, s: (7 + rnd() * 7) * r * (1 - j / segs * .4), a: .5 + rnd() * .6, c: greens[Math.floor(rnd() * greens.length)], fl: rnd() < .14 });
      strands.push({ x: u * w, len, leaves, ph: rnd() * 6, amp: (6 + rnd() * 10) * r, bloom: rnd() < .45, bc: rnd() < .5 ? '#ffffff' : '#f3dcd3' });
    }
    strands.sort((a, b) => a.len - b.len);
  }
  function leaf(px, py, ang, s, c) {
    x.save(); x.translate(px, py); x.rotate(ang); x.fillStyle = c;
    x.beginPath(); x.moveTo(0, 0); x.quadraticCurveTo(s * .55, -s * .38, s * 1.25, 0); x.quadraticCurveTo(s * .55, s * .38, 0, 0); x.fill();
    x.strokeStyle = 'rgba(255,255,255,.18)'; x.lineWidth = .6 * r; x.beginPath(); x.moveTo(0, 0); x.lineTo(s * 1.1, 0); x.stroke(); x.restore();
  }
  function flower(px, py, s, c) {
    x.fillStyle = c;
    for (let k = 0; k < 5; k++) { const a = k * 1.2566; x.beginPath(); x.arc(px + Math.cos(a) * s * .55, py + Math.sin(a) * s * .55, s * .45, 0, 7); x.fill(); }
    x.fillStyle = '#e8c870'; x.beginPath(); x.arc(px, py, s * .28, 0, 7); x.fill();
  }
  // gentle "wind" responds to the pointer
  let wind = 0, windT = 0;
  addEventListener('pointermove', e => { windT = (e.clientX / innerWidth - .5) * 2; }, { passive: true });
  function draw(t) {
    wind += (windT - wind) * .02;
    x.clearRect(0, 0, w, h);
    if (opts.up) { x.save(); x.translate(0, h); x.scale(1, -1); }
    for (let i = 0; i < w; i += 9 * r) { const k = Math.sin(i * .37) * .5 + .5; leaf(i, 2 * r, 1.2 + Math.sin(i) * .8 + Math.sin(t * .8 + i) * .05, (9 + k * 8) * r, greens[Math.floor(k * 5.9)]); }
    strands.forEach(s => {
      const sw = t * .7 + s.ph;
      const pt = q => [s.x + (Math.sin(sw + q * 2) * s.amp + wind * 14 * r) * Math.pow(q, 1.4), q * s.len];
      x.strokeStyle = '#3d5a30'; x.lineWidth = 1.1 * r; x.beginPath();
      for (let q = 0; q <= 1.001; q += .1) { const [px, py] = pt(q); q === 0 ? x.moveTo(px, py) : x.lineTo(px, py); } x.stroke();
      s.leaves.forEach(l => { const [px, py] = pt(l.t); leaf(px, py, Math.PI / 2 + l.side * l.a + Math.sin(sw * 1.3 + l.t * 4) * .12, l.s, l.c); if (l.fl) flower(px + l.side * 4 * r, py, 4.5 * r, '#fffaf4'); });
      if (s.bloom) { const [ex, ey] = pt(1); for (let k = 0; k < 9; k++) { const q = k / 9; flower(ex + Math.sin(k * 2.3) * 5 * r * (1 - q), ey - 18 * r + q * 26 * r, (4.6 - q * 2.2) * r, s.bc); } }
    });
    if (opts.up) x.restore();
  }
  let vis = true;
  new IntersectionObserver(([e]) => vis = e.isIntersecting).observe(canvas);
  build(); addEventListener('resize', build);
  (function loop(n) { if (vis) draw(reduce ? 0 : n / 1000); requestAnimationFrame(loop); })(0);
}
Garland($('#garland'), { seed: 11 });
Garland($('#garland2'), { seed: 29, up: true });

/* ================= chandelier ================= */
(() => {
  let g = '<defs><radialGradient id="fl"><stop offset="0" stop-color="#fffaf0"/><stop offset=".35" stop-color="#ffe3a3" stop-opacity=".9"/><stop offset="1" stop-color="#ffd98a" stop-opacity="0"/></radialGradient><linearGradient id="br" x1="0" x2="1"><stop offset="0" stop-color="#8d7340"/><stop offset=".5" stop-color="#e3cc93"/><stop offset="1" stop-color="#8d7340"/></linearGradient></defs>';
  g += '<g stroke="url(#br)" fill="none" stroke-width="1.6" stroke-linecap="round">';
  for (let y = 0; y < 52; y += 7) g += `<ellipse cx="100" cy="${y + 3}" rx="2" ry="3.2"/>`;
  g += '<path d="M100 56v52"/><circle cx="100" cy="62" r="5"/><path d="M90 108q10 18 20 0M100 126v10"/><circle cx="100" cy="139" r="2.6" fill="#e3cc93" stroke="none"/>';
  const arms = [[24, 96], [52, 86], [148, 86], [176, 96]];
  arms.forEach(([ax, ay]) => { g += `<path d="M100 108 C ${(100 + ax) / 2} 116, ${ax} 112, ${ax} ${ay}"/><path d="M${ax - 7} ${ay}h14l-3 5h-8z" fill="#e3cc93" stroke="none"/>`; });
  g += '<path d="M24 101 Q62 128 100 118 Q138 128 176 101" stroke-dasharray="1 4" stroke-width="2"/><path d="M52 91 Q76 110 100 108 Q124 110 148 91" stroke-dasharray="1 4" stroke-width="2"/></g>';
  arms.forEach(([ax, ay], i) => {
    g += `<rect x="${ax - 2.6}" y="${ay - 18}" width="5.2" height="18" rx="1" fill="#fffaf2" stroke="#e5d9c2" stroke-width=".5"/>`;
    g += `<circle cx="${ax}" cy="${ay - 25}" r="14" fill="url(#fl)"><animate attributeName="r" values="12;15;11;14;12" dur="${2.4 + i * .3}s" repeatCount="indefinite"/></circle>`;
    g += `<path d="M${ax} ${ay - 31}q3 5 0 8q-3-3 0-8z" fill="#fff4cf"/>`;
  });
  [[38, 112], [70, 120], [100, 120], [130, 120], [162, 112], [64, 102], [136, 102]].forEach(([dx, dy], i) => {
    g += `<line x1="${dx}" y1="${dy}" x2="${dx}" y2="${dy + 8}" stroke="#d9cfbf" stroke-width=".6"/><path d="M${dx} ${dy + 8}l3.4 6-3.4 7-3.4-7z" fill="rgba(255,255,255,.9)" stroke="#cfd8e6" stroke-width=".5"><animate attributeName="opacity" values="1;.5;1" dur="${1.8 + i * .37}s" repeatCount="indefinite"/></path>`;
  });
  $('#chand').innerHTML = g;
})();

/* ================= 3D petals & butterflies ================= */
const Garden3D = (() => {
  if (!window.THREE) return null;
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas: $('#three'), alpha: true, antialias: true }); } catch (e) { return null; }
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));
  renderer.setClearColor(0, 0);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, .1, 60);
  camera.position.z = 8;
  scene.add(new THREE.HemisphereLight(0xfff6ee, 0x9caf86, 1.0));
  const sun = new THREE.DirectionalLight(0xffffff, .7); sun.position.set(3, 5, 6); scene.add(sun);

  // petal texture & curved geometry
  const pc = document.createElement('canvas'); pc.width = 128; pc.height = 160;
  const px = pc.getContext('2d');
  const grad = px.createRadialGradient(64, 130, 4, 64, 80, 90);
  grad.addColorStop(0, '#f6d3cb'); grad.addColorStop(.5, '#fff6f2'); grad.addColorStop(1, '#ffffff');
  px.fillStyle = grad; px.beginPath(); px.moveTo(64, 156); px.bezierCurveTo(-10, 110, 10, 8, 64, 6); px.bezierCurveTo(118, 8, 138, 110, 64, 156); px.fill();
  px.strokeStyle = 'rgba(220,170,160,.35)'; px.lineWidth = 1;
  for (let i = -3; i <= 3; i++) { px.beginPath(); px.moveTo(64, 150); px.quadraticCurveTo(64 + i * 10, 80, 64 + i * 14, 20); px.stroke(); }
  const petalTex = new THREE.CanvasTexture(pc);
  const pg = new THREE.PlaneGeometry(.28, .36, 6, 6);
  const pos = pg.attributes.position;
  for (let i = 0; i < pos.count; i++) { const x = pos.getX(i), y = pos.getY(i); pos.setZ(i, x * x * 3.2 - y * .25 + Math.pow(Math.max(0, y), 2) * 1.5); }
  pg.computeVertexNormals();
  const PN = small ? 70 : 110;
  const petals = new THREE.InstancedMesh(pg, new THREE.MeshLambertMaterial({ map: petalTex, transparent: true, alphaTest: .35, side: THREE.DoubleSide }), PN);
  petals.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  const tints = [0xffffff, 0xfff1ec, 0xffe2dc, 0xfbd2cb, 0xf7f9ee];
  const P = [];
  const d = new THREE.Object3D();
  const bounds = () => { const h = Math.tan(THREE.MathUtils.degToRad(25)) * 8; return { h: h + 1, w: h * camera.aspect + 1 }; };
  for (let i = 0; i < PN; i++) {
    petals.setColorAt(i, new THREE.Color(tints[i % tints.length]));
    P.push({ p: new THREE.Vector3(), v: new THREE.Vector3(), r: new THREE.Euler(rand(0, 6), rand(0, 6), rand(0, 6)), s: new THREE.Vector3(rand(-2, 2), rand(-2, 2), rand(-1, 1)), ph: rand(0, 6), on: false, ambient: i < PN * .35 });
  }
  function spawn(q, fromTop) {
    const b = bounds(); const z = rand(-6, 4), k = (8 - z) / 8;
    q.p.set(rand(-b.w, b.w) * k, fromTop ? b.h * k + rand(0, 3) : -b.h * k, z);
    q.v.set(rand(-.2, .2), fromTop ? rand(-.9, -.5) : rand(3.5, 6.5), 0);
    if (!fromTop) q.v.x = rand(-2, 2);
    q.on = true;
  }
  P.forEach(q => { if (q.ambient) { spawn(q, true); q.p.y = rand(-bounds().h, bounds().h); } });
  petals.frustumCulled = false; scene.add(petals);

  // butterflies
  function wingTexture(c1, c2) {
    const c = document.createElement('canvas'); c.width = 128; c.height = 128; const x = c.getContext('2d');
    const g = x.createLinearGradient(0, 0, 128, 128); g.addColorStop(0, c1); g.addColorStop(1, c2);
    x.fillStyle = g; x.strokeStyle = 'rgba(40,50,35,.6)'; x.lineWidth = 3;
    x.beginPath(); x.moveTo(4, 60); x.bezierCurveTo(30, -10, 130, 0, 118, 40); x.bezierCurveTo(112, 62, 70, 66, 4, 64); x.closePath(); x.fill(); x.stroke();
    x.beginPath(); x.moveTo(4, 66); x.bezierCurveTo(70, 70, 100, 100, 80, 120); x.bezierCurveTo(60, 132, 20, 110, 4, 70); x.closePath(); x.fill(); x.stroke();
    x.fillStyle = 'rgba(255,255,255,.85)';
    [[96, 30, 6], [80, 22, 4], [60, 100, 5]].forEach(([a, b, r]) => { x.beginPath(); x.arc(a, b, r, 0, 7); x.fill(); });
    return new THREE.CanvasTexture(c);
  }
  const flies = [['#a9bccb', '#e7eef3'], ['#f2c6a6', '#fde9da'], ['#c9d6b6', '#ffffff']].map(([a, b], i) => {
    const tex = wingTexture(a, b), mat = new THREE.MeshLambertMaterial({ map: tex, transparent: true, alphaTest: .3, side: THREE.DoubleSide });
    const geo = new THREE.PlaneGeometry(.5, .5); geo.translate(.25, 0, 0);
    const g = new THREE.Group(), L = new THREE.Mesh(geo, mat), Rw = new THREE.Mesh(geo, mat);
    L.scale.x = -1; g.add(L, Rw);
    const body = new THREE.Mesh(new THREE.CylinderGeometry(.018, .012, .3, 6), new THREE.MeshLambertMaterial({ color: 0x3a4630 }));
    body.rotation.x = Math.PI / 2; g.add(body);
    scene.add(g);
    return { g, L, R: Rw, ph: i * 2.1, sp: .18 + i * .04, prev: new THREE.Vector3() };
  });

  function resize() { renderer.setSize(innerWidth, innerHeight, false); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); }
  addEventListener('resize', resize); resize();

  let last = performance.now(), scrollV = 0, lastScroll = scrollY;
  function frame(now) {
    const t = now / 1000, dt = Math.min(.05, (now - last) / 1000); last = now;
    scrollV += ((scrollY - lastScroll) - scrollV) * .1; lastScroll = scrollY;
    const b = bounds();
    P.forEach((q, i) => {
      if (!q.on) { d.scale.setScalar(0); d.updateMatrix(); petals.setMatrixAt(i, d.matrix); return; }
      q.v.y = Math.max(q.v.y - dt * 2.4, -.75); q.v.x *= .99;
      q.p.x += (q.v.x + Math.sin(t * .9 + q.ph) * .35) * dt;
      q.p.y += q.v.y * dt - scrollV * .004;
      q.p.z += Math.cos(t * .6 + q.ph) * .1 * dt;
      q.r.x += q.s.x * dt; q.r.y += q.s.y * dt; q.r.z += q.s.z * dt;
      const k = (8 - q.p.z) / 8;
      if (q.p.y < -b.h * k - 1) { if (q.ambient) spawn(q, true); else q.on = false; }
      d.position.copy(q.p); d.rotation.copy(q.r); d.scale.setScalar(1); d.updateMatrix(); petals.setMatrixAt(i, d.matrix);
    });
    petals.instanceMatrix.needsUpdate = true;

    flies.forEach((f, i) => {
      const s = t * f.sp + f.ph;
      const p = new THREE.Vector3(Math.sin(s * 1.3) * b.w * .8, Math.sin(s * .9 + 1) * b.h * .7 + Math.sin(s * 3.1) * .3, Math.sin(s * .7) * 2.5 - 1);
      f.g.position.copy(p);
      const dir = p.clone().sub(f.prev); f.prev.copy(p);
      if (dir.lengthSq() > 1e-8) f.g.rotation.y = Math.atan2(dir.x, dir.z);
      f.g.rotation.z = Math.sin(s * 2) * .2;
      const flap = Math.sin(t * (13 + i * 2)) * 1.05;
      f.L.rotation.z = -flap * .1; f.L.rotation.y = flap; f.R.rotation.y = -flap;
      f.g.rotation.x = -.5;
    });
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  if (!reduce) requestAnimationFrame(frame);
  return {
    shower(n) { let k = 0; for (const q of P) { if (q.ambient || q.on) continue; spawn(q, true); q.p.y += rand(0, 4); if (++k >= n) break; } },
    burst(n) { let k = 0; for (const q of P) { if (q.ambient || q.on) continue; spawn(q, false); if (++k >= n) break; } }
  };
})();

/* ================= flip clock ================= */
const units = {};
document.querySelectorAll('.digits').forEach(el => {
  const len = +el.dataset.len; units[el.dataset.unit] = [];
  for (let i = 0; i < len; i++) {
    const f = document.createElement('span'); f.className = 'flip'; f.dataset.v = '0';
    f.innerHTML = '<span class="half top"><span>0</span></span><span class="half bottom"><span>0</span></span><span class="leaf"><i class="lf"><span>0</span></i><i class="lb"><span>0</span></i></span>';
    f.addEventListener('animationend', e => {
      if (e.animationName !== 'flipdown') return;
      const v = f.dataset.v; f.querySelector('.bottom span').textContent = v; f.querySelector('.lf span').textContent = v; f.classList.remove('go');
    });
    el.appendChild(f); units[el.dataset.unit].push(f);
  }
});
function setFlip(f, v) {
  if (f.dataset.v === v) return;
  const old = f.dataset.v; f.dataset.v = v;
  f.querySelector('.top span').textContent = v; f.querySelector('.lb span').textContent = v;
  f.querySelector('.lf span').textContent = old; f.querySelector('.bottom span').textContent = old;
  f.classList.remove('go'); void f.offsetWidth; f.classList.add('go');
  if (reduce) { f.querySelector('.bottom span').textContent = v; f.querySelector('.lf span').textContent = v; f.classList.remove('go'); }
}
const target = new Date('2027-05-15T16:00:00+02:00').getTime();
function count() {
  let s = Math.max(0, Math.floor((target - Date.now()) / 1000));
  const vals = { d: Math.floor(s / 86400) }; s %= 86400; vals.h = Math.floor(s / 3600); s %= 3600; vals.m = Math.floor(s / 60); vals.s = s % 60;
  Object.entries(units).forEach(([u, fl]) => { const str = String(vals[u]).padStart(fl.length, '0').slice(-fl.length); fl.forEach((f, i) => setFlip(f, str[i])); });
}
count(); setInterval(count, 1000);

/* ================= scroll reveals ================= */
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .15 });
document.querySelectorAll('.tilt, .day li').forEach(el => io.observe(el));
const day = $('#day'), vine = $('#vinePath');
function growVine() { const b = day.getBoundingClientRect(); const p = Math.min(1, Math.max(0, (innerHeight * .8 - b.top) / b.height)); vine.style.strokeDashoffset = 1 - p; }
addEventListener('scroll', growVine, { passive: true }); growVine();

/* venue card: 3D tilt with a moving glare */
const venue = document.querySelector('.venue');
venue.addEventListener('pointermove', e => {
  const r = venue.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
  venue.style.transform = `rotateY(${(x - .5) * 12}deg) rotateX(${(.5 - y) * 10}deg)`;
  venue.style.setProperty('--gx', x * 100 + '%'); venue.style.setProperty('--gy', y * 100 + '%');
});
venue.addEventListener('pointerleave', () => venue.style.transform = '');

/* ================= RSVP ================= */
$('#form').addEventListener('submit', e => {
  e.preventDefault();
  const name = $('#f-name').value.trim();
  if (!name) { $('#err').textContent = 'Please add your name so we know who is replying.'; $('#f-name').focus(); return; }
  $('#err').textContent = '';
  const yes = $('#f-yes').checked, first = name.split(' ')[0];
  $('#thanks-msg').textContent = yes ? `${first}, we’re so happy you’re coming. See you in the garden!` : `We’ll miss you, ${first}. Thank you for letting us know.`;
  $('#rsvp').classList.add('done');
  // NOTE: connect a form backend here to collect replies.
  if (yes && Garden3D) Garden3D.burst(70);
});
})();
