/* Our Story — a 3D book you can open and turn page by page.
   Leaves rotate around the spine (CSS 3D). Drag, tap, swipe or use the arrow keys. */
(() => {
'use strict';
const $ = s => document.querySelector(s);
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/* ================= music: a gentle ballad in D ================= */
const prog = [[50,[62,66,69]],[47,[62,66,71]],[43,[62,67,71]],[45,[61,64,69]]];
const mel = [78,0,76,74,0,0,76,0, 74,0,71,0,0,0,69,0, 71,0,74,0,79,0,78,76, 76,0,0,0,73,0,0,0];
const piano = [[1,1,1],[2,.35,.6],[3,.12,.35],[4.01,.06,.2]];
const music = createMusic({ spb: .3, reverb: .4, play(step, t, tone) {
  const bar = Math.floor(step / 8) % 4, s = step % 8, [bass, ch] = prog[bar];
  if (s === 0) tone(bass - 12, t, { type: 'triangle', dur: 2.4, vol: .1, partials: [[1,1,1],[2,.3,.5]] });
  if (s % 2 === 1) tone(ch[(s >> 1) % 3], t, { dur: 1.3, vol: .035, partials: piano });
  const m = mel[step % 32]; if (m) tone(m, t, { dur: 2, vol: .07, partials: piano });
}});
const musicBtn = $('#music');
musicBtn.addEventListener('click', () => { const on = music.toggle(); musicBtn.classList.toggle('off', !on); musicBtn.setAttribute('aria-label', on ? 'Pause music' : 'Play music'); });

/* ================= page-turn sound (filtered noise) ================= */
let actx;
function rustle(strength = 1) {
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    const len = actx.sampleRate * .45, buf = actx.createBuffer(1, len, actx.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) { const k = i / len; d[i] = (Math.random() * 2 - 1) * Math.pow(Math.sin(Math.PI * Math.min(1, k * 1.6)), 2) * (1 - k); }
    const src = actx.createBufferSource(); src.buffer = buf;
    const bp = actx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2200; bp.Q.value = .6;
    const g = actx.createGain(); g.gain.value = .22 * strength;
    src.connect(bp); bp.connect(g); g.connect(actx.destination); src.start();
  } catch (e) {}
}

/* ================= build the book ================= */
const book = $('#book'), tilt = $('#tilt');
const T = id => document.getElementById(id).content.cloneNode(true);
const contentPages = [...document.querySelectorAll('template.pg')];
let leaves = [], cur = 0, N = 0, portrait = null, PW = 360, PH = 500, busy = false;

function faceList() {
  const faces = [{ node: () => T('t-cover'), title: 'Cover' }];
  if (portrait) {
    faces.push({ node: () => T('t-endpaper'), title: 'Endpaper' });
    contentPages.forEach((p, i) => {
      faces.push({ node: () => p.content.cloneNode(true), title: p.dataset.title, content: i });
      faces.push({ node: () => T('t-pattern'), title: '' });
    });
    faces[faces.length - 1] = { node: () => T('t-back'), title: 'The end' };
  } else {
    faces.push({ node: () => T('t-endpaper'), title: 'Endpaper' });
    contentPages.forEach((p, i) => faces.push({ node: () => p.content.cloneNode(true), title: p.dataset.title, content: i }));
    if (faces.length % 2 === 1) faces.push({ node: () => T('t-pattern'), title: '' });
    faces.push({ node: () => T('t-pattern'), title: '' }, { node: () => T('t-back'), title: 'The end' });
  }
  return faces;
}

function measure() {
  const vw = innerWidth, vh = innerHeight;
  portrait = vw < vh * .95;
  const maxH = vh * (portrait ? .7 : .78);
  if (portrait) { PW = Math.min(vw * .84, 460, maxH / 1.42); }
  else { PW = Math.min(vw * .44, 520, maxH / 1.42); }
  PH = PW * 1.42;
  book.style.setProperty('--pw', PW + 'px'); book.style.setProperty('--ph', PH + 'px');
}

let faces = [];
function build(keepContent) {
  const was = portrait;
  measure();
  if (was === portrait && leaves.length) { layout(); return; }
  // remember which content page was showing so we can return to it
  const visibleContent = keepContent ? currentContent() : null;
  book.innerHTML = '';
  faces = faceList();
  leaves = [];
  for (let i = 0; i < faces.length; i += 2) {
    const leaf = document.createElement('div'); leaf.className = 'leaf';
    const f = document.createElement('div'); f.className = 'face front'; f.appendChild(faces[i].node());
    const b = document.createElement('div'); b.className = 'face back'; b.appendChild(faces[i + 1].node());
    leaf.append(f, b); book.appendChild(leaf); leaves.push(leaf);
  }
  N = leaves.length;
  if (visibleContent != null) {
    const idx = faces.findIndex(f => f.content === visibleContent);
    cur = clamp(portrait ? Math.floor(idx / 2) : Math.ceil(idx / 2), 0, N);
  }
  wireForms(); countdown();
  layout();
}

function currentContent() {
  const ids = [cur * 2 - 1, cur * 2].filter(i => i >= 0 && i < faces.length).map(i => faces[i].content).filter(v => v != null);
  return ids.length ? ids[0] : null;
}

function leafTransform(i, angle) {
  const leaf = leaves[i];
  const a = -angle * Math.PI / 180;          // 0..π
  const lift = Math.sin(a) * PW * .12;
  const z = angle > -90 ? (N - i) * .6 : -(i + 1) * .6;
  leaf.style.transform = `translateZ(${lift}px) rotateY(${angle}deg) translateZ(${z}px)`;
  const shade = Math.sin(a);
  leaf.style.setProperty('--shade', shade.toFixed(3));
  leaf.style.zIndex = angle > -90 ? N - i : i + 1;
}

function layout() {
  leaves.forEach((_, i) => leafTransform(i, i < cur ? -180 : 0));
  let shift;
  if (cur === 0) shift = -PW / 2;
  else if (cur === N) shift = PW / 2;
  else shift = portrait ? -PW / 2 : 0;
  book.style.setProperty('--shift', shift + 'px');
  book.classList.toggle('is-open', cur > 0 && cur < N);
  book.classList.toggle('at-end', cur === N);
  updatePager();
}

function updatePager() {
  const left = faces[cur * 2 - 1], right = faces[cur * 2];
  const label = (portrait ? right : (right && right.title ? right : left)) || left;
  $('#where').textContent = cur === 0 ? 'Cover' : cur === N ? 'The end' : (label && label.title) || (left && left.title) || '';
  $('#prev').disabled = cur === 0; $('#next').disabled = cur === N;
}

/* ================= turning ================= */
function animateLeaf(i, from, to, ms) {
  return new Promise(res => {
    if (reduce) { leafTransform(i, to); return res(); }
    const t0 = performance.now();
    (function step(now) {
      const k = clamp((now - t0) / ms, 0, 1), e = k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      leafTransform(i, from + (to - from) * e);
      k < 1 ? requestAnimationFrame(step) : res();
    })(t0);
  });
}
async function next() {
  if (busy || cur >= N) return; busy = true; rustle();
  const i = cur; cur++;
  setShift(); await animateLeaf(i, 0, -180, 1000); busy = false; layout();
}
async function prev() {
  if (busy || cur <= 0) return; busy = true; rustle(.8);
  cur--; const i = cur;
  setShift(); await animateLeaf(i, -180, 0, 1000); busy = false; layout();
}
function setShift() {
  let shift;
  if (cur === 0) shift = -PW / 2; else if (cur === N) shift = PW / 2; else shift = portrait ? -PW / 2 : 0;
  book.style.setProperty('--shift', shift + 'px');
  book.classList.toggle('is-open', cur > 0 && cur < N);
  book.classList.toggle('at-end', cur === N);
  updatePager();
}

/* drag to turn */
let drag = null;
const interactive = 'input, select, textarea, button, a, label';
book.addEventListener('pointerdown', e => {
  if (busy || !document.body.classList.contains('opened') || e.target.closest(interactive)) return;
  drag = { x0: e.clientX, y0: e.clientY, dir: 0, leaf: -1, angle: 0, moved: false };
  book.setPointerCapture(e.pointerId);
});
book.addEventListener('pointermove', e => {
  if (!drag) return;
  const dx = e.clientX - drag.x0;
  if (!drag.dir) {
    if (Math.abs(dx) < 8) return;
    drag.moved = true;
    if (dx < 0 && cur < N) { drag.dir = 1; drag.leaf = cur; }
    else if (dx > 0 && cur > 0) { drag.dir = -1; drag.leaf = cur - 1; }
    else { drag = null; return; }
    leaves[drag.leaf].classList.add('dragging');
  }
  const p = clamp(Math.abs(dx) / (PW * 1.1), 0, 1);
  drag.angle = drag.dir === 1 ? -180 * p : -180 + 180 * p;
  leafTransform(drag.leaf, drag.angle);
});
book.addEventListener('pointerup', async e => {
  if (!drag) return;
  const d = drag; drag = null;
  if (!d.moved) { // a tap: left part goes back, right part goes forward
    const r = book.getBoundingClientRect(), spineX = r.left + r.width / 2;
    if (portrait) (e.clientX < innerWidth * .3 ? prev : next)(); else (e.clientX < spineX ? prev : next)();
    return;
  }
  leaves[d.leaf].classList.remove('dragging');
  busy = true;
  const done = d.dir === 1 ? d.angle < -60 : d.angle > -120;
  if (d.dir === 1) {
    if (done) { cur++; rustle(.7); setShift(); await animateLeaf(d.leaf, d.angle, -180, 500); }
    else await animateLeaf(d.leaf, d.angle, 0, 400);
  } else {
    if (done) { cur--; rustle(.6); setShift(); await animateLeaf(d.leaf, d.angle, 0, 500); }
    else await animateLeaf(d.leaf, d.angle, -180, 400);
  }
  busy = false; layout();
});
book.addEventListener('pointercancel', () => { if (drag && drag.leaf >= 0) { leaves[drag.leaf].classList.remove('dragging'); } drag = null; layout(); });

$('#next').addEventListener('click', next);
$('#prev').addEventListener('click', prev);
addEventListener('keydown', e => {
  if (e.target.closest && e.target.closest('input, select, textarea')) return;
  if (!document.body.classList.contains('opened')) return;
  if (e.key === 'ArrowRight' || e.key === 'PageDown') next();
  if (e.key === 'ArrowLeft' || e.key === 'PageUp') prev();
});

/* subtle 3D tilt following the pointer */
addEventListener('pointermove', e => {
  if (drag || !document.body.classList.contains('opened')) return;
  const x = e.clientX / innerWidth - .5, y = e.clientY / innerHeight - .5;
  tilt.style.transform = `rotateX(${8 - y * 8}deg) rotateY(${x * 10}deg)`;
}, { passive: true });

/* ================= opening ================= */
$('#openBtn').addEventListener('click', async () => {
  music.start(); musicBtn.hidden = false; musicBtn.classList.remove('off'); musicBtn.setAttribute('aria-label', 'Pause music');
  document.body.classList.add('opened');
  book.classList.remove('resting');
  tilt.style.transform = 'rotateX(8deg)';
  await new Promise(r => setTimeout(r, reduce ? 0 : 1100));
  next();
});

/* ================= live bits inside pages ================= */
const target = new Date('2027-10-02T15:00:00+01:00').getTime(), pad = (n, l = 2) => String(n).padStart(l, '0');
function countdown() {
  let s = Math.max(0, Math.floor((target - Date.now()) / 1000));
  const d = Math.floor(s / 86400); s %= 86400; const h = Math.floor(s / 3600); s %= 3600; const m = Math.floor(s / 60); s %= 60;
  const set = (c, v) => book.querySelectorAll(c).forEach(el => el.textContent = v);
  set('.cd-d', pad(d, 3)); set('.cd-h', pad(h)); set('.cd-m', pad(m)); set('.cd-s', pad(s));
}
setInterval(countdown, 1000);

function wireForms() {
  book.querySelectorAll('form.rsvp').forEach(form => {
    form.addEventListener('submit', e => {
      e.preventDefault();
      const page = form.closest('.rsvp-page'), name = form.elements.name.value.trim(), err = form.querySelector('.err');
      if (!name) { err.textContent = 'Please write your name first.'; form.elements.name.focus(); return; }
      err.textContent = '';
      const yes = form.elements.att.value === 'yes', first = name.split(' ')[0];
      page.querySelector('.thanks-msg').textContent = yes
        ? `${first}, your reply is sealed. We can’t wait to see you in October.`
        : `We’ll miss you, ${first}. Thank you for letting us know.`;
      page.classList.add('done');
      // NOTE: connect a form backend here to collect replies.
    });
  });
}

/* ================= candle-light motes ================= */
(() => {
  const c = $('#motes'), x = c.getContext('2d'); let w, h, r, P = [];
  function size() { r = Math.min(devicePixelRatio || 1, 2); w = c.width = innerWidth * r; h = c.height = innerHeight * r;
    P = Array.from({ length: 60 }, () => ({ x: Math.random() * w, y: Math.random() * h, s: (Math.random() * 2 + .6) * r, v: (Math.random() * .15 + .05) * r, p: Math.random() * 6 })); }
  size(); addEventListener('resize', size);
  (function loop(t) {
    x.clearRect(0, 0, w, h);
    P.forEach(m => {
      m.y -= m.v; m.x += Math.sin(t / 3000 + m.p) * .15 * r; if (m.y < -10) { m.y = h + 10; m.x = Math.random() * w; }
      const a = .25 + .25 * Math.sin(t / 900 + m.p * 3);
      const g = x.createRadialGradient(m.x, m.y, 0, m.x, m.y, m.s * 3);
      g.addColorStop(0, `rgba(255,214,150,${a})`); g.addColorStop(1, 'rgba(255,214,150,0)');
      x.fillStyle = g; x.beginPath(); x.arc(m.x, m.y, m.s * 3, 0, 7); x.fill();
    });
    if (!reduce) requestAnimationFrame(loop);
  })(0);
})();

/* ================= boot ================= */
build(false);
let rT;
addEventListener('resize', () => { clearTimeout(rT); rT = setTimeout(() => build(true), 150); });
})();
